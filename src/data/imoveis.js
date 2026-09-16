/** Metadados públicos exibidos na aplicação (referência LOAD, etc.). */
export const META = {
  referencia: {
    nome: 'LOAD Facility',
    endereco: 'Rua Antônio de Godoy, 51-91',
    bairro: 'Nova Redentora',
    cidade: 'São José do Rio Preto – SP',
  },
}

/**
 * @typedef {Object} Imovel
 * @property {number} id
 * @property {string} imobiliaria
 * @property {string} descricao
 * @property {string} bairro
 * @property {string} endereco
 * @property {number} areaM2
 * @property {number} aluguel
 * @property {string|null} encargos
 * @property {number|null} distanciaKm
 * @property {'gostei'|'descartado'|null} [avaliacao]
 * @property {{ lat: number, lng: number }|null} coordenadas
 * @property {string} url
 * @property {'individual'|'busca'} tipoUrl
 * @property {'verificado'|'não verificado'|'link de busca'|'possivelmente expirado'} status
 * @property {string|null} ultimaVerificacao
 * @property {string|null} observacoes
 */
