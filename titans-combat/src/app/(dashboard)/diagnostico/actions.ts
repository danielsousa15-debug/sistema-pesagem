'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function getTenantId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
  return { supabase, tenantId: profile?.tenant_id ?? '' }
}

export async function fixStudentsWithoutStatus() {
  const { supabase, tenantId } = await getTenantId()
  await supabase.from('students').update({ status: 'ativo' }).eq('tenant_id', tenantId).is('status', null)
  revalidatePath('/diagnostico')
}

export async function fixExperimentalOlderThan30Days() {
  const { supabase, tenantId } = await getTenantId()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  await supabase
    .from('students')
    .update({ status: 'ativo' })
    .eq('tenant_id', tenantId)
    .eq('status', 'experimental')
    .lte('enrollment_date', cutoff.toISOString().split('T')[0])
  revalidatePath('/diagnostico')
}

export async function fixStudentsWhatsappFromPhone() {
  const { supabase, tenantId } = await getTenantId()
  const { data: students } = await supabase
    .from('students')
    .select('id, phone')
    .eq('tenant_id', tenantId)
    .is('whatsapp', null)
    .not('phone', 'is', null)
  if (students && students.length > 0) {
    for (const s of students) {
      await supabase.from('students').update({ whatsapp: s.phone }).eq('id', s.id)
    }
  }
  revalidatePath('/diagnostico')
}
