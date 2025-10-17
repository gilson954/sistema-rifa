import React, { useState, useEffect } from 'react';
import {
  Eye,
  Plus,
  Share2,
  Calendar,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  CreditCard as Edit,
  Sparkles,
  Trophy,
  Award,
  Star,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCampaigns } from '../hooks/useCampaigns';
import { Campaign } from '../types/campaign';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { CampaignAPI } from '../lib/api/campaigns';
import { supabase } from '../lib/supabase';
import CotasPremiadasAdminModal from '../components/CotasPremiadasAdminModal';

/* Helper to strip HTML tags from strings (defensive: avoids showing raw HTML) */
const stripHtml = (input?: string) => {
  if (!input) return '';
  return input.replace(/<[^>]*>/g, '').trim();
};

/* Helper to format numbers with thousands separator */
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('pt-BR').format(num);
};

const getTimeRemaining = (expiresAt: string) => {
  const now = new Date().getTime();
  const expiration = new Date(expiresAt).getTime();
  const difference = expiration - now;

  if (difference <= 0) {
    return { expired: true, text: 'Expirado' };
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return { expired: false, text: `${days}d ${hours}h ${minutes}m` };
  } else if (hours > 0) {
    return { expired: false, text: `${hours}h ${minutes}m` };
  } else {
    return { expired: false, text: `${minutes}m` };
  }
};

const calculateProgressPercentage = (soldTickets: number, totalTickets: number): number => {
  if (totalTickets === 0) return 0;
  return Math.round((soldTickets / totalTickets) * 100);
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'draft':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    case 'completed':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'active':
      return 'Ativa';
    case 'draft':
      return 'Rascunho';
    case 'completed':
      return 'Finalizada';
    case 'cancelled':
      return 'Cancelada';
    default:
      return status;
  }
};

const DashboardPage: React.FC = () => {
  const [showRevenue, setShowRevenue] = useState(false);
  const [displayPaymentSetupCard, setDisplayPaymentSetupCard] = useState(true);
  const navigate = useNavigate();
  const { campaigns, loading: campaignsLoading, fetchCampaigns } = useCampaigns();
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useNotification();
  const [refreshingCampaigns, setRefreshingCampaigns] = useState(false);
  const [togglingFeatured, setTogglingFeatured] = useState<string | null>(null);
  const [showCotasPremiadasModal, setShowCotasPremiadasModal] = useState(false);
  const [selectedCampaignForCotas, setSelectedCampaignForCotas] = useState<Campaign | null>(null);

  // Paginação: 5 por página
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const totalPages = campaigns && campaigns.length > 0 ? Math.max(1, Math.ceil(campaigns.length / pageSize)) : 1;
  const paginatedCampaigns = campaigns
    ? campaigns.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : [];

  // Garantir que currentPage seja válido quando campaigns mudar
  useEffect(() => {
    if (!campaigns) return;
    const newTotalPages = Math.max(1, Math.ceil(campaigns.length / pageSize));
    if (currentPage > newTotalPages) {
      setCurrentPage(1);
    }
  }, [campaigns, pageSize]);

  // Check if payment is configured on component mount and when user changes
  useEffect(() => {
    const checkPaymentConfiguration = async () => {
      if (!user) {
        setDisplayPaymentSetupCard(true);
        return;
      }

      try {
        // First check localStorage for quick response
        const localStorageValue = localStorage.getItem('isPaymentConfigured');
        if (localStorageValue) {
          const configured = JSON.parse(localStorageValue);
          setDisplayPaymentSetupCard(!configured);
        }

        // Then verify with database for accuracy
        const { PaymentsAPI } = await import('../lib/api/payments');
        const hasIntegration = await PaymentsAPI.hasPaymentIntegration(user.id);
        
        // Update localStorage with current status
        localStorage.setItem('isPaymentConfigured', JSON.stringify(hasIntegration));
        
        // Update display state
        setDisplayPaymentSetupCard(!hasIntegration);
      } catch (error) {
        console.error('Error parsing payment configuration status:', error);
        setDisplayPaymentSetupCard(true);
      }
    };

    checkPaymentConfiguration();
  }, [user]);

  // Set up real-time subscription for campaign updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`campaigns_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'campaigns',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Refresh campaigns list when any campaign is updated
          refreshCampaigns();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const refreshCampaigns = async () => {
    setRefreshingCampaigns(true);
    try {
      // Force refresh campaigns by reloading or re-fetching
      // Keep simple and reliable (you can replace with a smarter refresh later)
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing campaigns:', error);
    } finally {
      setRefreshingCampaigns(false);
    }
  };

  const handleConfigurePayment = () => {
    navigate('/dashboard/integrations');
  };

  const handleCreateCampaign = () => {
    navigate('/dashboard/create-campaign');
  };

  const handleEditCampaign = (campaignId: string) => {
    navigate(`/dashboard/create-campaign/step-2?id=${campaignId}`);
  };

  const handlePublishCampaign = (campaignId: string) => {
    navigate(`/dashboard/create-campaign/step-3?id=${campaignId}`);
  };

  const handleViewSalesHistory = (campaignId: string) => {
    navigate(`/dashboard/campaigns/${campaignId}/sales-history`);
  };

  const handleViewCampaign = async (campaignId: string) => {
    // Busca a campanha para obter o slug
    let campaignToView = campaigns.find(c => c.id === campaignId);

    // Se public_id estiver faltando no estado local, refetch a campanha
    if (!campaignToView?.public_id) {
      const { data: fetchedCampaign, error: fetchError } = await CampaignAPI.getCampaignById(campaignId);
      if (fetchError) {
        console.error('Error refetching campaign for view:', fetchError);
        showError('Erro ao carregar detalhes da campanha.');
        return;
      }
      campaignToView = fetchedCampaign;
    }

    if (campaignToView?.public_id) {
      // Abre em nova aba para visualizar como usuário final
      window.open(`/c/${campaignToView.public_id}`, '_blank');
    } else {
      showError('Não foi possível encontrar o ID público da campanha.');
    }
  };

  const handleRealizarSorteio = (campaignId: string) => {
    navigate(`/dashboard/campaigns/${campaignId}/realizar-sorteio`);
  };

  const handleVerGanhadores = (campaignId: string) => {
    navigate(`/dashboard/campaigns/${campaignId}/ganhadores`);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleManageCotasPremiadas = (campaign: Campaign) => {
    if (campaign.campaign_model !== 'automatic') {
      showWarning('Cotas premiadas só estão disponíveis para campanhas no modo automático.');
      return;
    }
    setSelectedCampaignForCotas(campaign);
    setShowCotasPremiadasModal(true);
  };

  const handleCloseCotasPremiadasModal = () => {
    setShowCotasPremiadasModal(false);
    setSelectedCampaignForCotas(null);
  };

  const handleToggleFeatured = async (campaignId: string, currentFeaturedStatus: boolean) => {
    if (!user || togglingFeatured) return;

    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) {
      showError('Campanha não encontrada.');
      return;
    }

    if (!currentFeaturedStatus && campaign.status !== 'active' && campaign.status !== 'completed') {
      showWarning('Apenas campanhas ativas ou concluídas podem ser destacadas.');
      return;
    }

    const willBeFeatured = !currentFeaturedStatus;
    setTogglingFeatured(campaignId);

    try {
      console.log(`🔄 Toggling featured status for campaign ${campaignId}: ${currentFeaturedStatus} -> ${willBeFeatured}`);

      const { data, error } = await CampaignAPI.toggleFeaturedCampaign(
        campaignId,
        user.id,
        willBeFeatured
      );

      if (error) {
        console.error('❌ Error toggling featured campaign:', error);
        const errorMessage = error?.message || 'Erro desconhecido';
        showError(`Erro ao ${willBeFeatured ? 'destacar' : 'remover destaque da'} campanha: ${errorMessage}`);
      } else if (data) {
        console.log('✅ Featured status toggled successfully:', data);
        showSuccess(willBeFeatured ? 'Campanha destacada com sucesso!' : 'Destaque removido com sucesso!');
        await fetchCampaigns();
      } else {
        console.error('❌ No data returned from toggle operation');
        showError('Erro ao processar a operação. Tente novamente.');
      }
    } catch (error) {
      console.error('❌ Exception while toggling featured campaign:', error);
      showError('Erro inesperado ao processar a operação. Tente novamente.');
    } finally {
      setTogglingFeatured(null);
    }
  };

  return (
    <div className="dashboard-page min-h-screen bg-transparent text-gray-900 dark:text-white transition-colors duration-300">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Payment Setup Card - Melhorado */}
        {displayPaymentSetupCard && (
          <div className="mb-6">
            <div className="relative overflow-hidden w-full rounded-2xl p-6 shadow-lg border border-purple-200/30 dark:border-purple-800/30 bg-gradient-to-br from-purple-50/80 to-blue-50/80 dark:from-purple-900/20 dark:to-blue-900/20 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              {/* Efeito de brilho */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
              
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center space-x-4 flex-1 min-w-0">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Forma de recebimento</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Você ainda não configurou uma forma para receber os pagamentos na sua conta.</p>
                  </div>
                </div>

                <div className="flex-shrink-0 w-full sm:w-auto">
                  <button 
                    onClick={handleConfigurePayment} 
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 text-white"
                  >
                    <Share2 className="h-5 w-5" />
                    Configurar agora
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botão Criar campanha - Melhorado */}
        <div className="mb-6 flex justify-center">
          <button
            onClick={handleCreateCampaign}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-[#7928CA] via-[#FF0080] via-[#007CF0] to-[#FF8C00] text-white"
          >
            <Plus className="h-6 w-6" />
            <span>Criar campanha</span>
          </button>
        </div>

        {/* Campaigns header - Com total melhorado */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Minhas Campanhas</h2>
          <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 border border-purple-200/30 dark:border-purple-800/30">
            <span className="text-sm font-bold text-purple-900 dark:text-purple-100">{campaigns ? campaigns.length : 0} campanhas</span>
          </div>
        </div>

        {/* Campaigns list */}
        {campaignsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedCampaigns.length === 0 && (
              <div className="rounded-2xl p-10 text-center border border-gray-200/20 dark:border-gray-800/30 bg-white/60 dark:bg-gray-900/50">
                <div className="text-xl font-bold text-gray-900 dark:text-white mb-2">Nenhuma campanha encontrada</div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-6">Crie a sua primeira campanha e comece a vender cotas.</div>
                <div className="flex justify-center">
                  <button onClick={handleCreateCampaign} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg transition-all duration-300 hover:-translate-y-0.5 bg-gradient-to-br from-purple-600 to-blue-600 text-white">
                    <Plus className="h-5 w-5" /> Criar campanha
                  </button>
                </div>
              </div>
            )}

            <div className="grid gap-4">
              {paginatedCampaigns.map((campaign: Campaign) => (
                <article
                  key={campaign.id}
                  className={`rounded-2xl p-5 border transition-all duration-300 hover:shadow-lg flex flex-col sm:flex-row gap-5 items-start ${
                    campaign.status === 'draft' && campaign.expires_at && getTimeRemaining(campaign.expires_at).expired
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : 'bg-white/70 dark:bg-gray-900/60 border-gray-200/20 dark:border-gray-700/30 backdrop-blur-sm'
                  }`}
                >
                  {/* Image (top on mobile, left on desktop) */}
                  <img
                    src={campaign.prize_image_urls?.[0] || 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1'}
                    alt={stripHtml(campaign.title) || 'Prêmio'}
                    className="w-full sm:w-32 h-48 sm:h-32 object-cover rounded-xl shadow-md border border-gray-200/20 dark:border-gray-700/30 flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0 pr-4">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                          {stripHtml(campaign.title)}
                        </h3>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          {campaign.is_featured && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 flex items-center gap-1">
                              <Star className="h-3 w-3 fill-current" />
                              Destaque
                            </span>
                          )}

                          {campaign.status === 'draft' && !campaign.is_paid && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">Pendente</span>
                          )}

                          {campaign.status === 'draft' && campaign.is_paid && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Processando</span>
                          )}

                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(campaign.status)}`}>
                            {getStatusText(campaign.status)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expiration / Payment Alerts */}
                    {campaign.status === 'draft' && campaign.expires_at && !campaign.is_paid && (
                      <div className="mb-3">
                        {(() => {
                          const timeRemaining = getTimeRemaining(campaign.expires_at);
                          const isUrgent = !timeRemaining.expired && campaign.expires_at &&
                            new Date(campaign.expires_at).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000;
                          
                          return (
                            <div className={`flex items-center space-x-2 p-3 rounded-xl text-sm font-medium ${
                              timeRemaining.expired
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                : isUrgent
                                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                            }`}>
                              <Clock className="h-5 w-5" />
                              <span>
                                {timeRemaining.expired 
                                  ? 'Campanha expirada - Faça o pagamento para reativar'
                                  : `Faça o pagamento em até ${timeRemaining.text} ou ela vai expirar`
                                }
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {campaign.status === 'draft' && campaign.is_paid && (
                      <div className="mb-3">
                        <div className="flex items-center space-x-2 p-3 rounded-xl text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                          <CheckCircle className="h-5 w-5" />
                          <span>
                            Taxa paga - {campaign.status === 'active' ? 'Campanha ativa!' : 'Ativando campanha...'}
                          </span>
                          {campaign.status !== 'active' && (
                            <button
                              onClick={refreshCampaigns}
                              disabled={refreshingCampaigns}
                              className="ml-2 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg font-semibold transition"
                            >
                              {refreshingCampaigns ? 'Atualizando...' : 'Atualizar'}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Progresso</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{calculateProgressPercentage(campaign.sold_tickets, campaign.total_tickets)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 h-2.5 rounded-full transition-all duration-500 animate-gradient-x bg-[length:200%_200%]" style={{ width: `${calculateProgressPercentage(campaign.sold_tickets, campaign.total_tickets)}%` }} />
                      </div>
                    </div>

                    {/* Compact info grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <span className="font-medium text-gray-900 dark:text-white truncate">{formatNumber(campaign.sold_tickets)}/{formatNumber(campaign.total_tickets)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="font-medium text-gray-900 dark:text-white truncate">{formatCurrency(campaign.ticket_price)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        <span className="font-medium text-gray-900 dark:text-white truncate">{formatDate(campaign.created_at)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/30">
                        <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-green-600 dark:text-green-400 font-bold truncate">{formatCurrency(campaign.ticket_price * campaign.sold_tickets)}</span>
                      </div>
                    </div>

                    {/* Actions: grid on mobile, inline on desktop */}
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                      <button
                        onClick={() => handleViewCampaign(campaign.id)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg
                                   animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-purple-600 via-blue-500 to-indigo-600"
                        aria-label={`Visualizar ${stripHtml(campaign.title)}`}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">Visualizar</span>
                      </button>

                      <button
                        onClick={() => handleViewSalesHistory(campaign.id)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md transition-all duration-300 hover:-translate-y-0.5"
                      >
                        <DollarSign className="h-4 w-4" /> <span className="hidden sm:inline">Vendas</span>
                      </button>

                      {campaign.campaign_model === 'automatic' && (
                        <button
                          onClick={() => handleManageCotasPremiadas(campaign)}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold shadow-md transition-all duration-300 hover:-translate-y-0.5"
                          title="Gerenciar cotas premiadas"
                        >
                          <Award className="h-4 w-4" /> <span className="hidden sm:inline">Cotas Premiadas</span>
                        </button>
                      )}

                      {(campaign.status === 'active' || campaign.status === 'completed') && (
                        <button
                          onClick={() => handleToggleFeatured(campaign.id, campaign.is_featured)}
                          disabled={togglingFeatured === campaign.id}
                          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition-all duration-300 hover:-translate-y-0.5 ${
                            campaign.is_featured
                              ? 'bg-yellow-500 hover:bg-yellow-600'
                              : 'bg-gray-600 hover:bg-gray-700'
                          } ${togglingFeatured === campaign.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={campaign.is_featured ? 'Remover destaque' : 'Destacar campanha'}
                        >
                          <Star className={`h-4 w-4 ${campaign.is_featured ? 'fill-current' : ''}`} />
                          <span className="hidden sm:inline">{campaign.is_featured ? 'Destacada' : 'Destacar'}</span>
                        </button>
                      )}

                      {campaign.status === 'active' && !campaign.drawn_at && (
                        <button
                          onClick={() => handleRealizarSorteio(campaign.id)}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition-all duration-300 hover:-translate-y-0.5 animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500"
                        >
                          <Trophy className="h-4 w-4" /> <span className="hidden sm:inline">Realizar sorteio</span>
                        </button>
                      )}

                      {campaign.status === 'completed' && campaign.drawn_at && (
                        <button
                          onClick={() => handleVerGanhadores(campaign.id)}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition-all duration-300 hover:-translate-y-0.5 animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-green-500 via-emerald-600 to-teal-500"
                        >
                          <Award className="h-4 w-4" /> <span className="hidden sm:inline">Ver ganhadores</span>
                        </button>
                      )}

                      {campaign.status === 'draft' && !campaign.is_paid && (
                        <button
                          onClick={() => handlePublishCampaign(campaign.id)}
                          className="px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition-all duration-300 hover:-translate-y-0.5 animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-green-500 via-emerald-600 to-green-500"
                        >
                          Publicar
                        </button>
                      )}

                      <button
                        onClick={() => handleEditCampaign(campaign.id)}
                        className="px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition-all duration-300 hover:-translate-y-0.5 animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600"
                      >
                        <Edit className="h-4 w-4 inline-block mr-2" /> <span className="hidden sm:inline">Editar</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination - Melhorada */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-8 gap-4 p-4 rounded-xl bg-white/60 dark:bg-gray-900/50 border border-gray-200/20 dark:border-gray-800/30 backdrop-blur-sm">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mostrando <span className="font-bold text-purple-600 dark:text-purple-400">{((currentPage - 1) * pageSize) + 1}</span> a <span className="font-bold text-purple-600 dark:text-purple-400">{Math.min(currentPage * pageSize, campaigns.length)}</span> de <span className="font-bold text-purple-600 dark:text-purple-400">{campaigns.length}</span> campanhas
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)} 
                    disabled={currentPage === 1} 
                    className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200/20 dark:border-gray-700/30 text-sm font-semibold transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-800"
                  >
                    Anterior
                  </button>
                  <div className="px-5 py-2 rounded-lg font-bold text-sm bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-900 dark:text-purple-100 border border-purple-200/30 dark:border-purple-800/30">
                    {currentPage} de {totalPages}
                  </div>
                  <button 
                    onClick={() => handlePageChange(currentPage + 1)} 
                    disabled={currentPage === totalPages} 
                    className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200/20 dark:border-gray-700/30 text-sm font-semibold transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-800"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {selectedCampaignForCotas && (
        <CotasPremiadasAdminModal
          isOpen={showCotasPremiadasModal}
          onClose={handleCloseCotasPremiadasModal}
          campaignId={selectedCampaignForCotas.id}
          campaignTitle={selectedCampaignForCotas.title}
          totalTickets={selectedCampaignForCotas.total_tickets}
          initialVisibility={selectedCampaignForCotas.cotas_premiadas_visiveis}
          onShowNotification={(message, type) => {
            if (type === 'success') {
              showSuccess(message);
            } else {
              showError(message);
            }
          }}
        />
      )}
    </div>
  );
};

export default DashboardPage;