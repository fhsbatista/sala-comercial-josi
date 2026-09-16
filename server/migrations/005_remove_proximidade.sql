PRAGMA foreign_keys = OFF;

CREATE TABLE properties_new (
  id INTEGER PRIMARY KEY,
  imobiliaria TEXT NOT NULL,
  descricao TEXT NOT NULL,
  bairro TEXT NOT NULL,
  endereco TEXT NOT NULL,
  area_m2 REAL NOT NULL CHECK (area_m2 > 0),
  aluguel REAL NOT NULL CHECK (aluguel > 0),
  encargos TEXT,
  latitude REAL CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
  longitude REAL CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180)),
  url TEXT NOT NULL,
  tipo_url TEXT NOT NULL CHECK (tipo_url IN ('individual', 'busca')),
  status TEXT NOT NULL CHECK (status IN ('verificado', 'não verificado', 'link de busca', 'possivelmente expirado')),
  ultima_verificacao TEXT,
  observacoes TEXT,
  liked INTEGER NOT NULL DEFAULT 0 CHECK (liked IN (0, 1)),
  avaliacao TEXT DEFAULT NULL CHECK (avaliacao IS NULL OR avaliacao IN ('gostei', 'descartado')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (
    (latitude IS NULL AND longitude IS NULL) OR
    (latitude IS NOT NULL AND longitude IS NOT NULL)
  )
);

INSERT INTO properties_new (
  id, imobiliaria, descricao, bairro, endereco, area_m2, aluguel, encargos,
  latitude, longitude, url, tipo_url, status, ultima_verificacao, observacoes,
  liked, avaliacao, created_at, updated_at
)
SELECT
  id, imobiliaria, descricao, bairro, endereco, area_m2, aluguel, encargos,
  latitude, longitude, url, tipo_url, status, ultima_verificacao, observacoes,
  liked, avaliacao, created_at, updated_at
FROM properties;

DROP TABLE properties;

ALTER TABLE properties_new RENAME TO properties;

CREATE INDEX IF NOT EXISTS idx_properties_imobiliaria ON properties (imobiliaria);
CREATE INDEX IF NOT EXISTS idx_properties_bairro ON properties (bairro);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties (status);

PRAGMA foreign_keys = ON;
