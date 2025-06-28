import React, { useState } from 'react';
import { Mail, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { resetPassword, isAuthLoading } = useAuth();

  // Email validation
  const validateEmail = (value: string) => {
    if (!value.trim()) {
      return 'E-mail é obrigatório';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'E-mail inválido';
    }
    return '';
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(validateEmail(value));
  };

  const handleEmailBlur = () => {
    setEmailError(validateEmail(email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const emailErr = validateEmail(email);
    setEmailError(emailErr);
    
    if (!emailErr) {
      const result = await resetPassword(email);
      
      if (result.success) {
        setIsSubmitted(true);
      } else {
        setError(result.error || 'Erro ao enviar email de recuperação');
      }
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  const handleTryAgain = () => {
    setIsSubmitted(false);
    setEmail('');
    setEmailError('');
    setError('');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 transition-colors duration-300">
        <div className="w-full max-w-md">
          {/* Success State */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 text-center transition-colors duration-300">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-green-600 dark:text-green-400" size={40} />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-300">
              E-mail enviado!
            </h1>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed transition-colors duration-300">
              Enviamos um link de recuperação para <strong>{email}</strong>. 
              Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
            </p>
            
            <div className="space-y-4">
              <button
                onClick={handleBackToLogin}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-semibold flex items-center justify-center group"
              >
                Voltar para login
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
              
              <button
                onClick={handleTryAgain}
                className="w-full text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 py-2 transition-colors duration-200 font-medium"
              >
                Não recebeu? Tentar novamente
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
            <p>© 2024 Rifaqui - Todos os direitos reservados</p>
          </div>
        </div>
      </div>
    );
  }

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
            Recuperar senha
          </h1>
          <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
            Digite seu e-mail para receber o link de recuperação
          </p>
        </div>

        {/* Recovery Form */}
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
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300 ${
                    emailError 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="seu@email.com"
                  required
                  disabled={isAuthLoading}
                />
              </div>
              {emailError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{emailError}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isAuthLoading || !!emailError || !email.trim()}
              className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center transition-all duration-200 ${
                isAuthLoading || !!emailError || !email.trim()
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 group'
              }`}
            >
              {isAuthLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Enviando...
                </>
              ) : (
                <>
                  Enviar link de recuperação
                  <ArrowRight className={`ml-2 h-5 w-5 transition-transform duration-200 ${
                    !isAuthLoading && !emailError && email.trim() ? 'group-hover:translate-x-1' : ''
                  }`} />
                </>
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-8 text-center">
            <button 
              onClick={handleBackToLogin}
              className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors duration-200"
              disabled={isAuthLoading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para login
            </button>
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

export default ForgotPasswordPage;