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
  campaignTheme: string;
  primaryColor?: string | null;
}

const QuotaGrid: React.FC<QuotaGridProps> = ({
  totalQuotas,
  selectedQuotas,
  onQuotaSelect,
  activeFilter,
  onFilterChange,
  mode,
  reservedQuotas = [],
  purchasedQuotas = [],
  campaignTheme,
  primaryColor
}) => {
  // Function to get theme classes
  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case 'claro':
        return {
          background: 'bg-white',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          cardBg: 'bg-gray-50',
          border: 'border-gray-200'
        };
      case 'escuro':
        return {
          background: 'bg-gray-950',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          cardBg: 'bg-gray-900',
          border: 'border-gray-800'
        };
      case 'escuro-preto':
        return {
          background: 'bg-black',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          cardBg: 'bg-gray-900',
          border: 'border-gray-800'
        };
      default:
        return {
          background: 'bg-white',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          cardBg: 'bg-gray-50',
          border: 'border-gray-200'
        };
    }
  };

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
        return `text-white cursor-pointer hover:brightness-90 border transform scale-105 shadow-md`;
      case 'available':
        return `${getThemeClasses(campaignTheme).background} ${getThemeClasses(campaignTheme).text} border ${getThemeClasses(campaignTheme).border} cursor-pointer hover:scale-105 transition-all duration-200`;
      default:
        return `${getThemeClasses(campaignTheme).cardBg} ${getThemeClasses(campaignTheme).text} border ${getThemeClasses(campaignTheme).border}`;
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
          <div className={`flex items-center space-x-2 ${getThemeClasses(campaignTheme).textSecondary}`}>
            <span className="text-lg">🔍</span>
            <span className="font-medium">Filtro de cota</span>
          </div>
        </div>
        <p className={`text-center text-sm ${getThemeClasses(campaignTheme).textSecondary} mb-4`}>
          Selecione abaixo quais cotas deseja ver
        </p>
        
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          <button 
            onClick={() => onFilterChange('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              activeFilter === 'all' 
                ? `text-white border-transparent` 
                : `${getThemeClasses(campaignTheme).text} border ${getThemeClasses(campaignTheme).border} hover:opacity-80`
            }`}
            style={activeFilter === 'all' ? { backgroundColor: primaryColor || '#3B82F6' } : {}}
          >
            Todos <span className={`ml-1 px-2 py-1 rounded text-xs ${
              activeFilter === 'all' 
                ? 'bg-white/20 text-white' 
                : `${getThemeClasses(campaignTheme).cardBg} ${getThemeClasses(campaignTheme).text}`
            }`}>{filterCounts.all}</span>
          </button>
          
          <button 
            onClick={() => onFilterChange('available')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              activeFilter === 'available' 
                ? `text-white border-transparent` 
                : `${getThemeClasses(campaignTheme).text} border ${getThemeClasses(campaignTheme).border} hover:opacity-80`
            }`}
            style={activeFilter === 'available' ? { backgroundColor: primaryColor || '#3B82F6' } : {}}
          >
            Disponíveis <span className={`ml-1 px-2 py-1 rounded text-xs ${
              activeFilter === 'available' 
                ? 'bg-white/20 text-white' 
                : `${getThemeClasses(campaignTheme).cardBg} ${getThemeClasses(campaignTheme).text}`
            }`}>{filterCounts.available}</span>
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
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 text-white ${
              activeFilter === 'my-numbers' 
                ? 'opacity-100' 
                : 'opacity-80 hover:opacity-100'
            }`}
            style={{ backgroundColor: primaryColor || '#3B82F6' }}
          >
            Meus Nº <span className="ml-1 bg-white/20 text-white px-2 py-1 rounded text-xs">{filterCounts.myNumbers}</span>
          </button>
        </div>
        
        <div className={`text-center text-sm ${getThemeClasses(campaignTheme).textSecondary}`}>
          {activeFilter === 'my-numbers' ? selectedQuotas.length : filteredQuotas.length}/{totalQuotas}
        </div>
      </div>

      {/* Quota Grid */}
      <div className={`quota-grid grid ${getGridCols()} gap-1 p-4 ${getThemeClasses(campaignTheme).cardBg} rounded-lg overflow-hidden`}>
        {filteredQuotas.map((quotaNumber) => {
          const status = getQuotaStatus(quotaNumber);
          const padLength = getPadLength();
          const quotaStyles = getQuotaStyles(status);
          const isSelected = status === 'selected';
          
          return (
            <button
              key={quotaNumber}
              onClick={() => handleQuotaClick(quotaNumber)}
              className={`
                w-10 h-10 text-xs font-medium rounded flex items-center justify-center transition-all duration-200
                ${quotaStyles}
                ${mode === 'automatic' || status === 'purchased' || status === 'reserved' ? 'cursor-not-allowed' : 'cursor-pointer'}
              `}
              style={isSelected ? { 
                backgroundColor: primaryColor || '#3B82F6',
                borderColor: primaryColor || '#3B82F6'
              } : {}}
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