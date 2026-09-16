import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  deleteProperty,
  fetchAppConfig,
  fetchProperty,
  updatePropertyAvaliacao,
} from '../api/properties.js'
import PropertyMap from '../components/PropertyMap.jsx'
import { formatDistanceKm, haversineKm } from '../utils/geo.js'
import {
  formatAluguel,
  formatArea,
  formatCurrency,
  formatDistancia,
  getPrecoM2,
  getVerifyLabel,
  STATUS_LABEL,
} from '../utils/imoveis.js'

export default function PropertyDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [property, setProperty] = useState(null)
  const [appConfig, setAppConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [updatingAvaliacao, setUpdatingAvaliacao] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [prop, config] = await Promise.all([
        fetchProperty(id),
        fetchAppConfig(),
      ])
      setProperty(prop)
      setAppConfig(config)
    } catch (err) {
      setError(err.status === 404 ? 'Imóvel não encontrado' : err.message || 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleDelete() {
    if (!property) return

    const confirmed = window.confirm(
      `Excluir o imóvel "${property.descricao}" (ID ${property.id})?\n\nEsta ação não pode ser desfeita.`,
    )
    if (!confirmed) return

    setDeleting(true)
    setError(null)
    try {
      await deleteProperty(property.id)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Erro ao excluir imóvel')
      setDeleting(false)
    }
  }

  async function handleAvaliacao(nextAvaliacao) {
    if (!property) return

    setUpdatingAvaliacao(true)
    setError(null)
    try {
      const updated = await updatePropertyAvaliacao(property.id, nextAvaliacao)
      setProperty(updated)
    } catch (err) {
      setError(err.message || 'Erro ao atualizar avaliação')
    } finally {
      setUpdatingAvaliacao(false)
    }
  }

  function toggleAvaliacao(target) {
    if (!property) return
    const next = property.avaliacao === target ? null : target
    handleAvaliacao(next)
  }

  const distanceKm = useMemo(() => {
    if (!property?.coordenadas || !appConfig?.loadCoordinates) return null
    return haversineKm(appConfig.loadCoordinates, property.coordenadas)
  }, [property, appConfig])

  if (loading) {
    return <main className="main"><div className="loading-state">Carregando detalhes...</div></main>
  }

  if (error || !property) {
    return (
      <main className="main">
        <div className="error-state">
          <p>{error || 'Imóvel não encontrado'}</p>
          <Link to="/" className="btn btn--primary">Voltar para imóveis</Link>
        </div>
      </main>
    )
  }

  const precoM2 = getPrecoM2(property)
  const canShowMap = property.coordenadas && appConfig?.loadCoordinates

  return (
    <main className="main">
      <section className="page-section details-page">
        <div className="details-page__header">
          <div>
            <Link to="/" className="details-page__back">← Voltar para imóveis</Link>
            <h1>
              {property.avaliacao === 'gostei' && (
                <span className="avaliacao-icon avaliacao-icon--gostei" title="Gostei" aria-label="Gostei">
                  ♥
                </span>
              )}
              {property.avaliacao === 'descartado' && (
                <span className="avaliacao-icon avaliacao-icon--descartado" title="Descartado" aria-label="Descartado">
                  ✕
                </span>
              )}
              {property.descricao}
            </h1>
            <p className="details-page__meta">{property.imobiliaria} · ID {property.id}</p>
          </div>
          <div className="details-page__actions">
            <div className="details-page__avaliacao" role="group" aria-label="Avaliar imóvel">
              <button
                type="button"
                className={`btn btn--liked${property.avaliacao === 'gostei' ? ' btn--liked-active' : ''}`}
                onClick={() => toggleAvaliacao('gostei')}
                disabled={updatingAvaliacao}
                aria-pressed={property.avaliacao === 'gostei'}
              >
                {updatingAvaliacao ? 'Salvando...' : property.avaliacao === 'gostei' ? '♥ Gostei' : '♡ Gostei'}
              </button>
              <button
                type="button"
                className={`btn btn--discarded${property.avaliacao === 'descartado' ? ' btn--discarded-active' : ''}`}
                onClick={() => toggleAvaliacao('descartado')}
                disabled={updatingAvaliacao}
                aria-pressed={property.avaliacao === 'descartado'}
              >
                {updatingAvaliacao ? 'Salvando...' : property.avaliacao === 'descartado' ? '✕ Descartado' : '✕ Descartar'}
              </button>
            </div>
            <a
              href={property.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--primary"
            >
              {getVerifyLabel(property)}
            </a>
            <button
              type="button"
              className="btn btn--danger"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Excluindo...' : 'Excluir imóvel'}
            </button>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {canShowMap && (
          <section className="details-page__map-section" aria-label="Mapa de proximidade">
            <h2>Mapa e distância da LOAD Facility</h2>
            {distanceKm != null && (
              <p className="details-page__distance">
                Distância em linha reta: <strong>{formatDistanceKm(distanceKm)}</strong>
              </p>
            )}
            <PropertyMap
              loadCoordinates={appConfig.loadCoordinates}
              propertyCoordinates={property.coordenadas}
              propertyLabel={property.descricao}
              avaliacao={property.avaliacao}
            />
          </section>
        )}

        {!canShowMap && (
          <div className="details-page__map-notice" role="note">
            {!property.coordenadas && 'Este imóvel ainda não possui coordenadas cadastradas.'}
            {property.coordenadas && !appConfig?.loadCoordinates &&
              'Coordenadas da LOAD Facility não configuradas no servidor (LOAD_LATITUDE / LOAD_LONGITUDE).'}
            {!property.coordenadas && !appConfig?.loadCoordinates &&
              ' Mapa indisponível: cadastre coordenadas do imóvel e configure as coordenadas da LOAD no servidor.'}
          </div>
        )}

        <dl className="detail-list detail-list--page">
          <DetailItem label="Imobiliária" value={property.imobiliaria} />
          <DetailItem label="Descrição" value={property.descricao} />
          <DetailItem label="Bairro" value={property.bairro} />
          <DetailItem label="Endereço" value={property.endereco} />
          <DetailItem label="Área" value={formatArea(property.areaM2)} />
          <DetailItem label="Aluguel" value={formatAluguel(property)} highlight />
          <DetailItem label="Preço por m²" value={precoM2 != null ? formatCurrency(precoM2) : '—'} />
          <DetailItem
            label="Distância da LOAD"
            value={distanceKm != null ? formatDistanceKm(distanceKm) : formatDistancia(property)}
          />
          <DetailItem
            label="Coordenadas"
            value={
              property.coordenadas
                ? `${property.coordenadas.lat}, ${property.coordenadas.lng}`
                : 'Não informadas'
            }
          />
          <DetailItem label="Status" value={STATUS_LABEL[property.status] ?? property.status} />
          <DetailItem
            label="Tipo de URL"
            value={property.tipoUrl === 'individual' ? 'Anúncio individual' : 'Página de busca'}
          />
          <DetailItem
            label="Última verificação"
            value={property.ultimaVerificacao ?? 'Não verificada'}
          />
          {property.observacoes && (
            <DetailItem label="Observações" value={property.observacoes} />
          )}
        </dl>

        <div className="modal__notice">
          <strong>Aviso de auditoria:</strong> disponibilidade, preços e links podem ter mudado
          desde a coleta inicial em {appConfig?.dataBase ?? '16/09/2026'}.
        </div>
      </section>
    </main>
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
