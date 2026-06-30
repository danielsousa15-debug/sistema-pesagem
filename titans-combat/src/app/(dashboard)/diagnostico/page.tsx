import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DiagnosticoClient } from './DiagnosticoClient'

export default async function DiagnosticoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
  const tenantId = profile?.tenant_id ?? ''
  const today = new Date().toISOString().split('T')[0]

  const [
    { count: totalStudents },
    { count: activeStudents },
    { count: semEmail },
    { count: semModalidade },
    { count: semPlano },
    { count: semWhatsapp },
    { count: statusNull },
    { count: experimentalAntigos },
    { count: totalCheckins },
    { count: checkinsHoje },
    { count: planosSemPreco },
    { count: modalidadesAtivas },
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'ativo'),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).or('email.is.null,email.eq.'),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).is('modality_id', null),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).is('plan_id', null),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).is('whatsapp', null),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).is('status', null),
    supabase.from('students').select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'experimental')
      .lte('enrollment_date', new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0]),
    supabase.from('checkins').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('checkins').select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('checked_at', today + 'T00:00:00')
      .lte('checked_at', today + 'T23:59:59'),
    supabase.from('plans').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('price', 0).eq('active', true),
    supabase.from('modalities').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('active', true),
  ])

  return (
    <DiagnosticoClient diag={{
      totalStudents: totalStudents ?? 0,
      activeStudents: activeStudents ?? 0,
      semEmail: semEmail ?? 0,
      semModalidade: semModalidade ?? 0,
      semPlano: semPlano ?? 0,
      semTelefone: 0,
      semWhatsapp: semWhatsapp ?? 0,
      statusNull: statusNull ?? 0,
      experimentalAntigos: experimentalAntigos ?? 0,
      totalCheckins: totalCheckins ?? 0,
      checkinsHoje: checkinsHoje ?? 0,
      planosSemPreco: planosSemPreco ?? 0,
      modalidadesAtivas: modalidadesAtivas ?? 0,
    }} />
  )
}
