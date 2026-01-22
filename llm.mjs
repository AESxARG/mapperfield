import { SYSTEM_PROMPT } from './prompt.mjs'

const CONFIG = {
  apiKey: process.env.API_KEY,
  apiHost: process.env.API_HOST || 'https://api.openai.com/v1',
  model: process.env.API_MODEL || 'gpt-4o'
}

export async function chat(userMessage, history) {
  if (!CONFIG.apiKey) return { commands: [], response: `ERROR: API_KEY is missing in .env` }
  const safeSystemPrompt = `${SYSTEM_PROMPT}\n\nIMPORTANT: You must respond in JSON format.`
  const messages = [
    { role: 'system', content: safeSystemPrompt }, ...history,
    { role: 'user', content: userMessage }
  ]
  try {
    const url = `${CONFIG.apiHost.replace(/\/$/, '')}/chat/completions`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.apiKey}`
      },
      body: JSON.stringify({
        model: CONFIG.model,
        messages: messages,
        response_format: { type: `json_object` },
        temperature: 0.7
      })
    })
    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`API Error (${response.status}): ${errText}`)
    }
    const data = await response.json()
    if (!data.choices || !data.choices.length) throw new Error(`API returned empty choices.`)
    const content = data.choices[0].message.content
    try {
      return JSON.parse(content)
    } catch (e) {
      const cleaned = content.replace(/```json/g, '').replace(/```/g, '')
      return JSON.parse(cleaned)
    }
  } catch (error) {
    console.error(`\n[LLM Error]: ${error.message}`)
    return { commands: [], response: `I seem to have lost my connection.` }
  }
}