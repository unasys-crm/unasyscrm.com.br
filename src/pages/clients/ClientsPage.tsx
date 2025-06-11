import React from 'react'
import { Routes, Route } from 'react-router-dom'
import ClientsList from './ClientsList'
import ClientForm from './ClientForm'
import ClientDetails from './ClientDetails'

const ClientsPage: React.FC = () => {
  return (
    <Routes>
      <Route index element={<ClientsList />} />
      <Route path="new" element={<ClientForm />} />
      <Route path=":id" element={<ClientDetails />} />
      <Route path=":id/edit" element={<ClientForm />} />
    </Routes>
  )
}

export default ClientsPage