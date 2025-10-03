import React, { useState } from 'react';
import { Minus, Plus, Sparkles, TrendingUp } from 'lucide-react';

// Simulação da função de cálculo para o preview
const calculateTotalWithPromotions = (quantity: number, price: number, promotions: any[]) => {
  return { total: quantity * price };
};

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
  ticketPrice = 10,
  minTicketsPerPurchase = 1,
  maxTicketsPerPurchase = 100,
  onQuantityChange = () => {},
  initialQuantity = 1,
  mode = 'automatic',
  promotionInfo,
  promotions = [],
  primaryColor = '#3B82F6',
  campaignTheme = 'escuro',
  onReserve = () => {},
  reserving = false,
  disabled = false,
  colorMode = 'solid',
  gradientClasses,
  customGradientColors
}) => {
  const [quantity, setQuantity] = useState(Math.max(initialQuantity, minTicketsPerPurchase));
  const [errorMessage, setErrorMessage] = useState<string>('');

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
          promotionBg: 'bg-gradient-to-r from-amber-50 to-orange-50',
          promotionBorder: 'border-amber-200'
        };
      case 'escuro':
        return {
          background: 'bg-gray-950',
          text: 'text-white',
          textSecondary: 'text-gray-400',
          cardBg: 'bg-gray-900',
          border: 'border-gray-800',
          inputBg: 'bg-gray-800',
          promotionBg: 'bg-gradient-to-r from-amber-950/30 to-orange-950/30',
          promotionBorder: 'border-amber-700/50'
        };
      case 'escuro-preto':
        return {
          background: 'bg-black',
          text: 'text-white',
          textSecondary: 'text-gray-400',
          cardBg: 'bg-gray-950',
          border: 'border-gray-800',
          inputBg: 'bg-gray-900',
          promotionBg: 'bg-gradient-to-r from-amber-950/30 to-orange-950/30',
          promotionBorder: 'border-amber-700/50'
        };
      default:
        return {
          background: 'bg-gray-50',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          cardBg: 'bg-white',
          border: 'border-gray-200',
          inputBg: 'bg-gray-50',
          promotionBg: 'bg-gradient-to-r from-amber-50 to-orange-50',
          promotionBorder: 'border-amber-200'
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
    const newQuantity = quantity + value;
    handleUpdateQuantity(newQuantity);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || minTicketsPerPurchase;
    handleUpdateQuantity(value);
  };

  const calculateTotal = () => {
    const { total } = calculateTotalWithPromotions(
      quantity,
      ticketPrice,
      promotions || []
    );
    return total.toFixed(2).replace('.', ',');
  };

  const formatCurrency = (value: number) => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'R$ 0,00';
    }
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
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
    <div className={`quota-selector rounded-2xl shadow-2xl p-6 sm:p-8 border transition-all duration-300 ${theme.cardBg} ${theme.border} backdrop-blur-sm`}>
      
      {/* Header com ícone */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
          <TrendingUp className="w-5 h-5" style={{ color: primaryColor }} />
        </div>
        <h2 className={`text-xl font-bold ${theme.text} tracking-tight`}>
          Escolha suas Cotas
        </h2>
      </div>

      {/* Indicador de Promoção - Design Aprimorado */}
      {promotionInfo && (
        <div className={`mb-6 ${theme.promotionBg} ${theme.promotionBorder} border-2 rounded-2xl p-4 backdrop-blur-sm relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400/10 to-orange-400/10 rounded-full blur-3xl" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-amber-600 dark:text-amber-400">
                  Promoção Ativa
                </div>
                <div className="text-xs text-amber-700 dark:text-amber-300">
                  Economize {promotionInfo.discountPercentage}% nesta compra
                </div>
              </div>
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {promotionInfo.discountPercentage}%
            </div>
          </div>
        </div>
      )}

      {/* Increment Buttons - Design Moderno */}
      <div className="grid grid-cols-4 gap-2.5 mb-6">
        {incrementButtons.map((button, index) => (
          <button
            key={index}
            onClick={() => handleIncrement(button.value)}
            className={getColorClassName(`
              relative overflow-hidden
              text-white py-3 px-3 rounded-xl 
              font-bold text-sm
              transition-all duration-300
              hover:scale-105 hover:shadow-xl
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

      {/* Quantity Input - Design Premium */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={() => handleIncrement(-1)}
          disabled={quantity <= minTicketsPerPurchase}
          className={`
            group relative w-14 h-14 rounded-2xl
            flex items-center justify-center 
            transition-all duration-300
            ${theme.inputBg} border-2
            hover:scale-110 active:scale-95
            disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100
            shadow-lg hover:shadow-2xl
          `}
          style={{
            borderColor: quantity > minTicketsPerPurchase ? primaryColor : 'transparent',
          }}
        >
          <Minus 
            className="h-6 w-6 transition-all duration-300"
            style={{
              color: quantity > minTicketsPerPurchase ? primaryColor : undefined,
            }}
          />
        </button>
        
        <div className="relative">
          <input
            type="number"
            value={quantity}
            onChange={handleQuantityChange}
            min={minTicketsPerPurchase}
            max={maxTicketsPerPurchase}
            className={`
              w-32 h-16 text-center text-3xl font-black
              ${theme.inputBg} border-2 rounded-2xl
              ${theme.text}
              focus:outline-none focus:ring-4 focus:border-transparent 
              transition-all duration-300
              shadow-lg focus:shadow-2xl
            `}
            style={{ 
              '--tw-ring-color': `${primaryColor}40`,
              borderColor: primaryColor,
            } as React.CSSProperties}
          />
          <div 
            className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-semibold whitespace-nowrap px-3 py-1 rounded-full"
            style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
          >
            {quantity === 1 ? 'cota' : 'cotas'}
          </div>
        </div>
        
        <button
          onClick={() => handleIncrement(1)}
          disabled={quantity >= maxTicketsPerPurchase}
          className={`
            group relative w-14 h-14 rounded-2xl
            flex items-center justify-center 
            transition-all duration-300
            ${theme.inputBg} border-2
            hover:scale-110 active:scale-95
            disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100
            shadow-lg hover:shadow-2xl
          `}
          style={{
            borderColor: quantity < maxTicketsPerPurchase ? primaryColor : 'transparent',
          }}
        >
          <Plus 
            className="h-6 w-6 transition-all duration-300"
            style={{
              color: quantity < maxTicketsPerPurchase ? primaryColor : undefined,
            }}
          />
        </button>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="text-center mb-4 mt-8">
          <div className="inline-block px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30">
            <p className="text-red-500 text-sm font-semibold">
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {/* Total Value - Design Sofisticado */}
      <div className={`text-center mb-6 mt-10 p-6 rounded-2xl ${theme.inputBg} border ${theme.border}`}>
        {promotionInfo && (
          <div className="mb-2">
            <span className={`text-sm ${theme.textSecondary} line-through`}>
              {formatCurrency(promotionInfo.originalTotal)}
            </span>
            <span className="ml-2 text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
              -{promotionInfo.discountPercentage}%
            </span>
          </div>
        )}
        <div className={`text-xs font-semibold ${theme.textSecondary} mb-2 tracking-wider uppercase`}>
          Valor Total
        </div>
        <div 
          className="text-4xl font-black tracking-tight"
          style={{ color: promotionInfo ? "#10B981" : primaryColor }}
        >
          R$ {calculateTotal()}
        </div>
        <div className={`text-xs ${theme.textSecondary} mt-2`}>
          {quantity}x R$ {ticketPrice.toFixed(2).replace('.', ',')}
        </div>
      </div>

      {/* Buy Button - Design Premium */}
      <button
        onClick={onReserve}
        disabled={reserving || disabled || !onReserve}
        className={getColorClassName(`
          relative overflow-hidden
          w-full py-4 rounded-2xl 
          font-black text-lg tracking-wide
          transition-all duration-300 
          shadow-xl hover:shadow-2xl
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
              <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              RESERVANDO...
            </>
          ) : disabled ? (
            'INDISPONÍVEL'
          ) : (
            <>
              RESERVAR AGORA
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </span>
      </button>

      {/* Rodapé informativo */}
      <div className={`text-center mt-4 text-xs ${theme.textSecondary}`}>
        <div className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Compra 100% segura e garantida</span>
        </div>
      </div>
    </div>
  );
};

export default QuotaSelector;