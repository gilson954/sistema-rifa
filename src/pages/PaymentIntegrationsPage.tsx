import React from 'react';
import { ArrowLeft, Info, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PaymentIntegrationsPage = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  const paymentProviders = [
    {
      name: 'Fluxsis',
      logo: '/api/placeholder/120/40',
      status: 'inactive',
      recommended: true
    },
    {
      name: 'Pay2m',
      logo: '/api/placeholder/120/40',
      status: 'inactive'
    },
    {
      name: 'Paggue',
      logo: '/api/placeholder/120/40',
      status: 'inactive'
    },
    {
      name: 'Mercado Pago',
      logo: '/api/placeholder/120/40',
      status: 'inactive'
    },
    {
      name: 'Efí Bank',
      logo: '/api/placeholder/120/40',
      status: 'inactive'
    }
  ];

  return (
    <div>
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300 -mx-4 -mt-6 mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleGoBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Integrações de pagamento
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl">
        {/* Processing Order Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Ordem de processamento
            </h2>
            <Info className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Arraste os métodos de pagamento para definir a ordem de processamento.
          </p>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-yellow-800 dark:text-yellow-200">
              Nenhum método de pagamento ativo até o momento
            </span>
          </div>
        </div>

        {/* Automatic Download Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Baixa automática
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receba diretamente em sua conta e a baixa dos bilhetes é automática
              </p>
            </div>
            <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium">
              Recomendado
            </span>
          </div>

          <div className="space-y-4">
            {paymentProviders.map((provider, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 flex items-center justify-between transition-colors duration-300"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-24 h-8 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {provider.name}
                    </span>
                  </div>
                  {provider.recommended && (
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded text-xs font-medium">
                      Recomendado
                    </span>
                  )}
                </div>
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                  Configurar
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Manual Download Section */}
        <div>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Baixa Manual
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Receba diretamente em sua conta porém é necessário fazer a baixa manual das compras
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 flex items-center justify-between transition-colors duration-300">
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  PIX
                </span>
              </div>
            </div>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
              Configurar
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Precisa de ajuda?
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                Nossa equipe está disponível para ajudar você a configurar suas integrações de pagamento.
              </p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                Falar com Suporte
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentIntegrationsPage;