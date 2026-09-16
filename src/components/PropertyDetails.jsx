import { useEffect, useRef } from 'react'
import {
  formatAluguel,
  formatArea,
  formatCurrency,
  formatDistancia,
  getPrecoM2,
  getVerifyLabel,
  PROXIMIDADE_LABEL,
  STATUS_LABEL,
} from '../utils/imoveis.js'

export default function PropertyDetails({ imovel, onClose }) {
  const dialogRef = useRef(null)
  const closeBtnRef = useRef(null)

  useEffect(() => {
    closeBtnRef.current?.focus()

    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  if (!imovel) return null

  const precoM2 = getPrecoM2(imovel)

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal__header">
          <div>
            <h2 id="modal-title">{imovel.descricao}</h2>
            <p className="modal__subtitle">{imovel.imobiliaria} · ID {imovel.id}</p>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Fechar detalhes"
          >
            ×
          </button>
        </header>

        <div className="modal__body">
          <dl className="detail-list">
            <DetailItem label="Imobiliária" value={imovel.imobiliaria} />
            <DetailItem label="Descrição" value={imovel.descricao} />
            <DetailItem label="Bairro" value={imovel.bairro} />
            <DetailItem label="Endereço" value={imovel.endereco} />
            <DetailItem label="Área" value={formatArea(imovel.areaM2)} />
            <DetailItem label="Aluguel" value={formatAluguel(imovel)} highlight />
            <DetailItem
              label="Preço por m²"
              value={precoM2 != null ? formatCurrency(precoM2) : '—'}
            />
            <DetailItem
              label="Distância da LOAD Facility"
              value={formatDistancia(imovel)}
            />
            <DetailItem
              label="Classificação aproximada"
              value={PROXIMIDADE_LABEL[imovel.proximidade]}
            />
            <DetailItem
              label="Distância exata (km)"
              value={imovel.distanciaKm != null ? `${imovel.distanciaKm} km` : 'Não disponível'}
            />
            <DetailItem
              label="Coordenadas"
              value={
                imovel.coordenadas
                  ? `${imovel.coordenadas.lat}, ${imovel.coordenadas.lng}`
                  : 'Não disponível'
              }
            />
            <DetailItem label="Status" value={STATUS_LABEL[imovel.status] ?? imovel.status} />
            <DetailItem
              label="Tipo de URL"
              value={imovel.tipoUrl === 'individual' ? 'Anúncio individual' : 'Página de busca'}
            />
            <DetailItem
              label="Última verificação"
              value={imovel.ultimaVerificacao ?? 'Não verificado'}
            />
            {imovel.observacoes && (
              <DetailItem label="Observações" value={imovel.observacoes} />
            )}
          </dl>

          <div className="modal__notice">
            <strong>Aviso de auditoria:</strong> este registro é uma fotografia da pesquisa
            realizada em 16/09/2026. Disponibilidade, preços e links podem ter mudado desde então.
          </div>
        </div>

        <footer className="modal__footer">
          <a
            href={imovel.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--primary"
          >
            {getVerifyLabel(imovel)}
          </a>
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Fechar
          </button>
        </footer>
      </div>
    </div>
  )
}

function DetailItem({ label, value, highlight = false }) {
  return (
    <div className="detail-list__item">
      <dt>{label}</dt>
      <dd className={highlight ? 'detail-list__value--highlight' : ''}>{value}</dd>
    </div>
  )
}
