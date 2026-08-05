'use client'

// components/loja/CalculadoraFrete.tsx
import { useState } from 'react'
import type { OpcaoFrete } from '@/app/api/frete/route'

type Produto = {
  id: string
  preco: number
  quantidade: number
  peso_gramas?: number
  altura_cm?: number
  largura_cm?: number
  comprimento_cm?: number
}

type Props = {
  produtos: Produto[]
  onSelecionar?: (opcao: OpcaoFrete | null) => void
  fretesSelecionado?: OpcaoFrete | null
  freteGratis?: boolean
}

function formatarPreco(valor: string) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(parseFloat(valor))
}

export default function CalculadoraFrete({
  produtos,
  onSelecionar,
  fretesSelecionado,
  freteGratis = false,
}: Props) {
  const [cep, setCep] = useState('')
  const [calculando, setCalculando] = useState(false)
  const [opcoes, setOpcoes] = useState<OpcaoFrete[]>([])
  const [erro, setErro] = useState('')
  const [calculado, setCalculado] = useState(false)

  function formatarCep(valor: string) {
    const nums = valor.replace(/\D/g, '').slice(0, 8)
    if (nums.length > 5) return `${nums.slice(0, 5)}-${nums.slice(5)}`
    return nums
  }

  async function calcular() {
    const cepLimpo = cep.replace(/\D/g, '')
    if (cepLimpo.length !== 8) {
      setErro('CEP inválido. Digite os 8 dígitos.')
      return
    }

    setCalculando(true)
    setErro('')
    setOpcoes([])
    setCalculado(false)

    try {
      const res = await fetch('/api/frete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cep_destino: cepLimpo, produtos }),
      })

      const data = await res.json()

      if (!res.ok || data.erro) {
        setErro(data.erro || 'Erro ao calcular frete.')
        return
      }

      if (data.opcoes.length === 0) {
        setErro('Nenhuma opção de frete disponível para este CEP.')
        return
      }

      setOpcoes(data.opcoes)
      setCalculado(true)

    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setCalculando(false)
    }
  }

  // Frete grátis — exibe mensagem e zera o frete selecionado
  if (freteGratis) {
    if (onSelecionar && fretesSelecionado !== null) {
      onSelecionar(null)
    }

    return (
      <div className="mt-4">
        <p className="text-xs tracking-wider uppercase text-text-light mb-2">
          Entrega
        </p>
        <div className="bg-forest/10 border border-forest/20 rounded p-4 flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="text-sm font-medium text-forest">Frete grátis!</p>
            <p className="text-xs text-text-light mt-0.5">
              Parabéns! Sua compra tem frete grátis.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4">
      <p className="text-xs tracking-wider uppercase text-text-light mb-2">
        Calcular frete
      </p>

      {/* Input de CEP */}
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          placeholder="00000-000"
          value={cep}
          onChange={e => setCep(formatarCep(e.target.value))}
          onKeyDown={e => e.key === 'Enter' && calcular()}
          className="input flex-1 text-sm"
          maxLength={9}
        />
        <button
          onClick={calcular}
          disabled={calculando}
          className="btn-primary text-xs py-2 px-4 disabled:opacity-50 whitespace-nowrap"
        >
          {calculando ? '...' : 'Calcular'}
        </button>
      </div>

      <a
        href="https://buscacepinter.correios.com.br"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] text-text-light hover:text-forest transition-colors mt-1 inline-block"
      >
        Não sei meu CEP →
      </a>

      {/* Erro */}
      {erro && (
        <p className="text-sm text-red-500 mt-2">{erro}</p>
      )}

      {/* Opções de frete */}
      {calculado && opcoes.length > 0 && (
        <div className="mt-3 space-y-2">
          {opcoes.map(op => (
            <div
              key={op.id}
              onClick={() => onSelecionar?.(op)}
              className={`flex items-center gap-3 p-3 rounded border transition-all cursor-pointer ${
                fretesSelecionado?.id === op.id
                  ? 'border-forest bg-forest/5'
                  : 'border-linen hover:border-forest/40 bg-off-white'
              }`}
            >
              {/* Logo da transportadora */}
              {op.logo ? (
                <img
                  src={op.logo}
                  alt={op.empresa}
                  className="w-8 h-8 object-contain flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 bg-cream rounded flex-shrink-0" />
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-dark">{op.nome}</p>
                <p className="text-xs text-text-light">
                  {op.empresa} · {op.prazo} dias úteis
                </p>
              </div>

              {/* Preço */}
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-medium text-bark">
                  {parseFloat(op.preco) === 0 ? 'Grátis' : formatarPreco(op.preco)}
                </p>
              </div>

              {/* Indicador de seleção */}
              {onSelecionar && (
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${
                  fretesSelecionado?.id === op.id
                    ? 'border-forest bg-forest'
                    : 'border-linen'
                }`} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
