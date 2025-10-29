import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Calendar, CheckCircle, Clock, XCircle, AlertCircle, LogOut, Timer, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CampaignFooter from '../components/CampaignFooter';
import { TicketsAPI, Order } from '../lib/api/tickets';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/currency';

interface OrganizerProfile {
  id: string;
  name: string;
  logo_url?: string;
  primary_color?: string;
  theme?: string;
  color_mode?: string;
  gradient_classes?: string;
  custom_gradient_colors?: string;
}

const MyTicketsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isPhoneAuthenticated, phoneUser, signOut, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [organizerProfile, setOrganizerProfile] = useState<OrganizerProfile | null>(null);
  const [timeRemainingMap, setTimeRemainingMap] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const ordersPerPage = 5;

  const campaignContext = location.state as { campaignId?: string; organizerId?: string } | null;

  useEffect(() => {
    if (isPhoneAuthenticated && phoneUser) {
      loadUserOrders(phoneUser.phone);
    }
  }, [isPhoneAuthenticated, phoneUser, campaignContext?.organizerId]);

  useEffect(() => {
    // Filtrar pedidos com status 'reserved' e que tenham reservation_expires_at
    const pendingOrders = orders.filter(order => 
      order.payment_status === 'pending' && order.created_at
    );

    if (pendingOrders.length === 0) return;

    const updateTimers = () => {
      const now = new Date().getTime();
      const newTimeMap: Record<string, string> = {};

      pendingOrders.forEach(order => {
        // Calcular expiração: created_at + 30 minutos (padrão)
        const createdAt = new Date(order.created_at).getTime();
        const expirationTime = createdAt + (30 * 60 * 1000); // 30 minutos em ms
        const difference = expirationTime - now;

        if (difference <= 0) {
          newTimeMap[order.id] = 'EXPIRADO';
        } else {
          // Calcular dias, horas, minutos e segundos
          const days = Math.floor(difference / (1000 * 60 * 60 * 24));
          const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((difference % (1000 * 60)) / 1000);
          
          // Formatar conforme o tempo restante
          if (days > 0) {
            newTimeMap[order.id] = `${days}d ${hours}h ${minutes}min`;
          } else if (hours > 0) {
            newTimeMap[order.id] = `${hours}h ${minutes}min`;
          } else {
            newTimeMap[order.id] = `${minutes}:${seconds.toString().padStart(2, '0')}`;
          }
        }
      });

      setTimeRemainingMap(newTimeMap);
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);

    return () => clearInterval(interval);
  }, [orders]);

  const handleLogout = async () => {
    await signOut();
    if (orders.length > 0 && organizerProfile?.id) {
      navigate(`/org/${organizerProfile.id}`);
      return;
    }
    navigate('/');
  };

  useEffect(() => {
    const loadOrganizerFromOrders = async () => {
      if (orders.length > 0) {
        const firstOrder = orders[0];
        const { data: campaign } = await supabase
          .from('campaigns')
          .select('user_id')
          .eq('id', firstOrder.campaign_id)
          .maybeSingle();

        if (campaign?.user_id) {
          const { data: profile } = await supabase
            .from('public_profiles_view')
            .select('id, name, logo_url, primary_color, theme, color_mode, gradient_classes, custom_gradient_colors')
            .eq('id', campaign.user_id)
            .maybeSingle();

          if (profile) {
            setOrganizerProfile(profile);
          }
        }
      }
    };

    loadOrganizerFromOrders();
  }, [orders]);

  const loadUserOrders = async (phone: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Buscando pedidos para:', phone);
      
      // ✅ CORREÇÃO: Usar o método correto
      const { data, error: apiError } = await TicketsAPI.getOrdersByPhoneNumber(phone);

      if (apiError) {
        setError('Erro ao buscar seus pedidos. Tente novamente.');
        console.error('Error loading orders:', apiError);
      } else {
        console.log('✅ Pedidos carregados:', data?.length || 0);
        
        let filteredOrders = data || [];

        // Filtrar por organizador se especificado
        if (campaignContext?.organizerId) {
          const { data: organizerCampaigns } = await supabase
            .from('campaigns')
            .select('id')
            .eq('user_id', campaignContext.organizerId);

          const organizerCampaignIds = organizerCampaigns?.map(c => c.id) || [];
          filteredOrders = filteredOrders.filter(order =>
            organizerCampaignIds.includes(order.campaign_id)
          );
        }

        setOrders(filteredOrders);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Data não disponível';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusInfo = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid':
      case 'confirmed':
        return {
          label: 'Pago',
          icon: CheckCircle,
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-500',
          buttonColor: 'bg-green-600'
        };
      case 'pending':
        return {
          label: 'Aguardando Pagamento',
          icon: Clock,
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-500',
          buttonColor: 'bg-yellow-600'
        };
      case 'expired':
      case 'cancelled':
        return {
          label: 'Compra Cancelada',
          icon: XCircle,
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-500',
          buttonColor: 'bg-red-600'
        };
      default:
        return {
          label: 'Desconhecido',
          icon: AlertCircle,
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-500',
          buttonColor: 'bg-gray-600'
        };
    }
  };

  const handlePayment = (order: Order) => {
    // Extrair números dos tickets se disponíveis
    const ticketNumbers = order.tickets?.map(t => t.quota_number) || [];
    
    navigate('/payment-confirmation', {
      state: {
        reservationData: {
          reservationId: order.id,
          customerName: order.customer_name || '',
          customerEmail: order.customer_email || '',
          customerPhone: order.customer_phone || '',
          quotaCount: ticketNumbers.length,
          totalValue: order.total_amount,
          selectedQuotas: ticketNumbers,
          campaignTitle: order.campaign?.title || 'Campanha',
          campaignId: order.campaign_id,
          campaignPublicId: order.campaign?.id || '',
          expiresAt: order.created_at, // Usar created_at para calcular expiração
          reservationTimeoutMinutes: 30
        }
      }
    });
  };

  const toggleExpandOrder = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    if (!authLoading && !isPhoneAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isPhoneAuthenticated, authLoading, navigate]);

  const campaignTheme = organizerProfile?.theme || 'claro';

  if (authLoading || loading) {
    const loadingThemeClasses = getThemeClasses(campaignTheme);
    return (
      <div className={`min-h-screen ${loadingThemeClasses.background} transition-colors duration-300 flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isPhoneAuthenticated) {
    return null;
  }

  function getThemeClasses(theme: string) {
    switch (theme) {
      case 'claro':
        return {
          background: 'bg-gray-50',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          cardBg: 'bg-white',
          border: 'border-gray-200',
          headerBg: 'bg-white'
        };
      case 'escuro':
        return {
          background: 'bg-slate-900',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          cardBg: 'bg-slate-800',
          border: 'border-slate-700',
          headerBg: 'bg-black'
        };
      case 'escuro-preto':
        return {
          background: 'bg-black',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          cardBg: 'bg-gray-900',
          border: 'border-gray-800',
          headerBg: 'bg-black'
        };
      default:
        return {
          background: 'bg-gray-50',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          cardBg: 'bg-white',
          border: 'border-gray-200',
          headerBg: 'bg-white'
        };
    }
  }

  const themeClasses = getThemeClasses(campaignTheme);
  const totalPages = Math.ceil(orders.length / ordersPerPage);
  const paginatedOrders = orders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);

  return (
    <div className={`min-h-screen transition-colors duration-300 flex flex-col ${themeClasses.background}`}>
      <header className={`shadow-sm border-b ${themeClasses.border} ${themeClasses.headerBg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <button
              onClick={() => {
                if (organizerProfile?.id) {
                  navigate(`/org/${organizerProfile.id}`);
                } else {
                  navigate('/');
                }
              }}
              className="flex items-center hover:opacity-80 transition-opacity duration-200"
            >
              {organizerProfile?.logo_url ? (
                <img
                  src={organizerProfile.logo_url}
                  alt="Logo"
                  className="h-10 sm:h-14 w-auto max-w-[150px] sm:max-w-[200px] object-contain"
                />
              ) : (
                <div className="flex items-center">
                  <Ticket className="h-6 sm:h-8 w-6 sm:w-8 text-blue-600" />
                  <span className={`ml-2 text-lg sm:text-xl font-bold ${themeClasses.text}`}>Meus Pedidos</span>
                </div>
              )}
            </button>

            <div className="flex items-center gap-2 sm:gap-3">
              {phoneUser && (
                <div className={`hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg border ${
                  campaignTheme === 'claro'
                    ? 'bg-gray-100 border-gray-200'
                    : 'bg-gray-800 border-gray-700'
                }`}>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className={`text-sm font-medium ${themeClasses.text}`}>
                    {phoneUser.name}
                  </span>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-all duration-200 shadow-md"
              >
                <LogOut className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                <span className="hidden sm:inline">Sair</span>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-8 w-full">
        <div className="mb-4 sm:mb-8">
          <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold ${themeClasses.text} mb-1 sm:mb-2`}>
            Meus Pedidos
          </h1>
          <p className={`text-sm sm:text-base ${themeClasses.textSecondary}`}>
            Bem-vindo, {phoneUser?.name || 'Cliente'}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className={`${themeClasses.cardBg} rounded-2xl shadow-xl p-8 border border-red-200 dark:border-red-800`}>
            <div className="flex items-center space-x-3 text-red-600 dark:text-red-400">
              <AlertCircle className="h-6 w-6" />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className={`${themeClasses.cardBg} rounded-2xl shadow-xl p-8 sm:p-12 text-center border ${themeClasses.border}`}>
            <div className={`w-16 h-16 sm:w-20 sm:h-20 ${campaignTheme === 'claro' ? 'bg-gray-100' : 'bg-gray-800'} rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6`}>
              <Ticket className="h-8 sm:h-10 w-8 sm:w-10 text-gray-400" />
            </div>
            <h3 className={`text-xl sm:text-2xl font-semibold ${themeClasses.text} mb-2`}>
              Nenhum pedido encontrado
            </h3>
            <p className={`${themeClasses.textSecondary} mb-4 sm:mb-6 text-sm sm:text-base`}>
              Você ainda não possui pedidos.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base transition-all duration-200 shadow-lg"
            >
              Explorar Campanhas
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-2 sm:space-y-3">
              <AnimatePresence mode="wait">
                {paginatedOrders.map((order) => {
                  const statusInfo = getStatusInfo(order.payment_status);
                  const StatusIcon = statusInfo.icon;
                  const timeRemaining = timeRemainingMap[order.id];
                  const isExpanded = expandedOrders.has(order.id);
                  const ticketNumbers = order.tickets?.map(t => t.quota_number) || [];
                  const maxVisibleTickets = 6;
                  const hasMoreTickets = ticketNumbers.length > maxVisibleTickets;

                  return (
                    <div
                      key={order.id}
                      className={`${themeClasses.cardBg} rounded-lg sm:rounded-xl shadow-md border-l-4 ${statusInfo.borderColor} overflow-hidden hover:shadow-lg transition-shadow duration-200`}
                    >
                      <div className="p-3 sm:p-4">
                        <div className="flex gap-3 sm:gap-4">
                          <div className="flex-shrink-0">
                            <img
                              src={order.campaign?.prize_image_urls?.[0] || 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=400'}
                              alt={order.campaign?.title || 'Campanha'}
                              className="w-16 h-16 sm:w-24 sm:h-24 object-cover rounded-md sm:rounded-lg"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className={`text-sm sm:text-lg font-bold ${themeClasses.text} mb-1.5 sm:mb-2 truncate`}>
                              {order.campaign?.title || 'Campanha'}
                            </h3>

                            <div className="flex flex-col gap-1 sm:gap-2 mb-2 sm:mb-3">
                              <div className="flex items-center text-xs">
                                <Calendar className={`h-2.5 sm:h-3 w-2.5 sm:w-3 mr-1 sm:mr-1.5 ${themeClasses.textSecondary}`} />
                                <span className={themeClasses.textSecondary}>
                                  {formatDate(order.created_at)}
                                </span>
                              </div>
                              <div className="flex items-center text-xs">
                                <motion.div
                                  animate={{
                                    scale: [1, 1.2, 1],
                                    rotate: [0, 5, -5, 0],
                                  }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    repeatDelay: 1
                                  }}
                                  className="mr-1 sm:mr-1.5"
                                >
                                  <Ticket className={`h-2.5 sm:h-3 w-2.5 sm:w-3 ${
                                    order.payment_status === 'paid' || order.payment_status === 'confirmed'
                                      ? 'text-green-500' 
                                      : order.payment_status === 'pending'
                                      ? 'text-yellow-500'
                                      : 'text-red-500'
                                  }`} />
                                </motion.div>
                                <span className={`font-bold ${
                                  order.payment_status === 'paid' || order.payment_status === 'confirmed'
                                    ? 'text-green-600 dark:text-green-400' 
                                    : order.payment_status === 'pending'
                                    ? 'text-yellow-600 dark:text-yellow-400'
                                    : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {ticketNumbers.length} {ticketNumbers.length === 1 ? 'cota' : 'cotas'}
                                </span>
                              </div>
                            </div>

                            <div className={`inline-flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg ${statusInfo.bgColor} mb-2 sm:mb-3`}>
                              <StatusIcon className={`h-3 sm:h-4 w-3 sm:w-4 ${statusInfo.color}`} />
                              <span className={`text-xs font-semibold ${statusInfo.color}`}>
                                {statusInfo.label}
                              </span>
                              {order.payment_status === 'pending' && timeRemaining && timeRemaining !== 'EXPIRADO' && (
                                <>
                                  <span className={statusInfo.color}>•</span>
                                  <Timer className={`h-2.5 sm:h-3 w-2.5 sm:w-3 ${statusInfo.color}`} />
                                  <span className={`font-mono text-xs font-bold ${statusInfo.color}`}>
                                    {timeRemaining}
                                  </span>
                                </>
                              )}
                            </div>

                            {(order.payment_status === 'paid' || order.payment_status === 'confirmed') && ticketNumbers.length > 0 && (
                              <div className="mb-2 sm:mb-3">
                                <div className={`text-xs ${themeClasses.textSecondary} font-semibold mb-1 sm:mb-1.5 flex items-center justify-between`}>
                                  <span>Números da sorte:</span>
                                  {hasMoreTickets && (
                                    <button
                                      onClick={() => toggleExpandOrder(order.id)}
                                      className={`flex items-center gap-1 ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors text-xs`}
                                    >
                                      {isExpanded ? (
                                        <>
                                          <span>Ver menos</span>
                                          <ChevronUp className="h-3 w-3" />
                                        </>
                                      ) : (
                                        <>
                                          <span>Ver todos</span>
                                          <ChevronDown className="h-3 w-3" />
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-1 sm:gap-1.5">
                                  {(isExpanded ? ticketNumbers : ticketNumbers.slice(0, maxVisibleTickets)).map((num) => (
                                    <span
                                      key={num}
                                      className="px-1.5 sm:px-2 py-0.5 text-xs font-bold rounded-md bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    >
                                      {num.toString().padStart(4, '0')}
                                    </span>
                                  ))}
                                  {!isExpanded && hasMoreTickets && (
                                    <button
                                      onClick={() => toggleExpandOrder(order.id)}
                                      className="px-1.5 sm:px-2 py-0.5 text-xs font-bold rounded-md bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    >
                                      +{ticketNumbers.length - maxVisibleTickets} mais
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="flex items-baseline gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                              <span className={`text-xs ${themeClasses.textSecondary}`}>Total:</span>
                              <span className={`text-lg sm:text-xl font-bold ${themeClasses.text}`}>
                                {formatCurrency(order.total_amount)}
                              </span>
                            </div>

                            {order.payment_status === 'pending' && (
                              <button
                                onClick={() => handlePayment(order)}
                                className={`w-full ${statusInfo.buttonColor} hover:opacity-90 text-white py-2 sm:py-2.5 rounded-md sm:rounded-lg font-bold text-xs sm:text-sm transition-all duration-200 shadow-md`}
                              >
                                Efetuar Pagamento
                              </button>
                            )}

                            {(order.payment_status === 'expired' || order.payment_status === 'cancelled') && (
                              <button
                                onClick={() => handlePayment(order)}
                                disabled
                                className={`w-full ${statusInfo.buttonColor} opacity-50 cursor-not-allowed text-white py-2 sm:py-2.5 rounded-md sm:rounded-lg font-bold text-xs sm:text-sm`}
                              >
                                Compra Cancelada
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </AnimatePresence>
            </div>

            {totalPages > 1 && (
              <div className={`flex flex-col items-center justify-between mt-6 sm:mt-8 gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl border shadow-md ${
                campaignTheme === 'claro'
                  ? 'bg-white border-gray-200'
                  : 'bg-gradient-to-r from-gray-800/50 to-gray-900/50 border-gray-700/30'
              } backdrop-blur-sm`}>
                <div className={`text-xs sm:text-sm font-medium ${themeClasses.textSecondary} text-center`}>
                  Mostrando{' '}
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {((currentPage - 1) * ordersPerPage) + 1}
                  </span>
                  {' '}a{' '}
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {Math.min(currentPage * ordersPerPage, orders.length)}
                  </span>
                  {' '}de{' '}
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {orders.length}
                  </span>
                  {' '}pedidos
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 w-full justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg font-semibold text-xs sm:text-sm transition-all duration-300 ${
                      currentPage === 1
                        ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white shadow-md hover:shadow-lg'
                    }`}
                  >
                    Ant.
                  </motion.button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <motion.button
                        key={page}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-md sm:rounded-lg font-bold text-xs sm:text-sm transition-all duration-300 ${
                          currentPage === page
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-110'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {page}
                      </motion.button>
                    ))}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg font-semibold text-xs sm:text-sm transition-all duration-300 ${
                      currentPage === totalPages
                        ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white shadow-md hover:shadow-lg'
                    }`}
                  >
                    Próx.
                  </motion.button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <CampaignFooter campaignTheme={campaignTheme} />
    </div>
  );
};

export default MyTicketsPage;