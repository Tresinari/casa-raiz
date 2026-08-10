'use client'

// components/loja/BotaoAdicionarCarrinho.tsx
import { useState } from 'react'
import { useCarrinho } from '@/hooks/useCarrinho'
import CalculadoraFrete from './CalculadoraFrete'
import { formatarPreco } from '@/lib/types'
import type { Produto, Variante } from '@/lib/types'

const FRETE_GRATIS_ACIMA = 20000

export default function BotaoAdicionarCarrinho({ produto }: { produto: Produto }) {
  const { adicionar } = useCarrinho()
  const [adicionado, setAdicionado] = useState(false)
  const [varianteSelecionada, setVarianteSelecionada] = useState<Variante | null>(
    produto.variantes && produto.variantes.length > 0 ? null : null
  )

  const temVariantes = produto.variantes && produto.variantes.length > 0
  const variantesAtivas = produto.variantes?.filter(v => v.ativo) || []

  // Preço e estoque exibidos dependem da variante selecionada
  const precoAtual = varianteSelecionada ? varianteSelecionada.preco : produto.preco
  const estoqueAtual = varianteSelecionada ? varianteSelecionada.estoque : produto.estoque
  const freteGratis = precoAtual >= FRETE_GRATIS_ACIMA

  // Produto para cálculo de frete usa dimensões da variante ou do produto
  const produtoParaFrete = [{
    id:             produto.id,
    preco:          precoAtual,
    quantidade:     1,
    peso_gramas:    varianteSelecionada?.peso_gramas ?? produto.peso_gramas,
    altura_cm:      varianteSelecionada?.altura_cm ?? produto.altura_cm,
    largura_cm:     varianteSelecionada?.largura_cm ?? produto.largura_cm,
    comprimento_cm: varianteSelecionada?.comprimento_cm ?? produto.comprimento_cm,
  }]

  function handleAdicionar() {
    if (temVariantes && !varianteSelecionada) return
    adicionar(produto, varianteSelecionada ?? undefined)
    setAdicionado(true)
    setTimeout(() => setAdicionado(false), 2000)
  }

  const podeAdicionar = estoqueAtual > 0 && (!temVariantes || varianteSelecionada !== null)

  return (
    <div className="space-y-4">

      {/* Seletor de variantes */}
      {temVariantes && variantesAtivas.length > 0 && (
        <div>
          <p className="text-xs tracking-wider uppercase text-text-light mb-2">
            Escolha uma opção
          </p>
          <div className="space-y-2">
            {variantesAtivas.map(v => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVarianteSelecionada(v)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded border text-sm transition-all ${
                  varianteSelecionada?.id === v.id
                    ? 'border-forest bg-forest/5 text-forest'
                    : 'border-linen hover:border-forest/40 text-text-dark'
                } ${v.estoque === 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                disabled={v.estoque === 0}
              >
                <span className="font-medium">
                  {v.nome}
                  {v.estoque === 0 && (
                    <span className="ml-2 text-xs font-normal text-red-400">Esgotado</span>
                  )}
                  {v.estoque > 0 && v.estoque <= 5 && (
                    <span className="ml-2 text-xs font-normal text-gold">
                      Últimas {v.estoque} un.
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-bark">{formatarPreco(v.preco)}</span>
                  <div className={`w-4 h-4 rounded-full border-2 transition-colors ${
                    varianteSelecionada?.id === v.id
                      ? 'border-forest bg-forest'
                      : 'border-linen'
                  }`} />
                </div>
              </button>
            ))}
          </div>

          {/* Aviso se não selecionou */}
          {!varianteSelecionada && (
            <p className="text-xs text-text-light mt-2">
              Selecione uma opção para continuar
            </p>
          )}
        </div>
      )}

      {/* Badge frete grátis */}
      {freteGratis && (
        <div className="flex items-center gap-2 bg-forest/10 border border-forest/20 rounded px-3 py-2">
          <span>🎉</span>
          <p className="text-xs text-forest font-medium">Este produto tem frete grátis!</p>
        </div>
      )}

      {/* Botão adicionar */}
      {estoqueAtual === 0 && (!temVariantes || varianteSelecionada) ? (
        <button disabled className="w-full btn-primary opacity-50 cursor-not-allowed">
          Produto esgotado
        </button>
      ) : (
        <button
          onClick={handleAdicionar}
          disabled={!podeAdicionar}
          className={`w-full transition-all py-3 text-xs tracking-widest uppercase rounded font-sans disabled:opacity-50 disabled:cursor-not-allowed ${
            adicionado
              ? 'bg-forest-mid text-off-white'
              : 'bg-forest text-off-white hover:bg-bark'
          }`}
        >
          {adicionado
            ? '✓ Adicionado ao carrinho!'
            : temVariantes && !varianteSelecionada
            ? 'Selecione uma opção'
            : 'Adicionar ao carrinho'}
        </button>
      )}

      {/* Calculadora de frete */}
      <CalculadoraFrete
        produtos={produtoParaFrete}
        freteGratis={freteGratis}
      />
    </div>
  )
}