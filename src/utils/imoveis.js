/** @typedef {import('../data/imoveis.js').Imovel} Imovel */

/** Distância (km) usada para destacar imóveis muito próximos da LOAD na listagem. */
export const NEAR_LOAD_KM = 1.5

export const STATUS_LABEL = {
  verificado: 'Verificado',
  'não verificado': 'Não verificado',
  'link de busca': 'Link de busca',
  'possivelmente expirado': 'Possivelmente expirado',
}

export const AVALIACAO_FILTER_OPTIONS = [
  { value: 'todos', label: 'Todos' },
  { value: 'gostei', label: 'Gostei' },
  { value: 'descartado', label: 'Descartado' },
  { value: 'neutro', label: 'Neutro' },
]

export const SORT_OPTIONS = [
  { value: 'distancia_asc', label: 'Distância da LOAD (mais próximo)' },
  { value: 'preco_asc', label: 'Preço (menor)' },
  { value: 'preco_desc', label: 'Preço (maior)' },
  { value: 'area_asc', label: 'Área (menor)' },
  { value: 'area_desc', label: 'Área (maior)' },
  { value: 'preco_m2_asc', label: 'Preço/m² (menor)' },
  { value: 'preco_m2_desc', label: 'Preço/m² (maior)' },
]

/** @param {string} text */
export function normalizeText(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/** @param {Imovel} imovel */
export function getPrecoM2(imovel) {
  if (!imovel.areaM2 || imovel.areaM2 <= 0) return null
  return imovel.aluguel / imovel.areaM2
}

/** @param {number|null|undefined} value */
export function formatCurrency(value) {
  if (value == null) return '—'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** @param {number|string|null|undefined} value */
export function formatAreaM2(value) {
  if (value == null || value === '') return '—'

  let n
  if (typeof value === 'number') {
    n = value
  } else {
    const s = String(value).trim()
    if (/^\d+\.\d{1,2}$/.test(s)) n = Number(s)
    else if (/^\d+,\d{1,2}$/.test(s)) n = Number(s.replace(',', '.'))
    else if (/^\d{1,3}(\.\d{3})+$/.test(s)) n = Number(s.replace(/\./g, ''))
    else n = Number(s.replace(/\./g, '').replace(',', '.'))
  }

  if (!Number.isFinite(n)) return '—'
  const formatted = Number.isInteger(n)
    ? n.toLocaleString('pt-BR')
    : n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  return `${formatted} m²`
}

/** @param {Imovel} imovel */
export function formatArea(imovel) {
  if (imovel == null || typeof imovel !== 'object') {
    return formatAreaM2(imovel)
  }
  return formatAreaM2(imovel.areaM2)
}

/** @param {Imovel} imovel */
export function formatAluguel(imovel) {
  const base = formatCurrency(imovel.aluguel)
  return imovel.encargos ? `${base} ${imovel.encargos}` : base
}

/** @param {Imovel} imovel */
export function formatDistancia(imovel) {
  if (imovel.distanciaKm != null) {
    return `${imovel.distanciaKm.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`
  }
  return '—'
}

/** @param {Imovel[]} lista */
export function getUniqueValues(lista, field) {
  return [...new Set(lista.map((i) => i[field]))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR'),
  )
}

/**
 * @param {Imovel[]} lista
 * @param {object} filtros
 */
export function filterImoveis(lista, filtros) {
  const {
    busca = '',
    imobiliaria = '',
    bairro = '',
    aluguelMin = '',
    aluguelMax = '',
    areaMin = '',
    areaMax = '',
    status = '',
    avaliacao = 'todos',
    distanciaMax = '',
  } = filtros

  const buscaNorm = normalizeText(busca.trim())

  return lista.filter((imovel) => {
    if (buscaNorm) {
      const haystack = normalizeText(
        [imovel.imobiliaria, imovel.descricao, imovel.bairro, imovel.endereco].join(' '),
      )
      if (!haystack.includes(buscaNorm)) return false
    }

    if (imobiliaria && imovel.imobiliaria !== imobiliaria) return false
    if (bairro && imovel.bairro !== bairro) return false
    if (status && imovel.status !== status) return false
    if (avaliacao === 'gostei' && imovel.avaliacao !== 'gostei') return false
    if (avaliacao === 'descartado' && imovel.avaliacao !== 'descartado') return false
    if (avaliacao === 'neutro' && imovel.avaliacao != null) return false

    if (aluguelMin !== '' && imovel.aluguel < Number(aluguelMin)) return false
    if (aluguelMax !== '' && imovel.aluguel > Number(aluguelMax)) return false
    if (areaMin !== '' && imovel.areaM2 < Number(areaMin)) return false
    if (areaMax !== '' && imovel.areaM2 > Number(areaMax)) return false

    if (distanciaMax !== '') {
      const maxKm = Number(distanciaMax)
      if (imovel.distanciaKm == null || imovel.distanciaKm > maxKm) return false
    }

    return true
  })
}

/**
 * @param {Imovel[]} lista
 * @param {string} sortBy
 */
export function sortImoveis(lista, sortBy) {
  const sorted = [...lista]

  sorted.sort((a, b) => {
    switch (sortBy) {
      case 'distancia_asc': {
        const distA = a.distanciaKm
        const distB = b.distanciaKm
        if (distA == null && distB == null) return a.id - b.id
        if (distA == null) return 1
        if (distB == null) return -1
        if (distA !== distB) return distA - distB
        return a.id - b.id
      }
      case 'preco_asc':
        return a.aluguel - b.aluguel || a.id - b.id
      case 'preco_desc':
        return b.aluguel - a.aluguel || a.id - b.id
      case 'area_asc':
        return a.areaM2 - b.areaM2 || a.id - b.id
      case 'area_desc':
        return b.areaM2 - a.areaM2 || a.id - b.id
      case 'preco_m2_asc': {
        const pmA = getPrecoM2(a)
        const pmB = getPrecoM2(b)
        if (pmA == null && pmB == null) return a.id - b.id
        if (pmA == null) return 1
        if (pmB == null) return -1
        return pmA - pmB || a.id - b.id
      }
      case 'preco_m2_desc': {
        const pmA = getPrecoM2(a)
        const pmB = getPrecoM2(b)
        if (pmA == null && pmB == null) return a.id - b.id
        if (pmA == null) return 1
        if (pmB == null) return -1
        return pmB - pmA || a.id - b.id
      }
      default:
        return a.id - b.id
    }
  })

  return sorted
}

/** @param {Imovel[]} lista */
export function computeIntegrityStats(lista) {
  const imobiliarias = new Set(lista.map((i) => i.imobiliaria))
  return {
    total: lista.length,
    urlsIndividuais: lista.filter((i) => i.tipoUrl === 'individual').length,
    linksBusca: lista.filter((i) => i.tipoUrl === 'busca').length,
    verificados: lista.filter((i) => i.status === 'verificado').length,
    naoVerificados: lista.filter((i) => i.status !== 'verificado').length,
    imobiliarias: imobiliarias.size,
  }
}

/** @param {Imovel[]} lista */
export function computeSummaryStats(lista) {
  if (lista.length === 0) {
    return { total: 0, menorAluguel: null, maiorArea: null, proximosLoad: 0 }
  }

  return {
    total: lista.length,
    menorAluguel: Math.min(...lista.map((i) => i.aluguel)),
    maiorArea: Math.max(...lista.map((i) => i.areaM2)),
    proximosLoad: lista.filter(
      (i) => i.distanciaKm != null && i.distanciaKm <= NEAR_LOAD_KM,
    ).length,
  }
}

/** @param {Imovel} imovel */
export function getVerifyLabel(imovel) {
  return imovel.tipoUrl === 'busca' ? 'Abrir busca da imobiliária' : 'Verificar anúncio'
}

/** @param {Imovel} imovel @param {number} [maxKm] */
export function isNearLoad(imovel, maxKm = NEAR_LOAD_KM) {
  return imovel.distanciaKm != null && imovel.distanciaKm <= maxKm
}

/** @param {Imovel} imovel */
export function formatAvaliacao(imovel) {
  if (imovel.avaliacao === 'gostei') return '♥'
  if (imovel.avaliacao === 'descartado') return '✕'
  return '—'
}

export const DEFAULT_FILTERS = {
  busca: '',
  imobiliaria: '',
  bairro: '',
  aluguelMin: '',
  aluguelMax: '',
  areaMin: '',
  areaMax: '',
  status: '',
  avaliacao: 'todos',
  distanciaMax: '',
}
