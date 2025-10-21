import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Calendar, CheckCircle, Clock, XCircle, ChevronRight, AlertCircle, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CampaignFooter from '../components/CampaignFooter';
import { TicketsAPI, CustomerTicket } from '../lib/api/tickets';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/currency';

interface GroupedTickets {
  campaign_id: string;
  campaign_title: string;
  campaign_public_id: string | null;
  prize_image_urls: string[] | null;
  tickets: CustomerTicket[];
  total_tickets: number;
  status: 'purchased' | 'reserved' | 'expired';
}

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
  const { isPhoneAuthenticated, phoneUser, signInWithPhone, signOut, loading: authLoading } = useAuth();

  const [tickets, setTickets] = useState<CustomerTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [organizerProfile, setOrganizerProfile] = useState<OrganizerProfile | null>(null);

  useEffect(() => {
    if (isPhoneAuthenticated && phoneUser) {
      loadUserTickets(phoneUser.phone);
    }
  }, [isPhoneAuthenticated, phoneUser]);

  const handleLogout = async () => {
    await signOut();
    // Redirecionar para a página inicial do organizador se tivermos o organizerId
    if (tickets.length > 0) {
      const firstTicket = tickets[0];
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('user_id')
        .eq('id', firstTicket.campaign_id)
        .maybeSingle();

      if (campaign?.user_id) {
        navigate(`/org/${campaign.user_id}`);
        return;
      }
    }
    // Fallback para home
    navigate('/');
  };

  useEffect(() => {
    const loadOrganizerFromTickets = async () => {
      if (tickets.length > 0) {
        const firstTicket = tickets[0];
        const { data: campaign } = await supabase
          .from('campaigns')
          .select('user_id')
          .eq('id', firstTicket.campaign_id)
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

    loadOrganizerFromTickets();
  }, [tickets]);

  const loadUserTickets = async (phone: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: apiError } = await TicketsAPI.getTicketsByPhoneNumber(phone);

      if (apiError) {
        setError('Erro ao buscar suas cotas. Tente novamente.');
        console.error('Error fetching tickets:', apiError);
      } else {
        setTickets(data || []);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
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

  const normalizeStatus = (status: string): 'purchased' | 'reserved' | 'expired' => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'comprado' || statusLower === 'purchased') return 'purchased';
    if (statusLower === 'reservado' || statusLower === 'reserved') return 'reserved';
    return 'expired';
  };

  const groupTicketsByStatus = (): GroupedTickets[] => {
    const grouped = tickets.reduce((groups, ticket) => {
      const existingGroup = groups.find(g => g.campaign_id === ticket.campaign_id);

      if (existingGroup) {
        existingGroup.tickets.push(ticket);
        existingGroup.total_tickets++;
      } else {
        groups.push({
          campaign_id: ticket.campaign_id,
          campaign_title: ticket.campaign_title,
          campaign_public_id: ticket.campaign_public_id,
          prize_image_urls: ticket.prize_image_urls,
          tickets: [ticket],
          total_tickets: 1,
          status: normalizeStatus(ticket.status)
        });
      }

      return groups;
    }, [] as GroupedTickets[]);

    return grouped.sort((a, b) => {
      const statusOrder = { purchased: 0, reserved: 1, expired: 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    });
  };

  const groupedTickets = groupTicketsByStatus();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'purchased':
        return 'text-green-600 dark:text-green-400';
      case 'reserved':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'expired':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'purchased':
        return <CheckCircle className="h-5 w-5" />;
      case 'reserved':
        return <Clock className="h-5 w-5" />;
      case 'expired':
        return <XCircle className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'purchased':
        return 'Comprado';
      case 'reserved':
        return 'Aguardando Pagamento';
      case 'expired':
        return 'Expirado';
      default:
        return status;
    }
  };

  const handleCardClick = (group: GroupedTickets) => {
    if (group.campaign_public_id) {
      navigate(`/c/${group.campaign_public_id}`);
    }
  };

  // Redirecionar usuários não autenticados para home
  useEffect(() => {
    if (!authLoading && !isPhoneAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isPhoneAuthenticated, authLoading, navigate]);

  // Mostrar loading enquanto verifica autenticação
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Se não estiver autenticado, não renderiza nada (será redirecionado)
  if (!isPhoneAuthenticated) {
    return null;
  }

  // Pegar o tema do organizador (padrão: claro)
  const campaignTheme = organizerProfile?.theme || 'claro';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300 flex flex-col">
      {/* Header customizado com botão de logout */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex-1"></div>
            <div className="flex items-center justify-center flex-1">
              {organizerProfile?.logo_url ? (
                <img
                  src={organizerProfile.logo_url}
                  alt="Logo"
                  className="h-14 w-auto max-w-[200px] object-contain"
                />
              ) : (
                <div className="flex items-center">
                  <Ticket className="h-8 w-8 text-blue-600" />
                  <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">Minhas Cotas</span>
                </div>
              )}
            </div>
            <div className="flex-1 flex justify-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-200 shadow-md"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Minhas Cotas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bem-vindo, {phoneUser?.name || 'Cliente'}
          </p>
        </motion.div>

        {/* Ticket Content */}
        {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-red-200 dark:border-red-800"
          >
            <div className="flex items-center space-x-3 text-red-600 dark:text-red-400">
              <AlertCircle className="h-6 w-6" />
              <span className="font-medium">{error}</span>
            </div>
          </motion.div>
        ) : groupedTickets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-12 text-center border border-gray-200 dark:border-gray-800"
          >
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Ticket className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Nenhuma cota encontrada
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Você ainda não possui cotas compradas ou reservadas.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg"
            >
              Explorar Campanhas
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {groupedTickets.map((group, index) => (
                <motion.div
                  key={group.campaign_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  onClick={() => handleCardClick(group)}
                  className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden cursor-pointer group"
                >
                  <div className="relative h-48">
                    <img
                      src={group.prize_image_urls?.[0] || 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=600'}
                      alt={group.campaign_title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center space-x-2 ${group.status === 'purchased' ? 'bg-green-500/90' : group.status === 'reserved' ? 'bg-yellow-500/90' : 'bg-red-500/90'}`}>
                      {getStatusIcon(group.status)}
                      <span className="text-white text-sm font-semibold">
                        {getStatusText(group.status)}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 truncate">
                      {group.campaign_title}
                    </h3>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Total de Cotas</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {group.total_tickets}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Status Geral</span>
                        <span className={`font-semibold ${getStatusColor(group.status)}`}>
                          {getStatusText(group.status)}
                        </span>
                      </div>

                      {/* Mostrar TODOS os números das cotas */}
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                          Números ({group.total_tickets} {group.total_tickets === 1 ? 'cota' : 'cotas'}):
                        </span>
                        <div className="mt-2 flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                          {group.tickets.map((ticket) => (
                            <span
                              key={ticket.ticket_id}
                              className={`px-2 py-1 text-xs font-bold rounded ${
                                normalizeStatus(ticket.status) === 'purchased'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : normalizeStatus(ticket.status) === 'reserved'
                                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }`}
                            >
                              {ticket.quota_number.toString().padStart(4, '0')}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-3 rounded-xl font-bold transition-all duration-200 shadow-md flex items-center justify-center space-x-2 group-hover:shadow-lg">
                      <span>Ver Detalhes</span>
                      <ChevronRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform duration-200" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <CampaignFooter campaignTheme={campaignTheme} />
    </div>
  );
};

export default MyTicketsPage;