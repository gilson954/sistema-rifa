import React, { useState, useRef } from 'react';
import { Minus, Plus, TrendingUp } from 'lucide-react';
import { calculateTotalWithPromotions } from '../utils/currency';

interface PromotionInfo {
  promotion: any;
  originalTotal: number;
  promotionalTotal: number;
  savings: number;
  discountPercentage: number;
}

interface QuotaSelectorProps {
  ticketPrice: number;
  minTicketsPerPurchase: number;
  maxTicketsPerPurchase: number;
  onQuantityChange: (quantity: number) => void;
  initialQuantity?: number;
  mode: 'manual' | 'automatic';
  promotionInfo?: PromotionInfo | null;
  promotions?: any[];
  primaryColor?: string | null;
  campaignTheme: string;
  onReserve?: () => void;
  reserving?: boolean;
  disabled?: boolean;
  colorMode?: string;
  gradientClasses?: string;
  customGradientColors?: string;
}

const QuotaSelector: React.FC<QuotaSelectorProps> = ({
  ticketPrice,
  minTicketsPerPurchase,
  maxTicketsPerPurchase,
  onQuantityChange,
  initialQuantity = 1,
  mode,
  promotionInfo,
  promotions = [],
  primaryColor,
  campaignTheme,
  onReserve,
  reserving = false,
  disabled = false,
  colorMode = 'solid',
  gradientClasses,
  customGradientColors
}) => {
  const [quantity, setQuantity] = useState(Math.max(initialQuantity, minTicketsPerPurchase));
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [animationDirection, setAnimationDirection] = useState<'up' | 'down' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    const validQuantity = Math.max(initialQuantity, minTicketsPerPurchase);
    setQuantity(validQuantity);
    onQuantityChange(validQuantity);
  }, [initialQuantity, minTicketsPerPurchase, onQuantityChange]);

  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case 'claro':
        return {
          background: 'bg-gray-50',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          cardBg: 'bg-white',
          border: 'border-gray-200',
          inputBg: 'bg-gray-50',
          inputRing: 'ring-zinc-200',
          inputFocusRing: 'focus-within:ring-blue-500',
          promotionBg: 'bg-green-50',
          promotionBorder: 'border-green-200',
          promotionText: 'text-green-800',
          promotionTextSecondary: 'text-green-700'
        };
      case 'escuro':
        return {
          background: 'bg-gray-950',
          text: 'text-white',
          textSecondary: 'text-gray-400',
          cardBg: 'bg-gray-900',
          border: 'border-gray-800',
          inputBg: 'bg-gray-800',
          inputRing: 'ring-zinc-800',
          inputFocusRing: 'focus-within:ring-blue-500',
          promotionBg: 'bg-gradient-to-r from-amber-950/30 to-orange-950/30',
          promotionBorder: 'border-amber-700/50',
          promotionText: 'text-amber-400',
          promotionTextSecondary: 'text-amber-300'
        };
      case 'escuro-preto':
        return {
          background: 'bg-black',
          text: 'text-white',
          textSecondary: 'text-gray-400',
          cardBg: 'bg-gray-950',
          border: 'border-gray-800',
          inputBg: 'bg-gray-900',
          inputRing: 'ring-zinc-800',
          inputFocusRing: 'focus-within:ring-blue-500',
          promotionBg: 'bg-gradient-to-r from-amber-950/30 to-orange-950/30',
          promotionBorder: 'border-amber-700/50',
          promotionText: 'text-amber-400',
          promotionTextSecondary: 'text-amber-300'
        };
      default:
        return {
          background: 'bg-gray-50',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          cardBg: 'bg-white',
          border: 'border-gray-200',
          inputBg: 'bg-gray-50',
          inputRing: 'ring-zinc-200',
          inputFocusRing: 'focus-within:ring-blue-500',
          promotionBg: 'bg-green-50',
          promotionBorder: 'border-green-200',
          promotionText: 'text-green-800',
          promotionTextSecondary: 'text-green-700'
        };
    }
  };

  const incrementButtons = [
    { label: '+1', value: 1 },
    { label: '+5', value: 5 },
    { label: '+15', value: 15 },
    { label: '+150', value: 150 },
    { label: '+1000', value: 1000 },
    { label: '+5000', value: 5000 },
    { label: '+10000', value: 10000 },
    { label: '+20000', value: 20000 }
  ];

  const handleUpdateQuantity = (newQuantity: number) => {
    const adjustedQuantity = Math.max(minTicketsPerPurchase, newQuantity);
    
    if (adjustedQuantity > maxTicketsPerPurchase) {
      setErrorMessage(`Máximo ${maxTicketsPerPurchase.toLocaleString('pt-BR')} bilhetes por compra`);
      setQuantity(maxTicketsPerPurchase);
      onQuantityChange(maxTicketsPerPurchase);
    } else {
      setErrorMessage('');
      setQuantity(adjustedQuantity);
      onQuantityChange(adjustedQuantity);
    }
  };

  const handleIncrement = (value: number) => {
    // Determina direção da animação
    const direction = value > 0 ? 'up' : 'down';
    setAnimationDirection(direction);
    
    // Reseta a animação após completar
    setTimeout(() => setAnimationDirection(null), 300);
    
    setQuantity(prevQuantity => {
      const newQuantity = prevQuantity + value;
      const adjustedQuantity = Math.max(minTicketsPerPurchase, newQuantity);
      
      if (adjustedQuantity > maxTicketsPerPurchase) {
        setErrorMessage(`Máximo ${maxTicketsPerPurchase.toLocaleString('pt-BR')} bilhetes por compra`);
        onQuantityChange(maxTicketsPerPurchase);
        return maxTicketsPerPurchase;
      } else {
        setErrorMessage('');
        onQuantityChange(adjustedQuantity);
        return adjustedQuantity;
      }
    });
  };

  const startIncrement = (value: number) => {
    handleIncrement(value);
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        handleIncrement(value);
      }, 100);
    }, 500);
  };

  const stopIncrement = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  React.useEffect(() => {
    return () => {
      stopIncrement();
    };
  }, []);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === '') {
      return;
    }
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      handleUpdateQuantity(value);
    }
  };

  const calculateTotal = () => {
    const { total } = calculateTotalWithPromotions(
      quantity,
      ticketPrice,
      promotions || []
    );
    return total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatCurrency = (value: number) => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'R$ 0,00';
    }
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  if (mode === 'manual') {
    return null;
  }

  const theme = getThemeClasses(campaignTheme);

  return (
    <div className={`quota-selector rounded-xl shadow-md p-4 sm:p-5 border transition-all duration-300 ${theme.cardBg} ${theme.border}`}>
      
      {/* Header com ícone */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
          <TrendingUp className={`w-4 h-4 ${theme.text}`} />
        </div>
        <h2 className={`text-lg font-bold ${theme.text} tracking-tight`}>
          Escolha suas Cotas
        </h2>
      </div>

      {/* Increment Buttons */}
      <div className="grid grid-cols-4 gap-2 sm:gap-2.5 mb-4">
        {incrementButtons.map((button, index) => (
          <button
            key={index}
            onClick={() => handleIncrement(button.value)}
            className={getColorClassName(`
              relative overflow-hidden
              text-white py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg 
              font-bold text-xs sm:text-sm
              transition-all duration-300
              hover:scale-105 hover:shadow-lg
              active:scale-95
              before:absolute before:inset-0 before:bg-white/0 hover:before:bg-white/10
              before:transition-all before:duration-300
            `)}
            style={getColorStyle()}
          >
            <span className="relative z-10">{button.label}</span>
          </button>
        ))}
      </div>

      {/* Quantity Input - Novo Design */}
      <div className="flex items-center justify-center mb-4">
        <div className={`flex items-stretch rounded-md text-3xl font-semibold ring transition-all duration-200 ${theme.inputRing} ${theme.inputFocusRing} focus-within:ring-2`}>
          <button
            aria-hidden
            tabIndex={-1}
            className={`flex items-center pl-[.5em] pr-[.325em] ${theme.text} disabled:opacity-30 disabled:cursor-not-allowed transition-opacity`}
            disabled={quantity <= minTicketsPerPurchase}
            onPointerDown={(e) => {
              if (e.pointerType === 'mouse') {
                e.preventDefault();
                inputRef.current?.focus();
              }
              startIncrement(-1);
            }}
            onPointerUp={stopIncrement}
            onPointerLeave={stopIncrement}
          >
            <Minus className="size-4" strokeWidth={3.5} />
          </button>
          
          <div className="relative grid items-center justify-items-center text-center [grid-template-areas:'overlap'] *:[grid-area:overlap]">
            <input
              ref={inputRef}
              className={`
                caret-blue-500
                w-[3em] bg-transparent py-2 text-center font-[inherit] text-transparent outline-none
                [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
              `}
              style={{ fontKerning: 'none' }}
              type="number"
              min={minTicketsPerPurchase}
              step={1}
              autoComplete="off"
              inputMode="numeric"
              max={maxTicketsPerPurchase}
              value={quantity}
              onChange={handleQuantityChange}
            />
            <div 
              key={quantity}
              className={`
                pointer-events-none ${theme.text} font-semibold
                ${animationDirection === 'up' ? 'number-slide-up' : ''}
                ${animationDirection === 'down' ? 'number-slide-down' : ''}
              `}
              aria-hidden
              style={{ fontKerning: 'none' }}
            >
              {quantity.toLocaleString('pt-BR', { useGrouping: false })}
            </div>
          </div>
          
          <button
            aria-hidden
            tabIndex={-1}
            className={`flex items-center pl-[.325em] pr-[.5em] ${theme.text} disabled:opacity-30 disabled:cursor-not-allowed transition-opacity`}
            disabled={quantity >= maxTicketsPerPurchase}
            onPointerDown={(e) => {
              if (e.pointerType === 'mouse') {
                e.preventDefault();
                inputRef.current?.focus();
              }
              startIncrement(1);
            }}
            onPointerUp={stopIncrement}
            onPointerLeave={stopIncrement}
          >
            <Plus className="size-4" strokeWidth={3.5} />
          </button>
        </div>
      </div>

      {/* Label de cotas */}
      <div className="text-center mb-4">
        <div 
          className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${theme.textSecondary}`}
          style={{ backgroundColor: campaignTheme === 'claro' ? '#00000020' : '#FFFFFF20' }}
        >
          {quantity === 1 ? 'cota' : 'cotas'}
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="text-center mb-3">
          <div className="inline-block px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-red-500 text-sm font-semibold">
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {/* Total Value */}
      <div className={`text-center mb-4 mt-6 p-4 rounded-xl ${theme.inputBg} border ${theme.border}`}>
        {promotionInfo && (
          <div className="mb-1.5">
            <span className={`text-sm ${theme.textSecondary} line-through`}>
              {formatCurrency(promotionInfo.originalTotal)}
            </span>
            <span className="ml-2 text-xs font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
              -{promotionInfo.discountPercentage}%
            </span>
          </div>
        )}
        <div className={`text-xs font-semibold ${theme.textSecondary} mb-1 tracking-wider uppercase`}>
          Valor Total
        </div>
        <div 
          className={`text-3xl font-black tracking-tight ${promotionInfo ? '' : theme.text}`}
          style={promotionInfo ? { color: '#10B981' } : {}}
        >
          R$ {calculateTotal()}
        </div>
        <div className={`text-xs ${theme.textSecondary} mt-1`}>
          {quantity}x R$ {ticketPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>

      {/* Buy Button */}
      <button
        onClick={onReserve}
        disabled={reserving || disabled || !onReserve}
        className={getColorClassName(`
          relative overflow-hidden
          w-full py-3 rounded-lg 
          font-black text-base tracking-wide
          transition-all duration-300 
          shadow-lg hover:shadow-xl
          disabled:opacity-50 disabled:cursor-not-allowed 
          text-white
          hover:scale-[1.02] active:scale-[0.98]
          before:absolute before:inset-0 before:bg-white/0 hover:before:bg-white/10
          before:transition-all before:duration-300
        `)}
        style={getColorStyle()}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {reserving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              RESERVANDO...
            </>
          ) : disabled ? (
            'INDISPONÍVEL'
          ) : (
            <>
              RESERVAR AGORA
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </span>
      </button>

      {/* Rodapé informativo */}
      <div className={`text-center mt-3 text-xs ${theme.textSecondary}`}>
        <div className="flex items-center justify-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Compra 100% segura</span>
        </div>
      </div>
    </div>
  );
};

export default QuotaSelector;