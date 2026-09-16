/** @param {object} row */
export function rowToProperty(row) {
  if (!row) return null

  const hasCoords = row.latitude != null && row.longitude != null

  return {
    id: row.id,
    imobiliaria: row.imobiliaria,
    descricao: row.descricao,
    bairro: row.bairro,
    endereco: row.endereco,
    areaM2: row.area_m2,
    aluguel: row.aluguel,
    encargos: row.encargos,
    proximidade: row.proximidade,
    latitude: row.latitude,
    longitude: row.longitude,
    coordenadas: hasCoords ? { lat: row.latitude, lng: row.longitude } : null,
    url: row.url,
    tipoUrl: row.tipo_url,
    status: row.status,
    ultimaVerificacao: row.ultima_verificacao,
    observacoes: row.observacoes,
    liked: Boolean(row.liked),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** @param {object} property */
export function propertyToRow(property) {
  return {
    imobiliaria: property.imobiliaria,
    descricao: property.descricao,
    bairro: property.bairro,
    endereco: property.endereco,
    area_m2: property.areaM2,
    aluguel: property.aluguel,
    encargos: property.encargos ?? null,
    proximidade: property.proximidade,
    latitude: property.latitude ?? null,
    longitude: property.longitude ?? null,
    url: property.url,
    tipo_url: property.tipoUrl,
    status: property.status,
    ultima_verificacao: property.ultimaVerificacao ?? null,
    observacoes: property.observacoes ?? null,
    liked: property.liked ? 1 : 0,
  }
}
