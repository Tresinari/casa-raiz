'use client'

// app/admin/produtos/[id]/page.tsx
import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { gerarSlug } from '@/lib/types'
import GerenciadorVariantes from '@/components/admin/GerenciadorVariantes'
import AdminHeader from '@/components/admin/AdminHeader'

const CATEGORIAS = ['Louças', 'Tapetes', 'Almofadas', 'Artigos Diversos', 'Peseiras ou Mantas', 'Mesa', 'Cama']

export default function EditarProdutoPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [uploadando, setUploadando] = useState(false)
  const [erro, setErro] = useState('')
  const [variantes, setVariantes] = useState<any[]>([])

  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    preco: '',
    preco_original: '',
    categoria: 'Louças',
    estoque: '0',
    ativo: true,
    destaque: false,
    peso_gramas: '500',
    altura_cm: '10',
    largura_cm: '30',
    comprimento_cm: '40',
  })

  const [imagens, setImagens] = useState<string[]>([])

  useEffect(() => {
    carregarProduto()
  }, [id])

  async function carregarProduto() {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      setErro('Produto não encontrado.')
      setCarregando(false)
      return
    }

    setForm({
      nome: data.nome,
      descricao: data.descricao || '',
      preco: (data.preco / 100).toFixed(2).replace('.', ','),
      preco_original: data.preco_original
        ? (data.preco_original / 100).toFixed(2).replace('.', ',')
        : '',
      categoria: data.categoria,
      estoque: String(data.estoque),
      ativo: data.ativo,
      destaque: data.destaque,
      peso_gramas: String(data.peso_gramas || 500),
      altura_cm: String(data.altura_cm || 10),
      largura_cm: String(data.largura_cm || 30),
      comprimento_cm: String(data.comprimento_cm || 40),
    })

    const { data: variantesData } = await supabase
      .from('variantes')
      .select('*')
      .eq('produto_id', id)
      .order('criado_em', { ascending: true })

    setVariantes(variantesData || [])

    setImagens(data.imagens || [])
    setCarregando(false)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    setForm(f => ({
      ...f,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  async function handleUploadImagem(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadando(true)
    const novasUrls: string[] = []

    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        setErro(`${file.name} é maior que 5MB.`)
        continue
      }

      const ext = file.name.split('.').pop()
      const nomeArquivo = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error } = await supabase.storage
        .from('imagens')
        .upload(`produtos/${nomeArquivo}`, file, { cacheControl: '3600' })

      if (error) { setErro(`Erro ao enviar ${file.name}`); continue }

      const { data: { publicUrl } } = supabase.storage
        .from('imagens')
        .getPublicUrl(`produtos/${nomeArquivo}`)

      novasUrls.push(publicUrl)
    }

    setImagens(prev => [...prev, ...novasUrls])
    setUploadando(false)
  }

  function removerImagem(url: string) {
    setImagens(prev => prev.filter(u => u !== url))
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro('')

    const preco = Math.round(parseFloat(form.preco.replace(',', '.')) * 100)
    const precoOriginal = form.preco_original
      ? Math.round(parseFloat(form.preco_original.replace(',', '.')) * 100)
      : null

    const { error } = await supabase
      .from('produtos')
      .update({
        nome: form.nome.trim(),
        slug: gerarSlug(form.nome),
        descricao: form.descricao.trim(),
        preco,
        preco_original: precoOriginal,
        categoria: form.categoria,
        estoque: parseInt(form.estoque) || 0,
        peso_gramas: parseInt(form.peso_gramas) || 500,
        altura_cm: parseInt(form.altura_cm) || 10,
        largura_cm: parseInt(form.largura_cm) || 30,
        comprimento_cm: parseInt(form.comprimento_cm) || 40,
        ativo: form.ativo,
        destaque: form.destaque,
        imagens,
      })
      .eq('id', id)

    if (error) {
      setErro(`Erro ao salvar: ${error.message}`)
      setSalvando(false)
      return
    }

    router.push('/admin/produtos')
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-text-light">Carregando produto...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <AdminHeader />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSalvar} className="space-y-6">

          <div>
            <label className="block text-xs tracking-wider uppercase text-text-light mb-1.5">Nome *</label>
            <input name="nome" className="input" value={form.nome} onChange={handleChange} required />
          </div>

          <div>
            <label className="block text-xs tracking-wider uppercase text-text-light mb-1.5">Categoria *</label>
            <select name="categoria" className="input" value={form.categoria} onChange={handleChange}>
              {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs tracking-wider uppercase text-text-light mb-1.5">Preço (R$) *</label>
              <input name="preco" className="input" value={form.preco} onChange={handleChange} placeholder="189,90" required />
            </div>
            <div>
              <label className="block text-xs tracking-wider uppercase text-text-light mb-1.5">Preço original</label>
              <input name="preco_original" className="input" value={form.preco_original} onChange={handleChange} placeholder="229,90" />
            </div>
          </div>

          <div>
            <label className="block text-xs tracking-wider uppercase text-text-light mb-1.5">Estoque</label>
            <input name="estoque" type="number" min="0" className="input" value={form.estoque} onChange={handleChange} />
          </div>

          <div>
            <label className='block text-xs tracking-wider uppercase text-text-light mb-1.5'>
              Dimensões e peso
            </label>
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='block text-[11px] text-text-light mb-1'>Peso (gramas)</label>
                <input name="peso_gramas" type="number" min="1" className='input' value={form.peso_gramas} onChange={handleChange} placeholder='500'/>
              </div>
              <div>
                <label className='block text-[11px] text-text-light mb-1'>Altura (cm)</label>
                <input name="peso_gramas" type="number" min="1" className='input' value={form.altura_cm} onChange={handleChange} placeholder='10'/>
              </div>
              <div>
                <label className='block text-[11px] text-text-light mb-1'>Largura (cm)</label>
                <input name="peso_gramas" type="number" min="1" className='input' value={form.largura_cm} onChange={handleChange} placeholder='30'/>
              </div>
              <div>
                <label className='block text-[11px] text-text-light mb-1'>Comprimento (cm)</label>
                <input name="peso_gramas" type="number" min="1" className='input' value={form.comprimento_cm} onChange={handleChange} placeholder='40'/>
              </div>
            </div>
            <p className='text-[11px] text-text-light mt-1.5'>Medidas da embalagem de envio, não do produto</p>
          </div>

          <div>
            <label className="block text-xs tracking-wider uppercase text-text-light mb-1.5">Descrição</label>
            <textarea name="descricao" className="input resize-none h-28" value={form.descricao} onChange={handleChange} />
          </div>

          {/* Imagens */}
          <div>
            <label className="block text-xs tracking-wider uppercase text-text-light mb-1.5">Fotos</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-linen rounded p-6 text-center cursor-pointer hover:border-forest transition-colors"
            >
              <p className="text-text-light text-sm">
                {uploadando ? '⏳ Enviando...' : '📷 Clique para adicionar fotos'}
              </p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
              onChange={handleUploadImagem} disabled={uploadando} />

            {imagens.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {imagens.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded overflow-hidden border border-linen group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removerImagem(url)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      ×
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 text-[9px] bg-forest text-off-white px-1 rounded">Principal</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="ativo" checked={form.ativo} onChange={handleChange} className="w-4 h-4 accent-forest" />
              <span className="text-sm">Produto ativo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="destaque" checked={form.destaque} onChange={handleChange} className="w-4 h-4 accent-forest" />
              <span className="text-sm">Exibir na home</span>
            </label>
          </div>

          {erro && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded px-3 py-2">{erro}</p>
          )}

          <div className='pt-4 border-t border-linen'>
            <GerenciadorVariantes
              produtoId={id}
              variantesIniciais={variantes}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={salvando || uploadando}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
              {salvando ? 'Salvando...' : 'Salvar alterações'}
            </button>
            <button type="button" onClick={() => router.back()} className="btn-outline">
              Cancelar
            </button>
          </div>

        </form>
      </main>
    </div>
  )
}
