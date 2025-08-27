import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Share2, 
  Calendar, 
  Clock, 
  Users, 
  Trophy, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  User,
  Mail,
  Phone
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
import { socialMediaConfig } from '../components/SocialMediaIcons';

interface PromotionInfo {
  promotion: Promotion;
  originalTotal: number;
  promotionalTotal: number;
  savings: number;
  discountPercentage: number;
}

const CampaignPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  
  // Check if this is a custom domain request
  const isCustomDomain = window.location.hostname !== 'localhost' && 
                         window.location.hostname !== '127.0.0.1' &&
                         !window.location.hostname.includes('netlify.app') && 
                         !window.location.hostname.includes('stackblitz.io') &&
                         !window.location.hostname.includes('stackblitz.com') &&
                         !window.location.hostname.includes('webcontainer.io') &&
                         slug; // Only consider custom domain if we have a slug in the URL
  
  // Use appropriate hook based on access method
  const { campaign: campaignBySlug, loading: loadingBySlug, error: errorBySlug } = useCampaignBySlug(slug || '');
  const { campaign: campaignByDomain, loading: loadingByDomain, error: errorByDomain } = useCampaignByCustomDomain(
    isCustomDomain ? window.location.hostname : ''
  );
  
  // Select the appropriate campaign data
  const campaign = isCustomDomain ? campaignByDomain : campaignBySlug;
  const loading = isCustomDomain ? loadingByDomain : loadingBySlug;
  const error = isCustomDomain ? errorByDomain : errorBySlug;

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

  // Get user's profile for theme customization
  const [userProfile, setUserProfile] = useState<{ primary_color?: string; theme?: string } | null>(null);

  // Load user profile for theme customization
  useEffect(() => {
    if (campaign?.user_id) {
      const loadUserProfile = async () => {
        try {
          const { supabase } = await import('../lib/supabase');
          const { data } = await supabase
            .from('profiles')
            .select('primary_color, theme')
            .eq('id', campaign.user_id)
            .single();
          
          if (data) {
            setUserProfile(data);
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      };
      
      loadUserProfile();
    }
  }, [campaign?.user_id]);

  // Get applicable promotion for a given quantity
  const getApplicablePromotion = useCallback((quotaCount: number): PromotionInfo | null => {
    if (!campaign?.promotions || !Array.isArray(campaign.promotions) || campaign.promotions.length === 0) {
      return null;
    }

    // Find promotion that matches the exact quantity
    const applicablePromotion = campaign.promotions.find(
      (promo: Promotion) => promo.ticketQuantity === quotaCount
    );

    if (!applicablePromotion) {
      return null;
    }

    const originalTotal = quotaCount * campaign.ticket_price;
    const promotionalTotal = applicablePromotion.discountedTotalValue;
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
        const promotionInfo = getApplicablePromotion(quotasToReserve.length);
        const totalValue = promotionInfo ? promotionInfo.promotionalTotal : quotasToReserve.length * campaign.ticket_price;

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
  }, [campaign, user, selectedQuotas, quantity, getAvailableTickets, reserveTickets, getApplicablePromotion, navigate]);

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

  // Get theme classes based on campaign theme
  const getThemeClasses = (campaignTheme: string) => {
    switch (campaignTheme) {
      case 'claro':
        return {
          background: 'bg-white',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          cardBg: 'bg-gray-50',
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
          background: 'bg-white',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          cardBg: 'bg-gray-50',
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
    ? getApplicablePromotion(selectedQuotas.length)
    : getApplicablePromotion(quantity);

  // Calculate current total value
  const getCurrentTotalValue = () => {
    const currentQuantity = campaign?.campaign_model === 'manual' ? selectedQuotas.length : quantity;
    return currentPromotionInfo 
      ? currentPromotionInfo.promotionalTotal 
      : currentQuantity * (campaign?.ticket_price || 0);
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

  const campaignTheme = userProfile?.theme || 'claro';
  const primaryColor = userProfile?.primary_color || '#3B82F6';
  const themeClasses = getThemeClasses(campaignTheme);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeClasses.background}`}>
      {/* Header */}
      <div className={`shadow-sm border-b ${themeClasses.border} ${themeClasses.background}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/')}
              className={`flex items-center space-x-2 ${themeClasses.textSecondary} hover:opacity-80 transition-opacity duration-200`}
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Voltar</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <img 
                src="/32132123.png" 
                alt="Rifaqui Logo" 
                className="w-8 h-8 object-contain"
              />
              <span className={`text-xl font-bold ${themeClasses.text}`}>Rifaqui</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Campaign Info */}
          <div className="space-y-6">
            {/* Campaign Images */}
            <div className="relative group">
              <img
                src={campaign.prize_image_urls?.[currentImageIndex] || 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1'}
                alt={campaign.title}
                className="w-full h-80 object-cover rounded-2xl shadow-lg"
              />
              
              {/* Navigation Arrows */}
              {campaign.prize_image_urls && campaign.prize_image_urls.length > 1 && (
                <>
                  <button
                    onClick={handlePreviousImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-75"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-75"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
              
              {/* Image Counter */}
              {campaign.prize_image_urls && campaign.prize_image_urls.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {campaign.prize_image_urls.length}
                </div>
              )}
            </div>

            {/* Campaign Details */}
            <div className={`${themeClasses.cardBg} rounded-2xl p-6 shadow-lg border ${themeClasses.border}`}>
              <h1 className={`text-3xl font-bold ${themeClasses.text} mb-4`}>
                {campaign.title}
              </h1>

              {/* Campaign Description */}
              {campaign.description && (
                <div 
                  className={`${themeClasses.textSecondary} mb-6 prose prose-sm max-w-none`}
                  dangerouslySetInnerHTML={{ __html: campaign.description }}
                />
              )}

              {/* Campaign Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className={`${themeClasses.cardBg} rounded-lg p-4 border ${themeClasses.border}`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className={`h-5 w-5 ${themeClasses.textSecondary}`} />
                    <span className={`text-sm ${themeClasses.textSecondary}`}>Cotas vendidas</span>
                  </div>
                  <div className={`text-2xl font-bold ${themeClasses.text}`}>
                    {campaign.sold_tickets}/{campaign.total_tickets}
                  </div>
                  {campaign.show_percentage && (
                    <div className={`text-sm ${themeClasses.textSecondary}`}>
                      {getProgressPercentage()}% vendido
                    </div>
                  )}
                </div>

                <div className={`${themeClasses.cardBg} rounded-lg p-4 border ${themeClasses.border}`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <Trophy className={`h-5 w-5 ${themeClasses.textSecondary}`} />
                    <span className={`text-sm ${themeClasses.textSecondary}`}>Valor por cota</span>
                  </div>
                  <div className={`text-2xl font-bold`} style={{ color: primaryColor }}>
                    {formatCurrency(campaign.ticket_price)}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className={`flex justify-between items-center mb-2`}>
                  <span className={`text-sm ${themeClasses.textSecondary}`}>Progresso</span>
                  <span className={`text-sm ${themeClasses.textSecondary}`}>
                    {campaign.sold_tickets} de {campaign.total_tickets} cotas
                  </span>
                </div>
                <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3`}>
                  <div 
                    className="h-3 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${getProgressPercentage()}%`,
                      backgroundColor: primaryColor 
                    }}
                  />
                </div>
              </div>

              {/* Draw Date */}
              {campaign.show_draw_date && campaign.draw_date && (
                <div className={`${themeClasses.cardBg} rounded-lg p-4 border ${themeClasses.border} mb-6`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className={`h-5 w-5 ${themeClasses.textSecondary}`} />
                    <span className={`text-sm ${themeClasses.textSecondary}`}>Data do sorteio</span>
                  </div>
                  <div className={`text-lg font-bold ${themeClasses.text}`}>
                    {formatDate(campaign.draw_date)}
                  </div>
                </div>
              )}

              {/* Prizes */}
              {campaign.prizes && Array.isArray(campaign.prizes) && campaign.prizes.length > 0 && (
                <div className={`${themeClasses.cardBg} rounded-lg p-4 border ${themeClasses.border}`}>
                  <h3 className={`text-lg font-semibold ${themeClasses.text} mb-3`}>
                    Prêmios
                  </h3>
                  <div className="space-y-2">
                    {campaign.prizes.map((prize: any, index: number) => (
                      <div key={prize.id} className="flex items-center space-x-2">
                        <span className="text-yellow-500 font-bold">{index + 1}°</span>
                        <span className={themeClasses.text}>{prize.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Quota Selection */}
          <div className="space-y-6">
            {/* Manual Mode - Quota Grid */}
            {campaign.campaign_model === 'manual' && (
              <>
                <QuotaGrid
                  totalQuotas={campaign.total_tickets}
                  selectedQuotas={selectedQuotas}
                  onQuotaSelect={handleQuotaSelect}
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
                  <div className={`${themeClasses.cardBg} rounded-2xl p-6 shadow-lg border ${themeClasses.border}`}>
                    <h3 className={`text-lg font-bold ${themeClasses.text} mb-4`}>
                      Cotas Selecionadas
                    </h3>
                    
                    <div className="mb-4">
                      <div className={`text-sm ${themeClasses.textSecondary} mb-2`}>
                        Números selecionados:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedQuotas.sort((a, b) => a - b).map(quota => (
                          <span
                            key={quota}
                            className="px-3 py-1 text-white rounded-lg text-sm font-medium"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {quota.toString().padStart(3, '0')}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Promotion Info */}
                    {currentPromotionInfo && (
                      <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="text-center">
                          <div className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                            🎉 Promoção Aplicada: {currentPromotionInfo.discountPercentage}% OFF
                          </div>
                          <div className="text-xs text-green-700 dark:text-green-300">
                            Economia de {formatCurrency(currentPromotionInfo.savings)}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center mb-4">
                      <span className={`font-medium ${themeClasses.text}`}>
                        {selectedQuotas.length} {selectedQuotas.length === 1 ? 'cota' : 'cotas'}
                      </span>
                      <div className="text-right">
                        {currentPromotionInfo && (
                          <div className={`text-sm ${themeClasses.textSecondary} line-through`}>
                            {formatCurrency(currentPromotionInfo.originalTotal)}
                          </div>
                        )}
                        <div 
                          className={`text-2xl font-bold ${currentPromotionInfo ? 'text-green-600' : ''}`}
                          style={!currentPromotionInfo ? { color: primaryColor } : {}}
                        >
                          {formatCurrency(getCurrentTotalValue())}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleOpenReservationModal}
                      disabled={selectedQuotas.length === 0}
                      className="w-full text-white py-4 rounded-lg font-bold text-lg transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Reservar Cotas Selecionadas
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Automatic Mode - Quota Selector */}
            {campaign.campaign_model === 'automatic' && (
              <QuotaSelector
                ticketPrice={campaign.ticket_price}
                minTicketsPerPurchase={campaign.min_tickets_per_purchase || 1}
                maxTicketsPerPurchase={campaign.max_tickets_per_purchase || 1000}
                onQuantityChange={handleQuantityChange}
                initialQuantity={Math.max(1, campaign.min_tickets_per_purchase || 1)}
                mode="automatic"
                promotionInfo={currentPromotionInfo}
                primaryColor={primaryColor}
                campaignTheme={campaignTheme}
                onReserve={handleOpenReservationModal}
                reserving={reserving}
              />
            )}

            {/* Campaign Info Card */}
            <div className={`${themeClasses.cardBg} rounded-2xl p-6 shadow-lg border ${themeClasses.border}`}>
              <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>
                Informações da Campanha
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={themeClasses.textSecondary}>Método de sorteio</span>
                  <span className={themeClasses.text}>{campaign.draw_method}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={themeClasses.textSecondary}>Total de cotas</span>
                  <span className={themeClasses.text}>{campaign.total_tickets.toLocaleString('pt-BR')}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={themeClasses.textSecondary}>Cotas disponíveis</span>
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    {(campaign.total_tickets - campaign.sold_tickets).toLocaleString('pt-BR')}
                  </span>
                </div>

                {campaign.reservation_timeout_minutes && (
                  <div className="flex items-center justify-between">
                    <span className={themeClasses.textSecondary}>Tempo de reserva</span>
                    <span className={themeClasses.text}>{campaign.reservation_timeout_minutes} minutos</span>
                  </div>
                )}
              </div>
            </div>

            {/* Promotions */}
            {campaign.promotions && Array.isArray(campaign.promotions) && campaign.promotions.length > 0 && (
              <div className={`${themeClasses.cardBg} rounded-2xl p-6 shadow-lg border ${themeClasses.border}`}>
                <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>
                  🎁 Promoções Disponíveis
                </h3>
                
                <div className="space-y-3">
                  {campaign.promotions.map((promo: Promotion) => {
                    const originalValue = promo.ticketQuantity * campaign.ticket_price;
                    const discountPercentage = Math.round((promo.fixedDiscountAmount / originalValue) * 100);
                    
                    return (
                      <div
                        key={promo.id}
                        className={`border ${themeClasses.border} rounded-lg p-4 hover:shadow-md transition-all duration-200`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className={`font-bold ${themeClasses.text}`}>
                              {promo.ticketQuantity} cotas
                            </div>
                            <div className={`text-sm ${themeClasses.textSecondary}`}>
                              {discountPercentage}% de desconto
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm ${themeClasses.textSecondary} line-through`}>
                              {formatCurrency(originalValue)}
                            </div>
                            <div className="text-lg font-bold text-green-600 dark:text-green-400">
                              {formatCurrency(promo.discountedTotalValue)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Quota Selection Interface */}
          <div className="space-y-6">
            {campaign.campaign_model === 'manual' ? (
              /* Manual Mode Interface is already rendered above */
              <div className={`${themeClasses.cardBg} rounded-2xl p-6 shadow-lg border ${themeClasses.border}`}>
                <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4 text-center`}>
                  SELECIONE SUAS COTAS
                </h3>
                <p className={`text-sm ${themeClasses.textSecondary} text-center mb-4`}>
                  Clique nos números para selecionar suas cotas da sorte
                </p>
                
                {selectedQuotas.length === 0 && (
                  <div className="text-center py-8">
                    <div className={`text-4xl mb-2`}>🎯</div>
                    <p className={themeClasses.textSecondary}>
                      Nenhuma cota selecionada
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Automatic Mode Interface is already rendered above */
              <div className={`${themeClasses.cardBg} rounded-2xl p-6 shadow-lg border ${themeClasses.border}`}>
                <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4 text-center`}>
                  MODO AUTOMÁTICO
                </h3>
                <p className={`text-sm ${themeClasses.textSecondary} text-center mb-4`}>
                  Escolha a quantidade e o sistema sorteará seus números automaticamente
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

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