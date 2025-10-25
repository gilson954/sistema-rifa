import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trophy, User, Phone, Mail, CreditCard, Calendar, DollarSign, Ticket, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { SorteioAPI, Winner } from '../lib/api/sorteio';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Não informado';
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatPhone = (phone: string | null) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
  }
  return phone;
};

const DetalhesGanhadorPage: React.FC = () => {
  const { campaignId, winnerId } = useParams<{ campaignId: string; winnerId: string }>();
  const navigate = useNavigate();
  const [winner, setWinner] = useState<Winner | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const ticketsPerPage = 50;
  const maxVisibleTicketsCollapsed = 50;

  useEffect(() => {
    loadData();
  }, [winnerId]);

  const loadData = async () => {
    if (!winnerId || !campaignId) return;

    setLoading(true);

    try {
      const [winnerResult, ticketsResult] = await Promise.all([
        SorteioAPI.getWinnerById(winnerId),
        getWinnerTickets()
      ]);

      if (winnerResult.data) {
        setWinner(winnerResult.data);
      }

      if (ticketsResult) {
        setTickets(ticketsResult);
      }
    } catch (error) {
      console.error('Error loading winner data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWinnerTickets = async () => {
    if (!winnerId || !campaignId) return [];

    const winnerResult = await SorteioAPI.getWinnerById(winnerId);
    if (!winnerResult.data || !winnerResult.data.winner_phone) return [];

    const ticketsResult = await SorteioAPI.getWinnerTickets(
      campaignId,
      winnerResult.data.winner_phone
    );

    return ticketsResult.data || [];
  };

  const handleWhatsAppContact = () => {
    if (!winner?.winner_phone) return;

    const phone = winner.winner_phone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Olá ${winner.winner_name}! Parabéns por ganhar o prêmio "${winner.prize_name}" com o título ${winner.ticket_number}! 🎉`
    );
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setCurrentPage(1);
    }
  };

  // Determinar quantos tickets mostrar
  const hasMoreTickets = tickets.length > maxVisibleTicketsCollapsed;
  const displayTickets = isExpanded 
    ? tickets.slice((currentPage - 1) * ticketsPerPage, currentPage * ticketsPerPage)
    : tickets.slice(0, maxVisibleTicketsCollapsed);
  
  const totalPages = Math.ceil(tickets.length / ticketsPerPage);
  const startIndex = isExpanded ? (currentPage - 1) * ticketsPerPage : 0;
  const endIndex = isExpanded ? Math.min(currentPage * ticketsPerPage, tickets.length) : Math.min(maxVisibleTicketsCollapsed, tickets.length);

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando detalhes do ganhador...</p>
        </div>
      </div>
    );
  }

  if (!winner) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Ganhador não encontrado
          </h2>
          <button
            onClick={() => navigate(`/dashboard/campaigns/${campaignId}/ganhadores`)}
            className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-gray-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <button
            onClick={() => navigate(`/dashboard/campaigns/${campaignId}/ganhadores`)}
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Voltar aos Ganhadores</span>
          </button>

          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Trophy className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {winner.prize_name}
                  </h1>
                  <div className="flex items-center gap-2 text-purple-100">
                    <Ticket className="h-5 w-5" />
                    <span className="text-lg font-semibold">
                      Título vencedor: {winner.ticket_number}
                    </span>
                  </div>
                </div>
              </div>

              {winner.winner_phone && (
                <button
                  onClick={handleWhatsAppContact}
                  className="px-6 py-3 rounded-xl font-semibold bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>Contatar via WhatsApp</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/20 dark:border-gray-700/30 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <User className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  Dados do Ganhador
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Nome Completo
                    </label>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/20 dark:border-gray-700/30">
                      <User className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {winner.winner_name}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Telefone
                    </label>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/20 dark:border-gray-700/30">
                      <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatPhone(winner.winner_phone) || 'Não informado'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      E-mail
                    </label>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/20 dark:border-gray-700/30">
                      <Mail className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {winner.winner_email || 'Não informado'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Forma de Pagamento
                    </label>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/20 dark:border-gray-700/30">
                      <CreditCard className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {winner.payment_method || 'Não informado'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Data da Compra
                    </label>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/20 dark:border-gray-700/30">
                      <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatDate(winner.purchase_date)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Data do Sorteio
                    </label>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/20 dark:border-gray-700/30">
                      <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatDate(winner.drawn_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/20 dark:border-gray-700/30 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Ticket className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    Todos os Títulos Adquiridos ({tickets.length})
                  </h2>
                  
                  {hasMoreTickets && (
                    <button
                      onClick={toggleExpand}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-all font-semibold text-sm"
                    >
                      {isExpanded ? (
                        <>
                          <span>Ver menos</span>
                          <ChevronUp className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          <span>Ver todos</span>
                          <ChevronDown className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 mb-6">
                  {displayTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className={`p-3 rounded-lg text-center font-bold transition-all ${
                        ticket.quota_number === winner.ticket_number
                          ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg scale-110 ring-2 ring-green-400'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:shadow-md hover:scale-105'
                      }`}
                    >
                      {ticket.quota_number}
                    </div>
                  ))}
                  
                  {!isExpanded && hasMoreTickets && (
                    <button
                      onClick={toggleExpand}
                      className="p-3 rounded-lg text-center font-bold bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-600 dark:text-purple-400 hover:from-purple-200 hover:to-blue-200 dark:hover:from-purple-900/50 dark:hover:to-blue-900/50 transition-all border-2 border-dashed border-purple-300 dark:border-purple-700 flex items-center justify-center"
                    >
                      <span className="text-xs">+{tickets.length - maxVisibleTicketsCollapsed}</span>
                    </button>
                  )}
                </div>

                {isExpanded && totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200/20 dark:border-gray-700/30">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Mostrando {startIndex + 1} a {endIndex} de {tickets.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200/20 dark:border-gray-700/30 text-sm font-semibold transition-all hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      <span className="px-4 py-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100 text-sm font-bold">
                        {currentPage} de {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200/20 dark:border-gray-700/30 text-sm font-semibold transition-all hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Próximo
                      </button>
                    </div>
                  </div>
                )}

                {!isExpanded && hasMoreTickets && (
                  <div className="text-center pt-4 border-t border-gray-200/20 dark:border-gray-700/30">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Mostrando {maxVisibleTicketsCollapsed} de {tickets.length} títulos
                    </p>
                    <button
                      onClick={toggleExpand}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold transition-all shadow-lg hover:shadow-xl"
                    >
                      <span>Ver todos os {tickets.length} títulos</span>
                      <ChevronDown className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/20 dark:border-gray-700/30 p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                  Resumo da Compra
                </h2>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200/30 dark:border-purple-800/30">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Títulos Comprados</p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {winner.tickets_purchased}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/30 dark:border-green-800/30">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Valor Total Pago</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(winner.total_paid)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-2xl shadow-lg border border-purple-200/30 dark:border-purple-800/30 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Prêmio Conquistado
                  </h3>
                </div>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {winner.prize_name}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DetalhesGanhadorPage;