import Anthropic from '@anthropic-ai/sdk'

export const API_KEY_STORAGE = 'qod_anthropic_key'

export function getSavedApiKey() {
  return localStorage.getItem(API_KEY_STORAGE) || ''
}

export function saveApiKey(key) {
  localStorage.setItem(API_KEY_STORAGE, key)
}

export async function parseScheduleText(text, apiKey) {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system: `You are a sports schedule parser. Extract game events from the provided text and return a valid JSON array only — no markdown, no explanation, just the JSON array.

Each game object must have these fields:
- name: string (e.g. "NBA — ATL vs BOS")
- league: string (e.g. "NBA", "NFL", "NHL", "MLB", "MLS")
- season: string (e.g. "2025-2026")
- homeTeam: { name: string, abbreviation: string (2-4 chars), primaryColor: string (hex, default "#000000") }
- awayTeam: { name: string, abbreviation: string (2-4 chars), primaryColor: string (hex, default "#000000") }
- startTime: string (ISO 8601, infer timezone from city if possible, default to "T19:30:00.000Z" if time unknown)

Use standard team abbreviations (ATL, BOS, LAL, GSW, etc.). Infer the season from the dates. If a game is a home game for the team whose schedule was provided, set them as homeTeam — otherwise make a best guess based on context clues like "vs" vs "@" (@ means away).`,
    messages: [{ role: 'user', content: text }],
  })

  const raw = response.content[0].text.trim()
  // Strip markdown code fences if model wraps output
  const clean = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  return JSON.parse(clean)
}
