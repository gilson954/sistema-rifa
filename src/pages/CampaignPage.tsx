import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCampaignBySlug, useCampaignByCustomDomain } from '../hooks/useCampaigns';
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
  email: string;
  avatar_url?: string;
  social_media_links?: any;
  payment_integrations_config?: any;
  primary_color?: string;
  theme?: string;
}

const CampaignPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();

  // Função para verificar se a descrição contém conteúdo válido
  const isValidDescription = (description: string): boolean => {
    if (!description || typeof description !== 'string') return false;
    
    // Remove HTML tags e espaços para verificar se há conteúdo real
    const textContent = description
      .replace(/<[^>]*>/g, '') // Remove todas as tags HTML
      .replace(/&nbsp;/g, ' ') // Substitui &nbsp; por espaços
      .trim();
    
    return textContent.length > 0;
  };
  
  // Check if this is a custom domain request
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
  
  const isCustomDomain = !isDevelopmentHost && slug;
  
  // Use appropriate hook based on access method
  const { campaign: campaignBySlug, loading: loadingBySlug, error: errorBySlug } = useCampaignBySlug(slug || '');
  const { campaign: campaignByDomain, loading: loadingByDomain, error: errorByDomain } = useCampaignByCustomDomain(
    isCustomDomain ? window.location.hostname : ''
  );
  
  // Select the appropriate campaign data
  const campaign = isCustomDomain ? campaignByDomain : campaignBySlug;
  const loading = isCustomDomain ? loadingByDomain : loadingBySlug;
  const error = isCustomDomain ? errorByDomain : errorBySlug;

  // Check if campaign is available for purchases (paid and active)
  const isCampaignAvailable = campaign?.status === 'active' && campaign?.is_paid !== false;

  // Debug: Log campaign description (remover após teste)
  useEffect(() => {
    if (campaign?.description) {
      console.log('📝 Descrição da campanha:', campaign.description);
      console.log('📝 Descrição é válida:', isValidDescription(campaign.description));
    }
  }, [campaign?.description]);

  // Organizer profile state
  const [organizerProfile, setOrganizerProfile] = useState<OrganizerProfile | null>(null);
  const [loadingOrganizer, setLoadingOrganizer] = useState(false);

  // Tickets management
  const {
    tickets,
    loading: ticketsLoading,
    error: ticketsError,
    reserveTickets,
    getAvailableTickets,
    reserving
  } = useTickets(campaign?.id || '');

  // Local state for manual selection
  const [selectedQuotas, setSelectedQuotas] = useState<number[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [activeFilter, setActiveFilter] = useState<'all' | 'available' | 'reserved' | 'purchased' | 'my-numbers'>('all');
  
  // Modal states
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [reservationCustomerData, setReservationCustomerData] = useState<CustomerData | null>(null);
  const [reservationQuotas, setReservationQuotas] = useState<number[]>([]);
  const [reservationTotalValue, setReservationTotalValue] = useState(0);

  // Image gallery state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState<number | null>(null);
  
  // Touch/swipe state for mobile navigation
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  // Load organizer profile
  useEffect(() => {
    if (campaign?.user_id) {
      // DEBUG: Log campaign reservation timeout value
      console.log('🔧 [CAMPAIGN DEBUG] Campaign reservation_timeout_minutes:', campaign?.reservation_timeout_minutes);
      console.log('🔧 [CAMPAIGN DEBUG] Full campaign object:', campaign);
      
      const loadOrganizerProfile = async () => {
        setLoadingOrganizer(true);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, name, email, avatar_url, logo_url, social_media_links, payment_integrations_config, primary_color, theme')
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

  // Get applicable promotion for a given quantity
  const getBestPromotionForDisplay = useCallback((quotaCount: number): PromotionInfo | null => {
    if (!campaign?.promotions || !Array.isArray(campaign.promotions) || campaign.promotions.length === 0) {
      return null;
    }

    // Find the best promotion that applies to this quantity
    const applicablePromotions = campaign.promotions.filter(
      (promo: Promotion) => promo.ticketQuantity <= quotaCount
    );

    if (applicablePromotions.length === 0) {
      return null;
    }

    // Get the promotion with the highest ticket quantity (best deal)
    const applicablePromotion = applicablePromotions.reduce((best, current) => 
      current.ticketQuantity > best.ticketQuantity ? current : best
    );

    const originalTotal = quotaCount * campaign.ticket_price;
    
    // Calculate total using the new block promotion logic
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

  // Handle manual quota selection
  const handleQuotaSelect = useCallback((quotaNumber: number) => {
    if (!campaign || campaign.campaign_model !== 'manual') return;

    // Check if quota is available
    const availableTickets = getAvailableTickets();
    const isAvailable = availableTickets.some(ticket => ticket.quota_number === quotaNumber);
    
    if (!isAvailable) return;

    setSelectedQuotas(prev => {
      if (prev.includes(quotaNumber)) {
        // Remove if already selected
        return prev.filter(q => q !== quotaNumber);
      } else {
        // Add if not selected and within limits
        const newSelection = [...prev, quotaNumber];
        if (newSelection.length <= (campaign.max_tickets_per_purchase || 1000)) {
          return newSelection;
        }
        return prev; // Don't add if exceeds limit
      }
    });
  }, [campaign, getAvailableTickets]);

  // Handle automatic quantity change
  const handleQuantityChange = useCallback((newQuantity: number) => {
    setQuantity(newQuantity);
  }, []);

  // Handle reservation submission
  const handleReservationSubmit = useCallback(async (customerData: CustomerData) => {
    if (!campaign || !user) {
      alert('Você precisa estar logado para reservar cotas');
      return;
    }

    try {
      let quotasToReserve: number[] = [];

      if (campaign.campaign_model === 'manual') {
        // Manual mode: use selected quotas
        if (selectedQuotas.length === 0) {
          alert('Selecione pelo menos uma cota para reservar');
          return;
        }
        quotasToReserve = selectedQuotas;
      } else {
        // Automatic mode: generate random quotas
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

        // Randomly select quotas from available ones
        const shuffled = [...availableQuotaNumbers].sort(() => 0.5 - Math.random());
        quotasToReserve = shuffled.slice(0, quantity);
      }

      // Reserve the quotas
      const result = await reserveTickets(quotasToReserve);
      
      if (result) {
        // Calculate total value (considering promotions)
        const { total: totalValue } = calculateTotalWithPromotions(
          quotasToReserve.length,
          campaign.ticket_price,
          campaign.promotions || []
        );

        // Set reservation data
        setReservationCustomerData(customerData);
        setReservationQuotas(quotasToReserve);
        setReservationTotalValue(totalValue);

        // Clear selections
        setSelectedQuotas([]);
        setQuantity(Math.max(1, campaign.min_tickets_per_purchase || 1));

        // Navigate to payment confirmation
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

  // Handle opening reservation modal
  const handleOpenReservationModal = useCallback(() => {
    if (!user) {
      alert('Você precisa estar logado para reservar cotas');
      navigate('/login');
      return;
    }

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

  // Image navigation
  const handlePreviousImage = () => {
    if (campaign?.prize_image_urls && campaign.prize_image_urls.length > 1) {
      setCurrentImageIndex(prev => 
        prev === 0 ? campaign.prize_image_urls!.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    if (campaign?.prize_image_urls && campaign.prize_image_urls.length > 1) {
      setCurrentImageIndex(prev => 
        prev === campaign.prize_image_urls!.length - 1 ? 0 : prev + 1
      );
    }
  };

  // Handle fullscreen image view
  const handleImageClick = (imageIndex: number) => {
    setFullscreenImageIndex(imageIndex);
  };

  const handleCloseFullscreen = () => {
    setFullscreenImageIndex(null);
    setTouchStartX(null);
    setTouchEndX(null);
  };

  // Fullscreen navigation functions
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

  // Keyboard navigation for fullscreen
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

  // Touch/swipe handlers for mobile
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

    // Reset touch state
    setTouchStartX(null);
    setTouchEndX(null);
  };
  // Get theme classes based on campaign theme
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

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (!campaign) return 0;
    return Math.round((campaign.sold_tickets / campaign.total_tickets) * 100);
  };

  // Get current promotion info for selected/quantity
  const currentPromotionInfo = campaign?.campaign_model === 'manual' 
    ? getBestPromotionForDisplay(selectedQuotas.length)
    : getBestPromotionForDisplay(quantity);

  // Calculate current total value
  const getCurrentTotalValue = () => {
    const currentQuantity = campaign?.campaign_model === 'manual' ? selectedQuotas.length : quantity;
    
    if (!campaign) return 0;
    
    // Use the new block promotion calculation
    const { total } = calculateTotalWithPromotions(
      currentQuantity,
      campaign.ticket_price,
      campaign.promotions || []
    );
    
    return total;
  };

  // Get configured payment methods
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
    
    // Always show PIX as it's the default
    methods.push({ name: 'PIX', icon: '₽', color: '#00BC63' });
    
    return methods;
  };

  // Generate share URL
  const generateShareUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/c/${campaign?.slug}`;
  };

  // Handle social media sharing
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

  // Handle organizer social media click
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

  if (error || !campaign) {
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

        {/* 1. Seção de galeria de imagens - Full width card */}
        <section className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} overflow-hidden mb-4`}>
          {/* Image Display */}
          <div className="relative group">
            <img
              src={campaign.prize_image_urls?.[currentImageIndex] || 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&dpr=1'}
              alt={campaign.title}
              className="w-full h-[300px] sm:h-[600px] object-cover"
              onClick={() => handleImageClick(currentImageIndex)}
              style={{ cursor: 'pointer' }}
            />
            
            {/* Navigation Arrows */}
            {campaign.prize_image_urls && campaign.prize_image_urls.length > 1 && (
              <>
                <button
                  onClick={handlePreviousImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-75"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-75"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
            
            {/* Image Counter */}
            {campaign.prize_image_urls && campaign.prize_image_urls.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {campaign.prize_image_urls.length}
              </div>
            )}

            {/* Price Badge */}
            <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-white bg-opacity-95 backdrop-blur-sm px-2 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-lg">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <span className="text-xs sm:text-sm text-gray-600">Participe por apenas</span>
                <span className="font-bold text-sm sm:text-base md:text-lg"style={{ color: primaryColor }}>
                  {formatCurrency(campaign.ticket_price)}
                </span>
              </div>
            </div>
          </div>

          {/* Thumbnail Strip */}
          {campaign.prize_image_urls && campaign.prize_image_urls.length > 1 && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800">
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {campaign.prize_image_urls.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      index === currentImageIndex
                        ? 'border-purple-500 opacity-100'
                        : 'border-gray-300 dark:border-gray-600 opacity-60 hover:opacity-80'
                    }`}
                    onDoubleClick={() => handleImageClick(index)}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 2. Seção de Organizador - Full width card */}
        <section className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-4 mb-4`}>
          <h3 className={`text-xl font-bold ${themeClasses.text} mb-4 text-center`}>
            Organizador
          </h3>
          
          {loadingOrganizer ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            </div>
          ) : organizerProfile ? (
            <div className="max-w-sm mx-auto">
              <div className="flex items-center space-x-3 mb-3">
                {organizerProfile.logo_url ? (
                  <img
                    src={organizerProfile.logo_url}
                    alt={organizerProfile.name}
                    className="w-12 h-12 rounded object-contain bg-white dark:bg-gray-800 border-2 p-1"
                    style={{ borderColor: primaryColor }}
                  />
                ) : organizerProfile.avatar_url ? (
                  <img
                    src={organizerProfile.avatar_url}
                    alt={organizerProfile.name}
                    className="w-12 h-12 rounded-full object-cover border-2"
                    style={{ borderColor: primaryColor }}
                  />
                ) : (
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {organizerProfile.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-center flex-1">
                  <h4 className={`text-base font-semibold ${themeClasses.text}`}>
                    {organizerProfile.name}
                  </h4>
                  <p className={`text-sm ${themeClasses.textSecondary}`}>
                    Organizador da campanha
                  </p>
                </div>
              </div>

              {/* Organizer Social Media */}
              {organizerProfile.social_media_links && Object.keys(organizerProfile.social_media_links).length > 0 && (
                <div className="text-center">
                  <p className={`text-sm font-medium ${themeClasses.text} mb-2`}>
                    Redes Sociais
                  </p>
                  <div className="flex justify-center flex-wrap gap-1.5">
                    {Object.entries(organizerProfile.social_media_links).map(([platform, url]) => {
                      if (!url || typeof url !== 'string') return null;
                      
                      const config = socialMediaConfig[platform as keyof typeof socialMediaConfig];
                      if (!config) return null;
                      
                      const IconComponent = config.icon;
                      return (
                        <button
                          key={platform}
                          onClick={() => handleOrganizerSocialClick(platform, url)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform duration-200"
                          style={{ backgroundColor: config.color }}
                          title={`${config.name} do organizador`}
                        >
                          <IconComponent size={16} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
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

        {/* 3. Seção de Promoções Disponíveis - Full width card */}
        {campaign.promotions && Array.isArray(campaign.promotions) && campaign.promotions.length > 0 && (
          <section className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-3 mb-4`}>
            <h3 className={`text-base font-bold ${themeClasses.text} mb-2 text-center`}>
              🎁 Promoções Disponíveis
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {campaign.promotions.map((promo: Promotion) => {
                const originalValue = promo.ticketQuantity * campaign.ticket_price;
                const discountPercentage = Math.round((promo.fixedDiscountAmount / originalValue) * 100);
                
                return (
                  <div
                    key={promo.id}
                    className={`border ${themeClasses.border} rounded-lg p-2 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20`}
                  >
                    <div className="text-center">
                      <div className={`font-bold text-sm ${themeClasses.text} mb-0.5`}>
                        {promo.ticketQuantity} cotas
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-0.5">
                        {discountPercentage}% de desconto
                      </div>
                      <div className={`text-xs ${getThemeClasses(campaignTheme).textSecondary} line-through mb-0.5`}>
                        {formatCurrency(originalValue)}
                      </div>
                      <div className="text-base font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(promo.discountedTotalValue)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 4. Seção de Prêmios - Full width card */}
        {campaign.prizes && Array.isArray(campaign.prizes) && campaign.prizes.length > 0 && (
          <section className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-3 mb-4`}>
            <h3 className={`text-base font-bold ${themeClasses.text} mb-2 text-center`}>
              🏆 Prêmios
            </h3>
            
            <div className="max-w-xl mx-auto space-y-1">
              {campaign.prizes.map((prize: any, index: number) => (
                <div key={prize.id} className="flex items-center justify-center space-x-1.5">
                  <div 
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-xs"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {index + 1}
                  </div>
                  <span className={`${themeClasses.text} font-medium text-sm`}>{prize.name}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. Seção de compra/seleção de cota - Full width card */}
        <section className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-4 mb-4`}>
          <h2 className={`text-xl font-bold ${themeClasses.text} mb-4 text-center`}>
            {campaign.campaign_model === 'manual' ? 'Selecione suas Cotas' : 'Escolha a Quantidade'}
          </h2>

          {campaign.campaign_model === 'manual' ? (
            <div className="space-y-4">
              {/* Campaign Unavailable Alert */}
              {!isCampaignAvailable && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-1">
                        Campanha Indisponível
                      </h4>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
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
              />

              {/* Manual Mode - Selection Summary */}
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
                          className="px-2 py-1 text-white rounded text-xs font-medium"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {quota.toString().padStart(3, '0')}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Promotion Info */}
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
                        className={`text-xl font-bold ${currentPromotionInfo ? 'text-green-600' : ''}`}
                        style={!currentPromotionInfo ? { color: primaryColor } : {}}
                      >
                        {formatCurrency(getCurrentTotalValue())}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleOpenReservationModal}
                    disabled={selectedQuotas.length === 0}
                    className="w-full text-white py-3 rounded-xl font-bold text-base transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {isCampaignAvailable ? 'Reservar Cotas Selecionadas' : 'Campanha Indisponível'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Campaign Unavailable Alert */}
              {!isCampaignAvailable && (
                <div className="bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-800 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-6 w-6 text-orange-700 dark:text-orange-400 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-1">
                        Campanha Indisponível
                      </h4>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
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
            />
            </>
          )}
        </section>

        {/* 6. Descrição/Regulamento - Full width card */}
        <section className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-4 mb-4`}>
          <h3 className={`text-lg font-bold ${themeClasses.text} mb-3 text-center`}>
            Descrição/Regulamento
          </h3>
          
          {/* Campaign Description */}
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

          {/* Draw Date */}
          {campaign.show_draw_date && campaign.draw_date && (
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Calendar className={`h-5 w-5 ${themeClasses.textSecondary}`} />
              <span className={`text-base ${themeClasses.text}`}>
                Data de sorteio: <strong>{formatDate(campaign.draw_date)}</strong>
              </span>
            </div>
          )}

          {/* Progress Bar - Only show if show_percentage is enabled */}
          {campaign.show_percentage && (
            <div className="max-w-xl mx-auto">
              <div className="flex justify-center items-center mb-3">
                <span className={`text-base font-bold ${themeClasses.text}`}>
                  {getProgressPercentage()}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className="h-3 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${getProgressPercentage()}%`,
                    backgroundColor: primaryColor 
                  }}
                />
              </div>
            </div>
          )}
        </section>

        {/* 7. Métodos de Pagamento e Método de Sorteio - Side by side layout */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Payment Methods Card - Left */}
          <div className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-4`}>
            <h3 className={`text-base font-bold ${themeClasses.text} mb-3 text-center`}>
              Seção de Métodos de Pagamento
            </h3>
            
            <div className="space-y-2">
              {getConfiguredPaymentMethods().map((method, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-2 p-2 rounded-lg border ${themeClasses.border}`}
                >
                  <div 
                    className="w-30 h-30 rounded-lg flex items-center justify-center text-white font-bold text-sm"
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

          {/* Draw Method Card - Right */}
          <div className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-4`}>
            <h3 className={`text-base font-bold ${themeClasses.text} mb-3 text-center`}>
              Seção de Método de Sorteio
            </h3>
            
            <div className="flex items-center justify-center space-x-2">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: primaryColor }}
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
        </section>

        {/* Share Campaign Section - Full width at bottom */}
        <section className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-4`}>
          <h3 className={`text-lg font-bold ${themeClasses.text} mb-4 text-center`}>
            Compartilhar Campanha
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto">
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

        {/* REMOVED CONFIDENTIAL SECTIONS */}
        {/* 
          The following sections have been removed from public view as they contain confidential information:
          - Campaign Stats Card (total_tickets, sold_tickets, available_tickets, reservation_timeout_minutes)
          - Campaign Details Card (ticket_price, min_tickets_per_purchase, max_tickets_per_purchase, campaign_model)
          
          These sections are only appropriate for the campaign organizer's dashboard view.
        */}
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
            
            {/* Navigation Buttons - Only show if multiple images */}
            {campaign.prize_image_urls.length > 1 && (
              <>
                {/* Previous Button */}
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

                {/* Next Button */}
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

            {/* Image Counter */}
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