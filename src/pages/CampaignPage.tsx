import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, Users, Trophy, Share2, Heart, Calendar, MapPin } from 'lucide-react';
import { Campaign } from '../types/campaign';
import { getCampaignBySlug, getCampaignByPublicId } from '../lib/api/campaigns';
import { getPublicProfile } from '../lib/api/publicProfiles';
import QuotaGrid from '../components/QuotaGrid';
import { QuotaSelector } from '../components/QuotaSelector';
import { ReservationModal } from '../components/ReservationModal';
import { SocialMediaIcons } from '../components/SocialMediaIcons';
import { formatCurrency } from '../utils/currency';
import { formatTimeRemaining } from '../utils/timeFormatters';

export function CampaignPage() {
  const { slug, publicId } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setLoading(true);
        let campaignData: Campaign | null = null;

        if (slug) {
          campaignData = await getCampaignBySlug(slug);
        } else if (publicId) {
          campaignData = await getCampaignByPublicId(publicId);
        }

        if (!campaignData) {
          setError('Campanha não encontrada');
          return;
        }

        setCampaign(campaignData);

        // Fetch profile data
        const profileData = await getPublicProfile(campaignData.user_id);
        setProfile(profileData);

      } catch (err) {
        console.error('Error fetching campaign:', err);
        setError('Erro ao carregar campanha');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [slug, publicId]);

  useEffect(() => {
    if (!campaign || campaign.status !== 'active') return;

    const updateTimeRemaining = () => {
      const remaining = formatTimeRemaining(campaign.end_date);
      setTimeRemaining(remaining);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [campaign]);

  const handleReserveTickets = () => {
    if (!campaign) return;
    setShowReservationModal(true);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: campaign?.title,
          text: campaign?.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando campanha...</p>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {error || 'Campanha não encontrada'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            A campanha que você está procurando não existe ou foi removida.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  const isActive = campaign.status === 'active';
  const isCompleted = campaign.status === 'completed';
  const isCancelled = campaign.status === 'cancelled';
  const isDraft = campaign.status === 'draft';

  const themeClasses = {
    bg: profile?.theme === 'escuro' 
      ? 'bg-gray-900' 
      : profile?.theme === 'escuro-preto' 
      ? 'bg-black' 
      : 'bg-gray-50',
    cardBg: profile?.theme === 'escuro' 
      ? 'bg-gray-800' 
      : profile?.theme === 'escuro-preto' 
      ? 'bg-gray-900' 
      : 'bg-white',
    text: profile?.theme === 'escuro' || profile?.theme === 'escuro-preto' 
      ? 'text-white' 
      : 'text-gray-900',
    textSecondary: profile?.theme === 'escuro' || profile?.theme === 'escuro-preto' 
      ? 'text-gray-300' 
      : 'text-gray-600',
    border: profile?.theme === 'escuro' || profile?.theme === 'escuro-preto' 
      ? 'border-gray-700' 
      : 'border-gray-200'
  };

  return (
    <div className={`min-h-screen ${themeClasses.bg}`}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            {profile?.logo_url && (
              <img
                src={profile.logo_url}
                alt="Logo"
                className="h-12 w-12 rounded-full object-cover"
              />
            )}
            <div>
              <h1 className={`text-2xl font-bold ${themeClasses.text}`}>
                {profile?.name || 'Organizador'}
              </h1>
              {profile?.social_media_links && (
                <SocialMediaIcons links={profile.social_media_links} />
              )}
            </div>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Share2 className="h-4 w-4" />
            <span>Compartilhar</span>
          </button>
        </div>

        {/* Campaign Status Alert */}
        {!isActive && (
          <div className="mb-6 p-4 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-orange-600">
                Campanha Indisponível
              </h4>
              <p className="text-orange-500 text-sm mt-1">
                {isDraft && 'Esta campanha ainda não foi publicada.'}
                {isCompleted && 'Esta campanha já foi finalizada.'}
                {isCancelled && 'Esta campanha foi cancelada.'}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Campaign Image */}
            {campaign.prize_image_url && (
              <div className={`${themeClasses.cardBg} rounded-lg overflow-hidden shadow-sm border ${themeClasses.border}`}>
                <img
                  src={campaign.prize_image_url}
                  alt={campaign.title}
                  className="w-full h-64 object-cover"
                />
              </div>
            )}

            {/* Campaign Info */}
            <div className={`${themeClasses.cardBg} rounded-lg p-6 shadow-sm border ${themeClasses.border}`}>
              <h1 className={`text-3xl font-bold mb-4 ${themeClasses.text}`}>
                {campaign.title}
              </h1>
              
              {campaign.description && (
                <div 
                  className={`prose max-w-none ${themeClasses.textSecondary} mb-6`}
                  dangerouslySetInnerHTML={{ __html: campaign.description }}
                />
              )}

              {/* Campaign Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
                    {campaign.sold_tickets}
                  </div>
                  <div className={`text-sm ${themeClasses.textSecondary}`}>
                    Vendidas
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
                <div className="text-center">
                  <div className={`text-2xl font-bold ${themeClasses.text}`}>
                    {Math.round((campaign.sold_tickets / campaign.total_tickets) * 100)}%
                  </div>
                  <div className={`text-sm ${themeClasses.textSecondary}`}>
                    Vendido
                  </div>
                </div>
              </div>

              {/* Time Remaining */}
              {isActive && timeRemaining && (
                <div className="flex items-center justify-center space-x-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-600">
                    {timeRemaining}
                  </span>
                </div>
              )}
            </div>

            {/* Quota Grid */}
            <div className={`${themeClasses.cardBg} rounded-lg p-6 shadow-sm border ${themeClasses.border}`}>
              <h2 className={`text-xl font-bold mb-4 ${themeClasses.text}`}>
                Cotas Disponíveis
              </h2>
              <QuotaGrid campaignId={campaign.id} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Purchase Section */}
            {isActive && (
              <div className={`${themeClasses.cardBg} rounded-lg p-6 shadow-sm border ${themeClasses.border}`}>
                <h3 className={`text-lg font-bold mb-4 ${themeClasses.text}`}>
                  Escolha a Quantidade
                </h3>
                
                <QuotaSelector
                  campaign={campaign}
                  selectedQuantity={selectedQuantity}
                  onQuantityChange={setSelectedQuantity}
                />

                <button
                  onClick={handleReserveTickets}
                  className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
                >
                  Reservar Cotas
                </button>
              </div>
            )}

            {/* Campaign Details */}
            <div className={`${themeClasses.cardBg} rounded-lg p-6 shadow-sm border ${themeClasses.border}`}>
              <h3 className={`text-lg font-bold mb-4 ${themeClasses.text}`}>
                Detalhes da Campanha
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Calendar className={`h-4 w-4 ${themeClasses.textSecondary}`} />
                  <div>
                    <div className={`text-sm ${themeClasses.textSecondary}`}>
                      Início
                    </div>
                    <div className={`font-medium ${themeClasses.text}`}>
                      {new Date(campaign.start_date).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className={`h-4 w-4 ${themeClasses.textSecondary}`} />
                  <div>
                    <div className={`text-sm ${themeClasses.textSecondary}`}>
                      Término
                    </div>
                    <div className={`font-medium ${themeClasses.text}`}>
                      {new Date(campaign.end_date).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>

                {campaign.draw_date && (
                  <div className="flex items-center space-x-3">
                    <Trophy className={`h-4 w-4 ${themeClasses.textSecondary}`} />
                    <div>
                      <div className={`text-sm ${themeClasses.textSecondary}`}>
                        Sorteio
                      </div>
                      <div className={`font-medium ${themeClasses.text}`}>
                        {new Date(campaign.draw_date).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                )}

                {campaign.draw_method && (
                  <div className="flex items-center space-x-3">
                    <Users className={`h-4 w-4 ${themeClasses.textSecondary}`} />
                    <div>
                      <div className={`text-sm ${themeClasses.textSecondary}`}>
                        Método do Sorteio
                      </div>
                      <div className={`font-medium ${themeClasses.text}`}>
                        {campaign.draw_method}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reservation Modal */}
      {showReservationModal && campaign && (
        <ReservationModal
          campaign={campaign}
          selectedQuantity={selectedQuantity}
          onClose={() => setShowReservationModal(false)}
        />
      )}
    </div>
  );
}