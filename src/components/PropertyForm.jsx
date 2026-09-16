import { useState } from 'react'
import { STATUS_LABEL } from '../utils/imoveis.js'

const STATUS_OPTIONS = Object.entries(STATUS_LABEL)

const EMPTY_FORM = {
  imobiliaria: '',
  descricao: '',
  bairro: '',
  endereco: '',
  areaM2: '',
  aluguel: '',
  encargos: '',
  url: '',
  tipoUrl: 'individual',
  status: '',
  ultimaVerificacao: '',
  observacoes: '',
  latitude: '',
  longitude: '',
}

export default function PropertyForm({ onSubmit, submitting = false }) {
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [errors, setErrors] = useState({})

  function handleChange(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'tipoUrl') {
        next.status = value === 'busca' ? 'link de busca' : 'não verificado'
      }
      return next
    })
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  function validateClient() {
    const nextErrors = {}
    if (!form.imobiliaria.trim()) nextErrors.imobiliaria = 'Campo obrigatório'
    if (!form.descricao.trim()) nextErrors.descricao = 'Campo obrigatório'
    if (!form.bairro.trim()) nextErrors.bairro = 'Campo obrigatório'
    if (!form.endereco.trim()) nextErrors.endereco = 'Campo obrigatório'
    if (!form.url.trim()) nextErrors.url = 'Campo obrigatório'
    if (!form.areaM2 || Number(form.areaM2) <= 0) nextErrors.areaM2 = 'Deve ser maior que zero'
    if (!form.aluguel || Number(form.aluguel) <= 0) nextErrors.aluguel = 'Deve ser maior que zero'

    const hasLat = form.latitude !== ''
    const hasLng = form.longitude !== ''
    if (hasLat !== hasLng) {
      nextErrors.latitude = 'Informe latitude e longitude juntas'
      nextErrors.longitude = 'Informe latitude e longitude juntas'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validateClient()) return

    const payload = {
      imobiliaria: form.imobiliaria.trim(),
      descricao: form.descricao.trim(),
      bairro: form.bairro.trim(),
      endereco: form.endereco.trim(),
      areaM2: Number(form.areaM2),
      aluguel: Number(form.aluguel),
      encargos: form.encargos.trim() || null,
      url: form.url.trim(),
      tipoUrl: form.tipoUrl,
      status: form.status || undefined,
      ultimaVerificacao: form.ultimaVerificacao.trim() || null,
      observacoes: form.observacoes.trim() || null,
      latitude: form.latitude !== '' ? Number(form.latitude) : null,
      longitude: form.longitude !== '' ? Number(form.longitude) : null,
    }

    try {
      await onSubmit(payload)
    } catch (err) {
      if (err.fields) setErrors(err.fields)
    }
  }

  return (
    <form className="property-form" onSubmit={handleSubmit} noValidate>
      <div className="property-form__notice" role="note">
        Cadastro público: qualquer visitante com acesso ao site pode inserir registros.
        Coordenadas são opcionais, mas necessárias para exibir mapa e distância da LOAD.
      </div>

      <div className="property-form__grid">
        <FormField label="Imobiliária" error={errors.imobiliaria} required>
          <input value={form.imobiliaria} onChange={(e) => handleChange('imobiliaria', e.target.value)} />
        </FormField>

        <FormField label="Descrição" error={errors.descricao} required className="field--wide">
          <input value={form.descricao} onChange={(e) => handleChange('descricao', e.target.value)} />
        </FormField>

        <FormField label="Bairro" error={errors.bairro} required>
          <input value={form.bairro} onChange={(e) => handleChange('bairro', e.target.value)} />
        </FormField>

        <FormField label="Endereço" error={errors.endereco} required>
          <input value={form.endereco} onChange={(e) => handleChange('endereco', e.target.value)} />
        </FormField>

        <FormField label="Área (m²)" error={errors.areaM2} required>
          <input type="number" min="0.01" step="0.1" value={form.areaM2} onChange={(e) => handleChange('areaM2', e.target.value)} />
        </FormField>

        <FormField label="Aluguel (R$)" error={errors.aluguel} required>
          <input type="number" min="0" step="0.01" value={form.aluguel} onChange={(e) => handleChange('aluguel', e.target.value)} />
        </FormField>

        <FormField label="Encargos" hint="Ex: + IPTU">
          <input value={form.encargos} onChange={(e) => handleChange('encargos', e.target.value)} />
        </FormField>

        <FormField label="URL do anúncio ou busca" error={errors.url} required className="field--wide">
          <input type="url" value={form.url} onChange={(e) => handleChange('url', e.target.value)} />
        </FormField>

        <FormField label="Tipo de URL" required>
          <select value={form.tipoUrl} onChange={(e) => handleChange('tipoUrl', e.target.value)}>
            <option value="individual">Anúncio individual</option>
            <option value="busca">Página de busca</option>
          </select>
        </FormField>

        <FormField label="Status">
          <select value={form.status} onChange={(e) => handleChange('status', e.target.value)}>
            <option value="">Padrão automático</option>
            {STATUS_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Última verificação">
          <input placeholder="Ex: 16/09/2026" value={form.ultimaVerificacao} onChange={(e) => handleChange('ultimaVerificacao', e.target.value)} />
        </FormField>

        <FormField label="Latitude" error={errors.latitude} hint="Opcional">
          <input type="number" step="any" placeholder="Ex: -20.8123" value={form.latitude} onChange={(e) => handleChange('latitude', e.target.value)} />
        </FormField>

        <FormField label="Longitude" error={errors.longitude} hint="Opcional">
          <input type="number" step="any" placeholder="Ex: -49.3789" value={form.longitude} onChange={(e) => handleChange('longitude', e.target.value)} />
        </FormField>

        <FormField label="Observações" className="field--wide">
          <textarea rows={3} value={form.observacoes} onChange={(e) => handleChange('observacoes', e.target.value)} />
        </FormField>
      </div>

      <div className="property-form__actions">
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Salvando...' : 'Cadastrar imóvel'}
        </button>
      </div>
    </form>
  )
}

function FormField({ label, error, hint, required, className = '', children }) {
  return (
    <label className={`field ${className}${error ? ' field--error' : ''}`}>
      <span>
        {label}
        {required && ' *'}
        {hint && <small className="field__hint"> ({hint})</small>}
      </span>
      {children}
      {error && <span className="field__error">{error}</span>}
    </label>
  )
}
