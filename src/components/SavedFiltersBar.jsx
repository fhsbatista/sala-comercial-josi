import { useState } from 'react'

export default function SavedFiltersBar({
  presets,
  activePresetId,
  isDirty,
  onApplyPreset,
  onSaveCurrent,
  onUpdateActive,
  onRenamePreset,
  onDeletePreset,
}) {
  const [menuOpenId, setMenuOpenId] = useState(null)

  function handleSaveClick() {
    const name = window.prompt('Nome do filtro salvo (ex: Estúdio pilates):')
    if (!name?.trim()) return
    onSaveCurrent(name.trim())
  }

  function handleRename(preset) {
    const name = window.prompt('Novo nome do filtro:', preset.name)
    if (!name?.trim() || name.trim() === preset.name) return
    onRenamePreset(preset.id, name.trim())
    setMenuOpenId(null)
  }

  function handleDelete(preset) {
    const confirmed = window.confirm(`Excluir o filtro "${preset.name}"?`)
    if (!confirmed) return
    onDeletePreset(preset.id)
    setMenuOpenId(null)
  }

  return (
    <section className="saved-filters" aria-label="Filtros salvos">
      <div className="saved-filters__header">
        <span className="saved-filters__label">Filtros salvos</span>
        {isDirty && activePresetId && (
          <span className="saved-filters__dirty">Alterado</span>
        )}
      </div>

      <div className="saved-filters__row">
        {presets.map((preset) => {
          const isActive = preset.id === activePresetId
          return (
            <div
              key={preset.id}
              className={`saved-filters__chip-wrap${isActive ? ' saved-filters__chip-wrap--active' : ''}`}
            >
              <button
                type="button"
                className={`saved-filters__chip${isActive ? ' saved-filters__chip--active' : ''}`}
                aria-pressed={isActive}
                onClick={() => onApplyPreset(preset.id)}
              >
                {preset.name}
              </button>
              <div className="saved-filters__chip-menu">
                <button
                  type="button"
                  className="saved-filters__chip-menu-btn"
                  aria-label={`Opções do filtro ${preset.name}`}
                  aria-expanded={menuOpenId === preset.id}
                  onClick={() => setMenuOpenId(menuOpenId === preset.id ? null : preset.id)}
                >
                  ⋯
                </button>
                {menuOpenId === preset.id && (
                  <div className="saved-filters__menu" role="menu">
                    <button type="button" role="menuitem" onClick={() => handleRename(preset)}>
                      Renomear
                    </button>
                    {isActive && isDirty && (
                      <button type="button" role="menuitem" onClick={() => { onUpdateActive(); setMenuOpenId(null) }}>
                        Atualizar com filtros atuais
                      </button>
                    )}
                    <button type="button" role="menuitem" className="saved-filters__menu-danger" onClick={() => handleDelete(preset)}>
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        <button type="button" className="saved-filters__add btn btn--secondary btn--small" onClick={handleSaveClick}>
          + Salvar filtros atuais
        </button>

        {isDirty && activePresetId && (
          <button type="button" className="btn btn--small btn--secondary saved-filters__update" onClick={onUpdateActive}>
            Atualizar preset
          </button>
        )}
      </div>
    </section>
  )
}
