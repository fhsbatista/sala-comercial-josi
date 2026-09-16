async function handleResponse(response) {
  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(body.error || 'Erro na requisição')
    error.fields = body.fields
    error.status = response.status
    throw error
  }

  return body.data
}

export async function fetchProperties() {
  const response = await fetch('/api/properties')
  return handleResponse(response)
}

export async function fetchProperty(id) {
  const response = await fetch(`/api/properties/${id}`)
  return handleResponse(response)
}

export async function createProperty(payload) {
  const response = await fetch('/api/properties', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse(response)
}

export async function deleteProperty(id) {
  const response = await fetch(`/api/properties/${id}`, { method: 'DELETE' })
  return handleResponse(response)
}

/** @param {number|string} id @param {'gostei'|'descartado'|null} avaliacao */
export async function updatePropertyAvaliacao(id, avaliacao) {
  const response = await fetch(`/api/properties/${id}/avaliacao`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ avaliacao }),
  })
  return handleResponse(response)
}

export async function fetchAppConfig() {
  const response = await fetch('/api/config')
  return handleResponse(response)
}
