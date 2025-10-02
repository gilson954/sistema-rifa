// src/pages/LoginPage.tsx
import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useRouteHistory } from '../hooks/useRouteHistory'
import AuthHeader from '../components/AuthHeader'
import { translateAuthError } from '../utils/errorTranslators'

/**
 * Nova abordagem de botão "Entrar" com ONDA de gradientes:
 * - Três camadas de gradiente animadas (duras diferentes) criam um movimento contínuo
 * - As camadas usam blur + mix-blend para um efeito suave e fluido
 * - A animação respeita prefers-reduced-motion
 *
 * Obs: incluo um <style> local aqui pra garantir que os keyframes e classes existam
 * no runtime sem precisar alterar o index.css. Se preferir, mova essas regras
 * para seu index.css e remova o <style> daqui.
 */

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { restoreLastRoute } = useRouteHistory()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: authError } = await signIn(email, password)

    if (authError) {
      setError(translateAuthError(authError.message))
      setLoading(false)
    } else {
      const lastRoute = restoreLastRoute()
      if (lastRoute) {
        navigate(lastRoute, { replace: true })
      } else {
        const from = location.state?.from
        if (from && typeof from === 'string') {
          navigate(from, { replace: true })
        } else {
          navigate('/dashboard', { replace: true })
        }
      }
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')
    const { error: authError } = await signInWithGoogle()
    if (authError) {
      setError(translateAuthError(authError.message))
      setLoading(false)
    }
  }

  return (
    <>
      {/* styles locais para o efeito de onda/gradiente do botão */}
      <style>{`
        /* Botão: camadas que se movem formando a onda de gradiente */
        .wave-button { position: relative; overflow: hidden; border-radius: 0.75rem; }
        .wave-button .wave-layer {
          position: absolute;
          top: -40%;
          left: -40%;
          width: 180%;
          height: 180%;
          pointer-events: none;
          filter: blur(28px) saturate(1.05);
          opacity: 0.72;
          mix-blend-mode: screen;
          transform-origin: center;
        }

        .wave-button .wave1 {
          background: linear-gradient(90deg, rgba(236,72,153,0.95), rgba(139,92,246,0.95));
          animation: waveMove1 6s linear infinite;
        }
        .wave-button .wave2 {
          background: linear-gradient(90deg, rgba(139,92,246,0.85), rgba(59,130,246,0.85));
          animation: waveMove2 8s linear infinite;
          opacity: 0.65;
        }
        .wave-button .wave3 {
          background: linear-gradient(90deg, rgba(59,130,246,0.75), rgba(236,72,153,0.75));
          animation: waveMove3 10s linear infinite;
          opacity: 0.6;
          mix-blend-mode: overlay;
        }

        @keyframes waveMove1 {
          0%   { transform: translateX(-40%) rotate(-12deg) scale(1); }
          50%  { transform: translateX(40%) rotate(12deg) scale(1.05); }
          100% { transform: translateX(-40%) rotate(-12deg) scale(1); }
        }
        @keyframes waveMove2 {
          0%   { transform: translateX(-60%) rotate(-8deg) scale(1); }
          50%  { transform: translateX(60%) rotate(8deg) scale(1.03); }
          100% { transform: translateX(-60%) rotate(-8deg) scale(1); }
        }
        @keyframes waveMove3 {
          0%   { transform: translateX(-80%) rotate(-6deg) scale(1); }
          50%  { transform: translateX(80%) rotate(6deg) scale(1.02); }
          100% { transform: translateX(-80%) rotate(-6deg) scale(1); }
        }

        /* camada de brilho sutil */
        .wave-button .shine {
          position: absolute;
          inset: 0;
          z-index: 6;
          pointer-events: none;
          background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0));
          mix-blend-mode: overlay;
        }

        /* conteúdo do botão */
        .wave-button .btn-content { position: relative; z-index: 10; display:inline-flex; align-items:center; gap:0.5rem; }

        /* reduz movimento quando o usuário prefere menos movimento */
        @media (prefers-reduced-motion: reduce) {
          .wave-button .wave-layer { animation: none !important; filter: none !important; opacity: 0.45; }
        }
      `}</style>

      <AuthHeader />

      {/* Background */}
      <div className="relative min-h-screen flex items-center justify-center p-6 pt-20 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div
            className="w-full h-full animate-gradient"
            style={{
              background: 'linear-gradient(140deg, #af4e2b, #8a5f1, #9373f0)',
              backgroundSize: '180% 180%'
            }}
          />
        </div>

        <motion.div
          className="max-w-md w-full"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {/* Logo + Header */}
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <img
              src="/logo-chatgpt.png"
              alt="Rifaqui Logo"
              className="w-24 h-24 mx-auto mb-4 drop-shadow-xl"
            />
            <motion.h1
              className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
            >
              Bem-vindo de volta
            </motion.h1>
            <motion.p
              className="text-gray-700 dark:text-gray-300 text-lg"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
            >
              Entre na sua conta para continuar
            </motion.p>
          </motion.div>

          {/* Card */}
          <motion.div
            className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-800"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div
                  className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-4 flex items-center space-x-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25 }}
                >
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
                </motion.div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha"
                    className="w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition"
                >
                  Esqueceu sua senha?
                </Link>
              </div>

              {/* Submit: botão com camadas de gradiente em movimento (onda) */}
              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="wave-button w-full py-3 rounded-lg font-semibold text-white shadow-lg shadow-purple-500/30 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-purple-200"
                style={{ background: 'linear-gradient(90deg,#7c3aed,#ec4899)' }}
              >
                {/* camadas animadas (behind the scenes) */}
                <span className="wave-layer wave1" aria-hidden="true" />
                <span className="wave-layer wave2" aria-hidden="true" />
                <span className="wave-layer wave3" aria-hidden="true" />
                {/* brilho sutil */}
                <span className="shine" aria-hidden="true" />
                {/* conteúdo do botão */}
                <span className="btn-content">
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  ) : (
                    'Entrar'
                  )}
                </span>
              </button>
            </form>

            {/* Divider */}
            <div className="mt-8 mb-6 flex items-center">
              <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
              <span className="px-3 text-gray-500 dark:text-gray-400 text-sm">ou</span>
              <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
            </div>

            {/* Google */}
            <motion.button
              onClick={handleGoogleSignIn}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              className="w-full bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white py-3 rounded-lg font-semibold transition flex items-center justify-center space-x-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Entrar com Google</span>
            </motion.button>

            {/* Sign Up */}
            <motion.div
              className="mt-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <p className="text-gray-600 dark:text-gray-400">
                Não tem uma conta?{' '}
                <Link
                  to="/register"
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold transition"
                >
                  Criar conta
                </Link>
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </>
  )
}

export default LoginPage
