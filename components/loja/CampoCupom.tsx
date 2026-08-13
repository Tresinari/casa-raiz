'use client'

// components/loja/CampoCupom.tsx
import { useState } from 'react'
import { formatarPreco } from '@/lib/types'

type CupomAplicado = {
  id: string
  codigo: string
  desconto_tipo: string
  desconto_valor: number
  desconto_centavos: number
}

type Props = {
  totalCentavos: number
  onAplicar: (cupom: CupomAplicado | null) => void
  cupomAplicado: CupomAplicado | null
}

export default function CampoCupom({ totalCentavos, onAplicar, cupomAplicado }: Props) {
  const [codigo, setCodigo] = useState('')
  const [validando, setValidando] = useState(false)
  const [erro, setErro] = useState('')

  async function handleAplicar() {
    if (!codigo.trim()) return
    setValidando(true)
    setErro('')

    const res = await fetch('/api/cupom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo, total: totalCentavos }),
    })

    const data = await res.json()

    if (!res.ok) {
      setErro(data.erro || 'Cupom inválido.')
      setValidando(false)
      return
    }

    onAplicar({
      ...data.cupom,
      desconto_centavos: data.desconto_centavos,
    })
    setCodigo('')
    setValidando(false)
  }

  function handleRemover() {
    onAplicar(null)
    setErro('')
    setCodigo('')
  }

  // Cupom já aplicado — mostra resumo
  if (cupomAplicado) {
    return (
      <div className="flex items-center justify-between bg-forest/10 border border-forest/20 rounded px-3 py-2.5">
        <div>
          <p className="text-sm font-medium text-forest">
            🎉 Cupom <span className="font-mono">{cupomAplicado.codigo}</span> aplicado!
          </p>
          <p className="text-xs text-text-light mt-0.5">
            Desconto de{' '}
            {cupomAplicado.desconto_tipo === 'percentual'
              ? `${cupomAplicado.desconto_valor}%`
              : formatarPreco(cupomAplicado.desconto_valor)
            }
            {' '}— você economiza{' '}
            <span className="font-medium text-forest">
              {formatarPreco(cupomAplicado.desconto_centavos)}
            </span>
          </p>
        </div>
        <button
          onClick={handleRemover}
          className="text-text-light hover:text-red-500 text-lg transition-colors ml-3"
        >
          ×
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Código do cupom"
          value={codigo}
          onChange={e => setCodigo(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && handleAplicar()}
          className="input flex-1 text-sm font-mono tracking-wider"
          maxLength={20}
        />
        <button
          onClick={handleAplicar}
          disabled={validando || !codigo.trim()}
          className="btn-outline text-xs py-2 px-4 disabled:opacity-50 whitespace-nowrap"
        >
          {validando ? '...' : 'Aplicar'}
        </button>
      </div>
      {erro && (
        <p className="text-xs text-red-500 mt-1.5">{erro}</p>
      )}
    </div>
  )
}