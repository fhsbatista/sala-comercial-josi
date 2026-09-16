/** @param {{ imovel: import('../data/imoveis.js').Imovel, onAvaliacaoChange: (id: number, avaliacao: 'gostei'|'descartado'|null) => void, updating?: boolean, compact?: boolean }} props */
export default function PropertyAvaliacaoActions({
  imovel,
  onAvaliacaoChange,
  updating = false,
  compact = false,
}) {
  function toggle(target) {
    if (updating) return
    const next = imovel.avaliacao === target ? null : target
    onAvaliacaoChange(imovel.id, next)
  }

  const sizeClass = compact ? ' btn--small avaliacao-actions__btn--compact' : ''

  return (
    <div
      className={`avaliacao-actions${compact ? ' avaliacao-actions--compact' : ''}`}
      role="group"
      aria-label={`Avaliar ${imovel.descricao}`}
    >
      <button
        type="button"
        className={`btn btn--liked${sizeClass}${imovel.avaliacao === 'gostei' ? ' btn--liked-active' : ''}`}
        onClick={() => toggle('gostei')}
        disabled={updating}
        aria-pressed={imovel.avaliacao === 'gostei'}
        title={imovel.avaliacao === 'gostei' ? 'Remover gostei' : 'Marcar como gostei'}
      >
        {imovel.avaliacao === 'gostei' ? '♥' : '♡'}
        {!compact && (updating ? ' Salvando...' : ' Gostei')}
      </button>
      <button
        type="button"
        className={`btn btn--discarded${sizeClass}${imovel.avaliacao === 'descartado' ? ' btn--discarded-active' : ''}`}
        onClick={() => toggle('descartado')}
        disabled={updating}
        aria-pressed={imovel.avaliacao === 'descartado'}
        title={imovel.avaliacao === 'descartado' ? 'Remover descarte' : 'Marcar como descartado'}
      >
        ✕{!compact && (updating ? ' Salvando...' : ' Descartar')}
      </button>
    </div>
  )
}
