import { NextRequest, NextResponse } from 'next/server'

const ME_TOKEN = process.env.MELHOR_ENVIO_TOKEN!
const CEP_ORIGEM = process.env.MELHOR_ENVIO_CEP_ORIGEM!
const SANDBOX = process.env.MELHOR_ENVIO_SANDBOX === 'true'
const ME_URL = SANDBOX
  ? 'https://sandbox.melhorenvio.com.br/api/v2'
  : 'https://melhorenvio.com.br/api/v2'

export type OpcaoFrete = {
  id: number
  nome: string
  preco: string
  prazo: number
  empresa: string
  logo: string
  erro?: string
}

export async function POST(req: NextRequest) {
  try {
    const { cep_destino, produtos } = await req.json()

    if (!cep_destino || cep_destino.replace(/\D/g, '').length !== 8) {
      return NextResponse.json({ erro: 'CEP inválido' }, { status: 400 })
    }

    if (!produtos || produtos.length === 0) {
      return NextResponse.json({ erro: 'Nenhum produto informado' }, { status: 400 })
    }

    // Monta os volumes (um por item do carrinho)
    const volumes = produtos.flatMap((item: any) =>
      Array(item.quantidade).fill({
        height: item.altura_cm || 10,
        width:  item.largura_cm || 30,
        length: item.comprimento_cm || 40,
        weight: (item.peso_gramas || 500) / 1000, // ME usa kg
      })
    )

    const body = {
      from: { postal_code: CEP_ORIGEM.replace(/\D/g, '') },
      to:   { postal_code: cep_destino.replace(/\D/g, '') },
      products: produtos.map((item: any) => ({
        id:       item.id,
        width:    item.largura_cm || 30,
        height:   item.altura_cm || 10,
        length:   item.comprimento_cm || 40,
        weight:   (item.peso_gramas || 500) / 1000,
        insurance_value: item.preco / 100, // valor declarado em reais
        quantity: item.quantidade,
      })),
      volumes,
      options: {
        insurance_value: produtos.reduce(
          (s: number, i: any) => s + (i.preco / 100) * i.quantidade, 0
        ),
        receipt: false,
        own_hand: false,
      },
    }

    const res = await fetch(`${ME_URL}/me/shipment/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ME_TOKEN}`,
        'User-Agent': 'CasaRaiz/1.0 (contato@casaraiz.com.br)',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Erro Melhor Envio:', data)
      return NextResponse.json(
        { erro: 'Erro ao calcular frete. Verifique o CEP e tente novamente.' },
        { status: 400 }
      )
    }

    const TRANSPORTADORAS_PERMITIDAS = [1, 2]
    // Filtra apenas opções sem erro e formata
    const opcoes: OpcaoFrete[] = data
      .filter((op: any) => !op.error && TRANSPORTADORAS_PERMITIDAS.includes(op.id))
      .map((op: any) => ({
        id:      op.id,
        nome:    op.name,
        preco:   op.price,
        prazo:   op.delivery_time,
        empresa: op.company.name,
        logo:    op.company.picture,
      }))
      .sort((a: OpcaoFrete, b: OpcaoFrete) =>
        parseFloat(a.preco) - parseFloat(b.preco)
      )

    return NextResponse.json({ opcoes })

  } catch (err: any) {
    console.error('Erro na API de frete:', err)
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 })
  }
}