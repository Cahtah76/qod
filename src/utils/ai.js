import { api } from './api.js'

export async function parseScheduleText(text) {
  return api.post('/api/ai/parse-schedule', { text })
}

export async function parseStandupNotes(notes, project) {
  return api.post('/api/ai/parse-standup', { notes, project })
}

export async function generateProjectSummary(project) {
  return api.post('/api/ai/project-summary', { project })
}
