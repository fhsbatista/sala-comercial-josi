import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isValidCoordinate, partitionByValidCoordinates } from '../src/utils/mapCoordinates.js'

describe('isValidCoordinate', () => {
  it('accepts valid lat/lng within bounds', () => {
    assert.equal(isValidCoordinate({ lat: -20.81, lng: -49.37 }), true)
    assert.equal(isValidCoordinate({ lat: 0, lng: 0 }), true)
    assert.equal(isValidCoordinate({ lat: 90, lng: -180 }), true)
  })

  it('rejects out-of-range coordinates', () => {
    assert.equal(isValidCoordinate({ lat: 91, lng: 0 }), false)
    assert.equal(isValidCoordinate({ lat: -90.1, lng: 0 }), false)
    assert.equal(isValidCoordinate({ lat: 0, lng: 181 }), false)
    assert.equal(isValidCoordinate({ lat: 0, lng: -180.1 }), false)
  })

  it('rejects non-numeric or missing values', () => {
    assert.equal(isValidCoordinate(null), false)
    assert.equal(isValidCoordinate(undefined), false)
    assert.equal(isValidCoordinate({ lat: 'x', lng: 1 }), false)
    assert.equal(isValidCoordinate({ lat: NaN, lng: 0 }), false)
    assert.equal(isValidCoordinate({ lat: Infinity, lng: 0 }), false)
    assert.equal(isValidCoordinate({ lat: 0 }), false)
  })
})

describe('partitionByValidCoordinates', () => {
  it('splits imoveis by coordinate validity', () => {
    const imoveis = [
      { id: 1, coordenadas: { lat: -20.81, lng: -49.37 } },
      { id: 2, coordenadas: null },
      { id: 3, coordenadas: { lat: 100, lng: 0 } },
      { id: 4, coordenadas: { lat: -21, lng: -49 } },
    ]

    const { withCoordinates, withoutCoordinates } = partitionByValidCoordinates(imoveis)

    assert.deepEqual(withCoordinates.map((i) => i.id), [1, 4])
    assert.deepEqual(withoutCoordinates.map((i) => i.id), [2, 3])
  })

  it('returns empty arrays for empty input', () => {
    const { withCoordinates, withoutCoordinates } = partitionByValidCoordinates([])
    assert.equal(withCoordinates.length, 0)
    assert.equal(withoutCoordinates.length, 0)
  })
})
