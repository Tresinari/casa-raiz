'use client'

// app/checkout/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/loja/Header'
import { useCarrinho } from '@/hooks/useCarrinho'
import { formatarPreco } from '@/lib/types'

export default function CheckoutPage() {
  const router = useRouter()
  const { itens, totalCentavos, totalPreco, limpar } = useCarrinho()
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleFinalizar(e: React.FormEvent) {
    e.preventDefault()
    if (itens.length === 0) return
    setEnviando(true)
    setErro('')

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itens, cliente: form }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.erro || 'Erro ao criar pagamento')

      // Redireciona para o Mercado Pago
      window.location.href = data.url
    } catch (err: any) {
      setErro(err.message)
      setEnviando(false)
    }
  }

  if (itens.length === 0) {
    return (
      <>
        <Header />
        <main className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="text-5xl mb-4">🧺</div>
          <h1 className="font-serif text-2xl font-medium text-forest mb-2">Carrinho vazio</h1>
          <p className="text-text-light mb-6">Adicione produtos antes de finalizar a compra.</p>
          <button onClick={() => router.push('/loja')} className="btn-primary">
            Ver produtos
          </button>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="font-serif text-3xl font-medium text-forest mb-8">Finalizar compra</h1>

        <div className="grid md:grid-cols-2 gap-8">

          {/* Formulário */}
          <div>
            <h2 className="font-serif text-xl font-medium mb-4">Seus dados</h2>
            <form onSubmit={handleFinalizar} className="space-y-4">
              <div>
                <label className="block text-xs tracking-wider uppercase text-text-light mb-1.5">Nome completo *</label>
                <input name="nome" className="input" value={form.nome}
                  onChange={handleChange} placeholder="Maria Silva" required />
              </div>
              <div>
                <label className="block text-xs tracking-wider uppercase text-text-light mb-1.5">E-mail *</label>
                <input name="email" type="email" className="input" value={form.email}
                  onChange={handleChange} placeholder="maria@email.com" required />
              </div>
              <div>
                <label className="block text-xs tracking-wider uppercase text-text-light mb-1.5">WhatsApp</label>
                <input name="telefone" className="input" value={form.telefone}
                  onChange={handleChange} placeholder="(11) 99999-9999" />
              </div>

              {erro && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded px-3 py-2">{erro}</p>
              )}

              <button type="submit" disabled={enviando}
                className="w-full btn-gold disabled:opacity-50 disabled:cursor-not-allowed py-4 text-sm">
                {enviando ? 'Aguarde...' : '🔒 Ir para o pagamento'}
              </button>

              <p className="text-center text-xs text-text-light">
                Você será redirecionado para o Mercado Pago para pagar com Pix, cartão ou boleto.
              </p>
            </form>
          </div>

          {/* Resumo do pedido */}
          <div>
            <h2 className="font-serif text-xl font-medium mb-4">Resumo do pedido</h2>
            <div className="bg-off-white border border-linen rounded p-4 space-y-3">
              {itens.map(item => (
                <div key={item.produto.id} className="flex justify-between gap-2 text-sm">
                  <span className="text-text-mid">
                    {item.produto.nome}
                    <span className="text-text-light ml-1">×{item.quantidade}</span>
                  </span>
                  <span className="font-medium text-text-dark whitespace-nowrap">
                    {formatarPreco(item.produto.preco * item.quantidade)}
                  </span>
                </div>
              ))}

              <div className="border-t border-linen pt-3 flex justify-between font-serif text-lg font-medium">
                <span>Total</span>
                <span className="text-bark">{totalPreco}</span>
              </div>

              <div className="bg-forest/5 border border-forest/20 rounded p-3 text-sm text-forest-mid">
                ⚡ Pagando com Pix: <strong>{formatarPreco(Math.round(totalCentavos * 0.95))}</strong> (5% off)
              </div>
            </div>
          </div>

        </div>
      </main>
    </>
  )
}
