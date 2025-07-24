import React from 'react';

interface QuotaGridProps {
  totalQuotas: number;
  selectedQuotas: number[];
  onQuotaSelect?: (quotaNumber: number) => void;
  mode: 'manual' | 'automatic';
  reservedQuotas?: number[];
  purchasedQuotas?: number[];
}

const QuotaGrid: React.FC<QuotaGridProps> = ({
  totalQuotas,
  selectedQuotas,
  onQuotaSelect,
  mode,
  reservedQuotas = [],
  purchasedQuotas = []
}) => {
  const getQuotaStatus = (quotaNumber: number) => {
    if (purchasedQuotas.includes(quotaNumber)) return 'purchased';
    if (reservedQuotas.includes(quotaNumber)) return 'reserved';
    if (selectedQuotas.includes(quotaNumber)) return 'selected';
    return 'available';
  };

  const getQuotaStyles = (status: string) => {
    switch (status) {
      case 'purchased':
        return 'bg-green-500 text-white cursor-not-allowed border border-green-600';
      case 'reserved':
        return 'bg-orange-500 text-white cursor-not-allowed border border-orange-600';
      case 'selected':
        return 'bg-blue-500 text-white cursor-pointer hover:bg-blue-600 border border-blue-600 transform scale-105 shadow-md';
      case 'available':
        return 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-500 hover:scale-105 transition-all duration-200';
      default:
        return 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600';
    }
  };

  const handleQuotaClick = (quotaNumber: number) => {
    const status = getQuotaStatus(quotaNumber);
    
    // Only allow selection in manual mode and for available quotas
    if (mode === 'manual' && (status === 'available' || status === 'selected') && onQuotaSelect) {
      onQuotaSelect(quotaNumber);
    }
  };

  // Calculate grid columns based on total quotas for optimal display
  const getGridCols = () => {
    return 'grid-cols-10 sm:grid-cols-15 md:grid-cols-20';
  };

  // Calculate padding length for quota numbers (e.g., 100 quotas = 2 digits, 1000 quotas = 3 digits)
  const getPadLength = () => {
    return totalQuotas.toString().length;
  };

  return (
    <div className="w-full">
      {/* Filter Tabs */}
      <div className="mb-4">
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
            <span className="text-lg">🔍</span>
            <span className="font-medium">Filtro de cota</span>
          </div>
        </div>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
          Selecione abaixo quais cotas deseja ver
        </p>
        
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm font-medium">
            Todos <span className="ml-1 bg-gray-400 text-white px-2 py-1 rounded text-xs">{totalQuotas}</span>
          </button>
          <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm font-medium">
            Disponíveis <span className="ml-1 bg-gray-400 text-white px-2 py-1 rounded text-xs">{totalQuotas - purchasedQuotas.length - reservedQuotas.length}</span>
          </button>
          <button className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium">
            Reservados <span className="ml-1 bg-orange-600 text-white px-2 py-1 rounded text-xs">{reservedQuotas.length}</span>
          </button>
          <button className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium">
            Comprados <span className="ml-1 bg-green-600 text-white px-2 py-1 rounded text-xs">{purchasedQuotas.length}</span>
          </button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium">
            Meus Nº <span className="ml-1 bg-blue-600 text-white px-2 py-1 rounded text-xs">{selectedQuotas.length}</span>
          </button>
        </div>
        
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          {selectedQuotas.length}/{totalQuotas}
        </div>
      </div>

      {/* Quota Grid */}
      <div className={`grid ${getGridCols()} gap-1 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden`}>
        {Array.from({ length: totalQuotas }, (_, index) => {
          const quotaNumber = index; // Start from 0 to match the reference image (00, 01, 02...)
          const status = getQuotaStatus(quotaNumber);
          const padLength = getPadLength();
          
          return (
            <button
              key={quotaNumber}
              onClick={() => handleQuotaClick(quotaNumber)}
              className={`
                w-10 h-10 text-xs font-medium rounded flex items-center justify-center transition-all duration-200
                ${getQuotaStyles(status)}
                ${mode === 'automatic' ? 'cursor-not-allowed' : ''}
              `}
              disabled={mode === 'automatic' || status === 'purchased' || status === 'reserved'}
              title={`Cota ${quotaNumber.toString().padStart(padLength, '0')} - ${
                status === 'purchased' ? 'Comprada' : 
                status === 'reserved' ? 'Reservada' : 
                status === 'selected' ? 'Selecionada' : 
                'Disponível'
              }`}
            >
              {quotaNumber.toString().padStart(padLength, '0')}
            </button>
          );
        })}
      </div>

      {/* Selection Summary */}
      {selectedQuotas.length > 0 && mode === 'manual' && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-center">
            <div className="text-sm text-blue-600 dark:text-blue-400 mb-2">
              Cotas selecionadas: {selectedQuotas.length}
            </div>
            <div className="text-xs text-blue-500 dark:text-blue-300 max-h-20 overflow-y-auto">
              {selectedQuotas
                .sort((a, b) => a - b)
                .map(quota => quota.toString().padStart(getPadLength(), '0'))
                .join(', ')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotaGrid;