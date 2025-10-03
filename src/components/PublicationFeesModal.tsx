import React from 'react';
import { X, DollarSign, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';
import { STRIPE_PRODUCTS, formatPrice } from '../stripe-config';

interface PublicationFeesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PublicationFeesModal: React.FC<PublicationFeesModalProps> = ({ isOpen, onClose }) => {
  const publicationFeeTiers = STRIPE_PRODUCTS.filter(
    p => p.mode === 'payment' && p.minRevenue !== undefined
  ).sort((a, b) => a.minRevenue! - b.minRevenue!);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200/20 dark:border-gray-700/30">
        {/* Header com gradiente */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-50/80 to-blue-50/80 dark:from-purple-900/20 dark:to-blue-900/20 backdrop-blur-sm border-b border-purple-200/30 dark:border-purple-800/30 p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Tabela de Taxas
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Valores para publicação de campanhas
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-xl transition-all duration-200 hover:scale-110"
              aria-label="Fechar modal"
            >
              <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Descrição */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                  A <strong>taxa de publicação</strong> é um valor único cobrado para ativar sua campanha na plataforma. 
                  O valor varia de acordo com a <strong>arrecadação estimada</strong> da sua campanha.
                </p>
              </div>
            </div>
          </div>

          {/* Tabela de Taxas - Modernizada */}
          <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-200/20 dark:border-gray-700/30 overflow-hidden shadow-lg">
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 border-b border-purple-200/30 dark:border-purple-800/30 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                    Arrecadação Estimada
                  </span>
                </div>
                <div className="flex items-center justify-end space-x-2">
                  <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                    Taxa de Publicação
                  </span>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {publicationFeeTiers.map((tier, index) => (
                <div
                  key={tier.id}
                  className={`p-4 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                    index % 2 === 0
                      ? 'bg-white dark:bg-gray-900/40'
                      : 'bg-gray-50/50 dark:bg-gray-800/30'
                  }`}
                >
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {tier.maxRevenue === Infinity
                            ? `Acima de ${formatPrice(tier.minRevenue! - 0.01)}`
                            : `${formatPrice(tier.minRevenue!)} a ${formatPrice(tier.maxRevenue!)}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-end">
                      <div className="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200/50 dark:border-green-800/50 rounded-xl">
                        <span className="text-base font-bold text-green-600 dark:text-green-400">
                          {formatPrice(tier.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info Card */}
          <div className="mt-6 relative overflow-hidden bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:from-amber-900/20 dark:to-orange-900/20 backdrop-blur-sm rounded-2xl border border-amber-200/30 dark:border-amber-800/30 p-5 shadow-md">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full blur-2xl"></div>
            
            <div className="relative flex items-start space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-100 mb-2">
                  Informações Importantes
                </h4>
                <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
                  <li className="flex items-start space-x-2">
                    <span className="text-amber-600 dark:text-amber-400 font-bold mt-0.5">•</span>
                    <span>A taxa de publicação é cobrada <strong>uma única vez</strong> para ativar sua campanha</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-amber-600 dark:text-amber-400 font-bold mt-0.5">•</span>
                    <span>O valor é determinado automaticamente pela sua <strong>arrecadação estimada</strong></span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-amber-600 dark:text-amber-400 font-bold mt-0.5">•</span>
                    <span>Após o pagamento, sua campanha será <strong>ativada automaticamente</strong></span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer com botão */}
        <div className="border-t border-gray-200/20 dark:border-gray-700/30 p-6 bg-gray-50/50 dark:bg-gray-800/30">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-bold text-base shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-xl animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 text-white"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublicationFeesModal;