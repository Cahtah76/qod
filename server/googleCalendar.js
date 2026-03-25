import { google } from 'googleapis'
import { db, q } from './db.js'

// ── Config helpers ────────────────────────────────────────────────────────────

function getCfg(key) {
  const row = db.prepare('SELECT value FROM config WHERE key = ?').get(key)
  return row ? JSON.parse(row.value) : null
}

function setCfg(key, value) {
  db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)').run(key, JSON.stringify(value))
}

function delCfg(key) {
  db.prepare('DELETE FROM config WHERE key = ?').run(key)
}

// ── OAuth client ──────────────────────────────────────────────────────────────

function makeOAuth2() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/google/callback'
  )
}

function getAuthedClient() {
  const tokens = getCfg('google_tokens')
  if (!tokens) return null
  const auth = makeOAuth2()
  auth.setCredentials(tokens)
  // Persist refreshed tokens automatically
  auth.on('tokens', (fresh) => {
    setCfg('google_tokens', { ...tokens, ...fresh })
  })
  return auth
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getAuthUrl() {
  return makeOAuth2().generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
    prompt: 'consent', // Always request refresh token
  })
}

export async function handleCallback(code) {
  const auth = makeOAuth2()
  const { tokens } = await auth.getToken(code)
  setCfg('google_tokens', tokens)

  // Store the connected account's email for display
  auth.setCredentials(tokens)
  const { data } = await google.oauth2({ version: 'v2', auth }).userinfo.get()
  setCfg('google_email', data.email)

  return data.email
}

export function disconnect() {
  delCfg('google_tokens')
  delCfg('google_email')
  delCfg('google_calendar_id')
}

const DEFAULT_SETTINGS = {
  createSetDay: true,
  createGameTime: true,
  createRemoteCall: true,
  remoteCallDurationMins: 300,  // 5 hours
  createFieldCall: true,
  fieldCallDurationMins: 480,   // 8 hours
  sendInvites: true,
}

export function getStatus() {
  return {
    connected: !!getCfg('google_tokens'),
    email: getCfg('google_email'),
    calendarId: getCfg('google_calendar_id') || 'primary',
    settings: { ...DEFAULT_SETTINGS, ...(getCfg('google_settings') || {}) },
  }
}

export function saveSettings({ calendarId, settings }) {
  setCfg('google_calendar_id', calendarId)
  setCfg('google_settings', settings)
}

export async function listCalendars() {
  const auth = getAuthedClient()
  if (!auth) return []
  const cal = google.calendar({ version: 'v3', auth })
  const { data } = await cal.calendarList.list({ minAccessRole: 'writer' })
  return (data.items || []).map((c) => ({ id: c.id, name: c.summary, primary: !!c.primary }))
}

// ── Calendar sync ─────────────────────────────────────────────────────────────

