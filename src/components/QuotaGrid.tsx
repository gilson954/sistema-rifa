// src/components/QuotaGrid.tsx
import React, { useEffect } from 'react';
import { TicketStatusInfo } from '../lib/api/tickets';
import { Loader2 } from 'lucide-react';

interface QuotaGridProps {
  totalQuotas: number;
  selectedQuotas: number[];
  onQuotaSelect: (quotaNumber: number) => void;
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
  
  loadAllTicketsForManualMode: (totalTickets: number) => Promise<void>;
  loadingTickets: boolean;
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
  loadAllTicketsForManualMode,
  loadingTickets
}) => {
  useEffect(() => {
    console.log("🔵 QuotaGrid: Prop 'selectedQuotas' atualizada:", selectedQuotas);
  }, [selectedQuotas]);

  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case 'claro':
        return {
          background: 'bg-white',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          cardBg: 'bg-gray-50',
          border: 'border-gray-200',
          scrollbarTrack: '#d4d6d9',
          scrollbarThumb: '#9ca3af'
        };
      case 'escuro':
        return {
          background: 'bg-gray-950',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          cardBg: 'bg-gray-900',
          border: 'border-[#101625]',
          scrollbarTrack: '#0a0d12',
          scrollbarThumb: '#4b5563'
        };
      case 'escuro-preto':
        return {
          background: 'bg-black',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          cardBg: 'bg-gray-900',
          border: 'border-gray-700',
          scrollbarTrack: '#0a0d12',
          scrollbarThumb: '#374151'
        };
      case 'escuro-cinza':
        return {
          background: 'bg-[#1A1A1A]',
          text: 'text-white',
          textSecondary: 'text-gray-400',
          cardBg: 'bg-[#242424]',
          border: 'border-[#1f1f1f]',
          scrollbarTrack: '#0f0f0f',
          scrollbarThumb: '#404040'
        };
      default:
        return {
          background: 'bg-white',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          cardBg: 'bg-gray-50',
          border: 'border-gray-200',
          scrollbarTrack: '#e5e7eb',
          scrollbarThumb: '#9ca3af'
        };
    }
  };

  const getQuotaStatus = (quotaNumber: number) => {
    const ticket = tickets.find(t => t.quota_number === quotaNumber);
    
    if (!ticket) return 'available';
    
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
    return { backgroundColor: primaryColor || '#3B82F6' };
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
    
    console.log(`🔵 QuotaGrid: Clicado na cota ${quotaNumber}. Modo: ${mode}, Status: ${status}`);
    
    if (status === 'reserved' || status === 'purchased') {
      console.log(`⚠️ QuotaGrid: Cota ${quotaNumber} não clicável - status: ${status}`);
      return;
    }
    
    if (mode === 'manual' && (status === 'available' || status === 'selected')) {
      console.log(`✅ QuotaGrid: Chamando onQuotaSelect com: ${quotaNumber}`);
      onQuotaSelect(quotaNumber);
    } else {
      console.log(`⚠️ QuotaGrid: Cota ${quotaNumber} não processada. Modo: ${mode}, Status: ${status}`);
    }
  };

  const getGridCols = () => {
    return 'grid-cols-10 sm:grid-cols-15 md:grid-cols-20';
  };

  const getPadLength = () => {
    if (totalQuotas === 0) return 1;
    const maxDisplayNumber = totalQuotas - 1;
    const calculatedLength = String(maxDisplayNumber).length;
    console.log(`🔵 getPadLength: totalQuotas=${totalQuotas}, maxDisplayNumber=${maxDisplayNumber}, padLength=${calculatedLength}`);
    return calculatedLength;
  };

  const formatQuotaNumber = (quotaNumber: number): string => {
    const padLength = getPadLength();
    return quotaNumber.toString().padStart(padLength, '0');
  };

  const getFilteredQuotas = () => {
    const allQuotas = Array.from({ length: totalQuotas }, (_, index) => index);
    
    switch (activeFilter) {
      case 'available':
        return allQuotas.filter(quota => {
          const ticket = tickets.find(t => t.quota_number === quota);
          return ticket?.status === 'disponível' && !selectedQuotas.includes(quota);
        });
      case 'reserved':
        return allQuotas.filter(quota => {
          const ticket = tickets.find(t => t.quota_number === quota);
          return ticket?.status === 'reservado';
        });
      case 'purchased':
        return allQuotas.filter(quota => {
          const ticket = tickets.find(t => t.quota_number === quota);
          return ticket?.status === 'comprado';
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

  const getFilterCounts = () => {
    const availableCount = tickets.filter(t => t.status === 'disponível').length;
    const reservedCount = tickets.filter(t => t.status === 'reservado').length;
    const purchasedCount = tickets.filter(t => t.status === 'comprado').length;
    const myNumbersCount = tickets.filter(t => t.is_mine).length + selectedQuotas.length;
    
    return {
      all: totalQuotas,
      available: Math.max(0, availableCount - selectedQuotas.length),
      reserved: reservedCount,
      purchased: purchasedCount,
      myNumbers: myNumbersCount
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
                ? getColorClassName('text-white border-transparent')
                : `${getThemeClasses(campaignTheme).text} border ${getThemeClasses(campaignTheme).border} hover:opacity-80`
            }`}
            style={activeFilter === 'all' ? getColorStyle() : {}}
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
                ? getColorClassName('text-white border-transparent')
                : `${getThemeClasses(campaignTheme).text} border ${getThemeClasses(campaignTheme).border} hover:opacity-80`
            }`}
            style={activeFilter === 'available' ? getColorStyle() : {}}
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
        
        <div className={`text-center text-sm ${getThemeClasses(campaignTheme).textSecondary}`}>
          {activeFilter === 'my-numbers' ? selectedQuotas.length : filteredQuotas.length}/{totalQuotas}
        </div>
      </div>

      {/* Quota Grid */}
      <div 
        className={`${getThemeClasses(campaignTheme).cardBg} rounded-lg`}
        style={{ 
          maxHeight: '660px', 
          height: '660px',
          overflow: 'hidden'
        }}
      >
        <div 
          className="p-4 overflow-y-scroll"
          style={{ 
            height: '100%',
            scrollbarWidth: 'thin',
            scrollbarColor: `${getThemeClasses(campaignTheme).scrollbarThumb} ${getThemeClasses(campaignTheme).scrollbarTrack}`
          }}
        >
          <div className={`grid ${getGridCols()} gap-1`}>
            {filteredQuotas.map((quotaNumber) => {
              const status = getQuotaStatus(quotaNumber);
              const quotaStyles = getQuotaStyles(status);
              const isSelected = status === 'selected';
              const displayNumber = formatQuotaNumber(quotaNumber);
              
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
                  title={`Cota ${displayNumber} - ${
                    status === 'purchased' ? 'Comprada' : 
                    status === 'reserved' ? 'Reservada' : 
                    status === 'selected' ? 'Selecionada' : 
                    'Disponível'
                  }`}
                >
                  {displayNumber}
                </button>
              );
            })}
            {loadingTickets && (
              <div className="col-span-full text-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500 mx-auto" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollbar customizada */}
      <style dangerouslySetInnerHTML={{__html: `
        .overflow-y-scroll::-webkit-scrollbar {
          width: 12px;
        }
        
        .overflow-y-scroll::-webkit-scrollbar-track {
          background: ${getThemeClasses(campaignTheme).scrollbarTrack};
          border-radius: 6px;
          margin: 4px;
        }
        
        .overflow-y-scroll::-webkit-scrollbar-thumb {
          background: ${getThemeClasses(campaignTheme).scrollbarThumb};
          border-radius: 6px;
          border: 2px solid ${getThemeClasses(campaignTheme).scrollbarTrack};
        }
        
        .overflow-y-scroll::-webkit-scrollbar-thumb:hover {
          background: ${primaryColor || getThemeClasses(campaignTheme).scrollbarThumb};
          opacity: 0.8;
        }
      `}} />
    </div>
  );
};

export default QuotaGrid;