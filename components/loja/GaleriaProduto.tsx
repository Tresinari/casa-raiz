'use client'

// components/loja/GaleriaProduto.tsx
// Galeria interativa com troca de imagem principal ao clicar nas miniaturas

import { useState } from 'react'

type Props = {
  imagens: string[]
  nomeProduto: string
}

export default function GaleriaProduto({ imagens, nomeProduto }: Props) {
  const [indexAtivo, setIndexAtivo] = useState(0)

  if (!imagens || imagens.length === 0) {
    return (
      <div className="aspect-square bg-cream rounded border border-linen flex items-center justify-center text-7xl text-linen">
        🏠
      </div>
    )
  }

  return (
    <div>
      {/* Imagem principal */}
      <div className="aspect-square bg-cream rounded overflow-hidden border border-linen mb-2 relative">
        <img
          src={imagens[indexAtivo]}
          alt={`${nomeProduto} — foto ${indexAtivo + 1}`}
          className="w-full h-full object-cover transition-opacity duration-200"
        />

        {/* Setas de navegação — só aparece se tiver mais de uma foto */}
        {imagens.length > 1 && (
          <>
            <button
              onClick={() => setIndexAtivo(i => (i === 0 ? imagens.length - 1 : i - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-text-dark/50 hover:bg-text-dark/70 text-off-white rounded-full flex items-center justify-center transition-colors"
              aria-label="Foto anterior"
            >
              ‹
            </button>
            <button
              onClick={() => setIndexAtivo(i => (i === imagens.length - 1 ? 0 : i + 1))}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-text-dark/50 hover:bg-text-dark/70 text-off-white rounded-full flex items-center justify-center transition-colors"
              aria-label="Próxima foto"
            >
              ›
            </button>

            {/* Indicador de posição */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {imagens.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndexAtivo(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    i === indexAtivo
                      ? 'bg-off-white w-3'
                      : 'bg-off-white/50'
                  }`}
                  aria-label={`Foto ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Miniaturas — só aparece se tiver mais de uma foto */}
      {imagens.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {imagens.map((url, i) => (
            <button
              key={i}
              onClick={() => setIndexAtivo(i)}
              className={`aspect-square rounded overflow-hidden border-2 transition-all ${
                i === indexAtivo
                  ? 'border-forest'
                  : 'border-linen hover:border-forest/40'
              }`}
            >
              <img
                src={url}
                alt={`${nomeProduto} — miniatura ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
