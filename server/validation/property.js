const PROXIMIDADES = ['muito_proximo', 'proximo', 'intermediario', 'mais_distante']
const TIPOS_URL = ['individual', 'busca']
const STATUS_VALIDOS = ['verificado', 'não verificado', 'link de busca', 'possivelmente expirado']

function trimOrNull(value) {
  if (value === undefined || value === null) return null
  const trimmed = String(value).trim()
  return trimmed === '' ? null : trimmed
}

function parseNumber(value, field, fields, { min, positive = false } = {}) {
  if (value === undefined || value === null || value === '') {
    fields[field] = 'Campo obrigatório'
    return null
  }
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    fields[field] = 'Deve ser um número válido'
    return null
  }
  if (positive && parsed <= 0) {
    fields[field] = 'Deve ser maior que zero'
    return null
  }
  if (min != null && parsed < min) {
    fields[field] = `Deve ser no mínimo ${min}`
    return null
  }
  return parsed
}

function parseOptionalNumber(value, field, fields, { min, max } = {}) {
  if (value === undefined || value === null || value === '') return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    fields[field] = 'Deve ser um número válido'
    return null
  }
  if (min != null && parsed < min) {
    fields[field] = `Deve ser no mínimo ${min}`
    return null
  }
  if (max != null && parsed > max) {
    fields[field] = `Deve ser no máximo ${max}`
    return null
  }
  return parsed
}

function defaultStatus(tipoUrl) {
  return tipoUrl === 'busca' ? 'link de busca' : 'não verificado'
}

export function validatePropertyInput(body, { isUpdate = false } = {}) {
  const fields = {}

  const imobiliaria = trimOrNull(body.imobiliaria)
  const descricao = trimOrNull(body.descricao)
  const bairro = trimOrNull(body.bairro)
  const endereco = trimOrNull(body.endereco)
  const url = trimOrNull(body.url)
  const encargos = trimOrNull(body.encargos)
  const ultimaVerificacao = trimOrNull(body.ultimaVerificacao)
  const observacoes = trimOrNull(body.observacoes)

  if (!imobiliaria) fields.imobiliaria = 'Campo obrigatório'
  if (!descricao) fields.descricao = 'Campo obrigatório'
  if (!bairro) fields.bairro = 'Campo obrigatório'
  if (!endereco) fields.endereco = 'Campo obrigatório'
  if (!url) {
    fields.url = 'Campo obrigatório'
  } else if (!/^https?:\/\/.+/i.test(url)) {
    fields.url = 'Deve ser uma URL HTTP(S) válida'
  }

  const areaM2 = parseNumber(body.areaM2, 'areaM2', fields, { positive: true })
  const aluguel = parseNumber(body.aluguel, 'aluguel', fields, { positive: true })

  const proximidade = trimOrNull(body.proximidade)
  if (!proximidade) {
    fields.proximidade = 'Campo obrigatório'
  } else if (!PROXIMIDADES.includes(proximidade)) {
    fields.proximidade = 'Valor inválido'
  }

  const tipoUrl = trimOrNull(body.tipoUrl)
  if (!tipoUrl) {
    fields.tipoUrl = 'Campo obrigatório'
  } else if (!TIPOS_URL.includes(tipoUrl)) {
    fields.tipoUrl = 'Valor inválido'
  }

  let status = trimOrNull(body.status)
  if (!status) {
    status = tipoUrl ? defaultStatus(tipoUrl) : null
  } else if (!STATUS_VALIDOS.includes(status)) {
    fields.status = 'Valor inválido'
  }

  if (tipoUrl === 'busca' && status && status !== 'link de busca' && !isUpdate) {
    // allow manual override but warn via consistency - plan says allow manual adjustment
  }

  const latitude = parseOptionalNumber(body.latitude, 'latitude', fields, { min: -90, max: 90 })
  const longitude = parseOptionalNumber(body.longitude, 'longitude', fields, { min: -180, max: 180 })

  const hasLat = latitude != null
  const hasLng = longitude != null
  if (hasLat !== hasLng) {
    fields.latitude = 'Latitude e longitude devem ser informadas juntas'
    fields.longitude = 'Latitude e longitude devem ser informadas juntas'
  }

  if (Object.keys(fields).length > 0) {
    return { ok: false, fields }
  }

  return {
    ok: true,
    data: {
      imobiliaria,
      descricao,
      bairro,
      endereco,
      areaM2,
      aluguel,
      encargos,
      proximidade,
      latitude: hasLat ? latitude : null,
      longitude: hasLng ? longitude : null,
      url,
      tipoUrl,
      status: status ?? defaultStatus(tipoUrl),
      ultimaVerificacao,
      observacoes,
    },
  }
}
