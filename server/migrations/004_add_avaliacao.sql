ALTER TABLE properties ADD COLUMN avaliacao TEXT DEFAULT NULL CHECK (avaliacao IS NULL OR avaliacao IN ('gostei', 'descartado'));

UPDATE properties SET avaliacao = 'gostei' WHERE liked = 1;
