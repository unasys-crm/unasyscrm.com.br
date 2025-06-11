import React, { useEffect, useState } from 'react'
import {
  Users,
  FileText,
  CheckSquare,
  Calendar,
  AlertCircle,
  DollarSign,
  Target
} from 'lucide-react'
import { useCompany } from '../../contexts/CompanyContext'
import { supabase } from '../../lib/supabase'
import type { DashboardStats } from '../../types'

const DashboardPage: React.FC = () => {
  const { currentCompany } = useCompany()
  const [stats, setStats] = useState<DashboardStats>({
    total_clients: 0,
    active_clients: 0,
    total_proposals: 0,
    approved_proposals: 0,
    total_tasks: 0,
    completed_tasks: 0,
    pending_tasks: 0,
    overdue_tasks: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentCompany) {
      fetchDashboardStats()
    }
  }, [currentCompany])

  const fetchDashboardStats = async () => {
    if (!currentCompany) return

    try {
      setLoading(true)

      // Fetch clients stats
      const { count: totalClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', currentCompany.id)

      const { count: activeClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', currentCompany.id)
        .eq('status', 'active')

      // Fetch proposals stats
      const { count: totalProposals } = await supabase
        .from('proposals')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', currentCompany.id)

      const { count: approvedProposals } = await supabase
        .from('proposals')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', currentCompany.id)
        .eq('status', 'approved')

      // Fetch tasks stats
      const { count: totalTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', currentCompany.id)

      const { count: completedTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', currentCompany.id)
        .eq('status', 'done')

      const { count: pendingTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', currentCompany.id)
        .in('status', ['todo', 'in_progress'])

      // Calculate overdue tasks (tasks with due_date in the past and not completed)
      const today = new Date().toISOString().split('T')[0]
      const { count: overdueTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', currentCompany.id)
        .lt('due_date', today)
        .neq('status', 'done')

      setStats({
        total_clients: totalClients || 0,
        active_clients: activeClients || 0,
        total_proposals: totalProposals || 0,
        approved_proposals: approvedProposals || 0,
        total_tasks: totalTasks || 0,
        completed_tasks: completedTasks || 0,
        pending_tasks: pendingTasks || 0,
        overdue_tasks: overdueTasks || 0,
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total de Clientes',
      value: stats.total_clients,
      subtitle: `${stats.active_clients} ativos`,
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Propostas',
      value: stats.total_proposals,
      subtitle: `${stats.approved_proposals} aprovadas`,
      icon: FileText,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Tarefas',
      value: stats.total_tasks,
      subtitle: `${stats.completed_tasks} concluídas`,
      icon: CheckSquare,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Tarefas Pendentes',
      value: stats.pending_tasks,
      subtitle: `${stats.overdue_tasks} em atraso`,
      icon: AlertCircle,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="page-header">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visão geral dos principais indicadores
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Bem-vindo ao {currentCompany?.name}! Aqui está um resumo dos seus dados.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className={`card card-hover ${card.bgColor}`}>
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {card.title}
                </p>
                <p className={`text-2xl font-bold ${card.textColor}`}>
                  {card.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {card.subtitle}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Ações Rápidas
          </h3>
          <div className="space-y-3">
            <button className="w-full flex items-center p-3 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              <Users className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Adicionar Cliente
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Cadastrar um novo cliente
                </p>
              </div>
            </button>
            <button className="w-full flex items-center p-3 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              <FileText className="h-5 w-5 text-green-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Nova Proposta
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Criar uma nova proposta comercial
                </p>
              </div>
            </button>
            <button className="w-full flex items-center p-3 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              <CheckSquare className="h-5 w-5 text-purple-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Criar Tarefa
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Adicionar uma nova tarefa
                </p>
              </div>
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Atividades Recentes
          </h3>
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Proposta aprovada
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Cliente ABC aprovou proposta #123
                </p>
              </div>
              <span className="text-xs text-gray-400">2h atrás</span>
            </div>
            <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="h-2 w-2 bg-blue-500 rounded-full mr-3"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Novo cliente cadastrado
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Empresa XYZ foi adicionada
                </p>
              </div>
              <span className="text-xs text-gray-400">4h atrás</span>
            </div>
            <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="h-2 w-2 bg-orange-500 rounded-full mr-3"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Tarefa em atraso
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Revisar contrato venceu ontem
                </p>
              </div>
              <span className="text-xs text-gray-400">1d atrás</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage