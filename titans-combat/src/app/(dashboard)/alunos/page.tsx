import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StudentsClient } from './StudentsClient'

export default async function StudentsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  const { status, q } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
  const tenantId = profile?.tenant_id ?? ''

  let query = supabase
    .from('students')
    .select('id, name, photo_url, status, phone, whatsapp, email, modality_id, plan_id, enrollment_date, created_at, modalities(name, color), plans(name, price)')
    .eq('tenant_id', tenantId)
    .order('name')

  if (status) query = query.eq('status', status)
  if (q) query = query.ilike('name', `%${q}%`)

  const { data: students } = await query

  const { data: modalities } = await supabase.from('modalities').select('id, name, color').eq('tenant_id', tenantId).eq('active', true)

  return <StudentsClient students={students ?? []} modalities={modalities ?? []} initialStatus={status} initialSearch={q} />
}
