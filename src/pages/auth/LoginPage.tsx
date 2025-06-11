import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, LogIn, AlertCircle, UserPlus, CheckCircle, RefreshCw, Database, ExternalLink } from 'lucide-react'
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
  const [checkingDemoUser, setCheckingDemoUser] = useState(false)
  const [demoUserStatus, setDemoUserStatus] = useState<'none' | 'created' | 'confirmed' | 'checking'>('none')
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown')
  const [showTroubleshooting, setShowTroubleshooting] = useState(false)

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
      
      // Special handling for demo user login attempts
      if (data.email.trim() === 'demo@unasyscrm.com.br') {
        console.log('Demo user login attempt detected')
        
        // Check demo user status before attempting login
        const status = await checkDemoUserStatus()
        
        if (status === 'none') {
          toast.error('❌ Usuário demo não existe!')
          toast.info('💡 Clique em "Criar Usuário Demo" primeiro')
          setShowTroubleshooting(true)
          return
        } else if (status === 'created') {
          toast.error('⚠️ Email do usuário demo não confirmado!')
          toast.info('💡 Vá para Supabase Dashboard → Authentication → Users')
          toast.info('📧 Confirme o email do usuário demo@unasyscrm.com.br')
          setShowTroubleshooting(true)
          return
        }
      }
      
      await signIn(data.email, data.password)
      
      // Wait a bit to ensure authentication is processed before checking session
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Verify authentication before navigating
      const { data: session } = await supabase.auth.getSession()
      if (session.session) {
        console.log('Login successful, navigating to:', from)
        navigate(from, { replace: true })
      } else {
        console.error('Login failed: no session found')
        toast.error('Erro na autenticação. Tente novamente.')
      }
    } catch (error: any) {
      // Enhanced error handling for demo user
      if (data.email?.trim() === 'demo@unasyscrm.com.br' && 
          error.message?.includes('Invalid login credentials')) {
        // Don't show additional error - AuthContext already handled it
        console.log('Demo user login failed - showing troubleshooting')
        setShowTroubleshooting(true)
        
        // Auto-check demo user status to provide current info
        setTimeout(() => {
          checkDemoUserStatus()
        }, 1000)
        return
      }
      
      // Only log and handle non-credential errors
      if (error && !error.message?.includes('Invalid login credentials')) {
        console.error('Login error:', error)
        toast.error(error.message || 'Erro inesperado durante o login')
      }
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
    setCheckingDemoUser(true)
    setDemoUserStatus('checking')
    
    try {
      console.log('Checking demo user status...')
      
      // Try to sign in to check if user exists and is confirmed
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'demo@unasyscrm.com.br',
        password: 'demo123456',
      })

      if (!error && data.user) {
        // User exists and login successful
        await supabase.auth.signOut() // Sign out immediately
        setDemoUserStatus('confirmed')
        console.log('Demo user exists and is confirmed')
        return 'confirmed'
      } else if (error?.message?.includes('Email not confirmed')) {
        // User exists but email not confirmed
        setDemoUserStatus('created')
        console.log('Demo user exists but email not confirmed')
        return 'created'
      } else if (error?.message?.includes('Email logins are disabled') || 
                 error?.message?.includes('email_provider_disabled')) {
        // Email authentication is disabled in Supabase
        // User exists but email not confirmed
        setDemoUserStatus('created')
        console.log('Demo user exists but email not confirmed')
        return 'created'
      } else if (error?.message?.includes('Invalid login credentials')) {
        // User doesn't exist
        setDemoUserStatus('none')
        console.log('Demo user does not exist')
        return 'none'
      } else {
        // Other error
        console.error('Error checking demo user status:', error)
        setDemoUserStatus('none')
        return 'none'
      }
    } catch (error) {
      console.error('Error checking demo user status:', error)
      setDemoUserStatus('none')
      return 'none'
    } finally {
      setCheckingDemoUser(false)
    }
  }

  // Create demo user function with improved error handling
  const createDemoUser = async () => {
    setCreatingDemoUser(true)
    try {
      console.log('Creating demo user...')
      
      // First check current status
      const currentStatus = await checkDemoUserStatus()
      
      if (currentStatus === 'confirmed') {
        toast.success('Usuário demo já existe e está confirmado!')
        handleDemoLogin()
        setTimeout(() => {
          toast.info('✅ Credenciais preenchidas. Clique em "Entrar" para fazer login.')
        }, 1000)
        return
      }

      // Try to create the demo user
      console.log('Attempting to create demo user...')
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'demo@unasyscrm.com.br',
        password: 'demo123456',
        options: {
          data: {
            name: 'Usuário Demo',
          }
        },
      })

      if (signUpError) {
        console.error('Sign up error:', signUpError)
        
        if (signUpError.message?.includes('User already registered')) {
          // User already exists, check status again
          const status = await checkDemoUserStatus()
          if (status === 'confirmed') {
            toast.success('Usuário demo já existe e está confirmado!')
            handleDemoLogin()
            setTimeout(() => {
              toast.info('✅ Credenciais preenchidas. Clique em "Entrar" para fazer login.')
            }, 1000)
          } else if (status === 'created') {
            toast.warning('Usuário demo já existe mas precisa de confirmação de email.')
            toast.info('Vá para o Supabase Dashboard > Authentication > Users e confirme o email do usuário demo@unasyscrm.com.br')
            handleDemoLogin()
            setShowTroubleshooting(true)
          } else {
            toast.info('Usuário demo já existe. Credenciais preenchidas para login.')
            handleDemoLogin()
          }
          return
        } else if (signUpError.message?.includes('Email logins are disabled') || 
                   signUpError.message?.includes('email_provider_disabled')) {
          toast.error('❌ Autenticação por email está desabilitada no Supabase!')
          toast.info('💡 Vá para Supabase Dashboard > Authentication > Providers')
          toast.info('📧 Habilite o provedor "Email" para usar login com email/senha')
          setShowTroubleshooting(true)
          return
        } else if (signUpError.message?.includes('Signup is disabled')) {
          toast.error('Cadastro está desabilitado no Supabase.')
          toast.info('Vá para Supabase Dashboard > Authentication > Settings e habilite "Enable email confirmations" ou desabilite "Confirm email" para testes.')
          setShowTroubleshooting(true)
          return
        } else {
          throw signUpError
        }
      }

      if (signUpData.user) {
        console.log('Demo user created successfully:', signUpData.user.email)
        
        // Fill in the form credentials
        handleDemoLogin()
        
        // Check if user was auto-confirmed
        if (signUpData.user.email_confirmed_at) {
          setDemoUserStatus('confirmed')
          toast.success('Usuário demo criado e confirmado automaticamente!')
          setTimeout(() => {
            toast.info('✅ Credenciais preenchidas - clique em "Entrar" para fazer login.')
          }, 1000)
        } else {
          setDemoUserStatus('created')
          toast.success('Usuário demo criado!')
          toast.warning('Email precisa ser confirmado. Vá para Supabase Dashboard > Authentication > Users e confirme o email.')
          toast.info('Ou desabilite "Confirm email" em Authentication > Settings para testes.')
          setShowTroubleshooting(true)
        }
      } else {
        throw new Error('Falha ao criar usuário demo - nenhum usuário retornado')
      }

    } catch (error: any) {
      console.error('Error creating demo user:', error)
      let errorMessage = 'Erro ao criar usuário demo'
      
      if (error.message?.includes('Signup is disabled')) {
        errorMessage = 'Cadastro desabilitado. Habilite em Supabase Dashboard > Authentication > Settings.'
      } else if (error.message?.includes('Email rate limit exceeded')) {
        errorMessage = 'Limite de tentativas excedido. Aguarde alguns minutos.'
      } else if (error.message?.includes('Invalid API key')) {
        errorMessage = 'Erro de configuração do Supabase. Verifique as variáveis de ambiente.'
      } else if (error.message) {
        errorMessage = `Erro: ${error.message}`
      }
      
      toast.error(errorMessage)
      setShowTroubleshooting(true)
    } finally {
      setCreatingDemoUser(false)
    }
  }

  // Test connection function with enhanced diagnostics
  const testConnection = async () => {
    setTestingConnection(true)
    try {
      console.log('Testing Supabase connection...')
      
      // Check environment variables
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey) {
        toast.error('Variáveis de ambiente do Supabase não configuradas!')
        setConnectionStatus('error')
        return
      }
      
      // Test basic connection
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        toast.error(`Erro de conexão: ${error.message}`)
        setConnectionStatus('error')
        return
      }
      
      // Test if we can reach the auth endpoint
      try {
        const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        })
        
        if (response.ok) {
          const settings = await response.json()
          toast.success('Conexão com Supabase OK!')
          console.log('Connection test successful', settings)
          setConnectionStatus('connected')
          
          // Check demo user status after successful connection
          const status = await checkDemoUserStatus()
          const statusText = status === 'confirmed' ? 'Confirmado ✅' : 
                           status === 'created' ? 'Criado (precisa confirmar) ⚠️' : 
                           'Não existe ❌'
          toast.info(`Status do usuário demo: ${statusText}`)
          
          // Show additional info about email confirmation settings
          if (settings.external_email_enabled === false) {
            toast.info('Confirmação de email está desabilitada - usuários são auto-confirmados')
          }
        } else {
          const errorText = await response.text()
          toast.error(`Erro na API do Supabase: ${response.status} - ${errorText}`)
          setConnectionStatus('error')
        }
      } catch (fetchError) {
        toast.error('Erro ao conectar com a API do Supabase')
        console.error('Fetch error:', fetchError)
        setConnectionStatus('error')
      }
      
    } catch (error: any) {
      toast.error(`Erro de conexão: ${error.message}`)
      console.error('Connection test error:', error)
      setConnectionStatus('error')
    } finally {
      setTestingConnection(false)
    }
  }

  // Check demo user status on component mount
  React.useEffect(() => {
    // Small delay to avoid overwhelming the API
    const timer = setTimeout(() => {
      checkDemoUserStatus()
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])

  const getDemoStatusColor = () => {
    switch (demoUserStatus) {
      case 'confirmed': return 'text-green-600'
      case 'created': return 'text-yellow-600'
      case 'checking': return 'text-blue-600'
      default: return 'text-red-600'
    }
  }

  const getDemoStatusText = () => {
    switch (demoUserStatus) {
      case 'confirmed': return 'Usuário confirmado e pronto para login ✅'
      case 'created': return 'Usuário existe (precisa confirmar email) ⚠️'
      case 'checking': return 'Verificando status...'
      default: return 'Usuário não encontrado - precisa ser criado ❌'
    }
  }

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const openSupabaseDashboard = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (supabaseUrl) {
      const dashboardUrl = supabaseUrl.replace('.supabase.co', '.supabase.co').replace('//', '//app.supabase.com/project/')
      const projectId = supabaseUrl.split('//')[1].split('.')[0]
      window.open(`https://app.supabase.com/project/${projectId}/auth/users`, '_blank')
    } else {
      window.open('https://app.supabase.com', '_blank')
    }
  }

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

        {/* Connection Status */}
        {connectionStatus !== 'unknown' && (
          <div className={`text-center text-sm ${getConnectionStatusColor()}`}>
            <Database className="inline h-4 w-4 mr-1" />
            {connectionStatus === 'connected' ? 'Conectado ao Supabase' : 'Erro de conexão'}
          </div>
        )}

        {/* Demo Login Section */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start space-x-2 mb-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Demonstração do Sistema
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Para testar o sistema, use as credenciais demo. Se o usuário não existir, crie-o primeiro:
              </p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-3 rounded border text-xs font-mono">
            <p><strong>Email:</strong> demo@unasyscrm.com.br</p>
            <p><strong>Senha:</strong> demo123456</p>
            <div className="mt-2 flex items-center space-x-1">
              {demoUserStatus === 'checking' ? (
                <RefreshCw className="h-3 w-3 text-blue-600 animate-spin" />
              ) : (
                <CheckCircle className={`h-3 w-3 ${getDemoStatusColor()}`} />
              )}
              <span className={`text-xs ${getDemoStatusColor()}`}>
                {getDemoStatusText()}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-2 mt-3">
            {demoUserStatus === 'confirmed' ? (
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  handleDemoLogin()
                  setTimeout(() => {
                    toast.info('✅ Credenciais preenchidas. Clique em "Entrar" para fazer login.')
                  }, 500)
                }}
                className="w-full text-sm"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Preencher Credenciais Demo
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                onClick={createDemoUser}
                loading={creatingDemoUser}
                className="w-full text-sm"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Criar Usuário Demo
              </Button>
            )}
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={handleDemoLogin}
                className="w-full text-sm"
              >
                Preencher Credenciais
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={checkDemoUserStatus}
                loading={checkingDemoUser}
                className="w-full text-sm"
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                Verificar Status
              </Button>
            </div>
            
            <Button
              type="button"
              variant="ghost"
              onClick={testConnection}
              loading={testingConnection}
              className="w-full text-xs"
            >
              <Database className="mr-1 h-3 w-3" />
              Testar Conexão Supabase
            </Button>
          </div>

          {/* Enhanced Troubleshooting Section */}
          {(showTroubleshooting || demoUserStatus === 'created' || demoUserStatus === 'none') && (
            <div className="mt-4 space-y-3">
              {/* Step-by-step guide */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded text-xs">
                <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  🔧 Guia de Solução de Problemas
                </p>
                
                {demoUserStatus === 'none' && (
                  <div className="space-y-2">
                    <p className="text-yellow-700 dark:text-yellow-300">
                      <strong>Problema:</strong> Usuário demo não existe
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300">
                      <strong>Solução:</strong> Clique no botão "Criar Usuário Demo" acima
                    </p>
                  </div>
                )}

                {demoUserStatus === 'created' && (
                  <div className="space-y-2">
                    <p className="text-yellow-700 dark:text-yellow-300">
                      <strong>Problema:</strong> Email do usuário demo não confirmado
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300">
                      <strong>Solução:</strong> Escolha uma das opções abaixo:
                    </p>
                    <div className="ml-4 space-y-1">
                      <p className="text-yellow-600 dark:text-yellow-400">
                        • Opção 1: Confirmar manualmente no Supabase Dashboard
                      </p>
                      <p className="text-yellow-600 dark:text-yellow-400">
                        • Opção 2: Desabilitar confirmação de email (para testes)
                      </p>
                    </div>
                  </div>
                )}

                {/* New section for email provider disabled */}
                <div className="space-y-2">
                  <p className="text-red-700 dark:text-red-300">
                    <strong>⚠️ Problema Crítico:</strong> Autenticação por email desabilitada
                  </p>
                  <p className="text-red-700 dark:text-red-300">
                    <strong>Solução Obrigatória:</strong> Habilitar provedor de email no Supabase
                  </p>
                  <div className="ml-4 space-y-1">
                    <p className="text-red-600 dark:text-red-400">
                      1. Acesse Supabase Dashboard > Authentication > Providers
                    </p>
                    <p className="text-red-600 dark:text-red-400">
                      2. Encontre "Email" na lista de provedores
                    </p>
                    <p className="text-red-600 dark:text-red-400">
                      3. Clique em "Enable" para habilitar
                    </p>
                    <p className="text-red-600 dark:text-red-400">
                      4. Salve as configurações
                    </p>
                  </div>
                </div>

                {demoUserStatus === 'created' && (
                  <div className="space-y-2">
                    <p className="text-yellow-700 dark:text-yellow-300">
                      <strong>Problema:</strong> Email do usuário demo não confirmado
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300">
                      <strong>Solução:</strong> Escolha uma das opções abaixo:
                    </p>
                    <div className="ml-4 space-y-1">
                      <p className="text-yellow-600 dark:text-yellow-400">
                        • Opção 1: Confirmar manualmente no Supabase Dashboard
                      </p>
                      <p className="text-yellow-600 dark:text-yellow-400">
                        • Opção 2: Desabilitar confirmação de email (para testes)
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={openSupabaseDashboard}
                    className="text-xs px-2 py-1"
                  >
                    <ExternalLink className="mr-1 h-3 w-3" />
                    Abrir Supabase Dashboard
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowTroubleshooting(false)}
                    className="text-xs px-2 py-1"
                  >
                    Ocultar
                  </Button>
                </div>
              </div>

              {/* Detailed instructions */}
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-xs">
                <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                  📋 Instruções Detalhadas
                </p>
                <div className="space-y-2 text-gray-700 dark:text-gray-300">
                  <p><strong>Para confirmar email manualmente:</strong></p>
                  <ol className="list-decimal list-inside ml-2 space-y-1">
                    <li>Acesse o Supabase Dashboard</li>
                    <li>Vá para Authentication → Users</li>
                    <li>Encontre o usuário demo@unasyscrm.com.br</li>
                    <li>Clique nos três pontos (⋯) ao lado do usuário</li>
                    <li>Selecione "Confirm email"</li>
                  </ol>
                  
                  <p className="mt-3"><strong>Para desabilitar confirmação de email:</strong></p>
                  <ol className="list-decimal list-inside ml-2 space-y-1">
                    <li>Acesse o Supabase Dashboard</li>
                    <li>Vá para Authentication → Settings</li>
                    <li>Desmarque "Confirm email"</li>
                    <li>Clique em "Save"</li>
                  </ol>
                  
                  <p className="mt-3"><strong>Para habilitar autenticação por email:</strong></p>
                  <ol className="list-decimal list-inside ml-2 space-y-1">
                    <li>Acesse o Supabase Dashboard</li>
                    <li>Vá para Authentication → Providers</li>
                    <li>Encontre "Email" e clique em "Enable"</li>
                    <li>Vá para Authentication → Settings</li>
                    <li>Desmarque "Confirm email"</li>
                    <li>Clique em "Save"</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Debug info */}
        {import.meta.env.DEV && (
          <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs">
            <p><strong>Debug Info:</strong></p>
            <p>Email: "{watchedValues.email}"</p>
            <p>Password: "{watchedValues.password}"</p>
            <p>Demo Status: {demoUserStatus}</p>
            <p>Connection: {connectionStatus}</p>
            <p>Supabase URL: {import.meta.env.VITE_SUPABASE_URL}</p>
            <p>Anon Key Present: {!!import.meta.env.VITE_SUPABASE_ANON_KEY}</p>
            {Object.keys(errors).length > 0 && <p>Errors: {JSON.stringify(errors)}</p>}
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

          