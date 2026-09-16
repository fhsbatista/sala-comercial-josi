import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createProperty } from '../api/properties.js'
import PropertyForm from '../components/PropertyForm.jsx'

export default function NewPropertyPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(payload) {
    setSubmitting(true)
    setError(null)
    try {
      const created = await createProperty(payload)
      navigate(`/imoveis/${created.id}`)
    } catch (err) {
      setError(err.message || 'Erro ao cadastrar imóvel')
      throw err
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="main">
      <section className="page-section">
        <h1>Cadastrar imóvel</h1>
        <p className="page-section__subtitle">
          Preencha os dados do imóvel. Coordenadas são opcionais, mas permitem exibir mapa
          e distância em linha reta da LOAD Facility na página de detalhes.
        </p>
        {error && <div className="error-banner">{error}</div>}
        <PropertyForm onSubmit={handleSubmit} submitting={submitting} />
      </section>
    </main>
  )
}
