import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Ticket } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CampaignHeaderProps {
  logoUrl?: string;
  organizerName?: string;
  organizerId?: string;
  primaryColor?: string;
  colorMode?: string;
  gradientClasses?: string;
  customGradientColors?: string;
  campaignTheme?: string;
  hideMyTicketsButton?: boolean;
  campaignId?: string;
}

const CampaignHeader: React.FC<CampaignHeaderProps> = ({
  logoUrl,
  organizerName,
  organizerId,
  primaryColor = '#3B82F6',
  colorMode = 'solid',
  gradientClasses,
  customGradientColors,
  campaignTheme = 'claro',
  hideMyTicketsButton = false,
  campaignId
}) => {
  const navigate = useNavigate();
  const { isPhoneAuthenticated, phoneUser, signOut } = useAuth();

  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case 'claro':
        return {
          headerBg: 'bg-white',
          borderClass: 'border-gray-200',
          userBadgeBg: 'bg-gray-100',
          userBadgeText: 'text-gray-900',
          userBadgeBorder: 'border-gray-200',
          logoText: 'text-gray-900'
        };
      case 'escuro':
        return {
          headerBg: 'bg-black',
          borderClass: 'border-[#101625]',
          userBadgeBg: 'bg-slate-700',
          userBadgeText: 'text-white',
          userBadgeBorder: 'border-gray-700',
          logoText: 'text-white'
        };
      case 'escuro-preto':
        return {
          headerBg: 'bg-[#161b26]',
          borderClass: 'border-gray-700',
          userBadgeBg: 'bg-gray-800',
          userBadgeText: 'text-white',
          userBadgeBorder: 'border-gray-700',
          logoText: 'text-white'
        };
      case 'escuro-cinza':
        return {
          headerBg: 'bg-[#141414]',
          borderClass: 'border-[#3A3A3A]',
          userBadgeBg: 'bg-[#1A1A1A]',
          userBadgeText: 'text-white',
          userBadgeBorder: 'border-[#3A3A3A]',
          logoText: 'text-white'
        };
      default:
        return {
          headerBg: 'bg-white',
          borderClass: 'border-gray-200',
          userBadgeBg: 'bg-gray-100',
          userBadgeText: 'text-gray-900',
          userBadgeBorder: 'border-gray-200',
          logoText: 'text-gray-900'
        };
    }
  };

  const themeStyles = getThemeClasses(campaignTheme);

  const getCustomGradientStyle = () => {
    if (!customGradientColors) return {};

    try {
      const colors = JSON.parse(customGradientColors);
      if (Array.isArray(colors) && colors.length >= 2) {
        return {
          backgroundImage: `linear-gradient(135deg, ${colors.join(', ')})`,
          backgroundSize: '200% 200%'
        };
      }
    } catch (e) {
      console.error('Error parsing custom gradient colors:', e);
    }
    return {};
  };

  const getColorStyle = () => {
    if (colorMode === 'gradient') {
      if (gradientClasses === 'custom') {
        return getCustomGradientStyle();
      }
      return {};
    }
    return { backgroundColor: primaryColor };
  };

  const getColorClassName = () => {
    if (colorMode === 'gradient') {
      if (gradientClasses === 'custom') {
        return 'animate-gradient-x bg-[length:200%_200%]';
      }
      return `bg-gradient-to-r ${gradientClasses} animate-gradient-x bg-[length:200%_200%]`;
    }
    return '';
  };

  const handleLogoClick = () => {
    if (organizerId) {
      navigate(`/org/${organizerId}`);
    } else {
      navigate('/');
    }
  };

  const handleLogout = async () => {
    try {
      // Limpar autenticação por telefone
      await signOut();
      
      // Limpar localStorage relacionado à autenticação
      localStorage.removeItem('phoneUser');
      localStorage.removeItem('isPhoneAuthenticated');
      
      // Forçar reload da página para garantir limpeza completa do estado
      if (organizerId) {
        window.location.href = `/org/${organizerId}`;
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Mesmo com erro, tenta limpar e redirecionar
      localStorage.removeItem('phoneUser');
      localStorage.removeItem('isPhoneAuthenticated');
      window.location.href = '/';
    }
  };

  const handleMyTicketsClick = () => {
    // SEMPRE navega para a página, nunca abre modal
    // Passa o contexto da campanha se disponível
    navigate('/my-tickets', {
      state: {
        campaignId,
        organizerId
      }
    });
  };

  return (
    <header className={`shadow-sm border-b ${themeStyles.borderClass} ${themeStyles.headerBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <button
            onClick={handleLogoClick}
            className="flex items-center hover:opacity-80 transition-opacity duration-200"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo do organizador"
                className="h-10 sm:h-14 w-auto max-w-[150px] sm:max-w-[200px] object-contain"
              />
            ) : (
              <div className="flex items-center">
                <Ticket className="h-6 sm:h-8 w-6 sm:w-8 text-blue-600" />
                <span className={`ml-2 text-lg sm:text-xl font-bold ${themeStyles.logoText}`}>
                  Rifaqui
                </span>
              </div>
            )}
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            {isPhoneAuthenticated && phoneUser && (
              <div className={`hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg border ${themeStyles.userBadgeBg} ${themeStyles.userBadgeText} ${themeStyles.userBadgeBorder}`}>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm font-medium">
                  {phoneUser.name}
                </span>
              </div>
            )}
            {!hideMyTicketsButton && (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleMyTicketsClick}
                  className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 text-white rounded-lg font-medium text-sm transition-all duration-200 shadow-md ${getColorClassName()}`}
                  style={getColorStyle()}
                >
                  <Ticket className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                  <span className="hidden sm:inline">
                    {isPhoneAuthenticated ? 'Minhas Cotas' : 'Ver Minhas Cotas'}
                  </span>
                  <span className="sm:hidden">Cotas</span>
                </motion.button>
                {isPhoneAuthenticated && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    className="flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-all duration-200 shadow-md"
                  >
                    <LogOut className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                    <span className="hidden sm:inline">Sair</span>
                  </motion.button>
                )}
              </>
            )}
            {hideMyTicketsButton && isPhoneAuthenticated && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-all duration-200 shadow-md"
              >
                <LogOut className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                <span className="hidden sm:inline">Sair</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default CampaignHeader;