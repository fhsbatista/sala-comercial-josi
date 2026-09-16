import assert from 'node:assert/strict'
import { imoveis } from '../src/data/imoveis.js'

const PROXIMIDADES = ['muito_proximo', 'proximo', 'intermediario', 'mais_distante']
const TIPOS_URL = ['individual', 'busca']
const STATUS_VALIDOS = ['verificado', 'não verificado', 'link de busca', 'possivelmente expirado']
const CAMPOS_OBRIGATORIOS = [
  'id', 'imobiliaria', 'descricao', 'bairro', 'endereco',
  'areaM2', 'aluguel', 'proximidade', 'url', 'tipoUrl', 'status',
]

assert.equal(imoveis.length, 28, 'A base deve conter exatamente 28 imóveis')

const ids = imoveis.map((i) => i.id)
assert.equal(new Set(ids).size, 28, 'IDs devem ser únicos')
for (let i = 1; i <= 28; i++) {
  assert.ok(ids.includes(i), `ID ${i} ausente da base`)
}

const souzaBarros = imoveis.filter((i) => i.endereco === 'Rua Souza Barros')
assert.equal(souzaBarros.length, 3, 'Devem existir 3 registros separados na Rua Souza Barros')
assert.deepEqual(
  souzaBarros.map((i) => i.id).sort(),
  [26, 27, 28],
  'IDs 26, 27 e 28 devem permanecer separados',
)

for (const imovel of imoveis) {
  for (const campo of CAMPOS_OBRIGATORIOS) {
    assert.ok(
      imovel[campo] !== undefined && imovel[campo] !== null && imovel[campo] !== '',
      `Imóvel ${imovel.id}: campo "${campo}" ausente ou vazio`,
    )
  }

  assert.ok(imovel.areaM2 > 0, `Imóvel ${imovel.id}: área deve ser maior que zero`)
  assert.ok(imovel.aluguel > 0, `Imóvel ${imovel.id}: aluguel deve ser positivo`)
  assert.ok(PROXIMIDADES.includes(imovel.proximidade), `Imóvel ${imovel.id}: proximidade inválida`)
  assert.ok(TIPOS_URL.includes(imovel.tipoUrl), `Imóvel ${imovel.id}: tipoUrl inválido`)
  assert.ok(STATUS_VALIDOS.includes(imovel.status), `Imóvel ${imovel.id}: status inválido`)
  assert.ok(imovel.url.startsWith('http'), `Imóvel ${imovel.id}: URL inválida`)

  if (imovel.tipoUrl === 'individual') {
    assert.notEqual(
      imovel.status,
      'link de busca',
      `Imóvel ${imovel.id}: URL individual não deve ter status "link de busca"`,
    )
  }

  if (imovel.tipoUrl === 'busca') {
    assert.equal(
      imovel.status,
      'link de busca',
      `Imóvel ${imovel.id}: URL de busca deve ter status "link de busca"`,
    )
  }

  assert.equal(imovel.distanciaKm, null, `Imóvel ${imovel.id}: distanciaKm deve ser null (não inventar)`)
  assert.equal(imovel.coordenadas, null, `Imóvel ${imovel.id}: coordenadas devem ser null (não inventar)`)
}

const individuais = imoveis.filter((i) => i.tipoUrl === 'individual')
const busca = imoveis.filter((i) => i.tipoUrl === 'busca')
assert.equal(individuais.length, 9, 'Devem existir 9 URLs individuais')
assert.equal(busca.length, 19, 'Devem existir 19 links de busca')

const imobiliarias = new Set(imoveis.map((i) => i.imobiliaria))
assert.equal(imobiliarias.size, 10, 'Devem existir 10 imobiliárias representadas')

console.log('Validação da base concluída com sucesso: 28 imóveis, 9 URLs individuais, 19 links de busca, 10 imobiliárias.')
