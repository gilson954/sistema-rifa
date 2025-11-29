import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trophy, Calendar, DollarSign, Users, CheckCircle, XCircle, Loader2, Sparkles } from 'lucide-react';
import { Campaign } from '../types/campaign';
import { Prize } from '../types/promotion';
import { CampaignAPI } from '../lib/api/campaigns';
import { SorteioAPI, TicketValidationResult } from '../lib/api/sorteio';
import ConfirmarSorteioModal from '../components/ConfirmarSorteioModal';
import { useAuth } from '../context/AuthContext';

interface PrizeDrawInput {
  prizeId: string;
  prizeName: string;
  ticketNumber: string;
  validation: TicketValidationResult | null;
  isValidating: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const RealizarSorteioPage: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [prizeInputs, setPrizeInputs] = useState<PrizeDrawInput[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadCampaign = useCallback(async () => {
    if (!campaignId) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const alreadyDrawn = await SorteioAPI.checkIfDrawnAlready(campaignId);
      if (alreadyDrawn) {
        setErrorMessage('Sorteio já realizado para esta campanha.');
        setTimeout(() => {
          navigate(`/dashboard/campaigns/${campaignId}/ganhadores`);
        }, 2000);
        return;
      }

      const { data, error } = await CampaignAPI.getCampaignById(campaignId);

      if (error || !data) {
        setErrorMessage('Erro ao carregar campanha');
        return;
      }

      if (data.user_id !== user?.id) {
        setErrorMessage('Você não tem permissão para realizar este sorteio');
        return;
      }

      if (data.status !== 'active') {
        setErrorMessage('Apenas campanhas ativas podem ter sorteios realizados');
        return;
      }

      if (!data.prizes || data.prizes.length === 0) {
        setErrorMessage('Adicione pelo menos um prêmio antes de realizar o sorteio');
        return;
      }

      setCampaign(data);

      const inputs: PrizeDrawInput[] = data.prizes.map((prize: Prize) => ({
        prizeId: prize.id,
        prizeName: prize.name,
        ticketNumber: '',
        validation: null,
        isValidating: false
      }));

      setPrizeInputs(inputs);
    } catch (error) {
      console.error('Error loading campaign:', error);
      setErrorMessage('Erro ao carregar campanha');
    } finally {
      setLoading(false);
    }
  }, [campaignId, navigate, user]);

  useEffect(() => {
    loadCampaign();
  }, [campaignId, loadCampaign]);

  const handleTicketNumberChange = async (prizeId: string, value: string) => {
    const numericValue = value.replace(/\D/g, '');

    setPrizeInputs(prev => prev.map(input =>
      input.prizeId === prizeId
        ? { ...input, ticketNumber: numericValue, validation: null }
        : input
    ));

    if (numericValue && numericValue.length > 0) {
      validateTicket(prizeId, parseInt(numericValue, 10));
    }
  };

  const validateTicket = async (prizeId: string, ticketNumber: number) => {
    if (!campaignId) return;

    setPrizeInputs(prev => prev.map(input =>
      input.prizeId === prizeId
        ? { ...input, isValidating: true }
        : input
    ));

    const validation = await SorteioAPI.validateTicket(campaignId, ticketNumber);

    setPrizeInputs(prev => prev.map(input =>
      input.prizeId === prizeId
        ? { ...input, validation, isValidating: false }
        : input
    ));
  };

  const canContinue = () => {
    if (prizeInputs.length === 0) return false;

    return prizeInputs.every(input =>
      input.ticketNumber &&
      input.validation &&
      input.validation.isValid &&
      input.validation.isSold
    );
  };

