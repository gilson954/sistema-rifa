import React, { useState, useEffect } from 'react';
import {
  Eye,
  Plus,
  Share2,
  Calendar,
  Users,
  DollarSign,
  CreditCard as Edit,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCampaigns } from '../hooks/useCampaigns';
import { Campaign } from '../types/campaign';
import { useAuth } from '../context/AuthContext';
import { CampaignAPI } from '../lib/api/campaigns';
import SubscriptionStatus from '../components/SubscriptionStatus';
import { supabase } from '../lib/supabase';

/* Helper para remover HTML */
const stripHtml = (input?: string) => {
  if (!input) return '';
  return input.replace(/<[^>]*>/g, '').trim();
};

/* Calcular progresso */
const calculateProgressPercentage = (sold: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((sold / total) * 100);
};

/* Formatações */
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('pt-BR');

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
  const navigate = useNavigate();
  const { campaigns, loading: campaignsLoading } = useCampaigns();
  const { user } = useAuth();

  const [displayPaymentSetupCard, setDisplayPaymentSetupCard] = useState(true);
  const [refreshingCampaigns, setRefreshingCampaigns] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 5;
  const totalPages =
    campaigns && campaigns.length > 0
      ? Math.max(1, Math.ceil(campaigns.length / pageSize))
      : 1;
  const paginatedCampaigns = campaigns
    ? campaigns.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : [];

  useEffect(() => {
    if (!campaigns) return;
    const newTotalPages = Math.max(1, Math.ceil(campaigns.length / pageSize));
    if (currentPage > newTotalPages) setCurrentPage(1);
  }, [campaigns, pageSize]);

  // Verifica forma de recebimento
  useEffect(() => {
    const checkPaymentConfiguration = async () => {
      if (!user) {
        setDisplayPaymentSetupCard(true);
        return;
      }
      try {
        const { PaymentsAPI } = await import('../lib/api/payments');
        const hasIntegration = await PaymentsAPI.hasPaymentIntegration(user.id);
        setDisplayPaymentSetupCard(!hasIntegration);
      } catch {
        setDisplayPaymentSetupCard(true);
      }
    };
    checkPaymentConfiguration();
  }, [user]);

  // Atualização em tempo real das campanhas
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
          filter: `user_id=eq.${user.id}`,
        },
        () => refreshCampaigns()
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
    } finally {
      setRefreshingCampaigns(false);
    }
  };

  // Ações
  const handleConfigurePayment = () => navigate('/dashboard/integrations');
  const handleCreateCampaign = () => navigate('/dashboard/create-campaign');
  const handleEditCampaign = (id: string) =>
    navigate(`/dashboard/create-campaign/step-2?id=${id}`);
  const handlePublishCampaign = (id: string) =>
    navigate(`/dashboard/create-campaign/step-3?id=${id}`);
  const handleViewSalesHistory = (id: string) =>
    navigate(`/dashboard/campaigns/${id}/sales-history`);

  const handleViewCampaign = async (id: string) => {
    let campaignToView = campaigns.find((c) => c.id === id);
    if (!campaignToView?.public_id) {
      const { data: fetchedCampaign } = await CampaignAPI.getCampaignById(id);
      campaignToView = fetchedCampaign;
    }
    if (campaignToView?.public_id) {
      window.open(`/c/${campaignToView.public_id}`, '_blank');
    } else {
      alert('Não foi possível encontrar o ID público da campanha.');
    }
  };

  return (
    <div className="dashboard-page min-h-screen bg-transparent text-gray-900 dark:text-white transition-colors duration-300">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 1) Forma de recebimento */}
        {displayPaymentSetupCard && (
          <div className="mb-4">
            <div className="w-full rounded-2xl p-4 shadow-sm border border-gray-200/20 dark:border-gray-800/30 bg-white/60 dark:bg-gray-900/50 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center space-x-4 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-xl flex items-center justify-center shadow">
                    <Share2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-semibold">
                      Forma de recebimento
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Você ainda não configurou uma forma para receber os
                      pagamentos.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleConfigurePayment}
                  className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full font-medium transition"
                >
                  Configurar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2) Visão geral das campanhas */}
        <div className="mb-6">
          <div className="w-full rounded-2xl p-4 shadow-sm border border-gray-200/10 dark:border-gray-800/20 bg-white/6 dark:bg-gray-900/40 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Visão geral das suas campanhas
            </p>
            <button
              onClick={handleCreateCampaign}
              className="inline-flex items-center gap-2 animate-gradient-x bg-[length:200%_200%] bg-gradient-to-br from-purple-600 via-blue-500 to-indigo-600 text-white px-4 py-2 rounded-full font-semibold shadow-sm transition transform hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              Criar campanha
            </button>
          </div>
        </div>

        {/* 3) Status de assinatura */}
        <div className="mb-6">
          <div className="rounded-2xl p-4 shadow-sm border border-gray-200/20 dark:border-gray-800/30 bg-white/60 dark:bg-gray-900/50 backdrop-blur-sm">
            <SubscriptionStatus />
          </div>
        </div>

        {/* 4) Minhas campanhas */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Minhas Campanhas</h2>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {campaigns ? campaigns.length : 0} campanhas
          </div>
        </div>

        {/* Lista de campanhas */}
        {campaignsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedCampaigns.length === 0 && (
              <div className="rounded-2xl p-8 text-center border border-gray-200/20 dark:border-gray-800/30 bg-white/60 dark:bg-gray-900/50">
                <div className="text-lg font-semibold mb-2">
                  Nenhuma campanha encontrada
                </div>
                <div className="text-sm mb-4">
                  Crie a sua primeira campanha e comece a vender cotas.
                </div>
                <button
                  onClick={handleCreateCampaign}
                  className="inline-flex items-center gap-2 bg-gradient-to-br from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full font-semibold"
                >
                  <Plus className="h-4 w-4" /> Criar campanha
                </button>
              </div>
            )}

            <div className="grid gap-4">
              {paginatedCampaigns.map((campaign: Campaign) => (
                <article
                  key={campaign.id}
                  className={`rounded-2xl p-4 border transition-all duration-200 flex flex-col sm:flex-row gap-4 items-start
                    bg-white/6 dark:bg-gray-900/40 border-gray-200/10 dark:border-gray-700/20`}
                >
                  <img
                    src={
                      campaign.prize_image_urls?.[0] ||
                      'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1'
                    }
                    alt={stripHtml(campaign.title) || 'Prêmio'}
                    className="w-full sm:w-28 h-40 sm:h-28 object-cover rounded-lg shadow-sm border border-gray-200/10 dark:border-gray-700/20"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-base sm:text-lg font-semibold truncate">
                        {stripHtml(campaign.title)}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          campaign.status
                        )}`}
                      >
                        {getStatusText(campaign.status)}
                      </span>
                    </div>

                    {/* Progresso */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Progresso
                        </span>
                        <span className="text-sm font-medium">
                          {calculateProgressPercentage(
                            campaign.sold_tickets,
                            campaign.total_tickets
                          )}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 sm:h-2">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-blue-600 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${calculateProgressPercentage(
                              campaign.sold_tickets,
                              campaign.total_tickets
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Infos */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {campaign.sold_tickets}/{campaign.total_tickets} cotas
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        {formatCurrency(campaign.ticket_price)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(campaign.created_at)}
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        {formatCurrency(
                          campaign.ticket_price * campaign.sold_tickets
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="grid grid-cols-2 sm:flex gap-2 mt-4">
                      <button
                        onClick={() => handleViewCampaign(campaign.id)}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white text-sm font-medium animate-gradient-x bg-gradient-to-r from-purple-600 via-blue-500 to-indigo-600"
                      >
                        <Eye className="h-4 w-4" /> Visualizar
                      </button>
                      <button
                        onClick={() => handleViewSalesHistory(campaign.id)}
                        className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium"
                      >
                        Vendas
                      </button>
                      {campaign.status === 'draft' && (
                        <button
                          onClick={() => handlePublishCampaign(campaign.id)}
                          className="px-3 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium"
                        >
                          Publicar
                        </button>
                      )}
                      <button
                        onClick={() => handleEditCampaign(campaign.id)}
                        className="px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 text-white text-sm font-medium"
                      >
                        <Edit className="h-4 w-4 mr-2" /> Editar
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-3">
                <div className="text-sm">
                  Mostrando {(currentPage - 1) * pageSize + 1} a{' '}
                  {Math.min(currentPage * pageSize, campaigns.length)} de{' '}
                  {campaigns.length} campanhas
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <div className="px-4 py-2 text-sm font-medium">
                    {currentPage} de {totalPages}
                  </div>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-50"
                  >
                    Próximo
                  </button>
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
