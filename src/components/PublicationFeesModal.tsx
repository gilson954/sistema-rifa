import React from 'react';
import { X } from 'lucide-react';
import { STRIPE_PRODUCTS, formatPrice } from '../stripe-config';

interface PublicationFeesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PublicationFeesModal: React.FC<PublicationFeesModalProps> = ({ isOpen, onClose }) => {
  // Filter for only publication fee products and sort them by minRevenue
  const publicationFeeTiers = STRIPE_PRODUCTS.filter(p => p.mode === 'payment' && p.minRevenue !== undefined)
    .sort((a, b) => a.minRevenue! - b.minRevenue!);

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
            A taxa de publicação é um valor cobrado para ativar sua campanha na plataforma, variando de acordo com a arrecadação estimada.
          </p>

          {/* Fee Table */}
          <div className="bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-200 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Arrecadação Estimada
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Taxa de Publicação
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {publicationFeeTiers.map((tier, index) => (
                  <tr key={tier.id} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {tier.maxRevenue === Infinity ? (
                        `Acima de ${formatPrice(tier.minRevenue! - 0.01)}`
                      ) : (
                        `${formatPrice(tier.minRevenue!)} a ${formatPrice(tier.maxRevenue!)}`
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600 dark:text-green-400">
                      {formatPrice(tier.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Importante:</strong> A taxa de publicação é cobrada uma única vez e permite que sua campanha seja publicada na plataforma. O valor da taxa é determinado pela sua arrecadação estimada.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicationFeesModal;