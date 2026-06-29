import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { StudentDetail } from './StudentDetail'

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
  const tenantId = profile?.tenant_id ?? ''

  const { data: student } = await supabase
    .from('students')
    .select('*, modalities(id, name, color), teachers(id, name), plans(id, name, price, validity_days)')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (!student) notFound()

  const [{ data: checkins }, { data: payments }, { data: modalities }, { data: teachers }, { data: plans }] = await Promise.all([
    supabase.from('checkins').select('id, checked_at').eq('student_id', id).order('checked_at', { ascending: false }).limit(20),
    supabase.from('payments').select('*').eq('student_id', id).order('due_date', { ascending: false }).limit(12),
    supabase.from('modalities').select('id, name, color').eq('tenant_id', tenantId).eq('active', true).order('name'),
    supabase.from('teachers').select('id, name').eq('tenant_id', tenantId).eq('active', true).order('name'),
    supabase.from('plans').select('id, name, price').eq('tenant_id', tenantId).eq('active', true).order('name'),
  ])

  return (
    <StudentDetail
      student={student}
      checkins={checkins ?? []}
      payments={payments ?? []}
      tenantId={tenantId}
      modalities={modalities ?? []}
      teachers={teachers ?? []}
      plans={plans ?? []}
    />
  )
}
