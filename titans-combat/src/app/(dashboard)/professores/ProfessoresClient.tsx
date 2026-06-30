'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, UserCheck, Edit, Trash2, X, Save, Phone, Mail } from 'lucide-react'
import { formatPhone } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Teacher } from '@/types'

interface Props { teachers: Teacher[]; tenantId: string }

function Modal({ onClose, onSave, initial }: {
  onClose: () => void
  onSave: (data: Partial<Teacher>) => Promise<void>
  initial?: Teacher
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    cpf: initial?.cpf ?? '',
    phone: initial?.phone ?? '',
    email: initial?.email ?? '',
    specialty: initial?.specialty ?? '',
    active: initial?.active ?? true,
  })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string | boolean) => setForm(f => ({...f, [k]: v}))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="card w-full max-w-md p-5 fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">{initial ? 'Editar' : 'Novo'} Professor</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">Nome *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} className="input-field" required placeholder="Nome completo" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">CPF</label>
            <input value={form.cpf} onChange={e => set('cpf', e.target.value)} className="input-field" placeholder="000.000.000-00" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">Telefone</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)} className="input-field" placeholder="(00) 00000-0000" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input-field" placeholder="email@exemplo.com" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">Especialidade</label>
            <input value={form.specialty} onChange={e => set('specialty', e.target.value)} className="input-field" placeholder="Ex: Muay Thai, Jiu-Jitsu" />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="tactive" checked={form.active} onChange={e => set('active', e.target.checked)} className="w-4 h-4 accent-[#dc2626]" />
            <label htmlFor="tactive" className="text-sm text-zinc-300">Professor ativo</label>
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

export function ProfessoresClient({ teachers, tenantId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Teacher | null>(null)

  async function handleSave(data: Partial<Teacher>) {
    const payload = { ...data, tenant_id: tenantId }
    let error
    if (editing) {
      ({ error } = await supabase.from('teachers').update(payload).eq('id', editing.id))
    } else {
      ({ error } = await supabase.from('teachers').insert(payload))
    }
    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success(editing ? 'Atualizado!' : 'Criado!')
    setShowModal(false); setEditing(null)
    router.refresh()
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir professor "${name}"?`)) return
    const { error } = await supabase.from('teachers').delete().eq('id', id)
    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success('Excluído!')
    router.refresh()
  }

  const initials = (name: string) => name.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase()

  return (
    <div className="space-y-5 fade-in">
      {(showModal || editing) && (
        <Modal onClose={() => { setShowModal(false); setEditing(null) }} onSave={handleSave} initial={editing ?? undefined} />
      )}

      <div className="flex items-center justify-between pt-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Professores</h1>
          <p className="text-sm text-zinc-500">{teachers.length} professor{teachers.length !== 1 ? 'es' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-red">
          <Plus size={16} /> Novo Professor
        </button>
      </div>

      {teachers.length === 0 ? (
        <div className="card p-12 text-center">
          <UserCheck size={40} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400 font-medium">Nenhum professor cadastrado</p>
          <button onClick={() => setShowModal(true)} className="btn-red mt-4 inline-flex">
            <Plus size={16} /> Cadastrar Professor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {teachers.map(t => (
            <div key={t.id} className="card p-4 hover:border-white/10 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-[#dc2626]/15 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-[#dc2626]">{initials(t.name)}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{t.name}</p>
                  {t.specialty && <p className="text-xs text-zinc-500 truncate">{t.specialty}</p>}
                </div>
                {!t.active && <span className="ml-auto text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-full shrink-0">Inativo</span>}
              </div>
              <div className="space-y-1 mb-3">
                {t.phone && (
                  <a href={`tel:${t.phone}`} className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white">
                    <Phone size={12} />{formatPhone(t.phone)}
                  </a>
                )}
                {t.email && (
                  <a href={`mailto:${t.email}`} className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white">
                    <Mail size={12} />{t.email}
                  </a>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(t)} className="btn-ghost text-xs px-2.5 py-1.5 flex-1 justify-center">
                  <Edit size={13} /> Editar
                </button>
                <button onClick={() => handleDelete(t.id, t.name)} className="btn-ghost text-xs px-2.5 py-1.5 text-red-400 hover:bg-red-950/20">
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
