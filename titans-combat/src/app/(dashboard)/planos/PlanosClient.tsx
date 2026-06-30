'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, CreditCard, Edit, Trash2, X, Save, Check, Infinity } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Plan } from '@/types'

interface Props { plans: Plan[]; tenantId: string }

const COLORS = ['#dc2626', '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#db2777', '#0891b2']

function Modal({ onClose, onSave, initial }: {
  onClose: () => void
  onSave: (data: Partial<Plan>) => Promise<void>
  initial?: Plan
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    price: initial?.price?.toString() ?? '',
    validity_days: initial?.validity_days?.toString() ?? '30',
    class_limit: initial?.class_limit?.toString() ?? '',
    unlimited: initial?.unlimited ?? true,
    benefits: (initial?.benefits ?? []).join('\n'),
    color: initial?.color ?? '#dc2626',
    active: initial?.active ?? true,
  })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string | boolean) => setForm(f => ({...f, [k]: v}))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.price) { toast.error('Nome e valor são obrigatórios'); return }
    setSaving(true)
    await onSave({
      name: form.name,
      price: parseFloat(form.price),
      validity_days: parseInt(form.validity_days),
      class_limit: form.unlimited ? null : (form.class_limit ? parseInt(form.class_limit) : null),
      unlimited: form.unlimited,
      benefits: form.benefits.split('\n').map(s => s.trim()).filter(Boolean),
      color: form.color,
      active: form.active,
    } as Partial<Plan>)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 overflow-y-auto">
      <div className="card w-full max-w-md p-5 fade-in my-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">{initial ? 'Editar' : 'Novo'} Plano</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">Nome *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} className="input-field" required placeholder="Ex: Plano Mensal" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">Valor (R$) *</label>
              <input type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} className="input-field" required placeholder="0,00" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">Validade (dias)</label>
              <input type="number" min="1" value={form.validity_days} onChange={e => set('validity_days', e.target.value)} className="input-field" placeholder="30" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="unlimited" checked={form.unlimited} onChange={e => set('unlimited', e.target.checked)} className="w-4 h-4 accent-[#dc2626]" />
            <label htmlFor="unlimited" className="text-sm text-zinc-300">Aulas ilimitadas</label>
          </div>
          {!form.unlimited && (
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">Qtd. Aulas</label>
              <input type="number" min="1" value={form.class_limit} onChange={e => set('class_limit', e.target.value)} className="input-field" placeholder="Quantidade de aulas" />
            </div>
          )}
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">Benefícios (um por linha)</label>
            <textarea value={form.benefits} onChange={e => set('benefits', e.target.value)} className="input-field min-h-[80px] resize-y" placeholder="Acesso completo&#10;Vestiário&#10;Wi-Fi" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">Cor do plano</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => set('color', c)}
                  className={`w-8 h-8 rounded-lg transition-all ${form.color === c ? 'ring-2 ring-white ring-offset-1 ring-offset-[#141414] scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="pactive" checked={form.active} onChange={e => set('active', e.target.checked)} className="w-4 h-4 accent-[#dc2626]" />
            <label htmlFor="pactive" className="text-sm text-zinc-300">Plano ativo</label>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-red flex-1 justify-center">
              <Save size={15} />{saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function PlanosClient({ plans, tenantId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Plan | null>(null)

  async function handleSave(data: Partial<Plan>) {
    const payload = { ...data, tenant_id: tenantId }
    let error
    if (editing) {
      ({ error } = await supabase.from('plans').update(payload).eq('id', editing.id))
    } else {
      ({ error } = await supabase.from('plans').insert(payload))
    }
    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success(editing ? 'Atualizado!' : 'Criado!')
    setShowModal(false); setEditing(null)
    router.refresh()
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir plano "${name}"?`)) return
    const { error } = await supabase.from('plans').delete().eq('id', id)
    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success('Excluído!')
    router.refresh()
  }

  return (
    <div className="space-y-5 fade-in">
      {(showModal || editing) && (
        <Modal onClose={() => { setShowModal(false); setEditing(null) }} onSave={handleSave} initial={editing ?? undefined} />
      )}

      <div className="flex items-center justify-between pt-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Planos</h1>
          <p className="text-sm text-zinc-500">{plans.length} plano{plans.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-red">
          <Plus size={16} /> Novo Plano
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="card p-12 text-center">
          <CreditCard size={40} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400 font-medium">Nenhum plano cadastrado</p>
          <button onClick={() => setShowModal(true)} className="btn-red mt-4 inline-flex">
            <Plus size={16} /> Criar Plano
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {plans.map(p => (
            <div key={p.id} className="card p-5 hover:border-white/10 transition-all" style={{ borderTopColor: p.color, borderTopWidth: 2 }}>
              <div className="flex items-start justify-between mb-1">
                <p className="font-bold text-lg">{p.name}</p>
                {!p.active && <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-full">Inativo</span>}
              </div>
              <p className="text-3xl font-bold mt-2" style={{ color: p.color }}>{formatCurrency(p.price)}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{p.validity_days} dias</p>

              <div className="flex items-center gap-2 mt-3 mb-3">
                {p.unlimited ? (
                  <span className="flex items-center gap-1.5 text-xs text-zinc-300 bg-white/5 px-2.5 py-1 rounded-full">
                    <Infinity size={12} /> Aulas ilimitadas
                  </span>
                ) : (
                  <span className="text-xs text-zinc-300 bg-white/5 px-2.5 py-1 rounded-full">
                    {p.class_limit} aulas
                  </span>
                )}
              </div>

              {p.benefits && p.benefits.length > 0 && (
                <ul className="space-y-1 mb-4">
                  {p.benefits.slice(0, 3).map((b, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-zinc-400">
                      <Check size={11} style={{ color: p.color }} className="shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex gap-2">
                <button onClick={() => setEditing(p)} className="btn-ghost text-xs px-2.5 py-1.5 flex-1 justify-center">
                  <Edit size={13} /> Editar
                </button>
                <button onClick={() => handleDelete(p.id, p.name)} className="btn-ghost text-xs px-2.5 py-1.5 text-red-400 hover:bg-red-950/20">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
