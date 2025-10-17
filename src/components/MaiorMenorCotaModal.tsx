import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Calendar, DollarSign, Search } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { formatCurrency } from '../utils/currency';
import { supabase } from '../lib/supabase';

interface MaiorMenorCotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  onViewBuyerDetails?: (ticketData: TicketData) => void;
}

interface TicketData {
  id: string;
  quota_number: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  bought_at: string;
  total_value: number;
  ticket_count: number;
}

const MaiorMenorCotaModal: React.FC<MaiorMenorCotaModalProps> = ({
  isOpen,
  onClose,
  campaignId,
  onViewBuyerDetails
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [searchType, setSearchType] = useState<'menor' | 'maior'>('menor');
  const [result, setResult] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!selectedDate) {
      setError('Por favor, selecione uma data');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error: queryError } = await supabase
        .from('tickets')
        .select('id, quota_number, customer_name, customer_email, customer_phone, bought_at')
        .eq('campaign_id', campaignId)
        .eq('status', 'comprado')
        .gte('bought_at', startOfDay.toISOString())
        .lte('bought_at', endOfDay.toISOString())
        .order('quota_number', { ascending: searchType === 'menor' })
        .limit(1);

      if (queryError) throw queryError;

      if (data && data.length > 0) {
        const ticket = data[0];

        const { data: allTickets, error: countError } = await supabase
          .from('tickets')
          .select('quota_number')
          .eq('campaign_id', campaignId)
          .eq('status', 'comprado')
          .eq('customer_phone', ticket.customer_phone);

        if (countError) throw countError;

        const { data: campaignData } = await supabase
          .from('campaigns')
          .select('ticket_price')
          .eq('id', campaignId)
          .single();

        const ticketCount = allTickets?.length || 1;
        const totalValue = (campaignData?.ticket_price || 0) * ticketCount;

        setResult({
          ...ticket,
          ticket_count: ticketCount,
          total_value: totalValue
        });
      } else {
        setError(`Nenhuma cota ${searchType === 'menor' ? 'mínima' : 'máxima'} encontrada para esta data`);
      }
    } catch (err) {
      console.error('Error searching:', err);
      setError('Erro ao buscar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = () => {
    if (result && onViewBuyerDetails) {
      onViewBuyerDetails(result);
      onClose();
    }
  };

  const resetForm = () => {
    setSelectedDate(null);
    setSearchType('menor');
    setResult(null);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Maior e Menor Cota
                </h2>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                  Filtro de data
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Selecione uma data"
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    maxDate={new Date()}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3">
                  Busca por:
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSearchType('menor')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                      searchType === 'menor'
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300'
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <TrendingDown className="h-5 w-5" />
                    <span className="font-semibold">Menor Cota</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchType('maior')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                      searchType === 'maior'
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300'
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <TrendingUp className="h-5 w-5" />
                    <span className="font-semibold">Maior Cota</span>
                  </button>
                </div>
              </div>

              <button
                onClick={handleSearch}
                disabled={loading || !selectedDate}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold text-lg transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    <span>Buscando...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5" />
                    <span>Buscar</span>
                  </>
                )}
              </button>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl"
                >
                  <p className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
                </motion.div>
              )}

              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl">
                    <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Resultado</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {searchType === 'menor' ? 'Menor cota encontrada:' : 'Maior cota encontrada:'}
                        </span>
                        <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                          {result.quota_number.toString().padStart(5, '0')}
                        </span>
                      </div>

                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-green-800 dark:text-green-300">
                            Compra aprovada
                          </span>
                          <span className="text-xs text-green-600 dark:text-green-400">
                            {new Date(result.bought_at).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="text-lg font-bold text-green-700 dark:text-green-300">
                            {formatCurrency(result.total_value)}
                          </span>
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          {result.ticket_count} {result.ticket_count === 1 ? 'cota' : 'cotas'}
                        </p>
                      </div>

                      {onViewBuyerDetails && (
                        <button
                          onClick={handleViewDetails}
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-semibold transition-all hover:shadow-lg flex items-center justify-center gap-2"
                        >
                          <span>Ver Detalhes do Comprador</span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MaiorMenorCotaModal;
