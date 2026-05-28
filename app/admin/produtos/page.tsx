'use client'

// app/admin/produtos/page.tsx
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { formatarPreco } from '@/lib/types'
import type { Produto } from '@/lib/types'

export default function AdminProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    verificarAuth()
    carregarProdutos()
  }, [])

  async function verificarAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) router.push('/admin/login')
  }

  async function carregarProdutos() {
    const { data } = await supabase
      .from('produtos')
      .select('*')
      .order('criado_em', { ascending: false })
    setProdutos(data || [])
    setLoading(false)
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    await supabase.from('produtos').update({ ativo: !ativo }).eq('id', id)
    setProdutos(p => p.map(prod => prod.id === id ? { ...prod, ativo: !ativo } : prod))
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este produto?')) return
    await supabase.from('produtos').delete().eq('id', id)
    setProdutos(p => p.filter(prod => prod.id !== id))
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.categoria.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-cream">

      {/* Header Admin */}
      <header className="bg-forest text-off-white px-6 py-4 flex items-center justify-between">
        <div>
          <span className="font-serif text-xl font-medium">Casa <span className="text-gold-light">Raiz</span></span>
          <span className="text-off-white/50 text-sm ml-3">Admin</span>
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/" target="_blank" className="text-sm text-off-white/70 hover:text-off-white transition-colors">
            Ver loja ↗
          </Link>
          <button onClick={logout} className="text-sm text-off-white/70 hover:text-off-white transition-colors">
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* Topo */}
        <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
          <h1 className="font-serif text-2xl font-medium text-forest">Produtos</h1>
          <Link href="/admin/produtos/novo" className="btn-primary text-sm py-2 px-4">
            + Novo produto
          </Link>
        </div>

        {/* Busca */}
        <input
          type="text"
          placeholder="Buscar por nome ou categoria..."
          className="input mb-6"
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />

        {/* Tabela */}
        {loading ? (
          <div className="text-center py-12 text-text-light">Carregando...</div>
        ) : produtosFiltrados.length === 0 ? (
          <div className="text-center py-12 text-text-light">
            <p className="text-4xl mb-3">📦</p>
            <p>Nenhum produto encontrado.</p>
            <Link href="/admin/produtos/novo" className="btn-primary inline-block mt-4 text-sm">
              Cadastrar primeiro produto
            </Link>
          </div>
        ) : (
          <div className="bg-off-white border border-linen rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-linen bg-cream">
                  <th className="text-left px-4 py-3 text-xs tracking-wider uppercase text-text-light font-normal">Produto</th>
                  <th className="text-left px-4 py-3 text-xs tracking-wider uppercase text-text-light font-normal hidden md:table-cell">Categoria</th>
                  <th className="text-left px-4 py-3 text-xs tracking-wider uppercase text-text-light font-normal">Preço</th>
                  <th className="text-left px-4 py-3 text-xs tracking-wider uppercase text-text-light font-normal hidden md:table-cell">Estoque</th>
                  <th className="text-left px-4 py-3 text-xs tracking-wider uppercase text-text-light font-normal">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {produtosFiltrados.map((prod, i) => (
                  <tr key={prod.id} className={`border-b border-linen last:border-0 ${i % 2 === 0 ? '' : 'bg-cream/40'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {prod.imagens?.[0] ? (
                          <img src={prod.imagens[0]} alt="" className="w-10 h-10 rounded object-cover border border-linen flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-cream border border-linen flex items-center justify-center text-lg flex-shrink-0">🏠</div>
                        )}
                        <span className="font-medium text-text-dark">{prod.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-mid hidden md:table-cell">{prod.categoria}</td>
                    <td className="px-4 py-3 font-medium text-bark">{formatarPreco(prod.preco)}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-xs font-medium ${prod.estoque === 0 ? 'text-red-500' : prod.estoque <= 5 ? 'text-gold' : 'text-forest-mid'}`}>
                        {prod.estoque === 0 ? 'Esgotado' : `${prod.estoque} un.`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleAtivo(prod.id, prod.ativo)}
                        className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                          prod.ativo
                            ? 'bg-forest/10 border-forest text-forest'
                            : 'bg-gray-100 border-gray-300 text-gray-500'
                        }`}
                      >
                        {prod.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <Link
                          href={`/admin/produtos/${prod.id}`}
                          className="text-xs text-forest hover:underline"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => excluir(prod.id)}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
