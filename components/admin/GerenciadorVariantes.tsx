'use client'

import { useState } from 'react'
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
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const supabase = createClient()

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function iniciarEdicao(v: Variante) {
    setEditandoId(v.id)
    setForm({
      nome:          v.nome,
      preco:         (v.preco / 100).toFixed(2).replace('.', ','),
      estoque:       String(v.estoque),
      peso_gramas:   String(v.peso_gramas || 500),
      altura_cm:     String(v.altura_cm || 10),
      largura_cm:    String(v.largura_cm || 30),
      comprimento_cm: String(v.comprimento_cm || 40),
    })
  }

  function cancelar() {
    setEditandoId(null)
    setForm(VARIANTE_VAZIA)
    setErro('')
  }

  async function salvar() {
    if (!form.nome.trim()) { setErro('Nome é obrigatório.'); return }
    if (!form.preco)        { setErro('Preço é obrigatório.'); return }

    setSalvando(true)
    setErro('')

    const dados = {
      produto_id:    produtoId,
      nome:          form.nome.trim(),
      preco:         Math.round(parseFloat(form.preco.replace(',', '.')) * 100),
      estoque:       parseInt(form.estoque) || 0,
      peso_gramas:   parseInt(form.peso_gramas) || 500,
      altura_cm:     parseInt(form.altura_cm) || 10,
      largura_cm:    parseInt(form.largura_cm) || 30,
      comprimento_cm: parseInt(form.comprimento_cm) || 40,
    }

    if (editandoId) {
      // Atualiza variante existente
      const { data, error } = await supabase
        .from('variantes')
        .update(dados)
        .eq('id', editandoId)
        .select()
        .single()

      if (error) { setErro(error.message); setSalvando(false); return }
      setVariantes(v => v.map(x => x.id === editandoId ? data : x))
    } else {
      // Cria nova variante
      const { data, error } = await supabase
        .from('variantes')
        .insert(dados)
        .select()
        .single()

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
    await supabase
      .from('variantes')
      .update({ ativo: !variante.ativo })
      .eq('id', variante.id)
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

      {/* Lista de variantes existentes */}
      {variantes.length > 0 && (
        <div className="border border-linen rounded overflow-hidden mb-4">
          {variantes.map((v, i) => (
            <div
              key={v.id}
              className={`flex items-center gap-3 px-3 py-2.5 ${
                i < variantes.length - 1 ? 'border-b border-linen' : ''
              } ${!v.ativo ? 'opacity-50' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-dark">{v.nome}</p>
                <p className="text-xs text-text-light">
                  {formatarPreco(v.preco)} ·{' '}
                  <span className={v.estoque === 0 ? 'text-red-400' : 'text-forest-mid'}>
                    {v.estoque === 0 ? 'Esgotado' : `${v.estoque} un.`}
                  </span>
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  type='button'
                  onClick={() => toggleAtivo(v)}
                  className={`text-[11px] px-2 py-0.5 rounded-full border ${
                    v.ativo
                      ? 'border-forest text-forest'
                      : 'border-gray-300 text-gray-400'
                  }`}
                >
                  {v.ativo ? 'Ativa' : 'Inativa'}
                </button>
                <button
                  type='button'
                  onClick={() => iniciarEdicao(v)}
                  className="text-xs text-forest hover:underline"
                >
                  Editar
                </button>
                <button
                  type='button'
                  onClick={() => excluir(v.id)}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulário de nova variante / edição */}
      <div className="border border-linen rounded p-4 bg-cream/50">
        <p className="text-xs font-medium text-text-mid mb-3">
          {editandoId ? 'Editando variante' : '+ Nova variante'}
        </p>

        <div className="space-y-3">
          {/* Nome */}
          <div>
            <label className="block text-[11px] text-text-light mb-1">
              Nome da variante *
            </label>
            <input
              name="nome"
              className="input text-sm"
              value={form.nome}
              onChange={handleChange}
              placeholder="Ex: Com enchimento, Sem enchimento, Bege, Tamanho G..."
            />
          </div>

          {/* Preço e estoque */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-text-light mb-1">Preço (R$) *</label>
              <input
                name="preco"
                className="input text-sm"
                value={form.preco}
                onChange={handleChange}
                placeholder="89,90"
              />
            </div>
            <div>
              <label className="block text-[11px] text-text-light mb-1">Estoque</label>
              <input
                name="estoque"
                type="number"
                min="0"
                className="input text-sm"
                value={form.estoque}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Dimensões — colapsável para não poluir */}
          <details className="text-xs">
            <summary className="text-text-light cursor-pointer hover:text-forest transition-colors">
              Dimensões para frete (opcional — usa as do produto se não preencher)
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

          {erro && (
            <p className="text-xs text-red-500">{erro}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={salvar}
              disabled={salvando}
              className="btn-primary text-xs py-2 px-4 disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Adicionar variante'}
            </button>
            {editandoId && (
              <button
                type="button"
                onClick={cancelar}
                className="btn-outline text-xs py-2 px-4"
              >
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