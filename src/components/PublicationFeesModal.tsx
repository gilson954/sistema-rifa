import React from 'react';
import { X } from 'lucide-react';

interface PublicationFeesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PublicationFeesModal: React.FC<PublicationFeesModalProps> = ({ isOpen, onClose }) => {
  const feeRanges = [
    { min: 0, max: 100, fee: 7.00 },
    { min: 100.01, max: 200, fee: 17.00 },
    { min: 200.01, max: 400, fee: 27.00 },
    { min: 400.01, max: 701, fee: 37.00 },
    { min: 701.01, max: 1000, fee: 57.00 },
    { min: 1000.01, max: 2000, fee: 67.00 },
    { min: 2000.01, max: 4000, fee: 77.00 },
    { min: 4000.01, max: 7000, fee: 127.00 },
    { min: 7100.01, max: 10000, fee: 197.00 },
    { min: 10000.01, max: 20000, fee: 247.00 },
    { min: 20000.01, max: 30000, fee: 497.00 },
    { min: 30000.01, max: 50000, fee: 997.00 },
    { min: 50000.01, max: 70000, fee: 1297.00 },
    { min: 70000.01, max: 100000, fee: 1997.00 },
    { min: 100000.01, max: 150000, fee: 2997.00 },
    { min: 150000.01, max: Infinity, fee: 3997.00 }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatRange = (min: number, max: number) => {
    if (max === Infinity) {
      return `Acima de ${formatCurrency(min)}`;
    }
    return `${formatCurrency(min)} a ${formatCurrency(max)}`;
  };

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
            As taxas de publicação são calculadas com base na arrecadação estimada da sua campanha.
          </p>

          {/* Fees Table */}
          <div className="bg-gray-900 dark:bg-gray-800 rounded-lg overflow-hidden">
            <div className="grid grid-cols-2 bg-gray-800 dark:bg-gray-700">
              <div className="px-4 py-3 text-green-400 font-semibold text-center border-r border-gray-600">
                ARRECADAÇÃO ESTIMADA
              </div>
              <div className="px-4 py-3 text-orange-400 font-semibold text-center">
                TAXA DE PUBLICAÇÃO
              </div>
            </div>
            
            <div className="divide-y divide-gray-700">
              {feeRanges.map((range, index) => (
                <div key={index} className="grid grid-cols-2">
                  <div className="px-4 py-3 text-green-300 text-sm border-r border-gray-700">
                    {formatRange(range.min, range.max)}
                  </div>
                  <div className="px-4 py-3 text-orange-300 text-sm text-center">
                    {formatCurrency(range.fee)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Importante:</strong> A taxa de publicação é cobrada uma única vez e permite que sua campanha seja publicada na plataforma. O valor é calculado automaticamente com base na arrecadação estimada (quantidade de cotas × valor por cota).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicationFeesModal;