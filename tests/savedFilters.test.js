import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { DEFAULT_FILTERS } from '../src/utils/imoveis.js'
import {
  createPreset,
  filtersEqual,
  presetMatchesCurrent,
} from '../src/utils/savedFilters.js'

describe('savedFilters', () => {
  it('filtersEqual compares all filter fields', () => {
    assert.equal(filtersEqual(DEFAULT_FILTERS, { ...DEFAULT_FILTERS }), true)
    assert.equal(
      filtersEqual(DEFAULT_FILTERS, { ...DEFAULT_FILTERS, distanciaMax: '5' }),
      false,
    )
  })

  it('createPreset stores filtros and sortBy snapshot', () => {
    const filtros = { ...DEFAULT_FILTERS, busca: 'pilates', distanciaMax: '3' }
    const preset = createPreset('Estúdio pilates', filtros, 'distancia_asc')
    assert.equal(preset.name, 'Estúdio pilates')
    assert.equal(preset.filtros.busca, 'pilates')
    assert.equal(preset.sortBy, 'distancia_asc')
    assert.ok(preset.id)
  })

  it('presetMatchesCurrent detects dirty state', () => {
    const preset = createPreset('Teste', { ...DEFAULT_FILTERS, bairro: 'Centro' }, 'preco_asc')
    assert.equal(presetMatchesCurrent(preset, { ...DEFAULT_FILTERS, bairro: 'Centro' }, 'preco_asc'), true)
    assert.equal(presetMatchesCurrent(preset, { ...DEFAULT_FILTERS, bairro: 'Boa Vista' }, 'preco_asc'), false)
  })
})
