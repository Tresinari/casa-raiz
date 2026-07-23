'use client'

// components/loja/FormNewsletter.tsx
import { useState } from 'react'

export default function FormNewsletter() {
  const [email, setEmail] = useState('')
  const [estado, setEstado] = useState<'idle' | 'loading' | 'ok' | 'erro'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEstado('loading')

    const res = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (res.ok) {
      setEstado('ok')
      setEmail('')
    } else {
      setEstado('erro')
    }
  }

  if (estado === 'ok') {
    return (
      <p className="text-[#E8C97A] font-medium text-sm">
        ✅ Cadastro realizado! Verifique seu e-mail para encontrar seu cupom de 10%.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm mx-auto">
      <input
        type="email"
        placeholder="seu@email.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        className="flex-1 px-4 py-2.5 rounded bg-white/10 border border-off-white/30 text-off-white placeholder-off-white/50 text-sm focus:outline-none focus:border-[#E8C97A]"
      />
      <button
        type="submit"
        disabled={estado === 'loading'}
        className="bg-[#E8C97A] text-[#7b3728] text-xs tracking-widest uppercase px-5 py-2.5 rounded transition-colors hover:bg-[#d4b560] whitespace-nowrap disabled:opacity-60"
      >
        {estado === 'loading' ? '...' : 'Quero!'}
      </button>
      {estado === 'erro' && (
        <p className="text-red-300 text-xs mt-1 absolute">Erro ao cadastrar. Tente novamente.</p>
      )}
    </form>
  )
}
