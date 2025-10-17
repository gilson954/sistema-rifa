import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, TrendingUp, Ticket, DollarSign, Medal, Crown, Award, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/currency';

interface TopBuyer {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  ticket_count: number;
  total_spent: number;
  rank_position: number;
}

interface TopBuyersModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  campaignTitle: string;
  onViewBuyerDetails?: (buyer: TopBuyer) => void;
}

const TopBuyersModal: React.FC<TopBuyersModalProps> = ({
  isOpen,
  onClose,
  campaignId,
  campaignTitle,
  onViewBuyerDetails,
}) => {
  const [buyers, setBuyers] = useState<TopBuyer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && campaignId) {
      fetchRanking();
    }
  }, [isOpen, campaignId]);

  const fetchRanking = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase.rpc('get_campaign_ranking', {
        p_campaign_id: campaignId,
        p_limit: 10,
      });

      if (fetchError) throw fetchError;

      setBuyers(data || []);
    } catch (err) {
      console.error('Error fetching ranking:', err);
      setError('Erro ao carregar o ranking. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-orange-600" />;
      default:
        return <span className="text-lg font-bold text-gray-600 dark:text-gray-400">{position}º</span>;
    }
  };

  const getRankBadgeColor = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600';
      case 2:
        return 'bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500';
      case 3:
        return 'bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600';
      default:
        return 'bg-gradient-to-r from-blue-500 to-blue-600';
    }
  };

  const handleBuyerClick = (buyer: TopBuyer) => {
    if (onViewBuyerDetails) {
      onViewBuyerDetails(buyer);
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: 'spring', damping: 25, stiffness: 300 },
    },
    exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.05, duration: 0.3 },
    }),
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        >
          <motion.div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-orange-400/20 to-red-400/20 animate-gradient-x bg-[length:200%_200%]"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Trophy className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Top Compradores</h2>
                    <p className="text-white/90 text-sm">{campaignTitle}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)] custom-scrollbar-dark">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Carregando ranking...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                  <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
                  <button
                    onClick={fetchRanking}
                    className="mt-4 px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    Tentar Novamente
                  </button>
                </div>
              ) : buyers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">
                    Nenhuma compra registrada ainda
                  </p>
                  <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                    O ranking aparecerá quando houver vendas confirmadas
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {buyers.map((buyer, index) => (
                    <motion.div
                      key={`${buyer.customer_phone}-${index}`}
                      custom={index}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      className={`relative group rounded-xl border-2 overflow-hidden transition-all duration-300 ${
                        buyer.rank_position <= 3
                          ? 'border-transparent bg-gradient-to-r p-[2px]'
                          : 'border-gray-200 dark:border-gray-700'
                      } ${onViewBuyerDetails ? 'cursor-pointer hover:shadow-lg' : ''}`}
                      style={
                        buyer.rank_position <= 3
                          ? {
                              background: `linear-gradient(135deg, ${
                                buyer.rank_position === 1
                                  ? '#FFD700, #FFA500'
                                  : buyer.rank_position === 2
                                  ? '#C0C0C0, #A8A8A8'
                                  : '#CD7F32, #B8860B'
                              })`,
                            }
                          : {}
                      }
                      onClick={() => handleBuyerClick(buyer)}
                    >
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1 min-w-0">
                            {/* Rank Badge */}
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
                                buyer.rank_position <= 3 ? getRankBadgeColor(buyer.rank_position) : 'bg-gray-200 dark:bg-gray-700'
                              }`}
                            >
                              {getRankIcon(buyer.rank_position)}
                            </div>

                            {/* Buyer Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-bold text-gray-900 dark:text-white truncate">
                                  {buyer.customer_name}
                                </h3>
                                {onViewBuyerDetails && (
                                  <User className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                )}
                              </div>
                              <div className="flex items-center space-x-3 mt-1">
                                <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                                  <Ticket className="h-4 w-4" />
                                  <span className="font-semibold">{buyer.ticket_count}</span>
                                  <span className="hidden sm:inline">
                                    {buyer.ticket_count === 1 ? 'título' : 'títulos'}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1 text-sm text-green-600 dark:text-green-400">
                                  <DollarSign className="h-4 w-4" />
                                  <span className="font-semibold">{formatCurrency(buyer.total_spent)}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Position for mobile */}
                          {buyer.rank_position > 3 && (
                            <div className="text-right sm:hidden">
                              <span className="text-2xl font-bold text-gray-400 dark:text-gray-600">
                                {buyer.rank_position}º
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white py-3 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TopBuyersModal;
