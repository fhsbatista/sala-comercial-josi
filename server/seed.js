import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { getDb, closeDb } from './db.js'
import { runMigrations } from './migrate.js'
import { initialProperties } from './seeds/initial-properties.js'

const INSERT = `
  INSERT INTO properties (
    id, imobiliaria, descricao, bairro, endereco, area_m2, aluguel, encargos,
    proximidade, latitude, longitude, url, tipo_url, status, ultima_verificacao, observacoes
  ) VALUES (
    @id, @imobiliaria, @descricao, @bairro, @endereco, @areaM2, @aluguel, @encargos,
    @proximidade, @latitude, @longitude, @url, @tipoUrl, @status, @ultimaVerificacao, @observacoes
  )
`

export function runSeed(db = getDb()) {
  runMigrations(db)

  const exists = db.prepare('SELECT id FROM properties WHERE id = ?')
  const insert = db.prepare(INSERT)

  let inserted = 0
  for (const item of initialProperties) {
    if (exists.get(item.id)) continue

    insert.run({
      id: item.id,
      imobiliaria: item.imobiliaria,
      descricao: item.descricao,
      bairro: item.bairro,
      endereco: item.endereco,
      areaM2: item.areaM2,
      aluguel: item.aluguel,
      encargos: item.encargos,
      proximidade: item.proximidade,
      latitude: item.coordenadas?.lat ?? null,
      longitude: item.coordenadas?.lng ?? null,
      url: item.url,
      tipoUrl: item.tipoUrl,
      status: item.status,
      ultimaVerificacao: item.ultimaVerificacao,
      observacoes: item.observacoes,
    })
    inserted++
  }

  return { inserted, total: initialProperties.length }
}

const isDirectRun = process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href

if (isDirectRun) {
  const result = runSeed()
  closeDb()
  console.log(`Seed complete: ${result.inserted} inserted, ${result.total} in seed file`)
}
