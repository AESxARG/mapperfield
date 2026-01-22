import fs from 'fs'

export class GraphStore {
  constructor() {
    this.concepts = new Set()
    this.adj = new Map()   
    this.revAdj = new Map()
    this.edges = new Map()
    this.loopRegistry = new Map()
    this.metaConstructs = new Set()
    this.MOTIF_THRESHOLD = 3
    this.activeNodes = new Set()
    this.loadState()
  }

  execute(command) {
    if (command.startsWith('ADD CONCEPT')) {
      const label = this.extract(command)
      if (label) {
        this.concepts.add(label)
        this.activeNodes.add(label)
      }
    } else if (command.startsWith('ADD CONSTRUCT')) {
      const { from, to, reason } = this.extractConstruct(command)
      if (from && to) {
        this.activeNodes.add(from)
        this.activeNodes.add(to)
        return this.addOrReinforceEdge(from, to, reason)
      }
    } else if (command.startsWith('DELETE CONCEPT')) {
      const label = this.extract(command)
      if (label) {
        this.concepts.delete(label)
        this.activeNodes.delete(label)
        this.adj.delete(label)
        this.revAdj.delete(label)
        for (const [node, neighbors] of this.adj) {
          if (neighbors.has(label)) neighbors.delete(label)
        }
        this.cleanupMotifs(label)
      }
    } else if (command.startsWith('DELETE CONSTRUCT')) {
      const { from, to } = this.extractConstruct(command)
      if (from && to) {
        if (this.adj.has(from)) this.adj.get(from).delete(to)
        if (this.revAdj.has(to)) this.revAdj.get(to).delete(from)
        this.edges.delete(`${from}|${to}`)
        this.activeNodes.add(from)
        this.activeNodes.add(to)
      }
    } else if (command === 'SHOW GRAPH') {
      for (const c of this.concepts) {
        this.activeNodes.add(c)
      }
    }
    return null
  }

  cleanupMotifs(deletedNode) {
    for (const loopId of this.metaConstructs) {
      if (loopId.includes(deletedNode)) this.metaConstructs.delete(loopId);
    }
  }

  clearActiveNodes() { this.activeNodes.clear(); }

  addOrReinforceEdge(u, v, reason) {
    this.concepts.add(u); this.concepts.add(v)
    if (!this.adj.has(u)) this.adj.set(u, new Set())
    if (!this.revAdj.has(v)) this.revAdj.set(v, new Set())
    this.adj.get(u).add(v)
    this.revAdj.get(v).add(u)
    this.edges.set(`${u}|${v}`, reason)
    const successorsOfV = this.adj.get(v) || new Set()
    const predecessorsOfU = this.revAdj.get(u) || new Set()
    for (const w of successorsOfV) {
      if (predecessorsOfU.has(w)) {
        const loopId = [u, v, w].sort().join('|')
        return this.incrementLoop(loopId, u, v, w)
      }
    }
    return null
  }

  incrementLoop(loopId, a, b, c) {
    const current = this.loopRegistry.get(loopId) || 0
    const next = current + 1
    this.loopRegistry.set(loopId, next)
    if (next >= this.MOTIF_THRESHOLD) {
      this.metaConstructs.add(loopId)
      return { type: 'motif', nodes: [a, b, c], strength: next }
    }
    return null
  }

  getView() {
    if (this.activeNodes.size === 0) return ``
    let output = []
    const width = 60
    output.push(`\n╔═ [ ACTIVE CONTEXT ] ══════════════════════════════╗`)
    const visited = new Set()
    for (const node of this.activeNodes) {
      if (visited.has(node)) continue
      const children = this.adj.get(node)
      if (children && children.size > 0) {
        output.push(`║  [${node}]`)
        let i = 0
        for (const child of children) {
          if (!this.activeNodes.has(child)) continue
          const isLast = i === children.size - 1
          const connector = isLast ? `└──` : `├──`
          const subConnector = isLast ? `   ` : `│  `
          output.push(`║   ${connector}► [${child}]`)
          const reason = this.edges.get(`${node}|${child}`) || ``
          const wrapped = this.wrapText(reason, width)
          wrapped.forEach(line => { output.push(`║   ${subConnector}    ${line}`) })
          output.push(`║   ${subConnector}`)
          i++
        }
        visited.add(node)
      }
    }
    output.push(`╠═══════════════════════════════════════════════════╣`)
    let hasMeta = false
    for (const loopId of this.metaConstructs) {
      const [a, b, c] = loopId.split('|')
      if (this.activeNodes.has(a) || this.activeNodes.has(b) || this.activeNodes.has(c)) {
        if (!hasMeta) {
          output.push(`║  ♦ META-CONSTRUCT LAYER (Stable Loops)            ║`)
          hasMeta = true
        }
        output.push(`║      ${a}`)
        output.push(`║     ↙    ↖`)
        output.push(`║   ${b} ──► ${c}`)
        output.push(`║`)
      }
    }
    if (!hasMeta) output.push(`║   No meta-constructs found`)
    output.push(`╚═══════════════════════════════════════════════════╝`)
    return output.join(`\n`)
  }

  wrapText(text, maxWidth) {
    if (!text) return []
    const cleanText = text.replace(/(\r\n|\n|\r)/gm, ` `)
    const words = cleanText.split(` `)
    let lines = [], currentLine = words[0]
    for (let i = 1; i < words.length; i++) {
      if (currentLine.length + 1 + words[i].length <= maxWidth) {
        currentLine += ` ` + words[i]
      } else {
        lines.push(currentLine)
        currentLine = words[i]
      }
    }
    lines.push(currentLine)
    return lines
  }

  getSummary() { 
    const cList = [...this.concepts].join(', ')
    const eList = [...this.edges.entries()].map(([k, reason]) => {
      const [u, v] = k.split('|')
      return `FROM "${u}" TO "${v}" REASON "${reason}"`
    }).join('\n')
    const mList = [...this.metaConstructs].join(', ')
    return `
    [FULL GRAPH MEMORY]
    Concepts: ${cList}
    Constructs:
    ${eList}
    Meta-Constructs: ${mList}
    `
  }
  
  extract(cmd) { return cmd.match(/"([^"]+)"/)?.[1] }

  extractConstruct(cmd) {
    const match = cmd.match(/FROM "([^"]+)" TO "([^"]+)"(?: REASON "([^"]*)")?/)
    return match ? { from: match[1], to: match[2], reason: match[3] } : {}
  }

  saveState() {
    const data = {
      concepts: [...this.concepts],
      edges: [...this.edges],
      metaConstructs: [...this.metaConstructs]
    };
    fs.writeFileSync('mindmap.json', JSON.stringify(data, null, 2))
  }

  loadState() {
    if (fs.existsSync('mindmap.json')) {
      const data = JSON.parse(fs.readFileSync('mindmap.json'))
      this.concepts = new Set(data.concepts)
      this.edges = new Map(data.edges)
      this.metaConstructs = new Set(data.metaConstructs)
      for (const [key, _] of this.edges) {
        const [u, v] = key.split('|')
        if (!this.adj.has(u)) this.adj.set(u, new Set())
        if (!this.revAdj.has(v)) this.revAdj.set(v, new Set())
        this.adj.get(u).add(v)
        this.revAdj.get(v).add(u)
      }
    }
  }
}