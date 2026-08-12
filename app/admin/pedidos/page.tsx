'use client'

// app/admin/pedidos/page.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { formatarPreco } from '@/lib/types'
import AdminHeader from '@/components/admin/AdminHeader'

type Pedido = {
  id: string
  status: 'pendente' | 'aprovado' | 'cancelado' | 'enviado'
  total: number
  itens: any[]
  cliente_nome: string
  cliente_email: string
  cliente_telefone?: string
  mp_payment_id?: string
  criado_em: string
  codigo_rastreio: string
}

const STATUS_CONFIG = {
  pendente:  { label: 'Pendente',  bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  aprovado:  { label: 'Aprovado',  bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-200' },
  enviado:   { label: 'Enviado',   bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-200' },
  cancelado: { label: 'Cancelado', bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-200' },
}

function RastreioForm({ pedido }: { pedido: Pedido }) {
  const [codigo, setCodigo] = useState(pedido.codigo_rastreio || '')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const supabase = createClient()

  async function handleEnviar() {
    if (!codigo.trim()) return
    setEnviando(true)

    // Salva no banco e muda status para "enviado"
    await supabase
      .from('pedidos')
      .update({ codigo_rastreio: codigo, status: 'enviado' })
      .eq('id', pedido.id)

    // Dispara o e-mail com o código
    await fetch(`/api/pedidos/${pedido.id}/rastreio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo }),
    })

    setEnviando(false)
    setEnviado(true)
  }

  return (
    <div className="flex gap-2">
      <input
        className="input flex-1 text-sm"
        placeholder="Ex: BR123456789BR"
        value={codigo}
        onChange={e => setCodigo(e.target.value.toUpperCase())}
      />
      <button
        onClick={handleEnviar}
        disabled={enviando || !codigo.trim()}
        className="btn-primary text-xs py-2 px-3 disabled:opacity-50 whitespace-nowrap"
      >
        {enviado ? '✓ Enviado!' : enviando ? '...' : 'Enviar e-mail'}
      </button>
    </div>
  )
}

export default function AdminPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [pedidoAberto, setPedidoAberto] = useState<Pedido | null>(null)
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [busca, setBusca] = useState('')
  const [atualizando, setAtualizando] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    verificarAuth()
    carregarPedidos()
  }, [])

  async function verificarAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) router.push('/admin/login')
  }

  async function carregarPedidos() {
    const { data } = await supabase
      .from('pedidos')
      .select('*')
      .order('criado_em', { ascending: false })
    setPedidos(data || [])
    setLoading(false)
  }

  async function atualizarStatus(id: string, novoStatus: string) {
    setAtualizando(id)
    await supabase
      .from('pedidos')
      .update({ status: novoStatus })
      .eq('id', id)

    setPedidos(prev =>
      prev.map(p => p.id === id ? { ...p, status: novoStatus as any } : p)
    )
    if (pedidoAberto?.id === id) {
      setPedidoAberto(prev => prev ? { ...prev, status: novoStatus as any } : null)
    }
    setAtualizando(null)
  }

  function formatarData(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  function abrirWhatsApp(telefone: string, nome: string) {
    const msg = encodeURIComponent(`Olá ${nome}! Seu pedido na Casa Raiz foi enviado. 🎉`)
    window.open(`https://wa.me/55${telefone.replace(/\D/g, '')}?text=${msg}`, '_blank')
  }

  const pedidosFiltrados = pedidos.filter(p => {
    const statusOk = filtroStatus === 'todos' || p.status === filtroStatus
    const buscaOk = busca === '' ||
      p.cliente_nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.cliente_email.toLowerCase().includes(busca.toLowerCase()) ||
      p.id.includes(busca)
    return statusOk && buscaOk
  })

  const totalPorStatus = {
    todos:    pedidos.length,
    pendente: pedidos.filter(p => p.status === 'pendente').length,
    aprovado: pedidos.filter(p => p.status === 'aprovado').length,
    enviado:  pedidos.filter(p => p.status === 'enviado').length,
    cancelado:pedidos.filter(p => p.status === 'cancelado').length,
  }

  const receitaAprovada = pedidos
    .filter(p => p.status === 'aprovado' || p.status === 'enviado')
    .reduce((s, p) => s + p.total, 0)

  return (
    <div className="min-h-screen bg-cream">

      {/* Header */}
      <AdminHeader />

      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total de pedidos', valor: pedidos.length, sub: 'todos os tempos' },
            { label: 'Aguardando envio', valor: totalPorStatus.aprovado, sub: 'pedidos aprovados' },
            { label: 'Enviados', valor: totalPorStatus.enviado, sub: 'este mês' },
            { label: 'Receita confirmada', valor: formatarPreco(receitaAprovada), sub: 'aprovado + enviado' },
          ].map(card => (
            <div key={card.label} className="bg-off-white border border-linen rounded p-4">
              <p className="text-xs tracking-wider uppercase text-text-light mb-1">{card.label}</p>
              <p className="font-serif text-2xl font-medium text-forest">{card.valor}</p>
              <p className="text-xs text-text-light mt-1">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 items-center justify-between mb-6">
          <div className="flex gap-2 flex-wrap">
            {Object.entries(totalPorStatus).map(([status, count]) => (
              <button
                key={status}
                onClick={() => setFiltroStatus(status)}
                className={`px-3 py-1.5 rounded-full border text-xs transition-all ${
                  filtroStatus === status
                    ? 'bg-bark border-bark text-off-white'
                    : 'border-linen text-text-mid hover:border-forest'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou ID..."
            className="input max-w-xs"
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>

        {/* Tabela */}
        {loading ? (
          <div className="text-center py-12 text-text-light">Carregando pedidos...</div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="text-center py-20 text-text-light">
            <p className="text-4xl mb-3">📦</p>
            <p>Nenhum pedido encontrado.</p>
          </div>
        ) : (
          <div className="bg-off-white border border-linen rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-linen bg-cream">
                  <th className="text-left px-4 py-3 text-xs tracking-wider uppercase text-text-light font-normal">Pedido</th>
                  <th className="text-left px-4 py-3 text-xs tracking-wider uppercase text-text-light font-normal hidden md:table-cell">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs tracking-wider uppercase text-text-light font-normal hidden md:table-cell">Data</th>
                  <th className="text-left px-4 py-3 text-xs tracking-wider uppercase text-text-light font-normal">Total</th>
                  <th className="text-left px-4 py-3 text-xs tracking-wider uppercase text-text-light font-normal">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {pedidosFiltrados.map((pedido, i) => {
                  const cfg = STATUS_CONFIG[pedido.status]
                  return (
                    <tr key={pedido.id}
                      className={`border-b border-linen last:border-0 hover:bg-cream/50 transition-colors ${i % 2 === 0 ? '' : 'bg-cream/30'}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-text-dark">#{pedido.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-xs text-text-light mt-0.5">
                          {pedido.itens?.length || 0} {pedido.itens?.length === 1 ? 'item' : 'itens'}
                        </p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="font-medium text-text-dark">{pedido.cliente_nome}</p>
                        <p className="text-xs text-text-light">{pedido.cliente_email}</p>
                      </td>
                      <td className="px-4 py-3 text-text-mid hidden md:table-cell text-xs">
                        {formatarData(pedido.criado_em)}
                      </td>
                      <td className="px-4 py-3 font-medium text-bark">
                        {formatarPreco(pedido.total)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setPedidoAberto(pedido)}
                          className="text-xs text-forest hover:underline"
                        >
                          Ver detalhes
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* MODAL DE DETALHES */}
      {pedidoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-text-dark/50">
          <div className="bg-off-white rounded-lg max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl">

            {/* Header do modal */}
            <div className="bg-forest text-off-white px-5 py-4 flex items-center justify-between rounded-t-lg">
              <div>
                <h2 className="font-serif text-lg font-medium">
                  Pedido #{pedidoAberto.id.slice(0, 8).toUpperCase()}
                </h2>
                <p className="text-xs text-off-white/60 mt-0.5">{formatarData(pedidoAberto.criado_em)}</p>
              </div>
              <button onClick={() => setPedidoAberto(null)} className="text-2xl leading-none hover:text-gold-light">×</button>
            </div>

            <div className="p-5 space-y-5">

              {/* Cliente */}
              <div>
                <h3 className="text-xs tracking-wider uppercase text-text-light mb-2">Cliente</h3>
                <div className="bg-cream rounded p-3 space-y-1">
                  <p className="font-medium text-text-dark">{pedidoAberto.cliente_nome}</p>
                  <p className="text-sm text-text-mid">{pedidoAberto.cliente_email}</p>
                  {pedidoAberto.cliente_telefone && (
                    <p className="text-sm text-text-mid">{pedidoAberto.cliente_telefone}</p>
                  )}
                </div>
                {pedidoAberto.cliente_telefone && (
                  <button
                    onClick={() => abrirWhatsApp(pedidoAberto.cliente_telefone!, pedidoAberto.cliente_nome)}
                    className="mt-2 text-xs text-forest-mid hover:text-forest transition-colors flex items-center gap-1"
                  >
                    💬 Contatar via WhatsApp
                  </button>
                )}
              </div>

              {/* Itens */}
              <div>
                <h3 className="text-xs tracking-wider uppercase text-text-light mb-2">Itens do pedido</h3>
                <div className="space-y-2">
                  {pedidoAberto.itens?.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 bg-cream rounded p-2">
                      {item.produto?.imagens?.[0] ? (
                        <img src={item.produto.imagens[0]} alt=""
                          className="w-10 h-10 rounded object-cover border border-linen flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-linen flex items-center justify-center text-lg flex-shrink-0">🏠</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-dark truncate">{item.produto?.nome}</p>
                        {item.variante && (
                          <p className='text-xs text-forest-mid font-medium'>{item.variante.nome}</p>
                        )}
                        <p className="text-xs text-text-light">Qtd: {item.quantidade}</p>
                      </div>
                      <span className="text-sm font-medium text-bark flex-shrink-0">
                        {formatarPreco(
                          (item.variante ? item.variante.preco : item.produto?.preco) * item.quantidade
                        )}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-serif text-base font-medium mt-3 pt-3 border-t border-linen">
                  <span>Total</span>
                  <span className="text-bark">{formatarPreco(pedidoAberto.total)}</span>
                </div>
              </div>

              {/* Status */}
              <div>
                <h3 className="text-xs tracking-wider uppercase text-text-light mb-2">Atualizar status</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
                    <button
                      key={status}
                      onClick={() => atualizarStatus(pedidoAberto.id, status)}
                      disabled={pedidoAberto.status === status || atualizando === pedidoAberto.id}
                      className={`px-3 py-2 rounded border text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                        pedidoAberto.status === status
                          ? `${cfg.bg} ${cfg.text} ${cfg.border}`
                          : 'border-linen text-text-mid hover:border-forest hover:text-forest'
                      }`}
                    >
                      {atualizando === pedidoAberto.id && pedidoAberto.status !== status
                        ? '...'
                        : cfg.label}
                      {pedidoAberto.status === status && ' ✓'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Código de rastreio */}
              <div>
                <h3 className="text-xs tracking-wider uppercase text-text-light mb-2">
                  Código de rastreio
                </h3>
                <RastreioForm pedido={pedidoAberto} />
              </div>

              {/* ID do pagamento MP */}
              {pedidoAberto.mp_payment_id && (
                <div>
                  <h3 className="text-xs tracking-wider uppercase text-text-light mb-1">ID Mercado Pago</h3>
                  <p className="text-xs font-mono text-text-mid bg-cream rounded px-3 py-2">
                    {pedidoAberto.mp_payment_id}
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  )
}
