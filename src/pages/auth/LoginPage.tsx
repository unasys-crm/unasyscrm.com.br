import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import toast from 'react-hot-toast'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)

  const from = location.state?.from?.pathname || '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true)
      console.log('Login form submitted with:', data.email)
      
      // Verificar se os campos estão preenchidos
      if (!data.email || !data.password) {
        toast.error('Por favor, preencha todos os campos')
        return
      }
      
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
    } catch (error) {
      // Error is handled by the AuthContext
      console.error('Login failed:', error)
    } finally {
      setLoading(false)
    }
  }

  // Demo login function
  const handleDemoLogin = () => {
    setValue('email', 'demo@unasyscrm.com.br')
    setValue('password', 'demo123456')
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
      }
    } catch (error: any) {
      toast.error(`Erro de conexão: ${error.message}`)
      console.error('Connection test error:', error)
    } finally {
      setTestingConnection(false)
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

        {/* Demo Login Button */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
            <strong>Credenciais de demonstração:</strong><br />
            Email: demo@unasyscrm.com.br<br />
            Senha: demo123456
          </p>
          <div className="space-y-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleDemoLogin}
              className="w-full"
            >
              Preencher dados de demonstração
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={testConnection}
              loading={testingConnection}
              className="w-full text-xs"
            >
              Testar Conexão
            </Button>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              {...register('email')}
              error={errors.email?.message}
            />

            <div className="relative">
              <Input
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
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
          >
            <LogIn className="mr-2 h-4 w-4" />
            Entrar
          </Button>
        </form>

        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © 2024 UnasyCRM. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage