export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          document: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          plan: 'basic' | 'professional' | 'enterprise'
          status: 'active' | 'inactive' | 'pending' | 'suspended'
          settings: Record<string, any> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          document?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          plan?: 'basic' | 'professional' | 'enterprise'
          status?: 'active' | 'inactive' | 'pending' | 'suspended'
          settings?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          document?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          plan?: 'basic' | 'professional' | 'enterprise'
          status?: 'active' | 'inactive' | 'pending' | 'suspended'
          settings?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          company_id: string
          role: 'admin' | 'manager' | 'user' | 'viewer'
          permissions: Record<string, any> | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_id: string
          role?: 'admin' | 'manager' | 'user' | 'viewer'
          permissions?: Record<string, any> | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_id?: string
          role?: 'admin' | 'manager' | 'user' | 'viewer'
          permissions?: Record<string, any> | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          company_id: string
          type: 'individual' | 'company'
          name: string
          email: string | null
          phone: string | null
          document: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          category: string | null
          status: 'active' | 'inactive' | 'prospect'
          notes: string | null
          custom_fields: Record<string, any> | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          type: 'individual' | 'company'
          name: string
          email?: string | null
          phone?: string | null
          document?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          category?: string | null
          status?: 'active' | 'inactive' | 'prospect'
          notes?: string | null
          custom_fields?: Record<string, any> | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          type?: 'individual' | 'company'
          name?: string
          email?: string | null
          phone?: string | null
          document?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          category?: string | null
          status?: 'active' | 'inactive' | 'prospect'
          notes?: string | null
          custom_fields?: Record<string, any> | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      proposals: {
        Row: {
          id: string
          company_id: string
          client_id: string
          title: string
          description: string | null
          status: 'draft' | 'sent' | 'viewed' | 'approved' | 'rejected' | 'expired'
          total_amount: number
          discount: number | null
          items: Record<string, any>[]
          valid_until: string | null
          notes: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          client_id: string
          title: string
          description?: string | null
          status?: 'draft' | 'sent' | 'viewed' | 'approved' | 'rejected' | 'expired'
          total_amount: number
          discount?: number | null
          items: Record<string, any>[]
          valid_until?: string | null
          notes?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          client_id?: string
          title?: string
          description?: string | null
          status?: 'draft' | 'sent' | 'viewed' | 'approved' | 'rejected' | 'expired'
          total_amount?: number
          discount?: number | null
          items?: Record<string, any>[]
          valid_until?: string | null
          notes?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          company_id: string
          title: string
          description: string | null
          status: 'todo' | 'in_progress' | 'review' | 'done'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          assigned_to: string | null
          due_date: string | null
          client_id: string | null
          proposal_id: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          title: string
          description?: string | null
          status?: 'todo' | 'in_progress' | 'review' | 'done'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          assigned_to?: string | null
          due_date?: string | null
          client_id?: string | null
          proposal_id?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          title?: string
          description?: string | null
          status?: 'todo' | 'in_progress' | 'review' | 'done'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          assigned_to?: string | null
          due_date?: string | null
          client_id?: string | null
          proposal_id?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          company_id: string
          type: 'info' | 'success' | 'warning' | 'error'
          title: string
          message: string
          is_read: boolean
          data: Record<string, any> | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_id: string
          type: 'info' | 'success' | 'warning' | 'error'
          title: string
          message: string
          is_read?: boolean
          data?: Record<string, any> | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_id?: string
          type?: 'info' | 'success' | 'warning' | 'error'
          title?: string
          message?: string
          is_read?: boolean
          data?: Record<string, any> | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}