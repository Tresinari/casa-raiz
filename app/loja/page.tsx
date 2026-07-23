// app/loja/page.tsx — Server Component com filtro por categoria
import { createServerSupabase } from '@/lib/supabase-server'
import CardProduto from '@/components/loja/CardProduto'
import Header from '@/components/loja/Header'
import type { Produto } from '@/lib/types'

const CATEGORIAS = ['Todas', 'Louças', 'Tapetes', 'Almofadas', 'Artigos de Decoração', 'Peseiras ou Mantas']

export default async function LojaPage({
  searchParams,
}: {
  searchParams: { categoria?: string }
}) {
  const supabase = createServerSupabase()
  const categoriaAtiva = searchParams.categoria || 'todas'

  let query = supabase
    .from('produtos')
    .select('*')
    .eq('ativo', true)
    .order('criado_em', { ascending: false })

  if (categoriaAtiva !== 'todas') {
    query = query.ilike('categoria', categoriaAtiva)
  }

  const { data } = await query
  const produtos: Produto[] = data || []

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-12">

        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-3xl font-medium text-forest mb-1">Produtos</h1>
            <p className="text-sm text-text-light">{produtos.length} produtos encontrados</p>
          </div>

          {/* Filtros de categoria */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIAS.map(cat => {
              const slug = cat.toLowerCase()
              const ativo = categoriaAtiva === slug || (cat === 'Todas' && categoriaAtiva === 'todas')
              return (
                <a
                  key={cat}
                  href={cat === 'Todas' ? '/loja' : `/loja?categoria=${slug}`}
                  className={`px-4 py-1.5 rounded-full border text-xs transition-all ${
                    ativo
                      ? 'bg-bark border-bark text-off-white'
                      : 'border-linen text-text-mid hover:border-forest'
                  }`}
                >
                  {cat}
                </a>
              )
            })}
          </div>
        </div>

        {produtos.length === 0 ? (
          <div className="text-center py-20 text-text-light">
            <div className="text-5xl mb-4">🧺</div>
            <p>Nenhum produto encontrado nesta categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {produtos.map(p => <CardProduto key={p.id} produto={p} />)}
          </div>
        )}

      </main>
    </>
  )
}
