import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useCompany } from '../../contexts/CompanyContext'
import LoadingSpinner from '../ui/LoadingSpinner'

const Layout: React.FC = () => {
  const { loading, currentCompany } = useCompany()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!currentCompany) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Nenhuma empresa encontrada
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Você não possui acesso a nenhuma empresa ou sua conta está pendente de aprovação.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="container-padding py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout