import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Share2, 
  Users, 
  Calendar, 
  Clock, 
  Trophy, 
  CheckCircle, 
  AlertTriangle,
  User,
  Phone,
  Mail,
  Globe,
  Copy,
  ExternalLink,
  Shield,
  CreditCard
} from 'lucide-react';
import { useCampaignBySlug } from '../hooks/useCampaigns';
import { useTickets } from '../hooks/useTickets';
import { useAuth } from '../context/AuthContext';
import QuotaGrid from '../components/QuotaGrid';
import QuotaSelector from '../components/QuotaSelector';
import ReservationModal, { CustomerData } from '../components/ReservationModal';
import { socialMediaConfig, shareSectionConfig } from '../components/SocialMediaIcons';
import { supabase, Database } from '../lib/supabase';
import { formatReservationTime } from '../utils/timeFormatters';
import { calculateTotalWithPromotions } from '../utils/currency';

// Type for campaign owner profile
type OwnerProfile = Database['public']['Tables']['profiles']['Row'];

const CampaignPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Campaign data
  const { campaign, loading: campaignLoading, error: campaignError } = useCampaignBySlug(slug || '');
  
  // Owner profile data
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  
  // Tickets data
  const {
    tickets,
    loading: ticketsLoading,
    reserveTickets,
    reserving
  } = useTickets(campaign?.id || '');

  // UI state
  const [selectedQuotas, setSelectedQuotas] = useState<number[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'available' | 'reserved' | 'purchased' | 'my-numbers'>('all');
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);

  // Fetch owner profile when campaign is loaded
  useEffect(() => {
    const fetchOwnerProfile = async () => {
      if (!campaign?.user_id) return;

      setProfileLoading(true);
      setProfileError(null);

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('primary_color, theme, logo_url, social_media_links, payment_integrations_config, name')
          .eq('id', campaign.user_id)
          .single();

        if (error) {
          console.error('Error fetching owner profile:', error);
          setProfileError('Erro ao carregar perfil do organizador');
        } else {
          setOwnerProfile(data);
        }
      } catch (error) {
        console.error('Error fetching owner profile:', error);
        setProfileError('Erro inesperado ao carregar perfil');
      } finally {
        setProfileLoading(false);
      }
    };

    fetchOwnerProfile();
  }, [campaign?.user_id]);

  // Apply owner's theme to the page
  useEffect(() => {
    if (!ownerProfile?.theme) return;

    const applyTheme = () => {
      const htmlElement = document.documentElement;
      
      // Remove existing theme classes
      htmlElement.classList.remove('dark');
      
      // Apply owner's theme
      if (ownerProfile.theme === 'escuro' || ownerProfile.theme === 'escuro-preto') {
        htmlElement.classList.add('dark');
      }
    };

    applyTheme();

    // Cleanup function to restore original theme when leaving the page
    return () => {
      // Check if user has their own theme preference
      const userTheme = localStorage.getItem('theme');
      const htmlElement = document.documentElement;
      
      htmlElement.classList.remove('dark');
      
      if (userTheme === 'dark') {
        htmlElement.classList.add('dark');
      }
    };
  }, [ownerProfile?.theme]);

  // Function to get theme classes based on owner's theme
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

  // Check if campaign is available for participation
  const isCampaignAvailable = useCallback(() => {
    if (!campaign) return false;
    return campaign.status === 'active';
  }, [campaign]);

  // Handle quota selection for manual mode
  const handleQuotaSelect = (quotaNumber: number) => {
    if (campaign?.campaign_model !== 'manual') return;

    setSelectedQuotas(prev => {
      if (prev.includes(quotaNumber)) {
        return prev.filter(q => q !== quotaNumber);
      } else {
        return [...prev, quotaNumber];
      }
    });
  };

  // Handle quantity change for automatic mode
  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
  };

  // Handle reservation
  const handleReserve = () => {
    if (!isCampaignAvailable()) {
      alert('Esta campanha não está disponível para participação');
      return;
    }

    if (campaign?.campaign_model === 'manual' && selectedQuotas.length === 0) {
      alert('Selecione pelo menos uma cota');
      return;
    }

    if (campaign?.campaign_model === 'automatic' && quantity < (campaign?.min_tickets_per_purchase || 1)) {
      alert(`Selecione pelo menos ${campaign?.min_tickets_per_purchase} cotas`);
      return;
    }

    setShowReservationModal(true);
  };

  // Handle reservation confirmation
  const handleReservationConfirm = async (customerData: CustomerData) => {
    if (!campaign || !user) {
      alert('Erro: dados da campanha ou usuário não encontrados');
      return;
    }

    try {
      const quotasToReserve = campaign.campaign_model === 'manual' 
        ? selectedQuotas 
        : Array.from({ length: quantity }, (_, i) => i + 1); // This would need proper logic for automatic selection

      const result = await reserveTickets(quotasToReserve, user.id);
      
      if (result) {
        // Navigate to payment confirmation
        navigate('/payment-confirmation', {
          state: {
            reservationData: {
              reservationId: `RES-${Date.now()}`,
              customerName: customerData.name,
              customerEmail: customerData.email,
              customerPhone: `${customerData.countryCode} ${customerData.phoneNumber}`,
              quotaCount: quotasToReserve.length,
              totalValue: calculateTotal(),
              selectedQuotas: quotasToReserve,
              campaignTitle: campaign.title,
              campaignId: campaign.id,
              expiresAt: new Date(Date.now() + (campaign.reservation_timeout_minutes || 15) * 60 * 1000).toISOString()
            }
          }
        });
      }
    } catch (error) {
      console.error('Error reserving tickets:', error);
      alert('Erro ao reservar cotas. Tente novamente.');
    } finally {
      setShowReservationModal(false);
    }
  };

  // Calculate total value
  const calculateTotal = () => {
    if (!campaign) return 0;
    
    const ticketCount = campaign.campaign_model === 'manual' ? selectedQuotas.length : quantity;
    const { total } = calculateTotalWithPromotions(
      ticketCount,
      campaign.ticket_price,
      campaign.promotions || []
    );
    return total;
  };

  // Handle share
  const handleShare = async (platform: string) => {
    const url = window.location.href;
    const text = `Participe da ${campaign?.title}! ${url}`;

    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
      return;
    }

    const shareUrls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(campaign?.title || '')}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
    };

    const shareUrl = shareUrls[platform as keyof typeof shareUrls];
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
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
  const calculateProgressPercentage = () => {
    if (!campaign) return 0;
    return Math.round((campaign.sold_tickets / campaign.total_tickets) * 100);
  };

  // Get available payment methods from owner profile
  const getAvailablePaymentMethods = () => {
    if (!ownerProfile?.payment_integrations_config) return [];
    
    const methods = [];
    const config = ownerProfile.payment_integrations_config;
    
    if (config.fluxsis?.api_key) methods.push({ name: 'Fluxsis', logo: '/fluxsis22.png' });
    if (config.pay2m?.api_key) methods.push({ name: 'Pay2m', logo: '/pay2m2.png' });
    if (config.paggue?.api_key) methods.push({ name: 'Paggue', logo: '/paggue2.png' });
    if (config.efi_bank?.client_id) methods.push({ name: 'Efi Bank', logo: '/efi2.png' });
    
    return methods;
  };

  // Get social media links from owner profile
  const getSocialMediaLinks = () => {
    if (!ownerProfile?.social_media_links) return [];
    
    const links = [];
    const socialLinks = ownerProfile.social_media_links;
    
    Object.entries(socialLinks).forEach(([platform, url]) => {
      if (url && socialMediaConfig[platform as keyof typeof socialMediaConfig]) {
        const config = socialMediaConfig[platform as keyof typeof socialMediaConfig];
        links.push({
          platform,
          url,
          name: config.name,
          icon: config.icon,
          color: config.color
        });
      }
    });
    
    return links;
  };

  // Loading state - wait for both campaign and profile data
  const isLoading = campaignLoading || profileLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-300">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (campaignError || !campaign) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4 transition-colors duration-300">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-800 text-center max-w-md">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Campanha não encontrada
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            A campanha que você está procurando não existe ou foi removida.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  // Get theme classes based on owner's theme preference
  const themeClasses = getThemeClasses(ownerProfile?.theme || 'claro');
  const primaryColor = ownerProfile?.primary_color || '#3B82F6';
  const campaignTheme = ownerProfile?.theme || 'claro';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeClasses.background}`}>
      {/* Header */}
      <div className={`shadow-sm border-b transition-colors duration-300 ${themeClasses.cardBg} ${themeClasses.border}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/')}
              className={`flex items-center space-x-2 transition-colors duration-200 ${themeClasses.textSecondary} hover:opacity-80`}
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Voltar</span>
            </button>
            
            <div className="flex items-center space-x-2">
              {/* Owner's Logo */}
              {ownerProfile?.logo_url ? (
                <img 
                  src={ownerProfile.logo_url} 
                  alt="Logo do organizador" 
                  className="w-10 h-10 object-contain"
                />
              ) : (
                <img 
                  src="/logo-chatgpt.png" 
                  alt="Rifaqui Logo" 
                  className="w-10 h-10 object-contain"
                />
              )}
              <span className={`text-xl font-bold ${themeClasses.text}`}>
                {ownerProfile?.logo_url ? '' : 'Rifaqui'}
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
            <div className={`rounded-2xl shadow-xl p-6 border transition-colors duration-300 ${themeClasses.cardBg} ${themeClasses.border}`}>
              {/* Campaign Images */}
              {campaign.prize_image_urls && campaign.prize_image_urls.length > 0 && (
                <div className="mb-6">
                  <img
                    src={campaign.prize_image_urls[0]}
                    alt={campaign.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              <h1 className={`text-3xl font-bold mb-4 ${themeClasses.text}`}>
                {campaign.title}
              </h1>

              {/* Campaign Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className={`text-center p-4 rounded-lg ${themeClasses.background} ${themeClasses.border} border`}>
                  <div className={`text-2xl font-bold ${themeClasses.text}`}>
                    {formatCurrency(campaign.ticket_price)}
                  </div>
                  <div className={`text-sm ${themeClasses.textSecondary}`}>
                    Por cota
                  </div>
                </div>

                <div className={`text-center p-4 rounded-lg ${themeClasses.background} ${themeClasses.border} border`}>
                  <div className={`text-2xl font-bold ${themeClasses.text}`}>
                    {campaign.total_tickets.toLocaleString('pt-BR')}
                  </div>
                  <div className={`text-sm ${themeClasses.textSecondary}`}>
                    Total de cotas
                  </div>
                </div>

                <div className={`text-center p-4 rounded-lg ${themeClasses.background} ${themeClasses.border} border`}>
                  <div className={`text-2xl font-bold ${themeClasses.text}`}>
                    {campaign.sold_tickets.toLocaleString('pt-BR')}
                  </div>
                  <div className={`text-sm ${themeClasses.textSecondary}`}>
                    Vendidas
                  </div>
                </div>

                <div className={`text-center p-4 rounded-lg ${themeClasses.background} ${themeClasses.border} border`}>
                  <div className={`text-2xl font-bold ${themeClasses.text}`}>
                    {(campaign.total_tickets - campaign.sold_tickets).toLocaleString('pt-BR')}
                  </div>
                  <div className={`text-sm ${themeClasses.textSecondary}`}>
                    Restantes
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${themeClasses.text}`}>
                    Progresso da campanha
                  </span>
                  {campaign.show_percentage && (
                    <span className={`text-sm font-medium ${themeClasses.text}`}>
                      {calculateProgressPercentage()}%
                    </span>
                  )}
                </div>
                <div className={`w-full rounded-full h-3 ${themeClasses.background}`}>
                  <div 
                    className="h-3 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${calculateProgressPercentage()}%`,
                      backgroundColor: primaryColor 
                    }}
                  ></div>
                </div>
              </div>

              {/* Campaign Description */}
              {campaign.description && (
                <div className="mb-6">
                  <h3 className={`text-lg font-semibold mb-3 ${themeClasses.text}`}>
                    Sobre esta campanha
                  </h3>
                  <div 
                    className={`prose max-w-none ${themeClasses.text}`}
                    dangerouslySetInnerHTML={{ __html: campaign.description }}
                  />
                </div>
              )}

              {/* Draw Date */}
              {campaign.show_draw_date && campaign.draw_date && (
                <div className={`p-4 rounded-lg border ${themeClasses.background} ${themeClasses.border}`}>
                  <div className="flex items-center space-x-2">
                    <Calendar className={`h-5 w-5 ${themeClasses.textSecondary}`} />
                    <span className={`font-medium ${themeClasses.text}`}>
                      Data do sorteio: {formatDate(campaign.draw_date)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Organizer Info */}
            <div className={`rounded-2xl shadow-xl p-6 border transition-colors duration-300 ${themeClasses.cardBg} ${themeClasses.border}`}>
              <h3 className={`text-lg font-semibold mb-4 ${themeClasses.text}`}>
                Informações do organizador
              </h3>
              
              <div className="flex items-center space-x-4 mb-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  {ownerProfile?.name?.charAt(0).toUpperCase() || 'O'}
                </div>
                <div>
                  <div className={`font-semibold ${themeClasses.text}`}>
                    {ownerProfile?.name || 'Organizador'}
                  </div>
                  <div className={`text-sm ${themeClasses.textSecondary}`}>
                    Criador da campanha
                  </div>
                </div>
              </div>

              {/* Social Media Links */}
              {getSocialMediaLinks().length > 0 && (
                <div className="mb-4">
                  <h4 className={`text-sm font-medium mb-2 ${themeClasses.text}`}>
                    Redes sociais
                  </h4>
                  <div className="flex space-x-3">
                    {getSocialMediaLinks().map((social) => {
                      const IconComponent = social.icon;
                      return (
                        <a
                          key={social.platform}
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:opacity-80 transition-opacity duration-200"
                          style={{ backgroundColor: social.color }}
                          title={social.name}
                        >
                          <IconComponent size={20} />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Payment Methods */}
              {getAvailablePaymentMethods().length > 0 && (
                <div>
                  <h4 className={`text-sm font-medium mb-2 ${themeClasses.text}`}>
                    Métodos de pagamento aceitos
                  </h4>
                  <div className="flex space-x-3">
                    {getAvailablePaymentMethods().map((method) => (
                      <div
                        key={method.name}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${themeClasses.background} ${themeClasses.border}`}
                        title={method.name}
                      >
                        <img 
                          src={method.logo} 
                          alt={`${method.name} Logo`} 
                          className="w-6 h-6 object-contain"
                        />
                        <span className={`text-xs font-medium ${themeClasses.text}`}>
                          {method.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Share Section */}
            <div className={`rounded-2xl shadow-xl p-6 border transition-colors duration-300 ${themeClasses.cardBg} ${themeClasses.border}`}>
              <h3 className={`text-lg font-semibold mb-4 ${themeClasses.text}`}>
                Compartilhar campanha
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(shareSectionConfig).map(([platform, config]) => {
                  const IconComponent = config.icon;
                  return (
                    <button
                      key={platform}
                      onClick={() => handleShare(platform)}
                      className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:opacity-80 transition-opacity duration-200"
                      style={{ backgroundColor: config.color }}
                    >
                      <IconComponent className="text-white" size={24} />
                      <span className="text-white text-xs font-medium">
                        {config.name}
                      </span>
                    </button>
                  );
                })}
                
                {/* Copy Link Button */}
                <button
                  onClick={() => handleShare('copy')}
                  className={`flex flex-col items-center space-y-2 p-3 rounded-lg border transition-colors duration-200 ${themeClasses.background} ${themeClasses.border} hover:opacity-80`}
                >
                  {copied ? (
                    <CheckCircle className="text-green-600" size={24} />
                  ) : (
                    <Copy className={themeClasses.textSecondary} size={24} />
                  )}
                  <span className={`text-xs font-medium ${themeClasses.text}`}>
                    {copied ? 'Copiado!' : 'Copiar'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Participation */}
          <div className="space-y-6">
            {/* Quota Selector for Automatic Mode */}
            {campaign.campaign_model === 'automatic' && isCampaignAvailable() && (
              <QuotaSelector
                ticketPrice={campaign.ticket_price}
                minTicketsPerPurchase={campaign.min_tickets_per_purchase}
                maxTicketsPerPurchase={campaign.max_tickets_per_purchase}
                onQuantityChange={handleQuantityChange}
                initialQuantity={quantity}
                mode={campaign.campaign_model}
                promotions={campaign.promotions}
                primaryColor={primaryColor}
                campaignTheme={campaignTheme}
                onReserve={handleReserve}
                reserving={reserving}
                disabled={!isCampaignAvailable()}
              />
            )}

            {/* Quota Grid */}
            <div className={`rounded-2xl shadow-xl p-6 border transition-colors duration-300 ${themeClasses.cardBg} ${themeClasses.border}`}>
              <QuotaGrid
                totalQuotas={campaign.total_tickets}
                selectedQuotas={selectedQuotas}
                onQuotaSelect={campaign.campaign_model === 'manual' ? handleQuotaSelect : undefined}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                mode={campaign.campaign_model}
                tickets={tickets}
                currentUserId={user?.id}
                campaignTheme={campaignTheme}
                primaryColor={primaryColor}
              />

              {/* Manual Mode Reserve Button */}
              {campaign.campaign_model === 'manual' && selectedQuotas.length > 0 && isCampaignAvailable() && (
                <div className="mt-6">
                  <div className={`text-center mb-4 p-4 rounded-lg ${themeClasses.background} ${themeClasses.border} border`}>
                    <div className={`text-sm ${themeClasses.textSecondary} mb-1`}>
                      {selectedQuotas.length} {selectedQuotas.length === 1 ? 'cota selecionada' : 'cotas selecionadas'}
                    </div>
                    <div className={`text-2xl font-bold ${themeClasses.text}`}>
                      {formatCurrency(calculateTotal())}
                    </div>
                  </div>
                  
                  <button
                    onClick={handleReserve}
                    disabled={reserving}
                    className="w-full text-white py-3 rounded-lg font-bold text-lg transition-colors duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {reserving ? 'RESERVANDO...' : 'RESERVAR COTAS'}
                  </button>
                </div>
              )}
            </div>

            {/* Campaign Info Card */}
            <div className={`rounded-2xl shadow-xl p-6 border transition-colors duration-300 ${themeClasses.cardBg} ${themeClasses.border}`}>
              <h3 className={`text-lg font-semibold mb-4 ${themeClasses.text}`}>
                Detalhes da campanha
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={themeClasses.textSecondary}>Método de sorteio</span>
                  <span className={`font-medium ${themeClasses.text}`}>
                    {campaign.draw_method}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={themeClasses.textSecondary}>Tempo de reserva</span>
                  <span className={`font-medium ${themeClasses.text}`}>
                    {formatReservationTime(campaign.reservation_timeout_minutes)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={themeClasses.textSecondary}>Modelo</span>
                  <span className={`font-medium ${themeClasses.text}`}>
                    {campaign.campaign_model === 'manual' ? 'Manual' : 'Automático'}
                  </span>
                </div>

                {campaign.phone_number && (
                  <div className="flex items-center justify-between">
                    <span className={themeClasses.textSecondary}>Contato</span>
                    <span className={`font-medium ${themeClasses.text}`}>
                      {campaign.phone_number}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Prizes Section */}
            {campaign.prizes && Array.isArray(campaign.prizes) && campaign.prizes.length > 0 && (
              <div className={`rounded-2xl shadow-xl p-6 border transition-colors duration-300 ${themeClasses.cardBg} ${themeClasses.border}`}>
                <h3 className={`text-lg font-semibold mb-4 ${themeClasses.text}`}>
                  Prêmios
                </h3>
                <div className="space-y-2">
                  {campaign.prizes.map((prize: any, index: number) => (
                    <div key={prize.id || index} className="flex items-center space-x-3">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {index + 1}
                      </div>
                      <span className={themeClasses.text}>
                        {prize.name}
                      </span>
                    </div>
                  ))}
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
        onReserve={handleReservationConfirm}
        quotaCount={campaign.campaign_model === 'manual' ? selectedQuotas.length : quantity}
        totalValue={calculateTotal()}
        selectedQuotas={campaign.campaign_model === 'manual' ? selectedQuotas : undefined}
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