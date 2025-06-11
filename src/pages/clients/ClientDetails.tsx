import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Building2,
  User,
  Calendar,
  FileText,
  CheckSquare
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Client } from '../../types'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const ClientDetails: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchClient(id)
    }
  }, [id])

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
    } catch (error) {
      console.error('Error fetching client:', error)
      toast.error('Erro ao carregar cliente')
      navigate('/clients')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'status-active',
      inactive: 'status-inactive',
      prospect: 'status-pending'
    }
    return badges[status as keyof typeof badges] || 'status-inactive'
  }

  const getStatusText = (status: string) => {
    const texts = {
      active: 'Ativo',
      inactive: 'Inativo',
      prospect: 'Prospect'
    }
    return texts[status as keyof typeof texts] || status
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Cliente não encontrado
        </h3>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          O cliente que você está procurando não existe ou foi removido.
        </p>
        <div className="mt-6">
          <Button onClick={() => navigate('/clients')}>
            Voltar para Clientes
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="flex items-center justify-between">
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
                {client.name}
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(client.status)}`}>
                  {getStatusText(client.status)}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                  {client.type === 'company' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                </span>
              </div>
            </div>
          </div>
          <Link to={`/clients/${client.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Informações de Contato
            </h3>
            <div className="space-y-4">
              {client.email && (
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Email
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {client.email}
                    </p>
                  </div>
                </div>
              )}
              
              {client.phone && (
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Telefone
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {client.phone}
                    </p>
                  </div>
                </div>
              )}

              {client.document && (
                <div className="flex items-center">
                  {client.type === 'company' ? (
                    <Building2 className="h-5 w-5 text-gray-400 mr-3" />
                  ) : (
                    <User className="h-5 w-5 text-gray-400 mr-3" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {client.type === 'company' ? 'CNPJ' : 'CPF'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {client.document}
                    </p>
                  </div>
                </div>
              )}

              {(client.address || client.city || client.state) && (
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Endereço
                    </p>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {client.address && <p>{client.address}</p>}
                      {(client.city || client.state || client.zip_code) && (
                        <p>
                          {[client.city, client.state, client.zip_code]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {client.notes && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Observações
              </h3>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {client.notes}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Informações Gerais
            </h3>
            <div className="space-y-3">
              {client.category && (
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Categoria
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {client.category}
                  </p>
                </div>
              )}
              
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Criado em
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(client.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Última atualização
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(client.updated_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Ações Rápidas
            </h3>
            <div className="space-y-2">
              <Button variant="secondary" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Nova Proposta
              </Button>
              <Button variant="secondary" className="w-full justify-start">
                <CheckSquare className="mr-2 h-4 w-4" />
                Nova Tarefa
              </Button>
              <Button variant="secondary" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Agendar Reunião
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientDetails