#!/usr/bin/env node
/**
 * Sincroniza fotos de imóveis a partir das URLs dos anúncios.
 * Uso: node scripts/sync-property-photos.mjs [--ids 828,738,646]
 */

import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')

const args = process.argv.slice(2)
const idsArg = args.includes('--ids') ? args[args.indexOf('--ids') + 1] : null
const ids = idsArg ? idsArg.split(',').map((v) => Number(v.trim())).filter(Boolean) : null

const SEED_PHOTOS = {
  828: [
    'https://axvliw1bcpyx.objectstorage.sa-vinhedo-1.oci.customer-oci.com/n/axvliw1bcpyx/b/ksi/o/1163/foto_/2021/12733/sao-jose-do-rio-preto-comercial-casa-comercial-jardim-palmeiras-07-01-2021_17-56-04-0.jpg',
  ],
  738: [
    'https://axvliw1bcpyx.objectstorage.sa-vinhedo-1.oci.customer-oci.com/n/axvliw1bcpyx/b/ksi/o/1163/foto_/2026/24009/sao-jose-do-rio-preto-comercial-sala-universitario-25-05-2026_09-46-31-6a1444a762aeb.webp',
  ],
}

process.env.DATABASE_PATH = process.env.DATABASE_PATH ?? resolve(rootDir, 'data/imoveis.sqlite')

const { getDb, closeDb } = await import('../server/db.js')
const { runMigrations } = await import('../server/migrate.js')
const { syncPhotosForProperty } = await import('../server/photos/sync.js')

async function main() {
  runMigrations(getDb())
  const db = getDb()

  const rows = ids
    ? db.prepare(`SELECT id, url, descricao FROM properties WHERE id IN (${ids.map(() => '?').join(',')})`).all(...ids)
    : db.prepare('SELECT id, url, descricao FROM properties WHERE url IS NOT NULL AND url != \'\' ORDER BY id').all()

  console.log(`Sincronizando fotos para ${rows.length} imóvel(is)...`)

  for (const row of rows) {
    const seeds = SEED_PHOTOS[row.id] ?? []
    const photos = await syncPhotosForProperty(row, { seedUrls: seeds })
    console.log(`#${row.id} ${row.descricao?.slice(0, 60)} → ${photos.length} foto(s)`)
    photos.forEach((url, i) => console.log(`  ${i + 1}. ${url}`))
  }

  closeDb()
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}