// src/components/QuotaGrid.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TicketStatusInfo } from '../lib/api/tickets';

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
  fetchVisibleTickets: (offset: number, limit: number) => Promise<void>;
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
  fetchVisibleTickets
}) => {
  // Estado para controle de paginação
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false); // Prevenir chamadas duplicadas
  const PAGE_SIZE = 10000; // Carregar 10000 tickets por vez

  // 🔍 DEPURAÇÃO: Monitorar mudanças na prop selectedQuotas
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

  // ✅ CORREÇÃO: quotaNumber é o número real (0 a N-1) tanto no frontend quanto no backend
  const getQuotaStatus = (quotaNumber: number) => {
    const ticket = tickets.find(t => t.quota_number === quotaNumber);
    
    if (!ticket) return 'available';
    
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

  // ✅ CORREÇÃO: quotaNumber é o número real (0 a N-1), envia direto para o backend
  const handleQuotaClick = (quotaNumber: number) => {
    const status = getQuotaStatus(quotaNumber);
    
    console.log(`🔵 QuotaGrid: Clicado na cota ${quotaNumber}. Modo: ${mode}, Status: ${status}`);
    
    // Impedir clique em cotas reservadas ou compradas
    if (status === 'reserved' || status === 'purchased') {
      console.log(`⚠️ QuotaGrid: Cota ${quotaNumber} não clicável - status: ${status}`);
      return;
    }
    
    // ✅ SEMPRE chamar onQuotaSelect para modo manual com status válido
    if (mode === 'manual' && (status === 'available' || status === 'selected')) {
      console.log(`✅ QuotaGrid: Chamando onQuotaSelect com: ${quotaNumber}`);
      onQuotaSelect(quotaNumber); // 👈 envia o número real (0 a N-1) direto para o backend
    } else {
      console.log(`⚠️ QuotaGrid: Cota ${quotaNumber} não processada. Modo: ${mode}, Status: ${status}`);
    }
  };

  // Calculate grid columns based on total quotas for optimal display
  const getGridCols = () => {
    return 'grid-cols-10 sm:grid-cols-15 md:grid-cols-20';
  };

  // ✅ Calculate padding length based on maximum 0-indexed ticket number (totalQuotas - 1)
  const getPadLength = () => {
    if (totalQuotas === 0) return 1;
    const maxDisplayNumber = totalQuotas - 1; // Maximum 0-indexed number
    const calculatedLength = String(maxDisplayNumber).length;
    console.log(`🔵 getPadLength: totalQuotas=${totalQuotas}, maxDisplayNumber=${maxDisplayNumber}, padLength=${calculatedLength}`);
    return calculatedLength;
  };

  // ✅ Format quota number with proper padding (0-indexed, no subtraction needed)
  const formatQuotaNumber = (quotaNumber: number): string => {
    const padLength = getPadLength();
    return quotaNumber.toString().padStart(padLength, '0');
  };

  // ✅ CORREÇÃO: Gerar cotas de 0 a N-1 (números reais no sistema)
  const getFilteredQuotas = () => {
    const allQuotas = Array.from({ length: totalQuotas }, (_, index) => index); // 👈 [0, 1, 2, ..., N-1]
    
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

  // Calcular contadores para os filtros
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

  // 🚀 NOVA FUNCIONALIDADE: Carregar página de tickets com offset/limit corretos
  const loadTicketsPage = useCallback(async (page: number) => {
    // Prevenir carregamento duplicado
    if (loadedPages.has(page) || loadingRef.current) {
      console.log(`⚠️ QuotaGrid: Página ${page} já está carregada ou em carregamento`);
      return;
    }

    // Calcular offset e limit corretos
    const offset = page * PAGE_SIZE;
    const limit = PAGE_SIZE;

    // Validar se está dentro dos limites
    if (offset >= totalQuotas) {
      console.log(`⚠️ QuotaGrid: Offset ${offset} excede totalQuotas ${totalQuotas}`);
      return;
    }

    console.log(`🔵 QuotaGrid: Carregando página ${page} (offset: ${offset}, limit: ${limit})`);
    
    loadingRef.current = true;
    setIsLoading(true);
    setLoadedPages(prev => new Set(prev).add(page));

    try {
      await fetchVisibleTickets(offset, limit);
      console.log(`✅ QuotaGrid: Página ${page} carregada com sucesso`);
    } catch (error) {
      console.error(`❌ QuotaGrid: Erro ao carregar página ${page}:`, error);
      // Remove do cache em caso de erro para permitir retry
      setLoadedPages(prev => {
        const newSet = new Set(prev);
        newSet.delete(page);
        return newSet;
      });
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [fetchVisibleTickets, loadedPages, totalQuotas, PAGE_SIZE]);

  // 🚀 NOVA FUNCIONALIDADE: Detectar scroll e carregar páginas conforme necessário
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || loadingRef.current) return;

    const container = scrollRef.current;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;

    // Calcular quantos itens cabem na viewport
    const itemHeight = 44; // altura aproximada de cada item (40px + gap)
    const itemsPerRow = 20; // baseado no grid-cols-20
    const rowsVisible = Math.ceil(containerHeight / itemHeight);
    const itemsVisible = rowsVisible * itemsPerRow;

    // Calcular índice do primeiro item visível
    const firstVisibleRow = Math.floor(scrollTop / itemHeight);
    const firstVisibleIndex = firstVisibleRow * itemsPerRow;

    // Calcular página atual e páginas adjacentes
    const currentPage = Math.floor(firstVisibleIndex / PAGE_SIZE);
    const lastVisibleIndex = firstVisibleIndex + itemsVisible;
    const lastPage = Math.floor(lastVisibleIndex / PAGE_SIZE);

    // Carregar página atual e uma página antes/depois (buffer)
    const pagesToLoad = new Set<number>();
    const startPage = Math.max(0, currentPage - 1);
    const endPage = Math.min(Math.ceil(totalQuotas / PAGE_SIZE) - 1, lastPage + 1);

    for (let page = startPage; page <= endPage; page++) {
      if (!loadedPages.has(page)) {
        pagesToLoad.add(page);
      }
    }

    // Carregar páginas em sequência
    if (pagesToLoad.size > 0) {
      console.log(`🔵 QuotaGrid: Páginas a carregar:`, Array.from(pagesToLoad));
      Array.from(pagesToLoad).forEach(page => {
        loadTicketsPage(page);
      });
    }
  }, [loadedPages, totalQuotas, PAGE_SIZE, loadTicketsPage]);

  // 🚀 NOVA FUNCIONALIDADE: Carregar todas as cotas ao montar (até 10mil por página)
  useEffect(() => {
    if (totalQuotas > 0) {
      const totalPages = Math.ceil(totalQuotas / PAGE_SIZE);
      console.log(`🔵 QuotaGrid: Componente montado, carregando ${totalPages} página(s) para ${totalQuotas} cotas`);
      
      // Carregar todas as páginas necessárias
      for (let page = 0; page < totalPages; page++) {
        loadTicketsPage(page);
      }
    }
  }, [totalQuotas]); // Apenas quando totalQuotas muda

  // 🚀 NOVA FUNCIONALIDADE: Adicionar listener de scroll
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    // Debounce do scroll para evitar muitas chamadas
    let scrollTimeout: NodeJS.Timeout;
    const debouncedScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        handleScroll();
      }, 150);
    };

    scrollContainer.addEventListener('scroll', debouncedScroll);

    // Cleanup
    return () => {
      clearTimeout(scrollTimeout);
      scrollContainer.removeEventListener('scroll', debouncedScroll);
    };
  }, [handleScroll]);

  // 🚀 NOVA FUNCIONALIDADE: Limpar cache ao mudar de filtro
  useEffect(() => {
    console.log('🔵 QuotaGrid: Filtro alterado para:', activeFilter);
    // Não limpar o cache, apenas recarregar a primeira página se necessário
    if (totalQuotas > 0 && !loadedPages.has(0)) {
      loadTicketsPage(0);
    }
  }, [activeFilter]);

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

      {/* ✅ Quota Grid com Scroll SEMPRE VISÍVEL e Paginação */}
      <div 
        className={`${getThemeClasses(campaignTheme).cardBg} rounded-lg relative`}
        style={{ 
          maxHeight: '660px', 
          height: '660px',
          overflow: 'hidden'
        }}
      >
        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute top-2 right-2 z-10">
            <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-white">Carregando...</span>
            </div>
          </div>
        )}

        <div 
          ref={scrollRef}
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
              
              // ✅ Display 0-indexed quota number directly (no subtraction)
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
          </div>
        </div>
      </div>

      {/* ✅ Scrollbar customizada com CSS inline */}
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