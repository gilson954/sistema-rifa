import React from 'react';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleRegisterClick = () => {
    navigate('/register');
  };

  const handleGoHome = () => {
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  const scrollToSection = (sectionId: string) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsMenuOpen(false);
  };

  if (user && location.pathname === '/') {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 w-full z-50 transition-all duration-300 bg-transparent backdrop-blur-md">
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

          {/* Desktop Navigation */}
          {!user && (
            <nav className="hidden md:flex space-x-8">
              <button 
                onClick={() => scrollToSection('como-funciona')}
                className="text-white hover:text-purple-400 transition-colors duration-300 font-medium"
              >
                Como Funciona
              </button>
              <button 
                onClick={() => scrollToSection('funcionalidades')}
                className="text-white hover:text-purple-400 transition-colors duration-300 font-medium"
              >
                Funcionalidades
              </button>
              <button 
                onClick={() => scrollToSection('duvidas')}
                className="text-white hover:text-purple-400 transition-colors duration-300 font-medium"
              >
                Dúvidas
              </button>
            </nav>
          )}

          {/* Theme Toggle and Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 text-white hover:text-purple-400 transition-colors duration-200 rounded-lg"
              aria-label="Alternar tema"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            
            {/* Action Buttons (login, register) */}
            {!user && (
              <>
                <button 
                  onClick={handleRegisterClick}
                  className="text-white hover:text-purple-400 px-4 py-2 rounded-lg font-medium transition-colors duration-200 hover:bg-purple-600"
                >
                  Criar conta
                </button>
                <button 
                  onClick={handleLoginClick}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium"
                >
                  Entrar
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          {!user && (
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-white hover:text-purple-400 transition-colors duration-200"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        {!user && isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex flex-col space-y-4">
              <button 
                onClick={() => scrollToSection('como-funciona')}
                className="text-white hover:text-purple-400 transition-colors duration-200 font-medium text-left"
              >
                Como Funciona
              </button>
              <button 
                onClick={() => scrollToSection('funcionalidades')}
                className="text-white hover:text-purple-400 transition-colors duration-200 font-medium text-left"
              >
                Funcionalidades
              </button>
              <button 
                onClick={() => scrollToSection('duvidas')}
                className="text-white hover:text-purple-400 transition-colors duration-200 font-medium text-left"
              >
                Dúvidas
              </button>
              <div className="flex flex-col space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <button
                    onClick={toggleTheme}
                    className="p-2 text-white hover:text-purple-400 transition-colors duration-200 rounded-lg"
                    aria-label="Alternar tema"
                  >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                  </button>
                </div>
                <button 
                  onClick={() => {
                    navigate('/my-tickets');
                    setIsMenuOpen(false);
                  }}
                  className="text-white hover:text-purple-400 px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-left hover:bg-gray-800"
                >
                  Minhas cotas
                </button>
                <button 
                  onClick={handleRegisterClick}
                  className="text-white hover:text-purple-400 px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-left hover:bg-purple-600"
                >
                  Criar conta
                </button>
                <button 
                  onClick={handleLoginClick}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium text-left"
                >
                  Entrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
