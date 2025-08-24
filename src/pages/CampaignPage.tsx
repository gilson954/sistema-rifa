import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Share2, 
  Calendar, 
  Clock,
  Users,
  Trophy,
  TrendingUp,
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  Shield,
  CheckCircle,
  AlertTriangle,
  Ticket
} from 'lucide-react';
import { useCampaignBySlug, useCampaignByCustomDomain } from '../hooks/useCampaigns';
import { useTickets } from '../hooks/useTickets';
import { useAuth } from '../context/AuthContext';
import QuotaGrid from '../components/QuotaGrid';
import QuotaSelector from '../components/QuotaSelector';
import ReservationModal, { CustomerData } from '../components/ReservationModal';
import { socialMediaConfig, shareSectionConfig } from '../components/SocialMediaIcons';
import { supabase } from '../lib/supabase';
import { Promotion } from '../types/promotion';

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
  
  // State for campaign loading
  const [isCustomDomain, setIsCustomDomain] = useState(false);
  const [currentDomain, setCurrentDomain] = useState<string>('');
  
  // Determine if we're on a custom domain
  useEffect(() => {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isNetlifyDomain = hostname.includes('.netlify.app');
    const isMainDomain = hostname === 'meuapp.com'; // Replace with your actual domain
    
    if (!isLocalhost && !isNetlifyDomain && !isMainDomain) {
      setIsCustomDomain(true);
      setCurrentDomain(hostname);
    }
  }, []);

  // Use appropriate hook based on domain type
  const { 
    campaign: slugCampaign, 
    loading: slugLoading, 
    error: slugError 
  } = useCampaignBySlug(slug || '');
  
  const { 
    campaign: domainCampaign, 
    loading: domainLoading, 
    error: domainError 
  } = useCampaignByCustomDomain(isCustomDomain ? currentDomain : '');

  // Select the appropriate campaign data
  const campaign = isCustomDomain ? domainCampaign : slugCampaign;
  const loading = isCustomDomain ? domainLoading : slugLoading;
  const error = isCustomDomain ? domainError : slugError;

  // Tickets hook
  const {
    tickets,
    loading: ticketsLoading,
    reserveTickets,
    reserving
  } = useTickets(campaign?.id || '');

  // Component state
  const [selectedQuotas, setSelectedQuotas] = useState<number[]>([]);
  const [quotaQuantity, setQuotaQuantity] = useState(1);
  const [activeFilter, setActiveFilter] = useState<'all' | 'available' | 'reserved' | 'purchased' | 'my-numbers'>('all');
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [socialMediaLinks, setSocialMediaLinks] = useState<any>({});

  // Load user profile and social media links
  useEffect(() => {
    const loadUserProfile = async () => {
      if (campaign?.user_id) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('name, primary_color, theme, logo_url, social_media_links')
            .eq('id', campaign.user_id)
            .single();

          if (error) {
            console.error('Error loading user profile:', error);
          } else {
            setUserProfile(data);
            setSocialMediaLinks(data?.social_media_links || {});
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      }
    };

    loadUserProfile();
  }, [campaign?.user_id]);

  // Calculate promotion info based on selected quantity
  const getPromotionInfo = (quantity: number): PromotionInfo | null => {
    if (!campaign?.promotions || !Array.isArray(campaign.promotions)) {
      return null;
    }

    // Find the best promotion for this quantity
    const applicablePromotions = campaign.promotions.filter(
      (promo: Promotion) => promo.ticketQuantity === quantity
    );

    if (applicablePromotions.length === 0) {
      return null;
    }

    // Get the promotion with the highest discount
    const bestPromotion = applicablePromotions.reduce((best: Promotion, current: Promotion) => {
      return current.fixedDiscountAmount > best.fixedDiscountAmount ? current : best;
    });

    const originalTotal = quantity * (campaign?.ticket_price || 0);
    const promotionalTotal = bestPromotion.discountedTotalValue;
    const savings = bestPromotion.fixedDiscountAmount;
    const discountPercentage = originalTotal > 0 ? Math.round((savings / originalTotal) * 100) : 0;

    return {
      promotion: bestPromotion,
      originalTotal,
      promotionalTotal,
      savings,
      discountPercentage
    };
  };

  const handleQuotaSelect = (quotaNumber: number) => {
    if (campaign?.campaign_model !== 'manual') return;

    setSelectedQuotas(prev => {
      const isSelected = prev.includes(quotaNumber);
      if (isSelected) {
        return prev.filter(q => q !== quotaNumber);
      } else {
        const newSelection = [...prev, quotaNumber];
        setQuotaQuantity(newSelection.length);
        return newSelection;
      }
    });
  };

  const handleQuantityChange = (quantity: number) => {
    setQuotaQuantity(quantity);
    // Clear manual selections when using automatic mode
    if (campaign?.campaign_model === 'automatic') {
      setSelectedQuotas([]);
    }
  };

  const handleReserve = () => {
    if (!campaign) return;

    // For automatic mode, we need to generate random available quotas
    if (campaign.campaign_model === 'automatic') {
      const availableTickets = tickets.filter(t => t.status === 'disponível');
      
      if (availableTickets.length < quotaQuantity) {
        alert('Não há cotas suficientes disponíveis');
        return;
      }

      // Select random available quotas
      const shuffled = [...availableTickets].sort(() => 0.5 - Math.random());
      const randomQuotas = shuffled.slice(0, quotaQuantity).map(t => t.quota_number);
      setSelectedQuotas(randomQuotas);
    }

    setShowReservationModal(true);
  };

  const handleReservationSubmit = async (customerData: CustomerData) => {
    if (!campaign || selectedQuotas.length === 0) return;

    try {
      const fullPhoneNumber = `${customerData.countryCode} ${customerData.phoneNumber}`;
      
      // Update tickets with customer information and reserve them
      const { data: updateResult, error: updateError } = await supabase
        .from('tickets')
        .update({
          status: 'reservado',
          reserved_at: new Date().toISOString(),
          customer_name: customerData.name,
          customer_email: customerData.email,
          customer_phone: fullPhoneNumber
        })
        .eq('campaign_id', campaign.id)
        .in('quota_number', selectedQuotas)
        .eq('status', 'disponível')
        .select();

      if (updateError) {
        console.error('Error reserving tickets:', updateError);
        alert('Erro ao reservar cotas. Tente novamente.');
        return;
      }

      if (!updateResult || updateResult.length === 0) {
        alert('Algumas cotas já foram reservadas por outros usuários. Tente novamente.');
        return;
      }

      // Navigate to payment confirmation
      const reservationData = {
        reservationId: `RES-${Date.now()}`,
        customerName: customerData.name,
        customerEmail: customerData.email,
        customerPhone: fullPhoneNumber,
        quotaCount: selectedQuotas.length,
        totalValue: getPromotionInfo(quotaQuantity)?.promotionalTotal || (quotaQuantity * campaign.ticket_price),
        selectedQuotas: selectedQuotas,
        campaignTitle: campaign.title,
        campaignId: campaign.id,
        expiresAt: new Date(Date.now() + (campaign.reservation_timeout_minutes || 15) * 60 * 1000).toISOString()
      };

      navigate('/payment-confirmation', { state: { reservationData } });
    } catch (error) {
      console.error('Error in reservation process:', error);
      alert('Erro ao processar reserva. Tente novamente.');
    }
  };

  const handleGoBack = () => {
    navigate('/');
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Participe da ${campaign?.title}! Cotas a partir de R$ ${campaign?.ticket_price.toFixed(2).replace('.', ',')}`;
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
      x: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
    };

    const shareUrl = shareUrls[platform as keyof typeof shareUrls];
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Function to get theme classes
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

  const currentTheme = userProfile?.theme || 'claro';
  const primaryColor = userProfile?.primary_color || '#3B82F6';
  const themeClasses = getThemeClasses(currentTheme);

  if (loading || ticketsLoading) {
    return (
      <div className={`min-h-screen ${themeClasses.background} flex items-center justify-center transition-colors duration-300`}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{ borderColor: primaryColor }}></div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className={`min-h-screen ${themeClasses.background} flex items-center justify-center transition-colors duration-300`}>
        <div className={`text-center p-8 ${themeClasses.cardBg} rounded-lg border ${themeClasses.border}`}>
          <h1 className={`text-2xl font-bold ${themeClasses.text} mb-4`}>
            Campanha não encontrada
          </h1>
          <p className={`${themeClasses.textSecondary} mb-6`}>
            A campanha que você está procurando não existe ou foi removida.
          </p>
          <button
            onClick={handleGoBack}
            className="text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
            style={{ backgroundColor: primaryColor }}
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  const promotionInfo = getPromotionInfo(quotaQuantity);
  const totalValue = promotionInfo?.promotionalTotal || (quotaQuantity * campaign.ticket_price);

  return (
    <div className={`min-h-screen ${themeClasses.background} transition-colors duration-300`}>
      {/* Header */}
      <div className={`${themeClasses.cardBg} shadow-sm border-b ${themeClasses.border}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={handleGoBack}
              className={`flex items-center space-x-2 ${themeClasses.textSecondary} transition-colors duration-200`}
              style={{ color: primaryColor }}
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Voltar</span>
            </button>
            
            <div className="flex items-center space-x-2">
              {userProfile?.logo_url ? (
                <img 
                  src={userProfile.logo_url} 
                  alt="Logo" 
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <img 
                  src="/32132123.png" 
                  alt="Rifaqui Logo" 
                  className="w-8 h-8 object-contain"
                />
              )}
              <span className={`text-xl font-bold ${themeClasses.text}`}>
                {userProfile?.name || 'Rifaqui'}
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
            {/* Campaign Title */}
            <div className="text-center">
              <h1 className={`text-3xl md:text-4xl font-bold ${themeClasses.text} mb-4`}>
                {campaign.title}
              </h1>
            </div>

            {/* Campaign Images */}
            {campaign.prize_image_urls && campaign.prize_image_urls.length > 0 && (
              <div className="space-y-4">
                <img
                  src={campaign.prize_image_urls[0]}
                  alt={campaign.title}
                  className="w-full h-64 md:h-80 object-cover rounded-lg shadow-lg"
                />
                
                {campaign.prize_image_urls.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {campaign.prize_image_urls.slice(1, 5).map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`${campaign.title} ${index + 2}`}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Organizer and Draw Date Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Organizer Card */}
              <div className={`${themeClasses.cardBg} rounded-lg p-4 border ${themeClasses.border}`}>
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className={`text-sm ${themeClasses.textSecondary}`}>
                      Organizado por:
                    </div>
                    <div className={`font-semibold ${themeClasses.text}`}>
                      {userProfile?.name || 'Organizador'}
                    </div>
                  </div>
                </div>

                {/* Social Media Links */}
                {Object.keys(socialMediaLinks).length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {Object.entries(socialMediaLinks).map(([platform, url]) => {
                      const config = socialMediaConfig[platform as keyof typeof socialMediaConfig];
                      if (!config || !url) return null;

                      const IconComponent = config.icon;
                      return (
                        <a
                          key={platform}
                          href={url as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg transition-colors duration-200"
                          style={{ 
                            backgroundColor: config.color + '20',
                            color: config.color 
                          }}
                          title={config.name}
                        >
                          <IconComponent size={16} />
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Draw Date Card - Only show if campaign has draw_date and show_draw_date is true */}
              {campaign.draw_date && campaign.show_draw_date && (
                <div className={`${themeClasses.cardBg} rounded-lg p-4 border ${themeClasses.border}`}>
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                      <div className={`text-sm ${themeClasses.textSecondary}`}>
                        Data do sorteio:
                      </div>
                      <div className={`font-semibold ${themeClasses.text}`}>
                        {formatDate(campaign.draw_date)}
                      </div>
                      <div className={`text-sm ${themeClasses.textSecondary}`}>
                        às {formatTime(campaign.draw_date)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Campaign Description */}
            {campaign.description && (
              <div className={`${themeClasses.cardBg} rounded-lg p-6 border ${themeClasses.border}`}>
                <h2 className={`text-xl font-bold ${themeClasses.text} mb-4`}>
                  Sobre esta campanha
                </h2>
                <div 
                  className={`prose prose-sm max-w-none ${themeClasses.text}`}
                  dangerouslySetInnerHTML={{ __html: campaign.description }}
                />
              </div>
            )}

            {/* Quota Grid */}
            <div className={`${themeClasses.cardBg} rounded-lg p-6 border ${themeClasses.border}`}>
              <QuotaGrid
                totalQuotas={campaign.total_tickets}
                selectedQuotas={selectedQuotas}
                onQuotaSelect={handleQuotaSelect}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                mode={campaign.campaign_model}
                tickets={tickets}
                currentUserId={user?.id}
                campaignTheme={currentTheme}
                primaryColor={primaryColor}
              />
            </div>

            {/* Share Section */}
            <div className={`${themeClasses.cardBg} rounded-lg p-6 border ${themeClasses.border}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${themeClasses.text}`}>
                  Compartilhar
                </h3>
                <Share2 className={`h-5 w-5 ${themeClasses.textSecondary}`} />
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                {Object.entries(shareSectionConfig).map(([platform, config]) => {
                  const IconComponent = config.icon;
                  return (
                    <button
                      key={platform}
                      onClick={() => handleShare(platform)}
                      className={`flex flex-col items-center space-y-2 p-4 rounded-lg border ${themeClasses.border} hover:shadow-md transition-all duration-200`}
                      style={{ 
                        backgroundColor: config.color + '10',
                        borderColor: config.color + '30'
                      }}
                    >
                      <IconComponent 
                        className="text-white" 
                        size={24}
                        style={{ color: config.color }}
                      />
                      <span className={`text-xs font-medium ${themeClasses.text}`}>
                        {config.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Purchase Section */}
          <div className="space-y-6">
            {/* Campaign Stats */}
            <div className={`${themeClasses.cardBg} rounded-lg p-6 border ${themeClasses.border}`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`${themeClasses.textSecondary}`}>Valor por cota</span>
                  <span className={`font-bold ${themeClasses.text}`}>
                    {formatCurrency(campaign.ticket_price)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={`${themeClasses.textSecondary}`}>Cotas vendidas</span>
                  <span className={`font-bold ${themeClasses.text}`}>
                    {campaign.sold_tickets}/{campaign.total_tickets}
                  </span>
                </div>

                {campaign.show_percentage && (
                  <div className="flex items-center justify-between">
                    <span className={`${themeClasses.textSecondary}`}>Progresso</span>
                    <span className={`font-bold ${themeClasses.text}`}>
                      {Math.round((campaign.sold_tickets / campaign.total_tickets) * 100)}%
                    </span>
                  </div>
                )}

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className={`${themeClasses.textSecondary} text-sm`}>Progresso</div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className="h-3 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(campaign.sold_tickets / campaign.total_tickets) * 100}%`,
                        backgroundColor: primaryColor
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quota Selector */}
            <QuotaSelector
              ticketPrice={campaign.ticket_price}
              minTicketsPerPurchase={campaign.min_tickets_per_purchase}
              maxTicketsPerPurchase={campaign.max_tickets_per_purchase}
              onQuantityChange={handleQuantityChange}
              initialQuantity={quotaQuantity}
              mode={campaign.campaign_model}
              promotionInfo={promotionInfo}
              primaryColor={primaryColor}
              campaignTheme={currentTheme}
              onReserve={handleReserve}
              reserving={reserving}
            />
          </div>
        </div>
      </div>

      {/* Reservation Modal */}
      <ReservationModal
        isOpen={showReservationModal}
        onClose={() => setShowReservationModal(false)}
        onReserve={handleReservationSubmit}
        quotaCount={selectedQuotas.length || quotaQuantity}
        totalValue={totalValue}
        selectedQuotas={selectedQuotas}
        campaignTitle={campaign.title}
        primaryColor={primaryColor}
        campaignTheme={currentTheme}
        reserving={reserving}
      />
    </div>
  );
};

export default CampaignPage;