import React from 'react';
import { TicketStatusInfo } from '../lib/api/tickets';

interface QuotaGridProps {
  totalQuotas: number;
  selectedQuotas: number[];
  onQuotaSelect?: (quotaNumber: number) => void;
  activeFilter: 'all' | 'available' | 'reserved' | 'purchased' | 'my-numbers';
  onFilterChange: (filter: 'all' | 'available' | 'reserved' | 'purchased' | 'my-numbers') => void;
  mode: 'manual' | 'automatic';
  tickets: TicketStatusInfo[];
  currentUserId?: string;
  campaignTheme: string;
  primaryColor?: string | null;
  colorMode?: string;
  gradientClasses?: string;
  customGradientColors?: string;
  loading?: boolean;
}

const QuotaGrid: React.FC<QuotaGridProps> = ({
  totalQuotas,
  selectedQuotas,
  onQuotaSelect,
  activeFilter,
  onFilterChange,
  mode,
  tickets,
  currentUserId,
  campaignTheme,
  primaryColor,
  colorMode = 'solid',
  gradientClasses,
  customGradientColors,
  loading = false
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
          background: 'bg-[#0A0F1E]',
          text: 'text-white',
          textSecondary: 'text-gray-400',
          cardBg: 'bg-[#0F1629]',
          border: 'border-[#1A2234]'
        };
      case 'escuro-preto':
        return {
          background: 'bg-black',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          cardBg: 'bg-[#0A0A0A]',
          border: 'border-[#1A1A1A]'
        };
      case 'escuro-cinza':
        return {
          background: 'bg-[#1A1A1A]',
          text: 'text-white',
          textSecondary: 'text-gray-400',
          cardBg: 'bg-[#141414]',
          border: 'border-[#1f1f1f]'
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
    const ticket = tickets.find(t => t.quota_number === quotaNumber);
    
    if (!ticket) {
      // Se não tem ticket, verifica se está selecionado
      if (selectedQuotas.includes(quotaNumber)) return 'selected';
      return 'available';
    }
    
    if (ticket.status === 'comprado') return 'purchased';
    if (ticket.status === 'reservado') return 'reserved';
    if (selectedQuotas.includes(quotaNumber)) return 'selected';
    return 'available';
  };

  const getCustomGradientStyle = (customColorsJson: string) => {
    try {
      const colors = JSON.parse(customColorsJson);
      if (Array.isArray(colors) && colors.length >= 2) {
        if (colors.length === 2) {
          return `linear-gradient(90deg, ${colors[0]}, ${colors[1]})`;
        } else if (colors.length === 3) {
          return `linear-gradient(90deg, ${colors[0]}, ${colors[1]}, ${colors[2]})`;
        }
      }
    } catch (error) {
      console.error('Error parsing custom gradient colors:', error);
    }
    return null;
  };

  const getColorStyle = () => {
    if (colorMode === 'gradient') {
      if (gradientClasses === 'custom' && customGradientColors) {
        const gradientStyle = getCustomGradientStyle(customGradientColors);
        if (gradientStyle) {
          return {
            background: gradientStyle,
            backgroundSize: '200% 200%'
          };
        }
      }
      return {};
    }
    return { backgroundColor: primaryColor || '#F97316' };
  };

  const getColorClassName = (baseClasses: string = '') => {
    if (colorMode === 'gradient') {
      if (gradientClasses === 'custom' && customGradientColors) {
        return `${baseClasses} animate-gradient-x bg-[length:200%_200%]`;
      }
      if (gradientClasses && gradientClasses !== 'custom') {
        return `${baseClasses} bg-gradient-to-r ${gradientClasses} animate-gradient-x bg-[length:200%_200%]`;
      }
    }
    return baseClasses;
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
    
    if (status === 'reserved' || status === 'purchased') {
      return;
    }
    
    if (mode === 'manual' && (status === 'available' || status === 'selected') && onQuotaSelect) {
      onQuotaSelect(quotaNumber);
    }
  };

  const getGridCols = () => {
    return 'grid-cols-10 sm:grid-cols-15 md:grid-cols-20';
  };

  const getPadLength = () => {
    if (totalQuotas === 0) return 1;
    const maxDisplayNumber = totalQuotas - 1;
    return String(maxDisplayNumber).length;
  };

  // ✨ NOVA LÓGICA: Gera array com TODAS as cotas de 1 a totalQuotas
  const getAllQuotas = () => {
    const allQuotas: number[] = [];
    for (let i = 1; i <= totalQuotas; i++) {
      allQuotas.push(i);
    }
    return allQuotas;
  };

  // ✨ Filtra as cotas geradas
  const getFilteredQuotas = () => {
    const allQuotas = getAllQuotas();
    
    switch (activeFilter) {
      case 'available':
        return allQuotas.filter(quota => {
          const status = getQuotaStatus(quota);
          return status === 'available';
        });
      case 'reserved':
        return allQuotas.filter(quota => {
          const status = getQuotaStatus(quota);
          return status === 'reserved';
        });
      case 'purchased':
        return allQuotas.filter(quota => {
          const status = getQuotaStatus(quota);
          return status === 'purchased';
        });
      case 'my-numbers':
        return allQuotas.filter(quota => {
          const ticket = tickets.find(t => t.quota_number === quota);
          return ticket?.is_mine || selectedQuotas.includes(quota);
        });
      case 'all':
      default:
        return allQuotas;
    }
  };

  // ✨ Calcula contadores baseado em TODAS as cotas
  const getFilterCounts = () => {
    const allQuotas = getAllQuotas();
    
    const availableCount = allQuotas.filter(q => {
      const status = getQuotaStatus(q);
      return status === 'available';
    }).length;
    
    const reservedCount = allQuotas.filter(q => {
      const status = getQuotaStatus(q);
      return status === 'reserved';
    }).length;
    
    const purchasedCount = allQuotas.filter(q => {
      const status = getQuotaStatus(q);
      return status === 'purchased';
    }).length;
    
    const myNumbersCount = allQuotas.filter(q => {
      const ticket = tickets.find(t => t.quota_number === q);
      return ticket?.is_mine || selectedQuotas.includes(q);
    }).length;
    
    return {
      all: totalQuotas,
      available: availableCount,
      reserved: reservedCount,
      purchased: purchasedCount,
      myNumbers: myNumbersCount
    };
  };

  const filteredQuotas = getFilteredQuotas();
  const filterCounts = getFilterCounts();
  const theme = getThemeClasses(campaignTheme);

  return (
    <div className={`w-full rounded-2xl shadow-2xl border ${theme.border} ${theme.cardBg} overflow-hidden flex flex-col max-h-[700px]`}>
      
      {/* Header fixo - Filtros */}
      <div className={`p-6 border-b ${theme.border}`}>
        <div className="flex items-center justify-center mb-4">
          <div className={`flex items-center space-x-2 ${theme.textSecondary}`}>
            <span className="text-lg">🔍</span>
            <span className="font-medium">Filtro de cota</span>
          </div>
        </div>
        <p className={`text-center text-sm ${theme.textSecondary} mb-4`}>
          Selecione abaixo quais cotas deseja ver
        </p>
        
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          <button
            onClick={() => onFilterChange('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              activeFilter === 'all'
                ? getColorClassName('text-white border-transparent')
                : `${theme.text} border ${theme.border} hover:opacity-80`
            }`}
            style={activeFilter === 'all' ? getColorStyle() : {}}
          >
            Todos <span className={`ml-1 px-2 py-1 rounded text-xs ${
              activeFilter === 'all' 
                ? 'bg-white/20 text-white' 
                : `${theme.cardBg} ${theme.text}`
            }`}>{filterCounts.all}</span>
          </button>
          
          <button
            onClick={() => onFilterChange('available')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              activeFilter === 'available'
                ? getColorClassName('text-white border-transparent')
                : `${theme.text} border ${theme.border} hover:opacity-80`
            }`}
            style={activeFilter === 'available' ? getColorStyle() : {}}
          >
            Disponíveis <span className={`ml-1 px-2 py-1 rounded text-xs ${
              activeFilter === 'available' 
                ? 'bg-white/20 text-white' 
                : `${theme.cardBg} ${theme.text}`
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
            className={getColorClassName(`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 text-white ${
              activeFilter === 'my-numbers'
                ? 'opacity-100'
                : 'opacity-80 hover:opacity-100'
            }`)}
            style={getColorStyle()}
          >
            Meus Nº <span className="ml-1 bg-white/20 text-white px-2 py-1 rounded text-xs">{filterCounts.myNumbers}</span>
          </button>
        </div>
        
        <div className={`text-center text-sm ${theme.textSecondary}`}>
          {filteredQuotas.length} cotas de {totalQuotas.toLocaleString()}
        </div>
      </div>

      {/* Grid com scroll */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: `${campaignTheme === 'claro' ? '#9CA3AF #E5E7EB' : '#374151 #1F2937'}`
      }}>
        <div className={`quota-grid grid ${getGridCols()} gap-1 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className={`text-center ${theme.textSecondary}`}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current mx-auto mb-4"></div>
                <p>Carregando cotas...</p>
              </div>
            </div>
          ) : filteredQuotas.length === 0 ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className={`text-center ${theme.textSecondary}`}>
                <p className="text-lg mb-2">🔍</p>
                <p>Nenhuma cota encontrada com este filtro.</p>
              </div>
            </div>
          ) : (
            filteredQuotas.map((quotaNumber) => {
              const status = getQuotaStatus(quotaNumber);
              const padLength = getPadLength();
              const quotaStyles = getQuotaStyles(status);
              const isSelected = status === 'selected';
              const displayNumber = quotaNumber - 1;
              
              return (
                <button
                  key={quotaNumber}
                  onClick={() => handleQuotaClick(quotaNumber)}
                  className={`
                    w-10 h-10 text-xs font-medium rounded flex items-center justify-center transition-all duration-200
                    ${quotaStyles}
                    ${isSelected ? getColorClassName('') : ''}
                    ${mode === 'automatic' || status === 'purchased' || status === 'reserved' ? 'cursor-not-allowed' : 'cursor-pointer'}
                  `}
                  style={isSelected ? getColorStyle() : {}}
                  disabled={mode === 'automatic' || status === 'purchased' || status === 'reserved'}
                  title={`Cota ${displayNumber.toString().padStart(padLength, '0')} - ${
                    status === 'purchased' ? 'Comprada' : 
                    status === 'reserved' ? 'Reservada' : 
                    status === 'selected' ? 'Selecionada' : 
                    'Disponível'
                  }`}
                >
                  {displayNumber.toString().padStart(padLength, '0')}
                </button>
              );
            })
          )}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${campaignTheme === 'claro' ? '#E5E7EB' : '#1F2937'};
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${campaignTheme === 'claro' ? '#9CA3AF' : '#374151'};
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${campaignTheme === 'claro' ? '#6B7280' : '#4B5563'};
        }
      `}</style>
    </div>
  );
};

export default QuotaGrid;