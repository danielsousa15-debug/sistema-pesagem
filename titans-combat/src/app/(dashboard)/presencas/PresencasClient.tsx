'use client'

import { useState } from 'react'
import { CalendarDays, Users, Clock, Search } from 'lucide-react'

type CheckinRow = {
  id: string
  checked_at: string
  students: { name: string; photo_url: string | null; modalities: { name: string; color: string } | null } | null
}

interface Props {
  checkins: CheckinRow[]
  date: string
}

export function PresencasClient({ checkins, date }: Props) {
  const [search, setSearch] = useState('')

  const filtered = checkins.filter(c =>
    c.students?.name.toLowerCase().includes(search.toLowerCase())
  )

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  function initials(name: string) {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="pt-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Presenças</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Registro de check-ins</p>
        </div>
        <div className="flex items-center gap-2">
          <form method="GET" className="flex gap-2">
            <div className="relative">
              <CalendarDays size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="date"
                name="data"
                defaultValue={date}
                className="input-field pl-9 text-sm"
                onChange={e => e.currentTarget.form?.requestSubmit()}
              />
            </div>
          </form>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#dc2626]/10 flex items-center justify-center shrink-0">
            <Users size={18} className="text-[#dc2626]" />
          </div>
          <div>
            <p className="text-xs text-zinc-500">Total hoje</p>
            <p className="text-2xl font-bold">{checkins.length}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Clock size={18} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500">Último check-in</p>
            <p className="text-lg font-bold">
              {checkins.length > 0 ? formatTime(checkins[0].checked_at) : '--:--'}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Buscar aluno..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field pl-9 text-sm"
        />
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-zinc-500">
            <Users size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum check-in encontrado</p>
            <p className="text-xs mt-1">
              {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((c, i) => {
              const student = c.students
              const modality = student?.modalities
              return (
                <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                  <span className="text-xs text-zinc-600 w-5 text-right shrink-0">{i + 1}</span>
                  <div className="w-9 h-9 rounded-full bg-[#dc2626]/15 flex items-center justify-center shrink-0 text-xs font-bold text-[#dc2626]">
                    {student ? initials(student.name) : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{student?.name ?? 'Aluno removido'}</p>
                    {modality && (
                      <p className="text-xs truncate" style={{ color: modality.color }}>{modality.name}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Clock size={12} className="text-zinc-600" />
                    <span className="text-sm text-zinc-400 tabular-nums">{formatTime(c.checked_at)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
