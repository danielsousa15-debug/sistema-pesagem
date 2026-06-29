import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FinanceiroClient } from './FinanceiroClient'

export default async function FinanceiroPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; mes?: string }>
}) {
  const { status, mes } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
  const tenantId = profile?.tenant_id ?? ''

  const today = new Date()
  const mesRef = mes ?? `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  const [year, month] = mesRef.split('-').map(Number)
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]

  let query = supabase
    .from('payments')
    .select('*, students(id, name, phone, whatsapp)')
    .eq('tenant_id', tenantId)
    .gte('due_date', startDate)
    .lte('due_date', endDate)
    .order('due_date', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data: payments } = await query

  const { data: students } = await supabase
    .from('students')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .eq('status', 'ativo')
    .order('name')

  return (
    <FinanceiroClient
      payments={payments ?? []}
      students={students ?? []}
      tenantId={tenantId}
      mesRef={mesRef}
      initialStatus={status}
    />
  )
}
