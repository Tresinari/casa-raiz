'use client'

// app/pedido/sucesso/page.tsx
import { useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/loja/Header'
import { useCarrinho } from '@/hooks/useCarrinho'

export default function PedidoSucessoPage() {
  const { limpar } = useCarrinho()

  // Limpa o carrinho depois do pagamento aprovado
  useEffect(() => { limpar() }, [])

  return (
    <>
      <Header />
      <main className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="font-serif text-3xl font-medium text-forest mb-3">
          Pedido confirmado!
        </h1>
        <p className="text-text-mid mb-2">
          Seu pagamento foi aprovado. Você receberá um e-mail com os detalhes do pedido.
        </p>
        <p className="text-text-light text-sm mb-8">
          Em breve entraremos em contato para combinar a entrega.
        </p>
        <Link href="/loja" className="btn-primary">
          Continuar comprando
        </Link>
      </main>
    </>
  )
}
