import { useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  createPinIcon,
  createPinIconWithLabel,
  getPropertyPinColor,
  MAP_MARKER_COLORS,
  MAP_MARKER_LABELS,
  truncateLabel,
} from '../utils/mapPins.js'
import { isValidCoordinate, partitionByValidCoordinates } from '../utils/mapCoordinates.js'
import { formatAluguel, formatArea, formatDistancia } from '../utils/imoveis.js'

const DEFAULT_LOAD_ZOOM = 14

function FitResultsBounds({ loadCoordinates, imoveis }) {
  const map = useMap()

  useEffect(() => {
    const points = imoveis.map((imovel) => [
      imovel.coordenadas.lat,
      imovel.coordenadas.lng,
    ])

    const hasLoad = isValidCoordinate(loadCoordinates)
    if (hasLoad) {
      points.push([loadCoordinates.lat, loadCoordinates.lng])
    }

    if (points.length === 0) return

    if (points.length === 1) {
      map.setView(points[0], hasLoad && imoveis.length === 0 ? DEFAULT_LOAD_ZOOM : 14)
      return
    }

    map.fitBounds(L.latLngBounds(points), { padding: [56, 56] })
  }, [map, loadCoordinates, imoveis])

  return null
}

function avaliacaoPrefix(avaliacao) {
  if (avaliacao === 'gostei') return '♥ '
  if (avaliacao === 'descartado') return '✕ '
  return ''
}

function avaliacaoAltPrefix(avaliacao) {
  if (avaliacao === 'gostei') return 'Gostei: '
  if (avaliacao === 'descartado') return 'Descartado: '
  return ''
}

function PropertyMarker({ imovel }) {
  const markerRef = useRef(null)
  const color = getPropertyPinColor(imovel.avaliacao)
  const tooltipText = truncateLabel(imovel.descricao, 40)

  useEffect(() => {
    const marker = markerRef.current
    const element = marker?.getElement()
    if (!element) return undefined

    const showTooltip = () => marker.openTooltip()
    const hideTooltip = () => marker.closeTooltip()
    element.addEventListener('focus', showTooltip)
    element.addEventListener('blur', hideTooltip)

    return () => {
      element.removeEventListener('focus', showTooltip)
      element.removeEventListener('blur', hideTooltip)
    }
  }, [])

  return (
    <Marker
      ref={markerRef}
      position={[imovel.coordenadas.lat, imovel.coordenadas.lng]}
      icon={createPinIcon(color, { avaliacao: imovel.avaliacao })}
      alt={`${avaliacaoAltPrefix(imovel.avaliacao)}${imovel.descricao}`}
      title={imovel.descricao}
    >
      <Tooltip direction="top" offset={[0, -36]} opacity={0.95}>
        {`${avaliacaoPrefix(imovel.avaliacao)}${tooltipText}`}
      </Tooltip>
      <Popup key={imovel.id} className="results-map-popup" minWidth={220} maxWidth={300}>
        <div className="results-map-popup__content">
          <strong className="results-map-popup__title">
            {imovel.avaliacao === 'gostei' && (
              <span className="results-map-popup__avaliacao results-map-popup__avaliacao--gostei" aria-hidden="true">♥ </span>
            )}
            {imovel.avaliacao === 'descartado' && (
              <span className="results-map-popup__avaliacao results-map-popup__avaliacao--descartado" aria-hidden="true">✕ </span>
            )}
            {imovel.descricao}
          </strong>
          <dl className="results-map-popup__details">
            <div>
              <dt>Imobiliária</dt>
              <dd>{imovel.imobiliaria}</dd>
            </div>
            <div>
              <dt>Bairro</dt>
              <dd>{imovel.bairro}</dd>
            </div>
            <div>
              <dt>Aluguel</dt>
              <dd>{formatAluguel(imovel)}</dd>
            </div>
            <div>
              <dt>Área</dt>
              <dd>{formatArea(imovel)}</dd>
            </div>
            {imovel.distanciaKm != null && (
              <div>
                <dt>Distância da LOAD</dt>
                <dd>{formatDistancia(imovel)}</dd>
              </div>
            )}
          </dl>
          <Link to={`/imoveis/${imovel.id}`} className="btn btn--small btn--secondary results-map-popup__link">
            Ver detalhes
          </Link>
        </div>
      </Popup>
    </Marker>
  )
}

