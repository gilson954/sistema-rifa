import React from 'react';

interface QuotaGridProps {
  totalQuotas: number;
  selectedQuotas: number[];
  onQuotaSelect?: (quotaNumber: number) => void;
  activeFilter: 'all' | 'available' | 'reserved' | 'purchased' | 'my-numbers';
  onFilterChange: (filter: 'all' | 'available' | 'reserved' | 'purchased' | 'my-numbers') => void;
  mode: 'manual' | 'automatic';
  reservedQuotas?: number[];
  purchasedQuotas?: number[];
}

const QuotaGrid: React.FC<QuotaGridProps> = ({
  totalQuotas,
  selectedQuotas,
  onQuotaSelect,
  activeFilter,
  onFilterChange,
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
    
    // Impedir clique em cotas reservadas ou compradas
    if (status === 'reserved' || status === 'purchased') {
      return;
    }
    
    // Permitir seleção apenas no modo manual e para cotas disponíveis/selecionadas
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

  // Filtrar cotas com base no filtro ativo
  const getFilteredQuotas = () => {
    const allQuotas = Array.from({ length: totalQuotas }, (_, index) => index);
    
    switch (activeFilter) {
      case 'available':
        return allQuotas.filter(quota => 
          !reservedQuotas.includes(quota) && 
          !purchasedQuotas.includes(quota) && 
          !selectedQuotas.includes(quota)
        );
      case 'reserved':
        return allQuotas.filter(quota => reservedQuotas.includes(quota));
      case 'purchased':
        return allQuotas.filter(quota => purchasedQuotas.includes(quota));
      case 'my-numbers':
        return selectedQuotas.sort((a, b) => a - b);
      case 'all':
      default:
        return allQuotas;
    }
  };

  // Calcular contadores para os filtros
  const getFilterCounts = () => {
    const availableCount = totalQuotas - reservedQuotas.length - purchasedQuotas.length - selectedQuotas.length;
    return {
      all: totalQuotas,
      available: availableCount,
      reserved: reservedQuotas.length,
      purchased: purchasedQuotas.length,
      myNumbers: selectedQuotas.length
    };
  };

  const filteredQuotas = getFilteredQuotas();
  const filterCounts = getFilterCounts();

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
          <button 
            onClick={() => onFilterChange('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              activeFilter === 'all' 
                ? 'bg-gray-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Todos <span className="ml-1 bg-gray-400 text-white px-2 py-1 rounded text-xs">{filterCounts.all}</span>
          </button>
          
          <button 
            onClick={() => onFilterChange('available')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              activeFilter === 'available' 
                ? 'bg-gray-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Disponíveis <span className="ml-1 bg-gray-400 text-white px-2 py-1 rounded text-xs">{filterCounts.available}</span>
          </button>
          
          <button 
            onClick={() => onFilterChange('reserved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              activeFilter === 'reserved' 
                ? 'bg-orange-600 text-white' 
                : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
          >
            Reservados <span className="ml-1 bg-orange-600 text-white px-2 py-1 rounded text-xs">{filterCounts.reserved}</span>
          </button>
          
          <button 
            onClick={() => onFilterChange('purchased')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              activeFilter === 'purchased' 
                ? 'bg-green-600 text-white' 
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            Comprados <span className="ml-1 bg-green-600 text-white px-2 py-1 rounded text-xs">{filterCounts.purchased}</span>
          </button>
          
          <button 
            onClick={() => onFilterChange('my-numbers')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              activeFilter === 'my-numbers' 
                ? 'bg-blue-600 text-white' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Meus Nº <span className="ml-1 bg-blue-600 text-white px-2 py-1 rounded text-xs">{filterCounts.myNumbers}</span>
          </button>
        </div>
        
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          {activeFilter === 'my-numbers' ? selectedQuotas.length : filteredQuotas.length}/{totalQuotas}
        </div>
      </div>

      {/* Quota Grid */}
      <div className={`quota-grid grid ${getGridCols()} gap-1 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden`}>
        {filteredQuotas.map((quotaNumber) => {
          const status = getQuotaStatus(quotaNumber);
          const padLength = getPadLength();
          
          return (
            <button
              key={quotaNumber}
              onClick={() => handleQuotaClick(quotaNumber)}
              className={`
                w-10 h-10 text-xs font-medium rounded flex items-center justify-center transition-all duration-200
                ${getQuotaStyles(status)}
                ${mode === 'automatic' || status === 'purchased' || status === 'reserved' ? 'cursor-not-allowed' : 'cursor-pointer'}
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
    </div>
  );
};

export default QuotaGrid;