import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'
import { enviarCodigoRastreio } from '@/lib/email'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { codigo } = await req.json()
    const supabase = createServiceSupabase()

    const { data: pedido } = await supabase
      .from('pedidos')
      .select('id, cliente_nome, cliente_email')
      .eq('id', params.id)
      .single()

    if (!pedido) throw new Error('Pedido não encontrado')

    await enviarCodigoRastreio(pedido, codigo)

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ erro: err.message }, { status: 500 })
  }
}