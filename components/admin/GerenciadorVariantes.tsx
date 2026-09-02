'use client'

// components/admin/GerenciadorVariantes.tsx
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { formatarPreco } from '@/lib/types'
import type { Variante } from '@/lib/types'

type Props = {
  produtoId: string
  variantesIniciais: Variante[]
}

const VARIANTE_VAZIA = {
  nome: '',
  preco: '',
  estoque: '0',
  peso_gramas: '500',
  altura_cm: '10',
  largura_cm: '30',
  comprimento_cm: '40',
}

export default function GerenciadorVariantes({ produtoId, variantesIniciais }: Props) {
  const [variantes, setVariantes] = useState<Variante[]>(variantesIniciais)
  const [form, setForm] = useState(VARIANTE_VAZIA)
  const [imagensVariante, setImagensVariante] = useState<string[]>([])
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [uploadando, setUploadando] = useState(false)
  const [erro, setErro] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleUploadImagens(e: React.ChangeEvent<HTMLInputElement>) {
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
      const nome = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error } = await supabase.storage
        .from('imagens')
        .upload(`variantes/${nome}`, file, { cacheControl: '3600' })

      if (error) { setErro(`Erro ao enviar ${file.name}`); continue }

      const { data: { publicUrl } } = supabase.storage
        .from('imagens')
        .getPublicUrl(`variantes/${nome}`)

      novasUrls.push(publicUrl)
    }

    setImagensVariante(prev => [...prev, ...novasUrls])
    setUploadando(false)
  }

  function removerImagem(url: string) {
    setImagensVariante(prev => prev.filter(u => u !== url))
  }

  function iniciarEdicao(v: Variante) {
    setEditandoId(v.id)
    setImagensVariante(v.imagens || [])
    setForm({
      nome:           v.nome,
      preco:          (v.preco / 100).toFixed(2).replace('.', ','),
      estoque:        String(v.estoque),
      peso_gramas:    String(v.peso_gramas || 500),
      altura_cm:      String(v.altura_cm || 10),
      largura_cm:     String(v.largura_cm || 30),
      comprimento_cm: String(v.comprimento_cm || 40),
    })
  }

  function cancelar() {
    setEditandoId(null)
    setImagensVariante([])
    setForm(VARIANTE_VAZIA)
    setErro('')
  }

  async function salvar() {
    if (!form.nome.trim()) { setErro('Nome é obrigatório.'); return }
    if (!form.preco)        { setErro('Preço é obrigatório.'); return }

    setSalvando(true)
    setErro('')

    const dados = {
      produto_id:     produtoId,
      nome:           form.nome.trim(),
      preco:          Math.round(parseFloat(form.preco.replace(',', '.')) * 100),
      estoque:        parseInt(form.estoque) || 0,
      imagens:        imagensVariante,
      peso_gramas:    parseInt(form.peso_gramas) || 500,
      altura_cm:      parseInt(form.altura_cm) || 10,
      largura_cm:     parseInt(form.largura_cm) || 30,
      comprimento_cm: parseInt(form.comprimento_cm) || 40,
    }

    if (editandoId) {
      const { data, error } = await supabase
        .from('variantes').update(dados).eq('id', editandoId).select().single()
      if (error) { setErro(error.message); setSalvando(false); return }
      setVariantes(v => v.map(x => x.id === editandoId ? data : x))
    } else {
      const { data, error } = await supabase
        .from('variantes').insert(dados).select().single()
      if (error) { setErro(error.message); setSalvando(false); return }
      setVariantes(v => [...v, data])
    }

    cancelar()
    setSalvando(false)
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta variante?')) return
    await supabase.from('variantes').delete().eq('id', id)
    setVariantes(v => v.filter(x => x.id !== id))
  }

  async function toggleAtivo(variante: Variante) {
    await supabase.from('variantes').update({ ativo: !variante.ativo }).eq('id', variante.id)
    setVariantes(v => v.map(x => x.id === variante.id ? { ...x, ativo: !x.ativo } : x))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="block text-xs tracking-wider uppercase text-text-light">
          Variantes do produto
        </label>
        <span className="text-xs text-text-light">{variantes.length} cadastradas</span>
      </div>

      {/* Lista */}
      {variantes.length > 0 && (
        <div className="border border-linen rounded overflow-hidden mb-4">
          {variantes.map((v, i) => (
            <div key={v.id} className={`flex items-center gap-3 px-3 py-2.5 ${
              i < variantes.length - 1 ? 'border-b border-linen' : ''
            } ${!v.ativo ? 'opacity-50' : ''}`}>

              {/* Miniaturas */}
              <div className="flex gap-1 flex-shrink-0">
                {(v.imagens || []).slice(0, 3).map((url, idx) => (
                  <img key={idx} src={url} alt=""
                    className="w-9 h-9 rounded object-cover border border-linen" />
                ))}
                {(v.imagens || []).length === 0 && (
                  <div className="w-9 h-9 rounded bg-cream border border-linen" />
                )}
                {(v.imagens || []).length > 3 && (
                  <div className="w-9 h-9 rounded bg-cream border border-linen flex items-center justify-center text-xs text-text-light">
                    +{(v.imagens || []).length - 3}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-dark">{v.nome}</p>
                <p className="text-xs text-text-light">
                  {formatarPreco(v.preco)} ·{' '}
                  <span className={v.estoque === 0 ? 'text-red-400' : 'text-forest-mid'}>
                    {v.estoque === 0 ? 'Esgotado' : `${v.estoque} un.`}
                  </span>
                  {' '}· {(v.imagens || []).length} foto{(v.imagens || []).length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <button type="button" onClick={() => toggleAtivo(v)}
                  className={`text-[11px] px-2 py-0.5 rounded-full border ${
                    v.ativo ? 'border-forest text-forest' : 'border-gray-300 text-gray-400'
                  }`}>
                  {v.ativo ? 'Ativa' : 'Inativa'}
                </button>
                <button type="button" onClick={() => iniciarEdicao(v)}
                  className="text-xs text-forest hover:underline">Editar</button>
                <button type="button" onClick={() => excluir(v.id)}
                  className="text-xs text-red-400 hover:text-red-600">Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulário */}
      <div className="border border-linen rounded p-4 bg-cream/50">
        <p className="text-xs font-medium text-text-mid mb-3">
          {editandoId ? 'Editando variante' : '+ Nova variante'}
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] text-text-light mb-1">Nome *</label>
            <input name="nome" className="input text-sm" value={form.nome}
              onChange={handleChange}
              placeholder="Ex: Bege, Azul, Com enchimento..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-text-light mb-1">Preço (R$) *</label>
              <input name="preco" className="input text-sm" value={form.preco}
                onChange={handleChange} placeholder="89,90" />
            </div>
            <div>
              <label className="block text-[11px] text-text-light mb-1">Estoque</label>
              <input name="estoque" type="number" min="0" className="input text-sm"
                value={form.estoque} onChange={handleChange} />
            </div>
          </div>

          {/* Upload de fotos da variante */}
          <div>
            <label className="block text-[11px] text-text-light mb-1">
              Fotos desta variante
            </label>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-linen rounded p-4 text-center cursor-pointer hover:border-forest transition-colors"
            >
              <p className="text-xs text-text-light">
                {uploadando ? '⏳ Enviando...' : '📷 Clique para adicionar fotos'}
              </p>
              <p className="text-[10px] text-text-light mt-0.5">
                Pode selecionar várias de uma vez · JPG, PNG · Máx 5MB cada
              </p>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" multiple
              className="hidden" onChange={handleUploadImagens} disabled={uploadando} />

            {/* Preview das fotos */}
            {imagensVariante.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mt-2">
                {imagensVariante.map((url, idx) => (
                  <div key={idx} className="relative aspect-square group">
                    <img src={url} alt=""
                      className="w-full h-full object-cover rounded border border-linen" />
                    <button
                      type="button"
                      onClick={() => removerImagem(url)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >×</button>
                    {idx === 0 && (
                      <span className="absolute bottom-0.5 left-0.5 text-[8px] bg-forest text-off-white px-1 rounded">
                        Principal
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <p className="text-[10px] text-text-light mt-1">
              Ao selecionar esta variante, essas fotos substituem a galeria do produto
            </p>
          </div>

          <details className="text-xs">
            <summary className="text-text-light cursor-pointer hover:text-forest transition-colors">
              Dimensões para frete (opcional)
            </summary>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-[11px] text-text-light mb-1">Peso (g)</label>
                <input name="peso_gramas" type="number" className="input text-sm"
                  value={form.peso_gramas} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-[11px] text-text-light mb-1">Altura (cm)</label>
                <input name="altura_cm" type="number" className="input text-sm"
                  value={form.altura_cm} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-[11px] text-text-light mb-1">Largura (cm)</label>
                <input name="largura_cm" type="number" className="input text-sm"
                  value={form.largura_cm} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-[11px] text-text-light mb-1">Comprimento (cm)</label>
                <input name="comprimento_cm" type="number" className="input text-sm"
                  value={form.comprimento_cm} onChange={handleChange} />
              </div>
            </div>
          </details>

          {erro && <p className="text-xs text-red-500">{erro}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={salvar} disabled={salvando || uploadando}
              className="btn-primary text-xs py-2 px-4 disabled:opacity-50">
              {salvando ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Adicionar variante'}
            </button>
            {editandoId && (
              <button type="button" onClick={cancelar} className="btn-outline text-xs py-2 px-4">
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>

      {variantes.length === 0 && (
        <p className="text-xs text-text-light mt-2">
          Sem variantes, o produto usa o preço e estoque cadastrados acima.
        </p>
      )}
    </div>
  )
}
