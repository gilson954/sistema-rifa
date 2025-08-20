import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Shield, Share2, ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { useParams, useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import QuotaGrid from '../components/QuotaGrid';
import QuotaSelector from '../components/QuotaSelector';
import ReservationModal, { CustomerData } from '../components/ReservationModal';
import { useCampaignBySlug, useCampaignByCustomDomain } from '../hooks/useCampaigns';
import { useTickets } from '../hooks/useTickets';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Promotion, Prize } from '../types/promotion';
import { socialMediaConfig, shareSectionConfig } from '../components/SocialMediaIcons';

interface Prize {
  id: string;
  name: string;
}

const CampaignPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedQuotas, setSelectedQuotas] = useState<number[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'available' | 'reserved' | 'purchased' | 'my-numbers'>('all');
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [showPrizesModal, setShowPrizesModal] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [primaryColor, setPrimaryColor] = useState<string | null>(null);
  const [campaignTheme, setCampaignTheme] = useState<string>('claro');
  const [organizerName, setOrganizerName] = useState<string>('Organizador');
  const [organizerSocialLinks, setOrganizerSocialLinks] = useState<Record<string, string>>({});

  // Detecta se o acesso é via domínio personalizado
  const queryParams = new URLSearchParams(location.search);
  const customDomain = queryParams.get('custom_domain');
  
  // Usa o hook apropriado baseado no tipo de acesso
  const { 
    campaign: campaignBySlug, 
    loading: loadingBySlug, 
    error: errorBySlug 
  } = useCampaignBySlug(customDomain ? '' : slug || '');
  
  const { 
    campaign: campaignByDomain, 
    loading: loadingByDomain, 
    error: errorByDomain 
  } = useCampaignByCustomDomain(customDomain || '');
  
  // Determina qual campanha e estado de loading usar
  const campaign = customDomain ? campaignByDomain : campaignBySlug;
  const campaignLoading = customDomain ? loadingByDomain : loadingBySlug;
  const campaignError = customDomain ? errorByDomain : errorBySlug;

  // Hook para gerenciar tickets da campanha
  const {
    tickets,
    loading: ticketsLoading,
    error: ticketsError,
    reserving,
    purchasing,
    reserveTickets,
    finalizePurchase,
    getMyTickets,
    getAvailableTickets,
    getReservedTickets,
    getPurchasedTickets
  } = useTickets(campaign?.id || '');
  
  // Funções para obter classes de tema adaptativas
  const getCardBackgroundClasses = (theme: string) => {
    switch (theme) {
      case 'claro':
        return 'bg-white border-gray-200';
      case 'escuro':
        return 'bg-gray-900 border-gray-800';
      case 'escuro-preto':
        return 'bg-gray-900 border-gray-800';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const getInnerElementBackgroundClasses = (theme: string) => {
    switch (theme) {
      case 'claro':
        return 'bg-gray-50 border-gray-200';
      case 'escuro':
        return 'bg-gray-800 border-gray-700';
      case 'escuro-preto':
        return 'bg-gray-800 border-gray-700';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTextClasses = (theme: string) => {
    switch (theme) {
      case 'claro':
        return {
          primary: 'text-gray-900',
          secondary: 'text-gray-600',
          muted: 'text-gray-500'
        };
      case 'escuro':
      case 'escuro-preto':
        return {
          primary: 'text-white',
          secondary: 'text-gray-300',
          muted: 'text-gray-400'
        };
      default:
        return {
          primary: 'text-gray-900',
          secondary: 'text-gray-600',
          muted: 'text-gray-500'
        };
    }
  };

  // Combine real campaign data with preview data if available
  // Prioritize real campaign data for public viewing, but allow previewData to override specific fields
  const campaignData = {
    // Use real campaign data as base
    ...campaign,
    // Override with previewData if present (for preview of unsaved changes)
    ...(location.state?.previewData || {}),
    // Explicitly ensure description comes from campaign if not in previewData
    description: location.state?.previewData?.description || campaign?.description || '',
    // Ensure images are handled correctly, combining existing and new
    images: location.state?.previewData?.prize_image_urls || campaign?.prize_image_urls || [
      // Fallback mock images if no images are available
      'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/2047905/pexels-photo-2047905.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ],
    // Ensure prizes come from campaign or previewData
    prizes: location.state?.previewData?.prizes || campaign?.prizes || [] as Prize[],
    // Ensure promotions come from campaign or previewData
    promotions: location.state?.previewData?.promotions || campaign?.promotions || [],
    // Ensure other fields like title, ticketPrice, totalTickets, etc. are correctly sourced
    title: location.state?.previewData?.title || campaign?.title || 'Setup Gamer',
    ticketPrice: location.state?.previewData?.ticket_price || campaign?.ticket_price || 1.00,
    totalTickets: location.state?.previewData?.total_tickets || campaign?.total_tickets || 100,
    minTicketsPerPurchase: location.state?.previewData?.min_tickets_per_purchase || campaign?.min_tickets_per_purchase || 1,
    maxTicketsPerPurchase: location.state?.previewData?.max_tickets_per_purchase || campaign?.max_tickets_per_purchase || 1000,
    drawMethod: location.state?.previewData?.draw_method || campaign?.draw_method || 'Loteria Federal',
    showPercentage: location.state?.previewData?.show_percentage || campaign?.show_percentage || false,
    soldTickets: location.state?.previewData?.sold_tickets || campaign?.sold_tickets || 0,
    organizer: {
      name: organizerName,
      verified: true
    },
    model: (location.state?.previewData?.campaign_model || campaign?.campaign_model || 'manual') as 'manual' | 'automatic',
    // Mock reserved/purchased quotas for demonstration if not coming from DB
    reservedQuotas: campaign?.reserved_quotas || [5, 12, 23, 45, 67, 89, 134, 156, 178, 199],
    purchasedQuotas: campaign?.purchased_quotas || [1, 3, 8, 15, 22, 34, 56, 78, 91, 123],
  };

  // Buscar cor principal do organizador da campanha
  useEffect(() => {
    const fetchOrganizerSettings = async () => {
      if (campaignData.user_id) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('primary_color, theme, name, social_media_links')
            .eq('id', campaignData.user_id)
            .single();

          if (error) {
            console.error('Error fetching organizer settings:', error);
          } else if (data) {
            if (data.primary_color) {
              setPrimaryColor(data.primary_color);
            }
            if (data.theme) {
              setCampaignTheme(data.theme);
            }
            if (data.name) {
              setOrganizerName(data.name);
            }
            if (data.social_media_links) {
              setOrganizerSocialLinks(data.social_media_links);
            }
          }
        } catch (error) {
          console.error('Error fetching organizer settings:', error);
        }
      }
    };

    fetchOrganizerSettings();
  }, [campaignData.user_id]);

  // --- SISTEMA DE APLICAÇÃO AUTOMÁTICA DE PROMOÇÕES ---

  /**
   * Ordena as promoções pela quantidade de bilhetes para definir as faixas de aplicação
   * Performance: useMemo garante que a ordenação só aconteça quando as promoções mudarem
   */
  const sortedPromotions = useMemo(() => {
    if (!campaignData.promotions || campaignData.promotions.length === 0) {
      return [];
    }
    
    // Filtra promoções válidas e ordena por quantidade crescente
    return [...campaignData.promotions]
      .filter(promo => promo.ticketQuantity > 0 && promo.discountedTotalValue > 0)
      .sort((a, b) => a.ticketQuantity - b.ticketQuantity);
  }, [campaignData.promotions]);

  /**
   * Calcula qual promoção deve ser aplicada baseada na quantidade atual de cotas
   * Regra: Aplica a promoção com maior ticketQuantity que seja <= currentQuantity
   * 
   * Exemplo:
   * - Promoção A: 100 cotas → Aplica de 100 a 299 cotas
   * - Promoção B: 300 cotas → Aplica de 300 a 10.000.000 cotas
   */
  const getApplicablePromotion = useCallback((currentQuantity: number): Promotion | null => {
    if (!sortedPromotions || sortedPromotions.length === 0 || currentQuantity <= 0) {
      return null;
    }

    // Encontra a melhor promoção aplicável
    let bestPromotion: Promotion | null = null;

    for (const promo of sortedPromotions) {
      if (currentQuantity >= promo.ticketQuantity) {
        bestPromotion = promo; // Continua procurando por uma promoção melhor
      } else {
        break; // Como está ordenado, não há mais promoções aplicáveis
      }
    }

    return bestPromotion;
  }, [sortedPromotions]);

  /**
   * Calcula o valor total considerando promoções aplicáveis
   * Aplica valor promocional para o bloco de cotas da promoção e preço original para cotas excedentes
   */
  const calculateTotalWithPromotion = useMemo(() => {
    const currentQuantity = campaignData.model === 'automatic' ? quantity : selectedQuotas.length;
    const applicablePromotion = getApplicablePromotion(currentQuantity);

    if (applicablePromotion) {
      // Calcula o valor total: valor promocional + cotas excedentes com preço original
      const promotionBlockCost = applicablePromotion.discountedTotalValue;
      const excessTickets = currentQuantity - applicablePromotion.ticketQuantity;
      const excessCost = excessTickets > 0 ? excessTickets * campaignData.ticketPrice : 0;
      
      return promotionBlockCost + excessCost;
    }
    
    // Caso contrário, retorna o valor normal (quantidade * preço original)
    return currentQuantity * campaignData.ticketPrice;
  }, [quantity, selectedQuotas.length, campaignData.model, campaignData.ticketPrice, getApplicablePromotion]);

  /**
   * Calcula informações sobre a promoção aplicada (para exibição na UI)
   */
  const promotionInfo = useMemo(() => {
    const currentQuantity = campaignData.model === 'automatic' ? quantity : selectedQuotas.length;
    const applicablePromotion = getApplicablePromotion(currentQuantity);

    if (!applicablePromotion) {
      return null;
    }

    const originalTotal = currentQuantity * campaignData.ticketPrice;
    
    // Calcula o valor promocional: valor da promoção + cotas excedentes com preço original
    const promotionBlockCost = applicablePromotion.discountedTotalValue;
    const excessTickets = currentQuantity - applicablePromotion.ticketQuantity;
    const excessCost = excessTickets > 0 ? excessTickets * campaignData.ticketPrice : 0;
    const promotionalTotal = promotionBlockCost + excessCost;
    
    const savings = originalTotal - promotionalTotal;
    const discountPercentage = Math.round((savings / originalTotal) * 100);

    return {
      promotion: applicablePromotion,
      originalTotal,
      promotionalTotal,
      savings,
      discountPercentage
    };
  }, [quantity, selectedQuotas.length, campaignData.model, campaignData.ticketPrice, getApplicablePromotion]);

  // --- FIM DO SISTEMA DE PROMOÇÕES ---

  // Initialize quantity with minimum tickets per purchase
  React.useEffect(() => {
    if (campaignData.model === 'automatic') {
      setQuantity(campaignData.minTicketsPerPurchase);
    }
  }, [campaignData.minTicketsPerPurchase, campaignData.model]);

  if (campaignLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (campaignError || !campaign) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Campanha não encontrada
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {customDomain 
              ? `O domínio ${customDomain} não está configurado ou a campanha não foi encontrada.`
              : `A campanha com o código "${slug}" não foi encontrada.`
            }
          </p>
          <a 
            href="/"
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    );
  }
  const handleQuotaSelect = (quotaNumber: number) => {
    // Verifica se a cota está disponível
    const ticket = tickets.find(t => t.quota_number === quotaNumber);
    if (ticket && ticket.status !== 'disponível' && !selectedQuotas.includes(quotaNumber)) {
      return; // Não permite selecionar cotas reservadas ou compradas
    }

    setSelectedQuotas(prev => {
      if (prev.includes(quotaNumber)) {
        // Remove da seleção se já estiver selecionada
        return prev.filter(q => q !== quotaNumber);
      } else {
        // Adiciona à seleção se não estiver selecionada
        return [...prev, quotaNumber];
      }
    });
  };

  const handleFilterChange = (filter: 'all' | 'available' | 'reserved' | 'purchased' | 'my-numbers') => {
    setActiveFilter(filter);
  };

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentImageIndex(index);
  };

  const handleMainImageClick = () => {
    setIsLightboxOpen(true);
  };

  const handleCloseLightbox = () => {
    setIsLightboxOpen(false);
  };

  const handlePreviousImage = () => {
    setCurrentImageIndex(prev => 
      prev === 0 ? campaignData.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => 
      prev === campaignData.images.length - 1 ? 0 : prev + 1
    );
  };

  const handlePromotionClick = (promo: any) => {
    // Não executa ação se estiver no modo manual
    if (campaignData.model === 'manual') {
      return;
    }
    
    console.log('Promoção clicada:', promo);
    
    if (campaignData.model === 'automatic') {
      // Para modelo automático: atualiza a quantidade no seletor
      setQuantity(promo.ticketQuantity);
      
      // Scroll suave para o seletor de cotas para mostrar a atualização
      const quotaSelector = document.querySelector('.quota-selector');
      if (quotaSelector) {
        quotaSelector.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
      
      // Feedback visual opcional - você pode adicionar uma notificação toast aqui
      console.log(`Quantidade atualizada para ${promo.ticketQuantity} bilhetes`);
      
    } else if (campaignData.model === 'manual') {
      // Para modelo manual: seleciona automaticamente as primeiras cotas disponíveis
      const availableQuotas = [];
      
      // Encontra as primeiras cotas disponíveis
      for (let i = 0; i < campaignData.totalTickets && availableQuotas.length < promo.ticketQuantity; i++) {
        const quotaNumber = i;
        const isAvailable = !campaignData.reservedQuotas.includes(quotaNumber) && 
                           !campaignData.purchasedQuotas.includes(quotaNumber) &&
                           !selectedQuotas.includes(quotaNumber);
        
        if (isAvailable) {
          availableQuotas.push(quotaNumber);
        }
      }
      
      // Adiciona as cotas encontradas à seleção
      if (availableQuotas.length > 0) {
        setSelectedQuotas(prev => [...prev, ...availableQuotas]);
        
        // Scroll para a grade de cotas
        const quotaGrid = document.querySelector('.quota-grid');
        if (quotaGrid) {
          quotaGrid.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
        
        console.log(`${availableQuotas.length} cotas selecionadas automaticamente`);
      } else {
        // Não há cotas suficientes disponíveis
        console.warn('Não há cotas suficientes disponíveis para esta promoção');
        // Aqui você poderia mostrar uma mensagem de erro para o usuário
      }
    }
  };

  const handleSocialMediaClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenReservationModal = () => {
    if (!user) {
      // For non-logged users, open the reservation modal
      setShowReservationModal(true);
      return;
    }

    // For logged users, proceed directly with reservation
    handleDirectReservation();
  };

  const handleDirectReservation = async () => {
    if (!user) return;

    if (campaignData.model === 'manual' && selectedQuotas.length === 0) {
      alert('Selecione pelo menos uma cota');
      return;
    }

    if (campaignData.model === 'automatic' && quantity <= 0) {
      alert('Selecione uma quantidade válida');
      return;
    }

    try {
      let quotasToReserve: number[];
      
      if (campaignData.model === 'manual') {
        quotasToReserve = selectedQuotas;
      } else {
        // For automatic mode, select first available tickets
        const availableTickets = getAvailableTickets();
        quotasToReserve = availableTickets
          .slice(0, quantity)
          .map(ticket => ticket.quota_number);

        if (quotasToReserve.length < quantity) {
          alert(`Apenas ${quotasToReserve.length} cotas disponíveis. Não é possível reservar ${quantity} cotas.`);
          return;
        }
      }

      const result = await reserveTickets(quotasToReserve);
      if (result) {
        const successCount = result.filter(r => r.status === 'reservado').length;
        const errorCount = result.filter(r => r.status === 'error').length;
        
        if (successCount > 0) {
          alert(`${successCount} cota(s) reservada(s) com sucesso!`);
          if (campaignData.model === 'manual') {
            setSelectedQuotas([]); // Clear selection after reservation
          }
        }
        
        if (errorCount > 0) {
          const errorMessages = result
            .filter(r => r.status === 'error')
            .map(r => `Cota ${r.quota_number}: ${r.message}`)
            .join('\n');
          alert(`Algumas cotas não puderam ser reservadas:\n${errorMessages}`);
        }
      }
    } catch (error) {
      console.error('Error reserving tickets:', error);
      alert('Erro ao reservar cotas. Tente novamente.');
    }
  };

  const handleReservationSubmit = async (customerData: CustomerData) => {
    try {
      let quotasToReserve: number[];
      
      if (campaignData.model === 'manual') {
        if (selectedQuotas.length === 0) {
          alert('Selecione pelo menos uma cota');
          return;
        }
        quotasToReserve = selectedQuotas;
      } else {
        // For automatic mode, select first available tickets
        const availableTickets = getAvailableTickets();
        quotasToReserve = availableTickets
          .slice(0, quantity)
          .map(ticket => ticket.quota_number);

        if (quotasToReserve.length < quantity) {
          alert(`Apenas ${quotasToReserve.length} cotas disponíveis. Não é possível reservar ${quantity} cotas.`);
          return;
        }
      }

      // For demo purposes, we'll simulate a successful reservation
      // In production, this would create a user account and reserve tickets
      const reservationId = `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes from now

      const reservationData = {
        reservationId,
        customerName: customerData.name,
        customerEmail: customerData.email,
        customerPhone: `${customerData.countryCode} ${customerData.phoneNumber}`,
        quotaCount: campaignData.model === 'manual' ? selectedQuotas.length : quantity,
        totalValue: promotionInfo ? promotionInfo.promotionalTotal : (campaignData.model === 'manual' ? selectedQuotas.length : quantity) * campaignData.ticketPrice,
        selectedQuotas: campaignData.model === 'manual' ? selectedQuotas : quotasToReserve,
        campaignTitle: campaignData.title,
        campaignId: campaign?.id || '',
        expiresAt
      };

      // Navigate to payment confirmation page
      navigate('/payment-confirmation', {
        state: { reservationData }
      });

    } catch (error) {
      console.error('Error processing reservation:', error);
      alert('Erro ao processar reserva. Tente novamente.');
    }
  };

  const handleAutomaticReserve = async () => {
    if (!user) {
      setShowReservationModal(true);
      return;
    }

    if (quantity <= 0) {
      alert('Selecione uma quantidade válida');
      return;
    }

    // Para modo automático, seleciona as primeiras cotas disponíveis
    const availableTickets = getAvailableTickets();
    const quotasToReserve = availableTickets
      .slice(0, quantity)
      .map(ticket => ticket.quota_number);

    if (quotasToReserve.length < quantity) {
      alert(`Apenas ${quotasToReserve.length} cotas disponíveis. Não é possível reservar ${quantity} cotas.`);
      return;
    }

    try {
      const result = await reserveTickets(quotasToReserve);
      if (result) {
        const successCount = result.filter(r => r.status === 'reservado').length;
        
        if (successCount > 0) {
          alert(`${successCount} cota(s) reservada(s) com sucesso!`);
        }
      }
    } catch (error) {
      console.error('Error reserving tickets:', error);
      alert('Erro ao reservar cotas. Tente novamente.');
    }
  };

  const formatCurrency = (value: number) => {
    // Verificação de segurança para valores inválidos
    if (value === null || value === undefined || isNaN(value)) {
      return 'R$ 0,00';
    }
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  // Função para obter as classes de fundo baseadas no tema
  const getThemeBackgroundClasses = (theme: string) => {
    switch (theme) {
      case 'claro':
        return 'bg-gray-50';
      case 'escuro':
        return 'bg-gray-950';
      case 'escuro-preto':
        return 'bg-black';
      default:
        return 'bg-gray-50'; // Fallback para tema claro
    }
  };

  const currentImage = campaignData.images[currentImageIndex];
  return (
    <div 
      className={`min-h-screen ${getThemeBackgroundClasses(campaignTheme)} transition-colors duration-300`}
      style={{ '--primary-color': primaryColor || '#3B82F6' } as React.CSSProperties}
    >
      {/* Demo Banner */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 py-4 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-2 text-yellow-800 dark:text-yellow-200">
            <span className="text-lg">🔒</span>
            <div className="text-center">
              <div className="font-semibold">Modo de Demonstração</div>
              <div className="text-sm">Para liberar sua campanha e iniciar sua divulgação, conclua o pagamento.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Campaign Images Gallery */}
        <div className="relative mb-8">
          {/* Main Image */}
          <div className="relative rounded-2xl overflow-hidden shadow-xl group cursor-pointer" onClick={handleMainImageClick}>
            <img
              src={currentImage}
              alt={campaignData.title}
              className="w-full h-64 sm:h-80 lg:h-96 object-cover"
            />
            
            {/* Zoom Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white dark:bg-gray-900 rounded-full p-3 shadow-lg">
                <ZoomIn className="h-6 w-6 text-gray-900 dark:text-white" />
              </div>
            </div>
            
            {/* Navigation Arrows (only show if multiple images) */}
            {campaignData.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviousImage();
                  }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
            
            {/* Image Counter */}
            {campaignData.images.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {campaignData.images.length}
              </div>
            )}
            
            {/* Price Tag */}
            <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-900 px-4 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-white">Participe por apenas</span>
                <span 
                  className="font-bold text-lg"
                  style={{ color: primaryColor || '#3B82F6' }}
                >
                  R$ {campaignData.ticketPrice.toFixed(2).replace('.', ',')}
                </span>
                {promotionInfo && (
                  <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                    OFERTA
                  </span>
                )}
                <span className="text-lg">🔥</span>
              </div>
            </div>
          </div>
          
          {/* Thumbnails Strip (only show if multiple images) */}
          {campaignData.images.length > 1 && (
            <div className="mt-4 flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
              {campaignData.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => handleThumbnailClick(index)}
                  className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    index === currentImageIndex
                      ? 'border-purple-500 opacity-100 ring-2 ring-purple-200 dark:ring-purple-800'
                      : 'border-gray-300 dark:border-gray-600 opacity-70 hover:opacity-90 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${campaignData.title} - Imagem ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Campaign Title */}
        <h1 className={`text-3xl sm:text-4xl font-bold ${getTextClasses(campaignTheme).primary} mb-6 text-center transition-colors duration-300`}>
          {campaignData.title}
        </h1>

        {/* Organizer Info */}
        <div className="flex items-center justify-center mb-8">
          <div className={`flex items-center space-x-3 px-6 py-3 rounded-lg shadow-md border transition-colors duration-300 ${getCardBackgroundClasses(campaignTheme)}`}>
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: primaryColor || '#3B82F6' }}
            >
              {campaignData.organizer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className={`text-sm ${getTextClasses(campaignTheme).secondary}`}>Organizado por:</div>
              <div className="flex items-center space-x-2">
                <span className={`font-semibold ${getTextClasses(campaignTheme).primary}`}>{campaignData.organizer.name}</span>
                
                {/* Social Media Icons */}
                <div className="flex items-center space-x-1 ml-2">
                  {/* All Social Media Icons from organizer social links */}
                  {Object.entries(organizerSocialLinks).map(([key, url]) => {
                      const config = socialMediaConfig[key as keyof typeof socialMediaConfig];
                      if (!config || !url) return null;
                      
                      const IconComponent = config.icon;
                      
                      // Special handling for WhatsApp buttons (Support and Group)
                      if (key === 'whatsapp-support' || key === 'whatsapp-group') {
                        return (
                          <button
                            key={key}
                            onClick={() => handleSocialMediaClick(url)}
                            className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center space-x-1 transition-colors duration-200"
                            title={`WhatsApp ${config.name}`}
                          >
                            <IconComponent className="w-3 h-3" />
                            <span>{config.name}</span>
                          </button>
                        );
                      }
                      
                      // Regular social media icons
                      return (
                        <button
                          key={key}
                          onClick={() => handleSocialMediaClick(url)}
                          className="w-6 h-6 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-200 shadow-sm text-white"
                          style={{ backgroundColor: config.color }}
                          title={config.name}
                        >
                          <IconComponent size={14} />
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {campaignData.promotions && campaignData.promotions.length > 0 && (
          <div className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sortedPromotions.map((promo) => {
                // Calcular porcentagem de desconto
                const originalValue = promo.ticketQuantity * campaignData.ticketPrice;
                const discountPercentage = Math.round((promo.fixedDiscountAmount / originalValue) * 100);
                
                return (
                  <button
                    key={promo.id}
                    onClick={() => handlePromotionClick(promo)}
                    className={`relative text-white rounded-lg p-4 transition-all duration-200 border ${getTextClasses(campaignTheme).muted === 'text-gray-500' ? 'border-gray-300' : 'border-gray-600'} group hover:brightness-90 cursor-pointer`}
                    style={{ backgroundColor: primaryColor || '#3B82F6' }}
                  >
                    {/* Badge de desconto */}
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      –{discountPercentage}%
                    </div>
                    
                    {/* Texto principal */}
                    <div className="text-center">
                      <div className="text-sm font-semibold">
                        {promo.ticketQuantity} cotas por {formatCurrency(promo.discountedTotalValue)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Purchase Section */}
        <div>
          {campaignData.model === 'manual' ? (
            <div className={`rounded-2xl shadow-xl p-6 sm:p-8 border transition-colors duration-300 ${getCardBackgroundClasses(campaignTheme)}`}>
              <QuotaGrid
                totalQuotas={campaignData.totalTickets}
                selectedQuotas={selectedQuotas}
                onQuotaSelect={handleQuotaSelect}
                activeFilter={activeFilter}
                onFilterChange={handleFilterChange}
                mode="manual"
                tickets={tickets}
                currentUserId={user?.id}
                campaignTheme={campaignTheme}
                primaryColor={primaryColor}
              />
              
              {/* Contador e Lista de Cotas Selecionadas */}
              {selectedQuotas.length > 0 && (
                <div className="mt-6 space-y-4">
                  {/* Contador X/Y */}
                  <div className="text-center">
                    <span className={`text-lg font-semibold ${getTextClasses(campaignTheme).primary}`}>
                      {selectedQuotas.length}/{campaignData.totalTickets}
                    </span>
                  </div>
                  
                  {/* Lista de Cotas Selecionadas */}
                  <div className={`p-4 rounded-lg border ${getInnerElementBackgroundClasses(campaignTheme)}`}>
                    <div className="text-center">
                      <div 
                        className="text-sm mb-2"
                        style={{ color: primaryColor || '#3B82F6' }}
                      >
                        Meus N°: {selectedQuotas
                          .sort((a, b) => a - b)
                          .map(quota => quota.toString().padStart(campaignData.totalTickets.toString().length, '0'))
                          .join(', ')}
                      </div>
                      {/* Exibição do preço com promoção aplicada */}
                      {promotionInfo && (
                        <div className={`text-sm ${getTextClasses(campaignTheme).secondary} mb-2`}>
                          <span className="line-through">R$ {(selectedQuotas.length * campaignData.ticketPrice).toFixed(2).replace('.', ',')}</span>
                          <span className="ml-2 text-green-600 dark:text-green-400 font-medium">
                            Economia: {formatCurrency(promotionInfo.savings)}
                          </span>
                        </div>
                      )}
                      <div className={`text-xl font-bold ${getTextClasses(campaignTheme).primary} mb-4`}>
                        Total: R$ {(promotionInfo ? promotionInfo.promotionalTotal : selectedQuotas.length * campaignData.ticketPrice).toFixed(2).replace('.', ',')}
                      </div>
                      <button 
                        onClick={handleOpenReservationModal}
                        disabled={reserving || selectedQuotas.length === 0}
                        className="w-full text-white py-3 rounded-lg font-bold hover:brightness-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: primaryColor || '#3B82F6' }}
                      >
                        {reserving ? 'RESERVANDO...' : 'RESERVAR COTAS SELECIONADAS'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <QuotaSelector
                ticketPrice={campaignData.ticketPrice}
                minTicketsPerPurchase={campaignData.minTicketsPerPurchase}
                maxTicketsPerPurchase={campaignData.maxTicketsPerPurchase}
                onQuantityChange={handleQuantityChange}
                initialQuantity={quantity}
                mode="automatic"
                promotionInfo={promotionInfo}
                primaryColor={primaryColor}
                campaignTheme={campaignTheme}
                onReserve={handleOpenReservationModal}
                reserving={reserving}
              />
            </div>
          )}
        </div>

        {/* Prizes Button */}
        <div className="flex justify-center mb-8">
          <button 
            onClick={() => setShowPrizesModal(true)}
            className="text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 shadow-md hover:brightness-90"
            style={{ backgroundColor: primaryColor || '#3B82F6' }}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <span className="text-black text-sm">🏆</span>
            </div>
            <span>Prêmios</span>
          </button>
        </div>

        {/* Progress Percentage */}
        {campaignData.showPercentage && (
          <div className="flex justify-center mb-8">
            <div className="w-full max-w-md mx-auto">
              <div className={`rounded-2xl p-6 border transition-colors duration-300 shadow-lg ${getCardBackgroundClasses(campaignTheme)}`}>
                {/* Progress Text */}
                <div className="text-center mb-4">
                  <div className={`text-2xl font-bold ${getTextClasses(campaignTheme).primary} mb-1`}>
                    {Math.round((campaignData.soldTickets / campaignData.totalTickets) * 100)}% concluído
                  </div>
                </div>
                
                {/* Progress Bar Container */}
                <div className="relative">
                  {/* Background Track */}
                  <div className={`w-full h-4 rounded-full overflow-hidden shadow-inner ${campaignTheme === 'claro' ? 'bg-gray-200' : 'bg-gray-700'}`}>
                    {/* Progress Fill */}
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
                      style={{ 
                        width: `${Math.round((campaignData.soldTickets / campaignData.totalTickets) * 100)}%`,
                        minWidth: Math.round((campaignData.soldTickets / campaignData.totalTickets) * 100) > 0 ? '8px' : '0px',
                        backgroundColor: primaryColor || '#3B82F6'
                      }}
                    >
                      {/* Shine Effect */}
                      <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                    </div>
                  </div>
                  
                  {/* Progress Indicator Dot */}
                  {Math.round((campaignData.soldTickets / campaignData.totalTickets) * 100) > 0 && (
                    <div 
                      className={`absolute top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full shadow-lg transition-all duration-1000 ease-out ${campaignTheme === 'claro' ? 'bg-white' : 'bg-gray-900'}`}
                      style={{ 
                        left: `calc(${Math.round((campaignData.soldTickets / campaignData.totalTickets) * 100)}% - 12px)`,
                        maxLeft: 'calc(100% - 24px)',
                        borderColor: primaryColor || '#3B82F6',
                        borderWidth: '4px'
                      }}
                    >
                      <div 
                        className="w-full h-full rounded-full animate-pulse"
                        style={{ backgroundColor: primaryColor || '#3B82F6' }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Description Section - REPOSITIONED AFTER PURCHASE SECTION */}
        {campaignData.description && campaignData.description.trim() && (
          <div className={`mb-8 rounded-lg p-6 border transition-colors duration-300 ${getCardBackgroundClasses(campaignTheme)}`}>
            <h2 className={`text-xl font-bold ${getTextClasses(campaignTheme).primary} mb-4 flex items-center`}>
              <span className="mr-2">📜</span>
              Descrição / Regulamento
            </h2>
            {/* Debug log to check description content */}
            {console.log('Descrição recebida por CampaignPage:', campaignData.description)}
            <div
              className={`leading-relaxed prose prose-sm max-w-none ${getTextClasses(campaignTheme).secondary} ${campaignTheme !== 'claro' ? 'dark:prose-invert' : ''}`}
              dangerouslySetInnerHTML={{ __html: campaignData.description }}
            />
          </div>
        )}

        {/* Share Section */}
        <div className={`rounded-2xl shadow-xl p-6 sm:p-8 border transition-colors duration-300 mt-8 ${getCardBackgroundClasses(campaignTheme)}`}>
          <h2 className={`text-xl font-bold ${getTextClasses(campaignTheme).primary} mb-6 text-center`}>
            Compartilhar
          </h2>
          
          <div className="flex justify-center space-x-4">
            {Object.entries(shareSectionConfig).map(([key, config]) => {
              const IconComponent = config.icon;
              return (
                <button 
                  key={key}
                  className="w-12 h-12 rounded-lg flex items-center justify-center transition-colors duration-200 text-white hover:brightness-90"
                  style={{ backgroundColor: config.color }}
                  title={config.name}
                >
                  <IconComponent size={24} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Payment and Draw Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
          {/* Payment Method */}
          <div className={`${getCardBackgroundClasses(campaignTheme)} rounded-lg p-6 transition-colors duration-300`}>
            <h3 className={`font-semibold ${getTextClasses(campaignTheme).primary} mb-3`}>MÉTODO DE PAGAMENTO</h3>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">₽</span>
              </div>
              <span className={getTextClasses(campaignTheme).secondary}>PIX</span>
            </div>
          </div>

          {/* Draw Method */}
          <div className={`${getCardBackgroundClasses(campaignTheme)} rounded-lg p-6 transition-colors duration-300`}>
            <h3 className={`font-semibold ${getTextClasses(campaignTheme).primary} mb-3`}>SORTEIO</h3>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🎲</span>
              </div>
              <span className={getTextClasses(campaignTheme).secondary}>{campaignData.drawMethod.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          {/* Close Button */}
          <button
            onClick={handleCloseLightbox}
            className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all duration-200"
          >
            <X className="h-6 w-6" />
          </button>
          
          {/* Image Counter */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm">
            {currentImageIndex + 1} / {campaignData.images.length}
          </div>
          
          {/* Main Lightbox Image */}
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            <img
              src={currentImage}
              alt={`${campaignData.title} - Imagem ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Navigation Arrows (only show if multiple images) */}
            {campaignData.images.length > 1 && (
              <>
                <button
                  onClick={handlePreviousImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all duration-200"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
                
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all duration-200"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              </>
            )}
          </div>
          
          {/* Thumbnail Navigation */}
          {campaignData.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 bg-black bg-opacity-50 p-3 rounded-lg">
              {campaignData.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    index === currentImageIndex
                      ? 'border-white opacity-100'
                      : 'border-gray-400 opacity-60 hover:opacity-80'
                  }`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Prizes Modal */}
      {showPrizesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto text-white">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  <span className="text-black text-lg">🏆</span>
                </div>
                <h2 className="text-xl font-semibold">Prêmios</h2>
              </div>
              <button
                onClick={() => setShowPrizesModal(false)}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {campaignData.prizes && campaignData.prizes.length > 0 && (
              <p className="text-gray-400 mb-6">
                Esses são os prêmios no sorteio <span className="text-white font-semibold">{campaignData.title}</span>
              </p>
            )}

            {/* Prizes List */}
            <div className="space-y-4">
              {campaignData.prizes.map((prize, index) => (
                <div
                  key={prize.id}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl font-bold text-blue-400 flex-shrink-0">
                      {index + 1}°
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm leading-relaxed">
                        {prize.name}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {campaignData.prizes.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏆</span>
                </div>
                <p className="text-gray-400">Nenhum prêmio adicionado ainda</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reservation Modal */}
      <ReservationModal
        isOpen={showReservationModal}
        onClose={() => setShowReservationModal(false)}
        onReserve={handleReservationSubmit}
        quotaCount={campaignData.model === 'manual' ? selectedQuotas.length : quantity}
        totalValue={promotionInfo ? promotionInfo.promotionalTotal : (campaignData.model === 'manual' ? selectedQuotas.length : quantity) * campaignData.ticketPrice}
        selectedQuotas={campaignData.model === 'manual' ? selectedQuotas : undefined}
        campaignTitle={campaignData.title}
        primaryColor={primaryColor}
        campaignTheme={campaignTheme}
        reserving={reserving}
      />

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-8 mt-16 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                Termos de Uso
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                Política de Privacidade
              </a>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>Sistema desenvolvido por</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-white">Rifaqui</span>
                <img 
                  src="/32132123.png" 
                  alt="Rifaqui Logo" 
                  className="w-6 h-6 object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CampaignPage;