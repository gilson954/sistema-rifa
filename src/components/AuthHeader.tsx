import React from 'react';
import { Sun, Moon, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

interface AuthHeaderProps {
  backTo?: 'home' | 'login';
}

const AuthHeader: React.FC<AuthHeaderProps> = ({ backTo = 'home' }) => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

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

  const backButtonText =
    backTo === 'login'
      ? { full: 'Voltar para login', short: 'Voltar' }
      : { full: 'Voltar para o início', short: 'Voltar' };

  return (
    <header className="fixed top-0 left-0 w-full z-50 transition-all duration-300 bg-black/50 backdrop-blur-md border-b border-gray-700/50">
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
                src="/logo-chatgpt.png"
                alt="Rifaqui Logo"
                className="w-14 h-14 object-contain"
              />
              <span className="ml-2 text-2xl font-bold text-white">Rifaqui</span>
            </button>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-white hover:text-purple-400 transition-colors duration-200 rounded-lg"
              aria-label="Alternar tema"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {/* Back button */}
            <button
              onClick={handleGoBack}
              className="flex items-center space-x-2 text-white hover:text-purple-400 transition-colors duration-200 font-medium"
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
