import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Calendar, Users, ChevronLeft, ChevronRight, Ticket } from 'lucide-react';
import { CampaignAPI } from '../lib/api/campaigns';
import { Campaign } from '../types/campaign';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/currency';
import CampaignFooter from '../components/CampaignFooter';
import PhoneLoginModal from '../components/PhoneLoginModal';
import SocialMediaFloatingMenu from '../components/SocialMediaFloatingMenu';
import { useAuth } from '../context/AuthContext';

interface OrganizerProfile {
  id: string;
  name: string;
  avatar_url?: string;
  logo_url?: string;
  social_media_links?: any;
  payment_integrations_config?: any;
  primary_color?: string;
  theme?: string;
  color_mode?: string;
  gradient_classes?: string;
  custom_gradient_colors?: string;
}

const OrganizerHomePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user, isPhoneAuthenticated } = useAuth();
  const [featuredCampaign, setFeaturedCampaign] = useState<Campaign | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [organizerProfile, setOrganizerProfile] = useState<OrganizerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const campaignsPerPage = 10;

  useEffect(() => {
    const loadOrganizerData = async () => {
      if (!userId) return;

      setLoading(true);
      try {
        const { data: profile } = await supabase
          .from('public_profiles_view')
          .select('id, name, avatar_url, logo_url, social_media_links, payment_integrations_config, primary_color, theme, color_mode, gradient_classes, custom_gradient_colors')
          .eq('id', userId)
          .maybeSingle();

        if (profile) {
          setOrganizerProfile(profile);
        }

        const { data: featured } = await CampaignAPI.getFeaturedCampaign(userId);
        setFeaturedCampaign(featured);

        const { data: allCampaigns } = await CampaignAPI.getOrganizerPublicCampaigns(userId, false);

        if (allCampaigns && featured) {
          const filteredCampaigns = allCampaigns.filter(c => c.id !== featured.id);
          setCampaigns(filteredCampaigns);
        } else {
          setCampaigns(allCampaigns || []);
        }
      } catch (error) {
        console.error('Error loading organizer data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrganizerData();
  }, [userId]);

  // useEffect para atualizar o favicon dinamicamente
  useEffect(() => {
    const faviconLink = document.querySelector("link[rel='icon']") as HTMLLinkElement;
    
    if (organizerProfile?.logo_url) {
      // Se há logo do organizador, usar ele
      if (faviconLink) {
        faviconLink.href = organizerProfile.logo_url;
      } else {
        const newFavicon = document.createElement('link');
        newFavicon.rel = 'icon';
        newFavicon.href = organizerProfile.logo_url;
        document.head.appendChild(newFavicon);
      }
    } else {
      // Se não há logo do organizador, restaurar o padrão
      if (faviconLink) {
        faviconLink.href = '/logo-chatgpt.png';
      }
    }

    // Cleanup: restaurar favicon padrão ao desmontar
    return () => {
      const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (favicon) {
        favicon.href = '/logo-chatgpt.png';
      }
    };
  }, [organizerProfile]);

  // useEffect para atualizar o título da página dinamicamente
  useEffect(() => {
    // Sempre exibir apenas "Campanhas"
    document.title = 'Campanhas';

    // Cleanup: restaurar título padrão quando o componente desmontar
    return () => {
      document.title = 'Rifaqui';
    };
  }, []);

  const getCustomGradientStyle = (customColorsJson: string) => {
    try {
      const colors = JSON.parse(customColorsJson);
      if (Array.isArray(colors) && colors.length >= 2) {
        if (colors.length === 2) {
          return `linear-gradient(90deg, ${colors[0]}, ${colors[1]})`;
        } else if (colors.length === 3) {
          return `linear-gradient(90deg, ${colors[0]}, ${colors[1]}, ${colors[2]})`;
        }
      }
    } catch (error) {
      console.error('Error parsing custom gradient colors:', error);
    }
    return null;
  };

  const getColorStyle = (isBackground: boolean = true, isText: boolean = false) => {
    const colorMode = organizerProfile?.color_mode || 'solid';
    const primaryColor = organizerProfile?.primary_color || '#3B82F6';

    if (colorMode === 'gradient') {
      const gradientClasses = organizerProfile?.gradient_classes;
      const customGradientColors = organizerProfile?.custom_gradient_colors;

      if (gradientClasses === 'custom' && customGradientColors) {
        const gradientStyle = getCustomGradientStyle(customGradientColors);
        if (gradientStyle) {
          return {
            background: gradientStyle,
            backgroundSize: '200% 200%',
            ...(isText && {
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent'
            })
          };
        }
      }

      if (isText) {
        return {
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          color: 'transparent'
        };
      }
      return {};
    }

    if (isText) {
      return { color: primaryColor };
    }

    return isBackground ? { backgroundColor: primaryColor } : { color: primaryColor };
  };

  const getColorClassName = (baseClasses: string = '') => {
    const colorMode = organizerProfile?.color_mode || 'solid';

    if (colorMode === 'gradient') {
      const gradientClasses = organizerProfile?.gradient_classes;
      const customGradientColors = organizerProfile?.custom_gradient_colors;

      if (gradientClasses === 'custom' && customGradientColors) {
        return `${baseClasses} animate-gradient-x bg-[length:200%_200%]`;
      }

      if (gradientClasses && gradientClasses !== 'custom') {
        return `${baseClasses} bg-gradient-to-r ${gradientClasses} animate-gradient-x bg-[length:200%_200%]`;
      }
    }

    return baseClasses;
  };

  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case 'claro':
        return {
          background: 'bg-gray-50',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          cardBg: 'bg-white',
          border: 'border-gray-200'
        };
      case 'escuro':
        return {
          background: 'bg-slate-900',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          cardBg: 'bg-slate-800',
          border: 'border-slate-700'
        };
      case 'escuro-preto':
        return {
          background: 'bg-black',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          cardBg: 'bg-gray-900',
          border: 'border-gray-800'
        };
    case 'escuro-cinza':
      return {
        background: 'bg-[#1A1A1A]',
        text: 'text-white',
        textSecondary: 'text-gray-400',
        cardBg: 'bg-[#2C2C2C]',
        border: 'border-gray-1000'
      };
      default:
        return {
          background: 'bg-gray-50',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          cardBg: 'bg-white',
          border: 'border-gray-200'
        };
    }
  };

  const handleCampaignClick = (publicId: string | null) => {
    if (publicId) {
      navigate(`/c/${publicId}`);
    }
  };

  const handleMyTicketsClick = () => {
    if (isPhoneAuthenticated) {
      navigate('/my-tickets', {
        state: {
          organizerId: userId
        }
      });
    } else {
      setIsPhoneModalOpen(true);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const organizerTheme = organizerProfile?.theme || 'claro';
  const themeClasses = getThemeClasses(organizerTheme);
  const primaryColor = organizerProfile?.primary_color || '#3B82F6';

  const totalPages = Math.max(1, Math.ceil(campaigns.length / campaignsPerPage));
  const paginatedCampaigns = campaigns.slice(
    (currentPage - 1) * campaignsPerPage,
    currentPage * campaignsPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${themeClasses.background} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{ borderColor: primaryColor }}></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses.background} transition-colors duration-300`}>
      <header className={`shadow-sm border-b ${themeClasses.border} ${organizerTheme === 'escuro' ? 'bg-black' : themeClasses.cardBg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              {organizerProfile?.logo_url ? (
                <img
                  src={organizerProfile.logo_url}
                  alt="Logo do organizador"
                  className="h-16 w-auto max-w-[200px] object-contain shadow-md rounded-lg"
                />
              ) : (
                <div className="flex items-center">
                  <img
                    src="/logo-chatgpt.png"
                    alt="Rifaqui Logo"
                    className="w-10 h-10 object-contain"
                  />
                  <span className="ml-2 text-2xl font-bold text-gray-900 dark:text-white">Rifaqui</span>
                </div>
              )}
            </div>
            <div className="flex items-center">
              <button
                onClick={handleMyTicketsClick}
                className={getColorClassName("text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg hover:scale-105")}
                style={getColorStyle(true, false)}
              >
                <Ticket className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {isPhoneAuthenticated ? 'Minhas Cotas' : 'Ver Minhas Cotas'}
                </span>
                <span className="sm:hidden">Cotas</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {featuredCampaign && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <h2 className={`text-xl font-bold ${themeClasses.text} mb-4 flex items-center gap-2`}>
              <Trophy className="h-6 w-6 text-yellow-500" />
              Campanha em Destaque
            </h2>
            <motion.div
              whileHover={{ 
                y: -12,
                scale: 1.02,
                transition: { duration: 0.3 }
              }}
              onClick={() => handleCampaignClick(featuredCampaign.public_id)}
              className={`${themeClasses.cardBg} rounded-2xl border ${themeClasses.border} overflow-hidden cursor-pointer ${
                organizerTheme === 'claro' 
                  ? 'shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3),0_10px_30px_-10px_rgba(0,0,0,0.2)]' 
                  : 'shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7),0_10px_30px_-10px_rgba(0,0,0,0.5)]'
              } hover:shadow-[0_30px_80px_-15px_rgba(0,0,0,0.4),0_15px_40px_-10px_rgba(0,0,0,0.3)]`}
            >
              <div className="relative h-[400px] sm:h-[500px]">
                <img
                  src={featuredCampaign.prize_image_urls?.[0] || 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=1200'}
                  alt={featuredCampaign.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  <h3 className="text-2xl sm:text-4xl font-bold text-white mb-4 drop-shadow-lg">
                    {featuredCampaign.title}
                  </h3>

                  {featuredCampaign.show_draw_date && featuredCampaign.draw_date && (
                    <div className="flex flex-wrap gap-3 mb-4">
                      <div className={`flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg`}>
                        <Calendar className="h-5 w-5 text-white" />
                        <span className="text-white font-medium text-sm">
                          {formatDate(featuredCampaign.draw_date)}
                        </span>
                      </div>
                    </div>
                  )}

                  <motion.button
                    className={getColorClassName("w-[180px] px-6 py-2 rounded-lg font-bold text-lg text-white shadow-lg pointer-events-none")}
                    style={getColorStyle(true)}
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    {featuredCampaign.status === 'active' ? 'Adquira Já!' : 'Concluída'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.section>
        )}

        {campaigns.length > 0 && (
          <section>
            <h2 className={`text-xl font-bold ${themeClasses.text} mb-6`}>
              Mais Campanhas
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5 mb-8">
              {paginatedCampaigns.map((campaign, index) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ 
                    y: -6,
                    scale: 1.03,
                    transition: { duration: 0.3 }
                  }}
                  onClick={() => handleCampaignClick(campaign.public_id)}
                  className={`${themeClasses.cardBg} rounded-xl border ${themeClasses.border} overflow-hidden cursor-pointer ${
                    organizerTheme === 'claro'
                      ? 'shadow-[0_8px_30px_-8px_rgba(0,0,0,0.2),0_4px_15px_-4px_rgba(0,0,0,0.12)]'
                      : 'shadow-[0_8px_30px_-8px_rgba(0,0,0,0.6),0_4px_15px_-4px_rgba(0,0,0,0.4)]'
                  } hover:shadow-[0_15px_45px_-10px_rgba(0,0,0,0.3),0_8px_22px_-6px_rgba(0,0,0,0.2)] transition-all duration-300`}
                >
                  <div className="relative h-32 sm:h-40 lg:h-44 overflow-hidden">
                    <motion.img
                      src={campaign.prize_image_urls?.[0] || 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=600'}
                      alt={campaign.title}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.4 }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />
                  </div>

                  <div className="p-3 sm:p-4">
                    <h3 className={`text-xs sm:text-sm font-bold ${themeClasses.text} mb-2 text-center line-clamp-2 min-h-[32px] sm:min-h-[36px] leading-tight`}>
                      {campaign.title}
                    </h3>

                    <div className="flex items-center justify-center mb-3">
                      <span className={`text-base sm:text-lg lg:text-xl font-bold ${themeClasses.text}`}>
                        {formatCurrency(campaign.ticket_price)}
                      </span>
                    </div>

                    <motion.button
                      className={getColorClassName("w-full px-3 py-2 rounded-lg font-bold text-xs sm:text-sm text-white shadow-md pointer-events-none")}
                      style={getColorStyle(true)}
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {campaign.status === 'active' ? 'Adquira Já!' : 'Concluída'}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>

            {totalPages > 1 && (
              <div 
                className={`flex items-center justify-center gap-4 p-4 rounded-xl ${themeClasses.cardBg} border ${themeClasses.border} ${
                  organizerTheme === 'claro' ? 'shadow-lg' : 'shadow-2xl'
                }`}
              >
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" style={{ color: primaryColor }} />
                </button>

                <span className={`font-semibold ${themeClasses.text}`}>
                  Página {currentPage} de {totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" style={{ color: primaryColor }} />
                </button>
              </div>
            )}
          </section>
        )}

        {!featuredCampaign && campaigns.length === 0 && (
          <div className="text-center py-20">
            <Trophy className="h-16 w-16 mx-auto mb-4 opacity-50" style={{ color: primaryColor }} />
            <h2 className={`text-2xl font-bold ${themeClasses.text} mb-2`}>
              Nenhuma campanha disponível
            </h2>
            <p className={themeClasses.textSecondary}>
              Este organizador ainda não possui campanhas ativas.
            </p>
          </div>
        )}
      </main>

      {/* Botão Flutuante de Redes Sociais */}
      <SocialMediaFloatingMenu
        socialMediaLinks={organizerProfile?.social_media_links}
        whatsappSupport={organizerProfile?.payment_integrations_config?.whatsapp_number}
        whatsappGroup={organizerProfile?.social_media_links?.whatsapp_group}
        primaryColor={organizerProfile?.primary_color}
        colorMode={organizerProfile?.color_mode}
        gradientClasses={organizerProfile?.gradient_classes}
        customGradientColors={organizerProfile?.custom_gradient_colors}
        animatedGradient={true}
      />

      <PhoneLoginModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        primaryColor={organizerProfile?.primary_color}
        colorMode={organizerProfile?.color_mode}
        gradientClasses={organizerProfile?.gradient_classes}
        customGradientColors={organizerProfile?.custom_gradient_colors}
        campaignTheme={organizerTheme}
        organizerId={userId}
      />

      <CampaignFooter campaignTheme={organizerTheme} />
    </div>
  );
};

export default OrganizerHomePage;