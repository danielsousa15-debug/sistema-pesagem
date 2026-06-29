'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Search, Plus, UserCheck, Phone, ChevronRight, Filter } from 'lucide-react'
import { statusLabel, statusColor, formatDate } from '@/lib/utils'
import type { Student, Modality } from '@/types'

const STATUS_OPTS = [
  { value: '', label: 'Todos' },
  { value: 'ativo', label: 'Ativos' },
  { value: 'experimental', label: 'Experimentais' },
  { value: 'afastado', label: 'Afastados' },
  { value: 'inadimplente', label: 'Inadimplentes' },
  { value: 'cancelado', label: 'Cancelados' },
]

type ModalityJoin = { name: string; color: string }
type PlanJoin = { name: string; price: number }

type StudentRow = Pick<Student, 'id' | 'name' | 'photo_url' | 'status' | 'phone' | 'whatsapp' | 'email' | 'modality_id' | 'plan_id' | 'enrollment_date' | 'created_at'> & {
  modalities?: ModalityJoin | ModalityJoin[] | null
  plans?: PlanJoin | PlanJoin[] | null
}

function firstJoin<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null
  return Array.isArray(v) ? (v[0] ?? null) : v
}

interface Props {
  students: StudentRow[]
  modalities: Pick<Modality, 'id' | 'name' | 'color'>[]
  initialStatus?: string
  initialSearch?: string
}

export function StudentsClient({ students, modalities, initialStatus = '', initialSearch = '' }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState(initialSearch)
  const [isPending, startTransition] = useTransition()

  function applyFilter(status: string, q: string) {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (q) params.set('q', q)
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    applyFilter(initialStatus ?? '', search)
  }

  const initials = (name: string) =>
    name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()

  return (
    <div className="space-y-5 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 lg:pt-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alunos</h1>
          <p className="text-sm text-zinc-500">{students.length} aluno{students.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/alunos/novo" className="btn-red">
          <Plus size={16} />
          Novo Aluno
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar aluno..."
            className="input-field pl-9 pr-4"
          />
        </form>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-zinc-500 shrink-0" />
          <select
            value={initialStatus ?? ''}
            onChange={e => applyFilter(e.target.value, search)}
            className="input-field w-auto min-w-[130px]"
          >
            {STATUS_OPTS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      {students.length === 0 ? (
        <div className="card p-12 text-center">
          <UserCheck size={40} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400 font-medium">Nenhum aluno encontrado</p>
          <p className="text-zinc-600 text-sm mt-1">Tente mudar os filtros ou cadastrar um novo aluno</p>
          <Link href="/alunos/novo" className="btn-red mt-4 inline-flex">
            <Plus size={16} /> Cadastrar Aluno
          </Link>
        </div>
      ) : (
        <div className="card divide-y divide-white/[0.04]">
          {students.map(student => (
            <Link
              key={student.id}
              href={`/alunos/${student.id}`}
              className="flex items-center gap-4 px-4 py-3.5 hover:bg-white/[0.03] transition-colors group"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-[#dc2626]/15 flex items-center justify-center">
                {student.photo_url ? (
                  <img src={student.photo_url} alt={student.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-[#dc2626]">{initials(student.name)}</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{student.name}</p>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor(student.status)}`}>
                    {statusLabel(student.status)}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  {firstJoin(student.modalities) && (
                    <span className="text-xs text-zinc-500">{firstJoin(student.modalities)!.name}</span>
                  )}
                  {firstJoin(student.plans) && (
                    <span className="text-xs text-zinc-600">• {firstJoin(student.plans)!.name}</span>
                  )}
                  {(student.phone || student.whatsapp) && (
                    <span className="text-xs text-zinc-600 flex items-center gap-1">
                      <Phone size={10} />
                      {student.phone || student.whatsapp}
                    </span>
                  )}
                </div>
              </div>

              {/* Enrollment date */}
              <div className="hidden sm:block text-right shrink-0">
                <p className="text-xs text-zinc-600">Matrícula</p>
                <p className="text-xs text-zinc-400">{formatDate(student.enrollment_date ?? student.created_at)}</p>
              </div>

              <ChevronRight size={16} className="text-zinc-600 shrink-0 group-hover:text-zinc-400 transition-colors" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