export async function syncEvent(appEvent) {
  const auth = getAuthedClient()
  if (!auth) return

  const settings = { ...DEFAULT_SETTINGS, ...(getCfg('google_settings') || {}) }
  const calendarId = getCfg('google_calendar_id') || 'primary'
  const cal = google.calendar({ version: 'v3', auth })

  const employees = q.getAll('employees')
  const venue = appEvent.venueId ? q.get('venues', appEvent.venueId) : null
  const location = venue ? `${venue.name}, ${venue.city}` : ''
  const title = appEvent.name || `${appEvent.homeTeam?.abbreviation} vs ${appEvent.awayTeam?.abbreviation}`
  const googleEventIds = appEvent.googleEventIds || {}

  function attendeesFor(ids) {
    if (!settings.sendInvites || !ids?.length) return []
    return ids
      .map((id) => employees.find((e) => e.id === id))
      .filter(Boolean)
      .map((e) => ({ email: e.email, displayName: e.name }))
  }

  const onsiteAttendees = attendeesFor(appEvent.crew?.onsiteOperators)
  const remoteAttendees = attendeesFor(
    appEvent.crew?.remoteOperator ? [appEvent.crew.remoteOperator] : []
  )
  const allAttendees = [
    ...new Map([...onsiteAttendees, ...remoteAttendees].map((a) => [a.email, a])).values(),
  ]

  const sendUpdates = settings.sendInvites ? 'all' : 'none'

  async function upsertCalEvent(existingId, body) {
    if (existingId) {
      try {
        const { data } = await cal.events.update({
          calendarId,
          eventId: existingId,
          requestBody: body,
          sendUpdates,
        })
        return data.id
      } catch (err) {
        // Event was deleted from Google side — recreate it
        if (err.code === 404 || err.code === 410) {
          const { data } = await cal.events.insert({ calendarId, requestBody: body, sendUpdates })
          return data.id
        }
        throw err
      }
    }
    const { data } = await cal.events.insert({ calendarId, requestBody: body, sendUpdates })
    return data.id
  }

  const updates = {}

  // Set Day — all-day event N days before the game
  if (settings.createSetDay && appEvent.startTime && appEvent.hasSetDay !== false) {
    const gameDate = new Date(appEvent.startTime)
    const setDate = new Date(gameDate)
    setDate.setUTCDate(setDate.getUTCDate() - 1)
    const dateStr = setDate.toISOString().slice(0, 10)

    updates.setDay = await upsertCalEvent(googleEventIds.setDay, {
      summary: `[SET DAY] ${title}`,
      location,
      description: `Set day preparation for ${title}.${appEvent.notes ? `\n\n${appEvent.notes}` : ''}`,
      start: { date: dateStr },
      end: { date: dateStr },
      attendees: allAttendees,
    })
  }

  // Game Time
  if (settings.createGameTime && appEvent.startTime) {
    const start = new Date(appEvent.startTime)
    const end = new Date(start.getTime() + 210 * 60 * 1000) // 3.5 hours

    updates.gameTime = await upsertCalEvent(googleEventIds.gameTime, {
      summary: `[GAME] ${title}`,
      location,
      description: `${title}.${appEvent.notes ? `\n\n${appEvent.notes}` : ''}`,
      start: { dateTime: start.toISOString(), timeZone: 'UTC' },
      end: { dateTime: end.toISOString(), timeZone: 'UTC' },
      attendees: allAttendees,
    })
  }

  // Remote Call Time
  if (settings.createRemoteCall && appEvent.remoteCallTime) {
    const start = new Date(appEvent.remoteCallTime)
    const end = new Date(start.getTime() + settings.remoteCallDurationMins * 60 * 1000)

    updates.remoteCall = await upsertCalEvent(googleEventIds.remoteCall, {
      summary: `[REMOTE] ${title}`,
      location,
      description: `Remote operations for ${title}.`,
      start: { dateTime: start.toISOString(), timeZone: 'UTC' },
      end: { dateTime: end.toISOString(), timeZone: 'UTC' },
      attendees: remoteAttendees,
    })
  }

  // Field Call Time
  if (settings.createFieldCall && appEvent.fieldCallTime) {
    const start = new Date(appEvent.fieldCallTime)
    const end = new Date(start.getTime() + settings.fieldCallDurationMins * 60 * 1000)

    updates.fieldCall = await upsertCalEvent(googleEventIds.fieldCall, {
      summary: `[ON-SITE] ${title}`,
      location,
      description: `On-site deployment for ${title}.`,
      start: { dateTime: start.toISOString(), timeZone: 'UTC' },
      end: { dateTime: end.toISOString(), timeZone: 'UTC' },
      attendees: onsiteAttendees,
    })
  }

  // Persist the Google event IDs back onto the app event
  const updatedEvent = {
    ...appEvent,
    googleEventIds: { ...googleEventIds, ...updates },
    googleSyncedAt: new Date().toISOString(),
  }
  q.upsert('events', updatedEvent)
  return updatedEvent
}

export async function deleteEventFromCalendar(appEvent) {
  const auth = getAuthedClient()
  if (!auth || !appEvent.googleEventIds) return

  const calendarId = getCfg('google_calendar_id') || 'primary'
  const cal = google.calendar({ version: 'v3', auth })

  for (const key of ['setDay', 'gameTime', 'remoteCall', 'fieldCall']) {
    const id = appEvent.googleEventIds[key]
    if (id) {
      try {
        await cal.events.delete({ calendarId, eventId: id, sendUpdates: 'all' })
      } catch { /* ignore 404 — already deleted */ }
    }
  }
}
