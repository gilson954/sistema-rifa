import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  onMyTicketsClick?: () => void;
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
  onMyTicketsClick
}) => {
  const navigate = useNavigate();
  const { isPhoneAuthenticated, phoneUser, signOut } = useAuth();

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
    await signOut();
    navigate('/');
  };

  const handleMyTicketsClick = () => {
    if (onMyTicketsClick) {
      onMyTicketsClick();
    }
  };

  const themeClasses = campaignTheme === 'escuro' || campaignTheme === 'escuro-preto' ? 'bg-black' : 'bg-white dark:bg-gray-900';
  const borderClass = campaignTheme === 'claro' ? 'border-gray-200' : 'border-gray-800';

  return (
    <header className={`shadow-sm border-b ${borderClass} ${themeClasses}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={handleLogoClick}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200"
          >
            {logoUrl ? (
              colorMode === 'gradient' ? (
                <div
                  className={getColorClassName() + " p-1 rounded-lg shadow-md"}
                  style={getColorStyle()}
                >
                  <img
                    src={logoUrl}
                    alt="Logo do organizador"
                    className="h-14 w-auto max-w-[180px] object-contain bg-white dark:bg-gray-800 rounded-md"
                  />
                </div>
              ) : (
                <img
                  src={logoUrl}
                  alt="Logo do organizador"
                  className="h-16 w-auto max-w-[180px] object-contain shadow-md rounded-lg"
                />
              )
            ) : (
              <>
                <img
                  src="/logo-chatgpt.png"
                  alt="Rifaqui Logo"
                  className="w-10 h-10 object-contain"
                />
                <span className="ml-2 text-2xl font-bold text-gray-900 dark:text-white">Rifaqui</span>
              </>
            )}
          </button>

          <div className="flex items-center space-x-2">
            {isPhoneAuthenticated ? (
              <>
                <button
                  onClick={handleMyTicketsClick}
                  className={`text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg hover:scale-105 ${getColorClassName()}`}
                  style={getColorStyle()}
                >
                  <Ticket className="h-4 w-4" />
                  <span className="hidden sm:inline">Minhas Cotas</span>
                  <span className="sm:hidden">Cotas</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                  title="Sair"
                >
                  <LogOut className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              </>
            ) : (
              <button
                onClick={handleMyTicketsClick}
                className={`text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg hover:scale-105 ${getColorClassName()}`}
                style={getColorStyle()}
              >
                <Ticket className="h-4 w-4" />
                <span className="hidden sm:inline">Ver Minhas Cotas</span>
                <span className="sm:hidden">Cotas</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default CampaignHeader;
