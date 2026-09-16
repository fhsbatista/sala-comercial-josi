import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchAppConfig, fetchProperties, updatePropertyAvaliacao } from '../api/properties.js'
import Filters from '../components/Filters.jsx'
import SavedFiltersBar from '../components/SavedFiltersBar.jsx'
import PropertyTable from '../components/PropertyTable.jsx'
import PropertyCard from '../components/PropertyCard.jsx'
import PropertyResultsMap from '../components/PropertyResultsMap.jsx'
import DatabaseSummary from '../components/DatabaseSummary.jsx'
import { enrichWithDistance } from '../utils/geo.js'
import {
  computeDatabaseStats,
  computeSummaryStats,
  DEFAULT_FILTERS,
  filterImoveis,
  formatArea,
  formatCurrency,
  NEAR_LOAD_KM,
  getUniqueValues,
  sortImoveis,
} from '../utils/imoveis.js'
import {
  createPreset,
  loadSavedFiltersState,
  persistSavedFiltersState,
  presetMatchesCurrent,
} from '../utils/savedFilters.js'

export default function DashboardPage() {
  const [properties, setProperties] = useState([])
  const [appConfig, setAppConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [savedState, setSavedState] = useState(() => loadSavedFiltersState())
  const [filtros, setFiltros] = useState(() => {
    const stored = loadSavedFiltersState()
    const active = stored.presets.find((p) => p.id === stored.activePresetId)
    return active ? { ...active.filtros } : { ...stored.lastSession.filtros }
  })
  const [sortBy, setSortBy] = useState(() => {
    const stored = loadSavedFiltersState()
    const active = stored.presets.find((p) => p.id === stored.activePresetId)
    return active ? active.sortBy : stored.lastSession.sortBy
  })
  const [viewMode, setViewMode] = useState('lista')
  const [updatingAvaliacaoId, setUpdatingAvaliacaoId] = useState(null)
  const filtersHydrated = useRef(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [props, config] = await Promise.all([
        fetchProperties(),
        fetchAppConfig(),
      ])
      setProperties(props)
      setAppConfig(config)
    } catch (err) {
      setError(err.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    filtersHydrated.current = true
  }, [])

  useEffect(() => {
    if (!filtersHydrated.current) return
    setSavedState((prev) => {
      const next = {
        ...prev,
        lastSession: { filtros: { ...filtros }, sortBy },
      }
      persistSavedFiltersState(next)
      return next
    })
  }, [filtros, sortBy])

  const activePreset = useMemo(
    () => savedState.presets.find((p) => p.id === savedState.activePresetId) ?? null,
    [savedState],
  )

  const isDirty = activePreset != null && !presetMatchesCurrent(activePreset, filtros, sortBy)

  function applyPreset(presetId) {
    const preset = savedState.presets.find((p) => p.id === presetId)
    if (!preset) return
    setFiltros({ ...preset.filtros })
    setSortBy(preset.sortBy)
    const next = { ...savedState, activePresetId: presetId }
    setSavedState(next)
    persistSavedFiltersState(next)
  }

  function saveCurrentPreset(name) {
    const preset = createPreset(name, filtros, sortBy)
    const next = {
      ...savedState,
      presets: [...savedState.presets, preset],
      activePresetId: preset.id,
    }
    setSavedState(next)
    persistSavedFiltersState(next)
  }

  function updateActivePreset() {
    if (!savedState.activePresetId) return
    const next = {
      ...savedState,
      presets: savedState.presets.map((p) => (
        p.id === savedState.activePresetId
          ? { ...p, filtros: { ...filtros }, sortBy }
          : p
      )),
    }
    setSavedState(next)
    persistSavedFiltersState(next)
  }

  function renamePreset(presetId, name) {
    const next = {
      ...savedState,
      presets: savedState.presets.map((p) => (p.id === presetId ? { ...p, name } : p)),
    }
    setSavedState(next)
    persistSavedFiltersState(next)
  }

  function deletePreset(presetId) {
    const next = {
      ...savedState,
      presets: savedState.presets.filter((p) => p.id !== presetId),
      activePresetId: savedState.activePresetId === presetId ? null : savedState.activePresetId,
    }
    setSavedState(next)
    persistSavedFiltersState(next)
  }

  const enriched = useMemo(
    () => enrichWithDistance(properties, appConfig?.loadCoordinates ?? null),
    [properties, appConfig],
  )

  const imobiliarias = useMemo(() => getUniqueValues(enriched, 'imobiliaria'), [enriched])
  const bairros = useMemo(() => getUniqueValues(enriched, 'bairro'), [enriched])
  const statusOptions = useMemo(() => getUniqueValues(enriched, 'status'), [enriched])

  const filtered = useMemo(
    () => sortImoveis(filterImoveis(enriched, filtros), sortBy),
    [enriched, filtros, sortBy],
  )

  const summary = useMemo(() => computeSummaryStats(filtered), [filtered])
  const databaseStats = useMemo(() => computeDatabaseStats(enriched), [enriched])

  function handleClearFilters() {
    setFiltros({ ...DEFAULT_FILTERS })
    setSortBy('distancia_asc')
    const next = { ...savedState, activePresetId: null }
    setSavedState(next)
    persistSavedFiltersState(next)
  }

  function handleFiltersChange(nextFiltros) {
    setFiltros(nextFiltros)
  }

  function handleSortChange(nextSort) {
    setSortBy(nextSort)
  }

  async function handleAvaliacaoChange(id, avaliacao) {
    setUpdatingAvaliacaoId(id)
    try {
      const updated = await updatePropertyAvaliacao(id, avaliacao)
      setProperties((prev) => prev.map((p) => (p.id === id ? updated : p)))
    } catch (err) {
      setError(err.message || 'Erro ao atualizar avaliação')
    } finally {
      setUpdatingAvaliacaoId(null)
    }
  }

  if (loading) {
    return (
      <main className="main">
        <div className="loading-state">Carregando imóveis...</div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="main">
        <div className="error-state">
          <p>{error}</p>
          <button type="button" className="btn btn--primary" onClick={loadData}>
            Tentar novamente
          </button>
        </div>
      </main>
    )
  }

  return (
    <>
      <header className="header">
        <div className="header__content">
          <p className="header__eyebrow">Painel de pesquisa · São José do Rio Preto – SP</p>
          <h1>Imóveis Comerciais</h1>
          <p className="header__subtitle">
            Comparação de imóveis comerciais em São José do Rio Preto, com foco na proximidade da{' '}
            <strong>{appConfig?.referencia?.nome ?? 'LOAD Facility'}</strong>.
          </p>

          <div className="header__refs">
            <div className="ref-card">
              <h2>Ponto de referência</h2>
              <p><strong>{appConfig?.referencia?.nome}</strong></p>
              <p>{appConfig?.referencia?.endereco}</p>
              <p>{appConfig?.referencia?.bairro} · {appConfig?.referencia?.cidade}</p>
            </div>
          </div>

          <div className="header__notice" role="note">
            Disponibilidade, preços e links podem ter mudado desde a última conferência.
            Novos imóveis podem ser cadastrados pela interface.
          </div>
        </div>
      </header>

      <main className="main">
        <section className="summary" aria-label="Resumo dos resultados">
          <div className="summary__grid">
            <SummaryCard label="Resultados" value={String(summary.total)} />
            <SummaryCard
              label="Menor aluguel"
              value={summary.menorAluguel != null ? formatCurrency(summary.menorAluguel) : '—'}
            />
            <SummaryCard
              label="Maior área"
              value={summary.maiorArea != null ? formatArea({ areaM2: summary.maiorArea }) : '—'}
            />
            <SummaryCard
              label={`Até ${NEAR_LOAD_KM.toLocaleString('pt-BR')} km da LOAD`}
              value={String(summary.proximosLoad)}
            />
          </div>
        </section>

        <SavedFiltersBar
          presets={savedState.presets}
          activePresetId={savedState.activePresetId}
          isDirty={isDirty}
          onApplyPreset={applyPreset}
          onSaveCurrent={saveCurrentPreset}
          onUpdateActive={updateActivePreset}
          onRenamePreset={renamePreset}
          onDeletePreset={deletePreset}
        />

        <Filters
          filtros={filtros}
          onChange={handleFiltersChange}
          onClear={handleClearFilters}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          imobiliarias={imobiliarias}
          bairros={bairros}
          statusOptions={statusOptions}
          resultCount={filtered.length}
          totalCount={enriched.length}
          loadConfigured={Boolean(appConfig?.loadCoordinates)}
        />

        <section className="results" aria-label="Resultados de imóveis">
          <div className="results__toolbar">
            <div
              className="segmented-control results__view-toggle"
              role="group"
              aria-label="Modo de visualização dos resultados"
            >
              <button
                type="button"
                className={`segmented-control__option${
                  viewMode === 'lista' ? ' segmented-control__option--active' : ''
                }`}
                aria-pressed={viewMode === 'lista'}
                onClick={() => setViewMode('lista')}
              >
                Lista
              </button>
              <button
                type="button"
                className={`segmented-control__option${
                  viewMode === 'mapa' ? ' segmented-control__option--active' : ''
                }`}
                aria-pressed={viewMode === 'mapa'}
                onClick={() => setViewMode('mapa')}
              >
                Mapa
              </button>
            </div>
          </div>

          {viewMode === 'lista' ? (
            <>
              <div className="results__desktop">
                <PropertyTable
                  imoveis={filtered}
                  onAvaliacaoChange={handleAvaliacaoChange}
                  updatingAvaliacaoId={updatingAvaliacaoId}
                />
              </div>
              <div className="results__mobile">
                {filtered.length === 0 ? (
                  <div className="empty-state">
                    <p>Nenhum imóvel encontrado com os filtros atuais.</p>
                    <p className="empty-state__hint">Tente ajustar ou limpar os filtros.</p>
                  </div>
                ) : (
                  filtered.map((imovel) => (
                    <PropertyCard
                      key={imovel.id}
                      imovel={imovel}
                      onAvaliacaoChange={handleAvaliacaoChange}
                      updatingAvaliacaoId={updatingAvaliacaoId}
                    />
                  ))
                )}
              </div>
            </>
          ) : (
            <PropertyResultsMap
              imoveis={filtered}
              loadCoordinates={appConfig?.loadCoordinates ?? null}
              onBackToList={() => setViewMode('lista')}
            />
          )}
        </section>

        <DatabaseSummary stats={databaseStats} />
      </main>

      <footer className="footer">
        <p>
          Painel de imóveis comerciais · {enriched.length} imóveis registrados
        </p>
      </footer>
    </>
  )
}

function SummaryCard({ label, value }) {
  return (
    <div className="summary-card">
      <span className="summary-card__value">{value}</span>
      <span className="summary-card__label">{label}</span>
    </div>
  )
}
