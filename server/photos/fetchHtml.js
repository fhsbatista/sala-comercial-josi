const DEFAULT_UA = 'Mozilla/5.0 (compatible; sala-comercial-josi/1.0)'

/** @param {string} url @param {number} [retries] */
export async function fetchListingHtml(url, retries = 3) {
  let lastError = null

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': DEFAULT_UA,
          Accept: 'text/html,application/xhtml+xml',
        },
        redirect: 'follow',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const buf = await res.arrayBuffer()
      const html = new TextDecoder('latin1').decode(buf)
      if (html.includes('Just a moment')) throw new Error('Cloudflare challenge')
      return html
    } catch (err) {
      lastError = err
      await sleep(500 * attempt)
    }
  }

  throw lastError ?? new Error('Falha ao buscar anúncio')
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}