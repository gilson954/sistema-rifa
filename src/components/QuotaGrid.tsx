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
        return 'bg-green-500 text-white cursor-not-allowed';
      case 'reserved':
        return 'bg-orange-500 text-white cursor-not-allowed';
      case 'selected':
        return 'bg-blue-500 text-white cursor-pointer hover:bg-blue-600';
      case 'available':
        return 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600';
      default:
        return 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white';
    }
  };

  const handleQuotaClick = (quotaNumber: number) => {
    const status = getQuotaStatus(quotaNumber);
    if (mode === 'manual' && status !== 'purchased' && status !== 'reserved' && onQuotaSelect) {
      onQuotaSelect(quotaNumber);
    }
  };

  // Calculate grid columns based on total quotas for optimal display
  const getGridCols = () => {
    if (totalQuotas <= 100) return 'grid-cols-20';
    if (totalQuotas <= 1000) return 'grid-cols-20';
    return 'grid-cols-20';
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
          const quotaNumber = index + 1;
          const status = getQuotaStatus(quotaNumber);
          
          return (
            <button
              key={quotaNumber}
              onClick={() => handleQuotaClick(quotaNumber)}
              className={`
                w-6 h-6 text-xs font-medium rounded transition-colors duration-200 flex items-center justify-center
                ${getQuotaStyles(status)}
                ${mode === 'automatic' ? 'cursor-not-allowed' : ''}
              `}
              disabled={mode === 'automatic' || status === 'purchased' || status === 'reserved'}
              title={`Cota ${quotaNumber} - ${status === 'purchased' ? 'Comprada' : status === 'reserved' ? 'Reservada' : status === 'selected' ? 'Selecionada' : 'Disponível'}`}
            >
              {quotaNumber}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuotaGrid;