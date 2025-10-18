import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Copy, CheckCircle, User, Mail, Phone, Hash, QrCode, AlertTriangle, Timer, Hourglass, Package } from 'lucide-react';
import CampaignHeader from '../components/CampaignHeader';
import CampaignFooter from '../components/CampaignFooter';
import { useAuth } from '../context/AuthContext';

interface ReservationData {
  reservationId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  quotaCount: number;
  totalValue: number;
  selectedQuotas?: number[];
  campaignTitle: string;
  campaignId: string;
  campaignPublicId?: string;
  expiresAt: string;
  reservationTimeoutMinutes?: number;
}

const PaymentConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signInWithPhone, isPhoneAuthenticated } = useAuth();

  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);

  const reservationData = location.state?.reservationData as ReservationData;

  useEffect(() => {
    if (!reservationData) {
      navigate('/');
      return;
    }

    if (reservationData.customerPhone && !isPhoneAuthenticated) {
      signInWithPhone(reservationData.customerPhone);
    }
  }, [reservationData, navigate, signInWithPhone, isPhoneAuthenticated]);

  useEffect(() => {
    if (!reservationData?.expiresAt) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiration = new Date(reservationData.expiresAt).getTime();
      const difference = expiration - now;

      if (difference <= 0) {
        setTimeRemaining('00:00');
        setIsExpired(true);
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeRemaining(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [reservationData?.expiresAt]);

  const handleCopyReservationId = async () => {
    if (reservationData?.reservationId) {
      try {
        await navigator.clipboard.writeText(reservationData.reservationId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  const handleCopyPixKey = async () => {
    const pixKey = `00020126580014br.gov.bcb.pix0136${reservationData?.reservationId || 'mock-key'}5204000053039865802BR5925RIFAQUI PAGAMENTOS LTDA6009SAO PAULO62070503***6304ABCD`;
    try {
      await navigator.clipboard.writeText(pixKey);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2000);
    } catch (error) {
      console.error('Failed to copy PIX key:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (!reservationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex flex-col">
        <CampaignHeader onMyTicketsClick={() => navigate('/my-tickets')} />

        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-12 text-center border border-gray-200 dark:border-gray-800 max-w-md"
          >
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Timer className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Pagamento Expirado
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Seu pagamento foi expirado. Caso o pagamento não seja confirmado, os títulos voltam a ficar disponíveis.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/c/${reservationData.campaignPublicId || reservationData.campaignId}`)}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-xl font-bold transition-all duration-200 shadow-lg"
              >
                Voltar para Campanha
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white py-3 rounded-xl font-bold transition-all duration-200"
              >
                Ir para Home
              </button>
            </div>
          </motion.div>
        </div>

        <CampaignFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex flex-col">
      <CampaignHeader onMyTicketsClick={() => navigate('/my-tickets')} />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-yellow-200 dark:border-yellow-800 shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <Hourglass className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  Aguardando Pagamento!
                </h2>
                <p className="text-gray-700 dark:text-gray-300">
                  Realize o pagamento
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Você tem
                </div>
                <div className={`text-3xl font-bold ${timeRemaining.startsWith('0:') && parseInt(timeRemaining.split(':')[1]) < 5 ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-orange-600 dark:text-orange-400'}`}>
                  {timeRemaining}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  para pagar
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <Package className="h-6 w-6 text-purple-600" />
                <span>{reservationData.campaignTitle}</span>
              </h3>

              <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-4 mb-6 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Pacote Promocional</span>
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    R$0,05
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">Títulos: {String(reservationData.quotaCount).padStart(3, '0')}</span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Código de Identificação</span>
                  <button
                    onClick={handleCopyReservationId}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Copiar código"
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    )}
                  </button>
                </div>
                <div className="font-mono text-xs text-gray-900 dark:text-white break-all">
                  {reservationData.reservationId}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">Comprador</div>
                    <div className="font-medium text-gray-900 dark:text-white">{reservationData.customerName}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">Telefone</div>
                    <div className="font-medium text-gray-900 dark:text-white">{reservationData.customerPhone}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">Email</div>
                    <div className="font-medium text-gray-900 dark:text-white truncate">{reservationData.customerEmail}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <Hash className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">Quantidade</div>
                    <div className="font-medium text-gray-900 dark:text-white">{reservationData.quotaCount}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">Data/horário</div>
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {new Date().toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                    <Timer className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">Expira em</div>
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {new Date(reservationData.expiresAt).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              </div>

              {reservationData.selectedQuotas && reservationData.selectedQuotas.length > 0 && (
                <div className="mt-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                  <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Títulos:
                  </div>
                  <div className="font-mono text-sm text-blue-900 dark:text-blue-100 font-semibold">
                    {reservationData.selectedQuotas.sort((a, b) => a - b).join(', ')}
                  </div>
                </div>
              )}

              <div className="mt-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-green-600 dark:text-green-400">
                    {formatCurrency(reservationData.totalValue)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-2xl p-6 border border-orange-200 dark:border-orange-800 shadow-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-1" />
                <div className="text-sm text-orange-800 dark:text-orange-200">
                  <p className="font-semibold mb-2">Este pagamento só pode ser realizado dentro do tempo. Após este período, caso o pagamento não seja confirmado, os títulos voltam a ficar disponíveis.</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Como Pagar
              </h3>

              <div className="space-y-4 mb-6">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 dark:text-purple-400 font-bold">1</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 pt-1">
                    Copie o código PIX abaixo
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 dark:text-purple-400 font-bold">2</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 pt-1">
                    Abra o app do seu banco e escolha a opção PIX, como se fosse fazer uma transferência.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 dark:text-purple-400 font-bold">3</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 pt-1">
                    Selecione a opção PIX copia e cola, cole a chave copiada e confirme o pagamento.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-4">
                <div className="w-full aspect-square bg-white border-4 border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-center mb-4">
                  <QrCode className="h-32 w-32 text-gray-400" />
                </div>
                <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Mostrar QR Code
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-6">
                <div className="flex items-start justify-between space-x-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Chave PIX (Copia e Cola)
                    </div>
                    <div className="font-mono text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700 break-all">
                      00020126580014br.gov.bcb.pix0136{reservationData.reservationId}5204000053039865802BR5925RIFAQUI PAGAMENTOS LTDA6009SAO PAULO62070503***6304ABCD
                    </div>
                  </div>
                  <button
                    onClick={handleCopyPixKey}
                    className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex-shrink-0 shadow-md"
                    title="Copiar"
                  >
                    {copiedPix ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Problemas com sua compra?{' '}
                <button className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  Clique aqui
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      <CampaignFooter />
    </div>
  );
};

export default PaymentConfirmationPage;
