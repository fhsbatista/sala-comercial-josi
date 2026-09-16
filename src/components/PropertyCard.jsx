import { Link } from 'react-router-dom'
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

export default function PropertyCard({ imovel }) {
  const precoM2 = getPrecoM2(imovel)
  const highlight = isMuitoProximo(imovel)

  return (
    <article className={`property-card${highlight ? ' property-card--highlight' : ''}`}>
      <header className="property-card__header">
        <div>
          <h3>{imovel.descricao}</h3>
          <p className="property-card__meta">{imovel.imobiliaria}</p>
        </div>
        <span className={`status-badge status-badge--${statusClass(imovel.status)}`}>
          {STATUS_LABEL[imovel.status] ?? imovel.status}
        </span>
      </header>

      <dl className="property-card__details">
        <div>
          <dt>Bairro</dt>
          <dd>{imovel.bairro}</dd>
        </div>
        <div>
          <dt>Endereço</dt>
          <dd>{imovel.endereco}</dd>
        </div>
        <div>
          <dt>Área</dt>
          <dd>{formatArea(imovel.areaM2)}</dd>
        </div>
        <div>
          <dt>Aluguel</dt>
          <dd className="property-card__price">{formatAluguel(imovel)}</dd>
        </div>
        <div>
          <dt>Preço/m²</dt>
          <dd>{precoM2 != null ? formatCurrency(precoM2) : '—'}</dd>
        </div>
        <div>
          <dt>Distância da LOAD</dt>
          <dd>
            <span className={`prox-badge prox-badge--${imovel.proximidade}`}>
              {formatDistancia(imovel)}
            </span>
          </dd>
        </div>
      </dl>

      <div className="property-card__actions">
        <Link to={`/imoveis/${imovel.id}`} className="btn btn--secondary">
          Ver detalhes
        </Link>
        <a
          href={imovel.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn--primary"
        >
          {getVerifyLabel(imovel)}
        </a>
      </div>
    </article>
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
