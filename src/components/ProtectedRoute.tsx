import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useRouteHistory } from '../hooks/useRouteHistory'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()
  const { restoreLastRoute } = useRouteHistory()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!user) {
    // Salva a rota atual para restaurar após login
    const currentPath = location.pathname + location.search
    return <Navigate to="/" state={{ from: currentPath }} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute