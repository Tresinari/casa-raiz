'use client'

// hooks/useCarrinho.tsx
// Carrinho global com Context API + persistência no localStorage

import { createContext, useContext, useEffect, useReducer, ReactNode } from 'react'
import { Produto, ItemCarrinho, formatarPreco } from '@/lib/types'

// ── Estado e Actions ──────────────────────────────────────
type Estado = { itens: ItemCarrinho[] }

type Action =
  | { type: 'ADICIONAR'; produto: Produto }
  | { type: 'REMOVER'; produtoId: string }
  | { type: 'ATUALIZAR_QUANTIDADE'; produtoId: string; quantidade: number }
  | { type: 'LIMPAR' }
  | { type: 'CARREGAR'; itens: ItemCarrinho[] }

function reducer(estado: Estado, action: Action): Estado {
  switch (action.type) {
    case 'ADICIONAR': {
      const existente = estado.itens.find(i => i.produto.id === action.produto.id)
      if (existente) {
        return {
          itens: estado.itens.map(i =>
            i.produto.id === action.produto.id
              ? { ...i, quantidade: i.quantidade + 1 }
              : i
          ),
        }
      }
      return { itens: [...estado.itens, { produto: action.produto, quantidade: 1 }] }
    }
    case 'REMOVER':
      return { itens: estado.itens.filter(i => i.produto.id !== action.produtoId) }
    case 'ATUALIZAR_QUANTIDADE':
      if (action.quantidade <= 0) {
        return { itens: estado.itens.filter(i => i.produto.id !== action.produtoId) }
      }
      return {
        itens: estado.itens.map(i =>
          i.produto.id === action.produtoId ? { ...i, quantidade: action.quantidade } : i
        ),
      }
    case 'LIMPAR':
      return { itens: [] }
    case 'CARREGAR':
      return { itens: action.itens }
    default:
      return estado
  }
}

// ── Context ───────────────────────────────────────────────
type CarrinhoContextType = {
  itens: ItemCarrinho[]
  totalItens: number
  totalPreco: string
  totalCentavos: number
  adicionar: (produto: Produto) => void
  remover: (produtoId: string) => void
  atualizarQuantidade: (produtoId: string, quantidade: number) => void
  limpar: () => void
}

const CarrinhoContext = createContext<CarrinhoContextType | null>(null)

export function CarrinhoProvider({ children }: { children: ReactNode }) {
  const [estado, dispatch] = useReducer(reducer, { itens: [] })

  // Carrega do localStorage na montagem
  useEffect(() => {
    try {
      const salvo = localStorage.getItem('casa-raiz-carrinho')
      if (salvo) dispatch({ type: 'CARREGAR', itens: JSON.parse(salvo) })
    } catch {}
  }, [])

  // Salva no localStorage a cada mudança
  useEffect(() => {
    localStorage.setItem('casa-raiz-carrinho', JSON.stringify(estado.itens))
  }, [estado.itens])

  const totalItens = estado.itens.reduce((s, i) => s + i.quantidade, 0)
  const totalCentavos = estado.itens.reduce(
    (s, i) => s + i.produto.preco * i.quantidade, 0
  )

  const value: CarrinhoContextType = {
    itens: estado.itens,
    totalItens,
    totalPreco: formatarPreco(totalCentavos),
    totalCentavos,
    adicionar: (produto) => dispatch({ type: 'ADICIONAR', produto }),
    remover: (id) => dispatch({ type: 'REMOVER', produtoId: id }),
    atualizarQuantidade: (id, qty) =>
      dispatch({ type: 'ATUALIZAR_QUANTIDADE', produtoId: id, quantidade: qty }),
    limpar: () => dispatch({ type: 'LIMPAR' }),
  }

  return <CarrinhoContext.Provider value={value}>{children}</CarrinhoContext.Provider>
}

export function useCarrinho() {
  const ctx = useContext(CarrinhoContext)
  if (!ctx) throw new Error('useCarrinho deve ser usado dentro de CarrinhoProvider')
  return ctx
}
