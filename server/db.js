import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import { config } from './config.js'

let dbInstance = null

function resolveDatabasePath(databasePath) {
  if (databasePath) return databasePath
  if (process.env.DATABASE_PATH) return path.resolve(process.env.DATABASE_PATH)
  return config.databasePath
}

export function getDb(databasePath) {
  const resolvedPath = resolveDatabasePath(databasePath)
  if (dbInstance) return dbInstance

  const dir = path.dirname(resolvedPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  dbInstance = new Database(resolvedPath)
  dbInstance.pragma('journal_mode = WAL')
  dbInstance.pragma('foreign_keys = ON')

  return dbInstance
}

export function closeDb() {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}

export function resetDbForTests(databasePath) {
  closeDb()
  if (fs.existsSync(databasePath)) {
    fs.unlinkSync(databasePath)
  }
  return getDb(databasePath)
}
