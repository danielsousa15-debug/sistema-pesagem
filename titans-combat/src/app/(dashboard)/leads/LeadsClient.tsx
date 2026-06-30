'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Target, Edit, Trash2, X, Save, Phone, ChevronDown } from 'lucide-react'
import { formatDate, statusLabel, statusColor } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Lead } from '@/types'

interface Props {
  leads: Lead[]
  modalities: { id: string; name: string }[]
  tenantId: string
}

const SOURCES = ['Instagram', 'Facebook', 'Indicação', 'Passagem', 'WhatsApp', 'Site', 'Outro']
const STATUSES: Lead['status'][] = ['novo', 'contatado', 'agendado', 'convertido', 'perdido']

function Modal({ onClose, onSave, initial, modalities }: {
  onClose: () => void
  onSave: (data: Partial<Lead>) => Promise<void>
  initial?: Lead
  modalities: { id: string; name: string }[]
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    phone: initial?.phone ?? '',
    email: initial?.email ?? '',
    modality_interest: initial?.modality_interest ?? '',
    source: initial?.source ?? '',
    status: initial?.status ?? 'novo' as Lead['status'],
    notes: initial?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => setForm(f => ({...f, [k]: v}))

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
          <h2 className="font-bold">{initial ? 'Editar' : 'Novo'} Lead</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">Nome *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} className="input-field" required placeholder="Nome completo" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">Telefone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} className="input-field" placeholder="(00) 00000-0000" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input-field" placeholder="email" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">Modalidade</label>
              <select value={form.modality_interest} onChange={e => set('modality_interest', e.target.value)} className="input-field">
                <option value="">Selecione</option>
                {modalities.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">Origem</label>
              <select value={form.source} onChange={e => set('source', e.target.value)} className="input-field">
                <option value="">Selecione</option>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} className="input-field">
              {STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">Observações</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} className="input-field min-h-[70px] resize-y" placeholder="Anotações sobre o lead..." />
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

export function LeadsClient({ leads, modalities, tenantId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Lead | null>(null)
  const [filter, setFilter] = useState<string>('')

  const modalityMap = Object.fromEntries(modalities.map(m => [m.id, m.name]))

  async function handleSave(data: Partial<Lead>) {
    const payload = { ...data, tenant_id: tenantId }
    let error
    if (editing) {
      ({ error } = await supabase.from('leads').update(payload).eq('id', editing.id))
    } else {
      ({ error } = await supabase.from('leads').insert(payload))
    }
    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success(editing ? 'Atualizado!' : 'Lead criado!')
    setShowModal(false); setEditing(null)
    router.refresh()
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir lead "${name}"?`)) return
    const { error } = await supabase.from('leads').delete().eq('id', id)
    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success('Lead excluído!')
    router.refresh()
  }

  async function handleStatusChange(id: string, status: Lead['status']) {
    const { error } = await supabase.from('leads').update({ status }).eq('id', id)
    if (error) { toast.error('Erro'); return }
    router.refresh()
  }

  const filtered = filter ? leads.filter(l => l.status === filter) : leads

  // Count by status
  const counts = Object.fromEntries(STATUSES.map(s => [s, leads.filter(l => l.status === s).length]))

  return (
    <div className="space-y-5 fade-in">
      {(showModal || editing) && (
        <Modal
          onClose={() => { setShowModal(false); setEditing(null) }}
          onSave={handleSave}
          initial={editing ?? undefined}
          modalities={modalities}
        />
      )}

      <div className="flex items-center justify-between pt-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-sm text-zinc-500">{leads.length} lead{leads.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-red">
          <Plus size={16} /> Novo Lead
        </button>
      </div>

      {/* Kanban filter pills */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('')} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filter === '' ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-400 border-white/10 hover:border-white/30'}`}>
          Todos ({leads.length})
        </button>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filter === s ? statusColor(s) + ' font-semibold' : 'bg-transparent text-zinc-400 border-white/10 hover:border-white/30'}`}>
            {statusLabel(s)} ({counts[s]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Target size={40} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400 font-medium">Nenhum lead encontrado</p>
          <button onClick={() => setShowModal(true)} className="btn-red mt-4 inline-flex">
            <Plus size={16} /> Adicionar Lead
          </button>
        </div>
      ) : (
        <div className="card divide-y divide-white/[0.04]">
          {filtered.map(lead => (
            <div key={lead.id} className="flex items-center justify-between px-4 py-3.5 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#dc2626]/15 flex items-center justify-center shrink-0">
                  <Target size={15} className="text-[#dc2626]" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{lead.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white">
                        <Phone size={10} />{lead.phone}
                      </a>
                    )}
                    {lead.modality_interest && modalityMap[lead.modality_interest] && (
                      <span className="text-xs text-zinc-600">• {modalityMap[lead.modality_interest]}</span>
                    )}
                    {lead.source && <span className="text-xs text-zinc-600">• {lead.source}</span>}
                    <span className="text-xs text-zinc-700">{formatDate(lead.created_at)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Quick status change */}
                <div className="relative group">
                  <button className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1 ${statusColor(lead.status)}`}>
                    {statusLabel(lead.status)} <ChevronDown size={10} />
                  </button>
                  <div className="hidden group-hover:flex absolute right-0 top-full mt-1 flex-col bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden z-10 shadow-2xl w-32">
                    {STATUSES.filter(s => s !== lead.status).map(s => (
                      <button key={s} onClick={() => handleStatusChange(lead.id, s)}
                        className="px-3 py-2 text-xs text-left hover:bg-white/5 text-zinc-300"
                      >
                        {statusLabel(s)}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => setEditing(lead)} className="btn-ghost p-1.5">
                  <Edit size={14} />
                </button>
                <button onClick={() => handleDelete(lead.id, lead.name)} className="btn-ghost p-1.5 text-red-400 hover:bg-red-950/20">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
