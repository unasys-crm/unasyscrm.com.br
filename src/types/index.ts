export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  name: string
  email: string
  phone?: string
  document?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  plan: 'basic' | 'professional' | 'enterprise'
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  settings?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  user_id: string
  company_id: string
  role: 'admin' | 'manager' | 'user' | 'viewer'
  permissions?: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
  company?: Company
}

export interface Client {
  id: string
  company_id: string
  type: 'individual' | 'company'
  name: string
  email?: string
  phone?: string
  document?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  category?: string
  status: 'active' | 'inactive' | 'prospect'
  notes?: string
  custom_fields?: Record<string, any>
  created_by: string
  created_at: string
  updated_at: string
}

export interface ProposalItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  total: number
}

export interface Proposal {
  id: string
  company_id: string
  client_id: string
  title: string
  description?: string
  status: 'draft' | 'sent' | 'viewed' | 'approved' | 'rejected' | 'expired'
  total_amount: number
  discount?: number
  items: ProposalItem[]
  valid_until?: string
  notes?: string
  created_by: string
  created_at: string
  updated_at: string
  client?: Client
}

export interface Task {
  id: string
  company_id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to?: string
  due_date?: string
  client_id?: string
  proposal_id?: string
  created_by: string
  created_at: string
  updated_at: string
  client?: Client
  proposal?: Proposal
}

export interface Notification {
  id: string
  user_id: string
  company_id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  is_read: boolean
  data?: Record<string, any>
  created_at: string
}

export interface DashboardStats {
  total_clients: number
  active_clients: number
  total_proposals: number
  approved_proposals: number
  total_tasks: number
  completed_tasks: number
  pending_tasks: number
  overdue_tasks: number
}

export interface Permission {
  module: string
  actions: {
    create: boolean
    read: boolean
    update: boolean
    delete: boolean
  }
}

export interface Theme {
  mode: 'light' | 'dark'
  primaryColor: string
  secondaryColor: string
}

export interface CompanySettings {
  theme: Theme
  modules: {
    clients: boolean
    proposals: boolean
    sales: boolean
    tasks: boolean
    messages: boolean
    reports: boolean
    integrations: boolean
  }
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
  integrations: {
    asaas: {
      enabled: boolean
      api_key?: string
      environment: 'sandbox' | 'production'
    }
    whatsapp: {
      enabled: boolean
      api_key?: string
    }
    email: {
      enabled: boolean
      smtp_host?: string
      smtp_port?: number
      smtp_user?: string
      smtp_password?: string
    }
  }
}

export interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}