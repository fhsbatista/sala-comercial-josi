import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { formatArea, formatAreaM2 } from '../src/utils/imoveis.js'

describe('formatArea', () => {
  it('formats numeric area in m²', () => {
    assert.equal(formatAreaM2(45), '45 m²')
    assert.equal(formatAreaM2(4500), '4.500 m²')
  })

  it('reads areaM2 from imovel object', () => {
    assert.equal(formatArea({ areaM2: 45, aluguel: 4500 }), '45 m²')
  })

  it('does not confuse aluguel with area', () => {
    assert.equal(formatArea({ areaM2: 45, aluguel: 4500 }), '45 m²')
    assert.notEqual(formatArea({ areaM2: 45, aluguel: 4500 }), '4.500 m²')
  })
})