  const handleContinue = () => {
    const ticketNumbers = prizeInputs.map(input => parseInt(input.ticketNumber, 10));
    const uniqueNumbers = new Set(ticketNumbers);

    if (uniqueNumbers.size !== ticketNumbers.length) {
      setErrorMessage('Não é permitido usar o mesmo número de título para prêmios diferentes');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmDraw = async () => {
    if (!campaignId) return;

    setIsDrawing(true);
    setErrorMessage('');

    try {
      const drawRequest = {
        campaignId,
        prizes: prizeInputs.map(input => ({
          prizeId: input.prizeId,
          prizeName: input.prizeName,
          ticketNumber: parseInt(input.ticketNumber, 10)
        }))
      };

      const result = await SorteioAPI.performDraw(drawRequest);

      if (result.success) {
        setShowConfirmModal(false);
        navigate(`/dashboard/campaigns/${campaignId}/ganhadores`, {
          state: { showSuccess: true }
        });
      } else {
        setErrorMessage(result.message);
        setShowConfirmModal(false);
      }
    } catch (error) {
      console.error('Error performing draw:', error);
      setErrorMessage('Erro ao realizar sorteio');
      setShowConfirmModal(false);
    } finally {
      setIsDrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando campanha...</p>
        </div>
      </div>
    );
  }

  if (errorMessage && !campaign) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 text-center border border-red-200/20 dark:border-red-800/30"
        >
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Erro</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{errorMessage}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            Voltar ao Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  if (!campaign) return null;

  return (
    <div className="min-h-screen bg-transparent text-gray-900 dark:text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <span className="font-medium">Voltar</span>
          </button>

          <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/20 dark:border-gray-700/30 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Trophy className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Realizar Sorteio</h1>
                  <p className="text-purple-100">Defina os números vencedores para cada prêmio</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-white" />
                    <div>
                      <p className="text-xs text-purple-100">Encerramento</p>
                      <p className="font-bold text-white">{formatDate(campaign.end_date)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-white" />
                    <div>
                      <p className="text-xs text-purple-100">Títulos Vendidos</p>
                      <p className="font-bold text-white">{campaign.sold_tickets}/{campaign.total_tickets}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-white" />
                    <div>
                      <p className="text-xs text-purple-100">Arrecadado</p>
                      <p className="font-bold text-white">{formatCurrency(campaign.ticket_price * campaign.sold_tickets)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Campanha: {campaign.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Digite o número vencedor para cada prêmio cadastrado
                </p>
              </div>

              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/30"
                >
                  <p className="text-red-800 dark:text-red-300 font-medium">{errorMessage}</p>
                </motion.div>
              )}

              <div className="space-y-4">
                {prizeInputs.map((input, index) => (
                  <motion.div
                    key={input.prizeId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-5 rounded-xl border border-gray-200/20 dark:border-gray-700/30 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/50"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Trophy className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                          {input.prizeName}
                        </h3>

                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Número do título vencedor
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={input.ticketNumber}
                              onChange={(e) => handleTicketNumberChange(input.prizeId, e.target.value)}
                              placeholder="Digite o número do título"
                              className="w-full px-4 py-3 rounded-xl border border-gray-200/20 dark:border-gray-700/30 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                            />
                            {input.isValidating && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
                              </div>
                            )}
                          </div>
                        </div>

                        {input.validation && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`p-3 rounded-xl flex items-center gap-3 ${
                              input.validation.isValid && input.validation.isSold
                                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200/50 dark:border-green-800/30'
                                : 'bg-red-50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/30'
                            }`}
                          >
                            {input.validation.isValid && input.validation.isSold ? (
                              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                            )}
                            <p className={`text-sm font-medium ${
                              input.validation.isValid && input.validation.isSold
                                ? 'text-green-800 dark:text-green-300'
                                : 'text-red-800 dark:text-red-300'
                            }`}>
                              {input.validation.message}
                            </p>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleContinue}
                  disabled={!canContinue()}
                  className="px-8 py-4 rounded-xl font-bold text-lg text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Sparkles className="h-6 w-6" />
                  <span>Continuar</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <ConfirmarSorteioModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmDraw}
        winners={prizeInputs.map(input => ({
          prizeId: input.prizeId,
          prizeName: input.prizeName,
          ticketNumber: parseInt(input.ticketNumber, 10),
          winnerName: input.validation?.ticket?.customer_name || 'Nome não informado'
        }))}
        isLoading={isDrawing}
      />
    </div>
  );
};

export default RealizarSorteioPage;
