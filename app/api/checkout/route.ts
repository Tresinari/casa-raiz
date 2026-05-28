// app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { createServiceSupabase } from '@/lib/supabase-server'

const mp = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export async function POST(req: NextRequest) {
  try {
    const { itens, cliente } = await req.json()

    if (!itens || itens.length === 0) {
      return NextResponse.json({ erro: 'Carrinho vazio' }, { status: 400 })
    }

    const total = itens.reduce(
      (s: number, i: any) => s + i.produto.preco * i.quantidade, 0
    )

    // Salva o pedido no Supabase com status "pendente"
    const supabase = createServiceSupabase()
    const { data: pedido, error: erroPedido } = await supabase
      .from('pedidos')
      .insert({
        status: 'pendente',
        total,
        itens,
        cliente_nome: cliente.nome,
        cliente_email: cliente.email,
        cliente_telefone: cliente.telefone || null,
      })
      .select()
      .single()

    if (erroPedido) throw new Error(erroPedido.message)

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    // Cria a preferência de pagamento no Mercado Pago
    const preference = new Preference(mp)
    const { id: preferenceId, init_point } = await preference.create({
      body: {
        external_reference: pedido.id, // ID do pedido para o webhook
        payer: {
          name: cliente.nome,
          email: cliente.email,
        },
        items: itens.map((item: any) => ({
          id: item.produto.id,
          title: item.produto.nome,
          quantity: item.quantidade,
          unit_price: item.produto.preco / 100, // MP trabalha em reais, não centavos
          currency_id: 'BRL',
        })),
        payment_methods: {
          installments: 6, // Parcelamento em até 6x
        },
        back_urls: {
          success: `${baseUrl}/pedido/sucesso`,
          failure: `${baseUrl}/pedido/falha`,
          pending: `${baseUrl}/pedido/pendente`,
        },
        auto_return: 'approved',
        notification_url: `${baseUrl}/api/webhook`, // Webhook para confirmar pagamento
      },
    })

    // Salva o preference_id no pedido
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
