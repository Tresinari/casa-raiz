'use client'

// app/admin/login/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })

    if (error) {
      console.log('Erro completo:', error)
      setErro('E-mail ou senha inválidos.')
      setLoading(false)
      return
    }

    router.push('/admin/produtos')
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-semibold text-forest">
            Casa <span className="text-gold">Raiz</span>
          </h1>
          <p className="text-sm text-text-light mt-1">Painel Administrativo</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-off-white border border-linen rounded p-6 space-y-4"
        >
          <div>
            <label className="block text-xs tracking-wider uppercase text-text-light mb-1.5">E-mail</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs tracking-wider uppercase text-text-light mb-1.5">Senha</label>
            <input
              type="password"
              className="input"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
            />
          </div>

          {erro && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded px-3 py-2">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
