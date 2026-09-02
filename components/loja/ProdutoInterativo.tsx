'use client'

// components/loja/ProdutoInterativo.tsx
import { useState } from 'react'
import GaleriaProduto from './GaleriaProduto'
import CalculadoraFrete from './CalculadoraFrete'
import { useCarrinho } from '@/hooks/useCarrinho'
import { formatarPreco } from '@/lib/types'
import type { Produto, Variante } from '@/lib/types'

const FRETE_GRATIS_ACIMA = 20000

type Props = {
  produto: Produto
  variantesAtivas: Variante[]
}

export default function ProdutoInterativo({ produto, variantesAtivas }: Props) {
  const { adicionar } = useCarrinho()
  const [varianteSelecionada, setVarianteSelecionada] = useState<Variante | null>(null)
  const [adicionado, setAdicionado] = useState(false)

  const temVariantes = variantesAtivas.length > 0

  // Galeria: usa as fotos da variante selecionada se existirem,
  // senão cai nas fotos do produto
  const imagensExibidas = (() => {
    if (varianteSelecionada?.imagens && varianteSelecionada.imagens.length > 0) {
      return varianteSelecionada.imagens
    }
    return produto.imagens || []
  })()

  const precoAtual = varianteSelecionada ? varianteSelecionada.preco : produto.preco
  const estoqueAtual = varianteSelecionada ? varianteSelecionada.estoque : produto.estoque
  const freteGratis = precoAtual >= FRETE_GRATIS_ACIMA

  const produtoParaFrete = [{
    id:             produto.id,
    preco:          precoAtual,
    quantidade:     1,
    peso_gramas:    varianteSelecionada?.peso_gramas ?? produto.peso_gramas,
    altura_cm:      varianteSelecionada?.altura_cm ?? produto.altura_cm,
    largura_cm:     varianteSelecionada?.largura_cm ?? produto.largura_cm,
    comprimento_cm: varianteSelecionada?.comprimento_cm ?? produto.comprimento_cm,
  }]

  function handleSelecionar(v: Variante) {
    setVarianteSelecionada(prev => prev?.id === v.id ? null : v)
  }

  function handleAdicionar() {
    if (temVariantes && !varianteSelecionada) return
    adicionar(produto, varianteSelecionada ?? undefined)
    setAdicionado(true)
    setTimeout(() => setAdicionado(false), 2000)
  }

  const podeAdicionar = estoqueAtual > 0 && (!temVariantes || varianteSelecionada !== null)

  return (
    <div className="grid md:grid-cols-2 gap-10">

      {/* GALERIA — muda automaticamente ao selecionar variante */}
      <GaleriaProduto
        imagens={imagensExibidas}
        nomeProduto={produto.nome}
      />

      {/* INFORMAÇÕES */}
      <div className="space-y-4">
        <div>
          <p className="text-[11px] tracking-widest uppercase text-text-light mb-2">
            {produto.categoria}
          </p>
          <h1 className="font-serif text-3xl font-medium text-text-dark leading-tight">
            {produto.nome}
          </h1>
        </div>

        {/* Preço */}
        <div>
          {produto.preco_original && !temVariantes && (
            <span className="text-base text-text-light line-through mr-2">
              {formatarPreco(produto.preco_original)}
            </span>
          )}
          <span className="text-2xl font-medium text-bark">
            {temVariantes && !varianteSelecionada ? 'A partir de ' : ''}
            {formatarPreco(precoAtual)}
          </span>

          {(!temVariantes || varianteSelecionada) && (
            <p className="text-sm text-forest-mid font-medium mt-1">
              ⚡ {formatarPreco(Math.round(precoAtual * 0.95))} no Pix (5% off)
            </p>
          )}
          {temVariantes && !varianteSelecionada && (
            <p className="text-xs text-text-light mt-1">
              Selecione uma opção para ver o preço final
            </p>
          )}
        </div>

        {/* Seletor de variantes */}
        {temVariantes && (
          <div>
            <p className="text-xs tracking-wider uppercase text-text-light mb-2">
              Escolha uma opção
            </p>
            <div className="space-y-2">
              {variantesAtivas.map(v => {
                const temFotos = v.imagens && v.imagens.length > 0
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleSelecionar(v)}
                    disabled={v.estoque === 0}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded border text-sm transition-all ${
                      varianteSelecionada?.id === v.id
                        ? 'border-forest bg-forest/5 text-forest'
                        : 'border-linen hover:border-forest/40 text-text-dark'
                    } ${v.estoque === 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {/* Miniatura da primeira foto da variante */}
                    {temFotos ? (
                      <img
                        src={v.imagens![0]}
                        alt={v.nome}
                        className="w-9 h-9 rounded object-cover border border-linen flex-shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded bg-cream border border-linen flex-shrink-0" />
                    )}

                    <span className="flex-1 text-left font-medium">
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

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-medium text-bark">{formatarPreco(v.preco)}</span>
                      <div className={`w-4 h-4 rounded-full border-2 transition-colors ${
                        varianteSelecionada?.id === v.id
                          ? 'border-forest bg-forest'
                          : 'border-linen'
                      }`} />
                    </div>
                  </button>
                )
              })}
            </div>
            {!varianteSelecionada && (
              <p className="text-xs text-text-light mt-2">
                Selecione uma opção para continuar
              </p>
            )}
          </div>
        )}

        {/* Frete grátis */}
        {freteGratis && (
          <div className="flex items-center gap-2 bg-forest/10 border border-forest/20 rounded px-3 py-2">
            <span>🎉</span>
            <p className="text-xs text-forest font-medium">Este produto tem frete grátis!</p>
          </div>
        )}

        {/* Botão */}
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

        <p className="text-center text-xs text-text-light">
          🚚 Frete calculado no checkout
        </p>

        {/* Calculadora de frete */}
        <CalculadoraFrete
          produtos={produtoParaFrete}
          freteGratis={freteGratis}
        />

        {/* Descrição */}
        {produto.descricao && (
          <div className="pt-4 border-t border-linen">
            <p className="text-sm text-text-mid leading-relaxed whitespace-pre-line">
              {produto.descricao}
            </p>
          </div>
        )}

        {!temVariantes && produto.estoque <= 5 && produto.estoque > 0 && (
          <p className="text-xs text-gold font-medium">
            ⚠️ Últimas {produto.estoque} unidades!
          </p>
        )}
      </div>
    </div>
  )
}
