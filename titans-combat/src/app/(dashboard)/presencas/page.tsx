import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PresencasClient } from './PresencasClient'

export default async function PresencasPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>
}) {
  const { data: dateParam } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
  const tenantId = profile?.tenant_id ?? ''

  const today = new Date().toISOString().split('T')[0]
  const date = dateParam ?? today

  const { data: checkins } = await supabase
    .from('checkins')
    .select('id, checked_at, students(name, photo_url, modalities(name, color))')
    .eq('tenant_id', tenantId)
    .gte('checked_at', date + 'T00:00:00')
    .lte('checked_at', date + 'T23:59:59')
    .order('checked_at', { ascending: false })

  return <PresencasClient checkins={checkins ?? []} date={date} />
}
