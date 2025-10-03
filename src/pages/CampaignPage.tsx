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
      duration: 0.1
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
  const error = isCustomDomain ? errorByDomain : errorByPublicId;

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
  const [isAutoPlayPaused, setIsAutoPlayPaused] = useState(false);
  
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  
  const [direction, setDirection] = useState(1); // NOVO ESTADO: 1 para Próximo, -1 para Anterior

  // Auto-play carrossel de imagens a cada 6 segundos
  useEffect(() => {
    if (!campaign?.prize_image_urls || campaign.prize_image_urls.length <= 1 || isAutoPlayPaused) {
      return;
    }

    const interval = setInterval(() => {
      setDirection(1); // Auto-play sempre avança
      setCurrentImageIndex(prev => 
        prev === campaign.prize_image_urls!.length - 1 ? 0 : prev + 1
      );
    }, 6000); // 6 segundos

    return () => clearInterval(interval);
  }, [campaign?.prize_image_urls, isAutoPlayPaused]);

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

  const handlePreviousImage = () => {
    if (campaign?.prize_image_urls && campaign.prize_image_urls.length > 1) {
      setDirection(-1); // NOVO: Define a direção para 'anterior'
      setCurrentImageIndex(prev => 
        prev === 0 ? campaign.prize_image_urls!.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    if (campaign?.prize_image_urls && campaign.prize_image_urls.length > 1) {
      setDirection(1); // NOVO: Define a direção para 'próximo'
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
        return {
          background: 'bg-gray-50',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          cardBg: 'bg-white',
          border: 'border-gray-200'
        };
      case 'escuro':
        return {
          background: 'bg-gray-950',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          cardBg: 'bg-gray-900',
          border: 'border-gray-800'
        };
      case 'escuro-preto':
        return {
          background: 'bg-black',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          cardBg: 'bg-gray-900',
          border: 'border-gray-800'
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
    if (config.paggue?.api_key) {
      methods.push({ name: 'Paggue', icon: '💵', color: '#F59E0B' });
    }
    if (config.efi_bank?.client_id) {
      methods.push({ name: 'Efi Bank', icon: '🏦', color: '#EF4444' });
    }
    
    methods.push({ name: 'PIX', icon: '₽', color: '#00BC63' });
    
    return methods;
  };

  const generateShareUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/c/${campaign?.public_id}`;
  };

  const handleShare = (platform: string) => {
    const shareUrl = generateShareUrl();
    const shareText = `Participe da ${campaign?.title}! Cotas por apenas ${formatCurrency(campaign?.ticket_price || 0)}`;
    
    let url = '';
    
    switch (platform) {
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        break;
      case 'x':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      default:
        return;
    }
    
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleOrganizerSocialClick = (platform: string, url: string) => {
    window.open(url, '_blank');
  };

  if (loading || ticketsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (
    error || 
    !campaign || 
    (!user && campaign && campaign.is_paid === false)
  ) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Campanha não encontrada
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            A campanha que você está procurando não existe ou foi removida.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  const campaignTheme = organizerProfile?.theme || 'claro';
  const primaryColor = organizerProfile?.primary_color || '#3B82F6';
  const themeClasses = getThemeClasses(campaignTheme);

  // NOVO: URL da imagem atual e URL de fallback
  const currentImageUrl = campaign?.prize_image_urls?.[currentImageIndex] || 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&dpr=1';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeClasses.background}`}>
      {/* Header - Redesigned according to image specifications */}
      <header className={`shadow-sm border-b ${themeClasses.border} ${themeClasses.cardBg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Left aligned */}
            <div className="flex items-center space-x-2">
              <img 
                src="/logo-chatgpt.png" 
                alt="Rifaqui Logo" 
                className="w-10 h-10 object-contain"
              />
              <span className={`text-xl font-bold ${themeClasses.text}`}>Rifaqui</span>
            </div>
            
            {/* "Ver Minhas Cotas" Button - Right aligned and highlighted */}
            <button
              onClick={() => navigate('/my-tickets')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 shadow-md"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Ver Minhas Cotas</span>
              <span className="sm:hidden">Cotas</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Campaign Title - Standalone, not in a card */}
        <h1 className={`text-2xl md:text-3xl font-bold ${themeClasses.text} mb-4 text-center`}>
          {campaign.title}
        </h1>

        {/* 1. Seção de galeria de imagens - card com largura limitada - SEM THUMBNAILS */}
        <section className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} overflow-hidden mb-4 max-w-3xl mx-auto`}>
          {/* O container deve ter altura definida e overflow-hidden para o carrossel */}
          <div className="relative group w-full h-[300px] sm:h-[500px] overflow-hidden"> 
            
            {/* AnimatePresence para controlar a entrada/saída */}
            <AnimatePresence initial={false} mode="wait" custom={direction}> 
              <motion.img
                key={currentImageUrl} // CHAVE ÚNICA: Força o React a desmontar/remontar o componente a cada mudança
                src={currentImageUrl}
                alt={campaign.title}
                // Classes para sobrepor as imagens e cobrir o container pai
                className="w-full h-full object-cover rounded-t-xl absolute top-0 left-0" 
                onClick={() => handleImageClick(currentImageIndex)}
                style={{ cursor: 'pointer' }}
                // Variantes de animação
                variants={slideVariants} 
                custom={direction}
                initial="enter" // Estado inicial
                animate="center" // Estado animado (permanente)
                exit="exit" // Estado de saída
              />
            </AnimatePresence>
            
            {/* Navigation Arrows (z-10 adicionado para garantir que fiquem sobre a imagem) */}
            {campaign.prize_image_urls && campaign.prize_image_urls.length > 1 && (
              <>
                <button
                  onClick={handlePreviousImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-75 z-10"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-75 z-10"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
            
            {/* Image Counter - DESIGN MELHORADO (Print 3) */}
            {campaign.prize_image_urls && campaign.prize_image_urls.length > 1 && (
              <div className="absolute top-4 right-4 bg-gray-900/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-semibold z-10">
                {currentImageIndex + 1} / {campaign.prize_image_urls.length}
              </div>
            )}

            {/* Price Badge - DESIGN MELHORADO (Print 1) */}
            <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg z-10">
              <div className="flex items-center space-x-2">
                <Gift className="h-4 w-4 text-purple-400" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-300 font-medium">Participe por apenas</span>
                  <span className="font-bold text-lg text-cyan-400">
                    {formatCurrency(campaign.ticket_price)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* REMOVIDO: Thumbnail Strip - NÃO EXIBIR MAIS */}
        </section>

        {/* 2. Seção de Organizador */}
        <section className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-4 mb-4 max-w-3xl mx-auto`}>
          {loadingOrganizer ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            </div>
          ) : organizerProfile ? (
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {organizerProfile.logo_url ? (
                  organizerProfile.color_mode === 'gradient' ? (
                    <div
                      className={getColorClassName("p-1 rounded-lg shadow-md")}
                      style={getColorStyle(true)}
                    >
                      <img
                        src={organizerProfile.logo_url}
                        alt={organizerProfile.name}
                        className="w-[88px] h-[88px] rounded-md object-contain bg-white dark:bg-gray-800"
                      />
                    </div>
                  ) : (
                    <img
                      src={organizerProfile.logo_url}
                      alt={organizerProfile.name}
                      className="w-24 h-24 rounded-lg object-contain bg-white dark:bg-gray-800 border-4 shadow-md"
                      style={{ borderColor: organizerProfile.primary_color || '#3B82F6' }}
                    />
                  )
                ) : organizerProfile.avatar_url ? (
                  organizerProfile.color_mode === 'gradient' ? (
                    <div
                      className={getColorClassName("p-1 rounded-full shadow-md")}
                      style={getColorStyle(true)}
                    >
                      <img
                        src={organizerProfile.avatar_url}
                        alt={organizerProfile.name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    </div>
                  ) : (
                    <img
                      src={organizerProfile.avatar_url}
                      alt={organizerProfile.name}
                      className="w-16 h-16 rounded-full object-cover border-4 shadow-md"
                      style={{ borderColor: organizerProfile.primary_color || '#3B82F6' }}
                    />
                  )
                ) : (
                  <div
                    className={getColorClassName("w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md")}
                    style={getColorStyle(true)}
                  >
                    {organizerProfile.name ? organizerProfile.name.charAt(0).toUpperCase() : 'O'}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm ${themeClasses.textSecondary} leading-tight`}>
                  Organizador:
                </p>
                <h4 className={`text-base font-semibold ${themeClasses.text} truncate`}>
                  {organizerProfile.name}
                </h4>

                {organizerProfile.social_media_links && Object.keys(organizerProfile.social_media_links).length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    {Object.entries(organizerProfile.social_media_links).map(([platform, url]) => {
                      if (!url || typeof url !== 'string') return null;
                      const config = socialMediaConfig[platform as keyof typeof socialMediaConfig];
                      if (!config) return null;
                      const IconComponent = config.icon;
                      return (
                        <button
                          key={platform}
                          onClick={() => handleOrganizerSocialClick(platform, url)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform duration-150"
                          style={{ backgroundColor: config.color }}
                          title={`${config.name} do organizador`}
                        >
                          <IconComponent size={12} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Users className={`h-8 w-8 ${themeClasses.textSecondary} mx-auto mb-2`} />
              <p className={`text-sm ${themeClasses.textSecondary}`}>
                Informações do organizador não disponíveis
              </p>
            </div>
          )}
        </section>

        {/* 3. Seção de Promoções Disponíveis - card com largura limitada */}
        {campaign.promotions && Array.isArray(campaign.promotions) && campaign.promotions.length > 0 && (
          <section className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-3 mb-4 max-w-3xl mx-auto`}>
            <h3 className={`text-base font-bold ${themeClasses.text} mb-2 text-center`}>
              🎁 Promoções Disponíveis
            </h3>

            <div className="flex flex-wrap gap-3 justify-center">
              {campaign.promotions.map((promo: Promotion) => {
                const originalValue = promo.ticketQuantity * campaign.ticket_price;
                const discountPercentage = originalValue > 0 ? Math.round((promo.fixedDiscountAmount / originalValue) * 100) : 0;
                const colorMode = organizerProfile?.color_mode || 'solid';

                return (
                  <div key={promo.id}>
                    {colorMode === 'gradient' ? (
                      <div
                        className={getColorClassName("p-0.5 rounded-lg shadow-sm")}
                        style={getColorStyle(true)}
                      >
                        <button
                          type="button"
                          onClick={() => {}}
                          className={`flex items-center justify-between min-w-[220px] max-w-xs px-4 py-2 rounded-lg transition-all duration-150 ${
                            themeClasses.cardBg
                          }`}
                        >
                          <span className={`text-sm font-bold ${themeClasses.text} truncate`}>
                            {promo.ticketQuantity} cotas por {formatCurrency(originalValue - promo.fixedDiscountAmount)}
                          </span>
                          <span className="ml-3 text-sm font-extrabold text-green-500 dark:text-green-300">
                            {discountPercentage}%
                          </span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {}}
                        className={`flex items-center justify-between min-w-[220px] max-w-xs px-4 py-2 rounded-lg transition-all duration-150 shadow-sm border-2`}
                        style={{
                          background: 'transparent',
                          borderColor: organizerProfile?.primary_color || (campaignTheme === 'claro' ? '#d1d5db' : '#4b5563')
                        }}
                      >
                        <span className={`text-sm font-bold ${themeClasses.text} truncate`}>
                          {promo.ticketQuantity} cotas por {formatCurrency(originalValue - promo.fixedDiscountAmount)}
                        </span>
                        <span className="ml-3 text-sm font-extrabold text-green-500 dark:text-green-300">
                          {discountPercentage}%
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 4. Seção de Prêmios - card com largura limitada */}
        {campaign.prizes && Array.isArray(campaign.prizes) && campaign.prizes.length > 0 && (
          <section className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-3 mb-4 max-w-3xl mx-auto`}>
            <h3 className={`text-base font-bold ${themeClasses.text} mb-2 text-center`}>
              🏆 Prêmios
            </h3>
            
            <div className="w-full space-y-1">
              {campaign.prizes.map((prize: any, index: number) => (
                <div key={prize.id} className="flex items-center justify-center space-x-1.5">
                  <div
                    className={getColorClassName("w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-xs")}
                    style={getColorStyle(true)}
                  >
                    {index + 1}
                  </div>
                  <span className={`${themeClasses.text} font-medium text-sm`}>{prize.name}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. Seção de compra/seleção de cota - card com largura limitada */}
        <section className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-4 mb-4 max-w-3xl mx-auto`}>
          <h2 className={`text-xl font-bold ${themeClasses.text} mb-4 text-center`}>
            {campaign.campaign_model === 'manual' ? 'Selecione suas Cotas' : 'Escolha a Quantidade'}
          </h2>

          {campaign.campaign_model === 'manual' ? (
            <div className="space-y-4">
              {!isCampaignAvailable && (
                <div className="bg-gray-900 border border-orange-800 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-6 w-6 text-orange-400 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-orange-300 mb-1">
                        Campanha Indisponível
                      </h4>
                      <p className="text-sm text-orange-400">
                        Sua campanha está indisponível. Realize o pagamento da taxa para ativá-la!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <QuotaGrid
                totalQuotas={campaign.total_tickets}
                selectedQuotas={selectedQuotas}
                onQuotaSelect={isCampaignAvailable ? handleQuotaSelect : undefined}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                mode="manual"
                tickets={tickets}
                currentUserId={user?.id}
                campaignTheme={campaignTheme}
                primaryColor={primaryColor}
                colorMode={organizerProfile?.color_mode}
                gradientClasses={organizerProfile?.gradient_classes}
                customGradientColors={organizerProfile?.custom_gradient_colors}
              />

              {selectedQuotas.length > 0 && (
                <div className={`${themeClasses.background} rounded-xl p-4 border ${themeClasses.border}`}>
                  <h3 className={`text-base font-bold ${themeClasses.text} mb-3`}>
                    Cotas Selecionadas
                  </h3>
                  
                  <div className="mb-3">
                    <div className={`text-sm ${themeClasses.textSecondary} mb-2`}>
                      Números selecionados:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedQuotas.sort((a, b) => a - b).map(quota => (
                        <span
                          key={quota}
                          className={getColorClassName("px-2 py-1 text-white rounded text-xs font-medium")}
                          style={getColorStyle(true)}
                        >
                          {quota.toString().padStart(3, '0')}
                        </span>
                      ))}
                    </div>
                  </div>

                  {currentPromotionInfo && (
                    <div className="mb-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="text-center">
                        <div className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">
                          🎉 Promoção Aplicada: {currentPromotionInfo.discountPercentage}% OFF
                        </div>
                        <div className="text-xs text-green-700 dark:text-green-300">
                          Economia de {formatCurrency(currentPromotionInfo.savings)}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center mb-6">
                    <span className={`font-medium ${themeClasses.text}`}>
                      {selectedQuotas.length} {selectedQuotas.length === 1 ? 'cota' : 'cotas'}
                    </span>
                    <div className="text-right">
                      {currentPromotionInfo && (
                        <div className={`text-xs ${themeClasses.textSecondary} line-through`}>
                          {formatCurrency(currentPromotionInfo.originalTotal)}
                        </div>
                      )}
                      <div
                        className={currentPromotionInfo ? 'text-xl font-bold text-green-600' : getColorClassName('text-xl font-bold')}
                        style={!currentPromotionInfo ? getColorStyle(true, true) : {}}
                      >
                        {formatCurrency(getCurrentTotalValue())}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleOpenReservationModal}
                    disabled={selectedQuotas.length === 0}
                    className={getColorClassName("w-full text-white py-3 rounded-xl font-bold text-base transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed")}
                    style={getColorStyle(true)}
                  >
                    {isCampaignAvailable ? 'Reservar Cotas Selecionadas' : 'Campanha Indisponível'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {!isCampaignAvailable && (
                <div className="bg-gray-900 border border-orange-800 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-6 w-6 text-orange-400 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-orange-300 mb-1">
                        Campanha Indisponível
                      </h4>
                      <p className="text-sm text-orange-400">
                        Sua campanha está indisponível. Realize o pagamento da taxa para ativá-la!
                      </p>
                    </div>
                  </div>
                </div>
              )}

            <QuotaSelector
              ticketPrice={campaign.ticket_price}
              minTicketsPerPurchase={campaign.min_tickets_per_purchase || 1}
              maxTicketsPerPurchase={campaign.max_tickets_per_purchase || 1000}
              onQuantityChange={handleQuantityChange}
              initialQuantity={Math.max(1, campaign.min_tickets_per_purchase || 1)}
              mode="automatic"
              promotionInfo={currentPromotionInfo}
              promotions={campaign.promotions || []}
              primaryColor={primaryColor}
              campaignTheme={campaignTheme}
              onReserve={isCampaignAvailable ? handleOpenReservationModal : undefined}
              reserving={reserving}
              disabled={!isCampaignAvailable}
              colorMode={organizerProfile?.color_mode}
              gradientClasses={organizerProfile?.gradient_classes}
              customGradientColors={organizerProfile?.custom_gradient_colors}
            />
            </>
          )}
        </section>

        {/* 6. Descrição/Regulamento - card com largura limitada */}
        <section className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-4 mb-4 max-w-3xl mx-auto`}>
          <h3 className={`text-lg font-bold ${themeClasses.text} mb-3 text-center`}>
            Descrição/Regulamento
          </h3>
          
          {campaign.description && isValidDescription(campaign.description) ? (
            <div 
              className={`${themeClasses.textSecondary} mb-4 prose prose-base max-w-none ql-editor`}
              dangerouslySetInnerHTML={{ __html: campaign.description }}
            />
          ) : (
            <div className={`${themeClasses.textSecondary} mb-4 text-center italic`}>
              <p>Nenhuma descrição fornecida para esta campanha.</p>
            </div>
          )}

          {/* Draw Date - DESIGN MELHORADO (Print 2) */}
          {campaign.show_draw_date && campaign.draw_date && (
            <div className={`flex items-center justify-center mb-4 p-4 rounded-xl ${
              campaignTheme === 'claro' 
                ? 'bg-blue-50 border border-blue-200' 
                : 'bg-blue-950 border border-blue-800'
            }`}>
              <Calendar className={`h-5 w-5 mr-3 ${
                campaignTheme === 'claro' ? 'text-blue-600' : 'text-blue-400'
              }`} />
              <span className={`text-base font-semibold ${
                campaignTheme === 'claro' ? 'text-gray-900' : 'text-white'
              }`}>
                Data de sorteio: <strong className={
                  campaignTheme === 'claro' ? 'text-blue-700' : 'text-cyan-400'
                }>{formatDate(campaign.draw_date)}</strong>
              </span>
            </div>
          )}

          {campaign.show_percentage && (
            <div className="max-w-3xl mx-auto">
              <div className="flex justify-center items-center mb-3">
                <span className={`text-base font-bold ${themeClasses.text}`}>
                  {getProgressPercentage()}%
                </span>
              </div>
              <div className={`w-full rounded-full h-3 ${
                campaignTheme === 'claro' ? 'bg-gray-200' : 'bg-gray-700'
              }`}>
                <div
                  className={getColorClassName("h-3 rounded-full transition-all duration-300")}
                  style={{
                    width: `${getProgressPercentage()}%`,
                    ...getColorStyle(true)
                  }}
                />
              </div>
            </div>
          )}
        </section>

        {/* 7. Métodos de Pagamento e Método de Sorteio */}
        <section className="mb-4">
          <div className="max-w-3xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Payment Methods Card */}
            <div className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-4`}>
              <h3 className={`text-base font-bold ${themeClasses.text} mb-3 text-center`}>
                Métodos de Pagamento
              </h3>
              
              <div className="space-y-2">
                {getConfiguredPaymentMethods().map((method, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-2 p-2 rounded-lg border ${themeClasses.border}`}
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: method.color }}
                    >
                      {method.icon}
                    </div>
                    <span className={`font-medium text-sm ${themeClasses.text}`}>
                      {method.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Draw Method Card */}
            <div className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-4`}>
              <h3 className={`text-base font-bold ${themeClasses.text} mb-3 text-center`}>
                Método de Sorteio
              </h3>
              
              <div className="flex items-center justify-center space-x-2">
                <div
                  className={getColorClassName("w-10 h-10 rounded-lg flex items-center justify-center text-white")}
                  style={getColorStyle(true)}
                >
                  <Trophy className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <p className={`font-medium text-sm ${themeClasses.text}`}>
                    {campaign.draw_method}
                  </p>
                  <p className={`text-xs ${themeClasses.textSecondary}`}>
                    Sorteio transparente e confiável
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Share Campaign Section */}
        <section className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-4 max-w-3xl mx-auto mb-6`}>
          <h3 className={`text-lg font-bold ${themeClasses.text} mb-4 text-center`}>
            Compartilhar Campanha
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(shareSectionConfig).map(([platform, config]) => {
              const IconComponent = config.icon;
              return (
                <button
                  key={platform}
                  onClick={() => handleShare(platform)}
                  className={`flex flex-col items-center space-y-1.5 p-3 rounded-lg border ${themeClasses.border} hover:shadow-lg transition-all duration-200 group`}
                  style={{ 
                    backgroundColor: themeClasses.cardBg === 'bg-white' ? '#ffffff' : '#1f2937',
                    borderColor: config.color + '20'
                  }}
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-200"
                    style={{ backgroundColor: config.color }}
                  >
                    <IconComponent size={20} />
                  </div>
                  <span className={`text-xs font-medium ${themeClasses.text}`}>
                    {config.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </main>

      {/* Fullscreen Image Modal */}
      {fullscreenImageIndex !== null && campaign?.prize_image_urls && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={handleCloseFullscreen}
        >
          <div 
            className="relative max-w-full max-h-full"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={campaign.prize_image_urls[fullscreenImageIndex]}
              alt={campaign.title}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            
            {campaign.prize_image_urls.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPreviousFullscreenImage();
                  }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full transition-all duration-200 flex items-center justify-center group"
                  aria-label="Imagem anterior"
                >
                  <ChevronLeft className="h-8 w-8 md:h-10 md:w-10 group-hover:scale-110 transition-transform duration-200" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNextFullscreenImage();
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full transition-all duration-200 flex items-center justify-center group"
                  aria-label="Próxima imagem"
                >
                  <ChevronRight className="h-8 w-8 md:h-10 md:w-10 group-hover:scale-110 transition-transform duration-200" />
                </button>
              </>
            )}

            {campaign.prize_image_urls.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm font-medium">
                {fullscreenImageIndex + 1} / {campaign.prize_image_urls.length}
              </div>
            )}
            
            <button
              onClick={handleCloseFullscreen}
              className="absolute top-4 right-4 w-10 h-10 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors duration-200 flex items-center justify-center"
              aria-label="Fechar imagem em tela cheia"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Reservation Modal */}
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