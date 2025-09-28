import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  EyeOff, 
  Plus, 
  Share2,
  Calendar,
  Users,
  DollarSign,
  MoreVertical,
  Edit,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCampaigns } from '../hooks/useCampaigns';
import { Campaign } from '../types/campaign';
import { useAuth } from '../context/AuthContext';
import { CampaignAPI } from '../lib/api/campaigns';
import SubscriptionStatus from '../components/SubscriptionStatus';
import { supabase } from '../lib/supabase';

/**
 * Utility function to calculate time remaining until expiration
 */
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

const DashboardPage = () => {
  const [showRevenue, setShowRevenue] = useState(false);
  const [displayPaymentSetupCard, setDisplayPaymentSetupCard] = useState(true);
  const navigate = useNavigate();
  const { campaigns, loading: campaignsLoading } = useCampaigns();
  const { user } = useAuth();
  const [refreshingCampaigns, setRefreshingCampaigns] = useState(false);

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

    console.log('🔄 Setting up real-time subscription for campaigns...');

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
        (payload) => {
          console.log('📡 Campaign update detected:', payload);
          // Refresh campaigns list when any campaign is updated
          refreshCampaigns();
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Unsubscribing from campaign updates');
      supabase.removeChannel(channel);
    };
  }, [user]);

  const refreshCampaigns = async () => {
    setRefreshingCampaigns(true);
    try {
      // Force refresh campaigns by calling the API directly
      window.location.reload(); // Simple but effective way to refresh all data
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
      console.log(`Public ID missing for campaign ${campaignId} in local state. Refetching...`);
      console.log(`Public ID missing for campaign ${campaignId} in local state. Refetching...`);
      const { data: fetchedCampaign, error: fetchError } = await CampaignAPI.getCampaignById(campaignId);
      if (fetchError) {
        console.error('Error refetching campaign for view:', fetchError);
        alert('Erro ao carregar detalhes da campanha.');
        return;
      }
      campaignToView = fetchedCampaign;
    }

    if (campaignToView?.public_id) {
      console.log(`Navigating to /c/${campaignToView.public_id}`);
      // Abre em nova aba para visualizar como usuário final
      window.open(`/c/${campaignToView.public_id}`, '_blank');
    } else {
      console.error(`Could not get public_id for campaign ${campaignId} even after refetch.`);
      // Fallback se public_id ainda não for encontrado após refetch (não deve acontecer se o DB for NOT NULL)
      console.error(`Could not get public_id for campaign ${campaignId} even after refetch.`);
      alert('Não foi possível encontrar o ID público da campanha.');
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

  // Paginação handler
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    // Page grid: sidebar + main. Sidebar is hidden on small screens (responsive).
    <div className="min-h-screen bg-transparent transition-colors duration-300">
      {/* Sticky Header (transparent 50%) */}
      <header className="sticky top-0 z-30 w-full backdrop-blur-sm bg-white/50 dark:bg-gray-900/50 border-b border-gray-200/40 dark:border-gray-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Rifaqui</div>
            <div className="hidden sm:flex items-center text-sm text-gray-600 dark:text-gray-300">
              Dashboard
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              aria-label="Notificações"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition"
            >
              <svg className="h-5 w-5 text-gray-700 dark:text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
              { /* Initial letter placeholder (you likely have user info elsewhere) */ }
              { (user?.email && user.email[0]?.toUpperCase()) || 'G' }
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Sidebar - transparent 50% glass */}
        <aside className="hidden lg:block sticky top-[76px] self-start rounded-2xl overflow-hidden">
          <nav className="h-full bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200/40 dark:border-gray-800/40 rounded-2xl p-4 space-y-3 shadow-sm">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-white/5 transition">
              <span className="w-8 h-8 rounded-md bg-purple-600/10 flex items-center justify-center text-purple-600">🏷️</span>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Campanhas</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-white/5 transition">
              <span className="w-8 h-8 rounded-md bg-blue-600/10 flex items-center justify-center text-blue-600">💳</span>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Métodos de pagamento</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-white/5 transition">
              <span className="w-8 h-8 rounded-md bg-green-600/10 flex items-center justify-center text-green-600">🏆</span>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Ranking</span>
            </button>
            <div className="border-t border-gray-200/40 dark:border-gray-800/40 pt-3">
              <button className="w-full text-sm text-gray-600 dark:text-gray-300 text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition">Minha conta</button>
              <button className="w-full text-sm text-gray-600 dark:text-gray-300 text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition">Tutoriais</button>
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main>
          <div className="space-y-6">
            {/* Payment Setup Card - Only show if payment is not configured */}
            {displayPaymentSetupCard && (
              <div className="bg-gradient-to-r from-white/60 to-transparent dark:from-white/3 dark:to-transparent border border-gray-200/40 dark:border-gray-800/40 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center space-x-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <Share2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                        Forma de recebimento
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Você ainda não configurou uma forma para receber os pagamentos na sua conta.
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 w-full sm:w-auto">
                    <button 
                      onClick={handleConfigurePayment}
                      className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-medium transition-colors duration-200 shadow"
                    >
                      Configurar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Subscription Status Card */}
            <div className="rounded-2xl overflow-hidden">
              <div className="bg-white/60 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200/40 dark:border-gray-800/40 p-4 rounded-2xl shadow-sm">
                <SubscriptionStatus className="w-full" />
              </div>
            </div>

            {/* Create Campaign Button */}
            <div className="flex justify-center sm:justify-end">
              <button 
                onClick={handleCreateCampaign}
                className="inline-flex items-center gap-3 bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 px-5 rounded-2xl font-semibold text-base transition-transform transform hover:-translate-y-0.5 shadow-lg"
              >
                <Plus className="h-5 w-5" />
                <span>Criar campanha</span>
              </button>
            </div>

            {/* Campaigns List */}
            {campaigns && campaigns.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Minhas Campanhas
                  </h3>
                  <div className="text-sm text-gray-600 dark:text-gray-300">{campaigns.length} campanhas</div>
                </div>
                
                {campaignsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4">
                      {paginatedCampaigns.map((campaign: Campaign) => (
                        <article
                          key={campaign.id}
                          className={`rounded-2xl p-4 border transition-all duration-200 flex flex-col sm:flex-row gap-4 items-start ${
                            campaign.status === 'draft' && campaign.expires_at && getTimeRemaining(campaign.expires_at).expired
                              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                              : 'bg-white/60 dark:bg-gray-900/50 border-gray-200/30 dark:border-gray-700/30'
                          }`}
                        >
                          {/* Alerts */}
                          <div className="w-full">
                            {campaign.status === 'draft' && campaign.expires_at && !campaign.is_paid && (
                              <div className="mb-3">
                                {(() => {
                                  const timeRemaining = getTimeRemaining(campaign.expires_at);
                                  const isUrgent = !timeRemaining.expired && campaign.expires_at && 
                                    new Date(campaign.expires_at).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000; // Less than 24 hours
                                  
                                  return (
                                    <div className={`flex items-center space-x-2 p-2 rounded-lg text-sm ${
                                      timeRemaining.expired
                                        ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                        : isUrgent
                                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                                    }`}>
                                      <Clock className="h-4 w-4" />
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
                                <div className="flex items-center space-x-2 p-2 rounded-lg text-sm bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                  <CheckCircle className="h-4 w-4" />
                                  <span>
                                    Taxa paga - {campaign.status === 'active' ? 'Campanha ativa!' : 'Ativando campanha...'}
                                  </span>
                                  {campaign.status !== 'active' && (
                                    <button
                                      onClick={refreshCampaigns}
                                      disabled={refreshingCampaigns}
                                      className="ml-2 text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                                    >
                                      {refreshingCampaigns ? 'Atualizando...' : 'Atualizar'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex-shrink-0 w-full sm:w-28">
                            <img
                              src={campaign.prize_image_urls?.[0] || 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1'}
                              alt={campaign.title}
                              className="w-full h-28 sm:h-28 object-cover rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white truncate pr-2">
                                {campaign.title}
                              </h4>
                              <div className="flex items-center space-x-2 flex-shrink-0">
                                {campaign.status === 'draft' && !campaign.is_paid && (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                                    Pendente
                                  </span>
                                )}
                                {campaign.status === 'draft' && campaign.is_paid && (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                    Processando
                                  </span>
                                )}
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                                  {getStatusText(campaign.status)}
                                </span>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Progresso</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {calculateProgressPercentage(campaign.sold_tickets, campaign.total_tickets)}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${calculateProgressPercentage(campaign.sold_tickets, campaign.total_tickets)}%` }}
                                ></div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm text-gray-600 dark:text-gray-300">
                              <div className="flex items-center space-x-2">
                                <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                <span className="truncate">
                                  {campaign.sold_tickets}/{campaign.total_tickets} cotas
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <DollarSign className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                <span className="truncate">
                                  {formatCurrency(campaign.ticket_price)}
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                <span className="truncate">
                                  {formatDate(campaign.created_at)}
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <DollarSign className="h-4 w-4 text-green-500" />
                                <span className="text-green-600 dark:text-green-400 font-medium truncate">
                                  {formatCurrency(campaign.ticket_price * campaign.sold_tickets)}
                                </span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-2 mt-4">
                              <button
                                onClick={() => handleViewCampaign(campaign.id)}
                                className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow transition px-3 py-2 rounded-lg text-sm font-medium"
                                aria-label={`Visualizar ${campaign.title}`}
                              >
                                Visualizar
                              </button>
                              
                              <button
                                onClick={() => handleViewSalesHistory(campaign.id)}
                                className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow transition px-3 py-2 rounded-lg text-sm font-medium"
                                aria-label={`Vendas ${campaign.title}`}
                              >
                                Vendas
                              </button>
                              
                              {/* Publish Button - Only show for draft campaigns that are not paid */}
                              {campaign.status === 'draft' && !campaign.is_paid && (
                                <button
                                  onClick={() => handlePublishCampaign(campaign.id)}
                                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200 text-sm"
                                >
                                  Publicar
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleEditCampaign(campaign.id)}
                                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200 text-sm"
                              >
                                Editar
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-3">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, campaigns.length)} de {campaigns.length} campanhas
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="flex items-center space-x-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <span>Anterior</span>
                          </button>
                          
                          <span className="px-4 py-2 text-gray-900 dark:text-white">
                            {currentPage} de {totalPages}
                          </span>
                          
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="flex items-center space-x-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <span>Próximo</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>
            )}

            {/* Empty State */}
            {campaigns && campaigns.length === 0 && !campaignsLoading && (
              <div className="rounded-2xl bg-white/60 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200/40 dark:border-gray-800/40 p-8 text-center">
                <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Nenhuma campanha encontrada</div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">Crie a sua primeira campanha e comece a vender cotas facilmente.</div>
                <div className="flex justify-center">
                  <button 
                    onClick={handleCreateCampaign}
                    className="inline-flex items-center gap-2 bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-2 px-4 rounded-2xl font-semibold transition"
                  >
                    <Plus className="h-4 w-4" />
                    Criar campanha
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
