'use client'

// components/loja/BotaoAdicionarCarrinho.tsx
// Client Component separado pois precisa do useCarrinho (hook com estado)

import { useState } from 'react'
import { useCarrinho } from '@/hooks/useCarrinho'
import type { Produto } from '@/lib/types'

export default function BotaoAdicionarCarrinho({ produto }: { produto: Produto }) {
  const { adicionar } = useCarrinho()
  const [adicionado, setAdicionado] = useState(false)

  function handleAdicionar() {
    adicionar(produto)
    setAdicionado(true)
    setTimeout(() => setAdicionado(false), 2000)
  }

  if (produto.estoque === 0) {
    return (
      <button disabled className="w-full btn-primary opacity-50 cursor-not-allowed">
        Produto esgotado
      </button>
    )
  }

  return (
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
  )
}
