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
          background: 'bg-gray-950',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          cardBg: 'bg-gray-900',
          border: 'border-gray-600'
        };
      case 'escuro-preto':
        return {
          background: 'bg-black',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          cardBg: 'bg-gray-900',
          border: 'border-gray-700'
        };
    case 'escuro-cinza':
      return {
        background: 'bg-[#1A1A1A]',
        text: 'text-white',
        textSecondary: 'text-gray-400',
        cardBg: 'bg-[#2C2C2C]',
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
    // Find the ticket for this quota number
    const ticket = tickets.find(t => t.quota_number === quotaNumber);
    
    if (!ticket) return 'available'; // Default if ticket not found
    
    if (ticket.status === 'comprado') return 'purchased';
    if (ticket.status === 'reservado') return 'reserved';
    if (selectedQuotas.includes(quotaNumber)) return 'selected';
    return 'available';
  };

  // Função para gerar gradiente customizado
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

  // Função para obter style para cor ou gradiente
  const getColorStyle = () => {
    if (colorMode === 'gradient') {
      // Gradiente customizado
      if (gradientClasses === 'custom' && customGradientColors) {
        const gradientStyle = getCustomGradientStyle(customGradientColors);
        if (gradientStyle) {
          return {
            background: gradientStyle,
            backgroundSize: '200% 200%'
          };
        }
      }
      // Gradiente predefinido - retorna vazio, usará className
      return {};
    }
    // Cor sólida
    return { backgroundColor: primaryColor || '#3B82F6' };
  };

  // Função para obter className para gradientes
  const getColorClassName = (baseClasses: string = '') => {
    if (colorMode === 'gradient') {
      // Gradiente customizado
      if (gradientClasses === 'custom' && customGradientColors) {
        return `${baseClasses} animate-gradient-x bg-[length:200%_200%]`;
      }
      // Gradiente predefinido
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
    
    // Impedir clique em cotas reservadas ou compradas
    if (status === 'reserved' || status === 'purchased') {
      return;
    }
    
    // Permitir seleção apenas no modo manual e para cotas disponíveis/selecionadas
    // CRITICAL: Passar o quota_number real (1 a N) para o handler
    if (mode === 'manual' && (status === 'available' || status === 'selected') && onQuotaSelect) {
      onQuotaSelect(quotaNumber);
    }
  };

  // Calculate grid columns based on total quotas for optimal display
  const getGridCols = () => {
    return 'grid-cols-10 sm:grid-cols-15 md:grid-cols-20';
  };

  // CRITICAL FIX: Calculate padding length for quota numbers based on total quotas
  // O quota_number no banco vai de 1 a N, mas exibimos de 00 a N-1
  // Então o número máximo exibido é totalQuotas - 1
  const getPadLength = () => {
    // Se totalQuotas for 0, retorna 1 para evitar problemas
    if (totalQuotas === 0) return 1;
    
    // Calcular baseado no maior número exibido (totalQuotas - 1)
    const maxDisplayNumber = totalQuotas - 1;
    return String(maxDisplayNumber).length;
  };

  // ⚠️ IMPORTANTE: Filtrar cotas APENAS da página atual (tickets carregados)
  // Não tenta filtrar todas as cotas da campanha
  const getFilteredQuotas = () => {
    // Usar apenas os tickets da página atual
    const currentPageQuotas = tickets.map(t => t.quota_number);
    
    switch (activeFilter) {
      case 'available':
        return currentPageQuotas.filter(quota => {
          const ticket = tickets.find(t => t.quota_number === quota);
          return ticket?.status === 'disponível' && !selectedQuotas.includes(quota);
        });
      case 'reserved':
        return currentPageQuotas.filter(quota => {
          const ticket = tickets.find(t => t.quota_number === quota);
          return ticket?.status === 'reservado';
        });
      case 'purchased':
        return currentPageQuotas.filter(quota => {
          const ticket = tickets.find(t => t.quota_number === quota);
          return ticket?.status === 'comprado';
        });
      case 'my-numbers':
        return currentPageQuotas.filter(quota => {
          const ticket = tickets.find(t => t.quota_number === quota);
          return ticket?.is_mine || selectedQuotas.includes(quota);
        });
      case 'all':
      default:
        return currentPageQuotas;
    }
  };

  // Calcular contadores para os filtros (baseado APENAS nos tickets da página atual)
  const getFilterCounts = () => {
    const availableCount = tickets.filter(t => t.status === 'disponível').length;
    const reservedCount = tickets.filter(t => t.status === 'reservado').length;
    const purchasedCount = tickets.filter(t => t.status === 'comprado').length;
    const myNumbersCount = tickets.filter(t => t.is_mine).length + selectedQuotas.filter(q => {
      // Conta apenas seleções da página atual
      const ticket = tickets.find(t => t.quota_number === q);
      return ticket !== undefined;
    }).length;
    
    return {
      all: tickets.length, // Total na página atual
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
          {activeFilter === 'my-numbers' ? selectedQuotas.length : filteredQuotas.length} cotas na página atual
        </div>
      </div>

      {/* Quota Grid com Scroll */}
      <div className={`quota-grid-container ${getThemeClasses(campaignTheme).cardBg} rounded-lg border ${getThemeClasses(campaignTheme).border} overflow-hidden`} style={{ maxHeight: '500px', overflowY: 'auto' }}>
        <div className={`quota-grid grid ${getGridCols()} gap-1 p-4 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className={`text-center ${getThemeClasses(campaignTheme).textSecondary}`}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current mx-auto mb-4"></div>
                <p>Carregando cotas...</p>
              </div>
            </div>
          ) : filteredQuotas.length === 0 ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className={`text-center ${getThemeClasses(campaignTheme).textSecondary}`}>
                <p className="text-lg mb-2">🔍</p>
                <p>Nenhuma cota encontrada com este filtro na página atual.</p>
              </div>
            </div>
          ) : (
            filteredQuotas.map((quotaNumber) => {
              const status = getQuotaStatus(quotaNumber);
              const padLength = getPadLength();
              const quotaStyles = getQuotaStyles(status);
              const isSelected = status === 'selected';
              
              // CRITICAL FIX: Exibir quota_number - 1 para o usuário
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
                  {/* CRITICAL FIX: Exibir quota_number - 1 com padding correto */}
                  {displayNumber.toString().padStart(padLength, '0')}
                </button>
              );
            })
          )}
        </div>
      </div>

      <style jsx>{`
        .quota-grid-container::-webkit-scrollbar {
          width: 10px;
        }
        .quota-grid-container::-webkit-scrollbar-track {
          background: ${campaignTheme === 'claro' ? '#E5E7EB' : '#1F2937'};
          border-radius: 5px;
        }
        .quota-grid-container::-webkit-scrollbar-thumb {
          background: ${campaignTheme === 'claro' ? '#9CA3AF' : '#374151'};
          border-radius: 5px;
        }
        .quota-grid-container::-webkit-scrollbar-thumb:hover {
          background: ${campaignTheme === 'claro' ? '#6B7280' : '#4B5563'};
        }
      `}</style>
    </div>
  );
};

export default QuotaGrid;