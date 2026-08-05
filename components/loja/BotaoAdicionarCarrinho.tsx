'use client'

// components/loja/BotaoAdicionarCarrinho.tsx
import { useState } from 'react'
import { useCarrinho } from '@/hooks/useCarrinho'
import CalculadoraFrete from './CalculadoraFrete'
import type { Produto } from '@/lib/types'

const FRETE_GRATIS_ACIMA = 20000

export default function BotaoAdicionarCarrinho({ produto }: { produto: Produto }) {
  const { adicionar } = useCarrinho()
  const [adicionado, setAdicionado] = useState(false)

  function handleAdicionar() {
    adicionar(produto)
    setAdicionado(true)
    setTimeout(() => setAdicionado(false), 2000)
  }

  const produtoParaFrete = [{
    id:             produto.id,
    preco:          produto.preco,
    quantidade:     1,
    peso_gramas:    produto.peso_gramas,
    altura_cm:      produto.altura_cm,
    largura_cm:     produto.largura_cm,
    comprimento_cm: produto.comprimento_cm,
  }]

  const freteGratis = produto.preco >= FRETE_GRATIS_ACIMA

  return (
    <div>
      {produto.estoque === 0 ? (
        <button disabled className="w-full btn-primary opacity-50 cursor-not-allowed">
          Produto esgotado
        </button>
      ) : (
        <>
          {/* Badge de frete grátis acima do botão */}
          {freteGratis && (
            <div className="flex items-center gap-2 bg-forest/10 border border-forest/20 rounded px-3 py-2 mb-2">
              <span>🎉</span>
              <p className="text-xs text-forest font-medium">Este produto tem frete grátis!</p>
            </div>
          )}

          <button
            onClick={handleAdicionar}
            className={`w-full transition-all py-3 text-xs tracking-widest uppercase rounded font-sans ${
              adicionado
                ? 'bg-forest-mid text-off-white'
                : 'bg-forest text-off-white hover:bg-bark'
            }`}
          >
            {adicionado ? '✓ Adicionado ao carrinho!' : 'Adicionar ao carrinho'}
          </button>
        </>
      )}

      {/* Calculadora de frete */}
      <CalculadoraFrete
        produtos={produtoParaFrete}
        freteGratis={freteGratis}
      />
    </div>
  )
}
