CREATE TABLE IF NOT EXISTS property_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  UNIQUE (property_id, url)
);

CREATE INDEX IF NOT EXISTS idx_property_photos_property_id
  ON property_photos (property_id, position);