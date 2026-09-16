/** Utilitários compartilhados de geocodificação para importação em lote. */

export const LOAD_DEFAULT = { lat: -20.826422092367583, lng: -49.39255542572019 }

const AGENCY_PATTERNS = [
  /R\.?\s*Antônio de Godoy,\s*3825/i,
  /Avenida Francisco das Chagas Oliveira,\s*1260/i,
]

const STREET_PATTERN =
  /\b(Rua|R\.|Av\.|Avenida|Rodovia|Alameda|Travessa|Estrada)\b/i

export function haversineKm(a, b) {
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

export function classifyProximidade(km) {
  if (km <= 1.5) return 'muito_proximo'
  if (km <= 4) return 'proximo'
  if (km <= 8) return 'intermediario'
  return 'mais_distante'
}

export function isAgencyAddress(endereco) {
  if (!endereco) return false
  return AGENCY_PATTERNS.some((re) => re.test(endereco))
}

/** Endereço com logradouro (rua/avenida etc.), não só bairro+cidade. */
export function isExactAddress(endereco) {
  if (!endereco || isAgencyAddress(endereco)) return false
  if (/^[^-]+-\s*São José do Rio Preto\s*$/i.test(endereco.trim())) return false
  return STREET_PATTERN.test(endereco)
}

export function upsertCoordObservacao(observacoes, coordNote, proxNote) {
  let base = (observacoes ?? '').trim()
  base = base
    .replace(/Coordenadas:[^.]*(\.\s*)?/gi, '')
    .replace(/Proximidade (derivada|estimada)[^.]*(\.\s*)?/gi, '')
    .trim()
  const parts = [base, coordNote, proxNote].filter(Boolean)
  return parts.join('. ').replace(/\.\s*\./g, '.')
}

export async function geocodeQuery(query, cache, { sleep, ua = 'sala-comercial-josi/1.0' }) {
  const key = query.toLowerCase()
  if (cache.has(key)) return cache.get(key)

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
  await sleep(1100)
  const res = await fetch(url, { headers: { 'User-Agent': ua } })
  if (!res.ok) {
    cache.set(key, null)
    return null
  }
  const data = await res.json()
  const hit = data[0]
  const result = hit ? { lat: Number(hit.lat), lng: Number(hit.lon) } : null
  cache.set(key, result)
  return result
}

/**
 * Prioridade: (1) coords do anúncio, (2) endereço exato geocodificado, (3) centro do bairro.
 */
export async function resolveCoordinates(parsed, { cache, load = LOAD_DEFAULT, sleep }) {
  let { latitude, longitude, endereco, bairro, observacoes } = parsed

  if (latitude != null && longitude != null) {
    const km = haversineKm(load, { lat: latitude, lng: longitude })
    const prox = classifyProximidade(km)
    observacoes = upsertCoordObservacao(
      observacoes,
      parsed.coordNote ?? 'Coordenadas: anúncio',
      `Proximidade derivada em linha reta (${km.toFixed(2)} km da LOAD)`,
    )
    return { latitude, longitude, proximidade: prox, observacoes }
  }

  if (isExactAddress(endereco)) {
    const q = `${endereco}, São José do Rio Preto, SP, Brasil`
    const point = await geocodeQuery(q, cache, { sleep })
    if (point) {
      const km = haversineKm(load, point)
      const prox = classifyProximidade(km)
      observacoes = upsertCoordObservacao(
        observacoes,
        'Coordenadas: endereço exato geocodificado (Nominatim)',
        `Proximidade derivada em linha reta (${km.toFixed(2)} km da LOAD)`,
      )
      return {
        latitude: point.lat,
        longitude: point.lng,
        proximidade: prox,
        observacoes,
      }
    }
  }

  const q = `${bairro}, São José do Rio Preto, SP, Brasil`
  const point = await geocodeQuery(q, cache, { sleep })
  if (point) {
    const km = haversineKm(load, point)
    const prox = classifyProximidade(km)
    observacoes = upsertCoordObservacao(
      observacoes,
      'Coordenadas: centro aproximado do bairro (Nominatim)',
      `Proximidade derivada em linha reta (${km.toFixed(2)} km da LOAD)`,
    )
    return {
      latitude: point.lat,
      longitude: point.lng,
      proximidade: prox,
      observacoes,
    }
  }

  observacoes = upsertCoordObservacao(
    observacoes,
    null,
    'Proximidade: intermediario (sem geocodificação)',
  )
  return { latitude: null, longitude: null, proximidade: 'intermediario', observacoes }
}
