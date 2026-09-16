import L from 'leaflet'

export const MAP_MARKER_COLORS = {
  load: '#2563eb',
  property: '#059669',
  liked: '#e11d48',
}

export const MAP_MARKER_LABELS = {
  load: 'LOAD Facility',
}

/** @param {string} text */
export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** @param {string|null|undefined} text @param {number} [max] */
export function truncateLabel(text, max = 22) {
  if (!text) return 'Imóvel'
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

/**
 * Pin clássico com label permanente (ex.: LOAD Facility).
 * @param {string} label
 * @param {string} color
 */
export function createPinIconWithLabel(label, color) {
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

/**
 * Pin clássico sem label (imóveis no mapa de resultados).
 * @param {string} color
 * @param {{ liked?: boolean }} [options]
 */
export function createPinIcon(color, options = {}) {
  const pinHeight = 36
  const pinWidth = 24
  const liked = Boolean(options.liked)
  const heartMarkup = liked
    ? '<span class="map-marker-wrap__heart" aria-hidden="true">♥</span>'
    : ''

  const html = `
    <div class="map-marker-wrap map-marker-wrap--pin-only" style="width:${pinWidth}px;height:${pinHeight}px">
      ${heartMarkup}
      <svg class="map-marker-wrap__pin" width="${pinWidth}" height="${pinHeight}" viewBox="0 0 24 36" aria-hidden="true">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z" fill="${color}" stroke="#ffffff" stroke-width="1.5"/>
        <circle cx="12" cy="12" r="4.5" fill="#ffffff" fill-opacity="0.95"/>
      </svg>
    </div>
  `

  return L.divIcon({
    className: '',
    html,
    iconSize: [pinWidth, pinHeight],
    iconAnchor: [pinWidth / 2, pinHeight],
    popupAnchor: [0, -pinHeight + 4],
  })
}

/** Pin com label truncado (página de detalhes imóvel ↔ LOAD). */
export function createPropertyDetailPinIcon(propertyLabel) {
  return createPinIconWithLabel(truncateLabel(propertyLabel), MAP_MARKER_COLORS.property)
}
