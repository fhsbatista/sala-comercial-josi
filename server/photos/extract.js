const OCI_HOST = 'objectstorage.sa-vinhedo-1.oci.customer-oci.com'

/** @param {string} html */
export function extractPhotoUrlsFromHtml(html) {
  if (!html || html.includes('Just a moment')) return []

  const found = new Set()

  const patterns = [
    /https:\/\/axvliw1bcpyx\.objectstorage[^"'\\\s<>)]+?\.(?:jpe?g|webp|png)/gi,
    /https?:\/\/[^"'\\\s<>)]+\.(?:jpe?g|webp|png)(?:\?[^"'\\\s<>)]*)?/gi,
  ]

  for (const re of patterns) {
    for (const match of html.matchAll(re)) {
      const url = normalizePhotoUrl(match[0])
      if (isLikelyPropertyPhoto(url)) found.add(url)
    }
  }

  return [...found]
}

/** @param {string} url */
function normalizePhotoUrl(url) {
  return url.replace(/&amp;/g, '&').trim()
}

/** @param {string} url */
function isLikelyPropertyPhoto(url) {
  if (!url) return false
  if (!/^https?:\/\//i.test(url)) return false
  if (/logo|icon|sprite|banner|whatsapp|facebook|favicon|pixel|challenge|flag-icon/i.test(url)) {
    return false
  }
  if (url.includes(OCI_HOST)) return true
  return /\/(foto|fotos|imagem|imoveis|uploads)\//i.test(url)
}

/** @param {string} url */
export function extractListingCode(url) {
  return url.match(/\/(\d+)\/?(?:\?|#|$)/)?.[1] ?? null
}

/** @param {string} seedUrl */
export async function expandSequentialGallery(seedUrl, { maxExtra = 12 } = {}) {
  const match = seedUrl.match(
    /^(.+\/foto_\/\d{4}\/\d+\/.+?)-(\d+)\.(jpe?g|webp|png)$/i,
  )
  if (!match) return [seedUrl]

  const [, prefix, startIndex, ext] = match
  const start = Number(startIndex)
  const urls = []

  for (let i = start; i < start + maxExtra; i += 1) {
    const candidate = `${prefix}-${i}.${ext}`
    const ok = await photoUrlExists(candidate)
    if (!ok) break
    urls.push(candidate)
  }

  return urls.length > 0 ? urls : [seedUrl]
}

/** @param {string} url */
async function photoUrlExists(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    if (res.ok) return true
    if (res.status === 405) {
      const getRes = await fetch(url, { method: 'GET', redirect: 'follow' })
      return getRes.ok
    }
    return false
  } catch {
    return false
  }
}

/** @param {string} html @param {string} listingUrl */
export async function extractAndExpandPhotos(html, listingUrl) {
  const extracted = extractPhotoUrlsFromHtml(html)
  const expanded = new Set()

  for (const url of extracted) {
    const sequence = await expandSequentialGallery(url)
    for (const item of sequence) expanded.add(item)
  }

  return [...expanded]
}