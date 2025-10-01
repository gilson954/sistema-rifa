import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Clock, Copy, CheckCircle, CreditCard, ArrowLeft, Shield, User, Mail, Phone, Hash, QrCode, AlertTriangle, Zap, Timer } from 'lucide-react';

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
  expiresAt: string;
}

const PaymentConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);

  const reservationData = location.state?.reservationData as ReservationData;

  useEffect(() => {
    if (!reservationData) {
      navigate('/');
      return;
    }
  }, [reservationData, navigate]);

  useEffect(() => {
    if (!reservationData?.expiresAt) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiration = new Date(reservationData.expiresAt).getTime();
      const difference = expiration - now;

      if (difference <= 0) {
        setTimeRemaining('Expirado');
        return;
      }

      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
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

  const handlePayment = () => {
    const confirmPayment = window.confirm(
      'Simular pagamento PIX?\n\n' +
      'Em produção, isso abriria o app do banco ou copiaria a chave PIX.\n' +
      'Clique OK para simular pagamento aprovado.'
    );
    
    if (confirmPayment) {
      alert('✅ Pagamento simulado com sucesso!\n\nSuas cotas foram confirmadas e você receberá uma confirmação por email/WhatsApp.');
      navigate(`/c/${reservationData?.campaignId}`, {
        state: { paymentSuccess: true }
      });
    }
  };

  const handleGoBack = () => {
    navigate(`/c/${reservationData?.campaignId}`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (!reservationData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200/20 dark:border-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Voltar para campanha</span>
            </button>
            
            <div className="flex items-center gap-2">
              <img 
                src="/32132123.png" 
                alt="Rifaqui Logo" 
                className="w-8 h-8 object-contain"
              />
              <span className="text-xl font-bold text-gray-900 dark:text-white">Rifaqui</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Banner */}
        <div className="mb-6 rounded-2xl p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-800/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Reserva Confirmada!
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Suas cotas foram reservadas com sucesso. Complete o pagamento para garantir sua participação.
              </p>
            </div>
          </div>
        </div>

        {/* Timer Alert */}
        <div className="mb-6 rounded-2xl p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200/50 dark:border-orange-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Timer className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-orange-800 dark:text-orange-200 text-lg">
                Tempo restante: {timeRemaining}
              </div>
              <div className="text-sm text-orange-700 dark:text-orange-300">
                Após este prazo, suas cotas serão liberadas automaticamente
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Reservation Info */}
          <div className="space-y-6">
            {/* Reservation Details Card */}
            <div className="rounded-2xl p-6 border transition-all duration-200 bg-white/60 dark:bg-gray-900/40 border-gray-200/20 dark:border-gray-700/20 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Hash className="h-5 w-5 text-purple-600" />
                Informações da Reserva
              </h2>

              {/* Reservation ID */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-4 mb-4 border border-purple-200/30 dark:border-purple-800/30">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Código de Identificação
                    </div>
                    <div className="font-mono text-gray-900 dark:text-white font-semibold text-lg break-all">
                      {reservationData.reservationId}
                    </div>
                  </div>
                  <button
                    onClick={handleCopyReservationId}
                    className="ml-3 p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors duration-200"
                    title="Copiar código"
                  >
                    {copied ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Customer Info Grid */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Nome</div>
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {reservationData.customerName}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Email</div>
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {reservationData.customerEmail}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Celular</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {reservationData.customerPhone}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                    <Hash className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Quantidade de Cotas</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {reservationData.quotaCount} {reservationData.quotaCount === 1 ? 'cota' : 'cotas'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Selected Quotas */}
              {reservationData.selectedQuotas && reservationData.selectedQuotas.length > 0 && (
                <div className="mt-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-800/30 rounded-xl p-4">
                  <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Seus números reservados:
                  </div>
                  <div className="font-mono text-blue-900 dark:text-blue-100 font-semibold">
                    {reservationData.selectedQuotas.sort((a, b) => a - b).join(', ')}
                  </div>
                </div>
              )}
            </div>

            {/* Help Section */}
            <div className="rounded-2xl p-6 border transition-all duration-200 bg-white/60 dark:bg-gray-900/40 border-gray-200/20 dark:border-gray-700/20 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Informações Importantes
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Suas cotas ficam reservadas por 15 minutos
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Após o pagamento, você receberá confirmação por email
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Guarde o código de identificação para consultas futuras
                  </span>
                </div>
              </div>

              <button className="w-full mt-4 animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 hover:shadow-lg text-white py-3 rounded-xl font-semibold transition-all duration-200">
                Falar com Suporte
              </button>
            </div>
          </div>

          {/* Right Column - Payment */}
          <div className="space-y-6">
            {/* Payment Card */}
            <div className="rounded-2xl p-6 border transition-all duration-200 bg-white/60 dark:bg-gray-900/40 border-gray-200/20 dark:border-gray-700/20 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                Finalizar Pagamento
              </h2>

              {/* Campaign Summary */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800/30 rounded-xl p-4 mb-6 border border-gray-200/30 dark:border-gray-700/30">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  {reservationData.campaignTitle}
                </h3>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    {reservationData.quotaCount} {reservationData.quotaCount === 1 ? 'cota' : 'cotas'}
                  </span>
                  <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(reservationData.totalValue)}
                  </span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                  Método de Pagamento
                </h4>
                
                <div className="border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-xl">₽</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white">PIX</div>
                      <div className="text-sm text-green-600 dark:text-green-400">
                        Pagamento instantâneo e seguro
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full border-2 border-green-600 bg-green-600 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PIX Payment Section */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                  Dados para Pagamento PIX
                </h4>
                
                {/* QR Code */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/30 rounded-xl p-6 text-center mb-4 border border-gray-200/30 dark:border-gray-700/30">
                  <div className="w-40 h-40 bg-white border-4 border-gray-300 dark:border-gray-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <QrCode className="h-20 w-20 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    QR Code PIX
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Escaneie com o app do seu banco
                  </p>
                </div>

                {/* PIX Key */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200/30 dark:border-gray-700/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Chave PIX (Copia e Cola)
                      </div>
                      <div className="font-mono text-gray-900 dark:text-white font-medium text-xs break-all bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        00020126580014br.gov.bcb.pix0136{reservationData?.reservationId || 'mock-key'}5204000053039865802BR5925RIFAQUI PAGAMENTOS LTDA6009SAO PAULO62070503***6304ABCD
                      </div>
                    </div>
                    <button
                      onClick={handleCopyPixKey}
                      className="p-3 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors duration-200 flex-shrink-0"
                      title="Copiar chave PIX"
                    >
                      {copiedPix ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/30 rounded-xl p-4 mb-6 border border-gray-200/30 dark:border-gray-700/30">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(reservationData.totalValue)}
                    </span>
                  </div>
                  <div className="border-t border-gray-300 dark:border-gray-600 my-2"></div>
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span className="text-gray-900 dark:text-white">Total a Pagar</span>
                    <span className="text-green-600 dark:text-green-400">
                      {formatCurrency(reservationData.totalValue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Button */}
              <button
                onClick={handlePayment}
                className="w-full animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 hover:shadow-xl text-white py-4 rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg transform hover:-translate-y-0.5"
              >
                <CreditCard className="h-5 w-5" />
                <span>Confirmar Pagamento PIX</span>
              </button>

              {/* Payment Instructions */}
              <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-800/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                      Como Pagar com PIX
                    </p>
                    <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1.5">
                      <p className="flex items-start gap-2">
                        <span className="font-bold">1.</span>
                        <span>Abra o app do seu banco</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="font-bold">2.</span>
                        <span>Escaneie o QR Code ou copie a chave PIX</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="font-bold">3.</span>
                        <span>Confirme o pagamento de {formatCurrency(reservationData?.totalValue || 0)}</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="font-bold">4.</span>
                        <span>Aguarde a confirmação automática por email</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="mt-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-800/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-green-800 dark:text-green-200 mb-1">
                      Pagamento 100% Seguro
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      Seus dados estão protegidos com criptografia e o pagamento é processado por meio de plataforma certificada.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200/20 dark:border-gray-800/30 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-gray-600 dark:text-gray-400">
            <a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 font-medium">
              Termos de Uso
            </a>
            <span className="hidden sm:block text-gray-400">•</span>
            <a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 font-medium">
              Política de Privacidade
            </a>
            <span className="hidden sm:block text-gray-400">•</span>
            <span className="font-medium">Sistema desenvolvido por Rifaqui</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PaymentConfirmationPage;