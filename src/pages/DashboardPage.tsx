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
  TrendingUp,
  Sparkles
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

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-purple-900/20 py-8 px-4 sm:px-6 lg:px-8">
      <main className="max-w-7xl mx-auto space-y-6">
        
        {/* Payment Setup Card */}
        {displayPaymentSetupCard && (
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-700 dark:to-pink-700 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
            
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Share2 className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">Forma de recebimento</h3>
                  <p className="text-white/80 text-sm">Você ainda não configurou uma forma para receber os pagamentos na sua conta.</p>
                </div>
              </div>
              
              <button 
                onClick={handleConfigurePayment} 
                className="group px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2"
              >
                <span>Configurar</span>
                <Sparkles className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
              </button>
            </div>
          </div>
        )}

        {/* Create Campaign Button */}
        <div className="flex justify-center">
          <button
            onClick={handleCreateCampaign}
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
            <span>Criar campanha</span>
          </button>
        </div>

        {/* Campaigns Header */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Minhas Campanhas</h2>
            </div>
            <div className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{campaigns ? campaigns.length : 0} campanhas</span>
            </div>
          </div>
        </div>

        {/* Campaigns List */}
        {campaignsLoading ? (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-12">
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 dark:border-purple-900"></div>
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-purple-600 absolute top-0 left-0"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedCampaigns.length === 0 && (
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-12 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl">
                    <Plus className="h-12 w-12 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Nenhuma campanha encontrada</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Crie a sua primeira campanha e comece a vender cotas.</p>
                <button 
                  onClick={handleCreateCampaign} 
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <Plus className="h-5 w-5" />
                  <span>Criar campanha</span>
                </button>
              </div>
            )}

            {paginatedCampaigns.map((campaign: Campaign) => (
              <article
                key={campaign.id}
                className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border shadow-xl p-6 transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] ${
                  campaign.status === 'draft' && campaign.expires_at && getTimeRemaining(campaign.expires_at).expired
                    ? 'border-red-300 dark:border-red-800'
                    : 'border-gray-200/50 dark:border-gray-700/50'
                }`}
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Image */}
                  <img
                    src={campaign.prize_image_urls?.[0] || 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1'}
                    alt={stripHtml(campaign.title) || 'Prêmio'}
                    className="w-full md:w-40 h-48 md:h-40 object-cover rounded-2xl shadow-lg"
                  />

                  <div className="flex-1 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white flex-1">
                        {stripHtml(campaign.title)}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        {campaign.status === 'draft' && !campaign.is_paid && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                            Pendente
                          </span>
                        )}
                        {campaign.status === 'draft' && campaign.is_paid && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            Processando
                          </span>
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(campaign.status)}`}>
                          {getStatusText(campaign.status)}
                        </span>
                      </div>
                    </div>

                    {/* Alerts */}
                    {campaign.status === 'draft' && campaign.expires_at && !campaign.is_paid && (
                      <div>
                        {(() => {
                          const timeRemaining = getTimeRemaining(campaign.expires_at);
                          const isUrgent = !timeRemaining.expired && campaign.expires_at &&
                            new Date(campaign.expires_at).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000;
                          
                          return (
                            <div className={`flex items-center gap-3 p-4 rounded-xl ${
                              timeRemaining.expired
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                : isUrgent
                                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                            }`}>
                              <Clock className="h-5 w-5 flex-shrink-0" />
                              <span className="text-sm font-medium">
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
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                        <CheckCircle className="h-5 w-5 flex-shrink-0" />
                        <span className="text-sm font-medium flex-1">
                          Taxa paga - {campaign.status === 'active' ? 'Campanha ativa!' : 'Ativando campanha...'}
                        </span>
                        {campaign.status !== 'active' && (
                          <button
                            onClick={refreshCampaigns}
                            disabled={refreshingCampaigns}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition"
                          >
                            {refreshingCampaigns ? 'Atualizando...' : 'Atualizar'}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Progresso</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {calculateProgressPercentage(campaign.sold_tickets, campaign.total_tickets)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-500" 
                          style={{ width: `${calculateProgressPercentage(campaign.sold_tickets, campaign.total_tickets)}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50/30 dark:from-purple-900/20 dark:to-pink-900/10 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                          <Users className="h-4 w-4" />
                          <span className="text-xs font-medium">Cotas</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {campaign.sold_tickets}/{campaign.total_tickets}
                        </div>
                      </div>

                      <div className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50/30 dark:from-blue-900/20 dark:to-cyan-900/10 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="text-xs font-medium">Preço</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatCurrency(campaign.ticket_price)}
                        </div>
                      </div>

                      <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50/30 dark:from-green-900/20 dark:to-emerald-900/10 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-xs font-medium">Arrecadado</span>
                        </div>
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(campaign.ticket_price * campaign.sold_tickets)}
                        </div>
                      </div>

                      <div className="p-3 bg-gradient-to-br from-orange-50 to-amber-50/30 dark:from-orange-900/20 dark:to-amber-900/10 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                          <Calendar className="h-4 w-4" />
                          <span className="text-xs font-medium">Criada</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatDate(campaign.created_at)}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleViewCampaign(campaign.id)}
                        className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Visualizar</span>
                      </button>

                      <button
                        onClick={() => handleViewSalesHistory(campaign.id)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <DollarSign className="h-4 w-4" />
                        <span>Vendas</span>
                      </button>

                      {campaign.status === 'draft' && !campaign.is_paid && (
                        <button
                          onClick={() => handlePublishCampaign(campaign.id)}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          <Sparkles className="h-4 w-4" />
                          <span>Publicar</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleEditCampaign(campaign.id)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Editar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, campaigns.length)} de {campaigns.length} campanhas
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)} 
                  disabled={currentPage === 1} 
                  className="px-5 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 text-gray-900 dark:text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-300"
                >
                  Anterior
                </button>
                <div className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold shadow-lg">
                  {currentPage} de {totalPages}
                </div>
                <button 
                  onClick={() => handlePageChange(currentPage + 1)} 
                  disabled={currentPage === totalPages} 
                  className="px-5 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 text-gray-900 dark:text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-300"
                >
                  Próximo
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;