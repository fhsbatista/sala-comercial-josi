import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  createPinIconWithLabel,
  createPropertyDetailPinIcon,
  MAP_MARKER_COLORS,
  MAP_MARKER_LABELS,
} from '../utils/mapPins.js'

const MARKERS = {
  load: {
    color: MAP_MARKER_COLORS.load,
    label: MAP_MARKER_LABELS.load,
    popupTitle: 'LOAD Facility',
    popupDetail: 'Ponto de referência da pesquisa',
  },
  property: {
    color: MAP_MARKER_COLORS.property,
    popupTitle: 'Imóvel',
  },
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

export default function PropertyMap({ loadCoordinates, propertyCoordinates, propertyLabel, avaliacao = null }) {
  const center = [
    (loadCoordinates.lat + propertyCoordinates.lat) / 2,
    (loadCoordinates.lng + propertyCoordinates.lng) / 2,
  ]

  const line = [
    [loadCoordinates.lat, loadCoordinates.lng],
    [propertyCoordinates.lat, propertyCoordinates.lng],
  ]

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
          icon={createPinIconWithLabel(MARKERS.load.label, MARKERS.load.color)}
        >
          <Popup>
            <strong>{MARKERS.load.popupTitle}</strong>
            <br />
            {MARKERS.load.popupDetail}
          </Popup>
        </Marker>
        <Marker
          position={[propertyCoordinates.lat, propertyCoordinates.lng]}
          icon={createPropertyDetailPinIcon(propertyLabel, { avaliacao })}
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
