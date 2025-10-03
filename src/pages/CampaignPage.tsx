import React, { useState, useCallback, useEffect } from 'react';
import { 
  Share2, 
  Calendar, 
  Users, 
  Trophy, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Gift,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // ADICIONADO: Framer Motion
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCampaignByPublicId, useCampaignByCustomDomain } from '../hooks/useCampaigns';
import { useTickets } from '../hooks/useTickets';
import QuotaGrid from '../components/QuotaGrid';
import QuotaSelector from '../components/QuotaSelector';
import ReservationModal, { CustomerData } from '../components/ReservationModal';
import { Promotion } from '../types/promotion';
import { formatCurrency } from '../utils/currency';
import { calculateTotalWithPromotions } from '../utils/currency';
import { socialMediaConfig, shareSectionConfig } from '../components/SocialMediaIcons';
import { supabase } from '../lib/supabase';

interface PromotionInfo {
  promotion: Promotion;
  originalTotal: number;
  promotionalTotal: number;
  savings: number;
  discountPercentage: number;
}

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

/* Helper para formatar números com separadores de milhares */
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('pt-BR').format(num);
};

// VARIANTS DE ANIMAÇÃO PARA O SLIDESHOW
const slideVariants = {
  enter: (direction: number) => ({
    // Entra da direita se 'direction' for 1 (próximo), ou da esquerda se for -1 (anterior)
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }),
  center: {
    x: 0, // Posição central (onde a imagem fica)
    opacity: 1,
    transition: {
      duration: 0.2
    }
  },
  exit: (direction: number) => ({
    // Sai para a esquerda se 'direction' for 1 (próximo), ou para a direita se for -1 (anterior)
    x: direction > 0 ? -300 : 300,
    opacity: 0,
    transition: {
      duration: 0.2
    }
  })
};


