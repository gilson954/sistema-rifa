import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Share2, 
  Users, 
  Calendar, 
  Trophy, 
  Clock,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  Mail,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useCampaignByPublicId } from '../hooks/useCampaigns';
import { useTickets } from '../hooks/useTickets';
import { useAuth } from '../context/AuthContext';
import { PublicProfilesAPI } from '../lib/api/publicProfiles';
import QuotaGrid from '../components/QuotaGrid';
import QuotaSelector from '../components/QuotaSelector';
import ReservationModal, { CustomerData } from '../components/ReservationModal';
import { calculateTotalWithPromotions } from '../utils/currency';
import { shareSectionConfig } from '../components/SocialMediaIcons';

const CampaignPage = () => {
  const { publicId } = useParams<{ publicId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  console.log('🔍 [CAMPAIGN PAGE] Loading campaign with publicId:', publicId);
  
  // Fetch campaign data
  const { campaign, loading: campaignLoading, error: campaignError } = useCampaignByPublicId(publicId || '');
  
  console.log('📊 [CAMPAIGN PAGE] Campaign data:', campaign);
  console.log('❌ [CAMPAIGN PAGE] Campaign error:', campaignError);
  
  // Fetch tickets data
  const {
    tickets,
    loading: ticketsLoading,
    reserveTickets,
    reserving,
    error: ticketsError
  } = useTickets(campaign?.id || '');

  // State management
  const [selectedQuotas, setSelectedQuotas] = useState<number[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'available' | 'reserved' | 'purchased' | 'my-numbers'>('all');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [organizerProfile, setOrganizerProfile] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);

  // Load organizer profile for customization
  useEffect(() => {
    const loadOrganizerProfile = async () => {
      if (campaign?.user_id) {
        const { data: profile } = await PublicProfilesAPI.getPublicProfile(campaign.user_id);
        setOrganizerProfile(profile);
      }
    };

    loadOrganizerProfile();
  }, [campaign?.user_id]);

  // Reset selected quotas when campaign changes
  useEffect(() => {
    setSelectedQuotas([]);
    setQuantity(Math.max(1, campaign?.min_tickets_per_purchase || 1));
  }, [campaign?.id, campaign?.min_tickets_per_purchase]);

  const handleGoBack = () => {
    navigate('/');
  };

  const handleQuotaSelect = (quotaNumber: number) => {
    if (campaign?.campaign_model !== 'manual') return;

    setSelectedQuotas(prev => {
      const isSelected = prev.includes(quotaNumber);
      const newSelection = isSelected 
        ? prev.filter(q => q !== quotaNumber)
        : [...prev, quotaNumber];

      // Update quantity based on selection
      setQuantity(Math.max(newSelection.length, campaign?.min_tickets_per_purchase || 1));
      
      return newSelection;
    });
  };

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
    // Clear manual selections when using automatic mode
    if (campaign?.campaign_model === 'automatic') {
      setSelectedQuotas([]);
    }
  };

  const handleReserve = () => {
    if (!campaign) return;

    // Validate minimum tickets
    const finalQuantity = campaign.campaign_model === 'manual' ? selectedQuotas.length : quantity;
    
    if (finalQuantity < (campaign.min_tickets_per_purchase || 1)) {
      alert(`Você deve selecionar pelo menos ${campaign.min_tickets_per_purchase || 1} cota(s)`);
      return;
    }

    if (finalQuantity > (campaign.max_tickets_per_purchase || 1000)) {
      alert(`Você pode selecionar no máximo ${campaign.max_tickets_per_purchase || 1000} cota(s)`);
      return;
    }

    setShowReservationModal(true);
  };

  const handleReservationSubmit = async (customerData: CustomerData) => {
    if (!campaign || !user) return;

    try {
      const finalQuantity = campaign.campaign_model === 'manual' ? selectedQuotas.length : quantity;
      const quotasToReserve = campaign.campaign_model === 'manual' 
        ? selectedQuotas 
        : Array.from({ length: finalQuantity }, (_, i) => i + 1); // Temporary quota numbers for automatic mode

      await reserveTickets(quotasToReserve);
      
      // Navigate to payment confirmation
      const { total } = calculateTotalWithPromotions(
        finalQuantity,
        campaign.ticket_price,
        campaign.promotions || []
      );

      navigate('/payment-confirmation', {
        state: {
          reservationData: {
            reservationId: `RES-${Date.now()}`,
            customerName: customerData.name,
            customerEmail: customerData.email,
            customerPhone: `${customerData.countryCode} ${customerData.phoneNumber}`,
            quotaCount: finalQuantity,
            totalValue: total,
            selectedQuotas: campaign.campaign_model === 'manual' ? selectedQuotas : undefined,
            campaignTitle: campaign.title,
            campaignId: campaign.id,
            expiresAt: new Date(Date.now() + (campaign.reservation_timeout_minutes || 15) * 60 * 1000).toISOString()
          }
        }
      });

      setShowReservationModal(false);
    } catch (error) {
      console.error('Error making reservation:', error);
      alert('Erro ao fazer reserva. Tente novamente.');
    }
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Participe da ${campaign?.title}! ${campaign?.description || ''}`;
    
    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`);
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
        break;
      case 'x':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
        break;
    }
  };

  const handlePreviousImage = () => {
    if (!campaign?.prize_image_urls) return;
    setCurrentImageIndex(prev => 
      prev === 0 ? campaign.prize_image_urls!.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    if (!campaign?.prize_image_urls) return;
    setCurrentImageIndex(prev => 
      prev === campaign.prize_image_urls!.length - 1 ? 0 : prev + 1
    );
  };

  // Get theme classes based on organizer's theme preference
  const getThemeClasses = (theme: string) => {
    switch (theme) {
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

  const campaignTheme = organizerProfile?.theme || 'claro';
  const primaryColor = organizerProfile?.primary_color || '#3B82F6';
  const themeClasses = getThemeClasses(campaignTheme);

  // Calculate promotion info
  const finalQuantity = campaign?.campaign_model === 'manual' ? selectedQuotas.length : quantity;
  const promotionCalculation = campaign ? calculateTotalWithPromotions(
    finalQuantity,
    campaign.ticket_price,
    campaign.promotions || []
  ) : null;

  const promotionInfo = promotionCalculation?.appliedPromotions.length ? {
    promotion: promotionCalculation.appliedPromotions[0],
    originalTotal: finalQuantity * (campaign?.ticket_price || 0),
    promotionalTotal: promotionCalculation.total,
    savings: (finalQuantity * (campaign?.ticket_price || 0)) - promotionCalculation.total,
    discountPercentage: Math.round((((finalQuantity * (campaign?.ticket_price || 0)) - promotionCalculation.total) / (finalQuantity * (campaign?.ticket_price || 0))) * 100)
  } : null;

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
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

  const calculateProgressPercentage = () => {
    if (!campaign || campaign.total_tickets === 0) return 0;
    return Math.round((campaign.sold_tickets / campaign.total_tickets) * 100);
  };

  // Loading state
  if (campaignLoading || ticketsLoading) {
    return (
      <div className={`min-h-screen ${themeClasses.background} flex items-center justify-center transition-colors duration-300`}>
        <div className="text-center">
          <Loader2 className={`h-12 w-12 animate-spin mx-auto mb-4 ${themeClasses.textSecondary}`} />
          <p className={`${themeClasses.textSecondary}`}>Carregando campanha...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (campaignError || !campaign) {
    return (
      <div className={`min-h-screen ${themeClasses.background} flex items-center justify-center transition-colors duration-300`}>
        <div className="text-center max-w-md mx-auto p-8">
          <div className={`w-20 h-20 ${themeClasses.cardBg} rounded-full flex items-center justify-center mx-auto mb-6`}>
            <AlertTriangle className={`h-10 w-10 ${themeClasses.textSecondary}`} />
          </div>
          <h1 className={`text-2xl font-bold ${themeClasses.text} mb-4`}>
            Campanha não encontrada
          </h1>
          <p className={`${themeClasses.textSecondary} mb-8`}>
            A campanha que você está procurando não existe ou foi removida.
          </p>
          <button
            onClick={handleGoBack}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  const prizeImages = campaign.prize_image_urls && campaign.prize_image_urls.length > 0 
    ? campaign.prize_image_urls 
    : ['https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'];

  const currentImage = prizeImages[currentImageIndex];

  return (
    <div className={`min-h-screen ${themeClasses.background} transition-colors duration-300`}>
      {/* Header */}
      <div className={`${themeClasses.cardBg} shadow-sm border-b ${themeClasses.border}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={handleGoBack}
              className={`flex items-center space-x-2 ${themeClasses.textSecondary} hover:opacity-80 transition-opacity duration-200`}
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Voltar</span>
            </button>
            
            <div className="flex items-center space-x-2">
              {organizerProfile?.logo_url ? (
                <img 
                  src={organizerProfile.logo_url} 
                  alt="Logo" 
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <img 
                  src="/logo-chatgpt.png" 
                  alt="Rifaqui Logo" 
                  className="w-8 h-8 object-contain"
                />
              )}
              <span className={`text-xl font-bold ${themeClasses.text}`}>
                {organizerProfile?.name || 'Rifaqui'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Campaign Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Campaign Header */}
            <div className={`${themeClasses.cardBg} rounded-2xl shadow-lg p-6 border ${themeClasses.border}`}>
              <h1 className={`text-3xl font-bold ${themeClasses.text} mb-4`}>
                {campaign.title}
              </h1>
              
              {/* Organizer Info */}
              <div className="flex items-center space-x-3 mb-6">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  {organizerProfile?.name?.charAt(0).toUpperCase() || 'R'}
                </div>
                <div>
                  <div className={`text-sm ${themeClasses.textSecondary}`}>
                    Organizado por:
                  </div>
                  <div className={`font-semibold ${themeClasses.text}`}>
                    {organizerProfile?.name || 'Organizador'}
                  </div>
                </div>
              </div>

              {/* Campaign Image Gallery */}
              <div className="relative group rounded-lg overflow-hidden mb-6">
                <img
                  src={currentImage}
                  alt={campaign.title}
                  className="w-full h-64 sm:h-80 object-cover"
                />
                
                {/* Navigation Arrows (only show if multiple images) */}
                {prizeImages.length > 1 && (
                  <>
                    <button
                      onClick={handlePreviousImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-75"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    
                    <button
                      onClick={handleNextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-75"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
                
                {/* Image Counter */}
                {prizeImages.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {prizeImages.length}
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {prizeImages.length > 1 && (
                <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
                  {prizeImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                        index === currentImageIndex
                          ? 'border-purple-500 opacity-100'
                          : `${themeClasses.border} opacity-60 hover:opacity-80`
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

              {/* Campaign Progress */}
              <div className={`${themeClasses.cardBg} rounded-lg p-4 mb-6 border ${themeClasses.border}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${themeClasses.textSecondary}`}>Progresso da campanha</span>
                  {campaign.show_percentage && (
                    <span className={`text-sm font-medium ${themeClasses.text}`}>
                      {calculateProgressPercentage()}%
                    </span>
                  )}
                </div>
                <div className={`w-full bg-gray-300 dark:bg-gray-600 rounded-full h-3 mb-2`}>
                  <div 
                    className="h-3 rounded-full transition-all duration-300"
                    style={{ 
                      backgroundColor: primaryColor,
                      width: `${calculateProgressPercentage()}%` 
                    }}
                  ></div>
                </div>
                <div className={`text-sm ${themeClasses.text}`}>
                  {campaign.sold_tickets.toLocaleString('pt-BR')}/{campaign.total_tickets.toLocaleString('pt-BR')} cotas vendidas
                </div>
              </div>

              {/* Campaign Description */}
              {campaign.description && (
                <div className={`${themeClasses.cardBg} rounded-lg p-4 border ${themeClasses.border}`}>
                  <h3 className={`text-lg font-semibold ${themeClasses.text} mb-3`}>
                    Sobre esta campanha
                  </h3>
                  <div 
                    className={`prose prose-sm max-w-none ${themeClasses.text}`}
                    dangerouslySetInnerHTML={{ __html: campaign.description }}
                  />
                </div>
              )}

              {/* Draw Date */}
              {campaign.show_draw_date && campaign.draw_date && (
                <div className={`${themeClasses.cardBg} rounded-lg p-4 border ${themeClasses.border}`}>
                  <div className="flex items-center space-x-3">
                    <Calendar className={`h-5 w-5 ${themeClasses.textSecondary}`} />
                    <div>
                      <div className={`text-sm ${themeClasses.textSecondary}`}>
                        Data do sorteio
                      </div>
                      <div className={`font-semibold ${themeClasses.text}`}>
                        {formatDate(campaign.draw_date)}
                      </div>
                    </div>
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
                      <div key={prize.id || index} className="flex items-center space-x-3">
                        <span 
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {index + 1}
                        </span>
                        <span className={themeClasses.text}>
                          {prize.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Share Section */}
              <div className={`${themeClasses.cardBg} rounded-lg p-4 border ${themeClasses.border}`}>
                <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>
                  Compartilhar
                </h3>
                <div className="flex space-x-3">
                  {Object.entries(shareSectionConfig).map(([platform, config]) => {
                    const IconComponent = config.icon;
                    return (
                      <button
                        key={platform}
                        onClick={() => handleShare(platform)}
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white hover:opacity-80 transition-opacity duration-200"
                        style={{ backgroundColor: config.color }}
                        title={`Compartilhar no ${config.name}`}
                      >
                        <IconComponent size={20} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quota Grid (for manual mode) or Quota Selector (for automatic mode) */}
            {campaign.campaign_model === 'manual' ? (
              <div className={`${themeClasses.cardBg} rounded-2xl shadow-lg p-6 border ${themeClasses.border}`}>
                <QuotaGrid
                  totalQuotas={campaign.total_tickets}
                  selectedQuotas={selectedQuotas}
                  onQuotaSelect={handleQuotaSelect}
                  activeFilter={activeFilter}
                  onFilterChange={setActiveFilter}
                  mode={campaign.campaign_model}
                  tickets={tickets}
                  currentUserId={user?.id}
                  campaignTheme={campaignTheme}
                  primaryColor={primaryColor}
                />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Campaign Stats for Automatic Mode */}
                <div className={`${themeClasses.cardBg} rounded-2xl shadow-lg p-6 border ${themeClasses.border}`}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${themeClasses.text}`}>
                        {formatCurrency(campaign.ticket_price)}
                      </div>
                      <div className={`text-sm ${themeClasses.textSecondary}`}>
                        Por cota
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${themeClasses.text}`}>
                        {campaign.total_tickets.toLocaleString('pt-BR')}
                      </div>
                      <div className={`text-sm ${themeClasses.textSecondary}`}>
                        Total de cotas
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className={`text-2xl font-bold text-green-600`}>
                        {campaign.sold_tickets.toLocaleString('pt-BR')}
                      </div>
                      <div className={`text-sm ${themeClasses.textSecondary}`}>
                        Vendidas
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className={`text-2xl font-bold text-blue-600`}>
                        {(campaign.total_tickets - campaign.sold_tickets).toLocaleString('pt-BR')}
                      </div>
                      <div className={`text-sm ${themeClasses.textSecondary}`}>
                        Disponíveis
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Purchase Section */}
          <div className="space-y-6">
            {/* Quota Selector (for automatic mode) */}
            {campaign.campaign_model === 'automatic' && (
              <QuotaSelector
                ticketPrice={campaign.ticket_price}
                minTicketsPerPurchase={campaign.min_tickets_per_purchase || 1}
                maxTicketsPerPurchase={campaign.max_tickets_per_purchase || 1000}
                onQuantityChange={handleQuantityChange}
                initialQuantity={quantity}
                mode={campaign.campaign_model}
                promotionInfo={promotionInfo}
                promotions={campaign.promotions}
                primaryColor={primaryColor}
                campaignTheme={campaignTheme}
                onReserve={handleReserve}
                reserving={reserving}
                disabled={campaign.status !== 'active'}
              />
            )}

            {/* Purchase Summary (for manual mode) */}
            {campaign.campaign_model === 'manual' && selectedQuotas.length > 0 && (
              <div className={`${themeClasses.cardBg} rounded-xl shadow-md p-4 border ${themeClasses.border}`}>
                <h3 className={`text-lg font-bold ${themeClasses.text} mb-4`}>
                  Resumo da Compra
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={themeClasses.textSecondary}>
                      {selectedQuotas.length} {selectedQuotas.length === 1 ? 'cota' : 'cotas'}
                    </span>
                    <span className={`font-bold ${themeClasses.text}`}>
                      {formatCurrency(promotionCalculation?.total || 0)}
                    </span>
                  </div>
                  
                  {selectedQuotas.length > 0 && (
                    <div className={`text-xs ${themeClasses.textSecondary}`}>
                      Números: {selectedQuotas.sort((a, b) => a - b).join(', ')}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleReserve}
                  disabled={reserving || selectedQuotas.length === 0 || campaign.status !== 'active'}
                  className="w-full mt-4 text-white py-3 rounded-lg font-bold transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: primaryColor }}
                >
                  {reserving ? 'RESERVANDO...' : 'RESERVAR'}
                </button>
              </div>
            )}

            {/* Campaign Info Card */}
            <div className={`${themeClasses.cardBg} rounded-xl shadow-md p-4 border ${themeClasses.border}`}>
              <h3 className={`text-lg font-bold ${themeClasses.text} mb-4`}>
                Informações da Campanha
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Trophy className={`h-4 w-4 ${themeClasses.textSecondary}`} />
                    <span className={themeClasses.textSecondary}>Valor por cota</span>
                  </div>
                  <span className={`font-medium ${themeClasses.text}`}>
                    {formatCurrency(campaign.ticket_price)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className={`h-4 w-4 ${themeClasses.textSecondary}`} />
                    <span className={themeClasses.textSecondary}>Total de cotas</span>
                  </div>
                  <span className={`font-medium ${themeClasses.text}`}>
                    {campaign.total_tickets.toLocaleString('pt-BR')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className={`h-4 w-4 text-green-500`} />
                    <span className={themeClasses.textSecondary}>Cotas vendidas</span>
                  </div>
                  <span className={`font-medium text-green-600`}>
                    {campaign.sold_tickets.toLocaleString('pt-BR')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className={`h-4 w-4 ${themeClasses.textSecondary}`} />
                    <span className={themeClasses.textSecondary}>Método de sorteio</span>
                  </div>
                  <span className={`font-medium ${themeClasses.text}`}>
                    {campaign.draw_method}
                  </span>
                </div>
              </div>
            </div>

            {/* Social Media Links */}
            {organizerProfile?.social_media_links && Object.keys(organizerProfile.social_media_links).length > 0 && (
              <div className={`${themeClasses.cardBg} rounded-xl shadow-md p-4 border ${themeClasses.border}`}>
                <h3 className={`text-lg font-bold ${themeClasses.text} mb-4`}>
                  Redes Sociais
                </h3>
                <div className="flex space-x-3">
                  {Object.entries(organizerProfile.social_media_links).map(([platform, url]) => {
                    if (!url) return null;
                    
                    const config = shareSectionConfig[platform as keyof typeof shareSectionConfig];
                    if (!config) return null;
                    
                    const IconComponent = config.icon;
                    return (
                      <a
                        key={platform}
                        href={url as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:opacity-80 transition-opacity duration-200"
                        style={{ backgroundColor: config.color }}
                        title={config.name}
                      >
                        <IconComponent size={16} />
                      </a>
                    );
                  })}
                </div>
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
        quotaCount={finalQuantity}
        totalValue={promotionCalculation?.total || 0}
        selectedQuotas={campaign?.campaign_model === 'manual' ? selectedQuotas : undefined}
        campaignTitle={campaign.title}
        primaryColor={primaryColor}
        campaignTheme={campaignTheme}
        reserving={reserving}
        reservationTimeoutMinutes={campaign.reservation_timeout_minutes}
      />
    </div>
  );
};

export default CampaignPage;