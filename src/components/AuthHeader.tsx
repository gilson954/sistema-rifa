import React from 'react';
import { Sun, Moon, ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

interface AuthHeaderProps {
  backTo?: 'home' | 'login';
}

const AuthHeader: React.FC<AuthHeaderProps> = ({ backTo = 'home' }) => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoBack = () => {
    if (backTo === 'login') {
      navigate('/login');
    } else {
      navigate('/');
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const getBackButtonText = () => {
    if (backTo === 'login') {
      return {
        full: 'Voltar para login',
        short: 'Voltar'
      };
    }
    return {
      full: 'Voltar para o início',
      short: 'Voltar'
    };
  };

  const backButtonText = getBackButtonText();

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-100 dark:border-gray-800 fixed w-full top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <button 
              onClick={handleGoHome}
              className="flex items-center hover:opacity-80 transition-opacity duration-200"
              aria-label="Ir para página inicial"
            >
              <img 
                src="/logo criado pelo Chatgpt.png" 
                alt="Rifaqui Logo" 
                className="w-11 h-11 object-contain"
              />
              <span className="ml-2 text-2xl font-bold text-gray-900 dark:text-white">Rifaqui</span>
            </button>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Alternar tema"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            
            <button 
              onClick={handleGoBack}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 font-medium"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">{backButtonText.full}</span>
              <span className="sm:hidden">{backButtonText.short}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AuthHeader;