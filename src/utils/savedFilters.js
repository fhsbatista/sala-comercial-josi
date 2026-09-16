import { DEFAULT_FILTERS } from './imoveis.js'

const STORAGE_KEY = 'sala-comercial.savedFilters.v1'

/** @typedef {{ id: string, name: string, filtros: typeof DEFAULT_FILTERS, sortBy: string, createdAt: string }} SavedFilterPreset */

/** @typedef {{ presets: SavedFilterPreset[], activePresetId: string|null, lastSession: { filtros: typeof DEFAULT_FILTERS, sortBy: string } }} SavedFiltersState */

/** @returns {SavedFiltersState} */
export function createEmptyState() {
  return {
    presets: [],
    activePresetId: null,
    lastSession: {
      filtros: { ...DEFAULT_FILTERS },
      sortBy: 'distancia_asc',
    },
  }
}

/** @returns {SavedFiltersState} */
export function loadSavedFiltersState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createEmptyState()
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return createEmptyState()
    return {
      presets: Array.isArray(parsed.presets) ? parsed.presets : [],
      activePresetId: parsed.activePresetId ?? null,
      lastSession: {
        filtros: { ...DEFAULT_FILTERS, ...parsed.lastSession?.filtros },
        sortBy: parsed.lastSession?.sortBy ?? 'distancia_asc',
      },
    }
  } catch {
    return createEmptyState()
  }
}

/** @param {SavedFiltersState} state */
export function persistSavedFiltersState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

/** @param {typeof DEFAULT_FILTERS} a @param {typeof DEFAULT_FILTERS} b */
export function filtersEqual(a, b) {
  return Object.keys(DEFAULT_FILTERS).every((key) => String(a[key] ?? '') === String(b[key] ?? ''))
}

/** @param {SavedFilterPreset} preset @param {typeof DEFAULT_FILTERS} filtros @param {string} sortBy */
export function presetMatchesCurrent(preset, filtros, sortBy) {
  return filtersEqual(preset.filtros, filtros) && preset.sortBy === sortBy
}

/** @param {string} name @param {typeof DEFAULT_FILTERS} filtros @param {string} sortBy */
export function createPreset(name, filtros, sortBy) {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    filtros: { ...filtros },
    sortBy,
    createdAt: new Date().toISOString(),
  }
}
