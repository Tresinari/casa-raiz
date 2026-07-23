// app/api/newsletter/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { enviarBoasVindasNewsletter } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ erro: 'E-mail inválido' }, { status: 400 })
    }

    await enviarBoasVindasNewsletter(email)

    return NextResponse.json({ ok: true })

  } catch (err: any) {
    console.error('Erro na newsletter:', err)
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 })
  }
}
