// src/pages/CampaignPage.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Share2,
  Calendar,
  Users,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertTriangle
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
  name?: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  logo_url?: string;
  social_media_links?: Record<string, string | null>;
  payment_integrations_config?: any;
  primary_color?: string;
  theme?: string;
}

const CampaignPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();

  // determine if custom domain (same logic as in your app)
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
    typeof window !== 'undefined' && (window.location.hostname === host || window.location.hostname.includes(host))
  );
  const isCustomDomain = !isDevelopmentHost && slug;

  // Campaign loading (choose hook by slug vs domain)
  const { campaign: campaignBySlug, loading: loadingBySlug, error: errorBySlug } = useCampaignBySlug(slug || '');
  const { campaign: campaignByDomain, loading: loadingByDomain, error: errorByDomain } = useCampaignByCustomDomain(
    isCustomDomain ? (typeof window !== 'undefined' ? window.location.hostname : '') : ''
  );
  const campaign = isCustomDomain ? campaignByDomain : campaignBySlug;
  const loadingCampaign = isCustomDomain ? loadingByDomain : loadingBySlug;
  const errorCampaign = isCustomDomain ? errorByDomain : errorBySlug;

  // Organizer profile state (Bolt: always fetch by campaign.user_id)
  const [organizerProfile, setOrganizerProfile] = useState<OrganizerProfile | null>(null);
  const [loadingOrganizer, setLoadingOrganizer] = useState(false);

  // Tickets hook
  const {
    tickets,
    loading: ticketsLoading,
    error: ticketsError,
    reserveTickets,
    getAvailableTickets,
    reserving
  } = useTickets(campaign?.id || '');

  // UI state
  const [selectedQuotas, setSelectedQuotas] = useState<number[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeFilter, setActiveFilter] = useState<'all' | 'available' | 'reserved' | 'purchased' | 'my-numbers'>('all');
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [reservationCustomerData, setReservationCustomerData] = useState<CustomerData | null>(null);
  const [reservationQuotas, setReservationQuotas] = useState<number[]>([]);
  const [reservationTotalValue, setReservationTotalValue] = useState<number>(0);

  // Gallery & fullscreen
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState<number | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  // --- Fetch organizer profile using campaign.user_id (Bolt plan) ---
  useEffect(() => {
    if (!campaign?.user_id) return;

    const loadOrganizerProfile = async () => {
      setLoadingOrganizer(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, full_name, email, avatar_url, logo_url, social_media_links, payment_integrations_config, primary_color, theme')
          .eq('id', campaign.user_id)
          .maybeSingle();

        if (error) {
          console.error('Error loading organizer profile:', error);
          setOrganizerProfile(null);
        } else {
          setOrganizerProfile(data as OrganizerProfile | null);
        }
      } catch (err) {
        console.error('Error loading organizer profile:', err);
        setOrganizerProfile(null);
      } finally {
        setLoadingOrganizer(false);
      }
    };

    loadOrganizerProfile();
  }, [campaign?.user_id]);

  // --- Apply theme & primary color to document --- 
  useEffect(() => {
    const campaignTheme = organizerProfile?.theme || 'claro';
    try {
      document.documentElement.setAttribute('data-theme', campaignTheme);
      if (campaignTheme === 'escuro' || campaignTheme === 'escuro-preto') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      if (campaignTheme === 'escuro-preto') {
        document.documentElement.classList.add('dark-black');
      } else {
        document.documentElement.classList.remove('dark-black');
      }
    } catch (err) {
      // SSR or tests may not have document — ignore
    }
  }, [organizerProfile?.theme]);

  useEffect(() => {
    const color = organizerProfile?.primary_color || '#3B82F6';
    try {
      document.documentElement.style.setProperty('--primary-color', color);
    } catch (err) {
      // ignore in non-browser environment
    }
  }, [organizerProfile?.primary_color]);

  // --- Utility functions & UI handlers ---

  const isCampaignAvailable = (cmp: any) => {
    if (!cmp) return false;
    if (cmp.status !== 'active') return false;
    if (cmp.end_date) {
      const end = new Date(cmp.end_date);
      if (new Date() > end) return false;
    }
    return cmp.is_paid !== false; // follow your earlier logic
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

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getProgressPercentage = () => {
    if (!campaign) return 0;
    const total = campaign.total_tickets || 1;
    return Math.round((campaign.sold_tickets / total) * 100);
  };

  const getBestPromotionForDisplay = useCallback((quotaCount: number): PromotionInfo | null => {
    if (!campaign?.promotions || !Array.isArray(campaign.promotions) || campaign.promotions.length === 0) {
      return null;
    }
    const applicable = campaign.promotions.filter((p: Promotion) => p.ticketQuantity <= quotaCount);
    if (applicable.length === 0) return null;
    const best = applicable.reduce((a: Promotion, b: Promotion) => (b.ticketQuantity > a.ticketQuantity ? b : a));
    const originalTotal = quotaCount * campaign.ticket_price;
    const { total: promotionalTotal } = calculateTotalWithPromotions(quotaCount, campaign.ticket_price, campaign.promotions);
    const savings = originalTotal - promotionalTotal;
    const discountPercentage = Math.round((savings / (originalTotal || 1)) * 100);
    return { promotion: best, originalTotal, promotionalTotal, savings, discountPercentage };
  }, [campaign?.promotions, campaign?.ticket_price]);

  const handleQuotaSelect = useCallback((quotaNumber: number) => {
    if (!campaign || campaign.campaign_model !== 'manual') return;
    const available = getAvailableTickets();
    const isAvailable = available.some((t: any) => t.quota_number === quotaNumber);
    if (!isAvailable) return;
    setSelectedQuotas(prev => prev.includes(quotaNumber) ? prev.filter(q => q !== quotaNumber) : [...prev, quotaNumber].slice(0, campaign.max_tickets_per_purchase || 1000));
  }, [campaign, getAvailableTickets]);

  const handleQuantityChange = useCallback((newQuantity: number) => setQuantity(newQuantity), []);

  const getCurrentTotalValue = () => {
    const currentQuantity = campaign?.campaign_model === 'manual' ? selectedQuotas.length : quantity;
    if (!campaign) return 0;
    const { total } = calculateTotalWithPromotions(currentQuantity, campaign.ticket_price, campaign.promotions || []);
    return total;
  };

  const handleReservationSubmit = useCallback(async (customerData: CustomerData) => {
    if (!campaign || !user) {
      alert('Você precisa estar logado para reservar cotas');
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
        const availableQuotaNumbers = availableTickets.map((t: any) => t.quota_number);
        if (availableQuotaNumbers.length < quantity) {
          alert(`Apenas ${availableQuotaNumbers.length} cotas disponíveis`);
          return;
        }
        const shuffled = [...availableQuotaNumbers].sort(() => 0.5 - Math.random());
        quotasToReserve = shuffled.slice(0, quantity);
      }

      const result = await reserveTickets(quotasToReserve);
      if (result) {
        const { total: totalValue } = calculateTotalWithPromotions(quotasToReserve.length, campaign.ticket_price, campaign.promotions || []);
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
              totalValue,
              selectedQuotas: quotasToReserve,
              campaignTitle: campaign.title,
              campaignId: campaign.id,
              expiresAt: new Date(Date.now() + (campaign.reservation_timeout_minutes || 15) * 60 * 1000).toISOString()
            }
          }
        });
      }
    } catch (err) {
      console.error('Error during reservation:', err);
      alert('Erro ao reservar cotas. Tente novamente.');
    } finally {
      setShowReservationModal(false);
    }
  }, [campaign, user, selectedQuotas, quantity, getAvailableTickets, reserveTickets, navigate]);

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

  // Gallery handlers
  const handlePreviousImage = () => {
    if (!campaign?.prize_image_urls) return;
    setCurrentImageIndex(prev => prev === 0 ? campaign.prize_image_urls.length - 1 : prev - 1);
  };
  const handleNextImage = () => {
    if (!campaign?.prize_image_urls) return;
    setCurrentImageIndex(prev => prev === campaign.prize_image_urls.length - 1 ? 0 : prev + 1);
  };
  const handleImageClick = (idx: number) => setFullscreenImageIndex(idx);
  const handleCloseFullscreen = () => { setFullscreenImageIndex(null); setTouchStartX(null); setTouchEndX(null); };

  const goToPreviousFullscreenImage = () => {
    if (fullscreenImageIndex === null || !campaign?.prize_image_urls) return;
    const total = campaign.prize_image_urls.length;
    setFullscreenImageIndex(prev => prev === 0 ? total - 1 : (prev || 0) - 1);
  };
  const goToNextFullscreenImage = () => {
    if (fullscreenImageIndex === null || !campaign?.prize_image_urls) return;
    const total = campaign.prize_image_urls.length;
    setFullscreenImageIndex(prev => prev === total - 1 ? 0 : (prev || 0) + 1);
  };

  useEffect(() => {
    if (fullscreenImageIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPreviousFullscreenImage();
      else if (e.key === 'ArrowRight') goToNextFullscreenImage();
      else if (e.key === 'Escape') handleCloseFullscreen();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [fullscreenImageIndex, goToNextFullscreenImage, goToPreviousFullscreenImage]);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStartX(e.targetTouches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => setTouchEndX(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    if (distance > 50) goToNextFullscreenImage();
    else if (distance < -50) goToPreviousFullscreenImage();
    setTouchStartX(null);
    setTouchEndX(null);
  };

  // social media & payments rendering helpers
  const renderSocialMediaLinks = () => {
    if (!organizerProfile?.social_media_links) return null;
    const links = Object.entries(organizerProfile.social_media_links).filter(([_, url]) => url);
    if (links.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 justify-center">
        {links.map(([platform, url]) => {
          const cfg = socialMediaConfig[platform as keyof typeof socialMediaConfig];
          if (!cfg || !url) return null;
          const Icon = cfg.icon;
          return (
            <a key={platform} href={url} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: cfg.color }}>
              <Icon size={16} />
            </a>
          );
        })}
      </div>
    );
  };

  const renderPaymentMethods = () => {
    const cfg = organizerProfile?.payment_integrations_config;
    if (!cfg) return null;
    const methods: { name: string; icon?: string; color?: string }[] = [];
    if (cfg.mercado_pago?.client_id || cfg.mercado_pago?.access_token) methods.push({ name: 'Mercado Pago', icon: '💳', color: '#00B1EA' });
    if (cfg.fluxsis?.api_key) methods.push({ name: 'Fluxsis', icon: '💰', color: '#6366F1' });
    if (cfg.pay2m?.api_key) methods.push({ name: 'Pay2m', icon: '💸', color: '#10B981' });
    if (cfg.paggue?.api_key) methods.push({ name: 'Paggue', icon: '💵', color: '#F59E0B' });
    if (cfg.efi_bank?.client_id) methods.push({ name: 'Efi Bank', icon: '🏦', color: '#EF4444' });
    // always show PIX
    methods.push({ name: 'PIX', icon: '₽', color: '#00BC63' });

    if (methods.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 justify-center">
        {methods.map(m => (
          <div key={m.name} className="flex items-center gap-2 px-3 py-1 border rounded">
            <div className="w-6 h-6 flex items-center justify-center text-white text-xs" style={{ backgroundColor: m.color }}>{m.icon}</div>
            <div className="text-sm">{m.name}</div>
          </div>
        ))}
      </div>
    );
  };

  const generateShareUrl = () => `${typeof window !== 'undefined' ? window.location.origin : ''}/c/${campaign?.slug || slug}`;

  const handleShare = (platform: string) => {
    const shareUrl = generateShareUrl();
    const shareText = `Participe da ${campaign?.title}! Cotas por ${formatCurrency(campaign?.ticket_price || 0)}`;
    let url = '';
    switch (platform) {
      case 'whatsapp': url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`; break;
      case 'facebook': url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`; break;
      case 'telegram': url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`; break;
      case 'x': url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`; break;
      default: return;
    }
    window.open(url, '_blank', 'width=600,height=400');
  };

  // combined loading state
  if (loadingCampaign || ticketsLoading || loadingOrganizer) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-indigo-600" />
      </div>
    );
  }

  if (errorCampaign || !campaign) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-3">Campanha não encontrada</h1>
          <p className="text-gray-600 mb-6">A campanha que você procura não existe ou foi removida.</p>
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-indigo-600 text-white rounded">Voltar ao início</button>
        </div>
      </div>
    );
  }

  const campaignTheme = organizerProfile?.theme || 'claro';
  const primaryColor = organizerProfile?.primary_color || '#3B82F6';
  const themeClasses = getThemeClasses(campaignTheme);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeClasses.background}`}>
      {/* Header */}
      <header className={`shadow-sm border-b ${themeClasses.border} ${themeClasses.cardBg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              {organizerProfile?.logo_url ? (
                <img src={organizerProfile.logo_url} alt={organizerProfile.name || 'Organizador'} className="w-14 h-14 object-contain rounded-md" style={{ border: `2px solid ${primaryColor}`, padding: 4, background: '#fff' }} />
              ) : (
                <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">R</div>
              )}
              <div>
                <span className={`text-lg font-bold ${themeClasses.text}`}>Rifaqui</span>
                <div className="text-xs" style={{ color: (themeClasses.textSecondary as string) }}>{organizerProfile?.name || ''}</div>
              </div>
            </div>

            <button onClick={() => navigate('/my-tickets')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Ver Minhas Cotas</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className={`text-2xl md:text-3xl font-bold ${themeClasses.text} mb-4 text-center`}>{campaign.title}</h1>

        {/* Gallery */}
        <section className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} overflow-hidden mb-6 max-w-3xl mx-auto`}>
          <div className="relative group w-full">
            <img
              src={campaign.prize_image_urls?.[currentImageIndex] || 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg'}
              alt={campaign.title}
              className="w-full h-[320px] sm:h-[520px] object-cover rounded-t-xl"
              onClick={() => handleImageClick(currentImageIndex)}
              style={{ cursor: 'pointer' }}
            />

            {campaign.prize_image_urls && campaign.prize_image_urls.length > 1 && (
              <>
                <button onClick={handlePreviousImage} className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full opacity-0 group-hover:opacity-100">
                  <ChevronLeft />
                </button>
                <button onClick={handleNextImage} className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full opacity-0 group-hover:opacity-100">
                  <ChevronRight />
                </button>
              </>
            )}

            <div className="absolute top-3 left-3 bg-white bg-opacity-90 px-3 py-1 rounded-full shadow" >
              <div className="text-xs">Participe por</div>
              <div className="font-bold" style={{ color: primaryColor }}>{formatCurrency(campaign.ticket_price)}</div>
            </div>
          </div>

          {campaign.prize_image_urls && campaign.prize_image_urls.length > 1 && (
            <div className="p-3 bg-gray-50">
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {campaign.prize_image_urls.map((img: string, i: number) => (
                  <button key={i} onClick={() => setCurrentImageIndex(i)} className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${i === currentImageIndex ? 'border-indigo-500' : 'border-gray-300'}`}>
                    <img src={img} alt={`thumb ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Organizer */}
        <section className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-4 mb-6 max-w-3xl mx-auto text-center`}>
          <h3 className={`text-xl font-bold ${themeClasses.text} mb-3`}>Organizador</h3>
          <div className="flex items-center justify-center gap-4 mb-3">
            {organizerProfile?.logo_url ? (
              <img src={organizerProfile.logo_url} alt={organizerProfile.name} className="w-16 h-16 rounded-md object-contain" style={{ border: `2px solid ${primaryColor}`, padding: 4, background: '#fff' }} />
            ) : organizerProfile?.avatar_url ? (
              <img src={organizerProfile.avatar_url} alt={organizerProfile.name} className="w-16 h-16 rounded-full object-cover" style={{ border: `2px solid ${primaryColor}` }} />
            ) : (
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: primaryColor }}>{(organizerProfile?.name || 'O').charAt(0).toUpperCase()}</div>
            )}
          </div>
          <div className={`${themeClasses.text} font-semibold`}>{organizerProfile?.name}</div>
          <div className={`text-sm ${themeClasses.textSecondary} mt-2`}>Organizador da campanha</div>

          <div className="mt-4">
            {renderSocialMediaLinks()}
          </div>
        </section>

        {/* Promotions (if any) */}
        {campaign.promotions && campaign.promotions.length > 0 && (
          <section className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-4 mb-6 max-w-3xl mx-auto`}>
            <h3 className={`text-base font-bold ${themeClasses.text} mb-3 text-center`}>🎁 Promoções</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {campaign.promotions.map((promo: Promotion) => {
                const originalValue = promo.ticketQuantity * campaign.ticket_price;
                const discountPercentage = Math.round((promo.fixedDiscountAmount / (originalValue || 1)) * 100);
                return (
                  <div key={promo.id} className="p-3 rounded-lg border">
                    <div className="text-center">
                      <div className={`font-semibold ${themeClasses.text}`}>{promo.ticketQuantity} cotas</div>
                      <div className="text-sm text-green-600">{discountPercentage}% OFF</div>
                      <div className="line-through text-xs text-gray-500">{formatCurrency(originalValue)}</div>
                      <div className="font-bold text-green-600">{formatCurrency(promo.discountedTotalValue)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Purchase / Quotas */}
        <section className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-4 mb-6 max-w-3xl mx-auto`}>
          <h2 className={`text-xl font-bold ${themeClasses.text} mb-4 text-center`}>
            {campaign.campaign_model === 'manual' ? 'Selecione suas Cotas' : 'Escolha a Quantidade'}
          </h2>

          {campaign.campaign_model === 'manual' ? (
            <>
              <QuotaGrid
                totalQuotas={campaign.total_tickets}
                selectedQuotas={selectedQuotas}
                onQuotaSelect={isCampaignAvailable(campaign) ? handleQuotaSelect : undefined}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                mode="manual"
                tickets={tickets}
                currentUserId={user?.id}
                campaignTheme={campaignTheme}
                primaryColor={primaryColor}
              />

              {selectedQuotas.length > 0 && (
                <div className="mt-4">
                  <div className="mb-3 text-sm text-gray-600">Números selecionados:</div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedQuotas.sort((a,b)=>a-b).map(q => (
                      <span key={q} className="px-3 py-1 rounded text-white text-sm" style={{ backgroundColor: primaryColor }}>{String(q).padStart(3,'0')}</span>
                    ))}
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <div className="text-sm">{selectedQuotas.length} {selectedQuotas.length === 1 ? 'cota' : 'cotas'}</div>
                    <div className="text-xl font-bold" style={{ color: primaryColor }}>{formatCurrency(getCurrentTotalValue())}</div>
                  </div>

                  <button onClick={handleOpenReservationModal} disabled={!isCampaignAvailable(campaign)} className="w-full py-3 rounded-lg text-white" style={{ backgroundColor: primaryColor }}>
                    {isCampaignAvailable(campaign) ? 'Reservar Cotas Selecionadas' : 'Campanha Indisponível'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <QuotaSelector
              ticketPrice={campaign.ticket_price}
              minTicketsPerPurchase={campaign.min_tickets_per_purchase || 1}
              maxTicketsPerPurchase={campaign.max_tickets_per_purchase || 1000}
              onQuantityChange={handleQuantityChange}
              initialQuantity={Math.max(1, campaign.min_tickets_per_purchase || 1)}
              mode="automatic"
              promotionInfo={getBestPromotionForDisplay(quantity)}
              promotions={campaign.promotions || []}
              primaryColor={primaryColor}
              campaignTheme={campaignTheme}
              onReserve={isCampaignAvailable(campaign) ? handleOpenReservationModal : undefined}
              reserving={reserving}
              disabled={!isCampaignAvailable(campaign)}
            />
          )}
        </section>

        {/* Description / Progress */}
        <section className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-4 mb-6 max-w-3xl mx-auto`}>
          <h3 className={`text-lg font-bold ${themeClasses.text} mb-3 text-center`}>Descrição / Regulamento</h3>
          {campaign.description ? (
            <div className={`${themeClasses.textSecondary} prose max-w-none`} dangerouslySetInnerHTML={{ __html: campaign.description }} />
          ) : <div className={`${themeClasses.textSecondary} italic text-center`}>Nenhuma descrição fornecida.</div>}

          {campaign.show_percentage && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm">Progresso</div>
                <div className="text-sm font-semibold">{getProgressPercentage()}%</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="h-3 rounded-full" style={{ width: `${getProgressPercentage()}%`, backgroundColor: primaryColor }} />
              </div>
            </div>
          )}
        </section>

        {/* Payment Methods & Draw Method */}
        <section className="mb-8 max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-4`}>
              <h3 className={`text-base font-bold ${themeClasses.text} mb-3 text-center`}>Métodos de Pagamento</h3>
              {renderPaymentMethods()}
            </div>
            <div className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-4`}>
              <h3 className={`text-base font-bold ${themeClasses.text} mb-3 text-center`}>Método de Sorteio</h3>
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: primaryColor }}>
                  <Trophy />
                </div>
                <div className="text-center">
                  <div className={`font-semibold ${themeClasses.text}`}>{campaign.draw_method}</div>
                  <div className={`text-xs ${themeClasses.textSecondary}`}>Sorteio transparente e confiável</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Share */}
        <section className={`${themeClasses.cardBg} rounded-xl shadow-md border ${themeClasses.border} p-4 max-w-3xl mx-auto mb-8`}>
          <h3 className={`text-lg font-bold ${themeClasses.text} mb-4 text-center`}>Compartilhar Campanha</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(shareSectionConfig).map(([platform, cfg]: any) => {
              const Icon = cfg.icon;
              return (
                <button key={platform} onClick={() => handleShare(platform)} className="flex flex-col items-center p-3 rounded border">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: cfg.color }}>
                    <Icon size={18} />
                  </div>
                  <div className={`text-xs mt-2 ${themeClasses.text}`}>{cfg.name}</div>
                </button>
              );
            })}
          </div>
        </section>
      </main>

      {/* Fullscreen modal */}
      {fullscreenImageIndex !== null && campaign?.prize_image_urls && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4" onClick={handleCloseFullscreen}>
          <div className="relative" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onClick={(e) => e.stopPropagation()}>
            <img src={campaign.prize_image_urls[fullscreenImageIndex]} alt={`img ${fullscreenImageIndex + 1}`} className="max-w-full max-h-[90vh] object-contain" />
            {campaign.prize_image_urls.length > 1 && (
              <>
                <button onClick={goToPreviousFullscreenImage} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black bg-opacity-50 rounded-full text-white"><ChevronLeft /></button>
                <button onClick={goToNextFullscreenImage} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black bg-opacity-50 rounded-full text-white"><ChevronRight /></button>
              </>
            )}
            <button onClick={handleCloseFullscreen} className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 rounded-full text-white">✕</button>
          </div>
        </div>
      )}

      {/* Reservation modal */}
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

      {/* Footer (pass social links) */}
      <footer className="mt-12">
        {/* If you already have a Footer component that accepts socialMediaLinks prop, pass it */}
        {/* <Footer socialMediaLinks={organizerProfile?.social_media_links} /> */}
        {/* If not, simple fallback: render small block */}
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          {organizerProfile?.social_media_links ? renderSocialMediaLinks() : <div>© {new Date().getFullYear()} Rifaqui</div>}
        </div>
      </footer>
    </div>
  );
};

export default CampaignPage;
