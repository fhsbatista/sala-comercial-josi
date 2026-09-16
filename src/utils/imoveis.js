/** @typedef {import('../data/imoveis.js').Imovel} Imovel */

export const PROXIMIDADE_RANK = {
  muito_proximo: 0,
  proximo: 1,
  intermediario: 2,
  mais_distante: 3,
}

export const PROXIMIDADE_LABEL = {
  muito_proximo: 'Muito próximo',
  proximo: 'Próximo',
  intermediario: 'Intermediário',
  mais_distante: 'Mais distante',
}

export const PROXIMIDADE_EMOJI = {
  muito_proximo: '🟢',
  proximo: '🟡',
  intermediario: '🟠',
  mais_distante: '🔴',
}

export const STATUS_LABEL = {
  verificado: 'Verificado',
  'não verificado': 'Não verificado',
  'link de busca': 'Link de busca',
  'possivelmente expirado': 'Possivelmente expirado',
}

export const SORT_OPTIONS = [
  { value: 'proximidade_asc', label: 'Proximidade da LOAD (mais próximo)' },
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

/** @param {number|null|undefined} value */
export function formatArea(value) {
  if (value == null) return '—'
  const formatted = Number.isInteger(value)
    ? value.toLocaleString('pt-BR')
    : value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  return `${formatted} m²`
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
  return `${PROXIMIDADE_EMOJI[imovel.proximidade]} ${PROXIMIDADE_LABEL[imovel.proximidade]}`
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

    if (aluguelMin !== '' && imovel.aluguel < Number(aluguelMin)) return false
    if (aluguelMax !== '' && imovel.aluguel > Number(aluguelMax)) return false
    if (areaMin !== '' && imovel.areaM2 < Number(areaMin)) return false
    if (areaMax !== '' && imovel.areaM2 > Number(areaMax)) return false

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
      case 'proximidade_asc': {
        const distA = a.distanciaKm != null
          ? a.distanciaKm
          : 1000 + PROXIMIDADE_RANK[a.proximidade]
        const distB = b.distanciaKm != null
          ? b.distanciaKm
          : 1000 + PROXIMIDADE_RANK[b.proximidade]
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
    return { total: 0, menorAluguel: null, maiorArea: null, muitoProximos: 0 }
  }

  return {
    total: lista.length,
    menorAluguel: Math.min(...lista.map((i) => i.aluguel)),
    maiorArea: Math.max(...lista.map((i) => i.areaM2)),
    muitoProximos: lista.filter((i) => i.proximidade === 'muito_proximo').length,
  }
}

/** @param {Imovel} imovel */
export function getVerifyLabel(imovel) {
  return imovel.tipoUrl === 'busca' ? 'Abrir busca da imobiliária' : 'Verificar anúncio'
}

/** @param {Imovel} imovel */
export function isMuitoProximo(imovel) {
  return imovel.proximidade === 'muito_proximo'
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
}
