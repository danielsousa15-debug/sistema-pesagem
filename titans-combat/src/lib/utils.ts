export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')
}

export function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return phone
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    ativo: 'Ativo',
    experimental: 'Experimental',
    afastado: 'Afastado',
    inadimplente: 'Inadimplente',
    cancelado: 'Cancelado',
    pendente: 'Pendente',
    pago: 'Pago',
    atrasado: 'Atrasado',
    novo: 'Novo',
    contatado: 'Contatado',
    agendado: 'Agendado',
    convertido: 'Convertido',
    perdido: 'Perdido',
  }
  return map[status] ?? status
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    ativo:        'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    experimental: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    afastado:     'bg-amber-500/15 text-amber-400 border-amber-500/20',
    inadimplente: 'bg-red-500/15 text-red-400 border-red-500/20',
    cancelado:    'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
    pendente:     'bg-amber-500/15 text-amber-400 border-amber-500/20',
    pago:         'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    atrasado:     'bg-red-500/15 text-red-400 border-red-500/20',
    novo:         'bg-blue-500/15 text-blue-400 border-blue-500/20',
    contatado:    'bg-purple-500/15 text-purple-400 border-purple-500/20',
    agendado:     'bg-amber-500/15 text-amber-400 border-amber-500/20',
    convertido:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    perdido:      'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
  }
  return map[status] ?? 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20'
}

export function calcAge(birthDate: string): number {
  const dob = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return age
}
