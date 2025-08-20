import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Share2, Calendar, Clock, CreditCard, Trophy } from 'lucide-react';
import { useCampaignBySlug } from '../hooks/useCampaigns';
import { useTickets } from '../hooks/useTickets';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';
import QuotaSelector from '../components/QuotaSelector';
import QuotaGrid from '../components/QuotaGrid';
import ReservationModal, { CustomerData } from '../components/ReservationModal';
import { Promotion } from '../types/promotion';
import { shareSectionConfig } from '../components/SocialMediaIcons';
import { supabase } from '../lib/supabase';

const CampaignPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { campaign, loading: campaignLoading, error: campaignError } = useCampaignBySlug(slug || '');

  const {
    tickets,
    loading: ticketsLoading,
    reserveTickets,
  } = useTickets(campaign?.id || '');

  const [selectedQuotas, setSelectedQuotas] = useState<number[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'available' | 'reserved' | 'purchased' | 'my-numbers'>('all');
  const [profilePrimaryColor, setProfilePrimaryColor] = useState<string | null>(null);
  const [profileTheme, setProfileTheme] = useState<string | null>(null);

  // Fetch campaign owner's profile data for theme and primary color
  useEffect(() => {
    const fetchCampaignOwnerProfile = async () => {
      if (campaign?.user_id) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('primary_color, theme')
          .eq('id', campaign.user_id)
          .single();

        if (profileError) {
          console.error('Error fetching campaign owner profile:', profileError);
        } else if (profileData) {
          setProfilePrimaryColor(profileData.primary_color);
          setProfileTheme(profileData.theme);
        }
      }
    };

    fetchCampaignOwnerProfile();
  }, [campaign?.user_id]);

  // Update quantity for automatic mode when campaign loads
  useEffect(() => {
    if (campaign && campaign.campaign_model === 'automatic') {
      setQuantity(campaign.min_tickets_per_purchase || 1);
    }
  }, [campaign]);

  const handleQuotaSelect = useCallback((quotaNumber: number) => {
    setSelectedQuotas(prev => {
      if (prev.includes(quotaNumber)) {
        return prev.filter(q => q !== quotaNumber);
      } else {
        // Check if adding this quota exceeds max_tickets_per_purchase
        if (campaign && prev.length >= campaign.max_tickets_per_purchase) {
          alert(`Você pode selecionar no máximo ${campaign.max_tickets_per_purchase} cotas.`);
          return prev;
        }
        return [...prev, quotaNumber];
      }
    });
  }, [campaign]);

  const handleQuantityChange = useCallback((newQuantity: number) => {
    setQuantity(newQuantity);
  }, []);

  const handleReserveClick = () => {
    if (!campaign) return;

    if (campaign.campaign_model === 'manual' && selectedQuotas.length === 0) {
      alert('Por favor, selecione pelo menos uma cota.');
      return;
    }

    if (campaign.campaign_model === 'automatic' && quantity === 0) {
      alert('Por favor, selecione a quantidade de cotas.');
      return;
    }

    setShowReservationModal(true);
  };

  const handleConfirmReservation = async (data: CustomerData) => {
    if (!campaign) return;

    setCustomerData(data);

    const quotasToReserve = campaign.campaign_model === 'manual' ? selectedQuotas : Array.from({ length: quantity }, (_, i) => i + 1);

    try {
      const reservationResults = await reserveTickets(quotasToReserve);

      if (!reservationResults) {
        alert('Erro ao reservar cotas. Tente novamente.');
        return;
      }

      // Calculate total value for the reserved tickets
      const totalValue = (campaign.campaign_model === 'manual' ? selectedQuotas.length : quantity) * campaign.ticket_price;

      // Navigate to payment confirmation page
      navigate('/payment-confirmation', {
        state: {
          reservationData: {
            reservationId: reservationResults[0]?.message || 'N/A',
            customerName: data.name,
            customerEmail: data.email,
            customerPhone: `${data.countryCode} ${data.phoneNumber}`,
            quotaCount: campaign.campaign_model === 'manual' ? selectedQuotas.length : quantity,
            totalValue: totalValue,
            selectedQuotas: campaign.campaign_model === 'manual' ? selectedQuotas : undefined,
            campaignTitle: campaign.title,
            campaignId: campaign.id,
            expiresAt: new Date(Date.now() + (campaign.reservation_timeout_minutes || 15) * 60 * 1000).toISOString()
          }
        }
      });

    } catch (error) {
      console.error('Unexpected error during reservation:', error);
      alert('Erro inesperado ao reservar cotas.');
    } finally {
      setShowReservationModal(false);
    }
  };

  const getThemeClasses = (theme: string | null) => {
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

  const campaignTheme = profileTheme || 'claro';
  const themeClasses = getThemeClasses(campaignTheme);

  // Calculate total value for selected quotas
  const totalSelectedValue = campaign ? (campaign.campaign_model === 'manual' ? selectedQuotas.length : quantity) * campaign.ticket_price : 0;

  // Function to format the draw date for the "Data" section
  const formatDrawDateForSection = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Function to format the draw date for the new "Data" button
  const formatDrawDateForButton = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year}, ${hours}:${minutes}`;
  };

  // Function to calculate promotion details
  const calculatePromotion = (qty: number, promotions: Promotion[] | null, price: number) => {
    if (!promotions || promotions.length === 0) return null;

    const matchingPromotion = promotions.find(promo => promo.ticketQuantity === qty);

    if (matchingPromotion) {
      const originalTotal = qty * price;
      const promotionalTotal = matchingPromotion.discountedTotalValue;
      const savings = originalTotal - promotionalTotal;
      const discountPercentage = originalTotal > 0 ? Math.round((savings / originalTotal) * 100) : 0;

      return {
        promotion: matchingPromotion,
        originalTotal,
        promotionalTotal,
        savings,
        discountPercentage
      };
    }
    return null;
  };

  const promotionInfo = campaign ? calculatePromotion(quantity, campaign.promotions, campaign.ticket_price) : null;

  if (campaignLoading || ticketsLoading) {
    return (
      <div className={`min-h-screen ${themeClasses.background} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (campaignError || !campaign) {
    return (
      <div className={`min-h-screen ${themeClasses.background} flex items-center justify-center`}>
        <div className="text-red-500 text-lg">Erro ao carregar campanha ou campanha não encontrada.</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses.background} ${themeClasses.text} transition-colors duration-300`}>
      <div className="pt-8"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Campaign Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Campaign Main Info */}
            <div className={`${themeClasses.cardBg} rounded-2xl shadow-xl p-6 border ${themeClasses.border}`}>
              {/* Image container with absolute positioned buttons */}
              <div className="relative w-full h-80 rounded-lg overflow-hidden mb-6">
                {campaign.prize_image_urls && campaign.prize_image_urls.length > 0 && (
                  <img
                    src={campaign.prize_image_urls[0]}
                    alt={campaign.title}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* NEW: Date button - positioned at bottom left */}
                {campaign.draw_date && (
                  <div className="absolute bottom-4 left-4 bg-gray-900 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center space-x-2 shadow-lg">
                    <span>Data: {formatDrawDateForButton(campaign.draw_date)}</span>
                  </div>
                )}

                {/* "Participe por apenas R$ X,XX🔥" badge - positioned at bottom right */}
                <div className="absolute bottom-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center space-x-2 shadow-lg">
                  <span>Participe por apenas {formatCurrency(campaign.ticket_price)}🔥</span>
                </div>
              </div>

              <h1 className="text-3xl font-bold mb-4">{campaign.title}</h1>
              {campaign.description && (
                <div
                  className={`${themeClasses.textSecondary} leading-relaxed mb-6`}
                  dangerouslySetInnerHTML={{ __html: campaign.description }}
                />
              )}

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className={`${themeClasses.background} rounded-lg p-4 border ${themeClasses.border}`}>
                  <p className={`text-sm ${themeClasses.textSecondary}`}>Preço por cota</p>
                  <p className="text-xl font-bold" style={{ color: profilePrimaryColor || '#3B82F6' }}>
                    {formatCurrency(campaign.ticket_price)}
                  </p>
                </div>
                <div className={`${themeClasses.background} rounded-lg p-4 border ${themeClasses.border}`}>
                  <p className={`text-sm ${themeClasses.textSecondary}`}>Total de cotas</p>
                  <p className="text-xl font-bold" style={{ color: profilePrimaryColor || '#3B82F6' }}>
                    {campaign.total_tickets}
                  </p>
                </div>
              </div>
            </div>

            {/* Quota Selection / Grid */}
            <div className={`${themeClasses.cardBg} rounded-2xl shadow-xl p-6 border ${themeClasses.border}`}>
              {campaign.campaign_model === 'automatic' ? (
                <QuotaSelector
                  ticketPrice={campaign.ticket_price}
                  minTicketsPerPurchase={campaign.min_tickets_per_purchase || 1}
                  maxTicketsPerPurchase={campaign.max_tickets_per_purchase || 1000}
                  onQuantityChange={handleQuantityChange}
                  initialQuantity={quantity}
                  mode="automatic"
                  promotionInfo={promotionInfo}
                  primaryColor={profilePrimaryColor}
                  campaignTheme={campaignTheme}
                  onReserve={handleReserveClick}
                  reserving={false}
                />
              ) : (
                <>
                  <QuotaGrid
                    totalQuotas={campaign.total_tickets}
                    selectedQuotas={selectedQuotas}
                    onQuotaSelect={handleQuotaSelect}
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                    mode="manual"
                    tickets={tickets}
                    currentUserId={authUser?.id}
                    campaignTheme={campaignTheme}
                    primaryColor={profilePrimaryColor}
                  />
                  <button
                    onClick={handleReserveClick}
                    className="w-full py-4 mt-6 rounded-lg font-bold text-lg transition-all duration-200 shadow-md text-white"
                    style={{ backgroundColor: profilePrimaryColor || '#3B82F6' }}
                  >
                    RESERVAR {formatCurrency(totalSelectedValue)}
                  </button>
                </>
              )}
            </div>

            {/* Prizes Section */}
            {campaign.prizes && campaign.prizes.length > 0 && (
              <div className={`${themeClasses.cardBg} rounded-2xl shadow-xl p-6 border ${themeClasses.border}`}>
                <h2 className="text-xl font-bold mb-4">Prêmios</h2>
                <div className="space-y-3">
                  {campaign.prizes.map((prize, index) => (
                    <div key={prize.id} className="flex items-center space-x-3">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      <p className={`${themeClasses.text} text-lg`}>{prize.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Side Info */}
          <div className="lg:col-span-1 space-y-8">
            {/* Share Section */}
            <div className={`${themeClasses.cardBg} rounded-2xl shadow-xl p-6 border ${themeClasses.border}`}>
              <h2 className="text-xl font-bold mb-4">Compartilhar</h2>
              <div className="flex flex-wrap gap-3">
                {Object.entries(shareSectionConfig).map(([key, { icon: Icon, color, name }]) => (
                  <a
                    key={key}
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-12 h-12 rounded-full text-white transition-transform transform hover:scale-110"
                    style={{ backgroundColor: color }}
                    title={`Compartilhar no ${name}`}
                  >
                    <Icon size={24} />
                  </a>
                ))}
              </div>
            </div>

            {/* Payment Method Section */}
            <div className={`${themeClasses.cardBg} rounded-2xl shadow-xl p-6 border ${themeClasses.border}`}>
              <h3 className={`text-sm font-medium ${themeClasses.textSecondary} uppercase mb-2`}>MÉTODO DE PAGAMENTO</h3>
              <div className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
                <p className="text-lg font-semibold">PIX</p>
              </div>
            </div>

            {/* Draw Method Section */}
            <div className={`${themeClasses.cardBg} rounded-2xl shadow-xl p-6 border ${themeClasses.border}`}>
              <h3 className={`text-sm font-medium ${themeClasses.textSecondary} uppercase mb-2`}>SORTEIO</h3>
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <p className="text-lg font-semibold">{campaign.draw_method}</p>
              </div>
            </div>

            {/* NEW: Draw Date Section */}
            {campaign.draw_date && (
              <div className={`${themeClasses.cardBg} rounded-2xl shadow-xl p-6 border ${themeClasses.border}`}>
                <h3 className={`text-sm font-medium ${themeClasses.textSecondary} uppercase mb-2`}>DATA</h3>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  <p className="text-lg font-semibold">
                    {formatDrawDateForSection(campaign.draw_date)}
                  </p>
                </div>
              </div>
            )}

            {/* Campaign Owner Info */}
            <div className={`${themeClasses.cardBg} rounded-2xl shadow-xl p-6 border ${themeClasses.border}`}>
              <h2 className="text-xl font-bold mb-4">Organizado por</h2>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold">
                  {campaign.user_id.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">Organizador da Rifa</p>
                  <p className={`text-sm ${themeClasses.textSecondary}`}>Entre em contato para dúvidas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reservation Modal */}
      {showReservationModal && campaign && (
        <ReservationModal
          isOpen={showReservationModal}
          onClose={() => setShowReservationModal(false)}
          onReserve={handleConfirmReservation}
          quotaCount={campaign.campaign_model === 'manual' ? selectedQuotas.length : quantity}
          totalValue={totalSelectedValue}
          selectedQuotas={campaign.campaign_model === 'manual' ? selectedQuotas : undefined}
          campaignTitle={campaign.title}
          primaryColor={profilePrimaryColor}
          campaignTheme={campaignTheme}
          reserving={false}
        />
      )}
    </div>
  );
};

export default CampaignPage;