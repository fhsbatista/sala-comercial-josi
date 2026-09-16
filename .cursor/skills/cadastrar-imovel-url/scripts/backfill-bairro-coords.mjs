#!/usr/bin/env node
/**
 * Geocodifica bairros distintos (Nominatim) e preenche latitude/longitude no SQLite.
 * Uso: node .../backfill-bairro-coords.mjs [--imobiliaria Tess] [--dry-run]
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Database from 'better-sqlite3'

const API_BASE = process.env.API_BASE ?? 'http://localhost:3001'
const DB_PATH = resolve(process.env.DATABASE_PATH ?? 'data/imoveis.sqlite')
const LOAD = { lat: -20.826422092367583, lng: -49.39255542572019 }
const UA = 'sala-comercial-josi/1.0'
const COORD_NOTE = 'Coordenadas: centro aproximado do bairro (Nominatim)'

const args = process.argv.slice(2)
const imobFilter = args.includes('--imobiliaria')
  ? args[args.indexOf('--imobiliaria') + 1]
  : 'Tess'
const dryRun = args.includes('--dry-run')

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function haversineKm(a, b) {
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function classifyProximidade(km) {
  if (km <= 1.5) return 'muito_proximo'
  if (km <= 4) return 'proximo'
  if (km <= 8) return 'intermediario'
  return 'mais_distante'
}

function hasFullStreetAddress(endereco) {
  if (!endereco) return false
  if (/R\.?\s*Antônio de Godoy,\s*3825/i.test(endereco)) return false
  return /\b(Rua|R\.|Av\.|Avenida|Rodovia|Alameda|Travessa|Estrada)\b/i.test(endereco)
}

function upsertObservacao(observacoes, extra) {
  const base = (observacoes ?? '').trim()
  const cleaned = base
    .replace(/Coordenadas:[^.]*(\.\s*)?/gi, '')
    .replace(/Proximidade (derivada|estimada)[^.]*(\.\s*)?/gi, '')
    .trim()
  const parts = [cleaned, extra].filter(Boolean)
  return parts.join('. ').replace(/\.\s*\./g, '.')
}

async function geocodeBairro(bairro) {
  const q = `${bairro}, São José do Rio Preto, SP, Brasil`
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`
  await sleep(1100)
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) return null
  const data = await res.json()
  const hit = data[0]
  if (!hit) return null
  return { lat: Number(hit.lat), lng: Number(hit.lon), displayName: hit.display_name }
}

async function main() {
  const res = await fetch(`${API_BASE}/api/properties`)
  const { data: properties } = await res.json()

  const targets = properties.filter(
    (p) =>
      p.imobiliaria === imobFilter &&
      p.tipoUrl === 'individual' &&
      (p.latitude == null || p.longitude == null) &&
      !hasFullStreetAddress(p.endereco),
  )

  const bairros = [...new Set(targets.map((p) => p.bairro))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR'),
  )

  console.log(`Imóveis alvo: ${targets.length}`)
  console.log(`Bairros distintos: ${bairros.length}`)
  for (const b of bairros) {
    const n = targets.filter((p) => p.bairro === b).length
    console.log(`  - ${b} (${n})`)
  }

  const bairroCoords = {}
  const failures = []

  for (const bairro of bairros) {
    process.stdout.write(`Geocodificando: ${bairro} ... `)
    try {
      const hit = await geocodeBairro(bairro)
      if (!hit) {
        console.log('FALHOU')
        failures.push(bairro)
        continue
      }
      bairroCoords[bairro] = hit
      console.log(`${hit.lat}, ${hit.lng}`)
    } catch (err) {
      console.log(`ERRO: ${err.message}`)
      failures.push(bairro)
    }
  }

  if (dryRun) {
    writeFileSync(
      resolve('bairro-coords-preview.json'),
      JSON.stringify({ bairroCoords, failures }, null, 2),
    )
    console.log('\nDry-run: nada gravado. Preview em bairro-coords-preview.json')
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
      const hit = bairroCoords[p.bairro]
      if (!hit) {
        skipped++
        continue
      }
      const km = haversineKm(LOAD, { lat: hit.lat, lng: hit.lng })
      const proximidade = classifyProximidade(km)
      const obs = upsertObservacao(
        p.observacoes,
        `${COORD_NOTE}. Proximidade derivada em linha reta (${km.toFixed(2)} km da LOAD)`,
      )
      update.run({
        id: p.id,
        latitude: hit.lat,
        longitude: hit.lng,
        proximidade,
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
  console.log(`Bairros sem resultado: ${failures.length}`)
  if (failures.length) console.log(failures.join(', '))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
