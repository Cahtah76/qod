import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import bcrypt from 'bcryptjs'
import path from 'path'
import { fileURLToPath } from 'url'
import { q } from './db.js'
import { seedIfEmpty, migratePasswords } from './seed.js'
import {
  getAuthUrl, handleCallback, disconnect,
  getStatus, saveSettings, listCalendars,
  syncEvent, deleteEventFromCalendar,
} from './googleCalendar.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(__dirname, '..', 'dist')
const isProd = process.env.NODE_ENV === 'production'

const app = express()

// ── Trust proxy — required for rate limiter to get real client IP behind AWS ALB ──
app.set('trust proxy', 1)

// ── HTTPS redirect (production only, triggered by AWS ALB x-forwarded-proto) ──
if (isProd) {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.hostname}${req.originalUrl}`)
    }
    next()
  })
}

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  // Allow inline scripts/styles that Vite bundles need
  contentSecurityPolicy: false,
}))

// ── CORS — locked to ALLOWED_ORIGIN in production, open in dev ───────────────
app.use(cors({
  origin: isProd ? (process.env.ALLOWED_ORIGIN || false) : true,
  credentials: true,
}))

app.use(express.json({ limit: '10mb' }))

// ── Startup ───────────────────────────────────────────────────────────────────
seedIfEmpty()
migratePasswords()

// ── Health check — ALB pings this to verify the instance is alive ─────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }))

// ── Rate limiter for auth routes ──────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
})

// ── Full state ────────────────────────────────────────────────────────────────
app.get('/api/state', (_req, res) => {
  res.json({
    events: q.getAll('events'),
    venues: q.getAll('venues'),
    employees: q.getAll('employees'),
    kits: q.getAll('kits'),
    checklistTemplates: q.getAll('checklist_templates'),
    checklistInstances: q.getAll('checklist_instances'),
    issues: q.getAll('issues'),
    reports: q.getAll('reports'),
    announcements: q.getAll('announcements'),
    documentation: q.getAll('documentation'),
  })
})

// ── Google Calendar integration ───────────────────────────────────────────────
app.get('/api/google/status', (_req, res) => res.json(getStatus()))

app.get('/api/google/auth-url', (_req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({ error: 'Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI.' })
  }
  res.json({ url: getAuthUrl() })
})

app.get('/api/google/callback', async (req, res) => {
  try {
    await handleCallback(req.query.code)
    res.redirect('/#/admin?tab=integrations&google=connected')
  } catch (err) {
    console.error('Google OAuth callback error:', err.message)
    res.redirect('/#/admin?tab=integrations&google=error')
  }
})

app.post('/api/google/disconnect', (_req, res) => {
  disconnect()
  res.sendStatus(204)
})

app.get('/api/google/calendars', async (_req, res) => {
  try {
    res.json(await listCalendars())
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/google/settings', (req, res) => {
  saveSettings(req.body)
  res.sendStatus(204)
})

app.post('/api/google/sync/:eventId', async (req, res) => {
  const event = q.get('events', req.params.eventId)
  if (!event) return res.status(404).json({ error: 'Event not found' })
  try {
    const updated = await syncEvent(event)
    res.json(updated)
  } catch (err) {
    console.error('Google Calendar sync error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// Debug: show what would be sent / what was last sent for an event
app.get('/api/google/debug/:eventId', async (req, res) => {
  const event = q.get('events', req.params.eventId)
  if (!event) return res.status(404).json({ error: 'Event not found' })
  const employees = q.getAll('employees')
  const status = getStatus()

  const remoteEmp = employees.find(e => e.id === event.crew?.remoteOperator)
  const onsiteEmps = (event.crew?.onsiteOperators || [])
    .map(id => employees.find(e => e.id === id))
    .filter(Boolean)

  res.json({
    connected: status.connected,
    settings: status.settings,
    calendarId: status.calendarId,
    event: { id: event.id, name: event.name, startTime: event.startTime, remoteCallTime: event.remoteCallTime, fieldCallTime: event.fieldCallTime },
    crew: {
      remoteOperator: remoteEmp ? { id: remoteEmp.id, name: remoteEmp.name, email: remoteEmp.email } : null,
      onsiteOperators: onsiteEmps.map(e => ({ id: e.id, name: e.name, email: e.email })),
    },
    googleEventIds: event.googleEventIds || null,
    lastSyncedAt: event.googleSyncedAt || null,
  })
})

app.post('/api/google/sync-all', async (_req, res) => {
  const events = q.getAll('events').filter((e) => e.startTime)
  const results = { synced: 0, errors: [] }
  for (const event of events) {
    try {
      await syncEvent(event)
      results.synced++
    } catch (err) {
      results.errors.push({ eventId: event.id, error: err.message })
    }
  }
  res.json(results)
})

// ── Employees — separate handler to hash passwords on write ───────────────────
app.put('/api/employees/:id', (req, res) => {
  let item = { ...req.body, id: req.params.id }
  if (item.password && !item.password.startsWith('$2')) {
    item = { ...item, password: bcrypt.hashSync(item.password, 10) }
  }
  q.upsert('employees', item)
  res.json(item)
})

app.delete('/api/employees/:id', (req, res) => {
  q.del('employees', req.params.id)
  res.sendStatus(204)
})

// ── Generic CRUD for all other resources ─────────────────────────────────────
const ROUTE_TABLE = {
  events: 'events',
  venues: 'venues',
  kits: 'kits',
  'checklist-templates': 'checklist_templates',
  'checklist-instances': 'checklist_instances',
  issues: 'issues',
  reports: 'reports',
  announcements: 'announcements',
  documentation: 'documentation',
}

for (const [route, table] of Object.entries(ROUTE_TABLE)) {
  app.put(`/api/${route}/:id`, (req, res) => {
    const item = { ...req.body, id: req.params.id }
    q.upsert(table, item)
    res.json(item)

    // Auto-sync events to Google Calendar in the background
    if (route === 'events' && getStatus().connected) {
      syncEvent(item).catch((err) =>
        console.error('Auto Google Calendar sync failed:', err.message)
      )
    }
  })

  app.delete(`/api/${route}/:id`, (req, res) => {
    // For events, remove from Google Calendar before deleting
    if (route === 'events' && getStatus().connected) {
      const event = q.get('events', req.params.id)
      if (event) deleteEventFromCalendar(event).catch(() => {})
    }
    q.del(table, req.params.id)
    res.sendStatus(204)
  })
}

// ── Auth ──────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', loginLimiter, (req, res) => {
  const { email, password } = req.body
  const employees = q.getAll('employees')
  const emp = employees.find((e) => e.email.toLowerCase() === email.toLowerCase())
  if (!emp || !bcrypt.compareSync(password, emp.password)) {
    return res.status(401).json({ error: 'Invalid email or password.' })
  }
  const { password: _pw, ...safe } = emp
  res.json(safe)
})

app.post('/api/auth/change-password', loginLimiter, (req, res) => {
  const { employeeId, newPassword } = req.body
  const emp = q.get('employees', employeeId)
  if (!emp) return res.status(404).json({ error: 'Employee not found.' })
  q.upsert('employees', { ...emp, password: bcrypt.hashSync(newPassword, 10), mustChangePassword: false })
  res.sendStatus(204)
})

// ── Serve built React app ─────────────────────────────────────────────────────
app.use(express.static(DIST, {
  maxAge: isProd ? '1y' : 0,  // Vite output is content-hashed — safe to cache aggressively
  immutable: isProd,
}))

app.get('/{*path}', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' })
  res.sendFile(path.join(DIST, 'index.html'))
})

// ── Graceful shutdown ─────────────────────────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('SIGTERM received — shutting down gracefully')
  process.exit(0)
})

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`QOD API server listening on http://localhost:${PORT}`))
