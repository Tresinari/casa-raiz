// app/api/pedidos/[id]/status/route.ts
// Atualiza status do pedido e envia e-mail se necessário

import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { enviarStatusAtualizado } from '@/lib/email'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await req.json()
    const supabase = createServiceSupabase()

    const { data: pedido, error } = await supabase
      .from('pedidos')
      .update({ status })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw new Error(error.message)

    // Envia e-mail quando enviado ou cancelado
    if (status === 'enviado' || status === 'cancelado') {
      await enviarStatusAtualizado({
        id: pedido.id,
        status: pedido.status,
        cliente_nome: pedido.cliente_nome,
        cliente_email: pedido.cliente_email,
        total: pedido.total,
        itens: pedido.itens,
      })
    }

    return NextResponse.json({ ok: true })

  } catch (err: any) {
    return NextResponse.json({ erro: err.message }, { status: 500 })
  }
}
