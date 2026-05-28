// app/api/webhook/route.ts
// Mercado Pago envia uma notificação aqui quando o pagamento é confirmado

import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createServiceSupabase } from '@/lib/supabase-server'

const mp = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // MP envia diferentes tipos de notificação — só nos interessa "payment"
    if (body.type !== 'payment') {
      return NextResponse.json({ ok: true })
    }

    const paymentId = body.data?.id
    if (!paymentId) return NextResponse.json({ ok: true })

    // Busca os detalhes do pagamento no MP
    const payment = new Payment(mp)
    const pagamento = await payment.get({ id: paymentId })

    const pedidoId = pagamento.external_reference
    const status = pagamento.status // approved | rejected | pending

    if (!pedidoId) return NextResponse.json({ ok: true })

    // Mapeia o status do MP para o status da loja
    const statusMap: Record<string, string> = {
      approved: 'aprovado',
      rejected: 'cancelado',
      pending:  'pendente',
    }

    const supabase = createServiceSupabase()
    await supabase
      .from('pedidos')
      .update({
        status: statusMap[status] || 'pendente',
        mp_payment_id: String(paymentId),
      })
      .eq('id', pedidoId)

    // Se aprovado, desconta o estoque
    if (status === 'approved') {
      const { data: pedido } = await supabase
        .from('pedidos')
        .select('itens')
        .eq('id', pedidoId)
        .single()

      if (pedido?.itens) {
        for (const item of pedido.itens) {
          await supabase.rpc('decrementar_estoque', {
            produto_id: item.produto.id,
            quantidade: item.quantidade,
          })
        }
      }
    }

    return NextResponse.json({ ok: true })

  } catch (err: any) {
    console.error('Erro no webhook:', err)
    // Sempre retorna 200 pro MP — se retornar erro, ele fica reenviant
    return NextResponse.json({ ok: true })
  }
}
