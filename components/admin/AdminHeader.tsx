'use client'

// components/admin/AdminHeader.tsx
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const LINKS = [
  { label: 'Produtos', href: '/admin/produtos' },
  { label: 'Pedidos',  href: '/admin/pedidos' },
  { label: 'Cupons',   href: '/admin/cupons' },
]

export default function AdminHeader() {
  const [menuAberto, setMenuAberto] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  async function logout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  function navegar(href: string) {
    setMenuAberto(false)
    router.push(href)
  }

  return (
    <>
      <header className="bg-forest text-off-white px-4 md:px-6 py-4 flex items-center justify-between relative z-50">
        <span className="font-serif text-xl font-medium flex-shrink-0">
          Casa <span className="text-gold-light">Raiz</span>
          <span className="text-off-white/50 text-sm ml-2 hidden sm:inline">Admin</span>
        </span>

        {/* Nav desktop */}
        <nav className="hidden md:flex gap-4">
          {LINKS.map(link => (
            <button
              key={link.href}
              onClick={() => router.push(link.href)}
              className={`text-sm transition-colors ${
                pathname.startsWith(link.href)
                  ? 'text-off-white font-medium border-b border-gold-light'
                  : 'text-off-white/60 hover:text-off-white'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex gap-4 items-center">
          <a href="/" target="_blank"
            className="text-sm text-off-white/60 hover:text-off-white transition-colors">
            Ver loja ↗
          </a>
          <button onClick={logout}
            className="text-sm text-off-white/60 hover:text-off-white transition-colors">
            Sair
          </button>
        </div>

        {/* Hambúrguer */}
        <button
          onClick={() => setMenuAberto(v => !v)}
          className="md:hidden flex flex-col gap-1.5 p-2 rounded hover:bg-white/10"
          aria-label="Menu"
        >
          <span className={`block w-5 h-0.5 bg-off-white transition-all duration-300 ${menuAberto ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-5 h-0.5 bg-off-white transition-all duration-300 ${menuAberto ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-off-white transition-all duration-300 ${menuAberto ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </header>

      {/* Menu mobile */}
      {menuAberto && (
        <div className="md:hidden bg-[#1a2e18] border-b border-forest/50 px-4 py-3 space-y-1 z-40">
          {LINKS.map(link => (
            <button
              key={link.href}
              onClick={() => navegar(link.href)}
              className={`w-full text-left px-3 py-2.5 rounded text-sm transition-colors ${
                pathname.startsWith(link.href)
                  ? 'bg-white/10 text-off-white font-medium'
                  : 'text-off-white/70 hover:bg-white/5 hover:text-off-white'
              }`}
            >
              {link.label}
            </button>
          ))}
          <div className="border-t border-white/10 pt-2 mt-2 flex gap-2">
            <a href="/" target="_blank"
              className="flex-1 text-center px-3 py-2 text-sm text-off-white/60 hover:text-off-white">
              Ver loja ↗
            </a>
            <button onClick={logout}
              className="flex-1 text-center px-3 py-2 text-sm text-off-white/60 hover:text-off-white">
              Sair
            </button>
          </div>
        </div>
      )}
    </>
  )
}