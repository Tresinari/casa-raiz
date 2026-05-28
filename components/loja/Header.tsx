'use client'

// components/loja/Header.tsx
import { useState } from 'react'
import Link from 'next/link'
import { useCarrinho } from '@/hooks/useCarrinho'
import { formatarPreco } from '@/lib/types'

export default function Header() {
  const [carrinhoAberto, setCarrinhoAberto] = useState(false)
  const { itens, totalItens, totalCentavos, remover, atualizarQuantidade } = useCarrinho()

  return (
    <>
      {/* NAV */}
      <header className="sticky top-0 z-40 bg-off-white border-b border-linen">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

          <Link href="/" className="font-serif text-xl font-semibold text-forest tracking-wide">
            Casa <span className="text-gold">Raiz</span>
          </Link>

          <nav className="hidden md:flex gap-8">
            {['Mantas', 'Tapetes', 'Almofadas', 'Cama', 'Mesa'].map(cat => (
              <Link
                key={cat}
                href={`/loja?categoria=${cat.toLowerCase()}`}
                className="text-xs tracking-widest uppercase text-text-mid hover:text-forest transition-colors"
              >
                {cat}
              </Link>
            ))}
          </nav>

          <button
            onClick={() => setCarrinhoAberto(true)}
            className="flex items-center gap-2 bg-forest text-off-white text-xs tracking-widest uppercase px-4 py-2 rounded transition-colors hover:bg-bark"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Carrinho
            {totalItens > 0 && (
              <span className="bg-gold text-off-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-medium">
                {totalItens}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* CARRINHO DRAWER */}
      {carrinhoAberto && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-text-dark/50"
            onClick={() => setCarrinhoAberto(false)}
          />

          {/* Painel */}
          <div className="relative w-full max-w-sm bg-off-white flex flex-col h-full shadow-2xl">

            {/* Header */}
            <div className="bg-forest text-off-white px-5 py-4 flex items-center justify-between flex-shrink-0">
              <h2 className="font-serif text-xl font-medium">Carrinho</h2>
              <button onClick={() => setCarrinhoAberto(false)} className="text-2xl leading-none">×</button>
            </div>

            {/* Itens */}
            <div className="flex-1 overflow-y-auto p-5">
              {itens.length === 0 ? (
                <div className="text-center py-12 text-text-light">
                  <div className="text-5xl mb-4 opacity-40">🧺</div>
                  <p>Seu carrinho está vazio.</p>
                </div>
              ) : (
                itens.map(item => (
                  <div key={item.produto.id} className="flex gap-3 py-3 border-b border-cream last:border-0">
                    {/* Imagem */}
                    <div className="w-14 h-14 rounded bg-cream flex-shrink-0 overflow-hidden">
                      {item.produto.imagens?.[0] ? (
                        <img src={item.produto.imagens[0]} alt={item.produto.nome}
                          className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🏠</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-serif font-medium text-sm leading-tight truncate">{item.produto.nome}</p>
                      <p className="text-xs text-text-light mt-0.5">{item.produto.categoria}</p>

                      {/* Quantidade */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => atualizarQuantidade(item.produto.id, item.quantidade - 1)}
                          className="w-6 h-6 rounded-full border border-linen flex items-center justify-center text-sm hover:border-forest transition-colors"
                        >−</button>
                        <span className="text-sm font-medium w-5 text-center">{item.quantidade}</span>
                        <button
                          onClick={() => atualizarQuantidade(item.produto.id, item.quantidade + 1)}
                          className="w-6 h-6 rounded-full border border-linen flex items-center justify-center text-sm hover:border-forest transition-colors"
                        >+</button>
                      </div>
                    </div>

                    {/* Preço e remover */}
                    <div className="flex flex-col items-end justify-between flex-shrink-0">
                      <span className="text-sm font-medium text-bark">
                        {formatarPreco(item.produto.preco * item.quantidade)}
                      </span>
                      <button
                        onClick={() => remover(item.produto.id)}
                        className="text-text-light hover:text-red-500 text-lg transition-colors"
                      >×</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {itens.length > 0 && (
              <div className="border-t border-linen p-5 bg-cream flex-shrink-0">
                <div className="flex justify-between text-sm text-text-mid mb-1">
                  <span>Subtotal</span><span>{formatarPreco(totalCentavos)}</span>
                </div>
                <div className="flex justify-between font-serif text-lg font-medium mb-4">
                  <span>Total</span><span>{formatarPreco(totalCentavos)}</span>
                </div>
                <Link
                  href="/checkout"
                  onClick={() => setCarrinhoAberto(false)}
                  className="block w-full text-center btn-gold"
                >
                  Finalizar compra
                </Link>
                <p className="text-center text-[11px] text-text-light mt-2">
                  ⚡ Pix com 5% de desconto adicional
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
