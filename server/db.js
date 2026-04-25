import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// On AWS: set DB_PATH=/data/qod.db (EBS mount) via environment variable
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'qod.db')
export const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

const TABLES = [
  'events',
  'venues',
  'employees',
  'kits',
  'checklist_templates',
  'checklist_instances',
  'issues',
  'reports',
  'announcements',
  'documentation',
  'roadmap_projects',
]

for (const table of TABLES) {
  db.exec(`CREATE TABLE IF NOT EXISTS ${table} (id TEXT PRIMARY KEY, data TEXT NOT NULL)`)
}

// Key-value store for integration config (Google Calendar tokens, settings, etc.)
db.exec(`CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT NOT NULL)`)

export const q = {
  getAll: (table) =>
    db.prepare(`SELECT data FROM ${table}`).all().map((r) => JSON.parse(r.data)),

  get: (table, id) => {
    const row = db.prepare(`SELECT data FROM ${table} WHERE id = ?`).get(id)
    return row ? JSON.parse(row.data) : null
  },

  upsert: (table, item) =>
    db
      .prepare(`INSERT OR REPLACE INTO ${table} (id, data) VALUES (?, ?)`)
      .run(item.id, JSON.stringify(item)),

  del: (table, id) => db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id),

  count: (table) => db.prepare(`SELECT COUNT(*) as n FROM ${table}`).get().n,
}
