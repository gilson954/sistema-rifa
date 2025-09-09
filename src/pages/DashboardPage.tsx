import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  EyeOff, 
  Plus, 
  Share2,
  Play,
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

  const handleViewCampaign = (campaignId: string) => {
    // Busca a campanha para obter o slug
    const campaign = campaigns.find(c => c.id === campaignId);
    if (campaign?.slug) {
      // Abre em nova aba para visualizar como usuário final
      window.open(`/c/${campaign.slug}`, '_blank');
    } else {
      // Fallback para ID se não houver slug
      window.open(`/c/${campaignId}`, '_blank');
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

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-gray-800 transition-colors duration-300 min-h-[calc(100vh-200px)]">
      <div className="space-y-6">
        {/* Payment Setup Card - Only show if payment is not configured */}
        {displayPaymentSetupCard && (
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 border border-purple-200 dark:border-purple-700/50 rounded-lg p-4 shadow-sm transition-colors duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center space-x-4 flex-1 min-w-0">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Share2 className="h-6 w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white transition-colors duration-300">
                    Forma de recebimento
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">
                    Você ainda não configurou uma forma para receber os pagamentos na sua conta
                  </p>
                </div>
              </div>
              <button 
                onClick={handleConfigurePayment}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors duration-200 w-full sm:w-auto"
              >
                Configurar
              </button>
            </div>
          </div>
        )}

        {/* Subscription Status Card */}
        <SubscriptionStatus className="shadow-sm" />
        {/* Create Campaign Button */}
        <div className="flex justify-center">
          <button 
            onClick={handleCreateCampaign}
            className="w-full sm:w-fit bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 sm:px-8 rounded-lg font-semibold text-lg flex items-center justify-center space-x-2 transition-colors duration-200 shadow-md"
          >
            <Plus className="h-6 w-6" />
            <span>Criar campanha</span>
          </button>
        </div>

        {/* Campaigns List */}
        {campaigns && campaigns.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Minhas Campanhas
            </h3>
            
            {campaignsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <div className="grid gap-4">
                {campaigns.map((campaign: Campaign) => (
                  <div
                    key={campaign.id}
                    className={`rounded-lg p-4 border hover:shadow-md transition-all duration-200 ${
                      campaign.status === 'draft' && campaign.expires_at && getTimeRemaining(campaign.expires_at).expired
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {/* Expiration Alert for Draft Campaigns */}
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

                    {/* Payment Success Alert for Paid Draft Campaigns */}
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
                    
                    <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
                      {/* Campaign Image */}
                      <div className="flex-shrink-0 order-first sm:order-none w-full sm:w-auto">
                        <img
                          src={campaign.prize_image_urls?.[0] || 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1'}
                          alt={campaign.title}
                          className="w-full h-32 sm:w-20 sm:h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                        />
                      </div>

                      {/* Campaign Content */}
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
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-300">
                              {campaign.sold_tickets}/{campaign.total_tickets} cotas
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-300">
                              {formatCurrency(campaign.ticket_price)}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-300">
                              {formatDate(campaign.created_at)}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              {formatCurrency(campaign.ticket_price * campaign.sold_tickets)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          <button
                            onClick={() => handleViewCampaign(campaign.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200 text-sm"
                          >
                            Visualizar
                          </button>
                          
                          {/* Publish Button - Only show for draft campaigns that are not paid */}
                          {campaign.status === 'draft' && !campaign.is_paid && (
                            <button
                              onClick={() => handlePublishCampaign(campaign.id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200 text-sm"
                            >
                              Publicar
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleEditCampaign(campaign.id)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200 text-sm"
                          >
                            Editar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}



export default DashboardPage;