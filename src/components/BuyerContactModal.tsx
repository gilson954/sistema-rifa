import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Mail, User, Search, Calendar, DollarSign, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { supabase } from '../lib/supabase';

interface BuyerContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketData: TicketData;
  campaignId: string;
}

interface TicketData {
  id: string;
  quota_number: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  bought_at: string;
  total_value?: number;
  ticket_count?: number;
}

interface PurchaseDetails {
  total_tickets: number;
  total_value: number;
  purchase_date: string;
  payment_method: string;
  quotas: number[];
}

const BuyerContactModal: React.FC<BuyerContactModalProps> = ({
  isOpen,
  onClose,
  ticketData,
  campaignId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [purchaseDetails, setPurchaseDetails] = useState<PurchaseDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 21;

  useEffect(() => {
    if (isOpen && ticketData) {
      loadPurchaseDetails();
    }
  }, [isOpen, ticketData]);

  const loadPurchaseDetails = async () => {
    setLoading(true);
    try {
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('quota_number, bought_at')
        .eq('campaign_id', campaignId)
        .eq('status', 'comprado')
        .eq('customer_phone', ticketData.customer_phone)
        .order('quota_number', { ascending: true });

      if (ticketsError) throw ticketsError;

      const { data: campaignData } = await supabase
        .from('campaigns')
        .select('ticket_price')
        .eq('id', campaignId)
        .single();

      const ticketPrice = campaignData?.ticket_price || 0;
      const totalTickets = tickets?.length || 0;
      const quotas = tickets?.map(t => t.quota_number) || [];

      setPurchaseDetails({
        total_tickets: totalTickets,
        total_value: ticketPrice * totalTickets,
        purchase_date: ticketData.bought_at,
        payment_method: 'Aprovação manual',
        quotas
      });
    } catch (error) {
      console.error('Error loading purchase details:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuotas = purchaseDetails?.quotas.filter(quota =>
    quota.toString().includes(searchQuery)
  ) || [];

  const totalPages = Math.ceil(filteredQuotas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentQuotas = filteredQuotas.slice(startIndex, endIndex);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleContactWhatsApp = () => {
    const phone = ticketData.customer_phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}`, '_blank');
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Compra aprovada
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {ticketData.customer_name}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      {ticketData.customer_phone}
                    </p>
                  </div>
                  <button
                    onClick={handleContactWhatsApp}
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    Contatar
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      {ticketData.customer_email}
                    </p>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : purchaseDetails && (
                <>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                      Detalhes da compra
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Forma de pagamento
                        </p>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {purchaseDetails.payment_method}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Data da reserva
                        </p>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {new Date(purchaseDetails.purchase_date).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Valor total da compra
                        </p>
                        <p className="font-bold text-xl text-green-600 dark:text-green-400">
                          {formatCurrency(purchaseDetails.total_value)}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Cotas
                        </p>
                        <p className="font-bold text-xl text-gray-900 dark:text-white">
                          {purchaseDetails.total_tickets}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                        Cotas ({purchaseDetails.total_tickets})
                      </h4>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={handleSearchChange}
                          placeholder="Buscar cota..."
                          className="pl-10 pr-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => {
                              setSearchQuery('');
                              setCurrentPage(1);
                            }}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          >
                            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2 mb-4">
                      {currentQuotas.map((quota) => (
                        <motion.div
                          key={quota}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-2 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border-2 border-teal-300 dark:border-teal-700 rounded-lg text-center"
                        >
                          <span className="text-sm font-bold text-teal-700 dark:text-teal-300">
                            {quota.toString().padStart(4, '0')}
                          </span>
                        </motion.div>
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="p-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <svg className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>

                        <div className="flex gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }

                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                                  currentPage === pageNum
                                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                                    : 'border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>

                        {totalPages > 5 && currentPage < totalPages - 2 && (
                          <span className="px-2 text-gray-500 dark:text-gray-400">...</span>
                        )}

                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="p-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <svg className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BuyerContactModal;
