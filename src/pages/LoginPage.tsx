import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthLoading } = useAuth();

  // Pegar a rota de onde o usuário veio (se foi redirecionado)
  const from = location.state?.from?.pathname || '/dashboard';

  console.log('LoginPage: Estado atual:', {
    isAuthLoading,
    from,
    email: !!email,
    password: !!password
  });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    console.log('LoginPage: Iniciando tentativa de login para:', email);

    const result = await login(email, password);
    
    console.log('LoginPage: Resultado do login:', result);

    if (result.success) {
      console.log('LoginPage: Login bem-sucedido, redirecionando para:', from);
      // Redirecionar para onde o usuário estava tentando ir, ou dashboard
      navigate(from, { replace: true });
    } else {
      console.log('LoginPage: Erro no login:', result.error);
      setError(result.error || 'Erro ao fazer login');
    }
  };

  const handleRegisterClick = () => {
    console.log('LoginPage: Navegando para registro');
    navigate('/register');
  };

  const handleForgotPasswordClick = () => {
    console.log('LoginPage: Navegando para recuperação de senha');
    navigate('/forgot-password');
  };

  const handleGoHome = () => {
    console.log('LoginPage: Navegando para home');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <button 
            onClick={handleGoHome}
            className="flex items-center justify-center mb-4 hover:opacity-80 transition-opacity duration-200"
          >
            <img 
              src="/32132123.png" 
              alt="Rifaqui Logo" 
              className="w-11 h-11 object-contain"
            />
            <span className="ml-3 text-2xl font-bold text-gray-900 dark:text-white">Rifaqui</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
            Entrar na sua conta
          </h1>
          <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
            Acesse sua conta para gerenciar suas rifas
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 transition-colors duration-300">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
                  placeholder="seu@email.com"
                  required
                  disabled={isAuthLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
                  placeholder="Sua senha"
                  required
                  disabled={isAuthLoading}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                  disabled={isAuthLoading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <button 
                type="button"
                onClick={handleForgotPasswordClick}
                className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors duration-200"
                disabled={isAuthLoading}
              >
                Esqueci minha senha
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isAuthLoading}
              className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center transition-all duration-200 ${
                isAuthLoading
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 group'
              }`}
            >
              {isAuthLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Entrando...
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                </>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
              Não tem uma conta?{' '}
              <button 
                onClick={handleRegisterClick}
                className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold transition-colors duration-200"
                disabled={isAuthLoading}
              >
                Cadastrar-se
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
          <p>© 2024 Rifaqui - Todos os direitos reservados</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;