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
  Award
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
import SocialMediaFloatingMenu from '../components/SocialMediaFloatingMenu';
import { CustomerData as ExistingCustomer } from '../utils/customerCheck';
import { Promotion } from '../types/promotion';
import { CotaPremiada } from '../types/cotasPremiadas';
import { formatCurrency } from '../utils/currency';
import { calculateTotalWithPromotions } from '../utils/currency';
import { socialMediaConfig, shareSectionConfig } from '../components/SocialMediaIcons';
import { supabase } from '../lib/supabase';
import { CotasPremiadasAPI } from '../lib/api/cotasPremiadas';

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
  const { user, isPhoneAuthenticated, phoneUser, signInWithPhone } = useAuth();
  const { theme } = useTheme();
  const { showSuccess, showError, showWarning, showInfo } = useNotification();

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

  const [currentQuotaPage, setCurrentQuotaPage] = useState(1);
  const quotasPerPage = 100;

  const {
    tickets,
    loading: ticketsLoading,
    error: ticketsError,
    reserveTickets,
    getAvailableTickets,
    reserving,
    totalTickets,
    currentPage: ticketsCurrentPage,
    totalPages: ticketsTotalPages,
    setPage: setTicketsPage
  } = useTickets(campaign?.id || '', currentQuotaPage, quotasPerPage);

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
  
  const [customerDataForStep2, setCustomerDataForStep2] = useState<ExistingCustomer | null>(null);
  const [quotaCountForStep2, setQuotaCountForStep2] = useState(0);
  const [orderIdForReservation, setOrderIdForReservation] = useState<string | null>(null);
  const [reservationTimestampForReservation, setReservationTimestampForReservation] = useState<Date | null>(null);
  
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
    if (campaign?.title) {
      document.title = campaign.title;
    } else {
      document.title = 'Campanha';
    }

    return () => {
      document.title = 'Rifaqui - Plataforma de Rifas Online';
    };
  }, [campaign?.title]);

  useEffect(() => {
    const updateFavicon = () => {
      const faviconLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      
      if (faviconLink) {
        if (organizerProfile?.logo_url) {
          faviconLink.href = organizerProfile.logo_url;
        } else {
          faviconLink.href = '/logo-chatgpt.png';
        }
      }
    };

    updateFavicon();

    return () => {
      const faviconLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (faviconLink) {
        faviconLink.href = '/logo-chatgpt.png';
      }
    };
  }, [organizerProfile?.logo_url]);

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

  const handlePromotionClick = useCallback((promoQuantity: number) => {
    if (!campaign || !isCampaignAvailable) {
      showWarning('Esta campanha não está disponível no momento');
      return;
    }

    if (campaign.campaign_model === 'manual') {
      const availableTickets = getAvailableTickets();
      
      const notSelectedYet = availableTickets.filter(
        ticket => !selectedQuotas.includes(ticket.quota_number)
      );
      
      if (notSelectedYet.length < promoQuantity) {
        showError(`Não há cotas suficientes disponíveis. Apenas ${notSelectedYet.length} cotas disponíveis.`);
        return;
      }

      const shuffled = [...notSelectedYet].sort(() => Math.random() - 0.5);
      const randomQuotas = shuffled
        .slice(0, promoQuantity)
        .map(ticket => ticket.quota_number);

      const newSelection = [...selectedQuotas, ...randomQuotas];
      
      const maxLimit = campaign.max_tickets_per_purchase || 20000;
      if (newSelection.length > maxLimit) {
        showWarning(`Máximo de ${maxLimit.toLocaleString('pt-BR')} ${maxLimit === 1 ? 'cota' : 'cotas'} por compra`);
        return;
      }

      setSelectedQuotas(newSelection);
      showSuccess(`${promoQuantity} cotas aleatórias adicionadas! Total: ${newSelection.length}`);
    } else {
      const currentTotal = quantity + promoQuantity;
      const availableCount = campaign.total_tickets - campaign.sold_tickets;
      
      if (currentTotal > availableCount) {
        showError(`Não há cotas suficientes disponíveis. Apenas ${availableCount} cotas disponíveis.`);
        return;
      }

      const maxLimit = campaign.max_tickets_per_purchase || 20000;
      if (currentTotal > maxLimit) {
        showWarning(`Máximo de ${maxLimit.toLocaleString('pt-BR')} ${maxLimit === 1 ? 'cota' : 'cotas'} por compra`);
        return;
      }

      setQuantity(currentTotal);
      showSuccess(`${promoQuantity} cotas adicionadas! Total: ${currentTotal}`);
    }
  }, [campaign, isCampaignAvailable, getAvailableTickets, selectedQuotas, quantity, showSuccess, showError, showWarning]);

  const handleQuotaSelect = useCallback((quotaNumber: number) => {
    if (!campaign || campaign.campaign_model !== 'manual') return;

    const availableTickets = getAvailableTickets();
    const isAvailable = availableTickets.some(ticket => ticket.quota_number === quotaNumber);

    if (!isAvailable) return;

    setSelectedQuotas(prev => {
      console.log(`🔵 CampaignPage: handleQuotaSelect - Estado anterior (prev):`, prev);
      let newSelection;
      if (prev.includes(quotaNumber)) {
        newSelection = prev.filter(q => q !== quotaNumber);
        console.log(`🟢 CampaignPage: Removendo cota ${quotaNumber}. Nova seleção:`, newSelection);
      } else {
        newSelection = [...prev, quotaNumber]; // problema aqui?
        const maxLimit = campaign.max_tickets_per_purchase || 20000;
        if (newSelection.length <= maxLimit) {
          console.log(`🟢 CampaignPage: Adicionando cota ${quotaNumber}. Nova seleção:`, newSelection);
          return newSelection; // Retorna a nova seleção se estiver dentro do limite
        }
        showWarning(`Máximo de ${maxLimit.toLocaleString('pt-BR')} ${maxLimit === 1 ? 'cota' : 'cotas'} por compra`);
        console.log(`🟡 CampaignPage: Limite máximo atingido. Não adicionando cota ${quotaNumber}. Seleção atual:`, prev);
        return prev; // Retorna o estado anterior se o limite for excedido
      }
      return newSelection; // Retorna a nova seleção para remoção
    });
  }, [campaign, getAvailableTickets, showWarning]);

  const handleQuotaPageChange = useCallback((newPage: number) => {
    setCurrentQuotaPage(newPage);
    setTicketsPage(newPage);
  }, [setTicketsPage]);

  const handleQuantityChange = useCallback((newQuantity: number) => {
    setQuantity(newQuantity);
  }, []);

  const handleReservationSubmit = useCallback(async (
    customerData: CustomerData, 
    totalQuantity: number, 
    orderId: string, 
    reservationTimestamp: Date
  ) => {
    if (!campaign) {
      showError('Erro: dados da campanha não encontrados');
      return null;
    }

    console.log('🔵 CampaignPage - handleReservationSubmit START');

    try {
      showInfo('Processando sua reserva...');

      const normalizedPhoneNumber = customerData.phoneNumber;

      const reservationResult = await reserveTickets(
        customerData,
        totalQuantity,
        orderId,
        reservationTimestamp
      );

      if (reservationResult) {
        const { total: totalValue } = calculateTotalWithPromotions(
          totalQuantity,
          campaign.ticket_price,
          campaign.promotions || []
        );

        setReservationCustomerData(customerData);
        setReservationQuotas(reservationResult.results.map(r => r.quota_number));
        setReservationTotalValue(totalValue);

        setSelectedQuotas([]);
        setQuantity(Math.max(1, campaign.min_tickets_per_purchase || 1));

        if (!isPhoneAuthenticated) {
          await signInWithPhone(normalizedPhoneNumber, {
            name: customerData.name,
            email: customerData.email
          });
        }

        showSuccess('Reserva realizada com sucesso!');

        navigate('/payment-confirmation', {
          state: {
            reservationData: {
              reservationId: reservationResult.reservationId,
              customerName: customerData.name,
              customerEmail: customerData.email,
              customerPhone: normalizedPhoneNumber,
              quotaCount: totalQuantity,
              totalValue: totalValue,
              selectedQuotas: reservationResult.results.map(r => r.quota_number),
              campaignTitle: campaign.title,
              campaignId: campaign.id,
              campaignPublicId: campaign.public_id,
              expiresAt: new Date(reservationTimestamp.getTime() + (campaign.reservation_timeout_minutes || 15) * 60 * 1000).toISOString(),
              reservationTimeoutMinutes: campaign.reservation_timeout_minutes,
              campaignModel: campaign.campaign_model,
              prizeImageUrl: campaign.prize_image_urls?.[0]
            }
          }
        });

        return reservationResult;
      }

      return null;
    } catch (error: any) {
      console.error('❌ Error during reservation:', error);
      showError(error.message || 'Erro ao reservar cotas. Tente novamente.');
      return null;
    } finally {
      setShowReservationModal(false);
    }
  }, [campaign, user, reserveTickets, navigate, showSuccess, showError, showInfo, isPhoneAuthenticated, signInWithPhone]);

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
  }, [campaign, selectedQuotas, quantity, showWarning]);

  const handleStep1NewCustomer = useCallback((totalQuantity: number, orderId: string, reservationTimestamp: Date) => {
    console.log('🔵 handleStep1NewCustomer - NOVO CLIENTE');
    
    setCustomerDataForStep2(null);
    setQuotaCountForStep2(totalQuantity);
    setOrderIdForReservation(orderId);
    setReservationTimestampForReservation(reservationTimestamp);
    
    setShowStep1Modal(false);
    setShowReservationModal(true);
  }, []);

  const handleStep1ExistingCustomer = useCallback((customerData: ExistingCustomer, totalQuantity: number, orderId: string, reservationTimestamp: Date) => {
    console.log('🔵 handleStep1ExistingCustomer - CLIENTE EXISTENTE');
    
    setCustomerDataForStep2(customerData);
    setQuotaCountForStep2(totalQuantity);
    setOrderIdForReservation(orderId);
    setReservationTimestampForReservation(reservationTimestamp);
    setExistingCustomerData(customerData);
    
    setShowStep1Modal(false);
    setShowStep2Modal(true);
  }, []);

  const handleStep2Confirm = useCallback(async (customerData: CustomerData, totalQuantity: number) => {
    console.log('═══ handleStep2Confirm START ═══');

    if (!customerData || !customerData.name || !customerData.email || !customerData.phoneNumber) {
      showError('Dados do cliente incompletos.');
      return;
    }

    if (!campaign || !orderIdForReservation || !reservationTimestampForReservation) {
      showError('Erro: dados necessários ausentes.');
      return;
    }

    setShowStep2Modal(false);

    try {
      showInfo('Processando sua reserva...');

      const reservationResult = await reserveTickets(
        customerData,
        totalQuantity,
        orderIdForReservation,
        reservationTimestampForReservation
      );

      if (reservationResult) {
        const { total: totalValue } = calculateTotalWithPromotions(
          totalQuantity,
          campaign.ticket_price,
          campaign.promotions || []
        );

        const reservationTimeoutMinutes = campaign.reservation_timeout_minutes || 30;
        const expiresAt = new Date(reservationTimestampForReservation.getTime() + reservationTimeoutMinutes * 60 * 1000).toISOString();

        showSuccess('Cotas reservadas com sucesso!');

        navigate('/payment-confirmation', {
          state: {
            reservationData: {
              reservationId: reservationResult.reservationId,
              customerName: customerData.name,
              customerEmail: customerData.email,
              customerPhone: customerData.phoneNumber,
              quotaCount: totalQuantity,
              totalValue,
              selectedQuotas: reservationResult.results.map(r => r.quota_number),
              campaignTitle: campaign.title,
              campaignId: campaign.id,
              campaignPublicId: campaign.public_id,
              expiresAt,
              reservationTimeoutMinutes,
              campaignModel: campaign.campaign_model,
              prizeImageUrl: campaign.prize_image_urls?.[0]
            }
          }
        });
      } else {
        showError('Erro ao reservar cotas.');
      }
    } catch (error: any) {
      console.error('❌ EXCEPTION during reservation', error);
      showError(error.message || 'Erro ao reservar cotas.');
    }
  }, [campaign, reserveTickets, navigate, showError, showSuccess, showInfo, orderIdForReservation, reservationTimestampForReservation]);

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
          headerBg: 'bg-white',
          border: 'border-gray-200',
          rifaquiText: 'text-gray-900',
          calendarBg: '#dbdbdb',
          calendarBorder: '#dbdbdb',
          calendarText: 'text-gray-900'
        };
      case 'escuro':
        return {
          background: 'bg-slate-900',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          cardBg: 'bg-slate-800',
          headerBg: 'bg-black',
          border: 'border-[#101625]',
          rifaquiText: 'text-white',
          calendarBg: '#101625',
          calendarBorder: '#101625',
          calendarText: 'text-white'
        };
      case 'escuro-preto':
        return {
          background: 'bg-black',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          cardBg: 'bg-gray-900',
          headerBg: 'bg-[#161b26]',
          border: 'border-[#101625]',
          rifaquiText: 'text-white',
          calendarBg: '#090E1A',
          calendarBorder: '#090E1A',
          calendarText: 'text-white'
        };
      case 'escuro-cinza':
        return {
          background: 'bg-[#1A1A1A]',
          text: 'text-white',
          textSecondary: 'text-gray-400',
          cardBg: 'bg-[#2C2C2C]',
          headerBg: 'bg-[#141414]',
          border: 'border-[#1f1f1f]',
          rifaquiText: 'text-white',
          calendarBg: '#141414',
          calendarBorder: '#1f1f1f',
          calendarText: 'text-white'
        };
      default:
        return {
          background: 'bg-gray-50',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          cardBg: 'bg-white',
          headerBg: 'bg-white',
          border: 'border-gray-200',
          rifaquiText: 'text-gray-900',
          calendarBg: '#FFFFFF',
          calendarBorder: '#E5E7EB',
          calendarText: 'text-gray-900'
        };
    }
  };

  const getCardShadow = () => {
    return campaignTheme === 'claro'
      ? 'shadow-[0_8px_30px_-8px_rgba(0,0,0,0.2),0_4px_15px_-4px_rgba(0,0,0,0.12)]'
      : 'shadow-[0_8px_30px_-8px_rgba(0,0,0,0.6),0_4px_15px_-4px_rgba(0,0,0,0.4)]';
  };

  const getCardHoverShadow = () => {
    return 'hover:shadow-[0_15px_45px_-10px_rgba(0,0,0,0.3),0_8px_22px_-6px_rgba(0,0,0,0.2)]';
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

  if (loading || ticketsLoading) {
    const loadingPrimaryColor = organizerProfile?.primary_color || '#3B82F6';
    const loadingTheme = organizerProfile?.theme || 'claro';
    const loadingBgColor = loadingTheme === 'claro' ? 'bg-gray-50' : loadingTheme === 'escuro' ? 'bg-slate-900' : 'bg-black';
    
    return (
      <div className={`min-h-screen ${loadingBgColor} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{ borderColor: loadingPrimaryColor }}></div>
      </div>
    );
  }

  if (error || !campaign || (!user && campaign && campaign.is_paid === false)) {
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
      <header className={`shadow-sm border-b ${themeClasses.border} ${themeClasses.headerBg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => campaign?.user_id && navigate(`/org/${campaign.user_id}`)}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200"
            >
              {organizerProfile?.logo_url ? (
                <img
                  src={organizerProfile.logo_url}
                  alt="Logo do organizador"
                  className="h-12 w-auto max-w-[180px] object-contain"
                />
              ) : (
                <>
                  <img
                    src="/logo-chatgpt.png"
                    alt="Rifaqui Logo"
                    className="w-8 h-8 object-contain"
                  />
                  <span className={`ml-2 text-xl font-bold ${themeClasses.rifaquiText}`}>Rifaqui</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                if (isPhoneAuthenticated) {
                  navigate('/my-tickets', {
                    state: {
                      campaignId: campaign?.id,
                      organizerId: campaign?.user_id
                    }
                  });
                } else {
                  setShowPhoneLoginModal(true);
                }
              }}
              className={`text-white px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg hover:scale-105 text-sm ${getColorClassName()}`}
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
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`text-2xl md:text-3xl font-bold ${themeClasses.text} mb-4 text-center`}
        >
          {campaign.title}
        </motion.h1>

        {/* Seção de Ganhadores */}
        {isCampaignCompleted && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`${themeClasses.cardBg} rounded-xl ${getCardShadow()} ${getCardHoverShadow()} border ${themeClasses.border} overflow-hidden mb-6 max-w-3xl mx-auto transition-all duration-300`}
          >
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

        {/* Galeria de imagens */}
        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`${themeClasses.cardBg} rounded-xl ${getCardShadow()} ${getCardHoverShadow()} border ${themeClasses.border} overflow-hidden mb-4 max-w-3xl mx-auto transition-all duration-300`}
        >
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

          {/* Barra de progresso e Data */}
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
              <div 
                className="flex items-center justify-center p-3 rounded-lg border"
                style={{ 
                  backgroundColor: themeClasses.calendarBg,
                  borderColor: themeClasses.calendarBorder
                }}
              >
                <Calendar className={`h-4 w-4 mr-2 ${themeClasses.calendarText}`} />
                <span className={`text-sm font-medium ${themeClasses.calendarText}`}>
                  Sorteio: <span className={`font-bold ${themeClasses.calendarText}`}>{formatDate(campaign.draw_date)}</span>
                </span>
              </div>
            )}
          </div>
        </motion.section>

        {/* Prêmios */}
        {!isCampaignCompleted && campaign.prizes && Array.isArray(campaign.prizes) && campaign.prizes.length > 0 && (
          <motion.section 
            className={`${themeClasses.cardBg} rounded-xl ${getCardShadow()} ${getCardHoverShadow()} border ${themeClasses.border} overflow-hidden mb-4 max-w-3xl mx-auto cursor-pointer transition-all duration-300`}
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
            <div 
              className={getColorClassName("px-4 py-3 flex items-center justify-center gap-2")}
              style={getColorStyle(true)}
            >
              <Trophy className="h-5 w-5 text-white" />
              <h3 className="text-lg font-bold text-white">
                Prêmios
              </h3>
            </div>
          </motion.section>
        )}

        {/* Cotas Premiadas */}
        {!isCampaignCompleted && campaign?.campaign_model === 'automatic' && cotasPremiadas.length > 0 && campaign?.cotas_premiadas_visiveis && (
          <motion.section
            className={`${themeClasses.cardBg} rounded-xl ${getCardShadow()} ${getCardHoverShadow()} border ${themeClasses.border} overflow-hidden mb-4 max-w-3xl mx-auto cursor-pointer transition-all duration-300`}
            onClick={() => setShowCotasPremiadasModal(true)}
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
            <div
              className={getColorClassName("px-4 py-3 flex items-center justify-center gap-2")}
              style={getColorStyle(true)}
            >
              <Award className="h-5 w-5 text-white" />
              <h3 className="text-lg font-bold text-white">
                Cotas Premiadas
              </h3>
            </div>
          </motion.section>
        )}

        {/* Organizador */}
        {!isCampaignCompleted && organizerProfile && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className={`${themeClasses.cardBg} rounded-xl ${getCardShadow()} ${getCardHoverShadow()} border ${themeClasses.border} p-4 mb-4 max-w-3xl mx-auto transition-all duration-300`}
        >
          {loadingOrganizer ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: primaryColor || '#3B82F6' }}></div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className={`text-sm ${themeClasses.textSecondary}`}>
                Organizador:
              </span>
              <span className={`text-base font-semibold ${themeClasses.text}`}>
                {organizerProfile.name}
              </span>
            </div>
          )}
        </motion.section>
        )}

        {/* Promoções */}
        {!isCampaignCompleted && campaign.promotions && Array.isArray(campaign.promotions) && campaign.promotions.length > 0 && (
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className={`${themeClasses.cardBg} rounded-xl ${getCardShadow()} ${getCardHoverShadow()} border ${themeClasses.border} overflow-hidden mb-4 max-w-3xl mx-auto transition-all duration-300`}
          >
            <div className={`text-center px-6 pt-6 pb-4`}>
              <h2 className={`text-xl md:text-2xl font-bold ${themeClasses.text} mb-2 flex items-center justify-center gap-2`}>
                🎁 Promoções Disponíveis
              </h2>
              <p className={`text-xs md:text-sm ${themeClasses.textSecondary}`}>
                Compre mais cotas e economize! Quanto mais você participar, maiores suas chances de ganhar.
              </p>
            </div>

            <div className="px-4 pb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {campaign.promotions.map((promo: Promotion) => {
                const originalValue = promo.ticketQuantity * campaign.ticket_price;
                const discountPercentage = originalValue > 0 ? Math.round((promo.fixedDiscountAmount / originalValue) * 100) : 0;
                const finalValue = originalValue - promo.fixedDiscountAmount;
                const colorMode = organizerProfile?.color_mode || 'solid';

                return (
                  <motion.div 
                    key={promo.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    {colorMode === 'gradient' ? (
                      <div
                        className={getColorClassName("p-0.5 rounded-lg")}
                        style={getColorStyle(true)}
                      >
                        <button
                          type="button"
                          onClick={() => handlePromotionClick(promo.ticketQuantity)}
                          disabled={!isCampaignAvailable}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                            themeClasses.cardBg
                          }`}
                        >
                          <span className={`text-xs md:text-sm font-bold ${themeClasses.text} text-left`}>
                            {promo.ticketQuantity} cotas por {formatCurrency(finalValue)}
                          </span>
                          <span className="flex-shrink-0 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                            {discountPercentage}%
                          </span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handlePromotionClick(promo.ticketQuantity)}
                        disabled={!isCampaignAvailable}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg transition-all duration-200 border-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                          themeClasses.cardBg
                        }`}
                        style={{
                          borderColor: organizerProfile?.primary_color || (campaignTheme === 'claro' ? '#d1d5db' : '#4b5563')
                        }}
                      >
                        <span className={`text-xs md:text-sm font-bold ${themeClasses.text} text-left`}>
                          {promo.ticketQuantity} cotas por {formatCurrency(finalValue)}
                        </span>
                        <span className="flex-shrink-0 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                          {discountPercentage}%
                        </span>
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Compra/seleção de cota */}
        {!isCampaignCompleted && (
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className={`${themeClasses.cardBg} rounded-xl ${getCardShadow()} ${getCardHoverShadow()} border ${themeClasses.border} p-4 mb-4 max-w-3xl mx-auto transition-all duration-300`}
        >
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

              <div data-quota-grid>
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
                  currentPage={currentQuotaPage}
                  totalPages={ticketsTotalPages}
                  onPageChange={handleQuotaPageChange}
                />
              </div>

              {selectedQuotas.length > 0 && (
                <div className={`${themeClasses.background} rounded-xl p-4 border ${themeClasses.border}`}>
                  <h3 className={`text-base font-bold ${themeClasses.text} mb-3`}>
                    Cotas Selecionadas
                  </h3>
                  
                  <div className="mb-3 pb-16">
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
                    <div className={`mb-3 p-3 border-2 border-green-500 dark:border-green-500 rounded-lg shadow-sm ${themeClasses.cardBg}`}>
                      <div className="text-center">
                        <div className="text-sm font-bold text-green-600 dark:text-green-400 mb-1">
                          🎉 Promoção Aplicada: {currentPromotionInfo.discountPercentage}% OFF
                        </div>
                        <div className="text-sm font-semibold text-green-600 dark:text-green-400">
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

            <div data-quota-selector>
              <QuotaSelector
                ticketPrice={campaign.ticket_price}
                minTicketsPerPurchase={campaign.min_tickets_per_purchase || 1}
                maxTicketsPerPurchase={campaign.max_tickets_per_purchase || 20000}
                onQuantityChange={handleQuantityChange}
                initialQuantity={quantity}
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
            </div>
            </>
          )}
        </motion.section>
        )}

        {/* Descrição */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className={`${themeClasses.cardBg} rounded-xl ${getCardShadow()} ${getCardHoverShadow()} border ${themeClasses.border} p-4 mb-4 max-w-3xl mx-auto transition-all duration-300`}
        >
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
        </motion.section>

        {/* Método de Sorteio */}
        {!isCampaignCompleted && (
        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className={`${themeClasses.cardBg} rounded-xl ${getCardShadow()} ${getCardHoverShadow()} border ${themeClasses.border} p-4 max-w-3xl mx-auto mb-4 transition-all duration-300`}
        >
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
        </motion.section>
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

      {/* Step 2 Modal */}
      {showStep2Modal && 
       customerDataForStep2 && 
       quotaCountForStep2 > 0 && 
       orderIdForReservation && 
       reservationTimestampForReservation && (
        <ReservationStep2Modal
          isOpen={showStep2Modal}
          onClose={() => setShowStep2Modal(false)}
          onConfirm={handleStep2Confirm}
          customerData={customerDataForStep2}
          quotaCount={quotaCountForStep2}
          totalValue={getCurrentTotalValue()}
          selectedQuotas={campaign.campaign_model === 'manual' ? selectedQuotas : undefined}
          campaignTitle={campaign.title}
          primaryColor={primaryColor}
          colorMode={organizerProfile?.color_mode}
          gradientClasses={organizerProfile?.gradient_classes}
          customGradientColors={organizerProfile?.custom_gradient_colors}
          campaignTheme={campaignTheme}
          confirming={reserving}
          orderId={orderIdForReservation}
          reservationTimestamp={reservationTimestampForReservation}
        />
      )}

      {/* Reservation Modal */}
      {showReservationModal && 
       quotaCountForStep2 > 0 && 
       orderIdForReservation && 
       reservationTimestampForReservation && (
        <ReservationModal
          isOpen={showReservationModal}
          onClose={() => setShowReservationModal(false)}
          onReserve={handleReservationSubmit}
          quotaCount={quotaCountForStep2}
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
          customerData={null}
          orderId={orderIdForReservation}
          reservationTimestamp={reservationTimestampForReservation}
        />
      )}

      {/* Prizes Display Modal */}
      {campaign && (
        <PrizesDisplayModal
          isOpen={showPrizesModal}
          onClose={() => setShowPrizesModal(false)}
          prizes={campaign.prizes || []}
          campaignTitle={campaign.title}
          campaignTheme={campaignTheme}
          colorMode={organizerProfile?.color_mode}
          primaryColor={primaryColor}
          gradientClasses={organizerProfile?.gradient_classes}
          customGradientColors={organizerProfile?.custom_gradient_colors}
        />
      )}

      {/* Cotas Premiadas Public Modal */}
      {campaign && (
        <CotasPremiadasPublicModal
          isOpen={showCotasPremiadasModal}
          onClose={() => setShowCotasPremiadasModal(false)}
          cotasPremiadas={cotasPremiadas}
          campaignTitle={campaign.title}
          campaignTheme={campaignTheme}
          totalTickets={campaign.total_tickets}
          colorMode={organizerProfile?.color_mode}
          primaryColor={primaryColor}
          gradientClasses={organizerProfile?.gradient_classes}
          customGradientColors={organizerProfile?.custom_gradient_colors}
        />
      )}

      {/* Phone Login Modal */}
      <PhoneLoginModal
        isOpen={showPhoneLoginModal}
        onClose={() => setShowPhoneLoginModal(false)}
        primaryColor={primaryColor}
        colorMode={organizerProfile?.color_mode}
        gradientClasses={organizerProfile?.gradient_classes}
        customGradientColors={organizerProfile?.custom_gradient_colors}
        campaignTheme={campaignTheme}
        campaignId={campaign?.id}
        organizerId={campaign?.user_id}
      />

      <CampaignFooter campaignTheme={campaignTheme} />

      {/* Menu Flutuante de Redes Sociais */}
      <SocialMediaFloatingMenu
        socialMediaLinks={organizerProfile?.social_media_links}
        primaryColor={primaryColor}
        colorMode={organizerProfile?.color_mode}
        gradientClasses={organizerProfile?.gradient_classes}
        customGradientColors={organizerProfile?.custom_gradient_colors}
        campaignTheme={campaignTheme}
      />
    </div>
  );
};

export default CampaignPage;