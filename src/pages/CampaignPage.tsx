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
  Ticket,
  Award,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotification } from '../context/NotificationContext';
import { useCampaignByPublicId, useCampaignByCustomDomain } from '../hooks/useCampaigns';
import { useTickets } from '../hooks/useTickets';
import { useCampaignWinners } from '../hooks/useCampaignWinners';
import QuotaGrid from '../components/QuotaGrid';
import QuotaSelector from '../components/QuotaSelector';
import ReservationModal, { CustomerData } from '../components/ReservationModal';
import ReservationStep1Modal from '../components/ReservationStep1Modal';
import ReservationStep2Modal from '../components/ReservationStep2Modal';
import PrizesDisplayModal from '../components/PrizesDisplayModal';
import CotasPremiadasPublicModal from '../components/CotasPremiadasPublicModal';
import CampaignFooter from '../components/CampaignFooter';
import PhoneLoginModal from '../components/PhoneLoginModal';
import { CustomerData as ExistingCustomer } from '../utils/customerCheck';
import { Promotion } from '../types/promotion';
import { CotaPremiada } from '../types/cotasPremiadas';
import { formatCurrency } from '../utils/currency';
import { calculateTotalWithPromotions } from '../utils/currency';
import { socialMediaConfig, shareSectionConfig } from '../components/SocialMediaIcons';
import { supabase } from '../lib/supabase';
import { CotasPremiadasAPI } from '../lib/api/cotasPremiadas';
import { useFavoriteCampaigns } from '../hooks/useFavoriteCampaigns';

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

// ✅ FUNÇÃO HELPER PARA LIMPAR NÚMERO DE TELEFONE
const cleanPhoneNumber = (phone: string): string => {
  // Remove tudo que não é número
  return phone.replace(/\D/g, '');
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
  const { user, isPhoneAuthenticated, phoneUser, signInWithPhone } = useAuth();
  const { theme } = useTheme();
  const { showSuccess, showError, showWarning, showInfo } = useNotification();
  const { isFavorite, toggleFavorite } = useFavoriteCampaigns();

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
  const [showCotasPremiadasModal, setShowCotasPremiadasModal] = useState(false);
  const [showPhoneLoginModal, setShowPhoneLoginModal] = useState(false);
  const [cotasPremiadas, setCotasPremiadas] = useState<CotaPremiada[]>([]);
  const [loadingCotasPremiadas, setLoadingCotasPremiadas] = useState(false);
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

  useEffect(() => {
    if (campaign?.id && campaign?.campaign_model === 'automatic' && campaign?.cotas_premiadas_visiveis) {
      const loadCotasPremiadas = async () => {
        setLoadingCotasPremiadas(true);
        try {
          const { data, error } = await CotasPremiadasAPI.getCotasPremiadasByCampaign(campaign.id);
          if (!error && data) {
            setCotasPremiadas(data);
          }
        } catch (error) {
          console.error('Error loading cotas premiadas:', error);
        } finally {
          setLoadingCotasPremiadas(false);
        }
      };

      loadCotasPremiadas();

      const channel = CotasPremiadasAPI.subscribeToCotasPremiadas(campaign.id, () => {
        loadCotasPremiadas();
      });

      return () => {
        channel.unsubscribe();
      };
    }
  }, [campaign?.id, campaign?.campaign_model, campaign?.cotas_premiadas_visiveis]);

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
      showError('Erro: dados da campanha não encontrados');
      return;
    }

    try {
      let quotasToReserve: number[] = [];

      if (campaign.campaign_model === 'manual') {
        if (selectedQuotas.length === 0) {
          showWarning('Selecione pelo menos uma cota para reservar');
          return;
        }
        quotasToReserve = selectedQuotas;
      } else {
        if (quantity <= 0) {
          showWarning('Selecione uma quantidade válida de cotas');
          return;
        }

        const availableTickets = getAvailableTickets();
        const availableQuotaNumbers = availableTickets.map(ticket => ticket.quota_number);

        if (availableQuotaNumbers.length < quantity) {
          showError(`Apenas ${availableQuotaNumbers.length} cotas disponíveis`);
          return;
        }

        const shuffled = [...availableQuotaNumbers].sort(() => 0.5 - Math.random());
        quotasToReserve = shuffled.slice(0, quantity);
      }

      showInfo('Processando sua reserva...');

      // ✅ CORREÇÃO: Limpar formatação do número antes de usar
      const cleanPhone = cleanPhoneNumber(customerData.phoneNumber);
      const fullPhoneNumber = `${customerData.countryCode}${cleanPhone}`;

      const result = await reserveTickets(
        quotasToReserve,
        user?.id || null,
        customerData.name,
        customerData.email,
        fullPhoneNumber  // Agora enviando número limpo
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

        if (!isPhoneAuthenticated) {
          await signInWithPhone(fullPhoneNumber, {
            name: customerData.name,
            email: customerData.email
          });
        }

        showSuccess('Reserva realizada com sucesso!');

        navigate('/payment-confirmation', {
          state: {
            reservationData: {
              reservationId: `RES-${Date.now()}`,
              customerName: customerData.name,
              customerEmail: customerData.email,
              customerPhone: fullPhoneNumber,
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
    } catch (error: any) {
      console.error('Error during reservation:', error);

      let errorMessage = 'Erro ao reservar cotas. Tente novamente.';

      if (error?.message) {
        if (error.message.includes('já reservada')) {
          errorMessage = 'Algumas cotas selecionadas já foram reservadas. Por favor, selecione outras cotas.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'A operação demorou muito tempo. Por favor, tente novamente.';
        } else {
          errorMessage = error.message;
        }
      }

      showError(errorMessage);
    } finally {
      setShowReservationModal(false);
    }
  }, [campaign, user, selectedQuotas, quantity, getAvailableTickets, reserveTickets, navigate, showSuccess, showError, showWarning, showInfo, isPhoneAuthenticated, signInWithPhone]);

  const handleOpenReservationModal = useCallback(() => {
    if (campaign?.campaign_model === 'manual' && selectedQuotas.length === 0) {
      showWarning('Selecione pelo menos uma cota para reservar');
      return;
    }

    if (campaign?.campaign_model === 'automatic' && quantity <= 0) {
      showWarning('Selecione uma quantidade válida de cotas');
      return;
    }

    setShowStep1Modal(true);
  }, [user, campaign, selectedQuotas, quantity, navigate, showWarning]);

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
      <header className={`shadow-sm border-b ${themeClasses.border} ${campaignTheme === 'escuro' ? 'bg-black' : themeClasses.cardBg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => campaign?.user_id && navigate(`/org/${campaign.user_id}`)}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200"
            >
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
            </button>

            <button
              onClick={() => {
                if (isPhoneAuthenticated) {
                  navigate('/my-tickets');
                } else {
                  setShowPhoneLoginModal(true);
                }
              }}
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

      {/* Main Content - Continua com todo o resto do código igual à versão 6, mas SEM o avatar do organizador */}
      
      <CampaignFooter campaignTheme={campaignTheme} />
    </div>
  );
};

export default CampaignPage;