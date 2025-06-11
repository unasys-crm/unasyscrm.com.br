import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { AuthContextType } from '../types'
import toast from 'react-hot-toast'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (mounted) {
        if (error) {
          console.error('Error getting session:', error)
        }
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', {
        event,
        userEmail: session?.user?.email,
        userId: session?.user?.id,
        sessionExists: !!session
      })
      
      if (mounted) {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        if (event === 'SIGNED_IN') {
          console.log('User signed in successfully:', session?.user?.email)
          toast.success('Login realizado com sucesso!')
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out')
          toast.success('Logout realizado com sucesso!')
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      console.log('Attempting to sign in with:', email)
      
      // Verificar se os campos estão preenchidos e válidos
      if (!email?.trim() || !password?.trim()) {
        throw new Error('Email e senha são obrigatórios')
      }
      
      if (email.trim().length < 3) {
        throw new Error('Email deve ter pelo menos 3 caracteres')
      }
      
      if (password.trim().length < 6) {
        throw new Error('Senha deve ter pelo menos 6 caracteres')
      }
      
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      })

      if (error) {
        console.error('Sign in error:', error)
        throw error
      }
      
      console.log('Sign in successful')
      
      // Aguardar um pouco para garantir que a sessão seja estabelecida
      await new Promise(resolve => setTimeout(resolve, 500))
      
    } catch (error: any) {
      console.error('Sign in error:', error)
      
      // Enhanced error message translation
      let errorMessage = 'Erro ao fazer login'
      
      if (error.message?.includes('Invalid login credentials')) {
        if (email === 'demo@unasyscrm.com.br') {
          errorMessage = 'Usuário demo não encontrado ou não confirmado. Use o botão "Criar Usuário Demo" para configurá-lo ou verifique se o email foi confirmado.'
        } else {
          errorMessage = 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.'
        }
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Email não confirmado. Verifique sua caixa de entrada ou use o usuário demo.'
      } else if (error.message?.includes('Email rate limit exceeded')) {
        errorMessage = 'Muitas tentativas de login. Aguarde alguns minutos.'
      } else if (error.message?.includes('obrigatório')) {
        errorMessage = error.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true)
      console.log('Attempting to sign up with:', email)
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`
        },
      })

      if (error) {
        console.error('Sign up error:', error)
        throw error
      }

      toast.success('Conta criada com sucesso!')
    } catch (error: any) {
      console.error('Sign up error:', error)
      
      let errorMessage = 'Erro ao criar conta'
      if (error.message?.includes('User already registered')) {
        errorMessage = 'Este email já está cadastrado'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      console.log('Attempting to sign out')
      
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('Sign out error:', error)
        throw error
      }
      
      console.log('Sign out successful')
    } catch (error: any) {
      console.error('Sign out error:', error)
      toast.error(error.message || 'Erro ao fazer logout')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      console.log('Attempting to reset password for:', email)
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        console.error('Reset password error:', error)
        throw error
      }

      toast.success('Email de recuperação enviado!')
    } catch (error: any) {
      console.error('Reset password error:', error)
      toast.error(error.message || 'Erro ao enviar email de recuperação')
      throw error
    }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}