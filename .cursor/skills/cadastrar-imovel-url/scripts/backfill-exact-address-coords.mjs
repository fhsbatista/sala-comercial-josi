#!/usr/bin/env node
/**
 * Re-geocodifica imóveis com endereço exato que receberam coordenadas do centro do bairro.
 * Uso: node .../backfill-exact-address-coords.mjs [--imobiliaria Tess] [--dry-run]
 */

import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Database from 'better-sqlite3'
import {
  classifyProximidade,
  geocodeQuery,
  haversineKm,
  isExactAddress,
  LOAD_DEFAULT,
  upsertCoordObservacao,
} from './geocode-utils.mjs'

const API_BASE = process.env.API_BASE ?? 'http://localhost:3001'
const DB_PATH = resolve(process.env.DATABASE_PATH ?? 'data/imoveis.sqlite')

const args = process.argv.slice(2)
const imobFilter = args.includes('--imobiliaria')
  ? args[args.indexOf('--imobiliaria') + 1]
  : null
const dryRun = args.includes('--dry-run')

const geocodeCache = new Map()

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function needsExactAddressFix(p) {
  if (!isExactAddress(p.endereco)) return false
  const obs = p.observacoes ?? ''
  return /centro aproximado do bairro/i.test(obs) || p.latitude == null || p.longitude == null
}

async function main() {
  const res = await fetch(`${API_BASE}/api/properties`)
  const { data: properties } = await res.json()

  const targets = properties.filter(
    (p) =>
      p.tipoUrl === 'individual' &&
      (!imobFilter || p.imobiliaria === imobFilter) &&
      needsExactAddressFix(p),
  )

  console.log(`Imóveis com endereço exato a corrigir: ${targets.length}`)
  if (!targets.length) return

  const addressCoords = {}
  const failures = []

  for (const p of targets) {
    const addr = p.endereco
    if (addressCoords[addr] !== undefined) continue

    process.stdout.write(`Geocodificando endereço: ${addr} ... `)
    try {
      const q = `${addr}, São José do Rio Preto, SP, Brasil`
      const hit = await geocodeQuery(q, geocodeCache, { sleep })
      if (!hit) {
        console.log('FALHOU')
        failures.push(addr)
        addressCoords[addr] = null
        continue
      }
      addressCoords[addr] = hit
      console.log(`${hit.lat}, ${hit.lng}`)
    } catch (err) {
      console.log(`ERRO: ${err.message}`)
      failures.push(addr)
      addressCoords[addr] = null
    }
  }

  if (dryRun) {
    writeFileSync(
      resolve('exact-address-coords-preview.json'),
      JSON.stringify({ addressCoords, failures, targets: targets.map((p) => p.id) }, null, 2),
    )
    console.log('\nDry-run: nada gravado. Preview em exact-address-coords-preview.json')
    return
  }

  const db = new Database(DB_PATH)
  const update = db.prepare(`
    UPDATE properties
    SET latitude = @latitude,
        longitude = @longitude,
        proximidade = @proximidade,
        observacoes = @observacoes,
        updated_at = datetime('now')
    WHERE id = @id
  `)

  let updated = 0
  let skipped = 0

  const tx = db.transaction((rows) => {
    for (const p of rows) {
      const hit = addressCoords[p.endereco]
      if (!hit) {
        skipped++
        continue
      }
      const km = haversineKm(LOAD_DEFAULT, hit)
      const prox = classifyProximidade(km)
      const obs = upsertCoordObservacao(
        p.observacoes,
        'Coordenadas: endereço exato geocodificado (Nominatim)',
        `Proximidade derivada em linha reta (${km.toFixed(2)} km da LOAD)`,
      )
      update.run({
        id: p.id,
        latitude: hit.lat,
        longitude: hit.lng,
        proximidade: prox,
        observacoes: obs,
      })
      updated++
    }
  })

  tx(targets)
  db.close()

  console.log('\n--- Resultado ---')
  console.log(`Atualizados: ${updated}`)
  console.log(`Sem geocode: ${skipped}`)
  console.log(`Endereços sem resultado: ${failures.length}`)
  if (failures.length) console.log(failures.join('\n'))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
