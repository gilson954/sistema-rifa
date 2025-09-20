import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Share2, 
  Users, 
  Clock, 
  Trophy, 
  Calendar,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertTriangle,
  User,
  Shield,
  Ticket
} from 'lucide-react';
import { useCampaignBySlug } from '../hooks/useCampaigns';
import { useTickets } from '../hooks/useTickets';
import { useAuth } from '../context/AuthContext';
import QuotaGrid from '../components/QuotaGrid';
import QuotaSelector from '../components/QuotaSelector';
import ReservationModal, { CustomerData } from '../components/ReservationModal';
import { calculateTotalWithPromotions } from '../utils/currency';
import { PublicProfilesAPI, PublicProfile } from '../lib/api/publicProfiles';
import { socialMediaConfig, shareSectionConfig } from '../components/SocialMediaIcons';

const CampaignPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Campaign and tickets data
  const { campaign, loading: campaignLoading, error: campaignError } = useCampaignBySlug(slug || '');
  const { 
    tickets, 
    loading: ticketsLoading, 
    reserveTickets, 
    reserving,
    getAvailableTickets,
    getReservedTickets,
    getPurchasedTickets,
    getMyTickets
  } = useTickets(campaign?.id || '');

  // UI state
  const [selectedQuotas, setSelectedQuotas] = useState<number[]>([]);
  const [quotaQuantity, setQuotaQuantity] = useState(1);
  const [activeFilter, setActiveFilter] = useState<'all' | 'available' | 'reserved' | 'purchased' | 'my-numbers'>('all');
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Profile customization data
  const [profileData, setProfileData] = useState<PublicProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Load profile customization data
  useEffect(() => {
    const loadProfileData = async () => {
      if (!campaign?.user_id) {
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);
      try {
        const { data, error } = await PublicProfilesAPI.getPublicProfile(campaign.user_id);
        
        if (error) {
          console.error('Error loading profile data:', error);
        } else {
          setProfileData(data);
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfileData();
  }, [campaign?.user_id]);

  // Get theme and colors from profile data
  const campaignTheme = profileData?.theme || 'claro';
  const primaryColor = profileData?.primary_color || '#3B82F6';
  const logoUrl = profileData?.logo_url;
  const socialMediaLinks = profileData?.social_media_links || {};

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

  // Update selected quotas when quantity changes (automatic mode)
  useEffect(() => {
    if (campaign?.campaign_model === 'automatic' && tickets.length > 0) {
      const availableTickets = getAvailableTickets();
      const newSelection = availableTickets
        .slice(0, quotaQuantity)
        .map(ticket => ticket.quota_number);
      setSelectedQuotas(newSelection);
    }
  }, [quotaQuantity, tickets, campaign?.campaign_model, getAvailableTickets]);

  // Reset filter when campaign changes
  useEffect(() => {
    if (campaign) {
      setActiveFilter(campaign.initial_filter || 'all');
    }
  }, [campaign]);

  const handleQuotaSelect = (quotaNumber: number) => {
    if (campaign?.campaign_model !== 'manual') return;

    setSelectedQuotas(prev => {
      const isSelected = prev.includes(quotaNumber);
      let newSelection;

      if (isSelected) {
        newSelection = prev.filter(q => q !== quotaNumber);
      } else {
        if (prev.length >= (campaign?.max_tickets_per_purchase || 1000)) {
          alert(`Máximo ${campaign?.max_tickets_per_purchase} cotas por compra`);
          return prev;
        }
        newSelection = [...prev, quotaNumber];
      }

      // Ensure minimum tickets requirement
      if (newSelection.length < (campaign?.min_tickets_per_purchase || 1)) {
        return prev; // Don't allow going below minimum
      }

      return newSelection;
    });
  };

  const handleQuantityChange = (quantity: number) => {
    setQuotaQuantity(quantity);
  };

  const handleReserve = () => {
    if (selectedQuotas.length === 0) {
      alert('Selecione pelo menos uma cota');
      return;
    }

    if (selectedQuotas.length < (campaign?.min_tickets_per_purchase || 1)) {
      alert(`Mínimo ${campaign?.min_tickets_per_purchase} cotas por compra`);
      return;
    }

    setShowReservationModal(true);
  };

  const handleReservationSubmit = async (customerData: CustomerData) => {
    if (!user) {
      alert('Você precisa estar logado para fazer uma reserva');
      return;
    }

    try {
      const result = await reserveTickets(selectedQuotas, user.id);
      
      if (result) {
        // Navigate to payment confirmation page
        const reservationData = {
          reservationId: `RES-${Date.now()}`,
          customerName: customerData.name,
          customerEmail: customerData.email,
          customerPhone: `${customerData.countryCode} ${customerData.phoneNumber}`,
          quotaCount: selectedQuotas.length,
          totalValue: calculateTotal(),
          selectedQuotas: selectedQuotas,
          campaignTitle: campaign?.title || '',
          campaignId: campaign?.id || '',
          expiresAt: new Date(Date.now() + (campaign?.reservation_timeout_minutes || 15) * 60 * 1000).toISOString()
        };

        navigate('/payment-confirmation', { 
          state: { reservationData }
        });
      }
    } catch (error) {
      console.error('Error making reservation:', error);
      alert('Erro ao fazer reserva. Tente novamente.');
    } finally {
      setShowReservationModal(false);
    }
  };

  const calculateTotal = () => {
    const quantity = campaign?.campaign_model === 'manual' ? selectedQuotas.length : quotaQuantity;
    const { total } = calculateTotalWithPromotions(
      quantity,
      campaign?.ticket_price || 0,
      campaign?.promotions || []
    );
    return total;
  };

  const calculateProgressPercentage = () => {
    if (!campaign) return 0;
    return Math.round((campaign.sold_tickets / campaign.total_tickets) * 100);
  };

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

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Participe da ${campaign?.title}! ${campaign?.description || ''}`;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'x':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleGoBack = () => {
    navigate('/');
  };

  if (campaignLoading || profileLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${getThemeClasses(campaignTheme).background}`}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (campaignError || !campaign) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${getThemeClasses(campaignTheme).background}`}>
        <div className={`text-center ${getThemeClasses(campaignTheme).cardBg} p-8 rounded-lg border ${getThemeClasses(campaignTheme).border}`}>
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className={`text-2xl font-bold ${getThemeClasses(campaignTheme).text} mb-2`}>
            Campanha não encontrada
          </h2>
          <p className={`${getThemeClasses(campaignTheme).textSecondary} mb-4`}>
            A campanha que você está procurando não existe ou foi removida.
          </p>
          <button
            onClick={handleGoBack}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  if (campaign.status !== 'active') {
    return (
      <div className={`min-h-screen flex items-center justify-center ${getThemeClasses(campaignTheme).background}`}>
        <div className={`text-center ${getThemeClasses(campaignTheme).cardBg} p-8 rounded-lg border ${getThemeClasses(campaignTheme).border}`}>
          <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className={`text-2xl font-bold ${getThemeClasses(campaignTheme).text} mb-2`}>
            Campanha não está ativa
          </h2>
          <p className={`${getThemeClasses(campaignTheme).textSecondary} mb-4`}>
            Esta campanha ainda não foi publicada ou já foi finalizada.
          </p>
          <button
            onClick={handleGoBack}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  const availableTickets = getAvailableTickets();
  const reservedTickets = getReservedTickets();
  const purchasedTickets = getPurchasedTickets();
  const myTickets = getMyTickets();

  return (
    <div className={`min-h-screen ${getThemeClasses(campaignTheme).background} transition-colors duration-300`}>
      {/* Header */}
      <div className={`${getThemeClasses(campaignTheme).cardBg} shadow-sm border-b ${getThemeClasses(campaignTheme).border}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={handleGoBack}
              className={`flex items-center space-x-2 ${getThemeClasses(campaignTheme).textSecondary} hover:opacity-80 transition-opacity duration-200`}
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Voltar</span>
            </button>
            
            <div className="flex items-center space-x-2">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="Logo" 
                  className="h-8 object-contain"
                />
              ) : (
                <>
                  <img 
                    src="/logo-chatgpt.png" 
                    alt="Rifaqui Logo" 
                    className="w-8 h-8 object-contain"
                  />
                  <span className={`text-xl font-bold ${getThemeClasses(campaignTheme).text}`}>Rifaqui</span>
                </>
              )}
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
            <div className={`${getThemeClasses(campaignTheme).cardBg} rounded-2xl shadow-lg p-6 border ${getThemeClasses(campaignTheme).border}`}>
              {/* Campaign Image */}
              <div className="mb-6">
                <img
                  src={campaign.prize_image_urls?.[0] || 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1'}
                  alt={campaign.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>

              {/* Campaign Title and Organizer */}
              <div className="mb-6">
                <h1 className={`text-3xl font-bold ${getThemeClasses(campaignTheme).text} mb-4`}>
                  {campaign.title}
                </h1>
                
                {/* Organizer Info */}
                <div className={`${getThemeClasses(campaignTheme).cardBg} rounded-lg p-4 inline-flex items-center space-x-3 border ${getThemeClasses(campaignTheme).border}`}>
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {profileData?.name?.charAt(0).toUpperCase() || 'O'}
                  </div>
                  <div>
                    <div className={`text-sm ${getThemeClasses(campaignTheme).textSecondary}`}>
                      Organizado por:
                    </div>
                    <div className={`font-semibold ${getThemeClasses(campaignTheme).text}`}>
                      {profileData?.name || 'Organizador'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Campaign Progress */}
              <div className={`${getThemeClasses(campaignTheme).cardBg} rounded-lg p-4 mb-6 border ${getThemeClasses(campaignTheme).border}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${getThemeClasses(campaignTheme).textSecondary}`}>
                    Progresso da campanha
                  </span>
                  {campaign.show_percentage && (
                    <span className={`text-sm font-medium ${getThemeClasses(campaignTheme).text}`}>
                      {calculateProgressPercentage()}%
                    </span>
                  )}
                </div>
                <div className="bg-gray-300 dark:bg-gray-600 rounded-full h-3 mb-2">
                  <div 
                    className="h-3 rounded-full transition-all duration-300"
                    style={{ 
                      backgroundColor: primaryColor,
                      width: `${calculateProgressPercentage()}%` 
                    }}
                  ></div>
                </div>
                <div className={`text-sm ${getThemeClasses(campaignTheme).text}`}>
                  {campaign.sold_tickets}/{campaign.total_tickets} cotas vendidas
                </div>
              </div>

              {/* Campaign Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className={`${getThemeClasses(campaignTheme).cardBg} rounded-lg p-4 text-center border ${getThemeClasses(campaignTheme).border}`}>
                  <div className={`text-2xl font-bold ${getThemeClasses(campaignTheme).text}`}>
                    {formatCurrency(campaign.ticket_price)}
                  </div>
                  <div className={`text-sm ${getThemeClasses(campaignTheme).textSecondary}`}>
                    Por cota
                  </div>
                </div>
                
                <div className={`${getThemeClasses(campaignTheme).cardBg} rounded-lg p-4 text-center border ${getThemeClasses(campaignTheme).border}`}>
                  <div className={`text-2xl font-bold text-green-600`}>
                    {availableTickets.length}
                  </div>
                  <div className={`text-sm ${getThemeClasses(campaignTheme).textSecondary}`}>
                    Disponíveis
                  </div>
                </div>
                
                <div className={`${getThemeClasses(campaignTheme).cardBg} rounded-lg p-4 text-center border ${getThemeClasses(campaignTheme).border}`}>
                  <div className={`text-2xl font-bold text-orange-600`}>
                    {reservedTickets.length}
                  </div>
                  <div className={`text-sm ${getThemeClasses(campaignTheme).textSecondary}`}>
                    Reservadas
                  </div>
                </div>
                
                <div className={`${getThemeClasses(campaignTheme).cardBg} rounded-lg p-4 text-center border ${getThemeClasses(campaignTheme).border}`}>
                  <div className={`text-2xl font-bold text-blue-600`}>
                    {purchasedTickets.length}
                  </div>
                  <div className={`text-sm ${getThemeClasses(campaignTheme).textSecondary}`}>
                    Vendidas
                  </div>
                </div>
              </div>

              {/* Draw Date */}
              {campaign.show_draw_date && campaign.draw_date && (
                <div className={`${getThemeClasses(campaignTheme).cardBg} rounded-lg p-4 mb-6 border ${getThemeClasses(campaignTheme).border}`}>
                  <div className="flex items-center space-x-3">
                    <Calendar className={`h-5 w-5 ${getThemeClasses(campaignTheme).textSecondary}`} />
                    <div>
                      <div className={`text-sm ${getThemeClasses(campaignTheme).textSecondary}`}>
                        Data do sorteio
                      </div>
                      <div className={`font-semibold ${getThemeClasses(campaignTheme).text}`}>
                        {formatDate(campaign.draw_date)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Campaign Description */}
              {campaign.description && (
                <div className={`${getThemeClasses(campaignTheme).cardBg} rounded-lg p-4 border ${getThemeClasses(campaignTheme).border}`}>
                  <h3 className={`text-lg font-semibold ${getThemeClasses(campaignTheme).text} mb-3`}>
                    Sobre esta campanha
                  </h3>
                  <div 
                    className={`prose prose-sm max-w-none ${getThemeClasses(campaignTheme).text}`}
                    dangerouslySetInnerHTML={{ __html: campaign.description }}
                  />
                </div>
              )}
            </div>

            {/* Quota Grid */}
            <div className={`${getThemeClasses(campaignTheme).cardBg} rounded-2xl shadow-lg p-6 border ${getThemeClasses(campaignTheme).border}`}>
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
          </div>

          {/* Right Column - Purchase Section */}
          <div className="space-y-6">
            {/* Quota Selector (Automatic Mode) */}
            {campaign.campaign_model === 'automatic' && (
              <QuotaSelector
                ticketPrice={campaign.ticket_price}
                minTicketsPerPurchase={campaign.min_tickets_per_purchase}
                maxTicketsPerPurchase={campaign.max_tickets_per_purchase}
                onQuantityChange={handleQuantityChange}
                initialQuantity={quotaQuantity}
                mode={campaign.campaign_model}
                promotions={campaign.promotions}
                primaryColor={primaryColor}
                campaignTheme={campaignTheme}
                onReserve={handleReserve}
                reserving={reserving}
                disabled={availableTickets.length === 0}
              />
            )}

            {/* Manual Mode Purchase Button */}
            {campaign.campaign_model === 'manual' && (
              <div className={`${getThemeClasses(campaignTheme).cardBg} rounded-xl shadow-md p-4 sm:p-5 border ${getThemeClasses(campaignTheme).border}`}>
                <h2 className={`text-lg font-bold ${getThemeClasses(campaignTheme).text} mb-4 text-center`}>
                  COTAS SELECIONADAS
                </h2>
                
                <div className="text-center mb-4">
                  <div className={`text-xs ${getThemeClasses(campaignTheme).textSecondary} mb-1`}>
                    {selectedQuotas.length} {selectedQuotas.length === 1 ? 'cota selecionada' : 'cotas selecionadas'}
                  </div>
                  <div className={`text-xl font-bold ${getThemeClasses(campaignTheme).text}`}>
                    {formatCurrency(calculateTotal())}
                  </div>
                </div>

                <button 
                  onClick={handleReserve}
                  disabled={selectedQuotas.length === 0 || reserving}
                  className="w-full text-white py-3 rounded-lg font-bold text-base transition-colors duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: primaryColor }}
                >
                  {reserving ? 'RESERVANDO...' : selectedQuotas.length === 0 ? 'SELECIONE COTAS' : 'RESERVAR'}
                </button>
              </div>
            )}

            {/* Share Section */}
            <div className={`${getThemeClasses(campaignTheme).cardBg} rounded-xl shadow-md p-6 border ${getThemeClasses(campaignTheme).border}`}>
              <h3 className={`text-lg font-bold ${getThemeClasses(campaignTheme).text} mb-4 text-center`}>
                COMPARTILHAR
              </h3>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                {Object.entries(shareSectionConfig).map(([platform, config]) => {
                  const IconComponent = config.icon;
                  return (
                    <button
                      key={platform}
                      onClick={() => handleShare(platform)}
                      className="flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-white font-medium transition-all duration-200 hover:brightness-90"
                      style={{ backgroundColor: config.color }}
                    >
                      <IconComponent size={16} />
                      <span className="text-sm">{config.name}</span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleCopyLink}
                className={`w-full py-3 rounded-lg font-medium transition-colors duration-200 border ${getThemeClasses(campaignTheme).border} ${getThemeClasses(campaignTheme).text} hover:opacity-80 flex items-center justify-center space-x-2`}
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Link copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copiar link</span>
                  </>
                )}
              </button>
            </div>

            {/* Social Media Links */}
            {Object.keys(socialMediaLinks).length > 0 && (
              <div className={`${getThemeClasses(campaignTheme).cardBg} rounded-xl shadow-md p-6 border ${getThemeClasses(campaignTheme).border}`}>
                <h3 className={`text-lg font-bold ${getThemeClasses(campaignTheme).text} mb-4 text-center`}>
                  REDES SOCIAIS
                </h3>
                
                <div className="space-y-3">
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
                        className="flex items-center space-x-3 py-3 px-4 rounded-lg text-white font-medium transition-all duration-200 hover:brightness-90"
                        style={{ backgroundColor: config.color }}
                      >
                        <IconComponent size={20} />
                        <span>{config.name}</span>
                        <ExternalLink className="h-4 w-4 ml-auto" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Contact Info */}
            {campaign.phone_number && (
              <div className={`${getThemeClasses(campaignTheme).cardBg} rounded-xl shadow-md p-6 border ${getThemeClasses(campaignTheme).border}`}>
                <h3 className={`text-lg font-bold ${getThemeClasses(campaignTheme).text} mb-4 text-center`}>
                  CONTATO
                </h3>
                
                <div className="flex items-center space-x-3">
                  <Phone className={`h-5 w-5 ${getThemeClasses(campaignTheme).textSecondary}`} />
                  <div>
                    <div className={`text-sm ${getThemeClasses(campaignTheme).textSecondary}`}>
                      Telefone do organizador
                    </div>
                    <div className={`font-medium ${getThemeClasses(campaignTheme).text}`}>
                      {campaign.phone_number}
                    </div>
                  </div>
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
        quotaCount={campaign.campaign_model === 'manual' ? selectedQuotas.length : quotaQuantity}
        totalValue={calculateTotal()}
        selectedQuotas={selectedQuotas}
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