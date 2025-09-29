import React, { useState, useEffect } from 'react';
import { Bell, Sun, Moon, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const DashboardHeader = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<{ name: string } | null>(null);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id);

        if (data && data.length > 0) {
          setProfile(data[0]);
        }
      };

      fetchProfile();
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // Definir título com base na rota atual
  const getTitle = () => {
    if (location.pathname.includes('campanhas')) return 'Visão geral das suas campanhas';
    if (location.pathname.includes('pagamento')) return 'Gerenciar métodos de pagamento';
    if (location.pathname.includes('ranking')) return 'Ranking de vendedores';
    if (location.pathname.includes('afiliacoes')) return 'Programa de afiliações';
    if (location.pathname.includes('redes-sociais')) return 'Conexões com redes sociais';
    if (location.pathname.includes('pixels')) return 'Pixels e Analytics';
    if (location.pathname.includes('personalizacao')) return 'Personalização da página';
    if (location.pathname.includes('conta')) return 'Minha conta';
    if (location.pathname.includes('tutoriais')) return 'Tutoriais e ajuda';
    return 'Painel';
  };

  return (
    <div className="m-4 sm:m-6 rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200/20 dark:border-gray-800/30 bg-white/60 dark:bg-gray-900/50 backdrop-blur-sm flex items-center justify-between transition-colors duration-300">
      {/* Título dinâmico */}
      <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
        {getTitle()}
      </h1>
      
      {/* Ações */}
      <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
        <button className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors duration-200">
          <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-600 rounded-full"></span>
        </button>
        
        <button
          onClick={toggleTheme}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors duration-200"
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5 sm:h-6 sm:w-6" />
          ) : (
            <Sun className="h-5 w-5 sm:h-6 sm:w-6" />
          )}
        </button>

        <button
          onClick={handleSignOut}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
          title="Sair"
        >
          <LogOut className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;
