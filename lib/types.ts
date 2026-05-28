// lib/types.ts

export type Produto = {
  id: string
  nome: string
  slug: string
  descricao: string
  preco: number           // em centavos (ex: 18990 = R$ 189,90)
  preco_original?: number // preço "de" para exibir riscado
  categoria: string
  imagens: string[]       // URLs públicas do Supabase Storage
  estoque: number
  ativo: boolean
  destaque: boolean
  criado_em: string
}

export type ItemCarrinho = {
  produto: Produto
  quantidade: number
}

export type Pedido = {
  id: string
  status: 'pendente' | 'aprovado' | 'cancelado' | 'enviado'
  total: number
  itens: ItemCarrinho[]
  cliente_nome: string
  cliente_email: string
  mp_payment_id?: string
  criado_em: string
}

// Formata centavos para R$ 189,90
export function formatarPreco(centavos: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(centavos / 100)
}

// Gera slug a partir do nome
export function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}
