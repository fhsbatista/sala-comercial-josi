export default function DataIntegrity({ stats }) {
  return (
    <section className="integrity" aria-label="Integridade dos dados">
      <h2>Integridade dos dados</h2>
      <p className="integrity__note">
        Estatísticas da base completa. &ldquo;Ainda não verificado&rdquo; inclui links de busca,
        registros pendentes e possíveis expirados.
      </p>
      <div className="integrity__grid">
        <StatCard label="Total de imóveis" value={stats.total} />
        <StatCard label="URLs individuais" value={stats.urlsIndividuais} />
        <StatCard label="Links de busca" value={stats.linksBusca} />
        <StatCard label="Verificados" value={stats.verificados} />
        <StatCard label="Ainda não verificados" value={stats.naoVerificados} />
        <StatCard label="Imobiliárias" value={stats.imobiliarias} />
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
