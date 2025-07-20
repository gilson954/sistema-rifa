import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  EyeOff, 
  Plus, 
  Share2,
  Play,
  Edit,
  MoreVertical,
  Calendar,
  DollarSign,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCampaigns } from '../hooks/useCampaigns';
import { Campaign } from '../types/campaign';

const DashboardPage = () => {
  const [showRevenue, setShowRevenue] = useState(false);
  const [displayPaymentSetupCard, setDisplayPaymentSetupCard] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('Em andamento');
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const navigate = useNavigate();
  const { campaigns, loading: campaignsLoading } = useCampaigns();

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
    navigate(`/dashboard/create-campaign?edit=${campaignId}`);
  };

  const handleViewCampaign = (campaignId: string) => {
    navigate(`/c/${campaignId}`);
  };

  const handlePublishCampaign = (campaignId: string) => {
    navigate(`/dashboard/create-campaign/step-3?id=${campaignId}`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
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
      case 'draft':
        return 'Rascunho';
      case 'active':
        return 'Ativa';
      case 'completed':
        return 'Finalizada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    switch (selectedFilter) {
      case 'Em andamento':
        return campaign.status === 'draft' || campaign.status === 'active';
      case 'Finalizadas':
        return campaign.status === 'completed';
      case 'Canceladas':
        return campaign.status === 'cancelled';
      default:
        return true;
    }
  });

  const calculateProgress = (campaign: Campaign) => {
    return Math.round((campaign.sold_tickets / campaign.total_tickets) * 100);
  };

  const calculateTimeRemaining = (campaign: Campaign) => {
    if (!campaign.draw_date) return null;
    
    const now = new Date();
    const drawDate = new Date(campaign.draw_date);
    const diff = drawDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expirado';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days} dias e ${hours} horas`;
    if (hours > 0) return `${hours} horas e ${minutes} minutos`;
    return `${minutes} minutos`;
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

        {/* Campaigns Section */}
        <div className="mt-8">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Minhas campanhas
              </h2>
            </div>
            
            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
              >
                <option value="Em andamento">Em andamento</option>
                <option value="Finalizadas">Finalizadas</option>
                <option value="Canceladas">Canceladas</option>
              </select>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Aqui estão suas campanhas criadas.
          </p>

          {/* Campaigns List */}
          {campaignsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Carregando campanhas...</span>
            </div>
          ) : filteredCampaigns.length > 0 ? (
            <div className="space-y-4">
              {filteredCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-200"
                >
                  {/* Campaign Header */}
                  <div className="relative">
                    {campaign.prize_image_url ? (
                      <img
                        src={campaign.prize_image_url}
                        alt={campaign.title}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-r from-purple-400 to-blue-500 flex items-center justify-center">
                        <span className="text-white text-6xl">🎁</span>
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {getStatusText(campaign.status)}
                      </span>
                    </div>

                    {/* Actions Menu */}
                    <div className="absolute top-4 right-4">
                      <div className="relative">
                        <button
                          onClick={() => setDropdownOpen(dropdownOpen === campaign.id ? null : campaign.id)}
                          className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        
                        {dropdownOpen === campaign.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                            <button
                              onClick={() => {
                                handleEditCampaign(campaign.id);
                                setDropdownOpen(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                            >
                              <Edit className="h-4 w-4" />
                              <span>Editar</span>
                            </button>
                            <button
                              onClick={() => {
                                handleViewCampaign(campaign.id);
                                setDropdownOpen(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                            >
                              <Eye className="h-4 w-4" />
                              <span>Visualizar</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Campaign Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {campaign.title}
                    </h3>
                    
                    {/* Progress Info */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span>{calculateProgress(campaign)}% de {campaign.total_tickets.toLocaleString('pt-BR')} cotas</span>
                        <span>{campaign.sold_tickets} vendidas</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${calculateProgress(campaign)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Campaign Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Valor por cota</span>
                        </div>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatCurrency(campaign.ticket_price)}
                        </span>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Criada em</span>
                        </div>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatDate(campaign.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Time Remaining (if draw_date is set) */}
                    {campaign.draw_date && campaign.status === 'active' && (
                      <div className="bg-red-500 text-white rounded-lg p-4 mb-4">
                        <div className="text-center">
                          <div className="font-semibold mb-1">Faça o pagamento em até</div>
                          <div className="text-lg font-bold">
                            {calculateTimeRemaining(campaign)}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      {campaign.status === 'draft' && (
                        <>
                          <button
                            onClick={() => handlePublishCampaign(campaign.id)}
                            className="flex-1 bg-gray-700 dark:bg-gray-600 hover:bg-gray-800 dark:hover:bg-gray-500 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                          >
                            <span>📢</span>
                            <span>PUBLICAR</span>
                          </button>
                          <button
                            onClick={() => handleViewCampaign(campaign.id)}
                            className="flex-1 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                          >
                            <Eye className="h-4 w-4" />
                            <span>VISUALIZAR DEMONSTRAÇÃO</span>
                          </button>
                        </>
                      )}
                      
                      {campaign.status === 'active' && (
                        <button
                          onClick={() => handleViewCampaign(campaign.id)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                        >
                          <Eye className="h-4 w-4" />
                          <span>VISUALIZAR CAMPANHA</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nenhuma campanha encontrada
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {selectedFilter === 'Em andamento' 
                  ? 'Você ainda não criou nenhuma campanha. Comece criando sua primeira!'
                  : `Você não possui campanhas ${selectedFilter.toLowerCase()}.`
                }
              </p>
              {selectedFilter === 'Em andamento' && (
                <button
                  onClick={handleCreateCampaign}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  Criar primeira campanha
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;