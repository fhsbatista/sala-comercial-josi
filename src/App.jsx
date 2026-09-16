import { useMemo, useState } from 'react'
import { imoveis, META } from './data/imoveis.js'
import Filters from './components/Filters.jsx'
import PropertyTable from './components/PropertyTable.jsx'
import PropertyCard from './components/PropertyCard.jsx'
import PropertyDetails from './components/PropertyDetails.jsx'
import DataIntegrity from './components/DataIntegrity.jsx'
import {
  computeIntegrityStats,
  computeSummaryStats,
  DEFAULT_FILTERS,
  filterImoveis,
  formatArea,
  formatCurrency,
  getUniqueValues,
  sortImoveis,
} from './utils/imoveis.js'

export default function App() {
  const [filtros, setFiltros] = useState({ ...DEFAULT_FILTERS })
  const [sortBy, setSortBy] = useState('proximidade_asc')
  const [selected, setSelected] = useState(null)

  const imobiliarias = useMemo(() => getUniqueValues(imoveis, 'imobiliaria'), [])
  const bairros = useMemo(() => getUniqueValues(imoveis, 'bairro'), [])
  const statusOptions = useMemo(() => getUniqueValues(imoveis, 'status'), [])

  const filtered = useMemo(
    () => sortImoveis(filterImoveis(imoveis, filtros), sortBy),
    [filtros, sortBy],
  )

  const summary = useMemo(() => computeSummaryStats(filtered), [filtered])
  const integrity = useMemo(() => computeIntegrityStats(imoveis), [])

  function handleClearFilters() {
    setFiltros({ ...DEFAULT_FILTERS })
    setSortBy('proximidade_asc')
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header__content">
          <p className="header__eyebrow">Painel de pesquisa · São José do Rio Preto – SP</p>
          <h1>Salões Comerciais</h1>
          <p className="header__subtitle">
            Comparação de salões comerciais a partir de 40 m², com foco na proximidade da{' '}
            <strong>{META.referencia.nome}</strong>.
          </p>

          <div className="header__refs">
            <div className="ref-card">
              <h2>Ponto de referência</h2>
              <p><strong>{META.referencia.nome}</strong></p>
              <p>{META.referencia.endereco}</p>
              <p>{META.referencia.bairro} · {META.referencia.cidade}</p>
            </div>
            <div className="ref-card">
              <h2>Interesse secundário</h2>
              <p><strong>{META.interesseSecundario.nome}</strong></p>
              <p>{META.interesseSecundario.descricao}</p>
              <p>{META.interesseSecundario.regiao}</p>
            </div>
          </div>

          <div className="header__notice" role="note">
            <strong>Base de dados de {META.dataBase}.</strong> Esta é uma fotografia da pesquisa
            realizada nessa data. Não afirmamos que todos os imóveis continuam disponíveis —
            preços, endereços e links podem ter mudado.
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
          totalCount={imoveis.length}
        />

        <section className="results" aria-label="Lista de imóveis">
          <div className="results__desktop">
            <PropertyTable imoveis={filtered} onSelect={setSelected} />
          </div>
          <div className="results__mobile">
            {filtered.length === 0 ? (
              <div className="empty-state">
                <p>Nenhum imóvel encontrado com os filtros atuais.</p>
                <p className="empty-state__hint">Tente ajustar ou limpar os filtros.</p>
              </div>
            ) : (
              filtered.map((imovel) => (
                <PropertyCard key={imovel.id} imovel={imovel} onSelect={setSelected} />
              ))
            )}
          </div>
        </section>

        <DataIntegrity stats={integrity} />
      </main>

      <footer className="footer">
        <p>
          Painel de salões comerciais · Base coletada em {META.dataBase} ·{' '}
          {imoveis.length} imóveis registrados
        </p>
      </footer>

      {selected && (
        <PropertyDetails imovel={selected} onClose={() => setSelected(null)} />
      )}
    </div>
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
