'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, AlertTriangle, XCircle, Wrench, Users, CreditCard, Dumbbell, Activity } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  fixStudentsWithoutStatus,
  fixExperimentalOlderThan30Days,
  fixStudentsWhatsappFromPhone,
} from './actions'

type DiagData = {
  totalStudents: number
  activeStudents: number
  semEmail: number
  semModalidade: number
  semPlano: number
  semTelefone: number
  semWhatsapp: number
  statusNull: number
  experimentalAntigos: number
  totalCheckins: number
  checkinsHoje: number
  planosSemPreco: number
  modalidadesAtivas: number
}

interface Props { diag: DiagData }

function Item({
  ok, label, count, action, actionLabel, href
}: {
  ok: boolean
  label: string
  count: number
  action?: () => Promise<void>
  actionLabel?: string
  href?: string
}) {
  const [pending, startTransition] = useTransition()

  function handleAction() {
    if (!action) return
    startTransition(async () => {
      await action()
      toast.success('Correção aplicada!')
    })
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${ok ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-yellow-500/20 bg-yellow-500/5'}`}>
      <div className="shrink-0">
        {ok
          ? <CheckCircle2 size={18} className="text-emerald-400" />
          : <AlertTriangle size={18} className="text-yellow-400" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {!ok && <p className="text-xs text-zinc-500">{count} registro(s) afetado(s)</p>}
      </div>
      {!ok && href && (
        <Link href={href} className="text-xs text-[#dc2626] hover:underline shrink-0">
          Ver
        </Link>
      )}
      {!ok && action && actionLabel && (
        <button
          onClick={handleAction}
          disabled={pending}
          className="btn-red text-xs px-3 py-1.5 shrink-0"
        >
          <Wrench size={12} />
          {pending ? 'Corrigindo...' : actionLabel}
        </button>
      )}
    </div>
  )
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center gap-2 pb-3 border-b border-white/5">
        <Icon size={16} className="text-[#dc2626]" />
        <h2 className="font-semibold text-sm">{title}</h2>
      </div>
      {children}
    </div>
  )
}

export function DiagnosticoClient({ diag }: Props) {
  const [refreshing, setRefreshing] = useState(false)

  const issues = [
    diag.semEmail, diag.semModalidade, diag.semPlano,
    diag.statusNull, diag.experimentalAntigos, diag.planosSemPreco,
  ].filter(n => n > 0).length

  return (
    <div className="space-y-5 fade-in max-w-2xl">
      <div className="pt-2 lg:pt-0">
        <h1 className="text-2xl font-bold tracking-tight">Diagnóstico do Sistema</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          {issues === 0
            ? 'Nenhum problema encontrado — sistema saudável!'
            : `${issues} tipo(s) de problema encontrado(s)`}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold">{diag.totalStudents}</p>
          <p className="text-xs text-zinc-500 mt-1">Total alunos</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{diag.activeStudents}</p>
          <p className="text-xs text-zinc-500 mt-1">Ativos</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold">{diag.checkinsHoje}</p>
          <p className="text-xs text-zinc-500 mt-1">Check-ins hoje</p>
        </div>
        <div className="card p-4 text-center">
          <p className={`text-2xl font-bold ${issues > 0 ? 'text-yellow-400' : 'text-emerald-400'}`}>{issues}</p>
          <p className="text-xs text-zinc-500 mt-1">Problemas</p>
        </div>
      </div>

      {/* Alunos */}
      <Section title="Alunos" icon={Users}>
        <Item
          ok={diag.semEmail === 0}
          label="Alunos sem email (não conseguem fazer check-in)"
          count={diag.semEmail}
          href="/alunos"
        />
        <Item
          ok={diag.semModalidade === 0}
          label="Alunos sem modalidade atribuída"
          count={diag.semModalidade}
          href="/alunos"
        />
        <Item
          ok={diag.semPlano === 0}
          label="Alunos sem plano atribuído"
          count={diag.semPlano}
          href="/alunos"
        />
        <Item
          ok={diag.semWhatsapp === 0}
          label="Alunos sem WhatsApp"
          count={diag.semWhatsapp}
          action={fixStudentsWhatsappFromPhone}
          actionLabel="Copiar do Telefone"
        />
        <Item
          ok={diag.statusNull === 0}
          label="Alunos com status inválido (null)"
          count={diag.statusNull}
          action={fixStudentsWithoutStatus}
          actionLabel="Definir como Ativo"
        />
        <Item
          ok={diag.experimentalAntigos === 0}
          label="Alunos experimentais há mais de 30 dias"
          count={diag.experimentalAntigos}
          action={fixExperimentalOlderThan30Days}
          actionLabel="Promover para Ativo"
        />
      </Section>

      {/* Planos e Modalidades */}
      <Section title="Planos e Modalidades" icon={CreditCard}>
        <Item
          ok={diag.planosSemPreco === 0}
          label="Planos com preço R$0,00 (podem ser incompletos)"
          count={diag.planosSemPreco}
          href="/planos"
        />
        <Item
          ok={diag.modalidadesAtivas > 0}
          label={`${diag.modalidadesAtivas} modalidade(s) ativa(s)`}
          count={0}
        />
      </Section>

      {/* Check-ins */}
      <Section title="Presenças" icon={Activity}>
        <Item
          ok={true}
          label={`${diag.totalCheckins} check-in(s) registrados no total`}
          count={0}
        />
        <Item
          ok={true}
          label={`${diag.checkinsHoje} check-in(s) hoje`}
          count={0}
        />
      </Section>
    </div>
  )
}
