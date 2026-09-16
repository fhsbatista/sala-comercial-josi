import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it, beforeEach, afterEach } from 'node:test'
import { getDb, resetDbForTests, closeDb } from '../server/db.js'
import { runSeed } from '../server/seed.js'
import { initialProperties } from '../server/seeds/initial-properties.js'

describe('seed', () => {
  let dbPath

  beforeEach(() => {
    dbPath = path.join(os.tmpdir(), `imoveis-test-${Date.now()}-${Math.random()}.sqlite`)
    process.env.DATABASE_PATH = dbPath
    resetDbForTests(dbPath)
  })

  afterEach(() => {
    closeDb()
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath)
    delete process.env.DATABASE_PATH
  })

  it('inserts all 28 initial properties', () => {
    const db = getDb(dbPath)
    const result = runSeed(db)
    assert.equal(result.inserted, 28)
    const count = db.prepare('SELECT COUNT(*) AS total FROM properties').get().total
    assert.equal(count, 28)
  })

  it('is idempotent and does not overwrite existing records', () => {
    const db = getDb(dbPath)
    runSeed(db)
    const second = runSeed(db)
    assert.equal(second.inserted, 0)

    const count = db.prepare('SELECT COUNT(*) AS total FROM properties').get().total
    assert.equal(count, 28)
  })

  it('preserves separate Souza Barros units', () => {
    const db = getDb(dbPath)
    runSeed(db)
    const rows = db.prepare("SELECT id FROM properties WHERE endereco = 'Rua Souza Barros' ORDER BY id").all()
    assert.deepEqual(rows.map((r) => r.id), [26, 27, 28])
  })

  it('matches seed file counts', () => {
    assert.equal(initialProperties.length, 28)
    assert.equal(initialProperties.filter((p) => p.tipoUrl === 'individual').length, 9)
    assert.equal(initialProperties.filter((p) => p.tipoUrl === 'busca').length, 19)
  })
})
