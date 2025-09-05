import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, Home, RefreshCw } from 'lucide-react';

const PaymentCancelledPage = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleTryAgain = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-800 text-center max-w-md">
        {/* Cancel Icon */}
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
        </div>

        {/* Cancel Message */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Pagamento Cancelado
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Seu pagamento foi cancelado. Nenhuma cobrança foi realizada em sua conta.
        </p>

        {/* Information */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
          <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
            O que aconteceu?
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            O processo de pagamento foi interrompido. Sua campanha permanece como rascunho até que o pagamento seja concluído.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleTryAgain}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Tentar Novamente</span>
          </button>
          
          <button
            onClick={handleGoBack}
            className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Voltar</span>
          </button>
        </div>

        {/* Support Link */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Problemas com o pagamento?{' '}
            <a href="#" className="text-purple-600 dark:text-purple-400 hover:underline">
              Entre em contato
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelledPage;