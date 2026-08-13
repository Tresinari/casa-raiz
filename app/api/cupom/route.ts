// Valida um cupom e retorna o desconto aplicável

import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { codigo, total } = await req.json()

    if (!codigo?.trim()) {
      return NextResponse.json({ erro: 'Código inválido.' }, { status: 400 })
    }

    const supabase = createServiceSupabase()

    const { data: cupom, error } = await supabase
      .from('cupons')
      .select('*')
      .eq('codigo', codigo.trim().toUpperCase())
      .eq('ativo', true)
      .single()

    if (error || !cupom) {
      return NextResponse.json({ erro: 'Cupom não encontrado ou inativo.' }, { status: 404 })
    }

    // Verifica expiração
    if (cupom.valido_ate && new Date(cupom.valido_ate) < new Date()) {
      return NextResponse.json({ erro: 'Este cupom expirou.' }, { status: 400 })
    }

    // Verifica limite de uso
    if (cupom.uso_maximo !== null && cupom.uso_atual >= cupom.uso_maximo) {
      return NextResponse.json({ erro: 'Este cupom atingiu o limite de uso.' }, { status: 400 })
    }

    // Calcula o desconto
    let descontoCentavos = 0
    if (cupom.desconto_tipo === 'percentual') {
      descontoCentavos = Math.round(total * (cupom.desconto_valor / 100))
    } else {
      descontoCentavos = Math.min(cupom.desconto_valor, total) // não pode ser maior que o total
    }

    return NextResponse.json({
      valido: true,
      cupom: {
        id:            cupom.id,
        codigo:        cupom.codigo,
        desconto_tipo: cupom.desconto_tipo,
        desconto_valor: cupom.desconto_valor,
      },
      desconto_centavos: descontoCentavos,
    })

  } catch (err: any) {
    console.error('Erro ao validar cupom:', err)
    return NextResponse.json({ erro: 'Erro interno.' }, { status: 500 })
  }
}