export type StudentStatus = 'ativo' | 'experimental' | 'afastado' | 'inadimplente' | 'cancelado'
export type PaymentStatus = 'pendente' | 'pago' | 'atrasado' | 'cancelado'
export type LeadStatus = 'novo' | 'contatado' | 'agendado' | 'convertido' | 'perdido'

export interface Tenant {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface Profile {
  id: string
  tenant_id: string
  role: 'admin' | 'recepcao' | 'aluno'
  name: string
  created_at: string
}

export interface Modality {
  id: string
  tenant_id: string
  name: string
  description?: string
  color: string
  active: boolean
  created_at: string
}

export interface Teacher {
  id: string
  tenant_id: string
  name: string
  cpf?: string
  phone?: string
  email?: string
  specialty?: string
  active: boolean
  created_at: string
}

export interface Plan {
  id: string
  tenant_id: string
  name: string
  price: number
  validity_days: number
  class_limit?: number
  unlimited: boolean
  benefits?: string[]
  color: string
  active: boolean
  created_at: string
}

export interface StudentAddress {
  street?: string
  number?: string
  neighborhood?: string
  city?: string
  state?: string
  zip?: string
}

export interface Student {
  id: string
  tenant_id: string
  user_id?: string
  photo_url?: string
  name: string
  cpf?: string
  birth_date?: string
  gender?: 'M' | 'F' | 'outro'
  phone?: string
  whatsapp?: string
  email?: string
  address?: StudentAddress
  emergency_contact?: string
  emergency_phone?: string
  responsible_name?: string
  responsible_cpf?: string
  modality_id?: string
  teacher_id?: string
  plan_id?: string
  enrollment_date?: string
  status: StudentStatus
  notes?: string
  created_at: string
  updated_at: string
  // Joins
  modalities?: Modality
  teachers?: Teacher
  plans?: Plan
}

export interface Enrollment {
  id: string
  student_id: string
  plan_id: string
  start_date: string
  end_date?: string
  status: 'active' | 'expired' | 'cancelled'
  created_at: string
}

export interface Payment {
  id: string
  tenant_id: string
  student_id: string
  enrollment_id?: string
  amount: number
  due_date: string
  paid_date?: string
  payment_method?: 'pix' | 'dinheiro' | 'cartao' | 'transferencia'
  status: PaymentStatus
  notes?: string
  created_at: string
  // Joins
  students?: Pick<Student, 'id' | 'name' | 'phone'>
}

export interface Checkin {
  id: string
  student_id: string
  tenant_id: string
  checked_at: string
  device_info?: string
  browser_info?: string
  // Joins
  students?: Pick<Student, 'id' | 'name' | 'photo_url'>
}

export interface Lead {
  id: string
  tenant_id: string
  name: string
  phone?: string
  email?: string
  modality_interest?: string
  source?: string
  status: LeadStatus
  notes?: string
  created_at: string
}

export interface DashboardStats {
  total_active: number
  present_today: number
  present_week: number
  present_month: number
  revenue_expected: number
  revenue_received: number
  revenue_overdue: number
  total_overdue_students: number
  absent_7days: number
  absent_15days: number
  absent_30days: number
  new_students_month: number
  cancellations_month: number
  total_leads: number
}
