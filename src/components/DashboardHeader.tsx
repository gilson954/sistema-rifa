// src/components/DashboardHeader.tsx
import React from 'react';
import { Bell, Sun, Moon, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
 

const DashboardHeader: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // Títulos baseados nas rotas do sidebar (verifique se as rotas no Sidebar são exatamente essas)
  const getTitle = (): string => {
    const p = location.pathname;

    // rotas específicas primeiro
    if (p.startsWith('/dashboard/integrations')) return 'Gerenciar métodos de pagamento';
    if (p.startsWith('/dashboard/ranking')) return 'Ranking';
    if (p.startsWith('/dashboard/affiliations')) return 'Programa de afiliações';
    if (p.startsWith('/dashboard/social-media')) return 'Conexões com redes sociais';
    if (p.startsWith('/dashboard/analytics')) return 'Pixels e Analytics';
    if (p.startsWith('/dashboard/customize')) return 'Personalização da página';
    if (p.startsWith('/dashboard/account')) return 'Minha conta';
    if (p.startsWith('/dashboard/tutorials')) return 'Tutoriais e ajuda';

    // páginas relacionadas a campanhas (criação, detalhe, vendas, etc.)
    if (p.startsWith('/dashboard/create-campaign')) return 'Criar campanha';
    if (p.startsWith('/dashboard/campaigns')) return 'Campanhas';

    // rota principal do dashboard
    if (p === '/dashboard' || p === '/dashboard/') return 'Visão geral das suas campanhas';

    // fallback
    return 'Painel';
  };

  return (
    <div className="m-4 sm:m-6 rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200/20 dark:border-gray-800/30 bg-white/60 dark:bg-gray-900/50 backdrop-blur-sm flex items-center justify-between transition-colors duration-300">
      {/* Título dinâmico conforme rota */}
      <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
        {getTitle()}
      </h1>

      {/* Ações (sem avatar "G") */}
      <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
        <button
          aria-label="Notificações"
          className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors duration-200"
        >
          <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-600 rounded-full" />
        </button>

        <button
          aria-label="Alternar tema"
          onClick={toggleTheme}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors duration-200"
        >
          {theme === 'light' ? <Moon className="h-5 w-5 sm:h-6 sm:w-6" /> : <Sun className="h-5 w-5 sm:h-6 sm:w-6" />}
        </button>

        <button
          aria-label="Sair"
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
