'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, DollarSign, CheckCircle2, AlertTriangle, Clock,
  X, Save, ChevronLeft, ChevronRight
} from 'lucide-react'
import { formatCurrency, formatDate, statusLabel, statusColor } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Payment } from '@/types'

type PaymentRow = Payment & { students?: { id: string; name: string; phone?: string; whatsapp?: string } | null }

interface Props {
  payments: PaymentRow[]
  students: { id: string; name: string }[]
  tenantId: string
  mesRef: string
  initialStatus?: string
}

const STATUS_OPTS = [
  { value: '', label: 'Todos' },
  { value: 'pendente', label: 'Pendentes' },
  { value: 'pago', label: 'Pagos' },
  { value: 'atrasado', label: 'Atrasados' },
]

function PayModal({ onClose, onSave, payment }: {
  onClose: () => void
  onSave: (data: { paid_date: string; payment_method: string }) => Promise<void>
  payment: PaymentRow
}) {
  const [form, setForm] = useState({ paid_date: new Date().toISOString().split('T')[0], payment_method: 'pix' })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="card w-full max-w-sm p-5 fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Registrar Pagamento</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18} /></button>
        </div>
        <p className="text-sm text-zinc-400 mb-4">
          {payment.students?.name} — <span className="text-white font-medium">{formatCurrency(payment.amount)}</span>
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">Data do pagamento</label>
            <input type="date" value={form.paid_date} onChange={e => setForm(f => ({...f, paid_date: e.target.value}))} className="input-field" required />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">Forma de pagamento</label>
            <select value={form.payment_method} onChange={e => setForm(f => ({...f, payment_method: e.target.value}))} className="input-field">
              <option value="pix">PIX</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="cartao">Cartão</option>
              <option value="transferencia">Transferência</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-red flex-1 justify-center">
              <CheckCircle2 size={15} />{saving ? 'Salvando...' : 'Confirmar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function NewPaymentModal({ onClose, onSave, students }: {
  onClose: () => void
  onSave: (data: Partial<Payment>) => Promise<void>
  students: { id: string; name: string }[]
}) {
  const [form, setForm] = useState({
    student_id: '', amount: '', due_date: new Date().toISOString().split('T')[0],
    payment_method: 'pix', notes: '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => setForm(f => ({...f, [k]: v}))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.student_id || !form.amount) { toast.error('Aluno e valor são obrigatórios'); return }
    setSaving(true)
    await onSave({ student_id: form.student_id, amount: parseFloat(form.amount), due_date: form.due_date, payment_method: form.payment_method as Payment['payment_method'], notes: form.notes || undefined, status: 'pendente' })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="card w-full max-w-sm p-5 fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Nova Cobrança</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">Aluno *</label>
            <select value={form.student_id} onChange={e => set('student_id', e.target.value)} className="input-field" required>
              <option value="">Selecione o aluno</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">Valor (R$) *</label>
            <input type="number" min="0" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} className="input-field" required placeholder="0,00" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">Vencimento</label>
            <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wide">Observação</label>
            <input value={form.notes} onChange={e => set('notes', e.target.value)} className="input-field" placeholder="Mensalidade, taxa, etc." />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-red flex-1 justify-center">
              <Save size={15} />{saving ? 'Salvando...' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function FinanceiroClient({ payments, students, tenantId, mesRef, initialStatus }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [payingId, setPayingId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [, startTransition] = useTransition()

  const [year, month] = mesRef.split('-').map(Number)
  const monthName = new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  function changeMonth(delta: number) {
    const d = new Date(year, month - 1 + delta, 1)
    const newMes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    startTransition(() => {
      const params = new URLSearchParams()
      params.set('mes', newMes)
      if (initialStatus) params.set('status', initialStatus)
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  function applyStatus(s: string) {
    const params = new URLSearchParams()
    params.set('mes', mesRef)
    if (s) params.set('status', s)
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  const payingPayment = payingId ? payments.find(p => p.id === payingId) : null

  async function handleMarkPaid(data: { paid_date: string; payment_method: string }) {
    const { error } = await supabase.from('payments').update({
      status: 'pago', paid_date: data.paid_date, payment_method: data.payment_method,
    }).eq('id', payingId)
    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success('Pagamento confirmado!')
    setPayingId(null)
    router.refresh()
  }

  async function handleNewPayment(data: Partial<Payment>) {
    const { error } = await supabase.from('payments').insert({ ...data, tenant_id: tenantId })
    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success('Cobrança criada!')
    setShowNew(false)
    router.refresh()
  }

  // Summary
  const total = payments.reduce((s, p) => s + Number(p.amount), 0)
  const received = payments.filter(p => p.status === 'pago').reduce((s, p) => s + Number(p.amount), 0)
  const overdue = payments.filter(p => p.status === 'atrasado').reduce((s, p) => s + Number(p.amount), 0)
  const pending = payments.filter(p => p.status === 'pendente').reduce((s, p) => s + Number(p.amount), 0)

  return (
    <div className="space-y-5 fade-in">
      {payingPayment && (
        <PayModal onClose={() => setPayingId(null)} onSave={handleMarkPaid} payment={payingPayment} />
      )}
      {showNew && (
        <NewPaymentModal onClose={() => setShowNew(false)} onSave={handleNewPayment} students={students} />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 lg:pt-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <div className="flex items-center gap-2 mt-1">
            <button onClick={() => changeMonth(-1)} className="text-zinc-500 hover:text-white p-1"><ChevronLeft size={16} /></button>
            <span className="text-sm text-zinc-300 capitalize">{monthName}</span>
            <button onClick={() => changeMonth(1)} className="text-zinc-500 hover:text-white p-1"><ChevronRight size={16} /></button>
          </div>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-red">
          <Plus size={16} /> Nova Cobrança
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Previsto', value: formatCurrency(total), icon: DollarSign, color: 'text-blue-400' },
          { label: 'Recebido', value: formatCurrency(received), icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Pendente', value: formatCurrency(pending), icon: Clock, color: 'text-amber-400' },
          { label: 'Atrasado', value: formatCurrency(overdue), icon: AlertTriangle, color: 'text-red-400' },
        ].map(item => (
          <div key={item.label} className="card p-4">
            <item.icon size={16} className={item.color + ' mb-2'} />
            <p className="text-xl font-bold">{item.value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-1 bg-[#141414] border border-[#1f1f1f] rounded-xl p-1 w-fit">
        {STATUS_OPTS.map(o => (
          <button key={o.value} onClick={() => applyStatus(o.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${(initialStatus ?? '') === o.value ? 'bg-[#dc2626] text-white' : 'text-zinc-500 hover:text-white'}`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* List */}
      {payments.length === 0 ? (
        <div className="card p-12 text-center">
          <DollarSign size={40} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400 font-medium">Nenhum pagamento neste período</p>
        </div>
      ) : (
        <div className="card divide-y divide-white/[0.04]">
          {payments.map(p => (
            <div key={p.id} className="flex items-center justify-between px-4 py-3.5 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${p.status === 'pago' ? 'bg-emerald-500/10' : p.status === 'atrasado' ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
                  <DollarSign size={14} className={p.status === 'pago' ? 'text-emerald-400' : p.status === 'atrasado' ? 'text-red-400' : 'text-amber-400'} />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{p.students?.name ?? '—'}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-zinc-500">Vence: {formatDate(p.due_date)}</p>
                    {p.paid_date && <p className="text-xs text-zinc-600">• Pago: {formatDate(p.paid_date)}</p>}
                    {p.notes && <p className="text-xs text-zinc-600 truncate">• {p.notes}</p>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <p className="font-semibold text-sm">{formatCurrency(p.amount)}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full border hidden sm:inline ${statusColor(p.status)}`}>
                  {statusLabel(p.status)}
                </span>
                {p.status !== 'pago' && (
                  <button onClick={() => setPayingId(p.id)} className="btn-ghost text-xs px-2.5 py-1.5">
                    <CheckCircle2 size={13} /> Pagar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
