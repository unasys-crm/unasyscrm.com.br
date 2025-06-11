import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FileText,
  TrendingUp,
  CheckSquare,
  MessageSquare,
  BarChart3,
  Bell,
  Settings,
  Zap,
  Shield
} from 'lucide-react'
import { useCompany } from '../../contexts/CompanyContext'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Propostas', href: '/proposals', icon: FileText },
  { name: 'Vendas', href: '/sales', icon: TrendingUp },
  { name: 'Tarefas', href: '/tasks', icon: CheckSquare },
  { name: 'Mensagens', href: '/messages', icon: MessageSquare },
  { name: 'Relatórios', href: '/reports', icon: BarChart3 },
  { name: 'Notificações', href: '/notifications', icon: Bell },
  { name: 'Integrações', href: '/integrations', icon: Zap },
  { name: 'Administração', href: '/admin', icon: Shield },
  { name: 'Configurações', href: '/settings', icon: Settings },
]

const Sidebar: React.FC = () => {
  const { currentCompany } = useCompany()

  return (
    <div className="flex w-64 flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">U</span>
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            UnasyCRM
          </span>
        </div>
      </div>

      {/* Company Info */}
      {currentCompany && (
        <div className="border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm">
            <p className="font-medium text-gray-900 dark:text-white truncate">
              {currentCompany.name}
            </p>
            <p className="text-gray-500 dark:text-gray-400 capitalize">
              Plano {currentCompany.plan}
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `sidebar-item ${
                isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
              }`
            }
          >
            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default Sidebar