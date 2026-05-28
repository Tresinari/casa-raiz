'use client'

// app/pedido/falha/page.tsx
import Link from 'next/link'
import Header from '@/components/loja/Header'

export default function PedidoFalhaPage() {
  return (
    <>
      <Header />
      <main className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-6">😕</div>
        <h1 className="font-serif text-3xl font-medium text-bark mb-3">
          Pagamento não aprovado
        </h1>
        <p className="text-text-mid mb-8">
          Não foi possível processar seu pagamento. Tente novamente ou use outro método.
        </p>
        <Link href="/checkout" className="btn-primary">
          Tentar novamente
        </Link>
      </main>
    </>
  )
}
