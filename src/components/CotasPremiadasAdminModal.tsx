import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CotaPremiada, CotaPremiadaStatus } from '../types/cotasPremiadas';
import { CotasPremiadasAPI } from '../lib/api/cotasPremiadas';
import CadastrarCotaPremiadaModal from './CadastrarCotaPremiadaModal';

interface CotasPremiadasAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  campaignTitle: string;
  totalTickets: number;
  initialVisibility: boolean;
  onShowNotification: (message: string, type: 'success' | 'error') => void;
}

type FilterTab = 'todos' | 'disponivel' | 'encontrada';

const CotasPremiadasAdminModal: React.FC<CotasPremiadasAdminModalProps> = ({
  isOpen,
  onClose,
  campaignId,
  campaignTitle,
  totalTickets,
  initialVisibility,
  onShowNotification,
}) => {
  const [cotasPremiadas, setCotasPremiadas] = useState<CotaPremiada[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('todos');
  const [visivelPublico, setVisivelPublico] = useState(initialVisibility);
  const [showCadastrarModal, setShowCadastrarModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [togglingVisibility, setTogglingVisibility] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCotasPremiadas();
      const channel = CotasPremiadasAPI.subscribeToCotasPremiadas(campaignId, () => {
        loadCotasPremiadas();
      });

      return () => {
        channel.unsubscribe();
      };
    }
  }, [isOpen, campaignId]);

  const loadCotasPremiadas = async () => {
    setLoading(true);
    try {
      const { data, error } = await CotasPremiadasAPI.getCotasPremiadasByCampaign(campaignId);
      if (error) {
        console.error('Error loading cotas premiadas:', error);
        onShowNotification('Erro ao carregar cotas premiadas', 'error');
      } else {
        setCotasPremiadas(data || []);
      }
    } catch (error) {
      console.error('Exception loading cotas premiadas:', error);
      onShowNotification('Erro ao carregar cotas premiadas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async () => {
    setTogglingVisibility(true);
    try {
      const newVisibility = !visivelPublico;
      const { success, error } = await CotasPremiadasAPI.toggleVisibilidade(campaignId, newVisibility);

      if (success) {
        setVisivelPublico(newVisibility);
        onShowNotification(
          newVisibility ? 'Cotas premiadas agora estão visíveis' : 'Cotas premiadas agora estão ocultas',
          'success'
        );
      } else {
        console.error('Error toggling visibility:', error);
        onShowNotification('Erro ao alterar visibilidade', 'error');
      }
    } catch (error) {
      console.error('Exception toggling visibility:', error);
      onShowNotification('Erro ao alterar visibilidade', 'error');
    } finally {
      setTogglingVisibility(false);
    }
  };

  // ✅ 0-BASED INDEXING: Pass the 0-indexed number directly to the API
  const handleCreateCota = async (numeroCotaInput: number, premio: string) => {
    setSubmitting(true);
    try {
      // 0-BASED: numeroCotaInput is already 0-indexed (0 to N-1), pass it directly
      const { data, error } = await CotasPremiadasAPI.createCotaPremiada({
        campaign_id: campaignId,
        numero_cota: numeroCotaInput, // ✅ Use 0-indexed number directly
        premio,
      });

      if (error) {
        throw new Error(error.message || 'Erro ao cadastrar cota premiada');
      }

      if (data) {
        onShowNotification('Cota premiada cadastrada com sucesso!', 'success');
        setShowCadastrarModal(false);
        await loadCotasPremiadas();
      }
    } catch (error: any) {
      console.error('Error creating cota premiada:', error);
      onShowNotification(error.message || 'Erro ao cadastrar cota premiada', 'error');
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCota = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta cota premiada?')) {
      return;
    }

    try {
      const { success, error } = await CotasPremiadasAPI.deleteCotaPremiada(id, campaignId);

      if (success) {
        onShowNotification('Cota premiada excluída com sucesso!', 'success');
        await loadCotasPremiadas();
      } else {
        console.error('Error deleting cota premiada:', error);
        onShowNotification('Erro ao excluir cota premiada', 'error');
      }
    } catch (error) {
      console.error('Exception deleting cota premiada:', error);
      onShowNotification('Erro ao excluir cota premiada', 'error');
    }
  };

  const getFilteredCotas = () => {
    if (activeFilter === 'todos') {
      return cotasPremiadas;
    }
    return cotasPremiadas.filter((cota) => cota.status === activeFilter);
  };

  const filteredCotas = getFilteredCotas();

  // ✅ 0-BASED INDEXING: Calculate padding based on the maximum 0-indexed number
  const getQuotaNumberPadding = () => {
    if (totalTickets === 0) return 1; // Ensure at least 1 digit
    // The maximum displayed number is totalTickets - 1 (0-indexed)
    const maxDisplayNumber = totalTickets - 1;
    return String(maxDisplayNumber).length;
  };

  // ✅ 0-BASED INDEXING: Display the 0-indexed numero directly without conversion
  const formatQuotaNumber = (numero: number) => {
    // 0-BASED: Display numero directly (already 0-indexed: 0 to N-1)
    return numero.toString().padStart(getQuotaNumberPadding(), '0');
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: 'spring', damping: 25, stiffness: 300, duration: 0.3 },
    },
    exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } },
  };

  const cotaCardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: { delay: i * 0.05, duration: 0.3, type: 'spring', damping: 20 },
    }),
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleOverlayClick}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gerenciar Cotas Premiadas</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{campaignTitle}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <motion.button
                  onClick={() => setShowCadastrarModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="h-4 w-4" />
                  Cadastrar Cota
                </motion.button>
                <motion.button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </motion.button>
              </div>
            </div>

            {/* Controls */}
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={visivelPublico}
                      onChange={handleToggleVisibility}
                      disabled={togglingVisibility}
                      className="sr-only"
                    />
                    <div
                      className={`w-14 h-8 rounded-full transition-colors duration-200 ${
                        visivelPublico
                          ? 'bg-purple-600'
                          : 'bg-gray-300 dark:bg-gray-600'
                      } ${togglingVisibility ? 'opacity-50 cursor-not-allowed' : ''}`}
                    ></div>
                    <div
                      className={`absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 ${
                        visivelPublico ? 'transform translate-x-6' : ''
                      }`}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Deixar as cotas premiadas visíveis para os participantes
                  </span>
                </label>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center space-x-2">
                {(['todos', 'disponivel', 'encontrada'] as FilterTab[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200 ${
                      activeFilter === filter
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {filter === 'todos' ? 'Todos' : filter === 'disponivel' ? 'Disponível' : 'Encontrada'}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar-dark">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
              ) : filteredCotas.length === 0 ? (
                <motion.div
                  className="text-center py-12"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Award className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {activeFilter === 'todos'
                      ? 'Nenhuma cota premiada cadastrada'
                      : `Nenhuma cota ${activeFilter === 'disponivel' ? 'disponível' : 'encontrada'}`}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {activeFilter === 'todos'
                      ? 'Clique em "Cadastrar Cota" para adicionar a primeira cota premiada'
                      : 'Altere o filtro para ver outras cotas'}
                  </p>
                </motion.div>
              ) : (
                <>
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Resultado ({filteredCotas.length})
                    </p>
                  </div>
                  <div className="space-y-3">
                    {filteredCotas.map((cota, index) => (
                      <motion.div
                        key={cota.id}
                        custom={index}
                        variants={cotaCardVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover={{ scale: 1.01, x: 4 }}
                        className={`rounded-lg p-4 border-2 relative flex items-center justify-between ${
                          cota.status === 'disponivel'
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : cota.status === 'comprada'
                            ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        <div className="flex items-center gap-6 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              {cota.status === 'disponivel'
                                ? 'Titulo disponível'
                                : cota.status === 'comprada'
                                ? 'Titulo comprado'
                                : 'Titulo encontrado'}
                            </p>
                            {/* ✅ 0-BASED INDEXING: Display numero directly (0 to N-1) */}
                            <p className="text-2xl font-extrabold text-gray-900 dark:text-white">
                              {formatQuotaNumber(cota.numero_cota)}
                            </p>
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-900 dark:text-white mb-1">Premio:</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{cota.premio}</p>
                          </div>

                          {cota.winner_name && (
                            <div className="flex-shrink-0 px-4 border-l border-gray-200 dark:border-gray-700">
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Ganhador:</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{cota.winner_name}</p>
                            </div>
                          )}

                          {cota.status === 'encontrada' && (
                            <div className="flex-shrink-0">
                              <div className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                                Ganhador
                              </div>
                            </div>
                          )}
                        </div>

                        <motion.button
                          onClick={() => handleDeleteCota(cota.id)}
                          className="ml-4 p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors duration-200 flex-shrink-0"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Excluir cota premiada"
                        >
                          <Trash2 className="h-4 w-4" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ✅ 0-BASED INDEXING: Modal receives and sends 0-indexed numbers (0 to N-1) */}
      <CadastrarCotaPremiadaModal
        isOpen={showCadastrarModal}
        onClose={() => setShowCadastrarModal(false)}
        onSubmit={handleCreateCota}
        totalTickets={totalTickets}
        loading={submitting}
      />
    </AnimatePresence>
  );
};

export default CotasPremiadasAdminModal;