import { Router } from 'express'
import { getDb } from '../db.js'
import { rowToProperty } from '../rowMapper.js'
import { validatePropertyInput } from '../validation/property.js'

const router = Router()

const SELECT_ALL = `
  SELECT * FROM properties ORDER BY id ASC
`

const SELECT_BY_ID = `
  SELECT * FROM properties WHERE id = ?
`

const NEXT_ID = `SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM properties`

const INSERT = `
  INSERT INTO properties (
    id, imobiliaria, descricao, bairro, endereco, area_m2, aluguel, encargos,
    proximidade, latitude, longitude, url, tipo_url, status, ultima_verificacao, observacoes
  ) VALUES (
    @id, @imobiliaria, @descricao, @bairro, @endereco, @area_m2, @aluguel, @encargos,
    @proximidade, @latitude, @longitude, @url, @tipo_url, @status, @ultima_verificacao, @observacoes
  )
`

const DELETE_BY_ID = `
  DELETE FROM properties WHERE id = ?
`

const UPDATE_LIKED = `
  UPDATE properties SET liked = ?, updated_at = datetime('now') WHERE id = ?
`

router.get('/', (_req, res) => {
  const db = getDb()
  const rows = db.prepare(SELECT_ALL).all()
  res.json({ data: rows.map(rowToProperty) })
})

router.get('/:id', (req, res) => {
  const db = getDb()
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'ID inválido' })
  }

  const row = db.prepare(SELECT_BY_ID).get(id)
  if (!row) {
    return res.status(404).json({ error: 'Imóvel não encontrado' })
  }

  res.json({ data: rowToProperty(row) })
})

router.post('/', (req, res) => {
  const validation = validatePropertyInput(req.body)
  if (!validation.ok) {
    return res.status(400).json({ error: 'Dados inválidos', fields: validation.fields })
  }

  const db = getDb()
  const row = validation.data

  const nextId = db.prepare(NEXT_ID).get().nextId

  db.prepare(INSERT).run({
    id: nextId,
    imobiliaria: row.imobiliaria,
    descricao: row.descricao,
    bairro: row.bairro,
    endereco: row.endereco,
    area_m2: row.areaM2,
    aluguel: row.aluguel,
    encargos: row.encargos,
    proximidade: row.proximidade,
    latitude: row.latitude,
    longitude: row.longitude,
    url: row.url,
    tipo_url: row.tipoUrl,
    status: row.status,
    ultima_verificacao: row.ultimaVerificacao,
    observacoes: row.observacoes,
  })

  const created = db.prepare(SELECT_BY_ID).get(nextId)
  res.status(201).json({ data: rowToProperty(created) })
})

router.patch('/:id/liked', (req, res) => {
  const db = getDb()
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'ID inválido' })
  }
  if (typeof req.body.liked !== 'boolean') {
    return res.status(400).json({ error: 'Dados inválidos', fields: { liked: 'Deve ser booleano' } })
  }

  const existing = db.prepare(SELECT_BY_ID).get(id)
  if (!existing) {
    return res.status(404).json({ error: 'Imóvel não encontrado' })
  }

  db.prepare(UPDATE_LIKED).run(req.body.liked ? 1 : 0, id)
  const updated = db.prepare(SELECT_BY_ID).get(id)
  res.json({ data: rowToProperty(updated) })
})

router.delete('/:id', (req, res) => {
  const db = getDb()
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'ID inválido' })
  }

  const existing = db.prepare(SELECT_BY_ID).get(id)
  if (!existing) {
    return res.status(404).json({ error: 'Imóvel não encontrado' })
  }

  db.prepare(DELETE_BY_ID).run(id)
  res.json({ data: { id } })
})

export default router
