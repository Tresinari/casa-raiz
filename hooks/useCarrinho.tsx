'use client'

// hooks/useCarrinho.tsx
import { createContext, useContext, useEffect, useReducer, ReactNode } from 'react'
import { Produto, Variante, ItemCarrinho, formatarPreco } from '@/lib/types'

type Estado = { itens: ItemCarrinho[] }

type Action =
  | { type: 'ADICIONAR'; produto: Produto; variante?: Variante }
  | { type: 'REMOVER'; produtoId: string; varianteId?: string }
  | { type: 'ATUALIZAR_QUANTIDADE'; produtoId: string; varianteId?: string; quantidade: number }
  | { type: 'LIMPAR' }
  | { type: 'CARREGAR'; itens: ItemCarrinho[] }

// Chave única por item — produto sem variante usa só o id do produto
function chaveItem(produtoId: string, varianteId?: string) {
  return varianteId ? `${produtoId}__${varianteId}` : produtoId
}

function reducer(estado: Estado, action: Action): Estado {
  switch (action.type) {

    case 'ADICIONAR': {
      const chave = chaveItem(action.produto.id, action.variante?.id)
      const existente = estado.itens.find(i =>
        chaveItem(i.produto.id, i.variante?.id) === chave
      )
      if (existente) {
        return {
          itens: estado.itens.map(i =>
            chaveItem(i.produto.id, i.variante?.id) === chave
              ? { ...i, quantidade: i.quantidade + 1 }
              : i
          ),
        }
      }
      return {
        itens: [...estado.itens, {
          produto: action.produto,
          quantidade: 1,
          variante: action.variante,
        }],
      }
    }

    case 'REMOVER': {
      const chave = chaveItem(action.produtoId, action.varianteId)
      return {
        itens: estado.itens.filter(i =>
          chaveItem(i.produto.id, i.variante?.id) !== chave
        ),
      }
    }

    case 'ATUALIZAR_QUANTIDADE': {
      const chave = chaveItem(action.produtoId, action.varianteId)
      if (action.quantidade <= 0) {
        return {
          itens: estado.itens.filter(i =>
            chaveItem(i.produto.id, i.variante?.id) !== chave
          ),
        }
      }
      return {
        itens: estado.itens.map(i =>
          chaveItem(i.produto.id, i.variante?.id) === chave
            ? { ...i, quantidade: action.quantidade }
            : i
        ),
      }
    }

    case 'LIMPAR':
      return { itens: [] }

    case 'CARREGAR':
      return { itens: action.itens }

    default:
      return estado
  }
}

type CarrinhoContextType = {
  itens: ItemCarrinho[]
  totalItens: number
  totalPreco: string
  totalCentavos: number
  adicionar: (produto: Produto, variante?: Variante) => void
  remover: (produtoId: string, varianteId?: string) => void
  atualizarQuantidade: (produtoId: string, varianteId?: string, quantidade?: number) => void
  limpar: () => void
}

const CarrinhoContext = createContext<CarrinhoContextType | null>(null)

export function CarrinhoProvider({ children }: { children: ReactNode }) {
  const [estado, dispatch] = useReducer(reducer, { itens: [] })

  useEffect(() => {
    try {
      const salvo = localStorage.getItem('casa-raiz-carrinho')
      if (salvo) dispatch({ type: 'CARREGAR', itens: JSON.parse(salvo) })
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem('casa-raiz-carrinho', JSON.stringify(estado.itens))
  }, [estado.itens])

  const totalItens = estado.itens.reduce((s, i) => s + i.quantidade, 0)

  // Preço do item: usa preço da variante se existir
  const totalCentavos = estado.itens.reduce((s, i) => {
    const preco = i.variante ? i.variante.preco : i.produto.preco
    return s + preco * i.quantidade
  }, 0)

  const value: CarrinhoContextType = {
    itens: estado.itens,
    totalItens,
    totalPreco: formatarPreco(totalCentavos),
    totalCentavos,
    adicionar: (produto, variante) =>
      dispatch({ type: 'ADICIONAR', produto, variante }),
    remover: (produtoId, varianteId) =>
      dispatch({ type: 'REMOVER', produtoId, varianteId }),
    atualizarQuantidade: (produtoId, varianteId, quantidade = 0) =>
      dispatch({ type: 'ATUALIZAR_QUANTIDADE', produtoId, varianteId, quantidade }),
    limpar: () => dispatch({ type: 'LIMPAR' }),
  }

  return <CarrinhoContext.Provider value={value}>{children}</CarrinhoContext.Provider>
}

export function useCarrinho() {
  const ctx = useContext(CarrinhoContext)
  if (!ctx) throw new Error('useCarrinho deve ser usado dentro de CarrinhoProvider')
  return ctx
}