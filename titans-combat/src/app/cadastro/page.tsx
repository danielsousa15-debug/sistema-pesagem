'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Loader2, User, Phone, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

const TENANT_ID = '00000000-0000-0000-0000-000000000001'

const MODALITIES = [
  { id: '691a1b1e-5048-41a3-8469-5e0b5a2318fc', name: 'Boxe' },
  { id: '734641de-8b68-46e2-9e8f-f1bce42c6352', name: 'Boxe Infantil' },
  { id: 'b414a0e6-996e-431c-a531-dd5c3f381306', name: 'Jiu-Jitsu' },
  { id: '019d5b09-0d07-40a2-9852-e42f5776cf20', name: 'Judô' },
  { id: '1d5f4a6c-9fdf-4ed9-99ce-4fb41e631745', name: 'Karatê' },
  { id: 'a92bc3f5-0427-40fe-92e8-9d7ae44afba7', name: 'Kickboxing' },
  { id: '0efa21ed-0b8a-49e1-8ff9-043530c02351', name: 'Krav Maga' },
  { id: '599fb382-77be-4a63-982f-6ed1a7314336', name: 'MMA' },
  { id: '244d2b4e-1aa1-4354-a0d0-8671e0b5315f', name: 'Muay Thai' },
  { id: '9c5b4013-cb10-46b8-bce2-690e7615ba1b', name: 'Muay Thai Kids' },
]

type Step = 'form' | 'success'

export default function CadastroPage() {
  const supabase = createClient()
  const [step, setStep] = useState<Step>('form')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    email: '',
    cpf: '',
    birth_date: '',
    gender: '',
    phone: '',
    whatsapp: '',
    modality_id: '',
    responsible_name: '',
    responsible_cpf: '',
    notes: '',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) { setError('Nome é obrigatório'); return }
    if (!form.email.trim()) { setError('Email é obrigatório'); return }
    if (!form.cpf.trim()) { setError('CPF é obrigatório'); return }
    if (!form.birth_date) { setError('Data de nascimento é obrigatória'); return }
    if (!form.gender) { setError('Sexo é obrigatório'); return }
    if (!form.phone.trim() && !form.whatsapp.trim()) { setError('Informe pelo menos um telefone ou WhatsApp'); return }
    if (!form.modality_id) { setError('Selecione a modalidade de interesse'); return }

    setSaving(true)

    // Check if email already registered
    const { data: existing } = await supabase
      .from('students')
      .select('id')
      .eq('email', form.email.trim().toLowerCase())
      .eq('tenant_id', TENANT_ID)
      .maybeSingle()

    if (existing) {
      setError('Este email já está cadastrado. Fale com a recepção.')
      setSaving(false)
      return
    }

    const { error: insertError } = await supabase.from('students').insert({
      tenant_id: TENANT_ID,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      cpf: form.cpf.trim() || null,
      birth_date: form.birth_date || null,
      gender: form.gender || null,
      phone: form.phone.trim() || null,
      whatsapp: form.whatsapp.trim() || form.phone.trim() || null,
      modality_id: form.modality_id || null,
      responsible_name: form.responsible_name.trim() || null,
      responsible_cpf: form.responsible_cpf.trim() || null,
      notes: form.notes.trim() || null,
      status: 'experimental',
      enrollment_date: new Date().toISOString().split('T')[0],
    })

    setSaving(false)
    if (insertError) {
      setError('Erro ao cadastrar. Tente novamente ou fale com a recepção.')
      return
    }

    setStep('success')
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] px-4">
        <div className="w-full max-w-sm card p-8 text-center fade-in">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <CheckCircle2 size={40} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl font-black text-emerald-400 mb-2">Cadastro realizado!</h2>
          <p className="text-zinc-300 mb-1">Bem-vindo(a) à <strong>Titãs Combat</strong>!</p>
          <p className="text-zinc-500 text-sm mb-6">Nossa equipe entrará em contato em breve para confirmar sua matrícula.</p>
          <Link href="/checkin" className="btn-red w-full justify-center py-3">
            Fazer Check-in agora
          </Link>
        </div>
        <p className="text-xs text-zinc-700 mt-8">Titãs Combat © {new Date().getFullYear()}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Titãs Combat" width={80} height={80} className="rounded-full mx-auto mb-4 ring-2 ring-[#dc2626]/30" />
          <h1 className="text-3xl font-black tracking-tight">TITÃS COMBAT</h1>
          <p className="text-zinc-500 mt-1">Cadastro de Aluno</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 fade-in">
          {/* Dados Pessoais */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/5">
              <User size={15} className="text-[#dc2626]" />
              <h2 className="font-semibold text-sm">Dados Pessoais</h2>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Nome Completo *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} className="input-field" placeholder="Seu nome completo" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Email *</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input-field" placeholder="seu@email.com" required />
              <p className="text-xs text-zinc-600 mt-1">Usado para fazer o check-in diário</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">CPF *</label>
                <input value={form.cpf} onChange={e => set('cpf', e.target.value)} className="input-field" placeholder="000.000.000-00" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Data de Nascimento *</label>
                <input type="date" value={form.birth_date} onChange={e => set('birth_date', e.target.value)} className="input-field" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Sexo *</label>
              <select value={form.gender} onChange={e => set('gender', e.target.value)} className="input-field" required>
                <option value="">Selecione</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>

          {/* Contato */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/5">
              <Phone size={15} className="text-[#dc2626]" />
              <h2 className="font-semibold text-sm">Contato</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Telefone *</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)} className="input-field" placeholder="(27) 99999-9999" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">WhatsApp *</label>
                <input value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} className="input-field" placeholder="(27) 99999-9999" />
              </div>
            </div>
          </div>

          {/* Modalidade */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/5">
              <span className="text-[#dc2626] text-sm">🥊</span>
              <h2 className="font-semibold text-sm">Modalidade de Interesse</h2>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Modalidade *</label>
              <select value={form.modality_id} onChange={e => set('modality_id', e.target.value)} className="input-field" required>
                <option value="">Selecione a modalidade</option>
                {MODALITIES.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Responsável (opcional) */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/5">
              <User size={15} className="text-zinc-500" />
              <h2 className="font-semibold text-sm text-zinc-400">Responsável <span className="text-zinc-600 font-normal">(para menores de 18 anos)</span></h2>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Nome do Responsável</label>
              <input value={form.responsible_name} onChange={e => set('responsible_name', e.target.value)} className="input-field" placeholder="Nome completo do responsável" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">CPF do Responsável</label>
              <input value={form.responsible_cpf} onChange={e => set('responsible_cpf', e.target.value)} className="input-field" placeholder="000.000.000-00" />
            </div>
          </div>

          {/* Observações */}
          <div className="card p-5">
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">Observações</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              className="input-field min-h-[80px] resize-y"
              placeholder="Lesões, restrições, objetivos, etc..."
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-4 py-3 text-center">
              {error}
            </p>
          )}

          <button type="submit" disabled={saving} className="btn-red w-full justify-center py-4 text-base">
            {saving ? <><Loader2 size={18} className="animate-spin" /> Cadastrando...</> : 'Confirmar Cadastro'}
          </button>

          <div className="text-center">
            <Link href="/checkin" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
              <ChevronLeft size={12} className="inline" /> Voltar ao check-in
            </Link>
          </div>
        </form>

        <p className="text-xs text-zinc-700 mt-8 text-center">Titãs Combat © {new Date().getFullYear()}</p>
      </div>
    </div>
  )
}
