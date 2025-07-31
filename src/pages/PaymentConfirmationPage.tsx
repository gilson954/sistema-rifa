import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Clock, Copy, CheckCircle, CreditCard, ArrowLeft, Shield, User, Mail, Phone, Hash } from 'lucide-react';

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

  // Get reservation data from navigation state
  const reservationData = location.state?.reservationData as ReservationData;

  // Redirect if no reservation data
  useEffect(() => {
    if (!reservationData) {
      navigate('/');
      return;
    }
  }, [reservationData, navigate]);

  // Update countdown timer
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

  const handlePayment = () => {
    // In production, this would integrate with actual payment gateway
    alert('Redirecionando para pagamento PIX...');
    // For now, redirect back to campaign
    navigate(`/c/${reservationData?.campaignId}`);
  };

  const handleGoBack = () => {
    navigate(`/c/${reservationData?.campaignId}`);
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
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
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={handleGoBack}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Voltar para campanha</span>
            </button>
            
            <div className="flex items-center space-x-2">
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Reservation Info */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Reserva Confirmada!
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Suas cotas foram reservadas com sucesso
                  </p>
                </div>
              </div>

              {/* Timer */}
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <div>
                    <div className="font-semibold text-orange-800 dark:text-orange-200">
                      Pague em até {timeRemaining}
                    </div>
                    <div className="text-sm text-orange-700 dark:text-orange-300">
                      Após este prazo, suas cotas serão liberadas
                    </div>
                  </div>
                </div>
              </div>

              {/* Reservation Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Informações da reserva
                </h3>

                {/* Reservation ID */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Código de identificação
                      </div>
                      <div className="font-mono text-gray-900 dark:text-white font-medium">
                        {reservationData.reservationId}
                      </div>
                    </div>
                    <button
                      onClick={handleCopyReservationId}
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200"
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

                {/* Customer Info */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Nome</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {reservationData.customerName}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Email</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {reservationData.customerEmail}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Número de celular</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {reservationData.customerPhone}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Hash className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Quantidade de cotas</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {reservationData.quotaCount}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selected Quotas */}
                {reservationData.selectedQuotas && reservationData.selectedQuotas.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                      Seus números reservados:
                    </div>
                    <div className="font-mono text-blue-900 dark:text-blue-100 font-medium">
                      {reservationData.selectedQuotas.sort((a, b) => a - b).join(', ')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Payment */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Finalizar Pagamento
              </h2>

              {/* Campaign Summary */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {reservationData.campaignTitle}
                </h3>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    {reservationData.quotaCount} {reservationData.quotaCount === 1 ? 'cota' : 'cotas'}
                  </span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(reservationData.totalValue)}
                  </span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                  Método de pagamento
                </h4>
                
                <div className="border-2 border-green-500 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">₽</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">PIX</div>
                      <div className="text-sm text-green-600 dark:text-green-400">
                        Pagamento instantâneo
                      </div>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 border-green-500 bg-green-500 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Valor</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(reservationData.totalValue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="text-gray-900 dark:text-white">
                      {formatCurrency(reservationData.totalValue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Button */}
              <button
                onClick={handlePayment}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-bold text-lg transition-colors duration-200 shadow-lg flex items-center justify-center space-x-2"
              >
                <CreditCard className="h-5 w-5" />
                <span>Pagar PIX</span>
              </button>

              {/* Security Notice */}
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">
                      Pagamento Seguro
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Seus dados estão protegidos e o pagamento é processado de forma segura.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Help Section */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Precisa de ajuda?
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Suas cotas ficam reservadas por 15 minutos
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Após o pagamento, você receberá confirmação por email
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Guarde o código de identificação para consultas
                  </span>
                </div>
              </div>

              <button className="w-full mt-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white py-3 rounded-lg font-medium transition-colors duration-200">
                Falar com Suporte
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-6 mt-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-sm text-gray-600 dark:text-gray-400">
            <a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200">
              Termos de Uso
            </a>
            <span className="hidden sm:block">•</span>
            <a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200">
              Política de Privacidade
            </a>
            <span className="hidden sm:block">•</span>
            <span>Sistema desenvolvido por Rifaqui</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PaymentConfirmationPage;