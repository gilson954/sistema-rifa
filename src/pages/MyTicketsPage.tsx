import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Calendar, CheckCircle, Clock, XCircle, ChevronRight, AlertCircle, Heart, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CountryPhoneSelect from '../components/CountryPhoneSelect';
import CampaignHeader from '../components/CampaignHeader';
import CampaignFooter from '../components/CampaignFooter';
import { TicketsAPI, CustomerTicket } from '../lib/api/tickets';
import { supabase } from '../lib/supabase';
import { useFavoriteCampaigns } from '../hooks/useFavoriteCampaigns';
import { formatCurrency } from '../utils/currency';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

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
  const { isPhoneAuthenticated, phoneUser, signInWithPhone } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>({
    code: 'BR',
    name: 'Brasil',
    dialCode: '+55',
    flag: '🇧🇷'
  });
  const [tickets, setTickets] = useState<CustomerTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authenticating, setAuthenticating] = useState(false);
  const [organizerProfile, setOrganizerProfile] = useState<OrganizerProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'tickets' | 'favorites'>('tickets');

  const { favorites, loading: loadingFavorites, toggleFavorite } = useFavoriteCampaigns();

  useEffect(() => {
    if (isPhoneAuthenticated && phoneUser) {
      loadUserTickets(phoneUser.phone);
    }
  }, [isPhoneAuthenticated, phoneUser]);

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

  const handleLogin = async () => {
    if (!phoneNumber.trim()) {
      setError('Por favor, digite seu número de celular');
      return;
    }

    setAuthenticating(true);
    setError(null);

    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const fullPhoneNumber = `${selectedCountry.dialCode} ${phoneNumber}`;

      const result = await signInWithPhone(fullPhoneNumber);

      if (result.success) {
        await loadUserTickets(fullPhoneNumber);
      } else {
        setError(result.error || 'Erro ao fazer login');
      }
    } catch (error) {
      console.error('Error during login:', error);
      setError('Erro inesperado ao fazer login.');
    } finally {
      setAuthenticating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
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
          status: ticket.status as 'purchased' | 'reserved' | 'expired'
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

  if (!isPhoneAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300 flex flex-col">
        <CampaignHeader
          logoUrl={organizerProfile?.logo_url}
          organizerName={organizerProfile?.name}
          organizerId={organizerProfile?.id}
          primaryColor={organizerProfile?.primary_color}
          colorMode={organizerProfile?.color_mode}
          gradientClasses={organizerProfile?.gradient_classes}
          customGradientColors={organizerProfile?.custom_gradient_colors}
          campaignTheme={organizerProfile?.theme}
          onMyTicketsClick={() => {}}
        />

        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-800">
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                >
                  <Ticket className="h-10 w-10 text-white" />
                </motion.div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Minhas Cotas
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Entre com seu número de celular para visualizar suas cotas
                </p>
              </div>

              <div className="space-y-6">
                <CountryPhoneSelect
                  selectedCountry={selectedCountry}
                  onCountryChange={setSelectedCountry}
                  phoneNumber={phoneNumber}
                  onPhoneChange={setPhoneNumber}
                  placeholder="Seu número de celular"
                  error={error}
                />

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogin}
                  onKeyPress={handleKeyPress}
                  disabled={authenticating || !phoneNumber.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg flex items-center justify-center space-x-2"
                >
                  {authenticating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Entrando...</span>
                    </>
                  ) : (
                    <>
                      <Ticket className="h-5 w-5" />
                      <span>Ver Minhas Cotas</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        <CampaignFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300 flex flex-col">
      <CampaignHeader
        logoUrl={organizerProfile?.logo_url}
        organizerName={organizerProfile?.name}
        organizerId={organizerProfile?.id}
        primaryColor={organizerProfile?.primary_color}
        colorMode={organizerProfile?.color_mode}
        gradientClasses={organizerProfile?.gradient_classes}
        customGradientColors={organizerProfile?.custom_gradient_colors}
        campaignTheme={organizerProfile?.theme}
        onMyTicketsClick={() => {}}
      />

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

        {/* Tabs */}
        <div className="flex space-x-4 mb-8 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`pb-4 px-4 font-semibold transition-all duration-200 relative ${
              activeTab === 'tickets'
                ? 'text-purple-600 dark:text-purple-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Ticket className="h-5 w-5" />
              <span>Minhas Cotas</span>
              {groupedTickets.length > 0 && (
                <span className="ml-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold px-2 py-0.5 rounded-full">
                  {groupedTickets.length}
                </span>
              )}
            </div>
            {activeTab === 'tickets' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`pb-4 px-4 font-semibold transition-all duration-200 relative ${
              activeTab === 'favorites'
                ? 'text-purple-600 dark:text-purple-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Heart className="h-5 w-5" />
              <span>Favoritas</span>
              {favorites.length > 0 && (
                <span className="ml-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold px-2 py-0.5 rounded-full">
                  {favorites.length}
                </span>
              )}
            </div>
            {activeTab === 'favorites' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        </div>

        {/* Conteúdo das Abas */}
        {activeTab === 'tickets' && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
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
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg"
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
                        <span className="text-sm text-gray-600 dark:text-gray-400">Cotas</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {group.total_tickets}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                        <span className={`font-semibold ${getStatusColor(group.status)}`}>
                          {getStatusText(group.status)}
                        </span>
                      </div>
                    </div>

                    <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-xl font-bold transition-all duration-200 shadow-md flex items-center justify-center space-x-2 group-hover:shadow-lg">
                      <span>Ver Detalhes</span>
                      <ChevronRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform duration-200" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
          </>
        )}

        {/* Aba de Favoritas */}
        {activeTab === 'favorites' && (
          <>
            {loadingFavorites ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
              </div>
            ) : favorites.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-12 text-center border border-gray-200 dark:border-gray-800"
              >
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Nenhuma campanha favorita
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Adicione campanhas aos favoritos para acessá-las rapidamente.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg"
                >
                  Explorar Campanhas
                </button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {favorites.map((campaign, index) => (
                    <motion.div
                      key={campaign.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      onClick={() => campaign.public_id && navigate(`/c/${campaign.public_id}`)}
                      className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden cursor-pointer group"
                    >
                      <div className="relative h-48">
                        <img
                          src={campaign.prize_image_urls?.[0] || 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=600'}
                          alt={campaign.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(campaign.id);
                          }}
                          className="absolute top-4 right-4 p-2 rounded-full bg-red-500/90 backdrop-blur-sm hover:bg-red-600 transition-colors"
                        >
                          <Heart className="h-5 w-5 text-white fill-white" />
                        </button>
                        {campaign.status === 'active' && (
                          <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full backdrop-blur-sm bg-green-500/90">
                            <span className="text-white text-sm font-semibold">Ativa</span>
                          </div>
                        )}
                      </div>

                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 truncate">
                          {campaign.title}
                        </h3>

                        <div className="space-y-3 mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Valor da Cota</span>
                            <span className="font-bold text-gray-900 dark:text-white">
                              {formatCurrency(campaign.ticket_price)}
                            </span>
                          </div>
                          {campaign.show_percentage && (
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.min((campaign.sold_tickets / campaign.total_tickets) * 100, 100)}%`
                                }}
                              />
                            </div>
                          )}
                        </div>

                        <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-xl font-bold transition-all duration-200 shadow-md flex items-center justify-center space-x-2 group-hover:shadow-lg">
                          <span>Ver Campanha</span>
                          <ChevronRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform duration-200" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </main>

      <CampaignFooter />
    </div>
  );
};

export default MyTicketsPage;
