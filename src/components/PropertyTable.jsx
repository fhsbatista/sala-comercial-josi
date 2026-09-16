import {
  formatAluguel,
  formatArea,
  formatCurrency,
  formatDistancia,
  getPrecoM2,
  getVerifyLabel,
  isMuitoProximo,
  STATUS_LABEL,
} from '../utils/imoveis.js'

export default function PropertyTable({ imoveis, onSelect }) {
  if (imoveis.length === 0) {
    return (
      <div className="empty-state">
        <p>Nenhum imóvel encontrado com os filtros atuais.</p>
        <p className="empty-state__hint">Tente ajustar ou limpar os filtros.</p>
      </div>
    )
  }

  return (
    <div className="table-wrapper">
      <table className="property-table">
        <thead>
          <tr>
            <th>Imóvel</th>
            <th>Bairro / Endereço</th>
            <th>Área</th>
            <th>Aluguel</th>
            <th>Preço/m²</th>
            <th>Distância da LOAD</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {imoveis.map((imovel) => {
            const precoM2 = getPrecoM2(imovel)
            const highlight = isMuitoProximo(imovel)

            return (
              <tr
                key={imovel.id}
                className={highlight ? 'property-table__row--highlight' : ''}
              >
                <td>
                  <div className="property-table__title">{imovel.descricao}</div>
                  <div className="property-table__meta">{imovel.imobiliaria}</div>
                </td>
                <td>
                  <div>{imovel.bairro}</div>
                  <div className="property-table__meta">{imovel.endereco}</div>
                </td>
                <td>{formatArea(imovel.areaM2)}</td>
                <td className="property-table__price">{formatAluguel(imovel)}</td>
                <td>{precoM2 != null ? formatCurrency(precoM2) : '—'}</td>
                <td>
                  <span className={`prox-badge prox-badge--${imovel.proximidade}`}>
                    {formatDistancia(imovel)}
                  </span>
                </td>
                <td>
                  <span className={`status-badge status-badge--${statusClass(imovel.status)}`}>
                    {STATUS_LABEL[imovel.status] ?? imovel.status}
                  </span>
                </td>
                <td>
                  <div className="actions">
                    <button
                      type="button"
                      className="btn btn--small btn--secondary"
                      onClick={() => onSelect(imovel)}
                    >
                      Ver detalhes
                    </button>
                    <a
                      href={imovel.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn--small btn--primary"
                    >
                      {getVerifyLabel(imovel)}
                    </a>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function statusClass(status) {
  switch (status) {
    case 'verificado': return 'ok'
    case 'não verificado': return 'pending'
    case 'link de busca': return 'search'
    case 'possivelmente expirado': return 'expired'
    default: return 'pending'
  }
}
