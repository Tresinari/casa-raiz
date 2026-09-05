import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { createServiceSupabase } from '@/lib/supabase-server'

const mp = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export async function POST(req: NextRequest) {
  try {
    const { itens, cliente, frete, cupom } = await req.json()

    if (!itens || itens.length === 0) {
      return NextResponse.json({ erro: 'Carrinho vazio' }, { status: 400 })
    }

    const subtotal = itens.reduce(
      (s: number, i: any) => s + i.produto.preco * i.quantidade, 0
    )
    const freteCentavos = frete?.preco || 0
    const total = subtotal + freteCentavos

    // Salva pedido no Supabase
    const supabase = createServiceSupabase()
    const { data: pedido, error: erroPedido } = await supabase
      .from('pedidos')
      .insert({
        status: 'pendente',
        total,
        itens,
        endereco_cep: cliente.cep,
        endereco_rua: cliente.rua,
        endereco_numero: cliente.numero,
        endereco_complemento: cliente.complemento || null,
        endereco_bairro: cliente.bairro,
        endereco_cidade: cliente.cidade,
        endereco_estado: cliente.estado,
        frete_nome:  frete?.nome || null,
        frete_preco: freteCentavos,
        frete_prazo: frete?.prazo || null,
        cliente_nome:     cliente.nome,
        cliente_email:    cliente.email,
        cliente_telefone: cliente.telefone || null,
        cupom_codigo: cupom?.codigo || null,
        cupom_desconto: cupom?.desconto_centavos || 0,
      })
      .select()
      .single()

    if (erroPedido) throw new Error(erroPedido.message)

    if (cupom?.id) {
      await supabase.rpc('incrementar_uso_cupom', { cupom_id: cupom.id })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    // Monta itens para o MP
    const mpItens = itens.map((item: any) => ({
      id:          item.produto.id,
      title:       item.produto.nome,
      quantity:    item.quantidade,
      unit_price:  item.produto.preco / 100,
      currency_id: 'BRL',
    }))

    // Adiciona frete como item separado se houver
    if (freteCentavos > 0) {
      mpItens.push({
        id:          'frete',
        title:       `Frete — ${frete.nome}`,
        quantity:    1,
        unit_price:  freteCentavos / 100,
        currency_id: 'BRL',
      })
    }

    const preference = new Preference(mp)
    const { id: preferenceId, init_point } = await preference.create({
      body: {
        external_reference: pedido.id,
        payer: {
          name:  cliente.nome,
          email: cliente.email,
        },
        items: mpItens,
        payment_methods: {
          excluded_payment_methods: [],
          excluded_payment_types:   [],
          installments: 12,
        },
        binary_mode: false,
        back_urls: {
          success: `${baseUrl}/pedido/sucesso`,
          failure: `${baseUrl}/pedido/falha`,
          pending: `${baseUrl}/pedido/pendente`,
        },
        auto_return: 'approved',
        notification_url: `${baseUrl}/api/webhook`,
      },
    })

    await supabase
      .from('pedidos')
      .update({ mp_preference_id: preferenceId })
      .eq('id', pedido.id)

    return NextResponse.json({ url: init_point })

  } catch (err: any) {
    console.error('Erro no checkout:', err)
    return NextResponse.json(
      { erro: err.message || 'Erro interno' },
      { status: 500 }
    )
  }
}
