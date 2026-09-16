import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

function parseOptionalFloat(value) {
  if (value === undefined || value === null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export const config = {
  port: Number(process.env.PORT) || 3001,
  databasePath: process.env.DATABASE_PATH
    ? path.resolve(process.env.DATABASE_PATH)
    : path.join(rootDir, 'data', 'imoveis.sqlite'),
  loadLatitude: parseOptionalFloat(process.env.LOAD_LATITUDE),
  loadLongitude: parseOptionalFloat(process.env.LOAD_LONGITUDE),
  isProduction: process.env.NODE_ENV === 'production',
  rootDir,
}

export function getLoadCoordinates() {
  const { loadLatitude, loadLongitude } = config
  if (loadLatitude == null || loadLongitude == null) return null
  if (loadLatitude < -90 || loadLatitude > 90) return null
  if (loadLongitude < -180 || loadLongitude > 180) return null
  return { lat: loadLatitude, lng: loadLongitude }
}
