import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../ui/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  console.log('ProtectedRoute - User:', user?.email, 'Loading:', loading)

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    console.log('ProtectedRoute - No user, redirecting to login')
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  console.log('ProtectedRoute - User authenticated, rendering children')
  return <>{children}</>
}

export default ProtectedRoute