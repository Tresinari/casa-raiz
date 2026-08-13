'use client'

// app/admin/cupons/page.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import AdminHeader from '@/components/admin/AdminHeader'
import { formatarPreco } from '@/lib/types'

type Cupom = {
  id: string
  codigo: string
  desconto_tipo: 'percentual' | 'fixo'
  desconto_valor: number
  uso_maximo: number | null
  uso_atual: number
  valido_ate: string | null
  ativo: boolean
  criado_em: string
}

const CUPOM_VAZIO = {
  codigo: '',
  desconto_tipo: 'percentual' as const,
  desconto_valor: '10',
  uso_maximo: '',
  valido_ate: '',
}

export default function AdminCuponsPage() {
  const [cupons, setCupons] = useState<Cupom[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(CUPOM_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    verificarAuth()
    carregarCupons()
  }, [])

  async function verificarAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) router.push('/admin/login')
  }

  async function carregarCupons() {
    const { data } = await supabase
      .from('cupons')
      .select('*')
      .order('criado_em', { ascending: false })
    setCupons(data || [])
    setLoading(false)
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function gerarCodigo() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const codigo = Array.from({ length: 8 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('')
    setForm(f => ({ ...f, codigo }))
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.codigo.trim())        { setErro('Código é obrigatório.'); return }
    if (!form.desconto_valor)       { setErro('Valor do desconto é obrigatório.'); return }

    setSalvando(true)
    setErro('')

    const { error } = await supabase.from('cupons').insert({
      codigo:         form.codigo.trim().toUpperCase(),
      desconto_tipo:  form.desconto_tipo,
      desconto_valor: form.desconto_tipo === 'percentual'
        ? parseInt(form.desconto_valor)
        : Math.round(parseFloat(form.desconto_valor.replace(',', '.')) * 100),
      uso_maximo:  form.uso_maximo ? parseInt(form.uso_maximo) : null,
      valido_ate:  form.valido_ate || null,
      ativo: true,
    })

    if (error) {
      setErro(error.code === '23505'
        ? 'Já existe um cupom com esse código.'
        : error.message
      )
      setSalvando(false)
      return
    }

    setForm(CUPOM_VAZIO)
    setMostrarForm(false)
    setSalvando(false)
    carregarCupons()
  }

  async function toggleAtivo(cupom: Cupom) {
    await supabase
      .from('cupons')
      .update({ ativo: !cupom.ativo })
      .eq('id', cupom.id)
    setCupons(c => c.map(x => x.id === cupom.id ? { ...x, ativo: !x.ativo } : x))
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este cupom?')) return
    await supabase.from('cupons').delete().eq('id', id)
    setCupons(c => c.filter(x => x.id !== id))
  }

  function formatarDesconto(cupom: Cupom) {
    if (cupom.desconto_tipo === 'percentual') return `${cupom.desconto_valor}%`
    return formatarPreco(cupom.desconto_valor)
  }

  function formatarValidade(data: string | null) {
    if (!data) return 'Sem expiração'
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR')
  }

  function estaExpirado(cupom: Cupom) {
    if (!cupom.valido_ate) return false
    return new Date(cupom.valido_ate) < new Date()
  }

  function atingiuLimite(cupom: Cupom) {
    if (cupom.uso_maximo === null) return false
    return cupom.uso_atual >= cupom.uso_maximo
  }

  return (
    <div className="min-h-screen bg-cream">
      <AdminHeader />

      <main className="max-w-4xl mx-auto px-4 py-8">

        {/* Topo */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl font-medium text-forest">Cupons de desconto</h1>
            <p className="text-sm text-text-light mt-0.5">{cupons.length} cupons cadastrados</p>
          </div>
          <button
            onClick={() => { setMostrarForm(v => !v); setErro('') }}
            className="btn-primary text-sm py-2 px-4"
          >
            {mostrarForm ? '× Fechar' : '+ Novo cupom'}
          </button>
        </div>

        {/* Formulário */}
        {mostrarForm && (
          <div className="bg-off-white border border-linen rounded p-5 mb-6">
            <h2 className="font-serif text-lg font-medium mb-4">Novo cupom</h2>
            <form onSubmit={handleSalvar} className="space-y-4">

              {/* Código */}
              <div>
                <label className="block text-xs tracking-wider uppercase text-text-light mb-1.5">
                  Código *
                </label>
                <div className="flex gap-2">
                  <input
                    name="codigo"
                    className="input flex-1 font-mono tracking-wider uppercase"
                    value={form.codigo}
                    onChange={handleChange}
                    placeholder="BEMVINDA10"
                    maxLength={20}
                  />
                  <button
                    type="button"
                    onClick={gerarCodigo}
                    className="btn-outline text-xs px-3 whitespace-nowrap"
                  >
                    Gerar
                  </button>
                </div>
              </div>

              {/* Tipo e valor */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs tracking-wider uppercase text-text-light mb-1.5">
                    Tipo de desconto *
                  </label>
                  <select
                    name="desconto_tipo"
                    className="input"
                    value={form.desconto_tipo}
                    onChange={handleChange}
                  >
                    <option value="percentual">Percentual (%)</option>
                    <option value="fixo">Valor fixo (R$)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs tracking-wider uppercase text-text-light mb-1.5">
                    {form.desconto_tipo === 'percentual' ? 'Percentual (%)' : 'Valor (R$)'} *
                  </label>
                  <input
                    name="desconto_valor"
                    className="input"
                    value={form.desconto_valor}
                    onChange={handleChange}
                    placeholder={form.desconto_tipo === 'percentual' ? '10' : '30,00'}
                  />
                </div>
              </div>

              {/* Limite e validade */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs tracking-wider uppercase text-text-light mb-1.5">
                    Limite de uso
                  </label>
                  <input
                    name="uso_maximo"
                    type="number"
                    min="1"
                    className="input"
                    value={form.uso_maximo}
                    onChange={handleChange}
                    placeholder="Ilimitado"
                  />
                </div>
                <div>
                  <label className="block text-xs tracking-wider uppercase text-text-light mb-1.5">
                    Válido até
                  </label>
                  <input
                    name="valido_ate"
                    type="date"
                    className="input"
                    value={form.valido_ate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {erro && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded px-3 py-2">
                  {erro}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={salvando}
                  className="btn-primary disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : 'Criar cupom'}
                </button>
                <button
                  type="button"
                  onClick={() => { setMostrarForm(false); setErro('') }}
                  className="btn-outline"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <div className="text-center py-12 text-text-light">Carregando...</div>
        ) : cupons.length === 0 ? (
          <div className="text-center py-16 text-text-light">
            <p className="text-4xl mb-3">🎟️</p>
            <p>Nenhum cupom cadastrado ainda.</p>
          </div>
        ) : (
          <div className="bg-off-white border border-linen rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-linen bg-cream">
                  {['Código', 'Desconto', 'Uso', 'Validade', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs tracking-wider uppercase text-text-light font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cupons.map((cupom, i) => {
                  const expirado = estaExpirado(cupom)
                  const semEstoque = atingiuLimite(cupom)
                  const inativo = !cupom.ativo || expirado || semEstoque

                  return (
                    <tr
                      key={cupom.id}
                      className={`border-b border-linen last:border-0 ${
                        inativo ? 'opacity-50' : ''
                      } ${i % 2 === 0 ? '' : 'bg-cream/30'}`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono font-medium text-text-dark tracking-wider">
                          {cupom.codigo}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-forest">
                        {formatarDesconto(cupom)}
                      </td>
                      <td className="px-4 py-3 text-text-mid">
                        {cupom.uso_atual}
                        {cupom.uso_maximo !== null && ` / ${cupom.uso_maximo}`}
                        {cupom.uso_maximo === null && ' usos'}
                      </td>
                      <td className="px-4 py-3 text-text-mid">
                        {formatarValidade(cupom.valido_ate)}
                        {expirado && (
                          <span className="ml-1 text-xs text-red-400">(expirado)</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleAtivo(cupom)}
                          className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                            cupom.ativo && !expirado && !semEstoque
                              ? 'bg-forest/10 border-forest text-forest'
                              : 'bg-gray-100 border-gray-300 text-gray-500'
                          }`}
                        >
                          {expirado ? 'Expirado' : semEstoque ? 'Esgotado' : cupom.ativo ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => excluir(cupom.id)}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors"
                        >
                          Excluir
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
    </div>
  )
}