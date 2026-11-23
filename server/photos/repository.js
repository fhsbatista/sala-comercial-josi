/** @param {import('better-sqlite3').Database} db */
export function replacePropertyPhotos(db, propertyId, urls) {
  const deleteStmt = db.prepare('DELETE FROM property_photos WHERE property_id = ?')
  const insert = db.prepare(
    `INSERT INTO property_photos (property_id, url, position)
     VALUES (@property_id, @url, @position)`,
  )

  const tx = db.transaction((id, photoUrls) => {
    deleteStmt.run(id)
    photoUrls.forEach((url, position) => {
      insert.run({ property_id: id, url, position })
    })
  })

  tx(propertyId, urls)
}

/** @param {import('better-sqlite3').Database} db */
export function getPhotosForProperties(db, propertyIds) {
  if (propertyIds.length === 0) return new Map()

  const placeholders = propertyIds.map(() => '?').join(', ')
  const rows = db.prepare(
    `SELECT property_id, url, position
     FROM property_photos
     WHERE property_id IN (${placeholders})
     ORDER BY property_id ASC, position ASC`,
  ).all(...propertyIds)

  /** @type {Map<number, string[]>} */
  const map = new Map()
  for (const row of rows) {
    const list = map.get(row.property_id) ?? []
    list.push(row.url)
    map.set(row.property_id, list)
  }

  return map
}

/** @param {import('better-sqlite3').Database} db */
export function getAllPhotosGrouped(db) {
  const rows = db.prepare(
    `SELECT property_id, url, position
     FROM property_photos
     ORDER BY property_id ASC, position ASC`,
  ).all()

  /** @type {Map<number, string[]>} */
  const map = new Map()
  for (const row of rows) {
    const list = map.get(row.property_id) ?? []
    list.push(row.url)
    map.set(row.property_id, list)
  }

  return map
}