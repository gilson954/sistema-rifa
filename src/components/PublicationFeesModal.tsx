import React from 'react';
import { X } from 'lucide-react';
import { STRIPE_PRODUCTS, formatPrice } from '../stripe-config';

interface PublicationFeesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PublicationFeesModal: React.FC<PublicationFeesModalProps> = ({ isOpen, onClose }) => {
  const rifaquiProduct = STRIPE_PRODUCTS.find(p => p.name === 'Rifaqui');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Taxas de Publicação
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            A taxa de publicação é um valor fixo para ativar sua campanha na plataforma.
          </p>

          {/* Product Information */}
          {rifaquiProduct && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700/50 rounded-lg p-6 mb-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {rifaquiProduct.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {rifaquiProduct.description}
                </p>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {formatPrice(rifaquiProduct.price, rifaquiProduct.currency)}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Importante:</strong> A taxa de publicação é cobrada uma única vez e permite que sua campanha seja publicada na plataforma. Este é um valor fixo independente do tamanho da sua campanha.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicationFeesModal;