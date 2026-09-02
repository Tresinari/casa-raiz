// app/produto/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import Header from '@/components/loja/Header'
import ProdutoInterativo from '@/components/loja/ProdutoInterativo'

export default async function ProdutoPage({ params }: { params: { slug: string } }) {
  const supabase = createServerSupabase()

  const { data: produto } = await supabase
    .from('produtos')
    .select('*, variantes(*)')
    .eq('slug', params.slug)
    .eq('ativo', true)
    .single()

  if (!produto) notFound()

  const variantesAtivas = (produto.variantes || []).filter((v: any) => v.ativo)

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-12">
        <ProdutoInterativo
          produto={produto}
          variantesAtivas={variantesAtivas}
        />
      </main>
    </>
  )
}