export default function PropertyResultsMap({ imoveis, loadCoordinates, onBackToList }) {
  const { withCoordinates, withoutCoordinates } = useMemo(
    () => partitionByValidCoordinates(imoveis),
    [imoveis],
  )

  const hasLoad = isValidCoordinate(loadCoordinates)
  const mapCount = withCoordinates.length
  const missingCount = withoutCoordinates.length

  const mapCenter = useMemo(() => {
    if (hasLoad) {
      return [loadCoordinates.lat, loadCoordinates.lng]
    }
    if (withCoordinates.length > 0) {
      const first = withCoordinates[0].coordenadas
      return [first.lat, first.lng]
    }
    return [-20.811, -49.375]
  }, [hasLoad, loadCoordinates, withCoordinates])

  if (imoveis.length > 0 && mapCount === 0) {
    return (
      <div className="results-map-empty">
        <p>
          Nenhum dos {imoveis.length} imóveis filtrados possui coordenadas válidas para exibir no mapa.
        </p>
        {missingCount > 0 && (
          <p className="results-map-empty__hint">
            {missingCount} {missingCount === 1 ? 'imóvel filtrado sem coordenadas' : 'imóveis filtrados sem coordenadas'}.
          </p>
        )}
        <button type="button" className="btn btn--primary" onClick={onBackToList}>
          Voltar à Lista
        </button>
      </div>
    )
  }

  if (imoveis.length === 0) {
    return (
      <div className="results-map-empty">
        <p>Nenhum imóvel encontrado com os filtros atuais.</p>
        <p className="results-map-empty__hint">Tente ajustar ou limpar os filtros, ou volte à lista.</p>
        <button type="button" className="btn btn--secondary" onClick={onBackToList}>
          Voltar à Lista
        </button>
      </div>
    )
  }

  return (
    <div className="results-map">
      <div className="results-map__meta">
        <p className="results-map__counts">
          <strong>{mapCount}</strong> {mapCount === 1 ? 'imóvel no mapa' : 'imóveis no mapa'}
          {missingCount > 0 && (
            <>
              {' · '}
              <span className="results-map__missing">
                {missingCount} {missingCount === 1 ? 'filtrado sem coordenadas' : 'filtrados sem coordenadas'}
              </span>
            </>
          )}
        </p>
        {!hasLoad && (
          <p className="results-map__notice" role="note">
            Coordenadas da LOAD não configuradas. Imóveis exibidos sem ponto de referência.
          </p>
        )}
      </div>

      <div className="results-map__canvas-wrap">
        <MapContainer
          center={mapCenter}
          zoom={DEFAULT_LOAD_ZOOM}
          scrollWheelZoom
          className="results-map__canvas"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitResultsBounds loadCoordinates={loadCoordinates} imoveis={withCoordinates} />
          {hasLoad && (
            <Marker
              position={[loadCoordinates.lat, loadCoordinates.lng]}
              icon={createPinIconWithLabel(MAP_MARKER_LABELS.load, MAP_MARKER_COLORS.load)}
              zIndexOffset={1000}
              alt="LOAD Facility"
              title="LOAD Facility"
            >
              <Popup>
                <strong>LOAD Facility</strong>
                <br />
                Ponto de referência da pesquisa
              </Popup>
            </Marker>
          )}
          {withCoordinates.map((imovel) => (
            <PropertyMarker key={imovel.id} imovel={imovel} />
          ))}
        </MapContainer>
      </div>

      <div className="results-map__legend" aria-label="Legenda do mapa">
        {hasLoad && (
          <span className="results-map__legend-item results-map__legend-item--load">
            <span className="results-map__legend-dot" aria-hidden="true" />
            LOAD Facility
          </span>
        )}
        <span className="results-map__legend-item results-map__legend-item--property">
          <span className="results-map__legend-dot" aria-hidden="true" />
          Imóvel
        </span>
        <span className="results-map__legend-item results-map__legend-item--liked">
          <span className="results-map__legend-dot" aria-hidden="true" />
          ♥ Gostei
        </span>
        <span className="results-map__legend-item results-map__legend-item--discarded">
          <span className="results-map__legend-dot" aria-hidden="true" />
          ✕ Descartado
        </span>
        {missingCount > 0 && (
          <span className="results-map__legend-item results-map__legend-item--missing">
            {missingCount} sem coordenadas (não exibidos)
          </span>
        )}
      </div>
    </div>
  )
}
