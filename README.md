# GAME 002: Mapperfield : Exploring Knowledge Motifs

## Storage and Memory

* Auto-saves conversations with Mapperfield under `conversations/`
* Auto-saves graph of concepts and constructs as `mindmap.json`
* Auto-saves recent conversations for context as `history.json`

## Interaction Examples

| **Goal** | **What You Say** | **What Mapperfield Executes** |
| :--- | :--- | :--- |
| **Create a Concept** | "Let's talk about **Entropy**."<br>"Add **Time** to the map." | `ADD CONCEPT "Entropy"`<br>`ADD CONCEPT "Time"` |
| **Connect Concepts** | "Time implies Entropy because..."<br>"Connect Time to Entropy." | `ADD CONSTRUCT FROM "Time" TO "Entropy" REASON "..."` |
| **Delete a Concept** | "Remove **Entropy**, it doesn't fit."<br>"Delete **Time**." | `DELETE CONCEPT "Entropy"`<br>`DELETE CONCEPT "Time"` |
| **Delete a Link** | "Disconnect Time from Entropy."<br>"That connection is wrong, remove it." | `DELETE CONSTRUCT FROM "Time" TO "Entropy"` |
| **Reinforce** | "I really think Time leads to Entropy."<br>*(Repeating a connection strengthens the motif)* | `ADD CONSTRUCT...` (Repeatedly)<br>*(Triggers Motif Alert at 3 hits)* |
| **Visuals** | "Show me the graph."<br>"Visualize the map." | `SHOW GRAPH` |
| **System** | `exit` | *(Saves `mindmap.json` and quits)* |

## Conversation Output Example 1

```
--- MAPPERFIELD IS ONLINE ---

> I've been thinking about how Creativity is actually a tension between Constraint and Freedom...

... formulating ...

╔═ [ ACTIVE CONTEXT ] ══════════════════════════════╗
║  [Creativity]
║   ├──► [Constraint]
║   │      Creativity involves tension with constraint
║   │  
║   └──► [Freedom]
║          Creativity involves tension with freedom
║      
║  [Constraint]
║   └──► [Freedom]
║          Creativity is a tension between constraint and freedom
║      
╠═══════════════════════════════════════════════════╣
║   No meta-constructs found
╚═══════════════════════════════════════════════════╝

[MAPPERFIELD]:
That's a fascinating insight! Creativity as a tension between constraint and
freedom suggests a dynamic interplay that could relate to concepts like emergent
complexity or cybernetic feedback. How do you see this tension manifesting in
your work or interests?
```

## Conversation Output Example 2

```
--- MAPPERFIELD IS ONLINE ---

[SYSTEM] Restored context from previous session (4 messages).
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

> I think Logic creates Structure because structure requires rules.

... formulating ...

╔═ [ ACTIVE CONTEXT ] ══════════════════════════════╗
║  [Logic]
║   └──► [Structure]
║           "Logic provides the foundational axioms 
║           required to build any stable structure. 
║           Without the rules of logic, structure 
║           collapses into chaos."
║   
║  [Structure]
║   └──► [Rules]
║           "Structure implies a set of constraints,
║           which are functionally equivalent to rules."
║   
╠═══════════════════════════════════════════════════╣
║  ♦ META-CONSTRUCT LAYER (Stable Loops)            ║
║      Logic
║     ↙    ↖
║   Rules ──► Structure
║
╚═══════════════════════════════════════════════════╝

[MAPPERFIELD]:
That is a poignant observation. I've connected them. Notice how this closes the
loop with Rules? It seems your definition of "structure" implies a rigid set of
axioms.
```