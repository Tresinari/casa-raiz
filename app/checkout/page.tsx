'use client'

// app/checkout/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/loja/Header'
import CalculadoraFrete from '@/components/loja/CalculadoraFrete'
import CampoCupom from '@/components/loja/CampoCupom'
import { useCarrinho } from '@/hooks/useCarrinho'
import { formatarPreco } from '@/lib/types'
import type { OpcaoFrete } from '@/app/api/frete/route'

// Tipo do cupom aplicado
type CupomAplicado = {
  id: string
  codigo: string
  desconto_tipo: string
  desconto_valor: number
  desconto_centavos: number
}

const FRETE_GRATIS_ACIMA = 20000 // R$ 200,00 em centavos

export default function CheckoutPage() {
  const router = useRouter()
  const { itens, totalCentavos } = useCarrinho()
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [freteSelecionado, setFreteSelecionado] = useState<OpcaoFrete | null>(null)
  const [cupomAplicado, setCupomAplicado] = useState<CupomAplicado | null>(null)

  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const freteGratis = totalCentavos >= FRETE_GRATIS_ACIMA
  const freteCentavos = freteGratis ? 0 : freteSelecionado
    ? Math.round(parseFloat(freteSelecionado.preco) * 100)
    : 0
  const descontoCupom = cupomAplicado?.desconto_centavos || 0
  const totalComFrete = totalCentavos + freteCentavos
  const totalFinal = Math.max(0, totalComFrete - descontoCupom)
  const totalPix = Math.round(totalFinal * 0.95)

  const produtosParaFrete = itens.map(item => ({
    id:             item.produto.id,
    preco:          item.variante ? item.variante.preco : item.produto.preco,
    quantidade:     item.quantidade,
    peso_gramas:    item.variante?.peso_gramas ?? (item.produto as any).peso_gramas,
    altura_cm:      item.variante?.altura_cm ?? (item.produto as any).altura_cm,
    largura_cm:     item.variante?.largura_cm ?? (item.produto as any).largura_cm,
    comprimento_cm: item.variante?.comprimento_cm ?? (item.produto as any).comprimento_cm,
  }))

  async function handleFinalizar(e: React.FormEvent) {
    e.preventDefault()
    if (itens.length === 0) return

    if (!freteGratis && !freteSelecionado) {
      setErro('Selecione uma opção de frete antes de continuar.')
      return
    }

    setEnviando(true)
    setErro('')

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itens,
          cliente: form,
          frete: freteGratis
            ? { nome: 'Frete grátis', preco: 0, prazo: null }
            : { nome: freteSelecionado!.nome, preco: freteCentavos, prazo: freteSelecionado!.prazo },
          cupom: cupomAplicado
            ? { id: cupomAplicado.id, codigo: cupomAplicado.codigo, desconto_centavos: descontoCupom }
            : null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.erro || 'Erro ao criar pagamento')
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
          <button onClick={() => router.push('/loja')} className="btn-primary">Ver produtos</button>
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
          <div className="space-y-6">

            {/* Dados pessoais */}
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

                {/* Frete */}
                <div className="pt-2">
                  <h2 className="font-serif text-xl font-medium mb-2">Entrega</h2>
                  <CalculadoraFrete
                    produtos={produtosParaFrete}
                    onSelecionar={setFreteSelecionado}
                    fretesSelecionado={freteSelecionado}
                    freteGratis={freteGratis}
                  />
                </div>

                {/* Cupom */}
                <div className="pt-2">
                  <h2 className="font-serif text-xl font-medium mb-2">Cupom de desconto</h2>
                  <CampoCupom
                    totalCentavos={totalComFrete}
                    onAplicar={setCupomAplicado}
                    cupomAplicado={cupomAplicado}
                  />
                </div>

                {erro && (
                  <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded px-3 py-2">{erro}</p>
                )}

                <button
                  type="submit"
                  disabled={enviando || (!freteGratis && !freteSelecionado)}
                  className="w-full btn-gold disabled:opacity-50 disabled:cursor-not-allowed py-4 text-sm"
                >
                  {enviando ? 'Aguarde...' : '🔒 Ir para o pagamento'}
                </button>

                {!freteGratis && !freteSelecionado && (
                  <p className="text-center text-xs text-text-light">
                    Calcule o frete para continuar
                  </p>
                )}
              </form>
            </div>
          </div>

          {/* Resumo */}
          <div>
            <h2 className="font-serif text-xl font-medium mb-4">Resumo do pedido</h2>
            <div className="bg-off-white border border-linen rounded p-4 space-y-3 sticky top-20">

              {/* Itens */}
              {itens.map(item => {
                const preco = item.variante ? item.variante.preco : item.produto.preco
                return (
                  <div key={`${item.produto.id}-${item.variante?.id}`}
                    className="flex justify-between gap-2 text-sm">
                    <span className="text-text-mid">
                      {item.produto.nome}
                      {item.variante && (
                        <span className="block text-xs text-text-light">{item.variante.nome}</span>
                      )}
                      <span className="text-text-light ml-1">×{item.quantidade}</span>
                    </span>
                    <span className="font-medium text-text-dark whitespace-nowrap">
                      {formatarPreco(preco * item.quantidade)}
                    </span>
                  </div>
                )
              })}

              <div className="border-t border-linen pt-3 space-y-2">

                {/* Subtotal */}
                <div className="flex justify-between text-sm text-text-mid">
                  <span>Subtotal</span>
                  <span>{formatarPreco(totalCentavos)}</span>
                </div>

                {/* Frete */}
                <div className="flex justify-between text-sm text-text-mid">
                  <span>{freteSelecionado ? freteSelecionado.nome : 'Frete'}</span>
                  <span>
                    {freteGratis
                      ? <span className="text-forest-mid font-medium">Grátis</span>
                      : freteSelecionado
                      ? formatarPreco(freteCentavos)
                      : '—'
                    }
                  </span>
                </div>

                {/* Desconto cupom */}
                {cupomAplicado && (
                  <div className="flex justify-between text-sm text-forest">
                    <span>Cupom {cupomAplicado.codigo}</span>
                    <span className="font-medium">− {formatarPreco(descontoCupom)}</span>
                  </div>
                )}
              </div>

              {/* Total final */}
              <div className="border-t border-linen pt-3 flex justify-between font-serif text-lg font-medium">
                <span>Total</span>
                <span className="text-bark">{formatarPreco(totalFinal)}</span>
              </div>

              {/* Pix */}
              <div className="bg-forest/5 border border-forest/20 rounded p-3 text-sm text-forest-mid">
                ⚡ Pagando com Pix:{' '}
                <strong>{formatarPreco(totalPix)}</strong> (5% off)
              </div>

              {freteSelecionado && !freteGratis && (
                <p className="text-xs text-text-light text-center">
                  Prazo estimado: {freteSelecionado.prazo} dias úteis
                </p>
              )}
            </div>
          </div>

        </div>
      </main>
    </>
  )
}