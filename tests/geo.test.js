import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { haversineKm, formatDistanceKm } from '../src/utils/geo.js'

describe('haversineKm', () => {
  it('calculates known distance between two points', () => {
    const saoPaulo = { lat: -23.5505, lng: -46.6333 }
    const rio = { lat: -22.9068, lng: -43.1729 }
    const distance = haversineKm(saoPaulo, rio)
    assert.ok(distance > 350 && distance < 370)
  })

  it('returns zero for same point', () => {
    const point = { lat: -20.81, lng: -49.37 }
    assert.equal(haversineKm(point, point), 0)
  })
})

describe('formatDistanceKm', () => {
  it('formats with km label', () => {
    const formatted = formatDistanceKm(1.234)
    assert.match(formatted, /1,23 km \(linha reta\)/)
  })

  it('returns null for missing value', () => {
    assert.equal(formatDistanceKm(null), null)
  })
})
