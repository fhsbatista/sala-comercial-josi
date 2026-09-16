export default function DatabaseSummary({ stats }) {
  const imobiliarias = Object.entries(stats.byImobiliaria).sort(([a], [b]) =>
    a.localeCompare(b, 'pt-BR'),
  )

  return (
    <section className="integrity" aria-label="Resumo da base">
      <h2>Resumo da base</h2>
      <p className="integrity__note">
        Distribuição dos imóveis cadastrados por imobiliária.
      </p>
      <div className="integrity__grid">
        <StatCard label="Total de imóveis" value={stats.total} />
        {imobiliarias.map(([nome, count]) => (
          <StatCard key={nome} label={nome} value={count} />
        ))}
      </div>
    </section>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <span className="stat-card__value">{value}</span>
      <span className="stat-card__label">{label}</span>
    </div>
  )
}
