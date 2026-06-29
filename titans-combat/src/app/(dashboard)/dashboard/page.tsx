import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './DashboardClient'
import { redirect } from 'next/navigation'

async function getDashboardStats(tenantId: string) {
  const supabase = await createClient()
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 7)
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  const day15ago = new Date(today); day15ago.setDate(today.getDate() - 15)
  const day30ago = new Date(today); day30ago.setDate(today.getDate() - 30)

  const [
    { count: totalActive },
    { count: presentToday },
    { count: presentWeek },
    { count: presentMonth },
    { data: paymentsData },
    { count: absent7 },
    { count: absent15 },
    { count: absent30 },
    { count: newStudents },
    { count: cancellations },
    { count: totalLeads },
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId).eq('status', 'ativo'),
    supabase.from('checkins').select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId).gte('checked_at', todayStr),
    supabase.from('checkins').select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId).gte('checked_at', weekAgo.toISOString()),
    supabase.from('checkins').select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId).gte('checked_at', monthStart),
    supabase.from('payments').select('amount, status')
      .eq('tenant_id', tenantId).gte('due_date', monthStart),
    supabase.from('students').select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId).eq('status', 'ativo')
      .lt('id', 'zz')
      .not('id', 'in',
        `(select distinct student_id from checkins where tenant_id='${tenantId}' and checked_at >= '${weekAgo.toISOString()}')`
      ),
    supabase.from('students').select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId).eq('status', 'ativo')
      .not('id', 'in',
        `(select distinct student_id from checkins where tenant_id='${tenantId}' and checked_at >= '${day15ago.toISOString()}')`
      ),
    supabase.from('students').select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId).eq('status', 'ativo')
      .not('id', 'in',
        `(select distinct student_id from checkins where tenant_id='${tenantId}' and checked_at >= '${day30ago.toISOString()}')`
      ),
    supabase.from('students').select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId).gte('created_at', monthStart),
    supabase.from('students').select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId).eq('status', 'cancelado').gte('updated_at', monthStart),
    supabase.from('leads').select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId).in('status', ['novo', 'contatado', 'agendado']),
  ])

  const payments = paymentsData || []
  const revenueExpected = payments.reduce((s, p) => s + Number(p.amount), 0)
  const revenueReceived = payments.filter(p => p.status === 'pago').reduce((s, p) => s + Number(p.amount), 0)
  const revenueOverdue = payments.filter(p => p.status === 'atrasado').reduce((s, p) => s + Number(p.amount), 0)
  const overdueStudents = payments.filter(p => p.status === 'atrasado').length

  return {
    total_active: totalActive ?? 0,
    present_today: presentToday ?? 0,
    present_week: presentWeek ?? 0,
    present_month: presentMonth ?? 0,
    revenue_expected: revenueExpected,
    revenue_received: revenueReceived,
    revenue_overdue: revenueOverdue,
    total_overdue_students: overdueStudents,
    absent_7days: absent7 ?? 0,
    absent_15days: absent15 ?? 0,
    absent_30days: absent30 ?? 0,
    new_students_month: newStudents ?? 0,
    cancellations_month: cancellations ?? 0,
    total_leads: totalLeads ?? 0,
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
  const tenantId = profile?.tenant_id ?? ''

  const stats = tenantId ? await getDashboardStats(tenantId) : null

  // Recent checkins
  const { data: recentCheckins } = tenantId ? await supabase
    .from('checkins')
    .select('id, checked_at, students(id, name, photo_url)')
    .eq('tenant_id', tenantId)
    .order('checked_at', { ascending: false })
    .limit(10) : { data: [] }

  return <DashboardClient stats={stats} recentCheckins={recentCheckins ?? []} />
}
