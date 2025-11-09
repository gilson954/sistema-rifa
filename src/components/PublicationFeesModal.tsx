import React from 'react';
import { X, DollarSign, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { STRIPE_PRODUCTS, formatPrice } from '../stripe-config';

interface PublicationFeesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PublicationFeesModal: React.FC<PublicationFeesModalProps> = ({ isOpen, onClose }) => {
  const publicationFeeTiers = STRIPE_PRODUCTS.filter(
    p => p.mode === 'payment' && p.minRevenue !== undefined
  ).sort((a, b) => a.minRevenue! - b.minRevenue!);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <style>
            {`
              @media (max-width: 640px) {
                .custom-scrollbar::-webkit-scrollbar {
                  width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: linear-gradient(to bottom, rgba(139, 92, 246, 0.05), rgba(219, 39, 119, 0.05));
                  border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: linear-gradient(to bottom, #a855f7, #ec4899, #3b82f6);
                  border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: linear-gradient(to bottom, #c084fc, #f472b6);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:active {
                  background: linear-gradient(to bottom, #7c3aed, #db2777);
                }
              }
              
              @media (min-width: 641px) {
                .custom-scrollbar::-webkit-scrollbar {
                  width: 12px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: linear-gradient(to bottom, rgba(139, 92, 246, 0.05), rgba(219, 39, 119, 0.05));
                  border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: linear-gradient(to bottom, #a855f7, #ec4899, #3b82f6);
                  border-radius: 10px;
                  box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: linear-gradient(to bottom, #c084fc, #f472b6);
                  box-shadow: 0 0 15px rgba(192, 132, 252, 0.6);
                }
              }
            `}
          </style>
          
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
            onClick={onClose}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200/20 dark:border-gray-700/30"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header com gradiente */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="relative overflow-hidden bg-gradient-to-br from-purple-50/80 to-blue-50/80 dark:from-purple-900/20 dark:to-blue-900/20 backdrop-blur-sm border-b border-purple-200/30 dark:border-purple-800/30 p-4 sm:p-6"
              >
                <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-tr from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
                
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                      <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                        Tabela de Taxas
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                        Valores para publicação de campanhas
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg sm:rounded-xl transition-all duration-200"
                    aria-label="Fechar modal"
                  >
                    <X className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500 dark:text-gray-400" />
                  </motion.button>
                </div>
              </motion.div>

              {/* Content */}
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-200px)] custom-scrollbar">
                {/* Descrição */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg sm:rounded-xl"
                >
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                        A <strong>taxa de publicação</strong> é um valor único cobrado para ativar sua campanha na plataforma. 
                        O valor varia de acordo com a <strong>arrecadação estimada</strong> da sua campanha.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Tabela de Taxas - Modernizada */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-200/20 dark:border-gray-700/30 overflow-hidden shadow-lg"
                >
                  <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 border-b border-purple-200/30 dark:border-purple-800/30 p-3 sm:p-4">
                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                      <div className="flex items-center space-x-1.5 sm:space-x-2">
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                          Arrecadação
                        </span>
                      </div>
                      <div className="flex items-center justify-end space-x-1.5 sm:space-x-2">
                        <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                          Taxa
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {publicationFeeTiers.map((tier, index) => (
                      <motion.div
                        key={tier.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                        className={`p-3 sm:p-4 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                          index % 2 === 0
                            ? 'bg-white dark:bg-gray-900/40'
                            : 'bg-gray-50/50 dark:bg-gray-800/30'
                        }`}
                      >
                        <div className="grid grid-cols-2 gap-2 sm:gap-4 items-center">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-md sm:rounded-lg flex items-center justify-center">
                              <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                                {index + 1}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                                {tier.maxRevenue === Infinity
                                  ? `Acima de ${formatPrice(tier.minRevenue! - 0.01)}`
                                  : `${formatPrice(tier.minRevenue!)} a ${formatPrice(tier.maxRevenue!)}`}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-end">
                            <div className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200/50 dark:border-green-800/50 rounded-lg sm:rounded-xl">
                              <span className="text-sm sm:text-base font-bold text-green-600 dark:text-green-400">
                                {formatPrice(tier.price)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Info Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  className="mt-4 sm:mt-6 relative overflow-hidden bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:from-amber-900/20 dark:to-orange-900/20 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-amber-200/30 dark:border-amber-800/30 p-4 sm:p-5 shadow-md"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full blur-2xl"></div>
                  
                  <div className="relative flex items-start space-x-3 sm:space-x-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-100 mb-2">
                        Informações Importantes
                      </h4>
                      <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-amber-800 dark:text-amber-200">
                        <li className="flex items-start space-x-2">
                          <span className="text-amber-600 dark:text-amber-400 font-bold mt-0.5">•</span>
                          <span>A taxa de publicação é cobrada <strong>uma única vez</strong> para ativar sua campanha</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-amber-600 dark:text-amber-400 font-bold mt-0.5">•</span>
                          <span>O valor é determinado automaticamente pela sua <strong>arrecadação estimada</strong></span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-amber-600 dark:text-amber-400 font-bold mt-0.5">•</span>
                          <span>Após o pagamento, sua campanha será <strong>ativada automaticamente</strong></span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Footer com botão */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                className="border-t border-gray-200/20 dark:border-gray-700/30 p-4 sm:p-6 bg-gray-50/50 dark:bg-gray-800/30"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="w-full py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base shadow-lg transition-all duration-300 hover:shadow-xl animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 text-white"
                >
                  Entendi
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PublicationFeesModal;