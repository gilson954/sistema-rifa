import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, AlertCircle, Shield, Crown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import AuthHeader from '../components/AuthHeader'

const AdminLoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { user, session, loading: authLoading, signIn, signOut } = useAuth()
  const navigate = useNavigate()

  // Check if user is admin by looking at user metadata
  const isAdmin = user?.user_metadata?.is_admin === true || user?.user_metadata?.is_admin === 'true'

  // Effect to handle authentication state changes
  useEffect(() => {
    // Only proceed if auth is not loading
    if (!authLoading) {
      if (user && isAdmin) {
        // User is authenticated and is admin - redirect to admin dashboard
        navigate('/admin/dashboard')
      } else if (user && !isAdmin && session) {
        // User is authenticated but not admin and has valid session - sign them out and show error
        signOut()
        setError('Acesso negado. Esta área é restrita a administradores.')
        setLoading(false)
      } else if (user && !isAdmin && !session) {
        // User exists but no valid session - just show error without signing out
        setError('Acesso negado. Esta área é restrita a administradores.')
        setLoading(false)
      }
    }
  }, [user, isAdmin, session, authLoading, navigate, signOut])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error: signInError } = await signIn(email, password)

      if (signInError) {
        setError('Credenciais inválidas ou acesso não autorizado')
        setLoading(false)
        return
      }

      // Don't set loading to false here - let the useEffect handle the redirect
      // The AuthContext will update user, triggering the useEffect
    } catch (error) {
      console.error('Error during admin login:', error)
      setError('Erro ao fazer login. Tente novamente.')
      setLoading(false)
    }
  }

  // Show loading while auth context is determining user status
  if (authLoading) {
    return (
      <>
        <AuthHeader />
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 pt-20 transition-colors duration-300">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Verificando permissões...</span>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <AuthHeader />
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 pt-20 transition-colors duration-300">
        <div className="max-w-md w-full">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-red-600 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Crown className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Área Administrativa
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Acesso restrito a administradores do sistema
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-800">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
                </div>
              )}

              {/* Admin Notice */}
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 flex items-center space-x-2">
                <Shield className="h-5 w-5 text-orange-500 flex-shrink-0" />
                <span className="text-orange-700 dark:text-orange-300 text-sm">
                  Esta área é exclusiva para administradores do sistema
                </span>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Administrativo
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@rifaqui.com"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors duration-200"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Senha Administrativa
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha administrativa"
                    className="w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:from-red-400 disabled:to-orange-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center shadow-lg"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Shield className="h-5 w-5 mr-2" />
                    Acessar Painel Admin
                  </>
                )}
              </button>
            </form>

            {/* Back to Regular Login */}
            <div className="mt-6 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Não é administrador?{' '}
                <Link
                  to="/login"
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold transition-colors duration-200"
                >
                  Login regular
                </Link>
              </p>
            </div>

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-start space-x-2">
                <Shield className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    <strong>Aviso de Segurança:</strong> Todas as tentativas de login são monitoradas. 
                    O acesso não autorizado é estritamente proibido e pode resultar em ações legais.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AdminLoginPage