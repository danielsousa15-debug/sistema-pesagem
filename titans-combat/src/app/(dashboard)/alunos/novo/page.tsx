import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StudentForm } from '../StudentForm'

export default async function NewStudentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
  const tenantId = profile?.tenant_id ?? ''

  const [{ data: modalities }, { data: teachers }, { data: plans }] = await Promise.all([
    supabase.from('modalities').select('id, name, color').eq('tenant_id', tenantId).eq('active', true).order('name'),
    supabase.from('teachers').select('id, name').eq('tenant_id', tenantId).eq('active', true).order('name'),
    supabase.from('plans').select('id, name, price').eq('tenant_id', tenantId).eq('active', true).order('name'),
  ])

  return (
    <StudentForm
      tenantId={tenantId}
      modalities={modalities ?? []}
      teachers={teachers ?? []}
      plans={plans ?? []}
    />
  )
}
