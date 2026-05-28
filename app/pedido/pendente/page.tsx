'use client'

// app/pedido/pendente/page.tsx
import Link from 'next/link'
import Header from '@/components/loja/Header'
import { useCarrinho } from '@/hooks/useCarrinho'
import { useEffect } from 'react'

export default function PedidoPendentePage() {
  const { limpar } = useCarrinho()
  useEffect(() => { limpar() }, [])

  return (
    <>
      <Header />
      <main className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-6">⏳</div>
        <h1 className="font-serif text-3xl font-medium text-gold mb-3">
          Pagamento pendente
        </h1>
        <p className="text-text-mid mb-2">
          Seu pedido foi criado! Se pagou com boleto ou Pix, aguarde a confirmação.
        </p>
        <p className="text-text-light text-sm mb-8">
          Você receberá um e-mail assim que o pagamento for confirmado.
        </p>
        <Link href="/loja" className="btn-primary">
          Voltar à loja
        </Link>
      </main>
    </>
  )
}
