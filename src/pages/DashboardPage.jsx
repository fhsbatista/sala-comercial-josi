import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchAppConfig, fetchProperties } from '../api/properties.js'
import Filters from '../components/Filters.jsx'
import PropertyTable from '../components/PropertyTable.jsx'
import PropertyCard from '../components/PropertyCard.jsx'
import DataIntegrity from '../components/DataIntegrity.jsx'
import { enrichWithDistance } from '../utils/geo.js'
import {
  computeIntegrityStats,
  computeSummaryStats,
  DEFAULT_FILTERS,
  filterImoveis,
  formatArea,
  formatCurrency,
  getUniqueValues,
  sortImoveis,
} from '../utils/imoveis.js'

export default function DashboardPage() {
  const [properties, setProperties] = useState([])
  const [appConfig, setAppConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filtros, setFiltros] = useState({ ...DEFAULT_FILTERS })
  const [sortBy, setSortBy] = useState('proximidade_asc')

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
  const integrity = useMemo(() => computeIntegrityStats(enriched), [enriched])

  function handleClearFilters() {
    setFiltros({ ...DEFAULT_FILTERS })
    setSortBy('proximidade_asc')
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
          <h1>Salões Comerciais</h1>
          <p className="header__subtitle">
            Comparação de salões comerciais a partir de 40 m², com foco na proximidade da{' '}
            <strong>{appConfig?.referencia?.nome ?? 'LOAD Facility'}</strong>.
          </p>

          <div className="header__refs">
            <div className="ref-card">
              <h2>Ponto de referência</h2>
              <p><strong>{appConfig?.referencia?.nome}</strong></p>
              <p>{appConfig?.referencia?.endereco}</p>
              <p>{appConfig?.referencia?.bairro} · {appConfig?.referencia?.cidade}</p>
            </div>
            <div className="ref-card">
              <h2>Interesse secundário</h2>
              <p><strong>{appConfig?.interesseSecundario?.nome}</strong></p>
              <p>{appConfig?.interesseSecundario?.descricao}</p>
              <p>{appConfig?.interesseSecundario?.regiao}</p>
            </div>
          </div>

          <div className="header__notice" role="note">
            <strong>Base iniciada em {appConfig?.dataBase}.</strong> Disponibilidade, preços e links
            podem ter mudado. Novos imóveis podem ser cadastrados e persistidos no banco SQLite.
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
              value={summary.maiorArea != null ? formatArea(summary.maiorArea) : '—'}
            />
            <SummaryCard label="Muito próximos da LOAD" value={String(summary.muitoProximos)} />
          </div>
        </section>

        <Filters
          filtros={filtros}
          onChange={setFiltros}
          onClear={handleClearFilters}
          sortBy={sortBy}
          onSortChange={setSortBy}
          imobiliarias={imobiliarias}
          bairros={bairros}
          statusOptions={statusOptions}
          resultCount={filtered.length}
          totalCount={enriched.length}
        />

        <section className="results" aria-label="Lista de imóveis">
          <div className="results__desktop">
            <PropertyTable imoveis={filtered} />
          </div>
          <div className="results__mobile">
            {filtered.length === 0 ? (
              <div className="empty-state">
                <p>Nenhum imóvel encontrado com os filtros atuais.</p>
                <p className="empty-state__hint">Tente ajustar ou limpar os filtros.</p>
              </div>
            ) : (
              filtered.map((imovel) => (
                <PropertyCard key={imovel.id} imovel={imovel} />
              ))
            )}
          </div>
        </section>

        <DataIntegrity stats={integrity} />
      </main>

      <footer className="footer">
        <p>
          Painel de salões comerciais · {enriched.length} imóveis registrados
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
