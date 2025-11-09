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
  ArrowUpDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCampaigns } from '../hooks/useCampaigns';
import { Campaign } from '../types/campaign';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { CampaignAPI } from '../lib/api/campaigns';
import { supabase } from '../lib/supabase';
import CotasPremiadasAdminModal from '../components/CotasPremiadasAdminModal';
import MaiorMenorCotaModal from '../components/MaiorMenorCotaModal';
import BuyerContactModal from '../components/BuyerContactModal';
import TopBuyersModal from '../components/TopBuyersModal';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [showMaiorMenorCotaModal, setShowMaiorMenorCotaModal] = useState(false);
  const [selectedCampaignForMaiorMenor, setSelectedCampaignForMaiorMenor] = useState<Campaign | null>(null);
  const [showBuyerContactModal, setShowBuyerContactModal] = useState(false);
  const [selectedBuyerData, setSelectedBuyerData] = useState<any>(null);
  const [showTopBuyersModal, setShowTopBuyersModal] = useState(false);
  const [selectedCampaignForRanking, setSelectedCampaignForRanking] = useState<Campaign | null>(null);

  // Detect mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    let campaignToView = campaigns.find(c => c.id === campaignId);

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

  const handleOpenMaiorMenorCota = (campaign: Campaign) => {
    setSelectedCampaignForMaiorMenor(campaign);
    setShowMaiorMenorCotaModal(true);
  };

  const handleOpenRanking = (campaign: Campaign) => {
    setSelectedCampaignForRanking(campaign);
    setShowTopBuyersModal(true);
  };

  const handleCloseRankingModal = () => {
    setShowTopBuyersModal(false);
    setSelectedCampaignForRanking(null);
  };

  const handleViewBuyerFromRanking = (buyer: any) => {
    setSelectedBuyerData({
      id: buyer.customer_phone,
      quota_number: 0,
      customer_name: buyer.customer_name,
      customer_email: buyer.customer_email,
      customer_phone: buyer.customer_phone,
      bought_at: new Date().toISOString(),
      total_value: buyer.total_spent,
      ticket_count: buyer.ticket_count,
    });
    setShowBuyerContactModal(true);
    setShowTopBuyersModal(false);
  };

  const handleCloseMaiorMenorCotaModal = () => {
    setShowMaiorMenorCotaModal(false);
    setSelectedCampaignForMaiorMenor(null);
  };

  const handleViewBuyerDetails = (ticketData: any) => {
    setSelectedBuyerData(ticketData);
    setShowBuyerContactModal(true);
  };

  const handleCloseBuyerContactModal = () => {
    setShowBuyerContactModal(false);
    setSelectedBuyerData(null);
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
      <style>{`
        @media (max-width: 640px) {
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          ::-webkit-scrollbar-track {
            background: linear-gradient(to bottom, rgba(139, 92, 246, 0.05), rgba(59, 130, 246, 0.05));
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #7928CA 0%, #FF0080 50%, #007CF0 100%);
            border-radius: 10px;
            border: 2px solid transparent;
            background-clip: padding-box;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, #8b35d1 0%, #ff1a8f 50%, #0088ff 100%);
          }
        }
        @media (min-width: 641px) {
          ::-webkit-scrollbar {
            width: 12px;
            height: 12px;
          }
          ::-webkit-scrollbar-track {
            background: linear-gradient(to bottom, rgba(139, 92, 246, 0.08), rgba(59, 130, 246, 0.08));
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #7928CA 0%, #FF0080 50%, #007CF0 100%);
            border-radius: 10px;
            border: 3px solid transparent;
            background-clip: padding-box;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, #8b35d1 0%, #ff1a8f 50%, #0088ff 100%);
            box-shadow: 0 0 10px rgba(121, 40, 202, 0.5);
          }
        }
        * {
          scrollbar-width: thin;
          scrollbar-color: #7928CA rgba(139, 92, 246, 0.1);
        }
      `}</style>
      
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: isMobile ? '12px' : '32px 24px' }}>
        <AnimatePresence>
          {displayPaymentSetupCard && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              style={{ marginBottom: isMobile ? '16px' : '24px' }}
            >
              <div className="relative overflow-hidden w-full rounded-xl sm:rounded-2xl shadow-lg border border-purple-200/30 dark:border-purple-800/30 bg-gradient-to-br from-purple-50/80 to-blue-50/80 dark:from-purple-900/20 dark:to-blue-900/20 backdrop-blur-sm hover:shadow-xl transition-all duration-300"
                style={{ padding: isMobile ? '16px' : '24px' }}>
                <div className="absolute top-0 right-0 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-3xl"
                  style={{ width: isMobile ? '120px' : '160px', height: isMobile ? '120px' : '160px' }}></div>
                <div className="absolute bottom-0 left-0 bg-gradient-to-tr from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
                  style={{ width: isMobile ? '96px' : '128px', height: isMobile ? '96px' : '128px' }}></div>
                
                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between"
                  style={{ gap: isMobile ? '12px' : '16px' }}>
                  <div className="flex items-start sm:items-center flex-1 min-w-0"
                    style={{ gap: isMobile ? '12px' : '16px' }}>
                    <motion.div 
                      className="bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
                      style={{ width: isMobile ? '40px' : '56px', height: isMobile ? '40px' : '56px' }}
                      whileHover={{ scale: 1.1, rotate: 10 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Sparkles style={{ width: isMobile ? '18px' : '24px', height: isMobile ? '18px' : '24px' }} />
                    </motion.div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white"
                        style={{ fontSize: isMobile ? '15px' : '18px', marginBottom: isMobile ? '2px' : '4px' }}>
                        Forma de recebimento
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300"
                        style={{ fontSize: isMobile ? '12px' : '14px' }}>
                        Você ainda não configurou uma forma para receber os pagamentos na sua conta.
                      </p>
                    </div>
                  </div>

                  <div className="flex-shrink-0 w-full sm:w-auto">
                    <motion.button 
                      onClick={handleConfigurePayment} 
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl font-semibold shadow-lg transition-all duration-300 hover:shadow-xl animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 text-white"
                      style={{ padding: isMobile ? '10px 20px' : '12px 24px', fontSize: isMobile ? '13px' : '15px' }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Share2 style={{ width: isMobile ? '16px' : '20px', height: isMobile ? '16px' : '20px' }} />
                      Configurar agora
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          style={{ marginBottom: isMobile ? '16px' : '24px', display: 'flex', justifyContent: 'center' }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <motion.button
            onClick={handleCreateCampaign}
            className="inline-flex items-center gap-2 rounded-2xl font-bold shadow-xl transition-all duration-300 transform hover:shadow-2xl animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-[#7928CA] via-[#FF0080] via-[#007CF0] to-[#FF8C00] text-white"
            style={{ padding: isMobile ? '12px 24px' : '16px 32px', fontSize: isMobile ? '15px' : '18px' }}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus style={{ width: isMobile ? '18px' : '24px', height: isMobile ? '18px' : '24px' }} />
            <span>Criar campanha</span>
          </motion.button>
        </motion.div>

        <motion.div 
          className="flex items-center justify-between" 
          style={{ marginBottom: isMobile ? '16px' : '24px' }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h2 className="font-bold text-gray-900 dark:text-white"
            style={{ fontSize: isMobile ? '18px' : '24px' }}>
            Minhas Campanhas
          </h2>
          <motion.div 
            className="rounded-xl bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 border border-purple-200/30 dark:border-purple-800/30"
            style={{ padding: isMobile ? '6px 12px' : '8px 16px' }}
            whileHover={{ scale: 1.05 }}
          >
            <span className="font-bold text-purple-900 dark:text-purple-100"
              style={{ fontSize: isMobile ? '11px' : '14px' }}>
              {campaigns ? campaigns.length : 0} campanhas
            </span>
          </motion.div>
        </motion.div>

        {campaignsLoading ? (
          <motion.div 
            className="flex items-center justify-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="animate-spin rounded-full border-b-2 border-purple-600"
              style={{ width: isMobile ? '40px' : '48px', height: isMobile ? '40px' : '48px' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '16px' }}>
            <AnimatePresence mode="wait">
              {paginatedCampaigns.length === 0 && (
                <motion.div 
                  className="rounded-2xl text-center border border-gray-200/20 dark:border-gray-800/30 bg-white/60 dark:bg-gray-900/50"
                  style={{ padding: isMobile ? '24px' : '40px' }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="font-bold text-gray-900 dark:text-white"
                    style={{ fontSize: isMobile ? '16px' : '20px', marginBottom: '8px' }}>
                    Nenhuma campanha encontrada
                  </div>
                  <div className="text-gray-600 dark:text-gray-300"
                    style={{ fontSize: isMobile ? '12px' : '14px', marginBottom: isMobile ? '16px' : '24px' }}>
                    Crie a sua primeira campanha e comece a vender cotas.
                  </div>
                  <div className="flex justify-center">
                    <motion.button 
                      onClick={handleCreateCampaign}
                      className="inline-flex items-center gap-2 rounded-xl font-bold shadow-lg transition-all duration-300 bg-gradient-to-br from-purple-600 to-blue-600 text-white"
                      style={{ padding: isMobile ? '10px 20px' : '12px 24px', fontSize: isMobile ? '13px' : '15px' }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Plus style={{ width: isMobile ? '16px' : '20px', height: isMobile ? '16px' : '20px' }} /> Criar campanha
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="popLayout">
              {paginatedCampaigns.map((campaign: Campaign, index: number) => (
                <motion.article
                  key={campaign.id}
                  className={`rounded-2xl border transition-all duration-300 hover:shadow-lg flex flex-col ${
                    campaign.status === 'draft' && campaign.expires_at && getTimeRemaining(campaign.expires_at).expired
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : 'bg-white/70 dark:bg-gray-900/60 border-gray-200/20 dark:border-gray-700/30 backdrop-blur-sm'
                  }`}
                  style={{ padding: isMobile ? '12px' : '20px', gap: isMobile ? '12px' : '20px' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: index * 0.1,
                    ease: "easeOut"
                  }}
                  layout
                  whileHover={{ 
                    scale: 1.01,
                    boxShadow: "0 10px 30px rgba(121, 40, 202, 0.15)"
                  }}
                >
                  <motion.img
                    src={campaign.prize_image_urls?.[0] || 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1'}
                    alt={stripHtml(campaign.title) || 'Prêmio'}
                    className="w-full object-cover rounded-xl shadow-md border border-gray-200/20 dark:border-gray-700/30"
                    style={{ height: isMobile ? '140px' : '192px' }}
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.3 }}
                  />

                  <div className="flex-1 min-w-0">
                    <motion.div 
                      className="flex items-start justify-between" 
                      style={{ marginBottom: isMobile ? '8px' : '12px' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="min-w-0 flex-1" style={{ paddingRight: isMobile ? '8px' : '16px' }}>
                        <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2"
                          style={{ fontSize: isMobile ? '14px' : '20px' }}>
                          {stripHtml(campaign.title)}
                        </h3>
                      </div>

                      <div className="flex flex-col items-end flex-shrink-0" style={{ gap: isMobile ? '6px' : '8px' }}>
                        <div className="flex flex-wrap items-center justify-end" style={{ gap: isMobile ? '6px' : '8px' }}>
                          {campaign.is_featured && (
                            <span className="rounded-full font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 flex items-center gap-1 whitespace-nowrap"
                              style={{ padding: isMobile ? '3px 8px' : '4px 12px', fontSize: '11px' }}>
                              <Star style={{ width: '12px', height: '12px' }} className="fill-current" />
                              {!isMobile && 'Destaque'}
                            </span>
                          )}

                          {campaign.status === 'draft' && !campaign.is_paid && (
                            <span className="rounded-full font-semibold bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 whitespace-nowrap"
                              style={{ padding: isMobile ? '3px 8px' : '4px 12px', fontSize: '11px' }}>
                              Pendente
                            </span>
                          )}

                          {campaign.status === 'draft' && campaign.is_paid && (
                            <span className="rounded-full font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 whitespace-nowrap"
                              style={{ padding: isMobile ? '3px 8px' : '4px 12px', fontSize: '11px' }}>
                              Processando
                            </span>
                          )}

                          <span className={`rounded-full font-semibold whitespace-nowrap ${getStatusColor(campaign.status)}`}
                            style={{ padding: isMobile ? '3px 8px' : '4px 12px', fontSize: '11px' }}>
                            {getStatusText(campaign.status)}
                          </span>
                        </div>
                      </div>
                    </motion.div>

                    {campaign.status === 'draft' && campaign.expires_at && !campaign.is_paid && (
                      <div style={{ marginBottom: isMobile ? '8px' : '12px' }}>
                        {(() => {
                          const timeRemaining = getTimeRemaining(campaign.expires_at);
                          const isUrgent = !timeRemaining.expired && campaign.expires_at &&
                            new Date(campaign.expires_at).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000;
                          
                          return (
                            <div className={`flex items-center rounded-xl font-medium ${
                              timeRemaining.expired
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                : isUrgent
                                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                            }`}
                            style={{ padding: isMobile ? '8px' : '12px', gap: '8px', fontSize: isMobile ? '11px' : '13px' }}>
                              <Clock style={{ width: isMobile ? '16px' : '20px', height: isMobile ? '16px' : '20px' }} className="flex-shrink-0" />
                              <span className="line-clamp-2">
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
                      <div style={{ marginBottom: isMobile ? '8px' : '12px' }}>
                        <div className="flex items-center rounded-xl font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                          style={{ padding: isMobile ? '8px' : '12px', gap: '8px', fontSize: isMobile ? '11px' : '13px' }}>
                          <CheckCircle style={{ width: isMobile ? '16px' : '20px', height: isMobile ? '16px' : '20px' }} className="flex-shrink-0" />
                          <span className="flex-1">
                            Taxa paga - {campaign.status === 'active' ? 'Campanha ativa!' : 'Ativando campanha...'}
                          </span>
                          {campaign.status !== 'active' && (
                            <button
                              onClick={refreshCampaigns}
                              disabled={refreshingCampaigns}
                              className="bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition flex-shrink-0"
                              style={{ fontSize: '11px', padding: '4px 12px' }}
                            >
                              {refreshingCampaigns ? 'Atualizando...' : 'Atualizar'}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    <div style={{ marginBottom: isMobile ? '12px' : '16px' }}>
                      <div className="flex items-center justify-between" style={{ marginBottom: isMobile ? '6px' : '8px' }}>
                        <span className="font-medium text-gray-600 dark:text-gray-400"
                          style={{ fontSize: isMobile ? '11px' : '13px' }}>
                          Progresso
                        </span>
                        <span className="font-bold text-gray-900 dark:text-white"
                          style={{ fontSize: isMobile ? '11px' : '13px' }}>
                          {calculateProgressPercentage(campaign.sold_tickets, campaign.total_tickets)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
                        style={{ height: isMobile ? '6px' : '10px' }}>
                        <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 rounded-full transition-all duration-500 animate-gradient-x bg-[length:200%_200%]"
                          style={{ 
                            width: `${calculateProgressPercentage(campaign.sold_tickets, campaign.total_tickets)}%`,
                            height: isMobile ? '6px' : '10px'
                          }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2"
                      style={{ gap: isMobile ? '8px' : '12px', marginBottom: isMobile ? '12px' : '16px' }}>
                      <div className="flex items-center rounded-lg bg-gray-50 dark:bg-gray-800/50"
                        style={{ gap: isMobile ? '6px' : '8px', padding: isMobile ? '6px' : '8px' }}>
                        <Users style={{ width: isMobile ? '14px' : '16px', height: isMobile ? '14px' : '16px' }} 
                          className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
                        <span className="font-medium text-gray-900 dark:text-white truncate"
                          style={{ fontSize: isMobile ? '11px' : '13px' }}>
                          {formatNumber(campaign.sold_tickets)}/{formatNumber(campaign.total_tickets)}
                        </span>
                      </div>
                      
                      <div className="flex items-center rounded-lg bg-gray-50 dark:bg-gray-800/50"
                        style={{ gap: isMobile ? '6px' : '8px', padding: isMobile ? '6px' : '8px' }}>
                        <DollarSign style={{ width: isMobile ? '14px' : '16px', height: isMobile ? '14px' : '16px' }} 
                          className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <span className="font-medium text-gray-900 dark:text-white truncate"
                          style={{ fontSize: isMobile ? '11px' : '13px' }}>
                          {formatCurrency(campaign.ticket_price)}
                        </span>
                      </div>
                      
                      <div className="flex items-center rounded-lg bg-gray-50 dark:bg-gray-800/50"
                        style={{ gap: isMobile ? '6px' : '8px', padding: isMobile ? '6px' : '8px' }}>
                        <Calendar style={{ width: isMobile ? '14px' : '16px', height: isMobile ? '14px' : '16px' }} 
                          className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                        <span className="font-medium text-gray-900 dark:text-white truncate"
                          style={{ fontSize: isMobile ? '11px' : '13px' }}>
                          {formatDate(campaign.created_at)}
                        </span>
                      </div>
                      
                      <div className="flex items-center rounded-lg bg-green-50 dark:bg-green-900/30"
                        style={{ gap: isMobile ? '6px' : '8px', padding: isMobile ? '6px' : '8px' }}>
                        <DollarSign style={{ width: isMobile ? '14px' : '16px', height: isMobile ? '14px' : '16px' }} 
                          className="text-green-600 dark:text-green-400 flex-shrink-0" />
                        <span className="text-green-600 dark:text-green-400 font-bold truncate"
                          style={{ fontSize: isMobile ? '11px' : '13px' }}>
                          {formatCurrency(campaign.ticket_price * campaign.sold_tickets)}
                        </span>
                      </div>
                    </div>

                    <motion.div 
                      className="grid"
                      style={{ 
                        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: isMobile ? '6px' : '8px'
                      }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <motion.button
                        onClick={() => handleViewCampaign(campaign.id)}
                        className="flex items-center justify-center rounded-xl text-white font-bold shadow-md transition-all duration-300 transform animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-purple-600 via-blue-500 to-indigo-600"
                        style={{ gap: isMobile ? '4px' : '6px', padding: isMobile ? '8px' : '10px 16px', fontSize: isMobile ? '11px' : '13px' }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Eye style={{ width: isMobile ? '14px' : '16px', height: isMobile ? '14px' : '16px' }} />
                        <span>Visualizar</span>
                      </motion.button>

                      <motion.button
                        onClick={() => handleViewSalesHistory(campaign.id)}
                        className="flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md transition-all duration-300"
                        style={{ gap: isMobile ? '4px' : '6px', padding: isMobile ? '8px' : '10px 16px', fontSize: isMobile ? '11px' : '13px' }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <DollarSign style={{ width: isMobile ? '14px' : '16px', height: isMobile ? '14px' : '16px' }} />
                        <span>Vendas</span>
                      </motion.button>

                      <motion.button
                        onClick={() => handleOpenRanking(campaign)}
                        className="flex items-center justify-center rounded-xl bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:shadow-lg text-white font-bold shadow-md transition-all duration-300 animate-gradient-x bg-[length:200%_200%]"
                        style={{ gap: isMobile ? '4px' : '6px', padding: isMobile ? '8px' : '10px 16px', fontSize: isMobile ? '11px' : '13px' }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Trophy style={{ width: isMobile ? '14px' : '16px', height: isMobile ? '14px' : '16px' }} />
                        <span>Ranking</span>
                      </motion.button>

                      {campaign.campaign_model === 'automatic' && (
                        <motion.button
                          onClick={() => handleManageCotasPremiadas(campaign)}
                          className="flex items-center justify-center rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-md transition-all duration-300"
                          style={{ gap: isMobile ? '4px' : '6px', padding: isMobile ? '8px' : '10px 16px', fontSize: isMobile ? '11px' : '13px' }}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Award style={{ width: isMobile ? '14px' : '16px', height: isMobile ? '14px' : '16px' }} />
                          <span>{isMobile ? 'Premiadas' : 'Cotas Premiadas'}</span>
                        </motion.button>
                      )}

                      {campaign.status === 'active' && (
                        <motion.button
                          onClick={() => handleOpenMaiorMenorCota(campaign)}
                          className="flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md transition-all duration-300"
                          style={{ gap: isMobile ? '4px' : '6px', padding: isMobile ? '8px' : '10px 16px', fontSize: isMobile ? '11px' : '13px' }}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <ArrowUpDown style={{ width: isMobile ? '14px' : '16px', height: isMobile ? '14px' : '16px' }} />
                          <span>{isMobile ? 'M/M' : 'Maior/Menor'}</span>
                        </motion.button>
                      )}

                      {(campaign.status === 'active' || campaign.status === 'completed') && (
                        <motion.button
                          onClick={() => handleToggleFeatured(campaign.id, campaign.is_featured)}
                          disabled={togglingFeatured === campaign.id}
                          className={`flex items-center justify-center rounded-xl text-white font-bold shadow-md transition-all duration-300 ${
                            campaign.is_featured
                              ? 'bg-yellow-500 hover:bg-yellow-600'
                              : 'bg-gray-600 hover:bg-gray-700'
                          } ${togglingFeatured === campaign.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          style={{ gap: isMobile ? '4px' : '6px', padding: isMobile ? '8px' : '10px 16px', fontSize: isMobile ? '11px' : '13px' }}
                          whileHover={{ scale: togglingFeatured === campaign.id ? 1 : 1.05, y: togglingFeatured === campaign.id ? 0 : -2 }}
                          whileTap={{ scale: togglingFeatured === campaign.id ? 1 : 0.95 }}
                        >
                          <Star style={{ width: isMobile ? '14px' : '16px', height: isMobile ? '14px' : '16px' }} 
                            className={campaign.is_featured ? 'fill-current' : ''} />
                          <span>{isMobile ? '★' : (campaign.is_featured ? 'Destacada' : 'Destacar')}</span>
                        </motion.button>
                      )}

                      {campaign.status === 'active' && !campaign.drawn_at && (
                        <motion.button
                          onClick={() => handleRealizarSorteio(campaign.id)}
                          className="flex items-center justify-center rounded-xl text-white font-bold shadow-md transition-all duration-300 animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500"
                          style={{ 
                            gap: isMobile ? '4px' : '6px', 
                            padding: isMobile ? '8px' : '10px 16px', 
                            fontSize: isMobile ? '11px' : '13px',
                            gridColumn: isMobile ? 'span 2' : 'auto'
                          }}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Trophy style={{ width: isMobile ? '14px' : '16px', height: isMobile ? '14px' : '16px' }} />
                          <span>Realizar sorteio</span>
                        </motion.button>
                      )}

                      {campaign.status === 'completed' && campaign.drawn_at && (
                        <motion.button
                          onClick={() => handleVerGanhadores(campaign.id)}
                          className="flex items-center justify-center rounded-xl text-white font-bold shadow-md transition-all duration-300 animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-green-500 via-emerald-600 to-teal-500"
                          style={{ 
                            gap: isMobile ? '4px' : '6px', 
                            padding: isMobile ? '8px' : '10px 16px', 
                            fontSize: isMobile ? '11px' : '13px',
                            gridColumn: isMobile ? 'span 2' : 'auto'
                          }}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Award style={{ width: isMobile ? '14px' : '16px', height: isMobile ? '14px' : '16px' }} />
                          <span>Ver ganhadores</span>
                        </motion.button>
                      )}

                      {campaign.status === 'draft' && !campaign.is_paid && (
                        <motion.button
                          onClick={() => handlePublishCampaign(campaign.id)}
                          className="flex items-center justify-center rounded-xl text-white font-bold shadow-md transition-all duration-300 animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-green-500 via-emerald-600 to-green-500"
                          style={{ 
                            gap: isMobile ? '4px' : '6px', 
                            padding: isMobile ? '8px' : '10px 16px', 
                            fontSize: isMobile ? '11px' : '13px',
                            gridColumn: isMobile ? 'span 2' : 'auto'
                          }}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Publicar
                        </motion.button>
                      )}

                      <motion.button
                        onClick={() => handleEditCampaign(campaign.id)}
                        className="flex items-center justify-center rounded-xl text-white font-bold shadow-md transition-all duration-300 animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600"
                        style={{ 
                          gap: isMobile ? '4px' : '6px', 
                          padding: isMobile ? '8px' : '10px 16px', 
                          fontSize: isMobile ? '11px' : '13px',
                          gridColumn: isMobile ? 'span 2' : 'auto'
                        }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Edit style={{ width: isMobile ? '14px' : '16px', height: isMobile ? '14px' : '16px' }} />
                        <span>Editar</span>
                      </motion.button>
                    </motion.div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>

            {totalPages > 1 && (
              <motion.div 
                className="flex flex-col sm:flex-row items-center justify-between rounded-xl bg-white/60 dark:bg-gray-900/50 border border-gray-200/20 dark:border-gray-800/30 backdrop-blur-sm"
                style={{ 
                  marginTop: isMobile ? '20px' : '32px',
                  gap: isMobile ? '12px' : '16px',
                  padding: isMobile ? '12px' : '16px'
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <div className="font-medium text-gray-700 dark:text-gray-300 text-center sm:text-left"
                  style={{ fontSize: isMobile ? '11px' : '13px' }}>
                  Mostrando <span className="font-bold text-purple-600 dark:text-purple-400">{((currentPage - 1) * pageSize) + 1}</span> a <span className="font-bold text-purple-600 dark:text-purple-400">{Math.min(currentPage * pageSize, campaigns.length)}</span> de <span className="font-bold text-purple-600 dark:text-purple-400">{campaigns.length}</span>
                </div>
                <div className="flex items-center"
                  style={{ gap: isMobile ? '8px' : '12px' }}>
                  <motion.button 
                    onClick={() => handlePageChange(currentPage - 1)} 
                    disabled={currentPage === 1} 
                    className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200/20 dark:border-gray-700/30 font-semibold transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-800"
                    style={{ 
                      padding: isMobile ? '6px 12px' : '8px 16px',
                      fontSize: isMobile ? '11px' : '13px'
                    }}
                    whileHover={currentPage !== 1 ? { scale: 1.05 } : {}}
                    whileTap={currentPage !== 1 ? { scale: 0.95 } : {}}
                  >
                    Anterior
                  </motion.button>
                  <motion.div 
                    className="rounded-lg font-bold bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-900 dark:text-purple-100 border border-purple-200/30 dark:border-purple-800/30"
                    style={{ 
                      padding: isMobile ? '6px 12px' : '8px 20px',
                      fontSize: isMobile ? '11px' : '13px'
                    }}
                    whileHover={{ scale: 1.05 }}
                  >
                    {currentPage} de {totalPages}
                  </motion.div>
                  <motion.button 
                    onClick={() => handlePageChange(currentPage + 1)} 
                    disabled={currentPage === totalPages} 
                    className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200/20 dark:border-gray-700/30 font-semibold transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-800"
                    style={{ 
                      padding: isMobile ? '6px 12px' : '8px 16px',
                      fontSize: isMobile ? '11px' : '13px'
                    }}
                    whileHover={currentPage !== totalPages ? { scale: 1.05 } : {}}
                    whileTap={currentPage !== totalPages ? { scale: 0.95 } : {}}
                  >
                    Próximo
                  </motion.button>
                </div>
              </motion.div>
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

      {selectedCampaignForMaiorMenor && (
        <MaiorMenorCotaModal
          isOpen={showMaiorMenorCotaModal}
          onClose={handleCloseMaiorMenorCotaModal}
          campaignId={selectedCampaignForMaiorMenor.id}
          onViewBuyerDetails={handleViewBuyerDetails}
        />
      )}

      {selectedBuyerData && selectedCampaignForMaiorMenor && (
        <BuyerContactModal
          isOpen={showBuyerContactModal}
          onClose={handleCloseBuyerContactModal}
          ticketData={selectedBuyerData}
          campaignId={selectedCampaignForMaiorMenor.id}
        />
      )}

      {selectedCampaignForRanking && (
        <TopBuyersModal
          isOpen={showTopBuyersModal}
          onClose={handleCloseRankingModal}
          campaignId={selectedCampaignForRanking.id}
          campaignTitle={selectedCampaignForRanking.title}
          onViewBuyerDetails={handleViewBuyerFromRanking}
        />
      )}
    </div>
  );
};

export default DashboardPage;