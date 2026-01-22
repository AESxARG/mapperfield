import 'dotenv/config'
import readline from 'readline'
import fs from 'fs'
import path from 'path'
import { chat } from './llm.mjs'
import { GraphStore } from './store.mjs'

const store = new GraphStore()
let history = loadHistory()

const LOG_DIR = './conversations'
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true })

function loadHistory() {
  try {
    if (fs.existsSync('history.json')) {
      const data = fs.readFileSync('history.json', 'utf-8')
      return JSON.parse(data)
    }
  } catch (e) {
    console.error("Failed to load history:", e.message)
  }
  return []
}

function saveHistory(hist) {
  try {
    const trimmed = hist.slice(-10) 
    fs.writeFileSync('history.json', JSON.stringify(trimmed, null, 2))
  } catch (e) {
    console.error("Failed to save history:", e.message)
  }
}

function wrapResponse(text, maxWidth = 80) {
  if (!text) return ""
  const paragraphs = text.split('\n')
  return paragraphs.map(para => {
    if (!para.trim()) return ''
    const words = para.split(' ')
    let lines = []
    let currentLine = words[0]
    for (let i = 1; i < words.length; i++) {
      if (currentLine.length + 1 + words[i].length <= maxWidth) {
        currentLine += ' ' + words[i]
      } else {
        lines.push(currentLine)
        currentLine = words[i]
      }
    }
    lines.push(currentLine)
    return lines.join('\n')
  }).join('\n')
}

function log(content, type = 'SYSTEM') {
  if (type !== 'USER_INPUT_ECHO') console.log(content)
  const timestamp = new Date().toLocaleTimeString()
  const dateStr = new Date().toISOString().split('T')[0]
  const filePath = path.join(LOG_DIR, `${dateStr}.txt`)
  const fileEntry = `[${timestamp}] ${content}\n`
  try {
    fs.appendFileSync(filePath, fileEntry)
  } catch (err) {
    console.error("Logging failed:", err.message)
  }
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
console.log(`\n--- MAPPERFIELD IS ONLINE ---\n`)
if (history.length > 0) {
  console.log(`[SYSTEM] Restored context from previous session (${history.length} messages).`)
  log(`--- SESSION RESUMED ---`, 'SYSTEM')
} else {
  log(`--- SESSION START ---`, 'SYSTEM')
}

function ask() {
  rl.question(`${'~'.repeat(80)}\n\n> `, async (input) => {
    if (input.toLowerCase() === 'exit') { 
      log(`[USER EXITED]`, 'SYSTEM')
      rl.close()
      return 
    }
    log(`[USER]: ${input}`, 'USER_INPUT_ECHO')
    store.clearActiveNodes()
    const contextInput = `
      [GRAPH STATE]: ${store.getSummary()}
      [USER]: ${input}`
    process.stdout.write(`\n... formulating ...\n\r`)
    const result = await chat(contextInput, history)
    history.push({ role: 'user', content: input })
    history.push({ role: 'assistant', content: JSON.stringify(result) })
    saveHistory(history)
    let motifAlert = null
    if (result.commands && result.commands.length > 0) {
      result.commands.forEach(cmd => {
        const alert = store.execute(cmd)
        if (alert && alert.type === 'motif') motifAlert = alert
      })
    }
    const graph = store.getView()
    if (graph) log(graph, 'GRAPH')
    const formattedResponse = wrapResponse(result.response, 80)
    log(`\n[MAPPERFIELD]:\n${formattedResponse}`, 'RESPONSE')
    if (motifAlert) {
      const alertMsg = `\n*** MOTIF ALERT: ${motifAlert.nodes.join('-')} (Strength: ${motifAlert.strength}) ***`
      log(alertMsg, 'ALERT')
    }
    store.saveState()
    ask()
  })
}

ask()