'use client'

// components/loja/CardProduto.tsx
import Link from 'next/link'
import { Produto, formatarPreco } from '@/lib/types'
import { useCarrinho } from '@/hooks/useCarrinho'

export default function CardProduto({ produto }: { produto: Produto }) {
  const { adicionar } = useCarrinho()
  const temDesconto = produto.preco_original && produto.preco_original > produto.preco

  return (
    <div className="card group cursor-pointer">
      {/* Imagem */}
      <Link href={`/produto/${produto.slug}`}>
        <div className="aspect-square bg-cream overflow-hidden relative">
          {produto.imagens?.[0] ? (
            <img
              src={produto.imagens[0]}
              alt={produto.nome}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl text-linen">🏠</div>
          )}

          {/* Badge */}
          {temDesconto && (
            <span className="absolute top-2 left-2 bg-gold text-off-white text-[10px] tracking-wider uppercase px-2 py-1 rounded-sm">
              Promoção
            </span>
          )}
          {produto.destaque && !temDesconto && (
            <span className="absolute top-2 left-2 bg-forest text-off-white text-[10px] tracking-wider uppercase px-2 py-1 rounded-sm">
              Novo
            </span>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-4">
        <p className="text-[10px] tracking-widest uppercase text-text-light mb-1">{produto.categoria}</p>

        <Link href={`/produto/${produto.slug}`}>
          <h3 className="font-serif text-[17px] font-medium text-text-dark leading-tight mb-3 hover:text-forest transition-colors">
            {produto.nome}
          </h3>
        </Link>

        <div className="flex items-center justify-between">
          <div>
            {temDesconto && (
              <span className="text-xs text-text-light line-through mr-1">
                {formatarPreco(produto.preco_original!)}
              </span>
            )}
            <span className="text-[17px] font-medium text-bark">
              {formatarPreco(produto.preco)}
            </span>
          </div>

          {produto.estoque > 0 ? (
            <button
              onClick={() => adicionar(produto)}
              className="w-8 h-8 rounded-full bg-forest text-off-white flex items-center justify-center text-xl hover:bg-bark transition-colors active:scale-95"
              aria-label={`Adicionar ${produto.nome} ao carrinho`}
            >
              +
            </button>
          ) : (
            <span className="text-[11px] text-text-light">Esgotado</span>
          )}
        </div>
      </div>
    </div>
  )
}
