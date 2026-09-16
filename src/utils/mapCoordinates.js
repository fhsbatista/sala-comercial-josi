/**
 * Valida coordenadas geográficas numéricas.
 * @param {{ lat?: unknown, lng?: unknown }|null|undefined} coord
 * @returns {boolean}
 */
export function isValidCoordinate(coord) {
  if (!coord || typeof coord !== 'object') return false
  const { lat, lng } = coord
  if (typeof lat !== 'number' || typeof lng !== 'number') return false
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false
  if (lat < -90 || lat > 90) return false
  if (lng < -180 || lng > 180) return false
  return true
}

/**
 * Separa imóveis com coordenadas válidas das demais.
 * @param {Array<{ coordenadas?: { lat: number, lng: number }|null }>} imoveis
 * @returns {{ withCoordinates: typeof imoveis, withoutCoordinates: typeof imoveis }}
 */
export function partitionByValidCoordinates(imoveis) {
  const withCoordinates = []
  const withoutCoordinates = []

  for (const imovel of imoveis) {
    if (isValidCoordinate(imovel.coordenadas)) {
      withCoordinates.push(imovel)
    } else {
      withoutCoordinates.push(imovel)
    }
  }

  return { withCoordinates, withoutCoordinates }
}
