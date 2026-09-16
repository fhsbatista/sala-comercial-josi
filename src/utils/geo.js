const EARTH_RADIUS_KM = 6371

function toRadians(degrees) {
  return (degrees * Math.PI) / 180
}

/**
 * Calcula distância em linha reta (Haversine) entre dois pontos em km.
 * @param {{ lat: number, lng: number }} pointA
 * @param {{ lat: number, lng: number }} pointB
 */
export function haversineKm(pointA, pointB) {
  const dLat = toRadians(pointB.lat - pointA.lat)
  const dLng = toRadians(pointB.lng - pointA.lng)
  const lat1 = toRadians(pointA.lat)
  const lat2 = toRadians(pointB.lat)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** @param {number|null|undefined} km */
export function formatDistanceKm(km) {
  if (km == null) return null
  return `${km.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km (linha reta)`
}

/**
 * Enriquece imóveis com distanciaKm quando LOAD e imóvel têm coordenadas.
 * @param {Array} properties
 * @param {{ lat: number, lng: number }|null} loadCoordinates
 */
export function enrichWithDistance(properties, loadCoordinates) {
  if (!loadCoordinates) return properties

  return properties.map((property) => {
    if (!property.coordenadas) return { ...property, distanciaKm: null }
    return {
      ...property,
      distanciaKm: haversineKm(loadCoordinates, property.coordenadas),
    }
  })
}
