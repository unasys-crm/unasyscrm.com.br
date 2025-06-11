import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useCompany } from '../../contexts/CompanyContext'
import { supabase } from '../../lib/supabase'
import type { Client } from '../../types'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import toast from 'react-hot-toast'

const clientSchema = z.object({
  type: z.enum(['individual', 'company']),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  document: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['active', 'inactive', 'prospect']),
  notes: z.string().optional(),
})

type ClientFormData = z.infer<typeof clientSchema>

const ClientForm: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const { currentCompany } = useCompany()
  const [loading, setLoading] = useState(false)
  const [client, setClient] = useState<Client | null>(null)

  const isEditing = !!id

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      type: 'individual',
      status: 'prospect',
    },
  })

  const clientType = watch('type')

  useEffect(() => {
    if (isEditing && id) {
      fetchClient(id)
    }
  }, [isEditing, id])

  const fetchClient = async (clientId: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()

      if (error) throw error

      setClient(data)
      reset({
        type: data.type,
        name: data.name,
        email: data.email || '',
        phone: data.phone || '',
        document: data.document || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zip_code: data.zip_code || '',
        category: data.category || '',
        status: data.status,
        notes: data.notes || '',
      })
    } catch (error) {
      console.error('Error fetching client:', error)
      toast.error('Erro ao carregar cliente')
      navigate('/clients')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: ClientFormData) => {
    if (!currentCompany || !user) return

    try {
      setLoading(true)

      const clientData = {
        ...data,
        company_id: currentCompany.id,
        created_by: user.id,
        email: data.email || null,
        phone: data.phone || null,
        document: data.document || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        zip_code: data.zip_code || null,
        category: data.category || null,
        notes: data.notes || null,
      }

      if (isEditing && id) {
        const { error } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', id)

        if (error) throw error

        toast.success('Cliente atualizado com sucesso!')
      } else {
        const { error } = await supabase
          .from('clients')
          .insert([clientData])

        if (error) throw error

        toast.success('Cliente criado com sucesso!')
      }

      navigate('/clients')
    } catch (error: any) {
      console.error('Error saving client:', error)
      toast.error(error.message || 'Erro ao salvar cliente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/clients')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isEditing ? 'Atualize as informações do cliente' : 'Adicione um novo cliente ao sistema'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Informações Básicas
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Tipo de Cliente</label>
              <select {...register('type')} className="form-input">
                <option value="individual">Pessoa Física</option>
                <option value="company">Pessoa Jurídica</option>
              </select>
              {errors.type && (
                <p className="form-error">{errors.type.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">Status</label>
              <select {...register('status')} className="form-input">
                <option value="prospect">Prospect</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
              {errors.status && (
                <p className="form-error">{errors.status.message}</p>
              )}
            </div>

            <Input
              label={clientType === 'company' ? 'Razão Social' : 'Nome Completo'}
              {...register('name')}
              error={errors.name?.message}
            />

            <Input
              label={clientType === 'company' ? 'CNPJ' : 'CPF'}
              {...register('document')}
              error={errors.document?.message}
            />

            <Input
              label="Email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
            />

            <Input
              label="Telefone"
              {...register('phone')}
              error={errors.phone?.message}
            />

            <Input
              label="Categoria"
              {...register('category')}
              error={errors.category?.message}
              helperText="Ex: Cliente VIP, Fornecedor, Parceiro"
            />
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Endereço
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="md:col-span-2 lg:col-span-3">
              <Input
                label="Endereço"
                {...register('address')}
                error={errors.address?.message}
              />
            </div>

            <Input
              label="Cidade"
              {...register('city')}
              error={errors.city?.message}
            />

            <Input
              label="Estado"
              {...register('state')}
              error={errors.state?.message}
            />

            <Input
              label="CEP"
              {...register('zip_code')}
              error={errors.zip_code?.message}
            />
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Observações
          </h3>
          
          <div>
            <label className="form-label">Notas</label>
            <textarea
              {...register('notes')}
              rows={4}
              className="form-input"
              placeholder="Adicione observações sobre o cliente..."
            />
            {errors.notes && (
              <p className="form-error">{errors.notes.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/clients')}
          >
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            <Save className="mr-2 h-4 w-4" />
            {isEditing ? 'Atualizar' : 'Salvar'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default ClientForm