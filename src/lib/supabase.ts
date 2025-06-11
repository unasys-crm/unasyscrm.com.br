import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

// Debug environment variables
console.log('Environment check:', {
  NODE_ENV: import.meta.env.MODE,
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY_EXISTS: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
  ALL_ENV_VARS: Object.keys(import.meta.env)
})

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

console.log('Supabase Configuration:', {
  url: supabaseUrl,
  anonKeyPresent: !!supabaseAnonKey,
  anonKeyLength: supabaseAnonKey?.length || 0
})

if (!supabaseUrl || !supabaseAnonKey) {
  const missingVars = []
  if (!supabaseUrl) missingVars.push('VITE_SUPABASE_URL')
  if (!supabaseAnonKey) missingVars.push('VITE_SUPABASE_ANON_KEY')
  
  throw new Error(`Missing Supabase environment variables: ${missingVars.join(', ')}`)
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: import.meta.env.DEV
  }
})

// Test connection
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('Supabase connection error:', error)
  } else {
    console.log('Supabase connected successfully', {
      hasSession: !!data.session,
      userEmail: data.session?.user?.email
    })
  }
})

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error)
  
  if (error?.message) {
    return error.message
  }
  
  if (error?.error_description) {
    return error.error_description
  }
  
  return 'Ocorreu um erro inesperado. Tente novamente.'
}

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return !!session
}

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Helper function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}