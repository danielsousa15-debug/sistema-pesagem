import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ModalidadesClient } from './ModalidadesClient'

export default async function ModalidadesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
  const tenantId = profile?.tenant_id ?? ''

  const { data: modalities } = await supabase
    .from('modalities')
    .select('*, students(count)')
    .eq('tenant_id', tenantId)
    .order('name')

  return <ModalidadesClient modalities={modalities ?? []} tenantId={tenantId} />
}
