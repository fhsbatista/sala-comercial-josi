import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDb, closeDb } from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const migrationsDir = path.join(__dirname, 'migrations')

export function runMigrations(db = getDb()) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const version = Number(file.split('_')[0])
    const applied = db.prepare('SELECT version FROM schema_migrations WHERE version = ?').get(version)
    if (applied) continue

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
    db.exec(sql)
    db.prepare('INSERT INTO schema_migrations (version) VALUES (?)').run(version)
    console.log(`Migration ${file} applied`)
  }
}

import { pathToFileURL } from 'node:url'

const isDirectRun = process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href

if (isDirectRun) {
  runMigrations()
  closeDb()
  console.log('Migrations complete')
}
