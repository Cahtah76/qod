import { api } from './api.js'

export async function parseScheduleText(text) {
  return api.post('/api/ai/parse-schedule', { text })
}
