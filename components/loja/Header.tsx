'use client'

// components/loja/Header.tsx
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCarrinho } from '@/hooks/useCarrinho'
import { formatarPreco } from '@/lib/types'

export default function Header() {
  const [carrinhoAberto, setCarrinhoAberto] = useState(false)
  const { itens, totalItens, totalCentavos, remover, atualizarQuantidade } = useCarrinho()

  return (
    <>
      {/* NAV */}
      <header className="sticky top-0 z-40 bg-[#2E1208] border-b border-[#7b3728]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* LOGO — troca o bloco abaixo pela imagem quando tiver o PNG */}
          <Link href="/" className="flex items-center">
            {/* Com imagem: */}
            <Image src="/logo.png" alt="Casa Raiz" width={80} height={60} className="object-contain" />

            {/* Texto provisório com as cores novas: */}
            {/* <span className="font-serif text-xl font-semibold tracking-wide text-[#F4D8C5]">
              Casa <span className="text-[#E8C97A]">Raiz</span>
            </span> */}
          </Link>

          <nav className="hidden md:flex gap-8">
            {['Louças', 'Tapetes', 'Almofadas', 'Artigos Diversos', 'Peseiras ou Mantas', 'Mesa', 'Cama'].map(cat => (
              <Link
                key={cat}
                href={`/loja?categoria=${cat.toLowerCase()}`}
                className="text-xs tracking-widest uppercase text-[#F4D8C5]/70 hover:text-[#E8C97A] transition-colors"
              >
                {cat}
              </Link>
            ))}
          </nav>

          <button
            onClick={() => setCarrinhoAberto(true)}
            className="flex items-center gap-2 bg-[#7b3728] text-[#F4D8C5] text-xs tracking-widest uppercase px-4 py-2 rounded transition-colors hover:bg-[#9b4a35]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Carrinho
            {totalItens > 0 && (
              <span className="bg-[#E8C97A] text-[#7b3728] rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-semibold">
                {totalItens}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* CARRINHO DRAWER */}
      {carrinhoAberto && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-[#2E1208]/60"
            onClick={() => setCarrinhoAberto(false)}
          />

          <div className="relative w-full max-w-sm bg-[#fdfaf5] flex flex-col h-full shadow-2xl">

            {/* Header do drawer */}
            <div className="bg-[#7b3728] text-[#F4D8C5] px-5 py-4 flex items-center justify-between flex-shrink-0">
              <h2 className="font-serif text-xl font-medium">Carrinho</h2>
              <button onClick={() => setCarrinhoAberto(false)} className="text-2xl leading-none hover:text-[#E8C97A] transition-colors">×</button>
            </div>

            {/* Itens */}
            <div className="flex-1 overflow-y-auto p-5">
              {itens.length === 0 ? (
                <div className="text-center py-12 text-[#8A7A60]">
                  <div className="text-5xl mb-4 opacity-40">🧺</div>
                  <p>Seu carrinho está vazio.</p>
                </div>
              ) : (
                itens.map(item => (
                  <div key={item.produto.id} className="flex gap-3 py-3 border-b border-[#EDE6D6] last:border-0">
                    <div className="w-14 h-14 rounded bg-[#F5F0E8] flex-shrink-0 overflow-hidden border border-[#D4C9B0]">
                      {item.produto.imagens?.[0] ? (
                        <img src={item.produto.imagens[0]} alt={item.produto.nome}
                          className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🏠</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-serif font-medium text-sm leading-tight truncate text-[#2A2218]">{item.produto.nome}</p>
                      {item.variante && (
                        <p className='text-xs text-text-light mt-0.5'>{item.variante.nome}</p>
                      )}
                      <p className="text-xs text-[#8A7A60] mt-0.5">{item.produto.categoria}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => atualizarQuantidade(item.produto.id, item.variante?.id, item.quantidade - 1)}
                          className="w-6 h-6 rounded-full border border-[#D4C9B0] flex items-center justify-center text-sm hover:border-[#7b3728] transition-colors"
                        >−</button>
                        <span className="text-sm font-medium w-5 text-center">{item.quantidade}</span>
                        <button
                          onClick={() => atualizarQuantidade(item.produto.id, item.variante?.id,  item.quantidade + 1)}
                          className="w-6 h-6 rounded-full border border-[#D4C9B0] flex items-center justify-center text-sm hover:border-[#7b3728] transition-colors"
                        >+</button>
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-between flex-shrink-0">
                      <span className="text-sm font-medium text-[#5C4A2A]">
                        {formatarPreco(item.produto.preco * item.quantidade)}
                      </span>
                      <button
                        onClick={() => remover(item.produto.id, item.variante?.id)}
                        className="text-[#8A7A60] hover:text-red-500 text-lg transition-colors"
                      >×</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer do drawer */}
            {itens.length > 0 && (
              <div className="border-t border-[#D4C9B0] p-5 bg-[#F5F0E8] flex-shrink-0">
                <div className="flex justify-between text-sm text-[#5C4E38] mb-1">
                  <span>Subtotal</span><span>{formatarPreco(totalCentavos)}</span>
                </div>
                <div className="flex justify-between font-serif text-lg font-medium mb-4 text-[#2A2218]">
                  <span>Total</span><span>{formatarPreco(totalCentavos)}</span>
                </div>
                <Link
                  href="/checkout"
                  onClick={() => setCarrinhoAberto(false)}
                  className="block w-full text-center bg-[#E8C97A] text-[#7b3728] text-xs tracking-widest uppercase px-6 py-3 rounded transition-colors hover:bg-[#d4b560] font-medium"
                >
                  Finalizar compra
                </Link>
                <p className="text-center text-[11px] text-[#8A7A60] mt-2">
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
