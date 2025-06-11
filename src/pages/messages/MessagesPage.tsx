import React from 'react'

const MessagesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Mensagens
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Envie mensagens via WhatsApp, SMS e email
        </p>
      </div>

      <div className="card">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Módulo em Desenvolvimento
          </h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            O módulo de mensagens está sendo desenvolvido e estará disponível em breve.
          </p>
        </div>
      </div>
    </div>
  )
}

export default MessagesPage