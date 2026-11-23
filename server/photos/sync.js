import { getDb } from '../db.js'
import { fetchListingHtml } from './fetchHtml.js'
import { extractAndExpandPhotos, expandSequentialGallery } from './extract.js'
import { replacePropertyPhotos } from './repository.js'

/** @param {{ id: number, url: string, descricao?: string }} property */
export async function syncPhotosForProperty(property, { seedUrls = [] } = {}) {
  let photoUrls = []

  try {
    const html = await fetchListingHtml(property.url)
    photoUrls = await extractAndExpandPhotos(html, property.url)
  } catch {
    photoUrls = []
  }

  if (photoUrls.length === 0 && seedUrls.length > 0) {
    const expanded = new Set()
    for (const seed of seedUrls) {
      const items = await expandSequentialGallery(seed)
      for (const item of items) expanded.add(item)
    }
    photoUrls = [...expanded]
  }

  const db = getDb()
  replacePropertyPhotos(db, property.id, photoUrls)
  return photoUrls
}