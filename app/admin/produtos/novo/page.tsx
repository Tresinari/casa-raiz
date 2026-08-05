'use client'

// app/admin/produtos/novo/page.tsx
// Também serve para edição: app/admin/produtos/[id]/page.tsx
// Cadastro de produto com upload de imagem para o Supabase Storage

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { gerarSlug } from '@/lib/types'

const CATEGORIAS = ['Louças', 'Tapetes', 'Almofadas', 'Artigos Diversos', 'Peseiras ou Mantas', 'Mesa', 'Cama']

export default function NovoProdutoPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    preco: '',
    preco_original: '',
    categoria: 'Louças',
    estoque: '10',
    ativo: true,
    destaque: false,
    peso_gramas: '500',
    altura_cm: '10',
    largura_cm: '30',
    comprimento_cm: '40',
  })

  const [imagens, setImagens] = useState<string[]>([])
  const [uploadando, setUploadando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

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
      // Valida tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErro(`${file.name} é maior que 5MB. Reduza o tamanho da imagem.`)
        continue
      }

      const ext = file.name.split('.').pop()
      const nomeArquivo = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const caminho = `produtos/${nomeArquivo}`

      const { error } = await supabase.storage
        .from('imagens')
        .upload(caminho, file, { cacheControl: '3600', upsert: false })

      if (error) {
        setErro(`Erro ao enviar ${file.name}: ${error.message}`)
        continue
      }

      const { data: { publicUrl } } = supabase.storage
        .from('imagens')
        .getPublicUrl(caminho)

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

    if (!form.nome.trim()) { setErro('Nome é obrigatório.'); setSalvando(false); return }
    if (!form.preco) { setErro('Preço é obrigatório.'); setSalvando(false); return }

    const slug = gerarSlug(form.nome)
    const preco = Math.round(parseFloat(form.preco.replace(',', '.')) * 100)
    const precoOriginal = form.preco_original
      ? Math.round(parseFloat(form.preco_original.replace(',', '.')) * 100)
      : null

    const { error } = await supabase.from('produtos').insert({
      nome: form.nome.trim(),
      slug,
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

    if (error) {
      setErro(`Erro ao salvar: ${error.message}`)
      setSalvando(false)
      return
    }

    router.push('/admin/produtos')
  }

  return (
    <div className="min-h-screen bg-cream">

      {/* Header */}
      <header className="bg-forest text-off-white px-6 py-4 flex items-center justify-between">
        <h1 className="font-serif text-xl font-medium">Novo produto</h1>
        <button onClick={() => router.back()} className="text-sm text-off-white/70 hover:text-off-white">
          ← Voltar
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSalvar} className="space-y-6">

          {/* Nome */}
          <div>
            <label className="block text-xs tracking-wider uppercase text-text-light mb-1.5">
              Nome do produto *
            </label>
            <input name="nome" className="input" value={form.nome}
              onChange={handleChange} placeholder="Ex: Manta Tricô Raiz" required />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs tracking-wider uppercase text-text-light mb-1.5">Categoria *</label>
            <select name="categoria" className="input" value={form.categoria} onChange={handleChange}>
              {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Preços */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs tracking-wider uppercase text-text-light mb-1.5">
                Preço (R$) *
              </label>
              <input name="preco" className="input" value={form.preco}
                onChange={handleChange} placeholder="189,90" required />
              <p className="text-[11px] text-text-light mt-1">Use vírgula para decimais</p>
            </div>
            <div>
              <label className="block text-xs tracking-wider uppercase text-text-light mb-1.5">
                Preço original (opcional)
              </label>
              <input name="preco_original" className="input" value={form.preco_original}
                onChange={handleChange} placeholder="229,90" />
              <p className="text-[11px] text-text-light mt-1">Aparece riscado como "de"</p>
            </div>
          </div>

          {/* Estoque */}
          <div>
            <label className="block text-xs tracking-wider uppercase text-text-light mb-1.5">Estoque</label>
            <input name="estoque" type="number" min="0" className="input" value={form.estoque}
              onChange={handleChange} />
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

          {/* Descrição */}
          <div>
            <label className="block text-xs tracking-wider uppercase text-text-light mb-1.5">Descrição</label>
            <textarea name="descricao" className="input resize-none h-28" value={form.descricao}
              onChange={handleChange} placeholder="Material, dimensões, instruções de lavagem..." />
          </div>

          {/* Upload de imagens */}
          <div>
            <label className="block text-xs tracking-wider uppercase text-text-light mb-1.5">
              Fotos do produto
            </label>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-linen rounded p-6 text-center cursor-pointer hover:border-forest transition-colors"
            >
              <p className="text-text-light text-sm">
                {uploadando ? '⏳ Enviando...' : '📷 Clique para selecionar fotos'}
              </p>
              <p className="text-[11px] text-text-light mt-1">JPG, PNG ou WEBP · Máximo 5MB cada</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleUploadImagem}
              disabled={uploadando}
            />

            {/* Preview das imagens */}
            {imagens.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {imagens.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded overflow-hidden border border-linen group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removerImagem(url)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >×</button>
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 text-[9px] bg-forest text-off-white px-1 rounded">Principal</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkboxes */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="ativo" checked={form.ativo}
                onChange={handleChange} className="w-4 h-4 accent-forest" />
              <span className="text-sm text-text-dark">Produto ativo (visível na loja)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="destaque" checked={form.destaque}
                onChange={handleChange} className="w-4 h-4 accent-forest" />
              <span className="text-sm text-text-dark">Exibir na home</span>
            </label>
          </div>

          {/* Erro */}
          {erro && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded px-3 py-2">{erro}</p>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={salvando || uploadando}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {salvando ? 'Salvando...' : 'Salvar produto'}
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
