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
  Trash2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCampaigns } from '../hooks/useCampaigns';
import { Campaign } from '../types/campaign';
import CampaignCleanupStatus from '../components/CampaignCleanupStatus';

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
  const { campaigns, loading: campaignsLoading, deleteCampaign } = useCampaigns();

  // Check if payment is configured on component mount
  useEffect(() => {
    const isPaymentConfigured = localStorage.getItem('isPaymentConfigured');
    if (isPaymentConfigured) {
      try {
        const configured = JSON.parse(isPaymentConfigured);
        setDisplayPaymentSetupCard(!configured);
      } catch (error) {
        console.error('Error parsing payment configuration status:', error);
        setDisplayPaymentSetupCard(true);
      }
    }
  }, []);

  const handleConfigurePayment = () => {
    navigate('/dashboard/integrations');
  };

  const handleCreateCampaign = () => {
    navigate('/dashboard/create-campaign');
  };

  const handleEditCampaign = (campaignId: string) => {
    navigate(`/dashboard/create-campaign/step-2?id=${campaignId}`);
  };

  const handleDeleteCampaign = async (campaignId: string, campaignTitle: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a campanha "${campaignTitle}"?`)) {
      try {
        await deleteCampaign(campaignId);
      } catch (error) {
        console.error('Error deleting campaign:', error);
        alert('Erro ao excluir campanha. Tente novamente.');
      }
    }
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

        {/* Revenue Card */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center space-x-4 flex-1 min-w-0">
              <div className="text-3xl sm:text-4xl font-bold text-purple-600 dark:text-purple-400 flex-shrink-0">$</div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white transition-colors duration-300">
                  Total arrecadado
                </h3>
                <div className="flex items-center space-x-2">
                  {showRevenue ? (
                    <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                      R$ 0,00
                    </span>
                  ) : (
                    <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                      ★★★★★★★★
                    </span>
                  )}
                  <button
                    onClick={() => setShowRevenue(!showRevenue)}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors duration-200"
                  >
                    {showRevenue ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

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
                    {campaign.status === 'draft' && campaign.expires_at && (
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
                    
                    <div className="flex items-start space-x-4">
                      {/* Campaign Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={campaign.prize_image_urls?.[0] || 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1'}
                          alt={campaign.title}
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                        />
                      </div>

                      {/* Campaign Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white truncate pr-2">
                            {campaign.title}
                          </h4>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            {campaign.status === 'draft' && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                                Pendente
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                              {getStatusText(campaign.status)}
                            </span>
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
                        <div className="flex items-center space-x-2 mt-3">
                          <button
                            onClick={() => handleEditCampaign(campaign.id)}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                            title="Editar campanha"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteCampaign(campaign.id, campaign.title)}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                            title="Excluir campanha"
                          >
                            <Trash2 className="h-4 w-4" />
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

        {/* Campaign Cleanup Status - Only show for admin users or in development */}
        {(import.meta.env.DEV || user?.user_metadata?.is_admin) && (
          <CampaignCleanupStatus className="mt-8" />
        )}

        {/* Video Tutorial Section */}
        <div className="w-full max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
              Aprenda a criar uma rifa
            </h2>
            <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300 text-sm sm:text-base">
              Criamos um vídeo explicando todos os passos para você criar sua campanha
            </p>
          </div>
          
          <div className="relative bg-gray-900 rounded-lg overflow-hidden shadow-lg group cursor-pointer">
            {/* Video Thumbnail */}
            <div className="aspect-video bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center relative">
              <div className="absolute inset-0 bg-black/20"></div>
              
              {/* Play Button */}
              <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 bg-white/90 rounded-full flex items-center justify-center group-hover:bg-white transition-colors duration-200">
                <Play className="h-6 w-6 sm:h-8 sm:w-8 text-gray-900 ml-1" fill="currentColor" />
              </div>
              
              {/* Video Title Overlay */}
              <div className="absolute bottom-4 left-4 right-4 z-10">
                <h3 className="text-white font-semibold text-sm sm:text-lg mb-1">Como criar uma rifa online</h3>
                <p className="text-white/80 text-xs sm:text-sm">Rifaqui • 5:32</p>
              </div>
              
              {/* YouTube-style elements */}
              <div className="absolute top-4 right-4 z-10">
                <div className="bg-black/60 text-white text-xs px-2 py-1 rounded">
                  HD
                </div>
              </div>
            </div>
            
            {/* Video Info */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/32132123.png" 
                    alt="Rifaqui" 
                    className="w-4 h-4 sm:w-6 sm:h-6 object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white transition-colors duration-300 text-sm sm:text-base">
                    Tutorial completo: Como criar sua primeira rifa
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-300">
                    Rifaqui • 12.5K visualizações • há 2 dias
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;