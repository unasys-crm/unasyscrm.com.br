import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, LogIn, AlertCircle, UserPlus, CheckCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import toast from 'react-hot-toast'

const loginSchema = z.object({
  email: z.string().min(1, 'Email é obrigatório').email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória').min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [creatingDemoUser, setCreatingDemoUser] = useState(false)
  const [demoUserStatus, setDemoUserStatus] = useState<'none' | 'created' | 'confirmed'>('none')

  const from = location.state?.from?.pathname || '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const watchedValues = watch()
  
  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true)
      console.log('Login form submitted with:', data.email)
      
      await signIn(data.email, data.password)
      
      // Aguardar um pouco para garantir que a autenticação seja processada
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Verificar se realmente está autenticado antes de navegar
      const { data: session } = await supabase.auth.getSession()
      if (session.session) {
        console.log('Login successful, navigating to:', from)
        navigate(from, { replace: true })
      } else {
        console.error('Login failed: no session found')
        toast.error('Erro na autenticação. Tente novamente.')
      }
    } catch (error: any) {
      // Error handling is already done in AuthContext
    } finally {
      setLoading(false)
    }
  }

  // Demo login function
  const handleDemoLogin = () => {
    setValue('email', 'demo@unasyscrm.com.br')
    setValue('password', 'demo123456')
    // Trigger validation after setting values
    setTimeout(() => {
      const form = document.querySelector('form')
      if (form) {
        const event = new Event('input', { bubbles: true })
        form.querySelectorAll('input').forEach(input => input.dispatchEvent(event))
      }
    }, 100)
  }

  // Check if demo user exists and is confirmed
  const checkDemoUserStatus = async () => {
    try {
      // Try to sign in to check if user exists and is confirmed
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'demo@unasyscrm.com.br',
        password: 'demo123456',
      })

      if (!error && data.user) {
        // User exists and is confirmed
        await supabase.auth.signOut() // Sign out immediately
        setDemoUserStatus('confirmed')
        return 'confirmed'
      } else if (error?.message?.includes('Email not confirmed')) {
        // User exists but not confirmed
        setDemoUserStatus('created')
        return 'created'
      } else {
        // User doesn't exist
        setDemoUserStatus('none')
        return 'none'
      }
    } catch (error) {
      console.error('Error checking demo user status:', error)
      setDemoUserStatus('none')
      return 'none'
    }
  }

  // Attempt automatic login with demo credentials
  const attemptDemoLogin = async () => {
    try {
      console.log('Attempting automatic demo login...')
      
      // Use the signIn method from AuthContext for consistency
      await signIn('demo@unasyscrm.com.br', 'demo123456')
      
      // Wait a bit for authentication to process
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Check if login was successful
      const { data: session } = await supabase.auth.getSession()
      if (session.session) {
        console.log('Automatic demo login successful, navigating to dashboard')
        toast.success('Login automático realizado com sucesso!')
        navigate(from, { replace: true })
        return true
      } else {
        console.log('Automatic demo login failed - no session')
        return false
      }
    } catch (error: any) {
      console.log('Automatic demo login failed:', error.message)
      return false
    }
  }

  // Create demo user function with improved error handling and automatic login
  const createDemoUser = async () => {
    setCreatingDemoUser(true)
    try {
      console.log('Creating demo user...')
      
      // First check if user already exists
      const status = await checkDemoUserStatus()
      
      if (status === 'confirmed') {
        toast.success('Usuário demo já existe e está confirmado!')
        handleDemoLogin()
        
        // Attempt automatic login
        const loginSuccess = await attemptDemoLogin()
        if (!loginSuccess) {
          toast('Credenciais preenchidas. Clique em "Entrar" para fazer login.')
        }
        return
      }
      
      if (status === 'created') {
        toast.info('Usuário demo já existe. Tentando login automático...')
        handleDemoLogin()
        
        // Attempt automatic login
        const loginSuccess = await attemptDemoLogin()
        if (!loginSuccess) {
          toast('Usuário demo existe mas pode precisar de confirmação. Credenciais preenchidas - clique em "Entrar" para tentar o login.')
        }
        return
      }

      // Try to create the demo user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'demo@unasyscrm.com.br',
        password: 'demo123456',
        options: {
          data: {
            name: 'Usuário Demo',
          },
          emailRedirectTo: `${window.location.origin}/dashboard`
        },
      })

      if (signUpError) {
        if (signUpError.message?.includes('User already registered')) {
          // User already exists, check status again
          const newStatus = await checkDemoUserStatus()
          if (newStatus === 'confirmed') {
            toast.success('Usuário demo já existe e está funcionando!')
            handleDemoLogin()
            
            // Attempt automatic login
            const loginSuccess = await attemptDemoLogin()
            if (!loginSuccess) {
              toast('Credenciais preenchidas. Clique em "Entrar" para fazer login.')
            }
          } else {
            toast('Usuário demo já existe. Credenciais preenchidas - tente fazer login.')
            handleDemoLogin()
          }
          return
        } else if (signUpError.message?.includes('signup is disabled')) {
          toast.error('Cadastro está desabilitado no Supabase. Entre em contato com o administrador.')
          return
        } else {
          throw signUpError
        }
      }

      if (signUpData.user) {
        console.log('Demo user created successfully:', signUpData.user.email)
        
        // Fill in the form credentials
        handleDemoLogin()
        
        // Check if email confirmation is required
        if (signUpData.user.email_confirmed_at) {
          // User is already confirmed (email confirmation disabled)
          setDemoUserStatus('confirmed')
          toast.success('Usuário demo criado e confirmado automaticamente!')
          
          // Attempt automatic login
          const loginSuccess = await attemptDemoLogin()
          if (!loginSuccess) {
            toast('Credenciais preenchidas. Clique em "Entrar" para fazer login.')
          }
        } else {
          // Email confirmation required
          setDemoUserStatus('created')
          toast.success('Usuário demo criado! Tentando login automático...')
          
          // Wait a moment and try automatic login (sometimes works even without email confirmation)
          await new Promise(resolve => setTimeout(resolve, 2000))
          const loginSuccess = await attemptDemoLogin()
          
          if (!loginSuccess) {
            toast('Usuário demo criado. Se a confirmação de email estiver habilitada, verifique o email demo@unasyscrm.com.br. Caso contrário, clique em "Entrar" para fazer login.')
          }
        }
      } else {
        throw new Error('Falha ao criar usuário demo - nenhum usuário retornado')
      }

    } catch (error: any) {
      console.error('Error creating demo user:', error)
      let errorMessage = 'Erro ao criar usuário demo'
      
      if (error.message?.includes('signup is disabled')) {
        errorMessage = 'Cadastro está desabilitado no Supabase. Entre em contato com o administrador.'
      } else if (error.message?.includes('Email rate limit exceeded')) {
        errorMessage = 'Limite de tentativas excedido. Aguarde alguns minutos.'
      } else if (error.message?.includes('Invalid API key')) {
        errorMessage = 'Erro de configuração do Supabase. Verifique as variáveis de ambiente.'
      } else if (error.message) {
        errorMessage = `Erro: ${error.message}`
      }
      
      toast.error(errorMessage)
    } finally {
      setCreatingDemoUser(false)
    }
  }

  // Test connection function
  const testConnection = async () => {
    setTestingConnection(true)
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        toast.error(`Erro de conexão: ${error.message}`)
      } else {
        toast.success('Conexão com Supabase OK!')
        console.log('Connection test result:', data)
        
        // Also check demo user status
        await checkDemoUserStatus()
      }
    } catch (error: any) {
      toast.error(`Erro de conexão: ${error.message}`)
      console.error('Connection test error:', error)
    } finally {
      setTestingConnection(false)
    }
  }

  // Check demo user status on component mount
  React.useEffect(() => {
    checkDemoUserStatus()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary-600 flex items-center justify-center">
            <span className="text-white font-bold text-2xl">U</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Faça login em sua conta
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Ou{' '}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              crie uma nova conta
            </Link>
          </p>
        </div>

        {/* Demo Login Section */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start space-x-2 mb-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Demonstração do Sistema
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Para testar o sistema, clique em "Criar Usuário Demo" - o login será feito automaticamente:
              </p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-3 rounded border text-xs font-mono">
            <p><strong>Email:</strong> demo@unasyscrm.com.br</p>
            <p><strong>Senha:</strong> demo123456</p>
            {demoUserStatus !== 'none' && (
              <div className="mt-2 flex items-center space-x-1">
                <CheckCircle className={`h-3 w-3 ${demoUserStatus === 'confirmed' ? 'text-green-600' : 'text-yellow-600'}`} />
                <span className={`text-xs ${demoUserStatus === 'confirmed' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {demoUserStatus === 'confirmed' ? 'Usuário confirmado' : 'Usuário criado (pode precisar confirmar email)'}
                </span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-2 mt-3">
            <Button
              type="button"
              variant={demoUserStatus === 'confirmed' ? 'secondary' : 'primary'}
              onClick={createDemoUser}
              loading={creatingDemoUser}
              className="w-full text-sm"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {demoUserStatus === 'confirmed' ? '✓ Entrar como Demo' : 'Criar e Entrar como Demo'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleDemoLogin}
              className="w-full text-sm"
            >
              Apenas Preencher Credenciais
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={testConnection}
              loading={testingConnection}
              className="w-full text-xs"
            >
              Testar Conexão & Status
            </Button>
          </div>
        </div>

        {/* Debug info */}
        {import.meta.env.DEV && (
          <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs">
            <p>Debug - Valores atuais:</p>
            <p>Email: "{watchedValues.email}"</p>
            <p>Password: "{watchedValues.password}"</p>
            <p>Demo Status: {demoUserStatus}</p>
            <p>Errors: {JSON.stringify(errors)}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="Digite seu email"
              {...register('email')}
              error={errors.email?.message}
            />

            <div className="relative">
              <Input
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Digite sua senha"
                {...register('password')}
                error={errors.password?.message}
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Esqueceu sua senha?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            loading={loading}
            disabled={loading || !watchedValues.email || !watchedValues.password}
          >
            <LogIn className="mr-2 h-4 w-4" />
            Entrar
          </Button>
        </form>

        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © 2024 UnasyCRM. Todos os direitos reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage