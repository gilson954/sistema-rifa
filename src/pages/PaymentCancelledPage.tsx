import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, Home, RefreshCw, AlertTriangle, HelpCircle, Mail } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200/20 dark:border-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={handleGoHome}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Home className="h-5 w-5" />
              <span className="hidden sm:inline">Página Inicial</span>
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Cancel Message */}
          <div className="flex items-center justify-center lg:justify-end">
            <div className="text-center lg:text-right">
              <div className="inline-flex w-24 h-24 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 rounded-full items-center justify-center mx-auto lg:mx-0 mb-6 shadow-lg border-4 border-red-200/50 dark:border-red-800/50">
                <XCircle className="h-14 w-14 text-red-600 dark:text-red-400" />
              </div>

              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Pagamento Cancelado
              </h1>
              
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto lg:mx-0">
                O processo de pagamento foi interrompido. Nenhuma cobrança foi realizada.
              </p>

              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-full px-4 py-2">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-red-800 dark:text-red-200">
                  Transação não concluída
                </span>
              </div>
            </div>
          </div>

          {/* Right Column - Actions & Info */}
          <div className="space-y-6">
            {/* Information Card */}
            <div className="rounded-2xl p-6 border transition-all duration-200 bg-white/60 dark:bg-gray-900/40 border-gray-200/20 dark:border-gray-700/20 shadow-lg">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    O que aconteceu?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    O processo de pagamento foi interrompido antes da conclusão. Sua campanha permanece como rascunho até que o pagamento seja concluído com sucesso.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/30 rounded-xl p-4 mt-4">
                <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  Próximos Passos
                </h4>
                <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                  <li className="flex items-start gap-2">
                    <span className="font-bold mt-0.5">•</span>
                    <span>Você pode tentar realizar o pagamento novamente a qualquer momento</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold mt-0.5">•</span>
                    <span>Suas informações foram salvas e estão seguras</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold mt-0.5">•</span>
                    <span>Nenhum valor foi debitado da sua conta</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="rounded-2xl p-6 border transition-all duration-200 bg-white/60 dark:bg-gray-900/40 border-gray-200/20 dark:border-gray-700/20 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Como deseja continuar?
              </h3>

              <div className="space-y-3">
                <button
                  onClick={handleTryAgain}
                  className="w-full animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-purple-600 via-blue-500 to-indigo-600 hover:shadow-xl text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg transform hover:-translate-y-0.5"
                >
                  <RefreshCw className="h-5 w-5" />
                  <span>Tentar Novamente</span>
                </button>
                
                <button
                  onClick={handleGoBack}
                  className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Voltar</span>
                </button>

                <button
                  onClick={handleGoHome}
                  className="w-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700 px-6 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Home className="h-5 w-5" />
                  <span>Ir para Início</span>
                </button>
              </div>
            </div>

            {/* Support Section */}
            <div className="rounded-2xl p-6 border transition-all duration-200 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200/30 dark:border-purple-800/30 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                    Precisa de Ajuda?
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Se você encontrou algum problema durante o pagamento, nossa equipe está pronta para ajudar.
                  </p>
                  <button className="animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 hover:shadow-lg text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm inline-flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>Falar com Suporte</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Reassurance Message */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200/50 dark:border-green-800/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                    Seus dados estão seguros
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Todas as informações da sua campanha foram salvas automaticamente. Você pode retomar o processo a qualquer momento.
                  </p>
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

export default PaymentCancelledPage;