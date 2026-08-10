import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import Header from '@/components/loja/Header'
import BotaoAdicionarCarrinho from '@/components/loja/BotaoAdicionarCarrinho'
import { formatarPreco, precoMinimo } from '@/lib/types'

export default async function ProdutoPage({ params }: { params: { slug: string } }) {
  const supabase = createServerSupabase()

  // Busca o produto com suas variantes
  const { data: produto } = await supabase
    .from('produtos')
    .select('*, variantes(*)')
    .eq('slug', params.slug)
    .eq('ativo', true)
    .single()

  if (!produto) notFound()

  const temVariantes = produto.variantes && produto.variantes.length > 0
  const variantesAtivas = produto.variantes?.filter((v: any) => v.ativo) || []
  const precoDe = precoMinimo(produto)
  const precoPix = Math.round(precoDe * 0.95)

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-10">

          {/* GALERIA */}
          <div>
            <div className="aspect-square bg-cream rounded overflow-hidden mb-2 border border-linen">
              {produto.imagens?.[0] ? (
                <img
                  src={produto.imagens[0]}
                  alt={produto.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-7xl text-linen">🏠</div>
              )}
            </div>
            {produto.imagens?.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {produto.imagens.map((url: string, i: number) => (
                  <div key={i} className="aspect-square rounded overflow-hidden border border-linen">
                    <img src={url} alt={`${produto.nome} ${i + 1}`}
                      className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* INFORMAÇÕES */}
          <div>
            <p className="text-[11px] tracking-widest uppercase text-text-light mb-2">
              {produto.categoria}
            </p>

            <h1 className="font-serif text-3xl font-medium text-text-dark mb-4 leading-tight">
              {produto.nome}
            </h1>

            {/* Preço — mostra "a partir de" se tem variantes */}
            <div className="mb-1">
              {produto.preco_original && !temVariantes && (
                <span className="text-base text-text-light line-through mr-2">
                  {formatarPreco(produto.preco_original)}
                </span>
              )}
              <span className="text-2xl font-medium text-bark">
                {temVariantes ? 'A partir de ' : ''}
                {formatarPreco(precoDe)}
              </span>
            </div>

            {/* Preço Pix — só quando não tem variantes (variante define o preço) */}
            {!temVariantes && (
              <p className="text-sm text-forest-mid font-medium mb-6">
                ⚡ {formatarPreco(precoPix)} no Pix (5% off)
              </p>
            )}

            {/* {temVariantes && (
              <p className="text-xs text-text-light mb-6">
                Selecione uma opção para ver o preço final e o desconto no Pix
              </p>
            )} */}

            {/* Botão com seletor de variantes integrado */}
            <BotaoAdicionarCarrinho produto={{ ...produto, variantes: variantesAtivas }} />

            {/* <p className="text-center text-xs text-text-light mt-2">
              🚚 Frete calculado no checkout
            </p> */}

            {/* Descrição */}
            {produto.descricao && (
              <div className="mt-6 pt-6 border-t border-linen">
                <p className="text-sm text-text-mid leading-relaxed whitespace-pre-line">
                  {produto.descricao}
                </p>
              </div>
            )}

            {/* Estoque — só para produtos sem variante */}
            {!temVariantes && produto.estoque <= 5 && produto.estoque > 0 && (
              <p className="mt-4 text-xs text-gold font-medium">
                ⚠️ Últimas {produto.estoque} unidades!
              </p>
            )}
          </div>
        </div>
      </main>
    </>
  )
}