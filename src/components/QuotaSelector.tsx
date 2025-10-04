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
    // Formatação com separador de milhares
    return total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatCurrency = (value: number) => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'R$ 0,00';
    }
    // Formatação com separador de milhares
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
      
      {/* Header simplificado */}
      <h2 className={`text-lg font-bold ${theme.text} mb-4 text-center`}>
        SELECIONE A QUANTIDADE DE COTAS
      </h2>

      {/* Indicador de Promoção - SEM ÍCONE e cores ajustadas */}
      {promotionInfo && (
        <div className={`mb-4 ${theme.promotionBg} ${theme.promotionBorder} border-2 rounded-lg p-3`}>
          <div className="text-center">
            <div className={`text-sm font-bold ${theme.promotionText}`}>
              Promoção Ativa
            </div>
            <div className={`text-xs ${theme.promotionTextSecondary} mt-1`}>
              Economize {promotionInfo.discountPercentage}% nesta compra
            </div>
          </div>
        </div>
      )}

      {/* Increment Buttons */}
      <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 sm:gap-2.5 mb-4">
        {incrementButtons.map((button, index) => (
          <button
            key={index}
            onClick={() => handleIncrement(button.value)}
            className={getColorClassName(`
              relative overflow-hidden
              text-white py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg 
              font-medium text-xs sm:text-sm
              transition-all duration-200
              hover:brightness-90 hover:scale-105
              active:scale-95
            `)}
            style={getColorStyle()}
          >
            {button.label}
          </button>
        ))}
      </div>

      {/* Quantity Input */}
      <div className="flex items-center justify-center space-x-3 mb-4">
        <button
          onClick={() => handleIncrement(-1)}
          className={`w-8 h-8 ${theme.cardBg} rounded-lg flex items-center justify-center transition-colors duration-200 hover:opacity-80 border ${theme.border}`}
        >
          <Minus className={`h-3 w-3 ${theme.textSecondary}`} />
        </button>
        
        <input
          type="number"
          value={quantity}
          onChange={handleQuantityChange}
          min={minTicketsPerPurchase}
          max={maxTicketsPerPurchase}
          className={`w-16 text-center py-1.5 text-sm ${theme.cardBg} border ${theme.border} rounded-lg ${theme.text} focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-200`}
          style={{ '--tw-ring-color': primaryColor || '#3B82F6' } as React.CSSProperties}
        />
        
        <button
          onClick={() => handleIncrement(1)}
          className={`w-8 h-8 ${theme.cardBg} rounded-lg flex items-center justify-center transition-colors duration-200 hover:opacity-80 border ${theme.border}`}
        >
          <Plus className={`h-3 w-3 ${theme.textSecondary}`} />
        </button>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="text-center mb-3">
          <p className="text-red-500 text-sm font-medium">
            {errorMessage}
          </p>
        </div>
      )}

      {/* Total Value */}
      <div className="text-center mb-4">
        {/* Exibição do preço original riscado se houver promoção */}
        {promotionInfo && (
          <div className={`text-xs ${theme.textSecondary} mb-1`}>
            <span className="line-through">
              {formatCurrency(promotionInfo.originalTotal)}
            </span>
          </div>
        )}
        <div className={`text-xs ${theme.textSecondary} mb-1`}>Valor final</div>
        <div 
          className={`text-xl font-bold ${promotionInfo ? '' : theme.text}`}
          style={promotionInfo ? { color: "#10B981" } : {}}
        >
          R$ {calculateTotal()}
        </div>
      </div>

      {/* Buy Button */}
      <button
        onClick={onReserve}
        disabled={reserving || disabled || !onReserve}
        className={getColorClassName(`
          w-full py-3 rounded-lg font-bold text-base 
          transition-colors duration-200 shadow-md 
          disabled:opacity-50 disabled:cursor-not-allowed 
          text-white hover:brightness-90
        `)}
        style={getColorStyle()}
      >
        {reserving ? 'RESERVANDO...' : disabled ? 'INDISPONÍVEL' : 'RESERVAR'}
      </button>
    </div>
  );
};

export default QuotaSelector;