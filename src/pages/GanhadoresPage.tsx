import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Trophy, Ticket, User, Sparkles, CheckCircle } from 'lucide-react';
import { Campaign } from '../types/campaign';
import { CampaignAPI } from '../lib/api/campaigns';
import { SorteioAPI, Winner } from '../lib/api/sorteio';

const GanhadoresPage: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (location.state?.showSuccess) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
    loadData();
  }, [campaignId]);

  const loadData = async () => {
    if (!campaignId) return;

    setLoading(true);

    try {
      const [campaignResult, winnersResult] = await Promise.all([
        CampaignAPI.getCampaignById(campaignId),
        SorteioAPI.getWinners(campaignId)
      ]);

      if (campaignResult.data) {
        setCampaign(campaignResult.data);
      }

      if (winnersResult.data) {
        setWinners(winnersResult.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWinnerClick = (winnerId: string) => {
    navigate(`/dashboard/campaigns/${campaignId}/ganhador/${winnerId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando ganhadores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-gray-900 dark:text-white">
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-green-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-lg">Sorteio realizado com sucesso!</p>
                <p className="text-sm text-green-100">Os ganhadores foram registrados</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Voltar ao Dashboard</span>
          </button>

          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Ganhadores do Sorteio</h1>
                <p className="text-purple-100 mt-1">
                  {campaign?.title || 'Campanha'}
                </p>
              </div>
            </div>

            {winners.length > 0 && (
              <div className="mt-6 flex items-center gap-2 text-white">
                <Sparkles className="h-5 w-5" />
                <p className="text-lg font-semibold">
                  {winners.length} {winners.length === 1 ? 'prêmio sorteado' : 'prêmios sorteados'}
                </p>
              </div>
            )}
          </div>

          {winners.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center border border-gray-200/20 dark:border-gray-700/30"
            >
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-10 w-10 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Nenhum ganhador encontrado
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                O sorteio ainda não foi realizado para esta campanha
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {winners.map((winner, index) => (
                <motion.div
                  key={winner.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleWinnerClick(winner.id)}
                  className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/20 dark:border-gray-700/30 overflow-hidden cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl" />

                    <div className="relative">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Trophy className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {winner.prize_name}
                      </h3>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Ganhador</p>
                          <p className="font-bold text-gray-900 dark:text-white truncate">
                            {winner.winner_name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Ticket className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Título Vencedor</p>
                          <p className="font-bold text-blue-600 dark:text-blue-400 text-xl">
                            {winner.ticket_number}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200/20 dark:border-gray-700/30">
                      <p className="text-sm text-center text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors font-medium">
                        Clique para ver detalhes
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default GanhadoresPage;
