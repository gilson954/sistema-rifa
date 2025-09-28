import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  Plus, 
  Share2,
  Calendar,
  Users,
  DollarSign,
  CreditCard as Edit,
  Clock,
  CheckCircle,
  LayoutDashboard,
  Trophy,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCampaigns } from '../hooks/useCampaigns';
import { Campaign } from '../types/campaign';
import { useAuth } from '../context/AuthContext';
import { CampaignAPI } from '../lib/api/campaigns';
import SubscriptionStatus from '../components/SubscriptionStatus';
import { supabase } from '../lib/supabase';

/* Helper to strip HTML tags from strings */
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

  useEffect(() => {
    if (!campaigns) return;
    const newTotalPages = Math.max(1, Math.ceil(campaigns.length / pageSize));
    if (currentPage > newTotalPages) {
      setCurrentPage(1);
    }
  }, [campaigns, pageSize]);

  useEffect(() => {
    const checkPaymentConfiguration = async () => {
      if (!user) {
        setDisplayPaymentSetupCard(true);
        return;
      }

      try {
        const localStorageValue = localStorage.getItem('isPaymentConfigured');
        if (localStorageValue) {
          const configured = JSON.parse(localStorageValue);
          setDisplayPaymentSetupCard(!configured);
        }

        const { PaymentsAPI } = await import('../lib/api/payments');
        const hasIntegration = await PaymentsAPI.hasPaymentIntegration(user.id);

        localStorage.setItem('isPaymentConfigured', JSON.stringify(hasIntegration));
        setDisplayPaymentSetupCard(!hasIntegration);
      } catch (error) {
        console.error('Error parsing payment configuration status:', error);
        setDisplayPaymentSetupCard(true);
      }
    };

    checkPaymentConfiguration();
  }, [user]);

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
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing campaigns:', error);
    } finally {
      setRefreshingCampaigns(false);
    }
  };

  const handleConfigurePayment = () => navigate('/dashboard/integrations');
  const handleCreateCampaign = () => navigate('/dashboard/create-campaign');
  const handleEditCampaign = (id: string) => navigate(`/dashboard/create-campaign/step-2?id=${id}`);
  const handlePublishCampaign = (id: string) => navigate(`/dashboard/create-campaign/step-3?id=${id}`);
  const handleViewSalesHistory = (id: string) => navigate(`/dashboard/campaigns/${id}/sales-history`);

  const handleViewCampaign = async (id: string) => {
    let campaignToView = campaigns.find(c => c.id === id);
    if (!campaignToView?.public_id) {
      const { data: fetchedCampaign, error } = await CampaignAPI.getCampaignById(id);
      if (error) {
        alert('Erro ao carregar detalhes da campanha.');
        return;
      }
      campaignToView = fetchedCampaign;
    }
    if (campaignToView?.public_id) {
      window.open(`/c/${campaignToView.public_id}`, '_blank');
    } else {
      alert('Não foi possível encontrar o ID público da campanha.');
    }
  };

  const calculateProgressPercentage = (sold: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((sold / total) * 100);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('pt-BR');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'draft': return 'Rascunho';
      case 'completed': return 'Finalizada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="dashboard-page min-h-screen bg-transparent text-gray-900 dark:text-white transition-colors duration-300 flex">
      {/* Sidebar */}
      <aside className="w-64 min-h-screen p-4 rounded-2xl shadow-sm border border-gray-200/20 dark:border-gray-800/30 bg-white/60 dark:bg-gray-900/50 backdrop-blur-sm">
        <nav className="flex flex-col gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium shadow
                             animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-purple-600 via-blue-500 to-indigo-600 hover:scale-105 transition">
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium shadow
                             animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:scale-105 transition">
            <Edit className="h-4 w-4" /> Pagamentos
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium shadow
                             animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 hover:scale-105 transition">
            <Trophy className="h-4 w-4" /> Ranking
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium shadow
                             animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 hover:scale-105 transition">
            <Users className="h-4 w-4" /> Afiliações
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium shadow
                             animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600 hover:scale-105 transition">
            <Settings className="h-4 w-4" /> Configurações
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Rifaqui</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Visão geral das suas campanhas</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateCampaign}
              className="inline-flex items-center gap-2 bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-full font-semibold shadow-sm transition transform hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              <span>Criar campanha</span>
            </button>

            <div className="hidden sm:flex items-center space-x-3">
              <button aria-label="Notificações" className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 transition">
                <svg className="h-5 w-5 text-gray-700 dark:text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>

              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                {(user?.email && user.email[0]?.toUpperCase()) || 'G'}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Setup Card */}
        {displayPaymentSetupCard && (
          <div className="mb-6">
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

        {/* Subscription Status */}
        <div className="mb-6">
          <div className="rounded-2xl p-4 shadow-sm border border-gray-200/20 dark:border-gray-800/30 bg-white/60 dark:bg-gray-900/50 backdrop-blur-sm">
            <SubscriptionStatus />
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
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">Pagamento Pendente</span>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                            {getStatusText(campaign.status)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <span>{campaign.total_tickets}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span>{campaign.sold_tickets}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span>{formatCurrency(campaign.ticket_price)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        <span>{campaign.draw_date ? formatDate(campaign.draw_date) : 'Sem data'}</span>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 mb-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full"
                        style={{ width: `${calculateProgressPercentage(campaign.sold_tickets, campaign.total_tickets)}%` }}
                      ></div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      <button
                        onClick={() => handleViewCampaign(campaign.id)}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-white text-sm font-medium shadow
                                   animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:scale-105 transition"
                      >
                        <Eye className="inline-block h-4 w-4 mr-1" /> Visualizar
                      </button>
                      <button
                        onClick={() => handleEditCampaign(campaign.id)}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-white text-sm font-medium shadow
                                   animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 hover:scale-105 transition"
                      >
                        <Edit className="inline-block h-4 w-4 mr-1" /> Editar
                      </button>
                      <button
                        onClick={() => handleViewSalesHistory(campaign.id)}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-white text-sm font-medium shadow
                                   animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 hover:scale-105 transition"
                      >
                        <DollarSign className="inline-block h-4 w-4 mr-1" /> Vendas
                      </button>
                      {campaign.status === 'draft' && (
                        <button
                          onClick={() => handlePublishCampaign(campaign.id)}
                          className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-white text-sm font-medium shadow
                                     animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600 hover:scale-105 transition"
                        >
                          Publicar
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        {paginatedCampaigns.length > 0 && (
          <div className="flex justify-center mt-6 space-x-2">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-800 disabled:opacity-50">Anterior</button>
            <span className="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-800">{currentPage} / {totalPages}</span>
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-800 disabled:opacity-50">Próximo</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
