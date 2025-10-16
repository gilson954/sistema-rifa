import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Ticket, User } from 'lucide-react';

interface WinnerInfo {
  prizeId: string;
  prizeName: string;
  ticketNumber: number;
  winnerName: string;
}

interface ConfirmarSorteioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  winners: WinnerInfo[];
  isLoading?: boolean;
}

const ConfirmarSorteioModal: React.FC<ConfirmarSorteioModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  winners,
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200/20 dark:border-gray-700/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200/20 dark:border-gray-700/30 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-xl flex items-center justify-center">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Confirmar sorteio dos prêmios
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Revise os ganhadores antes de confirmar
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors disabled:opacity-50"
                >
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-4">
                  {winners.map((winner, index) => (
                    <motion.div
                      key={winner.prizeId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-xl border border-gray-200/20 dark:border-gray-700/30 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/50 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                          <Trophy className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                              {winner.prizeName}
                            </h3>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <Ticket className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              <span className="font-medium">
                                Título <span className="font-bold text-purple-600 dark:text-purple-400">{winner.ticketNumber}</span>
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              <span className="font-medium text-gray-900 dark:text-white">
                                {winner.winnerName}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200/50 dark:border-yellow-800/30">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">
                    Atenção: Esta ação não pode ser desfeita. Após confirmar, o sorteio será registrado e a campanha será encerrada.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200/20 dark:border-gray-700/30 bg-gray-50/50 dark:bg-gray-800/50">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-6 py-3 rounded-xl font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200/20 dark:border-gray-700/30 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      <span>Confirmando...</span>
                    </>
                  ) : (
                    <>
                      <Trophy className="h-5 w-5" />
                      <span>Confirmar sorteio</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConfirmarSorteioModal;
