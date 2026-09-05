// app/api/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createServiceSupabase } from '@/lib/supabase-server'
import { enviarConfirmacaoPedido, enviarNovoPedidoAdmin } from '@/lib/email'

const mp = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (body.type !== 'payment') {
      return NextResponse.json({ ok: true })
    }

    const paymentId = body.data?.id
    if (!paymentId) return NextResponse.json({ ok: true })

    const payment = new Payment(mp)
    const pagamento = await payment.get({ id: paymentId })

    const pedidoId = pagamento.external_reference
    const status = pagamento.status

    if (!pedidoId) return NextResponse.json({ ok: true })

    const statusMap: Record<string, string> = {
      approved: 'aprovado',
      rejected: 'cancelado',
      pending:  'pendente',
    }

    const supabase = createServiceSupabase()

    await supabase
      .from('pedidos')
      .update({
        status: (status ? statusMap[status] : null) ?? 'pendente',
        mp_payment_id: String(paymentId),
      })
      .eq('id', pedidoId)

    // Se aprovado: desconta estoque e envia e-mail
    if (status === 'approved') {
      const { data: pedido } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', pedidoId)
        .single()

      if (pedido) {
        // Desconta estoque
        for (const item of pedido.itens) {
          await supabase.rpc('decrementar_estoque', {
            produto_id: item.produto.id,
            quantidade: item.quantidade,
          })
        }

        // Envia e-mail de confirmação
        await enviarConfirmacaoPedido({
          id: pedido.id,
          cliente_nome: pedido.cliente_nome,
          cliente_email: pedido.cliente_email,
          total: pedido.total,
          itens: pedido.itens,
        })

        await enviarNovoPedidoAdmin({
          id: pedido.id,
          cliente_nome: pedido.cliente.nome,
          cliente_email: pedido.cliente_email,
          total: pedido.total,
          itens: pedido.itens,
        })
      }
    }

    return NextResponse.json({ ok: true })

  } catch (err: any) {
    console.error('Erro no webhook:', err)
    return NextResponse.json({ ok: true })
  }
}
