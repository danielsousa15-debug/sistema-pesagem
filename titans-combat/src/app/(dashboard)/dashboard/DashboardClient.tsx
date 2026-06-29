'use client'

import Link from 'next/link'
import {
  Users, UserCheck, DollarSign, AlertTriangle,
  TrendingUp, Clock, UserX, Target, Activity,
  ArrowRight, Calendar
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { DashboardStats } from '@/types'

type CheckinStudent = { id: string; name: string; photo_url?: string }

interface Props {
  stats: DashboardStats | null
  recentCheckins: Array<{
    id: string
    checked_at: string
    students: CheckinStudent | CheckinStudent[] | null
  }>
}

function firstStudent(v: CheckinStudent | CheckinStudent[] | null): CheckinStudent | null {
  if (!v) return null
  return Array.isArray(v) ? (v[0] ?? null) : v
}

function StatCard({
  label, value, sub, icon: Icon, color = 'red', href, danger
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  color?: 'red' | 'green' | 'yellow' | 'blue' | 'gray'
  href?: string
  danger?: boolean
}) {
  const colors = {
    red:    { bg: 'bg-red-500/10',    icon: 'text-red-400',    border: 'border-red-500/20' },
    green:  { bg: 'bg-emerald-500/10', icon: 'text-emerald-400', border: 'border-emerald-500/20' },
    yellow: { bg: 'bg-amber-500/10',  icon: 'text-amber-400',  border: 'border-amber-500/20' },
    blue:   { bg: 'bg-blue-500/10',   icon: 'text-blue-400',   border: 'border-blue-500/20' },
    gray:   { bg: 'bg-white/5',       icon: 'text-zinc-400',   border: 'border-white/5' },
  }
  const c = colors[color]

  const content = (
    <div className={`card p-4 ${danger ? 'border-red-900/40' : ''} ${href ? 'hover:border-white/10 cursor-pointer transition-all' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.bg} border ${c.border}`}>
          <Icon size={18} className={c.icon} />
        </div>
        {href && <ArrowRight size={14} className="text-zinc-600 mt-1" />}
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-zinc-600 mt-1">{sub}</p>}
    </div>
  )

  if (href) return <Link href={href}>{content}</Link>
  return content
}

export function DashboardClient({ stats, recentCheckins }: Props) {
  const s = stats

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pt-2 lg:pt-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Link href="/alunos/novo" className="btn-red text-xs px-3 py-2">
          + Novo Aluno
        </Link>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard
          label="Alunos Ativos"
          value={s?.total_active ?? '—'}
          icon={Users}
          color="blue"
          href="/alunos?status=ativo"
        />
        <StatCard
          label="Presentes Hoje"
          value={s?.present_today ?? '—'}
          icon={UserCheck}
          color="green"
          href="/alunos?filtro=hoje"
        />
        <StatCard
          label="Presentes na Semana"
          value={s?.present_week ?? '—'}
          icon={Activity}
          color="blue"
          href="/alunos?filtro=semana"
        />
        <StatCard
          label="Presentes no Mês"
          value={s?.present_month ?? '—'}
          icon={Calendar}
          color="gray"
          href="/alunos?filtro=mes"
        />
      </div>

      {/* Financial */}
      <div>
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Financeiro — Mês Atual</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <StatCard
            label="Receita Prevista"
            value={formatCurrency(s?.revenue_expected ?? 0)}
            icon={DollarSign}
            color="blue"
            href="/financeiro"
          />
          <StatCard
            label="Receita Recebida"
            value={formatCurrency(s?.revenue_received ?? 0)}
            icon={TrendingUp}
            color="green"
            href="/financeiro?status=pago"
          />
          <StatCard
            label="Receita em Atraso"
            value={formatCurrency(s?.revenue_overdue ?? 0)}
            icon={AlertTriangle}
            color="yellow"
            danger
            href="/financeiro?status=atrasado"
          />
          <StatCard
            label="Inadimplentes"
            value={s?.total_overdue_students ?? '—'}
            icon={UserX}
            color="red"
            danger
            href="/alunos?status=inadimplente"
          />
        </div>
      </div>

      {/* Retention / Absence alerts */}
      <div>
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Retenção — Alunos Sem Treinar</h2>
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Há 7 dias"
            value={s?.absent_7days ?? '—'}
            icon={Clock}
            color="yellow"
            href="/alunos?filtro=sem7dias"
          />
          <StatCard
            label="Há 15 dias"
            value={s?.absent_15days ?? '—'}
            icon={Clock}
            color="yellow"
            danger
            href="/alunos?filtro=sem15dias"
          />
          <StatCard
            label="Há 30 dias"
            value={s?.absent_30days ?? '—'}
            icon={Clock}
            color="red"
            danger
            href="/alunos?filtro=sem30dias"
          />
        </div>
      </div>

      {/* Other stats + Recent checkins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth */}
        <div>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Crescimento — Mês Atual</h2>
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label="Novos Alunos"
              value={s?.new_students_month ?? '—'}
              icon={TrendingUp}
              color="green"
              href="/alunos?filtro=novos"
            />
            <StatCard
              label="Cancelamentos"
              value={s?.cancellations_month ?? '—'}
              icon={UserX}
              color="red"
              href="/alunos?status=cancelado"
            />
            <StatCard
              label="Leads"
              value={s?.total_leads ?? '—'}
              icon={Target}
              color="blue"
              href="/leads"
            />
          </div>
        </div>

        {/* Recent checkins */}
        <div>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Últimas Presenças</h2>
          <div className="card divide-y divide-white/5">
            {recentCheckins.length === 0 ? (
              <p className="text-sm text-zinc-500 px-4 py-6 text-center">Nenhum check-in hoje</p>
            ) : (
              recentCheckins.slice(0, 8).map(c => (
                <div key={c.id} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#dc2626]/20 flex items-center justify-center shrink-0">
                      <UserCheck size={13} className="text-[#dc2626]" />
                    </div>
                    <span className="text-sm font-medium truncate max-w-[140px]">
                      {firstStudent(c.students)?.name ?? 'Aluno'}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500 shrink-0">
                    {new Date(c.checked_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
