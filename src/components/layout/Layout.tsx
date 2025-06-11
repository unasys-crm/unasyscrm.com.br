import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useCompany } from '../../contexts/CompanyContext'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../ui/LoadingSpinner'
import Button from '../ui/Button'

const Layout: React.FC = () => {
  const { loading, currentCompany, refreshCompanies } = useCompany()
  const { user } = useAuth()

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
            Configurando sua conta...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Estamos preparando seu acesso ao sistema. Isso pode levar alguns segundos.
          </p>
          <div className="mt-6 space-y-4">
            <LoadingSpinner size="md" className="mx-auto" />
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Usuário: {user?.email}
            </div>
            <Button onClick={refreshCompanies} variant="secondary">
              Tentar novamente
            </Button>
          </div>
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