const CampaignPage = () => {
  const { publicId } = useParams<{ publicId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();

  const isValidDescription = (description: string): boolean => {
    if (!description || typeof description !== 'string') return false;
    
    const textContent = description
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();
    
    return textContent.length > 0;
  };
  
  const developmentHosts = [
    'localhost',
    '127.0.0.1',
    'netlify.app',
    'stackblitz.io',
    'stackblitz.com', 
    'webcontainer.io',
    'webcontainer-api.io'
  ];
  
  const isDevelopmentHost = developmentHosts.some(host => 
    window.location.hostname === host || window.location.hostname.includes(host)
  );
  
  const isCustomDomain = !isDevelopmentHost && publicId;
  
  const { campaign: campaignByPublicId, loading: loadingByPublicId, error: errorByPublicId } = useCampaignByPublicId(publicId || '');
  const { campaign: campaignByDomain, loading: loadingByDomain, error: errorByDomain } = useCampaignByCustomDomain(
    isCustomDomain ? window.location.hostname : ''
  );
  
  const campaign = isCustomDomain ? campaignByDomain : campaignByPublicId;
  const loading = isCustomDomain ? loadingByDomain : loadingByPublicId;
  const error = isCustomDomain ? errorByDomain : errorByDomain;

  const isCampaignAvailable = campaign?.status === 'active' && campaign?.is_paid !== false;

  const [organizerProfile, setOrganizerProfile] = useState<OrganizerProfile | null>(null);
  const [loadingOrganizer, setLoadingOrganizer] = useState(false);

  const {
    tickets,
    loading: ticketsLoading,
    error: ticketsError,
    reserveTickets,
    getAvailableTickets,
    reserving
  } = useTickets(campaign?.id || '');

  const [selectedQuotas, setSelectedQuotas] = useState<number[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [activeFilter, setActiveFilter] = useState<'all' | 'available' | 'reserved' | 'purchased' | 'my-numbers'>('all');
  
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [reservationCustomerData, setReservationCustomerData] = useState<CustomerData | null>(null);
  const [reservationQuotas, setReservationQuotas] = useState<number[]>([]);
  const [reservationTotalValue, setReservationTotalValue] = useState(0);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState<number | null>(null);
  
  // ESTADOS DE PAUSA ATUALIZADOS para implementar a pausa inteligente e manual
  const [isHoverPaused, setIsHoverPaused] = useState(false); // NOVO ESTADO: Pausa temporária por hover/touch
  const [isManualPaused, setIsManualPaused] = useState(false); // NOVO ESTADO: Pausa permanente por clique de navegação
  
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  
  const [direction, setDirection] = useState(1); // NOVO ESTADO: 1 para Próximo, -1 para Anterior

  // Auto-play carrossel de imagens a cada 6 segundos
  useEffect(() => {
    // O autoplay pausa se a navegação manual foi usada OU se o mouse/touch estiver sobre a imagem
    if (!campaign?.prize_image_urls || campaign.prize_image_urls.length <= 1 || isHoverPaused || isManualPaused) {
      return;
    }

    const interval = setInterval(() => {
      setDirection(1); // Auto-play sempre avança
      setCurrentImageIndex(prev => 
        prev === campaign.prize_image_urls!.length - 1 ? 0 : prev + 1
      );
    }, 6000); // 6 segundos

    return () => clearInterval(interval);
  }, [campaign?.prize_image_urls, isHoverPaused, isManualPaused]);

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

  const getColorClassName = (baseClasses: string = '', isText: boolean = false) => {
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

  useEffect(() => {
    if (campaign?.user_id) {
      const loadOrganizerProfile = async () => {
        setLoadingOrganizer(true);
        try {
          const { data, error } = await supabase
            .from('public_profiles_view')
            .select('id, name, avatar_url, logo_url, social_media_links, payment_integrations_config, primary_color, theme, color_mode, gradient_classes, custom_gradient_colors')
            .eq('id', campaign.user_id)
            .maybeSingle();
          
          if (error) {
            console.error('Error loading organizer profile:', error);
          } else {
            setOrganizerProfile(data);
          }
        } catch (error) {
          console.error('Error loading organizer profile:', error);
        } finally {
          setLoadingOrganizer(false);
        }
      };
      
      loadOrganizerProfile();
    }
  }, [campaign?.user_id]);

  const getBestPromotionForDisplay = useCallback((quotaCount: number): PromotionInfo | null => {
    if (!campaign?.promotions || !Array.isArray(campaign.promotions) || campaign.promotions.length === 0) {
      return null;
    }

    const applicablePromotions = campaign.promotions.filter(
      (promo: Promotion) => promo.ticketQuantity <= quotaCount
    );

    if (applicablePromotions.length === 0) {
      return null;
    }

    const applicablePromotion = applicablePromotions.reduce((best, current) => 
      current.ticketQuantity > best.ticketQuantity ? current : best
    );

    const originalTotal = quotaCount * campaign.ticket_price;
    
    const { total: promotionalTotal } = calculateTotalWithPromotions(
      quotaCount,
      campaign.ticket_price,
      campaign.promotions
    );
    
    const savings = originalTotal - promotionalTotal;
    const discountPercentage = Math.round((savings / originalTotal) * 100);

    return {
      promotion: applicablePromotion,
      originalTotal,
      promotionalTotal,
      savings,
      discountPercentage
    };
  }, [campaign?.promotions, campaign?.ticket_price]);

  const handleQuotaSelect = useCallback((quotaNumber: number) => {
    if (!campaign || campaign.campaign_model !== 'manual') return;

    const availableTickets = getAvailableTickets();
    const isAvailable = availableTickets.some(ticket => ticket.quota_number === quotaNumber);
    
    if (!isAvailable) return;

    setSelectedQuotas(prev => {
      if (prev.includes(quotaNumber)) {
        return prev.filter(q => q !== quotaNumber);
      } else {
        const newSelection = [...prev, quotaNumber];
        if (newSelection.length <= (campaign.max_tickets_per_purchase || 1000)) {
          return newSelection;
        }
        return prev;
      }
    });
  }, [campaign, getAvailableTickets]);

  const handleQuantityChange = useCallback((newQuantity: number) => {
    setQuantity(newQuantity);
  }, []);

  const handleReservationSubmit = useCallback(async (customerData: CustomerData) => {
    if (!campaign) {
      alert('Erro: dados da campanha não encontrados');
      return;
    }

    try {
      let quotasToReserve: number[] = [];

      if (campaign.campaign_model === 'manual') {
        if (selectedQuotas.length === 0) {
          alert('Selecione pelo menos uma cota para reservar');
          return;
        }
        quotasToReserve = selectedQuotas;
      } else {
        if (quantity <= 0) {
          alert('Selecione uma quantidade válida de cotas');
          return;
        }

        const availableTickets = getAvailableTickets();
        const availableQuotaNumbers = availableTickets.map(ticket => ticket.quota_number);

        if (availableQuotaNumbers.length < quantity) {
          alert(`Apenas ${availableQuotaNumbers.length} cotas disponíveis`);
          return;
        }

        const shuffled = [...availableQuotaNumbers].sort(() => 0.5 - Math.random());
        quotasToReserve = shuffled.slice(0, quantity);
      }

      const result = await reserveTickets(
        quotasToReserve,
        user?.id || null,
        customerData.name,
        customerData.email,
        `${customerData.countryCode} ${customerData.phoneNumber}`
      );
      
      if (result) {
        const { total: totalValue } = calculateTotalWithPromotions(
          quotasToReserve.length,
          campaign.ticket_price,
          campaign.promotions || []
        );

        setReservationCustomerData(customerData);
        setReservationQuotas(quotasToReserve);
        setReservationTotalValue(totalValue);

        setSelectedQuotas([]);
        setQuantity(Math.max(1, campaign.min_tickets_per_purchase || 1));

        navigate('/payment-confirmation', {
          state: {
            reservationData: {
              reservationId: `RES-${Date.now()}`,
              customerName: customerData.name,
              customerEmail: customerData.email,
              customerPhone: `${customerData.countryCode} ${customerData.phoneNumber}`,
              quotaCount: quotasToReserve.length,
              totalValue: totalValue,
              selectedQuotas: quotasToReserve,
              campaignTitle: campaign.title,
              campaignId: campaign.id,
              expiresAt: new Date(Date.now() + (campaign.reservation_timeout_minutes || 15) * 60 * 1000).toISOString()
            }
          }
        });
      }
    } catch (error) {
      console.error('Error during reservation:', error);
      alert('Erro ao reservar cotas. Tente novamente.');
    } finally {
      setShowReservationModal(false);
    }
  }, [campaign, user, selectedQuotas, quantity, getAvailableTickets, reserveTickets, navigate]);

  const handleOpenReservationModal = useCallback(() => {
    if (campaign?.campaign_model === 'manual' && selectedQuotas.length === 0) {
      alert('Selecione pelo menos uma cota para reservar');
      return;
    }

    if (campaign?.campaign_model === 'automatic' && quantity <= 0) {
      alert('Selecione uma quantidade válida de cotas');
      return;
    }

    setShowReservationModal(true);
  }, [user, campaign, selectedQuotas, quantity, navigate]);

  // NOVO: Handlers para Pausa Inteligente (Hover/Touch)
  const handleMouseEnter = () => {
    setIsHoverPaused(true);
  };

  const handleMouseLeave = () => {
    setIsHoverPaused(false);
  };

  const handlePreviousImage = () => {
    if (campaign?.prize_image_urls && campaign.prize_image_urls.length > 1) {
      setDirection(-1); // Define a direção para 'anterior'
      setIsManualPaused(true); // Pausa permanente ao navegar manualmente
      setCurrentImageIndex(prev => 
        prev === 0 ? campaign.prize_image_urls!.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    if (campaign?.prize_image_urls && campaign.prize_image_urls.length > 1) {
      setDirection(1); // Define a direção para 'próximo'
      setIsManualPaused(true); // Pausa permanente ao navegar manualmente
      setCurrentImageIndex(prev => 
        prev === campaign.prize_image_urls!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handleImageClick = (imageIndex: number) => {
    setFullscreenImageIndex(imageIndex);
  };

  const handleCloseFullscreen = () => {
    setFullscreenImageIndex(null);
    setTouchStartX(null);
    setTouchEndX(null);
  };

  const goToPreviousFullscreenImage = () => {
    if (fullscreenImageIndex === null || !campaign?.prize_image_urls) return;
    
    const totalImages = campaign.prize_image_urls.length;
    if (totalImages <= 1) return;
    
    setFullscreenImageIndex(prev => 
      prev === 0 ? totalImages - 1 : (prev || 0) - 1
    );
  };

  const goToNextFullscreenImage = () => {
    if (fullscreenImageIndex === null || !campaign?.prize_image_urls) return;
    
    const totalImages = campaign.prize_image_urls.length;
    if (totalImages <= 1) return;
    
    setFullscreenImageIndex(prev => 
      prev === totalImages - 1 ? 0 : (prev || 0) + 1
    );
  };

  useEffect(() => {
    if (fullscreenImageIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPreviousFullscreenImage();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNextFullscreenImage();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCloseFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenImageIndex]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;

    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNextFullscreenImage();
    } else if (isRightSwipe) {
      goToPreviousFullscreenImage();
    }

    setTouchStartX(null);
    setTouchEndX(null);
  };

  const getThemeClasses = (campaignTheme: string) => {
    switch (campaignTheme) {
      case 'claro':
        return { background: 'bg-gray-50', text: 'text-gray-900', textSecondary: 'text-gray-600', cardBg: 'bg-white', border: 'border-gray-200' };
      case 'escuro':
        return { background: 'bg-gray-950', text: 'text-white', textSecondary: 'text-gray-300', cardBg: 'bg-gray-900', border: 'border-gray-800' };
      case 'escuro-preto':
        return { background: 'bg-black', text: 'text-white', textSecondary: 'text-gray-300', cardBg: 'bg-gray-900', border: 'border-gray-800' };
      default:
        return { background: 'bg-gray-50', text: 'text-gray-900', textSecondary: 'text-gray-600', cardBg: 'bg-white', border: 'border-gray-200' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getProgressPercentage = () => {
    if (!campaign) return 0;
    return Math.round((campaign.sold_tickets / campaign.total_tickets) * 100);
  };

  const currentPromotionInfo = campaign?.campaign_model === 'manual' 
    ? getBestPromotionForDisplay(selectedQuotas.length) 
    : getBestPromotionForDisplay(quantity);

  const getCurrentTotalValue = () => {
    const currentQuantity = campaign?.campaign_model === 'manual' ? selectedQuotas.length : quantity;
    if (!campaign) return 0;

    const { total } = calculateTotalWithPromotions(
      currentQuantity,
      campaign.ticket_price,
      campaign.promotions || []
    );
    return total;
  };

  const getConfiguredPaymentMethods = () => {
    if (!organizerProfile?.payment_integrations_config) return [];
    
    const config = organizerProfile.payment_integrations_config;
    const methods = [];

    if (config.mercado_pago?.client_id || config.mercado_pago?.access_token) {
      methods.push({ name: 'Mercado Pago', icon: '💳', color: '#00B1EA' });
    }
    if (config.fluxsis?.api_key) {
      methods.push({ name: 'Fluxsis', icon: '💰', color: '#6366F1' });
    }
    if (config.pay2m?.api_key) {
      methods.push({ name: 'Pay2m', icon: '💸', color: '#10B981' });
    }
    if (config.pix_manual?.chave_pix) {
      methods.push({ name: 'Pix (Manual)', icon: '📱', color: '#10B981' });
    }

    return methods;
  };

  const primaryColor = organizerProfile?.primary_color || '#3B82F6';
  const campaignTheme = organizerProfile?.theme || 'claro';
  const themeClasses = getThemeClasses(campaignTheme);
  const organizerLogoUrl = organizerProfile?.logo_url;
  const organizerAvatarUrl = organizerProfile?.avatar_url;
  const organizerName = organizerProfile?.name;
  const paymentMethods = getConfiguredPaymentMethods();
  const currentTotalValue = getCurrentTotalValue();

  if (loading || loadingOrganizer) {
    // ... (Loading State JSX - Mantido o original)
    return (
      <div className={`min-h-screen flex items-center justify-center ${themeClasses.background}`}>
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2" style={getColorStyle(false, true)}></div>
      </div>
    );
  }

  if (error) {
    // ... (Error State JSX - Mantido o original)
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${themeClasses.background}`}>
        <div className={`text-center p-8 rounded-xl shadow-lg ${themeClasses.cardBg}`}>
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className={`text-2xl font-bold mb-2 ${themeClasses.text}`}>Erro ao Carregar Campanha</h2>
          <p className={themeClasses.textSecondary}>{error.message || 'Houve um problema ao buscar os dados da campanha.'}</p>
          <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            Voltar para a página inicial
          </button>
        </div>
      </div>
    );
  }

  if (!campaign) {
    // ... (Campaign Not Found State JSX - Mantido o original)
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${themeClasses.background}`}>
        <div className={`text-center p-8 rounded-xl shadow-lg ${themeClasses.cardBg}`}>
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <h2 className={`text-2xl font-bold mb-2 ${themeClasses.text}`}>Campanha Não Encontrada ou Indisponível</h2>
          <p className={themeClasses.textSecondary}>Verifique o link ou a campanha pode ter sido finalizada.</p>
          <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            Voltar para a página inicial
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses.background}`}>
      {/* Header (Mantido o original) */}
      <header className={`py-4 px-4 sm:px-6 sticky top-0 z-20 shadow-md ${themeClasses.cardBg}`}>
        {/* ... (Conteúdo do Header) ... */}
      </header>
      
      {/* Main Content */}
      <main className={`max-w-4xl mx-auto p-4 sm:p-6 ${themeClasses.background}`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Seção de Imagem (Carrossel) */}
          <section className="lg:order-1">
            <h1 className={`text-3xl font-extrabold mb-4 ${getColorClassName(themeClasses.text, true)}`} style={getColorStyle(false, true)}>
              {campaign.title}
            </h1>
            
            {campaign?.prize_image_urls && campaign.prize_image_urls.length > 0 && (
                <div 
                  className="relative w-full aspect-square overflow-hidden rounded-lg md:rounded-xl shadow-lg"
                  onMouseEnter={handleMouseEnter} // Pausa inteligente: mouse
                  onMouseLeave={handleMouseLeave} // Retoma
                  onTouchStart={handleMouseEnter} // Pausa inteligente: touch (início)
                  onTouchEnd={handleMouseLeave} // Retoma (fim)
                >
                  {/* AnimatePresence para a transição entre imagens */}
                  <AnimatePresence initial={false} custom={direction}>
                    <motion.img
                      key={currentImageIndex} // Key é crucial para Framer Motion animar a saída/entrada
                      src={campaign.prize_image_urls[currentImageIndex]}
                      alt={campaign.title}
                      className="absolute top-0 left-0 w-full h-full object-cover cursor-pointer"
                      onClick={() => handleImageClick(currentImageIndex)}
                      // Configurações de Animação
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      // Drag para navegação por swipe
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.5} // Sensibilidade do arraste
                      onDragEnd={(e, { offset, velocity }) => {
                        const swipeThreshold = 50;
                        if (offset.x < -swipeThreshold) {
                          handleNextImage(); // Swipe para a esquerda = Próximo
                        } else if (offset.x > swipeThreshold) {
                          handlePreviousImage(); // Swipe para a direita = Anterior
                        }
                        // A função handle*Image já chama setIsManualPaused(true)
                      }}
                    />
                  </AnimatePresence>

                  {/* Navegação Manual (Chevron Buttons) */}
                  {campaign.prize_image_urls.length > 1 && (
                    <>
                      {/* Botão Anterior */}
                      <button
                        onClick={handlePreviousImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-40 p-2 rounded-full text-white hover:bg-opacity-60 transition z-10"
                        aria-label="Imagem anterior"
                      >
                        <ChevronLeft size={24} />
                      </button>

                      {/* Botão Próximo */}
                      <button
                        onClick={handleNextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-40 p-2 rounded-full text-white hover:bg-opacity-60 transition z-10"
                        aria-label="Próxima imagem"
                      >
                        <ChevronRight size={24} />
                      </button>
                    </>
                  )}

                  {/* Indicadores (Dots) */}
                  {campaign.prize_image_urls.length > 1 && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 z-10">
                      {campaign.prize_image_urls.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setDirection(index > currentImageIndex ? 1 : -1);
                            setCurrentImageIndex(index);
                            setIsManualPaused(true); // Pausa permanente ao navegar pelos dots
                          }}
                          className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                            index === currentImageIndex ? 'bg-white' : 'bg-gray-400/70 hover:bg-gray-300'
                          }`}
                          style={index === currentImageIndex ? getColorStyle(true) : {}}
                          aria-label={`Ir para imagem ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
            )}

            {/* ... (Outras informações abaixo do carrossel) ... */}
          </section>

          {/* Seção de Compra e Detalhes */}
          <section className="lg:order-2 space-y-6">
            {/* Card de Preço e Ação (Mantido o original, exceto as funções que já foram atualizadas) */}
            <div className={`p-5 rounded-xl shadow-lg ${themeClasses.cardBg}`}>
              {/* ... (Conteúdo do Card de Preço) ... */}
              
              {/* Promotion Badge */}
              {currentPromotionInfo && (
                <div className="flex items-center space-x-2 mb-4 bg-yellow-100 p-2 rounded-lg text-yellow-800">
                  <Gift size={20} />
                  <span className="text-sm font-medium">
                    {currentPromotionInfo.promotion.title} (Economize {formatCurrency(currentPromotionInfo.savings)})
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-baseline mb-4">
                <p className={`${themeClasses.textSecondary} text-sm font-medium`}>Valor da cota:</p>
                <p className={`text-2xl font-bold ${themeClasses.text}`}>{formatCurrency(campaign.ticket_price)}</p>
              </div>

              {campaign.campaign_model === 'manual' ? (
                // Seleção de Cota Manual
                <div className="space-y-3">
                  <p className={themeClasses.textSecondary}>Selecione as cotas abaixo na grade.</p>
                  <div className="flex justify-between items-center text-sm">
                    <p className={themeClasses.text}>Cotas Selecionadas:</p>
                    <p className="font-semibold" style={getColorStyle(false, true)}>
                      {selectedQuotas.length}
                    </p>
                  </div>
                </div>
              ) : (
                // Seleção de Quantidade Automática
                <QuotaSelector
                  quantity={quantity}
                  min={campaign.min_tickets_per_purchase || 1}
                  max={campaign.max_tickets_per_purchase || 1000}
                  available={campaign.total_tickets - campaign.sold_tickets}
                  onChange={handleQuantityChange}
                  primaryColor={primaryColor}
                  campaignTheme={campaignTheme}
                  themeClasses={themeClasses}
                />
              )}

              {/* Linha de Total */}
              <div className="border-t border-dashed my-4 pt-4 flex justify-between items-center">
                <p className={`text-lg font-semibold ${themeClasses.text}`}>Total a Pagar:</p>
                <p className={`text-3xl font-extrabold`} style={getColorStyle(false, true)}>
                  {formatCurrency(currentTotalValue)}
                </p>
              </div>

              {/* Botão de Reserva */}
              <button
                onClick={handleOpenReservationModal}
                disabled={!isCampaignAvailable || (campaign.campaign_model === 'manual' && selectedQuotas.length === 0) || (campaign.campaign_model === 'automatic' && quantity === 0)}
                className={`w-full py-3 rounded-lg text-white text-lg font-bold transition-transform transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed ${getColorClassName('', false)}`}
                style={getColorStyle(true)}
              >
                {isCampaignAvailable ? 'Reservar Minhas Cotas' : 'Campanha Encerrada'}
              </button>
            </div>

            {/* Detalhes da Campanha (Mantido o original) */}
            <div className={`p-5 rounded-xl shadow-lg ${themeClasses.cardBg} space-y-4`}>
              {/* ... (Conteúdo dos Detalhes da Campanha) ... */}
            </div>
            
            {/* Descrição (Mantido o original) */}
            {isValidDescription(campaign.description) && (
              <div className={`p-5 rounded-xl shadow-lg ${themeClasses.cardBg}`}>
                {/* ... (Conteúdo da Descrição) ... */}
              </div>
            )}
            
          </section>
          
          {/* Seção da Grade de Cotas (Full Width em Mobile, Coluna em Desktop) */}
          <section className="lg:col-span-2">
            {campaign.campaign_model === 'manual' && (
              <QuotaGrid
                campaignId={campaign.id}
                ticketPrice={campaign.ticket_price}
                maxTicketsPerPurchase={campaign.max_tickets_per_purchase}
                promotions={campaign.promotions}
                selectedQuotas={selectedQuotas}
                onQuotaSelect={handleQuotaSelect}
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
                primaryColor={primaryColor}
                campaignTheme={campaignTheme}
                themeClasses={themeClasses}
                isCampaignAvailable={isCampaignAvailable}
              />
            )}
          </section>

        </div>
      </main>

      {/* Fullscreen Image Modal (Mantido o original) */}
      {fullscreenImageIndex !== null && campaign?.prize_image_urls && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center p-4" onClick={handleCloseFullscreen}>
          {/* ... (Conteúdo do Fullscreen Image Modal) ... */}
        </div>
      )}

      {/* Reservation Modal (Mantido o original) */}
      <ReservationModal
        isOpen={showReservationModal}
        onClose={() => setShowReservationModal(false)}
        onReserve={handleReservationSubmit}
        quotaCount={campaign.campaign_model === 'manual' ? selectedQuotas.length : quantity}
        totalValue={getCurrentTotalValue()}
        selectedQuotas={campaign.campaign_model === 'manual' ? selectedQuotas : undefined}
        campaignTitle={campaign.title}
        primaryColor={primaryColor}
        campaignTheme={campaignTheme}
        reserving={reserving}
        reservationTimeoutMinutes={campaign.reservation_timeout_minutes || 15}
      />
    </div>
  );
};

export default CampaignPage;