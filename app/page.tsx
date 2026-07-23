// app/page.tsx — Server Component (sem 'use client')
import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase-server'
import CardProduto from '@/components/loja/CardProduto'
import Header from '@/components/loja/Header'
import type { Produto } from '@/lib/types'
import FormNewsletter from '@/components/loja/FormNewsletter'

const CATEGORIAS = [
  { nome: 'Louças',    icon: '🍽️', slug: 'louças' },
  { nome: 'Tapetes',   icon: '🏡', slug: 'tapetes' },
  { nome: 'Almofadas', icon: '🛋️', slug: 'almofadas' },
  { nome: 'Artigos de Decoração', icon: '🏺', slug: 'artigos%20de%20decoração' },
  { nome: 'Peseiras ou Mantas', icon: '🧶', slug: 'peseiras%20ou%20mantas' },
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

          <Link href="/loja" className="bg-[#E8C97A] text-[#7b3728] text-xs tracking-widest uppercase px-6 py-3 rounded transition-colors hover:bg-[#D4B560] inline-block relative">
            Explorar coleção
          </Link>
        </section>

        {/* CATEGORIAS */}
<section className="max-w-6xl mx-auto px-4 py-16">
  <h2 className="font-serif text-2xl font-medium text-forest mb-1">Categorias</h2>
  <p className="text-sm text-text-light mb-8">Encontre o que sua casa precisa</p>

  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
    {CATEGORIAS.map(cat => (
      <Link
        key={cat.slug}
        href={`/loja?categoria=${cat.slug}`}
        className="group relative overflow-hidden rounded-lg border border-linen hover:border-[#7b3728] transition-all hover:-translate-y-1 hover:shadow-lg"
        style={{ height: '200px' }}
      >
        {/* Imagem de fundo */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url('/categorias/${cat.slug}.jpg')` }}
        />

        {/* Fallback enquanto não tem imagem */}
        <div className="absolute inset-0 bg-[#EDE6D6] flex items-center justify-center -z-10">
          <span className="text-4xl opacity-30">{cat.icon}</span>
        </div>

        {/* Gradiente escuro na base */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#2E1208]/80 via-[#2E1208]/20 to-transparent" />

        {/* Texto */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="font-serif text-base font-medium text-[#F4D8C5] leading-tight">
            {cat.nome}
          </div>
          <div className="text-[10px] tracking-widest uppercase text-[#E8C97A] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Ver produtos →
          </div>
        </div>
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
          <FormNewsletter />
        </section>

        {/* FOOTER */}
        <footer className="bg-[#2E1208] text-off-white py-12 px-4">
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
  {
    title: 'Produtos',
    links: [
      { label: 'Louças',     href: '/loja?categoria=louças' },
      { label: 'Tapetes',    href: '/loja?categoria=tapetes' },
      { label: 'Almofadas',  href: '/loja?categoria=almofadas' },
      { label: 'Artigos de Decoração',       href: '/loja?categoria=artigos%20de%20decoração' },
      { label: 'Peseiras ou Mantas', href: '/loja?categoria=peseiras%20ou%20mantas' },
    ]
  },
  {
    title: 'Atendimento',
    links: [
      { label: 'WhatsApp', href: 'https://wa.link/2ohi1o' },
    ]
  },
  {
    title: 'Contato',
    links: [
      { label: '@casaraizmk', href: 'https://instagram.com/casaraizmk' },
    ]
  },
].map(col => (
  <div key={col.title}>
    <h4 className="text-[11px] tracking-widest uppercase text-[#E8C97A] mb-4 font-sans">{col.title}</h4>
    <ul className="space-y-2">
      {col.links.map(l => (
        <li key={l.label}>
          <Link
            href={l.href}
            target={l.href.startsWith('http') ? '_blank' : undefined}
            rel={l.href.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="text-sm text-off-white/60 hover:text-[#E8C97A] transition-colors"
          >
            {l.label}
          </Link>
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
