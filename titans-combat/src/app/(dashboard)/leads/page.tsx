import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LeadsClient } from './LeadsClient'

export default async function LeadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
  const tenantId = profile?.tenant_id ?? ''

  const [{ data: leads }, { data: modalities }] = await Promise.all([
    supabase.from('leads').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
    supabase.from('modalities').select('id, name').eq('tenant_id', tenantId).eq('active', true).order('name'),
  ])

  return <LeadsClient leads={leads ?? []} modalities={modalities ?? []} tenantId={tenantId} />
}
