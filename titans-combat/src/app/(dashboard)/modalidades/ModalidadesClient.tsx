'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Dumbbell, Edit, Trash2, X, Save } from 'lucide-react'
import toast from 'react-hot-toast'

interface Modality {
  id: string
  name: string
  description?: string
  color: string
  active: boolean
  students?: { count: number }[]
}

interface Props {
  modalities: Modality[]
  tenantId: string
}

const COLORS = ['#dc2626', '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#db2777', '#0891b2', '#ea580c']

function Modal({ onClose, onSave, initial }: {
  onClose: () => void
  onSave: (data: { name: string; description: string; color: string; active: boolean }) => Promise<void>
  initial?: Modality
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    color: initial?.color ?? '#dc2626',
    active: initial?.active ?? true,
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Nome é obrigatório'); return }
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="card w-full max-w-md p-5 fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">{initial ? 'Editar' : 'Nova'} Modalidade</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">Nome *</label>
            <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="input-field" placeholder="Ex: Muay Thai" required />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">Descrição</label>
            <input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className="input-field" placeholder="Descrição opcional" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({...f, color: c}))}
                  className={`w-8 h-8 rounded-lg transition-all ${form.color === c ? 'ring-2 ring-white ring-offset-1 ring-offset-[#141414] scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="active" checked={form.active} onChange={e => setForm(f => ({...f, active: e.target.checked}))} className="w-4 h-4 accent-[#dc2626]" />
            <label htmlFor="active" className="text-sm text-zinc-300">Modalidade ativa</label>
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

export function ModalidadesClient({ modalities, tenantId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Modality | null>(null)

  async function handleSave(data: { name: string; description: string; color: string; active: boolean }) {
    const payload = { ...data, tenant_id: tenantId }
    let error
    if (editing) {
      ({ error } = await supabase.from('modalities').update(payload).eq('id', editing.id))
    } else {
      ({ error } = await supabase.from('modalities').insert(payload))
    }
    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success(editing ? 'Atualizada!' : 'Criada!')
    setShowModal(false); setEditing(null)
    router.refresh()
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir "${name}"?`)) return
    const { error } = await supabase.from('modalities').delete().eq('id', id)
    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success('Excluída!')
    router.refresh()
  }

  return (
    <div className="space-y-5 fade-in">
      {(showModal || editing) && (
        <Modal
          onClose={() => { setShowModal(false); setEditing(null) }}
          onSave={handleSave}
          initial={editing ?? undefined}
        />
      )}

      <div className="flex items-center justify-between pt-2 lg:pt-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Modalidades</h1>
          <p className="text-sm text-zinc-500">{modalities.length} modalidade{modalities.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-red">
          <Plus size={16} /> Nova Modalidade
        </button>
      </div>

      {modalities.length === 0 ? (
        <div className="card p-12 text-center">
          <Dumbbell size={40} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400 font-medium">Nenhuma modalidade cadastrada</p>
          <button onClick={() => setShowModal(true)} className="btn-red mt-4 inline-flex">
            <Plus size={16} /> Criar Modalidade
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {modalities.map(m => {
            const count = m.students?.[0]?.count ?? 0
            return (
              <div key={m.id} className="card p-4 hover:border-white/10 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: m.color + '25', border: `1px solid ${m.color}40` }}>
                      <Dumbbell size={18} style={{ color: m.color }} />
                    </div>
                    <div>
                      <p className="font-semibold">{m.name}</p>
                      <p className="text-xs text-zinc-500">{count} aluno{count !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  {!m.active && (
                    <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-full">Inativa</span>
                  )}
                </div>
                {m.description && <p className="text-xs text-zinc-500 mb-3">{m.description}</p>}
                <div className="flex gap-2">
                  <button onClick={() => setEditing(m)} className="btn-ghost text-xs px-2.5 py-1.5 flex-1 justify-center">
                    <Edit size={13} /> Editar
                  </button>
                  <button onClick={() => handleDelete(m.id, m.name)} className="btn-ghost text-xs px-2.5 py-1.5 text-red-400 hover:bg-red-950/20">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
