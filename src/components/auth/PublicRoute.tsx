import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../ui/LoadingSpinner'

interface PublicRouteProps {
  children: React.ReactNode
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, loading } = useAuth()

  console.log('PublicRoute - User:', user?.email, 'Loading:', loading)

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (user) {
    console.log('PublicRoute - User authenticated, redirecting to dashboard')
    return <Navigate to="/dashboard" replace />
  }

  console.log('PublicRoute - No user, rendering children')
  return <>{children}</>
}

export default PublicRoute