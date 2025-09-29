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
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCampaigns } from '../hooks/useCampaigns';
import { Campaign } from '../types/campaign';
import { useAuth } from '../context/AuthContext';
import { CampaignAPI } from '../lib/api/campaigns';
import { supabase } from '../lib/supabase';

/* Helper to strip HTML tags from strings (defensive: avoids showing raw HTML) */
const stripHtml = (input?: string) => {
  if (!input) return '';
  return input.replace(/<[^>]*>/g, '').trim();
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
      // Force refresh campaigns by reloading ou re-fetching
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
        alert('Erro ao carregar detalhes da campanha.');
        return;
      }
      campaignToView = fetchedCampaign;
    }

    if (campaignToView?.public_id) {
      // Abre em nova aba para visualizar como usuário final
      window.open(`/c/${campaignToView.public_id}`, '_blank');
    } else {
      alert('Não foi possível encontrar o ID público da campanha.');
    }
  };

  // Paginação handler
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="dashboard-page min-h-screen bg-transparent text-gray-900 dark:text-white transition-colors duration-300">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 1) Payment Setup Card - permanece primeiro */}
        {displayPaymentSetupCard && (
          <div className="mb-4">
            <div className="w-full rounded-2xl p-4 shadow-sm border border-gray-200/20 dark:border-gray-800/30 bg-white/60 dark:bg-gray-900/50 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center space-x-4 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow">
                    <Share2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Forma de recebimento</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Você ainda não configurou uma forma para receber os pagamentos na sua conta.</p>
                  </div>
                </div>

                <div className="flex-shrink-0 w-full sm:w-auto">
                  <button onClick={handleConfigurePayment} className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full font-medium transition">
                    Configurar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2) "Visão geral das suas campanhas" - barra com botão "+ Criar campanha" dentro */}
        <div className="mb-6">
          <div className="w-full rounded-2xl p-4 shadow-sm border border-gray-200/10 dark:border-gray-800/20 bg-white/6 dark:bg-gray-900/40 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm text-gray-600 dark:text-gray-300 truncate">Visão geral das suas campanhas</p>
            </div>

            {/* Botão dentro da barra (lado direito) */}
            <div className="flex-shrink-0">
              <button
                onClick={handleCreateCampaign}
                className="inline-flex items-center gap-2 animate-gradient-x bg-[length:200%_200%] bg-gradient-to-br from-purple-600 via-blue-500 to-indigo-600 text-white px-4 py-2 rounded-full font-semibold shadow-sm transition transform hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4" />
                <span>Criar campanha</span>
              </button>
            </div>
          </div>
        </div>

        {/* Campaigns header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Minhas Campanhas</h2>
          <div className="text-sm text-gray-600 dark:text-gray-300">{campaigns ? campaigns.length : 0} campanhas</div>
        </div>

        {/* Campaigns list */}
        {campaignsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedCampaigns.length === 0 && (
              <div className="rounded-2xl p-8 text-center border border-gray-200/20 dark:border-gray-800/30 bg-white/60 dark:bg-gray-900/50">
                <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Nenhuma campanha encontrada</div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">Crie a sua primeira campanha e comece a vender cotas.</div>
                <div className="flex justify-center">
                  <button onClick={handleCreateCampaign} className="inline-flex items-center gap-2 bg-gradient-to-br from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full font-semibold">
                    <Plus className="h-4 w-4" /> Criar campanha
                  </button>
                </div>
              </div>
            )}

            <div className="grid gap-4">
              {paginatedCampaigns.map((campaign: Campaign) => (
                <article
                  key={campaign.id}
                  className={`rounded-2xl p-4 border transition-all duration-200 flex flex-col sm:flex-row gap-4 items-start ${
                    campaign.status === 'draft' && campaign.expires_at && getTimeRemaining(campaign.expires_at).expired
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : 'bg-white/6 dark:bg-gray-900/40 border-gray-200/10 dark:border-gray-700/20'
                  }`}
                >
                  {/* Image (top on mobile, left on desktop) */}
                  <img
                    src={campaign.prize_image_urls?.[0] || 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1'}
                    alt={stripHtml(campaign.title) || 'Prêmio'}
                    className="w-full sm:w-28 h-40 sm:h-28 object-cover rounded-lg shadow-sm border border-gray-200/10 dark:border-gray-700/20 flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 pr-4">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {stripHtml(campaign.title)}
                        </h3>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          {campaign.status === 'draft' && !campaign.is_paid && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">Pendente</span>
                          )}

                          {campaign.status === 'draft' && campaign.is_paid && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Processando</span>
                          )}

                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
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

                    {/* Progress */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Progresso</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{calculateProgressPercentage(campaign.sold_tickets, campaign.total_tickets)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 sm:h-2">
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 h-1.5 sm:h-2 rounded-full transition-all duration-300" style={{ width: `${calculateProgressPercentage(campaign.sold_tickets, campaign.total_tickets)}%` }} />
                      </div>
                    </div>

                    {/* Compact info grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-2 truncate">
                        <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="truncate">{campaign.sold_tickets}/{campaign.total_tickets} cotas</span>
                      </div>
                      
                      <div className="flex items-center gap-2 truncate">
                        <DollarSign className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="truncate">{formatCurrency(campaign.ticket_price)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 truncate">
                        <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="truncate">{formatDate(campaign.created_at)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 truncate">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span className="text-green-600 dark:text-green-400 font-medium truncate">{formatCurrency(campaign.ticket_price * campaign.sold_tickets)}</span>
                      </div>
                    </div>

                    {/* Actions: grid on mobile, inline on desktop */}
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mt-4">
                      <button
                        onClick={() => handleViewCampaign(campaign.id)}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white text-sm font-medium shadow transition transform hover:-translate-y-0.5
                                   animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-purple-600 via-blue-500 to-indigo-600"
                        aria-label={`Visualizar ${stripHtml(campaign.title)}`}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">Visualizar</span>
                      </button>
                      
                      <button
                        onClick={() => handleViewSalesHistory(campaign.id)}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow transition flex items-center justify-center gap-1"
                      >
                        <DollarSign className="h-4 w-4" /> Vendas
                      </button>
                      
                      {campaign.status === 'draft' && !campaign.is_paid && (
                        <button
                          onClick={() => handlePublishCampaign(campaign.id)}
                          className="px-3 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 animate-gradient-x text-white text-sm font-medium shadow transition"
                        >
                          Publicar
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleEditCampaign(campaign.id)}
                        className="px-3 py-2 rounded-lg text-white text-sm font-medium shadow transition animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600"
                      >
                        <Edit className="h-4 w-4 inline-block mr-2" /> Editar
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-3">
                <div className="text-sm text-gray-700 dark:text-gray-300">Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, campaigns.length)} de {campaigns.length} campanhas</div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="pagination-button px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200/10 dark:border-gray-700/20 text-sm font-medium disabled:opacity-50">Anterior</button>
                  <div className="px-4 py-2 bg-white/6 dark:bg-gray-800/30 rounded-lg">{currentPage} de {totalPages}</div>
                  <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="pagination-button px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200/10 dark:border-gray-700/20 text-sm font-medium disabled:opacity-50">Próximo</button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
