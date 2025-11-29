// src/pages/ResetPasswordPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import AuthHeader from '../components/AuthHeader';
import { translateAuthError } from '../utils/errorTranslators';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [authError, setAuthError] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      const urlParams = new URLSearchParams(window.location.hash.substring(1));
      const isRecoveryFlow = urlParams.get('type') === 'recovery';
      
      if (!user && !isRecoveryFlow) {
        setAuthError(true);
      } else if (!user && isRecoveryFlow) {
        const timeout = setTimeout(() => {
          if (!user) setAuthError(true);
        }, 2000);
        return () => clearTimeout(timeout);
      }
    }
  }, [user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const { error: authError } = await supabase.auth.updateUser({ password });

      if (authError) {
        setError(translateAuthError(authError.message));
        setLoading(false);
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      console.error('Error updating password:', err);
      const message = typeof err === 'object' && err && 'message' in err ? (err as { message?: string }).message || 'Erro inesperado. Tente novamente.' : 'Erro inesperado. Tente novamente.';
      setError(translateAuthError(message));
      setLoading(false);
    }
  };

  // ============================
  // ESTADOS DE LOADING / ERRO / SUCESSO
  // ============================
  if (authLoading) {
    return (
      <>
        <AuthHeader />
        <div className="min-h-screen bg-animated-gradient flex items-center justify-center p-4 pt-20">
          <div className="max-w-md w-full text-center">
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-gray-200/50 dark:border-gray-800/50">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Verificando link de redefinição...
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Aguarde enquanto validamos seu link de redefinição de senha
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (authError || !user) {
    return (
      <>
        <AuthHeader />
        <div className="min-h-screen bg-animated-gradient flex items-center justify-center p-4 pt-20">
          <div className="max-w-md w-full text-center">
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-gray-200/50 dark:border-gray-800/50">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Link Inválido ou Expirado
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                O link de redefinição de senha que você clicou é inválido ou já expirou. 
                Por favor, solicite um novo link.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Dica:</strong> Links de redefinição de senha expiram após algumas horas por segurança.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/forgot-password"
                  className="flex-1 animate-gradient-button text-white px-6 py-3 rounded-lg font-semibold transition-shadow duration-200 text-center"
                >
                  Solicitar Novo Link
                </Link>
                <Link
                  to="/login"
                  className="flex-1 bg-gray-200/80 dark:bg-gray-700/80 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 text-center flex items-center justify-center space-x-2"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Voltar</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (success) {
    return (
      <>
        <AuthHeader />
        <div className="min-h-screen bg-animated-gradient flex items-center justify-center p-4 pt-20">
          <div className="max-w-md w-full text-center">
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-gray-200/50 dark:border-gray-800/50">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Senha Redefinida!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Sua senha foi alterada com sucesso. Você será redirecionado para o login.
              </p>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ============================
  // FORMULÁRIO PRINCIPAL
  // ============================
  return (
    <>
      <AuthHeader />
      <div className="min-h-screen bg-animated-gradient flex items-center justify-center p-4 pt-20">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <img 
              src="/logo-chatgpt.png" 
              alt="Rifaqui Logo" 
              className="w-20 h-20 object-contain mx-auto mb-4 drop-shadow-xl"
            />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Redefinir Senha
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Digite sua nova senha
            </p>
          </div>

          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-gray-200/50 dark:border-gray-800/50">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
                </div>
              )}

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-green-700 dark:text-green-300 text-sm">
                  Link válido! Agora você pode definir sua nova senha.
                </span>
              </div>

              {/* Campo: Nova Senha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nova Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua nova senha"
                    className="w-full pl-10 pr-12 py-3 bg-gray-50/80 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
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

              {/* Campo: Confirmar Senha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme sua nova senha"
                    className="w-full pl-10 pr-12 py-3 bg-gray-50/80 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Requisitos */}
              <div className="bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  Requisitos da senha:
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${password.length >= 6 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span>Pelo menos 6 caracteres</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${password === confirmPassword && password.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span>Senhas devem coincidir</span>
                  </li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full animate-gradient-button disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-shadow duration-200 flex items-center justify-center shadow-lg"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  'Redefinir Senha'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold transition-colors duration-200 inline-flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar para Login</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPasswordPage;
