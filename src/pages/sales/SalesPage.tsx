import React from 'react'

const SalesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Vendas
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie suas vendas e comissões
        </p>
      </div>

      <div className="card">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Módulo em Desenvolvimento
          </h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            O módulo de vendas está sendo desenvolvido e estará disponível em breve.
          </p>
        </div>
      </div>
    </div>
  )
}

export default SalesPage