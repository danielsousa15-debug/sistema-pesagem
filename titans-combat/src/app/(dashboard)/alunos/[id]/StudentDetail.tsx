'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Edit, Phone, Mail, Calendar, CheckCircle2, DollarSign, Trash2 } from 'lucide-react'
import { statusLabel, statusColor, formatDate, formatCurrency, formatPhone } from '@/lib/utils'
import { StudentForm } from '../StudentForm'
import toast from 'react-hot-toast'
import type { Student, Modality, Teacher, Plan, Payment, Checkin } from '@/types'

interface Props {
  student: Student & {
    modalities?: { id: string; name: string; color: string } | null
    teachers?: { id: string; name: string } | null
    plans?: { id: string; name: string; price: number; validity_days: number } | null
  }
  checkins: Pick<Checkin, 'id' | 'checked_at'>[]
  payments: Payment[]
  tenantId: string
  modalities: Pick<Modality, 'id' | 'name' | 'color'>[]
  teachers: Pick<Teacher, 'id' | 'name'>[]
  plans: Pick<Plan, 'id' | 'name' | 'price'>[]
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between py-2 border-b border-white/[0.04] last:border-0">
      <span className="text-xs text-zinc-500 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-right max-w-[60%]">{value}</span>
    </div>
  )
}

export function StudentDetail({ student, checkins, payments, tenantId, modalities, teachers, plans }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [editing, setEditing] = useState(false)
  const [tab, setTab] = useState<'info' | 'checkins' | 'payments'>('info')

  const initials = student.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()

  async function handleDelete() {
    if (!confirm(`Excluir ${student.name}? Esta ação não pode ser desfeita.`)) return
    const { error } = await supabase.from('students').delete().eq('id', student.id)
    if (error) { toast.error('Erro ao excluir'); return }
    toast.success('Aluno excluído')
    router.push('/alunos')
    router.refresh()
  }

  if (editing) {
    return (
      <div>
        <StudentForm
          student={student}
          tenantId={tenantId}
          modalities={modalities}
          teachers={teachers}
          plans={plans}
        />
        <button onClick={() => setEditing(false)} className="btn-ghost mt-4">Cancelar edição</button>
      </div>
    )
  }

  return (
    <div className="space-y-5 fade-in max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2 lg:pt-0">
        <Link href="/alunos" className="btn-ghost px-2.5 py-2.5">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1" />
        <button onClick={() => setEditing(true)} className="btn-ghost">
          <Edit size={15} /> Editar
        </button>
        <button onClick={handleDelete} className="btn-ghost text-red-400 hover:bg-red-950/20 hover:border-red-900/40">
          <Trash2 size={15} />
        </button>
      </div>

      {/* Student card */}
      <div className="card p-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#dc2626]/15 flex items-center justify-center shrink-0">
            {student.photo_url ? (
              <img src={student.photo_url} alt={student.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-[#dc2626]">{initials}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{student.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusColor(student.status)}`}>
                {statusLabel(student.status)}
              </span>
              {student.modalities && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300">
                  {student.modalities.name}
                </span>
              )}
              {student.plans && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300">
                  {student.plans.name}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-4 mt-3">
              {(student.phone || student.whatsapp) && (
                <a href={`tel:${student.phone || student.whatsapp}`} className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white">
                  <Phone size={14} />
                  {formatPhone(student.phone || student.whatsapp || '')}
                </a>
              )}
              {student.email && (
                <a href={`mailto:${student.email}`} className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white">
                  <Mail size={14} />
                  {student.email}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#141414] border border-[#1f1f1f] rounded-xl p-1">
        {([
          { key: 'info', label: 'Informações', icon: Edit },
          { key: 'checkins', label: `Presenças (${checkins.length})`, icon: CheckCircle2 },
          { key: 'payments', label: `Pagamentos (${payments.length})`, icon: DollarSign },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-[#dc2626] text-white' : 'text-zinc-500 hover:text-white'
            }`}
          >
            <t.icon size={14} />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'info' && (
        <div className="card p-4 space-y-1">
          <InfoRow label="CPF" value={student.cpf} />
          <InfoRow label="Nascimento" value={formatDate(student.birth_date)} />
          <InfoRow label="Sexo" value={student.gender === 'M' ? 'Masculino' : student.gender === 'F' ? 'Feminino' : student.gender} />
          <InfoRow label="Email" value={student.email} />
          <InfoRow label="Telefone" value={student.phone ? formatPhone(student.phone) : undefined} />
          <InfoRow label="WhatsApp" value={student.whatsapp ? formatPhone(student.whatsapp) : undefined} />
          <InfoRow label="Contato Emergência" value={student.emergency_contact} />
          <InfoRow label="Tel. Emergência" value={student.emergency_phone ? formatPhone(student.emergency_phone) : undefined} />
          <InfoRow label="Responsável" value={student.responsible_name} />
          <InfoRow label="Professor" value={student.teachers?.name} />
          <InfoRow label="Matrícula" value={formatDate(student.enrollment_date)} />
          {student.notes && (
            <div className="pt-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Observações</p>
              <p className="text-sm text-zinc-300 bg-white/[0.03] rounded-lg p-3">{student.notes}</p>
            </div>
          )}
        </div>
      )}

      {tab === 'checkins' && (
        <div className="card divide-y divide-white/[0.04]">
          {checkins.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-8">Nenhuma presença registrada</p>
          ) : (
            checkins.map(c => (
              <div key={c.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(c.checked_at).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-zinc-400">
                  {new Date(c.checked_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'payments' && (
        <div className="card divide-y divide-white/[0.04]">
          {payments.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-8">Nenhum pagamento registrado</p>
          ) : (
            payments.map(p => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    p.status === 'pago' ? 'bg-emerald-500/10' : p.status === 'atrasado' ? 'bg-red-500/10' : 'bg-amber-500/10'
                  }`}>
                    <DollarSign size={14} className={p.status === 'pago' ? 'text-emerald-400' : p.status === 'atrasado' ? 'text-red-400' : 'text-amber-400'} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{formatCurrency(p.amount)}</p>
                    <p className="text-xs text-zinc-500">Vence: {formatDate(p.due_date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor(p.status)}`}>
                    {statusLabel(p.status)}
                  </span>
                  {p.paid_date && <p className="text-xs text-zinc-600 mt-1">Pago: {formatDate(p.paid_date)}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
