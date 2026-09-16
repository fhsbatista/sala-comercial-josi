import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  deleteProperty,
  fetchAppConfig,
  fetchProperty,
  updatePropertyLiked,
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
  PROXIMIDADE_LABEL,
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
  const [updatingLiked, setUpdatingLiked] = useState(false)

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

  async function handleLiked() {
    if (!property) return

    setUpdatingLiked(true)
    setError(null)
    try {
      const updated = await updatePropertyLiked(property.id, !property.liked)
      setProperty(updated)
    } catch (err) {
      setError(err.message || 'Erro ao atualizar gostei')
    } finally {
      setUpdatingLiked(false)
    }
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
            <h1>{property.descricao}</h1>
            <p className="details-page__meta">{property.imobiliaria} · ID {property.id}</p>
          </div>
          <div className="details-page__actions">
            <button
              type="button"
              className={`btn btn--liked${property.liked ? ' btn--liked-active' : ''}`}
              onClick={handleLiked}
              disabled={updatingLiked}
              aria-pressed={property.liked}
            >
              {updatingLiked ? 'Salvando...' : property.liked ? '♥ Gostei' : '♡ Gostei'}
            </button>
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
            label="Distância / proximidade da LOAD"
            value={distanceKm != null ? formatDistanceKm(distanceKm) : formatDistancia(property)}
          />
          <DetailItem label="Classificação aproximada" value={PROXIMIDADE_LABEL[property.proximidade]} />
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
