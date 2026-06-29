import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfessoresClient } from './ProfessoresClient'

export default async function ProfessoresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
  const tenantId = profile?.tenant_id ?? ''

  const { data: teachers } = await supabase
    .from('teachers')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name')

  return <ProfessoresClient teachers={teachers ?? []} tenantId={tenantId} />
}
