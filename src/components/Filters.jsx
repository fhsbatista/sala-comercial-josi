import { AVALIACAO_FILTER_OPTIONS, SORT_OPTIONS } from '../utils/imoveis.js'

export default function Filters({
  filtros,
  onChange,
  onClear,
  sortBy,
  onSortChange,
  imobiliarias,
  bairros,
  statusOptions,
  resultCount,
  totalCount,
  loadConfigured = true,
}) {
  function handleChange(field, value) {
    onChange({ ...filtros, [field]: value })
  }

  return (
    <section className="filters" aria-label="Filtros de pesquisa">
      <div className="filters__header">
        <h2>Filtros e ordenação</h2>
        <p className="filters__count">
          {resultCount} de {totalCount} imóveis
        </p>
      </div>

      <div className="filters__grid">
        <div className="field field--segmented field--wide">
          <span>Avaliação</span>
          <div className="segmented-control" role="group" aria-label="Filtrar por avaliação">
            {AVALIACAO_FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`segmented-control__option${
                  filtros.avaliacao === option.value ? ' segmented-control__option--active' : ''
                }${option.value === 'gostei' ? ' segmented-control__option--gostei' : ''}${
                  option.value === 'descartado' ? ' segmented-control__option--descartado' : ''
                }`}
                aria-pressed={filtros.avaliacao === option.value}
                onClick={() => handleChange('avaliacao', option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <label className="field field--wide">
          <span>Busca textual</span>
          <input
            type="search"
            placeholder="Imobiliária, descrição, bairro ou endereço..."
            value={filtros.busca}
            onChange={(e) => handleChange('busca', e.target.value)}
          />
        </label>

        <label className="field">
          <span>Imobiliária</span>
          <select
            value={filtros.imobiliaria}
            onChange={(e) => handleChange('imobiliaria', e.target.value)}
          >
            <option value="">Todas</option>
            {imobiliarias.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Bairro</span>
          <select
            value={filtros.bairro}
            onChange={(e) => handleChange('bairro', e.target.value)}
          >
            <option value="">Todos</option>
            {bairros.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Status</span>
          <select
            value={filtros.status}
            onChange={(e) => handleChange('status', e.target.value)}
          >
            <option value="">Todos</option>
            {statusOptions.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Aluguel mínimo (R$)</span>
          <input
            type="number"
            min="0"
            placeholder="Ex: 1500"
            value={filtros.aluguelMin}
            onChange={(e) => handleChange('aluguelMin', e.target.value)}
          />
        </label>

        <label className="field">
          <span>Aluguel máximo (R$)</span>
          <input
            type="number"
            min="0"
            placeholder="Ex: 10000"
            value={filtros.aluguelMax}
            onChange={(e) => handleChange('aluguelMax', e.target.value)}
          />
        </label>

        <label className="field">
          <span>Área mínima (m²)</span>
          <input
            type="number"
            min="0"
            placeholder="Ex: 40"
            value={filtros.areaMin}
            onChange={(e) => handleChange('areaMin', e.target.value)}
          />
        </label>

        <label className="field">
          <span>Área máxima (m²)</span>
          <input
            type="number"
            min="0"
            placeholder="Ex: 300"
            value={filtros.areaMax}
            onChange={(e) => handleChange('areaMax', e.target.value)}
          />
        </label>

        <label className="field">
          <span>Distância máx. da LOAD (km)</span>
          <input
            type="number"
            min="0"
            step="0.1"
            placeholder="Ex: 5"
            value={filtros.distanciaMax}
            disabled={!loadConfigured}
            title={
              loadConfigured
                ? 'Filtra imóveis com coordenadas dentro do raio informado'
                : 'Configure LOAD_LATITUDE e LOAD_LONGITUDE para usar este filtro'
            }
            onChange={(e) => handleChange('distanciaMax', e.target.value)}
          />
        </label>

        <label className="field">
          <span>Ordenar por</span>
          <select value={sortBy} onChange={(e) => onSortChange(e.target.value)}>
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="filters__actions">
        <button type="button" className="btn btn--secondary" onClick={onClear}>
          Limpar filtros
        </button>
      </div>
    </section>
  )
}
