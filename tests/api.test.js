import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it, beforeEach, afterEach } from 'node:test'
import request from 'supertest'
import { resetDbForTests, closeDb } from '../server/db.js'
import { createApp } from '../server/app.js'

describe('API', () => {
  let dbPath
  let app

  beforeEach(() => {
    dbPath = path.join(os.tmpdir(), `imoveis-api-${Date.now()}-${Math.random()}.sqlite`)
    process.env.DATABASE_PATH = dbPath
    resetDbForTests(dbPath)
    app = createApp()
  })

  afterEach(() => {
    closeDb()
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath)
    delete process.env.DATABASE_PATH
  })

  it('GET /api/properties returns seeded list', async () => {
    const res = await request(app).get('/api/properties')
    assert.equal(res.status, 200)
    assert.equal(res.body.data.length, 28)
  })

  it('GET /api/properties/:id returns property or 404', async () => {
    const ok = await request(app).get('/api/properties/1')
    assert.equal(ok.status, 200)
    assert.equal(ok.body.data.id, 1)

    const missing = await request(app).get('/api/properties/9999')
    assert.equal(missing.status, 404)
  })

  it('POST /api/properties creates new property', async () => {
    const res = await request(app)
      .post('/api/properties')
      .send({
        imobiliaria: 'Teste',
        descricao: 'Salão teste',
        bairro: 'Centro',
        endereco: 'Rua Teste, 100',
        areaM2: 50,
        aluguel: 2000,
        proximidade: 'proximo',
        url: 'https://example.com/imovel',
        tipoUrl: 'individual',
        latitude: -20.8123,
        longitude: -49.3789,
      })

    assert.equal(res.status, 201)
    assert.ok(res.body.data.id > 28)
    assert.deepEqual(res.body.data.coordenadas, { lat: -20.8123, lng: -49.3789 })
  })

  it('POST rejects incomplete coordinates', async () => {
    const res = await request(app)
      .post('/api/properties')
      .send({
        imobiliaria: 'Teste',
        descricao: 'Salão teste',
        bairro: 'Centro',
        endereco: 'Rua Teste, 100',
        areaM2: 50,
        aluguel: 2000,
        proximidade: 'proximo',
        url: 'https://example.com/imovel',
        tipoUrl: 'individual',
        latitude: -20.8123,
      })

    assert.equal(res.status, 400)
    assert.ok(res.body.fields.latitude)
    assert.ok(res.body.fields.longitude)
  })

  it('POST sets default status for busca links', async () => {
    const res = await request(app)
      .post('/api/properties')
      .send({
        imobiliaria: 'Teste',
        descricao: 'Salão teste',
        bairro: 'Centro',
        endereco: 'Centro',
        areaM2: 50,
        aluguel: 2000,
        proximidade: 'proximo',
        url: 'https://example.com/busca',
        tipoUrl: 'busca',
      })

    assert.equal(res.status, 201)
    assert.equal(res.body.data.status, 'link de busca')
  })

  it('GET /api/config returns public config', async () => {
    const res = await request(app).get('/api/config')
    assert.equal(res.status, 200)
    assert.ok(res.body.data.referencia)
    assert.ok('loadCoordinates' in res.body.data)
  })

  it('POST accepts area below former 40 m² minimum', async () => {
    const res = await request(app)
      .post('/api/properties')
      .send({
        imobiliaria: 'Teste',
        descricao: 'Salão pequeno',
        bairro: 'Centro',
        endereco: 'Rua Teste, 100',
        areaM2: 20,
        aluguel: 900,
        proximidade: 'proximo',
        url: 'https://example.com/imovel-pequeno',
        tipoUrl: 'individual',
      })

    assert.equal(res.status, 201)
    assert.equal(res.body.data.areaM2, 20)
  })

  it('DELETE /api/properties/:id removes property or returns 404', async () => {
    const created = await request(app)
      .post('/api/properties')
      .send({
        imobiliaria: 'Teste',
        descricao: 'Salão para excluir',
        bairro: 'Centro',
        endereco: 'Rua Teste, 100',
        areaM2: 50,
        aluguel: 2000,
        proximidade: 'proximo',
        url: 'https://example.com/excluir',
        tipoUrl: 'individual',
      })

    const id = created.body.data.id
    const deleted = await request(app).delete(`/api/properties/${id}`)
    assert.equal(deleted.status, 200)
    assert.equal(deleted.body.data.id, id)

    const missing = await request(app).get(`/api/properties/${id}`)
    assert.equal(missing.status, 404)

    const notFound = await request(app).delete('/api/properties/9999')
    assert.equal(notFound.status, 404)
  })
})
