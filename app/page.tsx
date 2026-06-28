// app/page.tsx — Server Component (sem 'use client')
import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase-server'
import CardProduto from '@/components/loja/CardProduto'
import Header from '@/components/loja/Header'
import type { Produto } from '@/lib/types'

const CATEGORIAS = [
  { nome: 'Mantas',    icon: '🧣', slug: 'mantas' },
  { nome: 'Tapetes',   icon: '🪄', slug: 'tapetes' },
  { nome: 'Almofadas', icon: '🛋️', slug: 'almofadas' },
  { nome: 'Cama',      icon: '🛏️', slug: 'cama' },
  { nome: 'Mesa',      icon: '🍽️', slug: 'mesa' },
]

export default async function Home() {
  const supabase = createServerSupabase()

  // Busca produtos em destaque
  const { data: destaques } = await supabase
    .from('produtos')
    .select('*')
    .eq('ativo', true)
    .eq('destaque', true)
    .order('criado_em', { ascending: false })
    .limit(8)

  const produtos: Produto[] = destaques || []

  return (
    <>
      <Header />
      <main>

        {/* HERO */}
        <section className="bg-[#7b3728] relative overflow-hidden py-20 px-4 text-center"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 20px,rgba(255,255,255,.015) 20px,rgba(255,255,255,.015) 40px)' }}>
          <div className="absolute inset-0 bg-radial-gradient pointer-events-none" />

          <p className="text-[11px] tracking-[0.25em] uppercase text-[#F4D8C5] mb-4 relative">
            Tradição · Lar · Acolhimento
          </p>

          <h1 className="font-serif text-4xl md:text-6xl font-medium text-[#ffd79f] leading-tight mb-5 relative">
            Da nossa raiz<br />
            <em className="text-[#ffd79f]">para a sua casa</em>
          </h1>

          <p className="text-[#F4D8C5] max-w-md mx-auto mb-8 font-light text-[25px] relative">
            Design, afeto e tradição em cada detalhe
          </p>

          <Link href="/loja" className="bg-[#E8C97A] text-[#7b3728] text-xs tracking-widest uppercase px-6 py-3 rounded transition-colors hover:bg-bark inline-block relative">
            Explorar coleção
          </Link>
        </section>

        {/* CATEGORIAS */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="font-serif text-2xl font-medium text-forest mb-1">Nossas categorias</h2>
          <p className="text-sm text-text-light mb-8">Encontre o que sua casa precisa</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {CATEGORIAS.map(cat => (
              <Link
                key={cat.slug}
                href={`/loja?categoria=${cat.slug}`}
                className="bg-off-white border border-linen rounded p-5 text-center hover:border-forest hover:-translate-y-0.5 transition-all"
              >
                <div className="text-2xl mb-2">{cat.icon}</div>
                <div className="font-medium text-sm text-text-dark">{cat.nome}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* DESTAQUES */}
        <section className="bg-[#EDE6D6] py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="font-serif text-2xl font-medium text-forest mb-1">Destaques</h2>
                <p className="text-sm text-text-light">Peças mais amadas da nossa coleção</p>
              </div>
              <Link href="/loja" className="btn-primary text-[11px] py-2 px-4">Ver todos</Link>
            </div>

            {produtos.length === 0 ? (
              <div className="text-center py-12 text-text-light">
                <p>Nenhum produto em destaque ainda.</p>
                <p className="text-sm mt-1">Cadastre produtos no painel admin.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {produtos.map(p => <CardProduto key={p.id} produto={p} />)}
              </div>
            )}
          </div>
        </section>

        {/* NEWSLETTER */}
        <section className="bg-[#7b3728] text-off-white py-16 px-4 text-center">
          <h2 className="font-serif text-3xl font-medium mb-2">
            Receba novidades e<br />ofertas exclusivas
          </h2>
          <p className="text-off-white/75 mb-6">Cadastre-se e ganhe 10% de desconto na primeira compra</p>
          <form className="flex gap-2 max-w-sm mx-auto">
            <input
              type="email"
              placeholder="seu@email.com"
              className="flex-1 px-4 py-2.5 rounded bg-white/10 border border-off-white/30 text-off-white placeholder-off-white/50 text-sm focus:outline-none focus:border-gold-light"
            />
            <button type="submit" className="btn-gold whitespace-nowrap py-2.5">Quero!</button>
          </form>
        </section>

        {/* FOOTER */}
        <footer className="bg-text-dark text-off-white py-12 px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <span className="font-serif text-xl font-semibold block mb-3">
                Casa <span className="text-gold-light">Raiz</span>
              </span>
              <p className="text-xs text-off-white/50 leading-relaxed">
                Enxovais domésticos com a qualidade e o aconchego que sua família merece.
              </p>
            </div>
            {[
              { title: 'Produtos', links: ['Mantas', 'Tapetes', 'Almofadas', 'Cama', 'Mesa Posta'] },
              { title: 'Atendimento', links: ['WhatsApp', 'Política de trocas', 'Frete e entrega', 'FAQ'] },
              { title: 'Contato', links: ['@casaraizmk', 'São Paulo, SP'] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-[11px] tracking-widest uppercase text-gold-light mb-4 font-sans">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map(l => (
                    <li key={l}>
                      <span className="text-sm text-off-white/60 hover:text-off-white transition-colors cursor-pointer">{l}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-off-white/10 pt-6 text-center text-xs text-off-white/40">
            © {new Date().getFullYear()} Casa Raiz — Todos os direitos reservados
          </div>
        </footer>

      </main>
    </>
  )
}
