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
  AlertTriangle,
  FileText,
  Ticket
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCampaignByPublicId, useCampaignByCustomDomain } from '../hooks/useCampaigns';
import { useTickets } from '../hooks/useTickets';
import { useCampaignWinners } from '../hooks/useCampaignWinners';
import QuotaGrid from '../components/QuotaGrid';
import QuotaSelector from '../components/QuotaSelector';
import ReservationModal, { CustomerData } from '../components/ReservationModal';
import ReservationStep1Modal from '../components/ReservationStep1Modal';
import ReservationStep2Modal from '../components/ReservationStep2Modal';
import PrizesDisplayModal from '../components/PrizesDisplayModal';
import MyTicketsModal from '../components/MyTicketsModal';
import { CustomerData as ExistingCustomer } from '../utils/customerCheck';
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

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('pt-BR').format(num);
};

const maskPhoneNumber = (phone: string | null): string => {
  if (!phone) return 'Não informado';

  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 13) {
    return `(${cleaned.substring(0, 2)}) ****-**${cleaned.substring(9)}`;
  } else if (cleaned.length === 12) {
    return `(${cleaned.substring(0, 2)}) ****-**${cleaned.substring(8)}`;
  } else if (cleaned.length === 11) {
    return `(${cleaned.substring(0, 2)}) ****-**${cleaned.substring(7)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 2)}) ****-**${cleaned.substring(6)}`;
  }

  return phone.substring(0, 4) + '****' + phone.substring(phone.length - 2);
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.2
    }
  },
  exit: (direction: number) => ({
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

  const { winners, loading: winnersLoading } = useCampaignWinners(campaign?.id);

  const [selectedQuotas, setSelectedQuotas] = useState<number[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [activeFilter, setActiveFilter] = useState<'all' | 'available' | 'reserved' | 'purchased' | 'my-numbers'>('all');
  
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showStep1Modal, setShowStep1Modal] = useState(false);
  const [showStep2Modal, setShowStep2Modal] = useState(false);
  const [showPrizesModal, setShowPrizesModal] = useState(false);
  const [showMyTicketsModal, setShowMyTicketsModal] = useState(false);
  const [existingCustomerData, setExistingCustomerData] = useState<ExistingCustomer | null>(null);
  const [reservationCustomerData, setReservationCustomerData] = useState<CustomerData | null>(null);
  const [reservationQuotas, setReservationQuotas] = useState<number[]>([]);
  const [reservationTotalValue, setReservationTotalValue] = useState(0);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState<number | null>(null);
  const [isAutoPlayPaused, setIsAutoPlayPaused] = useState(false);
  
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  
  const [direction, setDirection] = useState(1);

  const pauseAutoPlayForDuration = useCallback((duration: number = 10000) => {
    setIsAutoPlayPaused(true);
    const timer = setTimeout(() => {
      setIsAutoPlayPaused(false);
    }, duration);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!campaign?.prize_image_urls || campaign.prize_image_urls.length <= 1 || isAutoPlayPaused) {
      return;
    }

    const interval = setInterval(() => {
      setDirection(1);
      setCurrentImageIndex(prev => 
        prev === campaign.prize_image_urls!.length - 1 ? 0 : prev + 1
      );
    }, 6000);

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

    setShowStep1Modal(true);
  }, [user, campaign, selectedQuotas, quantity, navigate]);

  const handleStep1NewCustomer = useCallback(() => {
    setShowStep1Modal(false);
    setShowReservationModal(true);
  }, []);

  const handleStep1ExistingCustomer = useCallback((customerData: ExistingCustomer) => {
    setExistingCustomerData(customerData);
    setShowStep1Modal(false);
    setShowStep2Modal(true);
  }, []);

  const handleStep2Confirm = useCallback(async () => {
    if (!existingCustomerData || !campaign) return;

    setReserving(true);
    try {
      const quotasToReserve = campaign.campaign_model === 'manual' ? selectedQuotas : [];
      const quantityToReserve = campaign.campaign_model === 'manual' ? selectedQuotas.length : quantity;

      const availableTickets = await getAvailableTickets(
        campaign.id,
        quotasToReserve,
        quantityToReserve
      );

      if (availableTickets.length === 0) {
        alert('As cotas selecionadas não estão mais disponíveis. Por favor, tente novamente.');
        setShowStep2Modal(false);
        setReserving(false);
        return;
      }

      const result = await reserveTickets({
        campaignId: campaign.id,
        customerName: existingCustomerData.customer_name,
        customerEmail: existingCustomerData.customer_email,
        customerPhone: existingCustomerData.customer_phone,
        selectedQuotas: quotasToReserve,
        quantity: quantityToReserve,
        userId: user?.id
      });

      if (result.success) {
        navigate(`/payment-confirmation/${result.reservationId}`);
      } else {
        alert(result.error || 'Erro ao reservar cotas. Tente novamente.');
      }
    } catch (error) {
      console.error('Error during reservation:', error);
      alert('Erro ao reservar cotas. Tente novamente.');
    } finally {
      setShowStep2Modal(false);
      setReserving(false);
    }
  }, [existingCustomerData, campaign, user, selectedQuotas, quantity, getAvailableTickets, reserveTickets, navigate]);

  const handlePreviousImage = () => {
    if (campaign?.prize_image_urls && campaign.prize_image_urls.length > 1) {
      pauseAutoPlayForDuration(10000);
      setDirection(-1);
      setCurrentImageIndex(prev => 
        prev === 0 ? campaign.prize_image_urls!.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    if (campaign?.prize_image_urls && campaign.prize_image_urls.length > 1) {
      pauseAutoPlayForDuration(10000);
      setDirection(1);
      setCurrentImageIndex(prev => 
        prev === campaign.prize_image_urls!.length - 1 ? 0 : prev + 1
      );
    }
  };
  
  const handleMouseEnter = () => {
    setIsAutoPlayPaused(true);
  };

  const handleMouseLeave = () => {
    setIsAutoPlayPaused(false);
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

  const handleOrganizerSocialClick = (platform: string, url: string) => {
    window.open(url, '_blank');
  };

  if (loading || ticketsLoading) {
    const loadingPrimaryColor = organizerProfile?.primary_color || '#3B82F6';
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{ borderColor: loadingPrimaryColor }}></div>
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
            className={`text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:scale-105 ${getColorClassName()}`}
            style={getColorStyle(true, false)}
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

  const isCampaignCompleted = campaign?.status === 'completed' && winners.length > 0;

  const currentImageUrl = campaign?.prize_image_urls?.[currentImageIndex] || 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&dpr=1';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeClasses.background}`}>
      {/* Header */}
      <header className={`shadow-sm border-b ${themeClasses.border} ${themeClasses.cardBg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              {organizerProfile?.logo_url ? (
                organizerProfile.color_mode === 'gradient' ? (
                  <div
                    className={getColorClassName("p-1 rounded-lg shadow-md")}
                    style={getColorStyle(true)}
                  >
                    <img
                      src={organizerProfile.logo_url}
                      alt="Logo do organizador"
                      className="h-14 w-auto max-w-[180px] object-contain bg-white dark:bg-gray-800 rounded-md"
                    />
                  </div>
                ) : (
                  <img
                    src={organizerProfile.logo_url}
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
            </div>

            <button
              onClick={() => setShowMyTicketsModal(true)}
              className={`text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg hover:scale-105 ${getColorClassName()}`}
              style={getColorStyle(true, false)}
            >
              <Ticket className="h-4 w-4" />
              <span className="hidden sm:inline">Ver Minhas Cotas</span>
              <span className="sm:hidden">Cotas</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <h1 className={`text-2xl md:text-3xl font-bold ${themeClasses.text} mb-4 text-center`}>
          {campaign.title}
        </h1>

        {/* Seção de Ganhadores - Exibida apenas quando campanha encerrada com ganhadores */}
        {isCampaignCompleted && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`${themeClasses.cardBg} rounded-xl shadow-lg border ${themeClasses.border} overflow-hidden mb-6 max-w-3xl mx-auto`}
          >
            {/* Header com gradiente/cor primária */}
            <div
              className={getColorClassName("px-6 py-4")}
              style={getColorStyle(true)}
            >
              <div className="flex items-center justify-center gap-3">
                <Trophy className="h-6 w-6 text-white" />
                <h2 className="text-xl md:text-2xl font-bold text-white">
                  🎉 Sorteio Realizado
                </h2>
              </div>
              {campaign.drawn_at && (
                <p className="text-center text-white/90 text-sm mt-2">
                  {formatDate(campaign.drawn_at)}
                </p>
              )}
            </div>

            {/* Lista de Ganhadores */}
            <div className="p-6">
              {winnersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primaryColor }}></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {winners.map((winner, index) => (
                    <motion.div
                      key={winner.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className={`${themeClasses.background} rounded-lg p-4 border ${themeClasses.border} space-y-3`}
                    >
                      {/* Nome do Prêmio */}
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                        <Gift className="h-5 w-5 flex-shrink-0" style={{ color: primaryColor }} />
                        <h3
                          className={`font-bold text-base truncate ${getColorClassName('', true)}`}
                          style={getColorStyle(false, true)}
                          title={winner.prize_name}
                        >
                          {winner.prize_name}
                        </h3>
                      </div>

                      {/* Número Vencedor */}
                      <div className="text-center py-2">
                        <p className={`text-xs ${themeClasses.textSecondary} mb-1`}>
                          Número Vencedor
                        </p>
                        <div
                          className={`text-3xl font-extrabold ${getColorClassName('', true)}`}
                          style={getColorStyle(false, true)}
                        >
                          {winner.ticket_number.toString().padStart(5, '0')}
                        </div>
                      </div>

                      {/* Informações do Ganhador */}
                      <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-start gap-2">
                          <Users className={`h-4 w-4 mt-0.5 flex-shrink-0 ${themeClasses.textSecondary}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs ${themeClasses.textSecondary}`}>Ganhador</p>
                            <p className={`text-sm font-semibold ${themeClasses.text} truncate`} title={winner.winner_name}>
                              {winner.winner_name}
                            </p>
                          </div>
                        </div>

                        {winner.winner_phone && (
                          <div className="flex items-start gap-2">
                            <svg className={`h-4 w-4 mt-0.5 flex-shrink-0 ${themeClasses.textSecondary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs ${themeClasses.textSecondary}`}>Telefone</p>
                              <p className={`text-sm font-medium ${themeClasses.text}`}>
                                {maskPhoneNumber(winner.winner_phone)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* 1. Galeria de imagens com barra de progresso e data */}
        <section className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} overflow-hidden mb-4 max-w-3xl mx-auto`}>
          <div 
            className="relative group w-full h-[300px] sm:h-[500px] overflow-hidden"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          > 
            
            <AnimatePresence initial={false} mode="wait" custom={direction}> 
              <motion.img
                key={currentImageUrl}
                src={currentImageUrl}
                alt={campaign.title}
                className="w-full h-full object-cover rounded-t-xl absolute top-0 left-0" 
                onClick={() => handleImageClick(currentImageIndex)}
                style={{ cursor: 'pointer' }}
                variants={slideVariants} 
                custom={direction}
                initial="enter"
                animate="center"
                exit="exit"
              />
            </AnimatePresence>
            
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
            
            {campaign.prize_image_urls && campaign.prize_image_urls.length > 1 && (
              <div className="absolute top-4 right-4 bg-gray-900/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-semibold z-10">
                {currentImageIndex + 1} / {campaign.prize_image_urls.length}
              </div>
            )}

            <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg z-10">
              <div className="flex items-center space-x-2">
                <Gift
                  className="h-4 w-4"
                  style={{ color: '#A855F7' }}
                />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-300 font-medium">Participe por apenas</span>
                  <span
                    className={`font-bold text-lg ${getColorClassName('', true)}`}
                    style={getColorStyle(false, true)}
                  >
                    {formatCurrency(campaign.ticket_price)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Barra de progresso e Data/Hora abaixo da galeria */}
          <div className="p-4 space-y-3">
            {!isCampaignCompleted && campaign.show_percentage && (
              <div className="relative">
                <div className={`w-full rounded-full h-8 overflow-hidden ${
                  campaignTheme === 'claro' ? 'bg-gray-200' : 'bg-gray-700'
                }`}>
                  <div
                    className={getColorClassName("h-8 rounded-full transition-all duration-300")}
                    style={{
                      width: `${getProgressPercentage()}%`,
                      ...getColorStyle(true)
                    }}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`font-bold text-sm ${
                    campaignTheme === 'claro' ? 'text-gray-900' : 'text-white'
                  }`}>
                    {getProgressPercentage()}%
                  </span>
                </div>
              </div>
            )}

            {campaign.show_draw_date && campaign.draw_date && (
              <div className={`flex items-center justify-center p-3 rounded-lg ${themeClasses.cardBg} border ${themeClasses.border}`}>
                <Calendar className={`h-4 w-4 mr-2 ${themeClasses.text}`} />
                <span className={`text-sm font-medium ${themeClasses.text}`}>
                  Sorteio: <span className={`font-bold ${themeClasses.text}`}>{formatDate(campaign.draw_date)}</span>
                </span>
              </div>
            )}
          </div>
        </section>

        {/* 2. Prêmios - Logo após a galeria */}
        {!isCampaignCompleted && campaign.prizes && Array.isArray(campaign.prizes) && campaign.prizes.length > 0 && (
          <motion.section 
            className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} overflow-hidden mb-4 max-w-3xl mx-auto cursor-pointer`}
            onClick={() => setShowPrizesModal(true)}
            whileHover={{
              scale: [null, 1.02, 1.03],
              y: [null, -2, -4],
              transition: {
                duration: 0.4,
                times: [0, 0.5, 1],
                ease: ["easeInOut", "easeOut"],
              },
            }}
            whileTap={{ scale: 0.98 }}
            transition={{
              duration: 0.3,
              ease: "easeOut",
            }}
          >
            {/* Header com gradiente/cor sólida */}
            <div 
              className={getColorClassName("px-4 py-3")}
              style={getColorStyle(true)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center justify-center gap-2 flex-1">
                  <Trophy className="h-5 w-5 text-white" />
                  <h3 className="text-lg font-bold text-white">
                    Prêmios
                  </h3>
                </div>
                <ExternalLink className="h-4 w-4 text-white/80" />
              </div>
            </div>

            {/* Mensagem de clique */}
            <div className={`px-4 py-3 ${themeClasses.background}`}>
              <p className={`text-center text-sm ${themeClasses.textSecondary} font-medium`}>
                Clique para ver todos os prêmios
              </p>
            </div>
          </motion.section>
        )}

        {/* 3. Organizador */}
        {!isCampaignCompleted && (
        <section className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-4 mb-4 max-w-3xl mx-auto`}>
          {loadingOrganizer ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: primaryColor || '#3B82F6' }}></div>
            </div>
          ) : organizerProfile ? (
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {organizerProfile.avatar_url ? (
                  organizerProfile.color_mode === 'gradient' ? (
                    <div
                      className={getColorClassName("p-1 rounded-full shadow-md")}
                      style={getColorStyle(true)}
                    >
                      <img
                        src={organizerProfile.avatar_url}
                        alt={organizerProfile.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    </div>
                  ) : (
                    <img
                      src={organizerProfile.avatar_url}
                      alt={organizerProfile.name}
                      className="w-20 h-20 rounded-full object-cover shadow-md"
                    />
                  )
                ) : (
                  <div
                    className={getColorClassName("w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md")}
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
        )}

        {/* 4. Promoções Disponíveis */}
        {!isCampaignCompleted && campaign.promotions && Array.isArray(campaign.promotions) && campaign.promotions.length > 0 && (
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

        {/* 5. Compra/seleção de cota */}
        {!isCampaignCompleted && (
        <section className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-4 mb-4 max-w-3xl mx-auto`}>
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
        )}

        {/* 6. Descrição com Scroll */}
        <section className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-4 mb-4 max-w-3xl mx-auto`}>
          <div className="flex items-center justify-center gap-2 mb-3">
            <FileText className={`h-5 w-5 ${themeClasses.text}`} />
            <h3 className={`text-lg font-bold ${themeClasses.text}`}>
              Descrição
            </h3>
          </div>
          
          {campaign.description && isValidDescription(campaign.description) ? (
            <div
              className={`${themeClasses.textSecondary} prose prose-base max-w-none ql-editor overflow-y-auto pr-2 ${
                campaignTheme === 'claro' ? 'custom-scrollbar-light' : 'custom-scrollbar-dark'
              }`}
              style={{
                maxHeight: '400px'
              }}
              dangerouslySetInnerHTML={{ __html: campaign.description }}
            />
          ) : (
            <div className={`${themeClasses.textSecondary} text-center italic`}>
              <p>Nenhuma descrição fornecida para esta campanha.</p>
            </div>
          )}
        </section>

        {/* 7. Método de Sorteio */}
        {!isCampaignCompleted && (
        <section className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-4 max-w-3xl mx-auto mb-4`}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={getColorClassName("w-8 h-8 rounded-lg flex items-center justify-center text-white")}
                style={getColorStyle(true)}
              >
                <Trophy className="h-4 w-4" />
              </div>
              <span className={`font-semibold text-sm ${themeClasses.text}`}>
                Método de sorteio:
              </span>
            </div>
            <span className={`font-medium text-sm ${themeClasses.text}`}>
              {campaign.draw_method}
            </span>
          </div>
        </section>
        )}
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

      {/* Step 1 Modal - Phone Input */}
      <ReservationStep1Modal
        isOpen={showStep1Modal}
        onClose={() => setShowStep1Modal(false)}
        onNewCustomer={handleStep1NewCustomer}
        onExistingCustomer={handleStep1ExistingCustomer}
        quotaCount={campaign.campaign_model === 'manual' ? selectedQuotas.length : quantity}
        totalValue={getCurrentTotalValue()}
        selectedQuotas={campaign.campaign_model === 'manual' ? selectedQuotas : undefined}
        campaignTitle={campaign.title}
        primaryColor={primaryColor}
        colorMode={organizerProfile?.color_mode}
        gradientClasses={organizerProfile?.gradient_classes}
        customGradientColors={organizerProfile?.custom_gradient_colors}
        campaignTheme={campaignTheme}
      />

      {/* Step 2 Modal - Existing Customer Confirmation */}
      {existingCustomerData && (
        <ReservationStep2Modal
          isOpen={showStep2Modal}
          onClose={() => setShowStep2Modal(false)}
          onConfirm={handleStep2Confirm}
          customerData={existingCustomerData}
          quotaCount={campaign.campaign_model === 'manual' ? selectedQuotas.length : quantity}
          totalValue={getCurrentTotalValue()}
          selectedQuotas={campaign.campaign_model === 'manual' ? selectedQuotas : undefined}
          campaignTitle={campaign.title}
          primaryColor={primaryColor}
          colorMode={organizerProfile?.color_mode}
          gradientClasses={organizerProfile?.gradient_classes}
          customGradientColors={organizerProfile?.custom_gradient_colors}
          campaignTheme={campaignTheme}
          confirming={reserving}
        />
      )}

      {/* Reservation Modal - New Customer Registration */}
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
        colorMode={organizerProfile?.color_mode}
        gradientClasses={organizerProfile?.gradient_classes}
        customGradientColors={organizerProfile?.custom_gradient_colors}
      />

      {/* Prizes Display Modal */}
      {campaign && (
        <PrizesDisplayModal
          isOpen={showPrizesModal}
          onClose={() => setShowPrizesModal(false)}
          prizes={campaign.prizes || []}
          campaignTitle={campaign.title}
          campaignTheme={campaignTheme}
        />
      )}

      {/* My Tickets Modal */}
      {campaign && (
        <MyTicketsModal
          isOpen={showMyTicketsModal}
          onClose={() => setShowMyTicketsModal(false)}
          campaignId={campaign.id}
          campaignTitle={campaign.title}
          campaignTheme={campaignTheme}
          primaryColor={primaryColor}
          colorMode={organizerProfile?.color_mode}
          gradientClasses={organizerProfile?.gradient_classes}
          customGradientColors={organizerProfile?.custom_gradient_colors}
        />
      )}
    </div>
  );
};

export default CampaignPage;