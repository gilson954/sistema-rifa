import React, { useState } from 'react';
import { Eye, EyeOff, User, Mail, Lock, ArrowRight, ExternalLink, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  
  // Error states
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const navigate = useNavigate();
  const { register, isAuthLoading } = useAuth();

  console.log('RegisterPage: Estado atual:', {
    isAuthLoading,
    name: !!name,
    email: !!email,
    password: !!password,
    termsAccepted
  });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Validation functions
  const validateName = (value: string) => {
    if (!value.trim()) {
      return 'Nome é obrigatório';
    }
    if (value.trim().length < 2) {
      return 'Nome deve ter pelo menos 2 caracteres';
    }
    return '';
  };

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

  const validatePassword = (value: string) => {
    if (!value) {
      return 'Senha é obrigatória';
    }
    if (value.length < 6) {
      return 'Senha deve ter pelo menos 6 caracteres';
    }
    return '';
  };

  // Handle input changes with validation
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    setNameError(validateName(value));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(validateEmail(value));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordError(validatePassword(value));
  };

  // Handle blur events for validation
  const handleNameBlur = () => {
    setNameError(validateName(name));
  };

  const handleEmailBlur = () => {
    setEmailError(validateEmail(email));
  };

  const handlePasswordBlur = () => {
    setPasswordError(validatePassword(password));
  };

  // Check if form is valid
  const isFormValid = () => {
    return (
      name.trim() !== '' &&
      email.trim() !== '' &&
      password !== '' &&
      termsAccepted &&
      !nameError &&
      !emailError &&
      !passwordError
    );
  };

  // Check if error is about existing user
  const isUserAlreadyExistsError = (errorMessage: string) => {
    return errorMessage.includes('Este email já está cadastrado') || 
           errorMessage.includes('User already registered');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    console.log('RegisterPage: Iniciando tentativa de registro para:', email, 'com nome:', name);
    
    // Final validation
    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    
    setNameError(nameErr);
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    
    if (!nameErr && !emailErr && !passwordErr && termsAccepted) {
      const result = await register(name, email, password);
      
      console.log('RegisterPage: Resultado do registro:', result);
      
      if (result.success) {
        console.log('RegisterPage: Registro bem-sucedido, redirecionando para dashboard');
        // Redirecionar para dashboard após registro bem-sucedido
        navigate('/dashboard', { replace: true });
      } else {
        console.log('RegisterPage: Erro no registro:', result.error);
        setError(result.error || 'Erro ao criar conta');
      }
    } else {
      console.log('RegisterPage: Formulário inválido:', {
        nameErr,
        emailErr,
        passwordErr,
        termsAccepted
      });
    }
  };

  const handleLoginClick = () => {
    console.log('RegisterPage: Navegando para login');
    navigate('/login');
  };

  const handleGoHome = () => {
    console.log('RegisterPage: Navegando para home');
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
            Criar sua conta
          </h1>
          <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
            Comece a criar suas rifas em poucos minutos
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 transition-colors duration-300">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-600 dark:text-red-400 text-sm mb-3">{error}</p>
                {isUserAlreadyExistsError(error) && (
                  <button
                    type="button"
                    onClick={handleLoginClick}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors duration-200"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Fazer login
                  </button>
                )}
              </div>
            )}

            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                Nome
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  onBlur={handleNameBlur}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300 ${
                    nameError 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Seu nome"
                  required
                  disabled={isAuthLoading}
                />
              </div>
              {nameError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{nameError}</p>
              )}
            </div>

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
                  onChange={handlePasswordChange}
                  onBlur={handlePasswordBlur}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300 ${
                    passwordError 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Mínimo 6 caracteres"
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
              {passwordError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{passwordError}</p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                  required
                  disabled={isAuthLoading}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="text-gray-700 dark:text-gray-300 transition-colors duration-300">
                  Eu aceito os{' '}
                  <a 
                    href="#" 
                    className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors duration-200 inline-flex items-center"
                  >
                    Termos de Uso
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </label>
              </div>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={!isFormValid() || isAuthLoading}
              className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center group transition-all duration-200 ${
                isFormValid() && !isAuthLoading
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              {isAuthLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Criando conta...
                </>
              ) : (
                <>
                  Criar conta
                  <ArrowRight className={`ml-2 h-5 w-5 transition-transform duration-200 ${
                    isFormValid() && !isAuthLoading ? 'group-hover:translate-x-1' : ''
                  }`} />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
              Já tem uma conta?{' '}
              <button 
                onClick={handleLoginClick}
                className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold transition-colors duration-200"
                disabled={isAuthLoading}
              >
                Entrar
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

export default RegisterPage;