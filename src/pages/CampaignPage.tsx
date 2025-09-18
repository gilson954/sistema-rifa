import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Share2, 
  Users, 
  Calendar, 
  Trophy, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Copy,
  User,
  Phone,
  Mail,
  Globe
} from 'lucide-react';
import { useCampaignBySlug } from '../hooks/useCampaigns';
import { useTickets } from '../hooks/useTickets';
import { useAuth } from '../context/AuthContext';
import QuotaGrid from '../components/QuotaGrid';
import QuotaSelector from '../components/QuotaSelector';
import ReservationModal, { CustomerData } from '../components/ReservationModal';
import { calculateTotalWithPromotions } from '../utils/currency';
import { formatReservationTime } from '../utils/timeFormatters';
import { supabase } from '../lib/supabase';
import { socialMediaConfig, shareSectionConfig } from '../components/SocialMediaIcons';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  primary_color: string | null;
  theme: string | null;
  logo_url: string | null;
  social_media_links: any | null;
  payment_integrations_config: any | null;
}

interface PromotionInfo {
  promotion: any;
  originalTotal: number;
  promotionalTotal: number;
  savings: number;
  discountPercentage: number;
}

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
    error: ticketsError
  } = useTickets(campaign?.id || '');

  // User profile data (campaign owner's customizations)
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // UI state
  const [selectedQuotas, setSelectedQuotas] = useState<number[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [activeFilter, setActiveFilter] = useState<'all' | 'available' | 'reserved' | 'purchased' | 'my-numbers'>('all');
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showRevenue, setShowRevenue] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch campaign owner's profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!campaign?.user_id) return;

      setProfileLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, email, avatar_url, primary_color, theme, logo_url, social_media_links, payment_integrations_config')
          .eq('id', campaign.user_id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
        } else {
          setProfile(data);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [campaign?.user_id]);

  // Apply theme dynamically based on campaign owner's preference
  useEffect(() => {
    if (profile?.theme) {
      // Remove any existing theme classes
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('theme-claro', 'theme-escuro', 'theme-escuro-preto');

      // Apply the campaign owner's theme
      switch (profile.theme) {
        case 'claro':
          document.body.classList.add('theme-claro');
          break;
        case 'escuro':
          document.documentElement.classList.add('dark');
          document.body.classList.add('theme-escuro');
          break;
        case 'escuro-preto':
          document.documentElement.classList.add('dark');
          document.body.classList.add('theme-escuro-preto');
          break;
        default:
          document.body.classList.add('theme-claro');
      }
    }

    // Cleanup function to restore default theme when component unmounts
    return () => {
      document.body.classList.remove('theme-claro', 'theme-escuro', 'theme-escuro-preto');
      // Don't remove 'dark' class as it might be used by other parts of the app
    };
  }, [profile?.theme]);

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

  const currentTheme = profile?.theme || 'claro';
  const themeClasses = getThemeClasses(currentTheme);
  const primaryColor = profile?.primary_color || '#3B82F6';

  // Calculate promotion info
  const getPromotionInfo = (): PromotionInfo | null => {
    if (!campaign?.promotions || campaign.promotions.length === 0 || quantity <= 0) {
      return null;
    }

    const { total, appliedPromotions } = calculateTotalWithPromotions(
      quantity,
      campaign.ticket_price,
      campaign.promotions
    );

    if (appliedPromotions.length === 0) {
      return null;
    }

    const originalTotal = quantity * campaign.ticket_price;
    const savings = originalTotal - total;
    const discountPercentage = Math.round((savings / originalTotal) * 100);

    return {
      promotion: appliedPromotions[0],
      originalTotal,
      promotionalTotal: total,
      savings,
      discountPercentage
    };
  };

  const promotionInfo = getPromotionInfo();

  // Handle quota selection for manual mode
  const handleQuotaSelect = (quotaNumber: number) => {
    if (campaign?.campaign_model !== 'manual') return;

    setSelectedQuotas(prev => {
      const isSelected = prev.includes(quotaNumber);
      let newSelection;

      if (isSelected) {
        newSelection = prev.filter(q => q !== quotaNumber);
      } else {
        if (prev.length >= (campaign?.max_tickets_per_purchase || 1000)) {
          return prev; // Don't add if at maximum
        }
        newSelection = [...prev, quotaNumber];
      }

      // Update quantity for automatic mode calculations
      setQuantity(newSelection.length || 1);
      return newSelection;
    });
  };

  // Handle reservation
  const handleReserve = async (customerData?: CustomerData) => {
    if (!campaign || !user) {
      // For non-logged users, show reservation modal
      if (!customerData) {
        setShowReservationModal(true);
        return;
      }
    }

    try {
      let quotasToReserve: number[];
      
      if (campaign?.campaign_model === 'manual') {
        quotasToReserve = selectedQuotas;
      } else {
        // For automatic mode, select available quotas
        const availableQuotas = tickets
          .filter(ticket => ticket.status === 'disponível')
          .map(ticket => ticket.quota_number)
          .slice(0, quantity);
        quotasToReserve = availableQuotas;
      }

      if (quotasToReserve.length === 0) {
        alert('Nenhuma cota disponível para reserva');
        return;
      }

      // Calculate total with promotions
      const { total } = calculateTotalWithPromotions(
        quotasToReserve.length,
        campaign.ticket_price,
        campaign.promotions || []
      );

      if (user) {
        // User is logged in - reserve directly
        await reserveTickets(quotasToReserve);
        
        // Navigate to payment confirmation
        navigate('/payment-confirmation', {
          state: {
            reservationData: {
              reservationId: `RES-${Date.now()}`,
              customerName: user.user_metadata?.name || 'Usuário',
              customerEmail: user.email || '',
              customerPhone: customerData?.phoneNumber || '',
              quotaCount: quotasToReserve.length,
              totalValue: total,
              selectedQuotas: quotasToReserve,
              campaignTitle: campaign.title,
              campaignId: campaign.id,
              expiresAt: new Date(Date.now() + (campaign.reservation_timeout_minutes || 15) * 60 * 1000).toISOString()
            }
          }
        });
      } else if (customerData) {
        // Guest user with customer data - simulate reservation
        navigate('/payment-confirmation', {
          state: {
            reservationData: {
              reservationId: `RES-${Date.now()}`,
              customerName: customerData.name,
              customerEmail: customerData.email,
              customerPhone: `${customerData.countryCode} ${customerData.phoneNumber}`,
              quotaCount: quotasToReserve.length,
              totalValue: total,
              selectedQuotas: quotasToReserve,
              campaignTitle: campaign.title,
              campaignId: campaign.id,
              expiresAt: new Date(Date.now() + (campaign.reservation_timeout_minutes || 15) * 60 * 1000).toISOString()
            }
          }
        });
      }

      setShowReservationModal(false);
    } catch (error) {
      console.error('Error reserving tickets:', error);
      alert('Erro ao reservar cotas. Tente novamente.');
    }
  };

  // Handle share
  const handleShare = async (platform: string) => {
    const url = window.location.href;
    const text = `Participe da ${campaign?.title}! ${url}`;

    if (copied) return;

    try {
      switch (platform) {
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
          break;
        case 'telegram':
          window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(campaign?.title || '')}`, '_blank');
          break;
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
          break;
        case 'x':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
          break;
        case 'copy':
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          break;
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Handle image navigation
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
  const calculateProgressPercentage = (soldTickets: number, totalTickets: number): number => {
    if (totalTickets === 0) return 0;
    return Math.round((soldTickets / totalTickets) * 100);
  };

  // Get available social media links
  const getAvailableSocialLinks = () => {
    if (!profile?.social_media_links) return [];
    
    return Object.entries(profile.social_media_links)
      .filter(([key, url]) => url && url.trim() !== '')
      .map(([key, url]) => ({
        key,
        url: url as string,
        config: socialMediaConfig[key as keyof typeof socialMediaConfig]
      }))
      .filter(item => item.config);
  };

  // Get configured payment methods
  const getConfiguredPaymentMethods = () => {
    if (!profile?.payment_integrations_config) return [];
    
    const methods = [];
    const config = profile.payment_integrations_config;
    
    if (config.fluxsis?.api_key) methods.push({ name: 'Fluxsis', logo: '/fluxsis22.png' });
    if (config.pay2m?.api_key) methods.push({ name: 'Pay2m', logo: '/pay2m2.png' });
    if (config.paggue?.api_key) methods.push({ name: 'Paggue', logo: '/paggue2.png' });
    if (config.efi_bank?.client_id) methods.push({ name: 'Efi Bank', logo: '/efi2.png' });
    
    return methods;
  };

  if (campaignLoading || profileLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${themeClasses.background}`}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (campaignError || !campaign) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${themeClasses.background}`}>
        <div className={`text-center p-8 rounded-lg ${themeClasses.cardBg} ${themeClasses.border} border`}>
          <AlertTriangle className={`h-16 w-16 mx-auto mb-4 ${themeClasses.textSecondary}`} />
          <h2 className={`text-2xl font-bold mb-2 ${themeClasses.text}`}>
            Campanha não encontrada
          </h2>
          <p className={`mb-6 ${themeClasses.textSecondary}`}>
            A campanha que você está procurando não existe ou foi removida.
          </p>
          <button
            onClick={() => navigate('/')}
            className="text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
            style={{ backgroundColor: primaryColor }}
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  if (campaign.status !== 'active') {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${themeClasses.background}`}>
        <div className={`text-center p-8 rounded-lg ${themeClasses.cardBg} ${themeClasses.border} border`}>
          <Clock className={`h-16 w-16 mx-auto mb-4 ${themeClasses.textSecondary}`} />
          <h2 className={`text-2xl font-bold mb-2 ${themeClasses.text}`}>
            Campanha não disponível
          </h2>
          <p className={`mb-6 ${themeClasses.textSecondary}`}>
            Esta campanha ainda não foi publicada ou já foi finalizada.
          </p>
          <button
            onClick={() => navigate('/')}
            className="text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
            style={{ backgroundColor: primaryColor }}
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  const prizeImages = campaign.prize_image_urls && campaign.prize_image_urls.length > 0 
    ? campaign.prize_image_urls 
    : ['https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'];

  const currentImage = prizeImages[currentImageIndex];
  const progressPercentage = calculateProgressPercentage(campaign.sold_tickets, campaign.total_tickets);
  const availableSocialLinks = getAvailableSocialLinks();
  const configuredPaymentMethods = getConfiguredPaymentMethods();

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
              {profile?.logo_url ? (
                <img 
                  src={profile.logo_url} 
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
                  <span className={`text-xl font-bold ${themeClasses.text}`}>Rifaqui</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Campaign Info */}
          <div className="space-y-6">
            {/* Campaign Image */}
            <div className="relative group">
              <img
                src={currentImage}
                alt={campaign.title}
                className="w-full h-80 object-cover rounded-2xl shadow-lg"
              />
              
              {/* Navigation Arrows (only show if multiple images) */}
              {prizeImages.length > 1 && (
                <>
                  <button
                    onClick={handlePreviousImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-75"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-75"
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

            {/* Campaign Title and Description */}
            <div className={`rounded-2xl p-6 ${themeClasses.cardBg} ${themeClasses.border} border`}>
              <h1 className={`text-3xl font-bold mb-4 ${themeClasses.text}`}>
                {campaign.title}
              </h1>
              
              {campaign.description && (
                <div 
                  className={`prose prose-sm max-w-none ${themeClasses.text}`}
                  dangerouslySetInnerHTML={{ __html: campaign.description }}
                />
              )}
            </div>

            {/* Organizer Info */}
            <div className={`rounded-2xl p-6 ${themeClasses.cardBg} ${themeClasses.border} border`}>
              <div className="flex items-center space-x-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  {profile?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <div className={`text-sm ${themeClasses.textSecondary}`}>
                    Organizado por:
                  </div>
                  <div className={`font-semibold ${themeClasses.text}`}>
                    {profile?.name || 'Organizador'}
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign Progress */}
            <div className={`rounded-2xl p-6 ${themeClasses.cardBg} ${themeClasses.border} border`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${themeClasses.text}`}>
                  Progresso da campanha
                </h3>
                <button
                  onClick={() => setShowRevenue(!showRevenue)}
                  className={`p-2 rounded-lg transition-colors duration-200 ${themeClasses.textSecondary} hover:opacity-80`}
                >
                  {showRevenue ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className={themeClasses.textSecondary}>Cotas vendidas</span>
                  <span className={`font-semibold ${themeClasses.text}`}>
                    {campaign.sold_tickets}/{campaign.total_tickets}
                  </span>
                </div>
                
                <div className={`rounded-full h-3 ${themeClasses.background}`}>
                  <div 
                    className="h-3 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${progressPercentage}%`,
                      backgroundColor: primaryColor 
                    }}
                  ></div>
                </div>
                
                {campaign.show_percentage && (
                  <div className="text-center">
                    <span className={`text-2xl font-bold ${themeClasses.text}`}>
                      {progressPercentage}%
                    </span>
                    <span className={`text-sm ${themeClasses.textSecondary} ml-2`}>
                      vendido
                    </span>
                  </div>
                )}

                {showRevenue && (
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className={themeClasses.textSecondary}>Arrecadado</span>
                    <span className={`font-bold text-lg text-green-600 dark:text-green-400`}>
                      {formatCurrency(campaign.ticket_price * campaign.sold_tickets)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Draw Date */}
            {campaign.show_draw_date && campaign.draw_date && (
              <div className={`rounded-2xl p-6 ${themeClasses.cardBg} ${themeClasses.border} border`}>
                <div className="flex items-center space-x-3">
                  <Calendar className={`h-6 w-6 ${themeClasses.textSecondary}`} />
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
              <div className={`rounded-2xl p-6 ${themeClasses.cardBg} ${themeClasses.border} border`}>
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
                      <span className={themeClasses.text}>{prize.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Methods */}
            {configuredPaymentMethods.length > 0 && (
              <div className={`rounded-2xl p-6 ${themeClasses.cardBg} ${themeClasses.border} border`}>
                <h3 className={`text-lg font-semibold mb-4 ${themeClasses.text}`}>
                  Métodos de Pagamento
                </h3>
                <div className="flex flex-wrap gap-3">
                  {configuredPaymentMethods.map((method, index) => (
                    <div key={index} className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
                      <img 
                        src={method.logo} 
                        alt={method.name} 
                        className="w-6 h-6 object-contain"
                      />
                      <span className={`text-sm font-medium ${themeClasses.text}`}>
                        {method.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Social Media Links */}
            {availableSocialLinks.length > 0 && (
              <div className={`rounded-2xl p-6 ${themeClasses.cardBg} ${themeClasses.border} border`}>
                <h3 className={`text-lg font-semibold mb-4 ${themeClasses.text}`}>
                  Siga-nos
                </h3>
                <div className="flex flex-wrap gap-3">
                  {availableSocialLinks.map(({ key, url, config }) => {
                    const IconComponent = config.icon;
                    return (
                      <a
                        key={key}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 text-white hover:opacity-80"
                        style={{ backgroundColor: config.color }}
                      >
                        <IconComponent size={16} />
                        <span className="text-sm font-medium">{config.name}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Participation */}
          <div className="space-y-6">
            {/* Quota Selector (Automatic Mode) */}
            {campaign.campaign_model === 'automatic' && (
              <QuotaSelector
                ticketPrice={campaign.ticket_price}
                minTicketsPerPurchase={campaign.min_tickets_per_purchase}
                maxTicketsPerPurchase={campaign.max_tickets_per_purchase}
                onQuantityChange={setQuantity}
                initialQuantity={quantity}
                mode={campaign.campaign_model}
                promotionInfo={promotionInfo}
                promotions={campaign.promotions}
                primaryColor={primaryColor}
                campaignTheme={currentTheme}
                onReserve={() => handleReserve()}
                reserving={reserving}
              />
            )}

            {/* Quota Grid */}
            <div className={`rounded-2xl p-6 ${themeClasses.cardBg} ${themeClasses.border} border`}>
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

              {/* Manual Mode Reserve Button */}
              {campaign.campaign_model === 'manual' && selectedQuotas.length > 0 && (
                <div className="mt-6">
                  <div className={`text-center mb-4 ${themeClasses.textSecondary}`}>
                    {selectedQuotas.length} {selectedQuotas.length === 1 ? 'cota selecionada' : 'cotas selecionadas'}
                  </div>
                  <button
                    onClick={() => handleReserve()}
                    disabled={reserving}
                    className="w-full text-white py-3 rounded-lg font-bold text-lg transition-colors duration-200 disabled:opacity-50"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {reserving ? 'RESERVANDO...' : `RESERVAR - ${formatCurrency(calculateTotalWithPromotions(selectedQuotas.length, campaign.ticket_price, campaign.promotions || []).total)}`}
                  </button>
                </div>
              )}
            </div>

            {/* Share Section */}
            <div className={`rounded-2xl p-6 ${themeClasses.cardBg} ${themeClasses.border} border`}>
              <h3 className={`text-lg font-semibold mb-4 ${themeClasses.text}`}>
                Compartilhar
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(shareSectionConfig).map(([key, config]) => {
                  const IconComponent = config.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => handleShare(key)}
                      className="flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-colors duration-200 text-white hover:opacity-80"
                      style={{ backgroundColor: config.color }}
                    >
                      <IconComponent size={16} />
                      <span className="text-sm font-medium">{config.name}</span>
                    </button>
                  );
                })}
                
                {/* Copy Link Button */}
                <button
                  onClick={() => handleShare('copy')}
                  className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-colors duration-200 border ${themeClasses.border} ${themeClasses.text} hover:opacity-80`}
                >
                  <Copy className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {copied ? 'Copiado!' : 'Copiar Link'}
                  </span>
                </button>
              </div>
            </div>

            {/* Campaign Stats */}
            <div className={`rounded-2xl p-6 ${themeClasses.cardBg} ${themeClasses.border} border`}>
              <h3 className={`text-lg font-semibold mb-4 ${themeClasses.text}`}>
                Informações
              </h3>
              <div className="grid grid-cols-2 gap-4">
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
                    {campaign.total_tickets - campaign.sold_tickets}
                  </div>
                  <div className={`text-sm ${themeClasses.textSecondary}`}>
                    Disponíveis
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reservation Modal */}
      <ReservationModal
        isOpen={showReservationModal}
        onClose={() => setShowReservationModal(false)}
        onReserve={handleReserve}
        quotaCount={campaign.campaign_model === 'manual' ? selectedQuotas.length : quantity}
        totalValue={calculateTotalWithPromotions(
          campaign.campaign_model === 'manual' ? selectedQuotas.length : quantity,
          campaign.ticket_price,
          campaign.promotions || []
        ).total}
        selectedQuotas={campaign.campaign_model === 'manual' ? selectedQuotas : undefined}
        campaignTitle={campaign.title}
        primaryColor={primaryColor}
        campaignTheme={currentTheme}
        reserving={reserving}
        reservationTimeoutMinutes={campaign.reservation_timeout_minutes}
      />

      {/* Footer */}
      <footer className={`border-t py-8 mt-12 transition-colors duration-300 ${themeClasses.cardBg} ${themeClasses.border}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-sm">
            <a href="#" className={`transition-colors duration-200 ${themeClasses.textSecondary} hover:opacity-80`}>
              Termos de Uso
            </a>
            <span className={`hidden sm:block ${themeClasses.textSecondary}`}>•</span>
            <a href="#" className={`transition-colors duration-200 ${themeClasses.textSecondary} hover:opacity-80`}>
              Política de Privacidade
            </a>
            <span className={`hidden sm:block ${themeClasses.textSecondary}`}>•</span>
            <span className={themeClasses.textSecondary}>
              Sistema desenvolvido por Rifaqui
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CampaignPage;