'use client'

// app/checkout/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/loja/Header'
import CampoCupom from '@/components/loja/CampoCupom'
import { useCarrinho } from '@/hooks/useCarrinho'
import { formatarPreco } from '@/lib/types'
import type { OpcaoFrete } from '@/app/api/frete/route'

type CupomAplicado = {
  id: string
  codigo: string
  desconto_tipo: string
  desconto_valor: number
  desconto_centavos: number
}

type OpcaoFreteState = OpcaoFrete & { calculando?: boolean }

const FRETE_GRATIS_ACIMA = 20000

export default function CheckoutPage() {
  const router = useRouter()
  const { itens, totalCentavos } = useCarrinho()
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [freteSelecionado, setFreteSelecionado] = useState<OpcaoFrete | null>(null)
  const [opcoesFretes, setOpcoesFretes] = useState<OpcaoFrete[]>([])
  const [calculandoFrete, setCalculandoFrete] = useState(false)
  const [erroFrete, setErroFrete] = useState('')
  const [cupomAplicado, setCupomAplicado] = useState<CupomAplicado | null>(null)

  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
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

  async function buscarCep(cep: string) {
    const limpo = cep.replace(/\D/g, '')
    if (limpo.length !== 8) return

    // Busca endereço
    const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`)
    const data = await res.json()
    if (!data.erro) {
      setForm(f => ({
        ...f,
        rua:    data.logradouro,
        bairro: data.bairro,
        cidade: data.localidade,
        estado: data.uf,
      }))
    }

    // Calcula frete automaticamente se não for grátis
    if (!freteGratis) {
      setCalculandoFrete(true)
      setErroFrete('')
      setFreteSelecionado(null)
      setOpcoesFretes([])

      try {
        const freteRes = await fetch('/api/frete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cep_destino: limpo, produtos: produtosParaFrete }),
        })
        const freteData = await freteRes.json()

        if (!freteRes.ok || freteData.erro) {
          setErroFrete(freteData.erro || 'Não foi possível calcular o frete.')
        } else if (freteData.opcoes.length === 0) {
          setErroFrete('Nenhuma opção de frete disponível para este CEP.')
        } else {
          setOpcoesFretes(freteData.opcoes)
        }
      } catch {
        setErroFrete('Erro ao calcular frete. Verifique o CEP.')
      } finally {
        setCalculandoFrete(false)
      }
    }
  }

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
            <form onSubmit={handleFinalizar} className="space-y-6">

              {/* Dados pessoais */}
              <div>
                <h2 className="font-serif text-xl font-medium mb-4">Seus dados</h2>
                <div className="space-y-4">
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
                </div>
              </div>

              {/* Endereço */}
              <div>
                <h2 className="font-serif text-xl font-medium mb-4">Endereço de entrega</h2>
                <div className="space-y-3">

                  {/* CEP — aciona busca de endereço + cálculo de frete */}
                  <div>
                    <label className="block text-xs tracking-wider uppercase text-text-light mb-1.5">CEP *</label>
                    <div className="relative">
                      <input
                        name="cep"
                        className="input"
                        value={form.cep}
                        onChange={e => {
                          const v = e.target.value.replace(/\D/g, '').slice(0, 8)
                          const fmt = v.length > 5 ? `${v.slice(0, 5)}-${v.slice(5)}` : v
                          setForm(f => ({ ...f, cep: fmt }))
                          if (v.length === 8) buscarCep(v)
                        }}
                        placeholder="00000-000"
                        maxLength={9}
                        required
                      />
                      {calculandoFrete && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-light">
                          Calculando frete...
                        </span>
                      )}
                    </div>
                    <a href="https://buscacepinter.correios.com.br" target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-text-light hover:text-forest transition-colors mt-1 inline-block">
                      Não sei meu CEP →
                    </a>
                  </div>

                  <div>
                    <label className="block text-xs tracking-wider uppercase text-text-light mb-1.5">Rua *</label>
                    <input name="rua" className="input" value={form.rua}
                      onChange={handleChange} placeholder="Rua das Flores" required />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs tracking-wider uppercase text-text-light mb-1.5">Número *</label>
                      <input name="numero" className="input" value={form.numero}
                        onChange={handleChange} placeholder="123" required />
                    </div>
                    <div>
                      <label className="block text-xs tracking-wider uppercase text-text-light mb-1.5">Complemento</label>
                      <input name="complemento" className="input" value={form.complemento}
                        onChange={handleChange} placeholder="Apto 4B" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs tracking-wider uppercase text-text-light mb-1.5">Bairro *</label>
                    <input name="bairro" className="input" value={form.bairro}
                      onChange={handleChange} placeholder="Centro" required />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs tracking-wider uppercase text-text-light mb-1.5">Cidade *</label>
                      <input name="cidade" className="input" value={form.cidade}
                        onChange={handleChange} placeholder="São Paulo" required />
                    </div>
                    <div>
                      <label className="block text-xs tracking-wider uppercase text-text-light mb-1.5">Estado *</label>
                      <input name="estado" className="input" value={form.estado}
                        onChange={handleChange} placeholder="SP" maxLength={2} required />
                    </div>
                  </div>
                </div>
              </div>

              {/* Opções de frete — aparecem automaticamente após CEP */}
              {(freteGratis || opcoesFretes.length > 0 || erroFrete || calculandoFrete) && (
                <div>
                  <h2 className="font-serif text-xl font-medium mb-3">Entrega</h2>

                  {freteGratis && (
                    <div className="flex items-center gap-3 bg-forest/10 border border-forest/20 rounded p-4">
                      <span className="text-2xl">🎉</span>
                      <div>
                        <p className="text-sm font-medium text-forest">Frete grátis!</p>
                        <p className="text-xs text-text-light mt-0.5">Sua compra tem frete grátis.</p>
                      </div>
                    </div>
                  )}

                  {calculandoFrete && (
                    <div className="text-sm text-text-light py-2">Calculando opções de frete...</div>
                  )}

                  {erroFrete && (
                    <p className="text-sm text-red-500">{erroFrete}</p>
                  )}

                  {opcoesFretes.length > 0 && !freteGratis && (
                    <div className="space-y-2">
                      {opcoesFretes.map(op => (
                        <div
                          key={op.id}
                          onClick={() => setFreteSelecionado(op)}
                          className={`flex items-center gap-3 p-3 rounded border transition-all cursor-pointer ${
                            freteSelecionado?.id === op.id
                              ? 'border-forest bg-forest/5'
                              : 'border-linen hover:border-forest/40 bg-off-white'
                          }`}
                        >
                          {op.logo ? (
                            <img src={op.logo} alt={op.empresa}
                              className="w-8 h-8 object-contain flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 bg-cream rounded flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-dark">{op.nome}</p>
                            <p className="text-xs text-text-light">{op.empresa} · {op.prazo} dias úteis</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-medium text-bark">
                              {parseFloat(op.preco) === 0 ? 'Grátis' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(op.preco))}
                            </p>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${
                            freteSelecionado?.id === op.id ? 'border-forest bg-forest' : 'border-linen'
                          }`} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Cupom */}
              <div>
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

              {!freteGratis && !freteSelecionado && form.cep.length < 9 && (
                <p className="text-center text-xs text-text-light">
                  Preencha o CEP para calcular o frete
                </p>
              )}
              {!freteGratis && !freteSelecionado && form.cep.length === 9 && opcoesFretes.length > 0 && (
                <p className="text-center text-xs text-text-light">
                  Selecione uma opção de frete para continuar
                </p>
              )}
            </form>
          </div>

          {/* Resumo */}
          <div>
            <h2 className="font-serif text-xl font-medium mb-4">Resumo do pedido</h2>
            <div className="bg-off-white border border-linen rounded p-4 space-y-3 sticky top-20">

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
                <div className="flex justify-between text-sm text-text-mid">
                  <span>Subtotal</span>
                  <span>{formatarPreco(totalCentavos)}</span>
                </div>

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

                {freteSelecionado && !freteGratis && (
                  <p className="text-xs text-text-light">
                    Prazo estimado: {freteSelecionado.prazo} dias úteis
                  </p>
                )}

                {cupomAplicado && (
                  <div className="flex justify-between text-sm text-forest">
                    <span>Cupom {cupomAplicado.codigo}</span>
                    <span className="font-medium">− {formatarPreco(descontoCupom)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-linen pt-3 flex justify-between font-serif text-lg font-medium">
                <span>Total</span>
                <span className="text-bark">{formatarPreco(totalFinal)}</span>
              </div>

              <div className="bg-forest/5 border border-forest/20 rounded p-3 text-sm text-forest-mid">
                ⚡ Pagando com Pix: <strong>{formatarPreco(totalPix)}</strong> (5% off)
              </div>
            </div>
          </div>

        </div>
      </main>
    </>
  )
}
