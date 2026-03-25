import bcrypt from 'bcryptjs'
import { q } from './db.js'
import { initialData } from '../src/data/mockData.js'

export function seedIfEmpty() {
  if (q.count('events') > 0) return

  for (const emp of initialData.employees) {
    q.upsert('employees', { ...emp, password: bcrypt.hashSync(emp.password, 10) })
  }
  for (const item of initialData.venues) q.upsert('venues', item)
  for (const item of initialData.kits) q.upsert('kits', item)
  for (const item of initialData.events) q.upsert('events', item)
  for (const item of initialData.checklistTemplates) q.upsert('checklist_templates', item)
  for (const item of initialData.checklistInstances) q.upsert('checklist_instances', item)
  for (const item of initialData.issues) q.upsert('issues', item)
  for (const item of initialData.reports) q.upsert('reports', item)
  for (const item of initialData.announcements) q.upsert('announcements', item)
  for (const item of initialData.documentation) q.upsert('documentation', item)

  console.log('Database seeded with initial data.')
}

// One-time migration: hash any plaintext passwords already in the DB.
// Safe to run repeatedly — skips rows that are already hashed.
export function migratePasswords() {
  const employees = q.getAll('employees')
  let migrated = 0
  for (const emp of employees) {
    if (emp.password && !emp.password.startsWith('$2')) {
      q.upsert('employees', { ...emp, password: bcrypt.hashSync(emp.password, 10) })
      migrated++
    }
  }
  if (migrated > 0) console.log(`Migrated ${migrated} plaintext password(s) to bcrypt hashes.`)
}
