import { useMemo, useState } from 'react'

export default function PhotoCarousel({ fotos, alt, variant = 'popup' }) {
  const images = useMemo(() => (fotos ?? []).filter(Boolean), [fotos])
  const [index, setIndex] = useState(0)

  if (images.length === 0) {
    return (
      <div className="photo-carousel photo-carousel--empty" role="img" aria-label={alt}>
        <span>Sem fotos disponíveis</span>
      </div>
    )
  }

  const current = images[Math.min(index, images.length - 1)]
  const hasMany = images.length > 1

  function goPrev() {
    setIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  function goNext() {
    setIndex((prev) => (prev + 1) % images.length)
  }

  return (
    <div
      className={`photo-carousel${variant === 'detail' ? ' photo-carousel--detail' : ''}`}
      role="region"
      aria-roledescription="carrossel"
      aria-label={`Fotos: ${alt}`}
    >
      <div className="photo-carousel__viewport">
        <img
          className="photo-carousel__image"
          src={current}
          alt={`${alt} — foto ${index + 1} de ${images.length}`}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>

      {hasMany && (
        <>
          <button type="button" className="photo-carousel__nav photo-carousel__nav--prev" onClick={goPrev} aria-label="Foto anterior">
            ‹
          </button>
          <button type="button" className="photo-carousel__nav photo-carousel__nav--next" onClick={goNext} aria-label="Próxima foto">
            ›
          </button>
          <div className="photo-carousel__dots" aria-hidden={!hasMany}>
            {images.map((_, dotIndex) => (
              <button
                key={dotIndex}
                type="button"
                className={`photo-carousel__dot${dotIndex === index ? ' photo-carousel__dot--active' : ''}`}
                onClick={() => setIndex(dotIndex)}
                aria-label={`Ir para foto ${dotIndex + 1}`}
              />
            ))}
          </div>
          <p className="photo-carousel__counter">{index + 1} / {images.length}</p>
        </>
      )}
    </div>
  )
}