'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, User, Phone, MapPin, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import type { Student, Modality, Teacher, Plan } from '@/types'

interface Props {
  tenantId: string
  modalities: Pick<Modality, 'id' | 'name' | 'color'>[]
  teachers: Pick<Teacher, 'id' | 'name'>[]
  plans: Pick<Plan, 'id' | 'name' | 'price'>[]
  student?: Student
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
        <Icon size={16} className="text-[#dc2626]" />
        <h2 className="font-semibold text-sm">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

export function StudentForm({ tenantId, modalities, teachers, plans, student }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = !!student

  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: student?.name ?? '',
    cpf: student?.cpf ?? '',
    birth_date: student?.birth_date ?? '',
    gender: student?.gender ?? '',
    phone: student?.phone ?? '',
    whatsapp: student?.whatsapp ?? '',
    email: student?.email ?? '',
    emergency_contact: student?.emergency_contact ?? '',
    emergency_phone: student?.emergency_phone ?? '',
    responsible_name: student?.responsible_name ?? '',
    responsible_cpf: student?.responsible_cpf ?? '',
    modality_id: student?.modality_id ?? '',
    teacher_id: student?.teacher_id ?? '',
    plan_id: student?.plan_id ?? '',
    enrollment_date: student?.enrollment_date ?? new Date().toISOString().split('T')[0],
    status: student?.status ?? 'ativo',
    notes: student?.notes ?? '',
    // address
    street: (student?.address as any)?.street ?? '',
    number: (student?.address as any)?.number ?? '',
    neighborhood: (student?.address as any)?.neighborhood ?? '',
    city: (student?.address as any)?.city ?? '',
    state: (student?.address as any)?.state ?? '',
    zip: (student?.address as any)?.zip ?? '',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Nome é obrigatório'); return }

    setSaving(true)
    const payload = {
      tenant_id: tenantId,
      name: form.name,
      cpf: form.cpf || null,
      birth_date: form.birth_date || null,
      gender: form.gender || null,
      phone: form.phone || null,
      whatsapp: form.whatsapp || null,
      email: form.email || null,
      emergency_contact: form.emergency_contact || null,
      emergency_phone: form.emergency_phone || null,
      responsible_name: form.responsible_name || null,
      responsible_cpf: form.responsible_cpf || null,
      modality_id: form.modality_id || null,
      teacher_id: form.teacher_id || null,
      plan_id: form.plan_id || null,
      enrollment_date: form.enrollment_date || null,
      status: form.status,
      notes: form.notes || null,
      address: {
        street: form.street, number: form.number,
        neighborhood: form.neighborhood, city: form.city,
        state: form.state, zip: form.zip,
      },
      updated_at: new Date().toISOString(),
    }

    let error
    if (isEdit) {
      ({ error } = await supabase.from('students').update(payload).eq('id', student.id))
    } else {
      ({ error } = await supabase.from('students').insert(payload))
    }

    setSaving(false)
    if (error) { toast.error('Erro ao salvar: ' + error.message); return }

    toast.success(isEdit ? 'Aluno atualizado!' : 'Aluno cadastrado!')
    router.push('/alunos')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 fade-in max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2 lg:pt-0">
        <Link href="/alunos" className="btn-ghost px-2.5 py-2.5">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {isEdit ? 'Editar Aluno' : 'Novo Aluno'}
          </h1>
        </div>
        <button type="submit" disabled={saving} className="btn-red">
          <Save size={16} />
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      {/* Personal */}
      <Section title="Dados Pessoais" icon={User}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nome *">
            <input value={form.name} onChange={e => set('name', e.target.value)} className="input-field" placeholder="Nome completo" required />
          </Field>
          <Field label="CPF">
            <input value={form.cpf} onChange={e => set('cpf', e.target.value)} className="input-field" placeholder="000.000.000-00" />
          </Field>
          <Field label="Data de Nascimento">
            <input type="date" value={form.birth_date} onChange={e => set('birth_date', e.target.value)} className="input-field" />
          </Field>
          <Field label="Sexo">
            <select value={form.gender} onChange={e => set('gender', e.target.value)} className="input-field">
              <option value="">Selecione</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
              <option value="outro">Outro</option>
            </select>
          </Field>
          <Field label="Email">
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input-field" placeholder="email@exemplo.com" />
          </Field>
        </div>
      </Section>

      {/* Contact */}
      <Section title="Contato" icon={Phone}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Telefone">
            <input value={form.phone} onChange={e => set('phone', e.target.value)} className="input-field" placeholder="(00) 00000-0000" />
          </Field>
          <Field label="WhatsApp">
            <input value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} className="input-field" placeholder="(00) 00000-0000" />
          </Field>
          <Field label="Contato Emergência">
            <input value={form.emergency_contact} onChange={e => set('emergency_contact', e.target.value)} className="input-field" placeholder="Nome do contato" />
          </Field>
          <Field label="Telefone Emergência">
            <input value={form.emergency_phone} onChange={e => set('emergency_phone', e.target.value)} className="input-field" placeholder="(00) 00000-0000" />
          </Field>
          <Field label="Responsável (menores)">
            <input value={form.responsible_name} onChange={e => set('responsible_name', e.target.value)} className="input-field" placeholder="Nome do responsável" />
          </Field>
          <Field label="CPF do Responsável">
            <input value={form.responsible_cpf} onChange={e => set('responsible_cpf', e.target.value)} className="input-field" placeholder="000.000.000-00" />
          </Field>
        </div>
      </Section>

      {/* Address */}
      <Section title="Endereço" icon={MapPin}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="CEP">
            <input value={form.zip} onChange={e => set('zip', e.target.value)} className="input-field" placeholder="00000-000" />
          </Field>
          <Field label="Cidade">
            <input value={form.city} onChange={e => set('city', e.target.value)} className="input-field" placeholder="Cidade" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Rua">
              <input value={form.street} onChange={e => set('street', e.target.value)} className="input-field" placeholder="Rua / Av." />
            </Field>
          </div>
          <Field label="Número">
            <input value={form.number} onChange={e => set('number', e.target.value)} className="input-field" placeholder="Nº" />
          </Field>
          <Field label="Bairro">
            <input value={form.neighborhood} onChange={e => set('neighborhood', e.target.value)} className="input-field" placeholder="Bairro" />
          </Field>
          <Field label="Estado">
            <input value={form.state} onChange={e => set('state', e.target.value)} className="input-field" placeholder="UF" maxLength={2} />
          </Field>
        </div>
      </Section>

      {/* Academy */}
      <Section title="Dados da Academia" icon={AlertCircle}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Modalidade">
            <select value={form.modality_id} onChange={e => set('modality_id', e.target.value)} className="input-field">
              <option value="">Selecione</option>
              {modalities.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </Field>
          <Field label="Professor">
            <select value={form.teacher_id} onChange={e => set('teacher_id', e.target.value)} className="input-field">
              <option value="">Selecione</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
          <Field label="Plano">
            <select value={form.plan_id} onChange={e => set('plan_id', e.target.value)} className="input-field">
              <option value="">Selecione</option>
              {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Data de Matrícula">
            <input type="date" value={form.enrollment_date} onChange={e => set('enrollment_date', e.target.value)} className="input-field" />
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={e => set('status', e.target.value)} className="input-field">
              <option value="ativo">Ativo</option>
              <option value="experimental">Experimental</option>
              <option value="afastado">Afastado</option>
              <option value="inadimplente">Inadimplente</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Observações">
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              className="input-field min-h-[80px] resize-y"
              placeholder="Observações sobre o aluno..."
            />
          </Field>
        </div>
      </Section>
    </form>
  )
}
