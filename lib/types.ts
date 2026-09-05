// lib/types.ts

export type Variante = {
  id: string
  produto_id: string
  nome: string
  preco: number
  estoque: number
  imagens?: string[]   // galeria própria da variante
  peso_gramas?: number
  altura_cm?: number
  largura_cm?: number
  comprimento_cm?: number
  ativo: boolean
  criado_em: string
}

export type Produto = {
  id: string
  nome: string
  slug: string
  descricao: string
  preco: number
  preco_original?: number
  categoria: string
  imagens: string[]
  estoque: number
  ativo: boolean
  destaque: boolean
  criado_em: string
  peso_gramas?: number
  altura_cm?: number
  largura_cm?: number
  comprimento_cm?: number
  variantes?: Variante[]
}

export type ItemCarrinho = {
  produto: Produto
  quantidade: number
  variante?: Variante
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
  codigo_rastreio: string
  endereco_cep?: string
  endereco_rua?: string
  endereco_numero?: string
  endereco_complemento?: string
  endereco_bairro?: string
  endereco_cidade?: string
  endereco_estado?: string
}

export function formatarPreco(centavos: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(centavos / 100)
}

export function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export function precoMinimo(produto: Produto): number {
  if (produto.variantes && produto.variantes.length > 0) {
    return Math.min(...produto.variantes.map(v => v.preco))
  }
  return produto.preco
}
