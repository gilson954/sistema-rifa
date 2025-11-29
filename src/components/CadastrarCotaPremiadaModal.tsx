import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CadastrarCotaPremiadaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (numeroCota: number, premio: string) => Promise<void>;
  totalTickets: number;
  loading?: boolean;
}

const CadastrarCotaPremiadaModal: React.FC<CadastrarCotaPremiadaModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  totalTickets,
  loading = false,
}) => {
  const [numeroCota, setNumeroCota] = useState('');
  const [premio, setPremio] = useState('');
  const [error, setError] = useState('');

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!numeroCota.trim() || !premio.trim()) {
      setError('Todos os campos são obrigatórios');
      return;
    }

    const numero = parseInt(numeroCota, 10);

    if (isNaN(numero)) {
      setError('Número da cota inválido');
      return;
    }

    if (numero < 0 || numero >= totalTickets) {
      setError(`Número da cota deve estar entre 0 e ${totalTickets - 1}`);
      return;
    }

    try {
      await onSubmit(numero, premio.trim());
      setNumeroCota('');
      setPremio('');
      setError('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao cadastrar cota premiada';
      setError(message);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setNumeroCota('');
      setPremio('');
      setError('');
      onClose();
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.2 },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.2 },
    },
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.9,
      y: 20,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300,
        duration: 0.3,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: 20,
      transition: { duration: 0.2 },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4"
          onClick={handleOverlayClick}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Cadastrar titulo premiado</h2>
              <motion.button
                onClick={handleClose}
                disabled={loading}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={!loading ? { scale: 1.1, rotate: 90 } : {}}
                whileTap={!loading ? { scale: 0.9 } : {}}
                transition={{ duration: 0.2 }}
              >
                <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </motion.button>
            </div>

            <form onSubmit={handleSubmit} className="p-5">
              {error && (
                <motion.div
                  className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300 text-sm"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {error}
                </motion.div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Titulo
                </label>
                <input
                  type="number"
                  value={numeroCota}
                  onChange={(e) => setNumeroCota(e.target.value)}
                  placeholder={`0 a ${totalTickets - 1}`}
                  disabled={loading}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  min="0"
                  max={totalTickets - 1}
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Número da cota entre 0 e {totalTickets - 1}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Premio
                </label>
                <input
                  type="text"
                  value={premio}
                  onChange={(e) => setPremio(e.target.value)}
                  placeholder="Nome do premio"
                  disabled={loading}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
              </div>

              <div className="flex gap-3">
                <motion.button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={!loading ? { scale: 1.02 } : {}}
                  whileTap={!loading ? { scale: 0.98 } : {}}
                >
                  Cancelar
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={loading || !numeroCota.trim() || !premio.trim()}
                  className="flex-1 px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  whileHover={!loading && numeroCota.trim() && premio.trim() ? { scale: 1.02 } : {}}
                  whileTap={!loading && numeroCota.trim() && premio.trim() ? { scale: 0.98 } : {}}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    'Cadastrar'
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CadastrarCotaPremiadaModal;
