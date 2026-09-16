import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const MARKERS = {
  load: {
    color: '#2563eb',
    label: 'LOAD Facility',
    popupTitle: 'LOAD Facility',
    popupDetail: 'Ponto de referência da pesquisa',
  },
  property: {
    color: '#059669',
    label: 'Imóvel',
    popupTitle: 'Imóvel',
  },
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function truncateLabel(text, max = 22) {
  if (!text) return 'Imóvel'
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

function createPinIcon(label, color) {
  const safeLabel = escapeHtml(label)
  const pinHeight = 36
  const pinWidth = 24
  const labelHeight = 22
  const gap = 4
  const totalHeight = labelHeight + gap + pinHeight
  const totalWidth = 120

  const html = `
    <div class="map-marker-wrap" style="width:${totalWidth}px;height:${totalHeight}px">
      <span class="map-marker-wrap__label" style="background:${color}">${safeLabel}</span>
      <svg class="map-marker-wrap__pin" width="${pinWidth}" height="${pinHeight}" viewBox="0 0 24 36" aria-hidden="true">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z" fill="${color}" stroke="#ffffff" stroke-width="1.5"/>
        <circle cx="12" cy="12" r="4.5" fill="#ffffff" fill-opacity="0.95"/>
      </svg>
    </div>
  `

  return L.divIcon({
    className: '',
    html,
    iconSize: [totalWidth, totalHeight],
    iconAnchor: [totalWidth / 2, totalHeight],
    popupAnchor: [0, -totalHeight + 4],
  })
}

function FitBounds({ loadCoordinates, propertyCoordinates }) {
  const map = useMap()

  useEffect(() => {
    const bounds = L.latLngBounds([
      [loadCoordinates.lat, loadCoordinates.lng],
      [propertyCoordinates.lat, propertyCoordinates.lng],
    ])
    map.fitBounds(bounds, { padding: [56, 56] })
  }, [map, loadCoordinates, propertyCoordinates])

  return null
}

export default function PropertyMap({ loadCoordinates, propertyCoordinates, propertyLabel }) {
  const center = [
    (loadCoordinates.lat + propertyCoordinates.lat) / 2,
    (loadCoordinates.lng + propertyCoordinates.lng) / 2,
  ]

  const line = [
    [loadCoordinates.lat, loadCoordinates.lng],
    [propertyCoordinates.lat, propertyCoordinates.lng],
  ]

  const propertyPinLabel = truncateLabel(propertyLabel)

  return (
    <div className="property-map">
      <MapContainer center={center} zoom={14} scrollWheelZoom={false} className="property-map__canvas">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds loadCoordinates={loadCoordinates} propertyCoordinates={propertyCoordinates} />
        <Polyline
          positions={line}
          pathOptions={{
            color: '#64748b',
            weight: 2,
            dashArray: '5 7',
            lineCap: 'round',
          }}
        />
        <Marker
          position={[loadCoordinates.lat, loadCoordinates.lng]}
          icon={createPinIcon(MARKERS.load.label, MARKERS.load.color)}
        >
          <Popup>
            <strong>{MARKERS.load.popupTitle}</strong>
            <br />
            {MARKERS.load.popupDetail}
          </Popup>
        </Marker>
        <Marker
          position={[propertyCoordinates.lat, propertyCoordinates.lng]}
          icon={createPinIcon(propertyPinLabel, MARKERS.property.color)}
        >
          <Popup>
            <strong>{MARKERS.property.popupTitle}</strong>
            <br />
            {propertyLabel}
          </Popup>
        </Marker>
      </MapContainer>
      <div className="property-map__legend" aria-label="Legenda do mapa">
        <span className="property-map__legend-item property-map__legend-item--load">
          <span className="property-map__legend-dot" aria-hidden="true" />
          LOAD Facility
        </span>
        <span className="property-map__legend-item property-map__legend-item--property">
          <span className="property-map__legend-dot" aria-hidden="true" />
          Imóvel
        </span>
        <span className="property-map__legend-line" aria-hidden="true" />
        Distância em linha reta
      </div>
    </div>
  )
}
