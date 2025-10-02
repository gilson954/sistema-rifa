import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
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

  // Update quantity when initialQuantity or minTicketsPerPurchase changes
  React.useEffect(() => {
    const validQuantity = Math.max(initialQuantity, minTicketsPerPurchase);
    setQuantity(validQuantity);
    onQuantityChange(validQuantity);
  }, [initialQuantity, minTicketsPerPurchase, onQuantityChange]);

  // Function to get theme classes
  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case 'claro':
        return {
          background: 'bg-gray-50',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          cardBg: 'bg-white',
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
          background: 'bg-gray-50',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          cardBg: 'bg-white',
          border: 'border-gray-200'
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
    // Ensure quantity is at least the minimum
    const adjustedQuantity = Math.max(minTicketsPerPurchase, newQuantity);
    
    // Check if quantity exceeds maximum
    if (adjustedQuantity > maxTicketsPerPurchase) {
      setErrorMessage(`Máximo ${maxTicketsPerPurchase.toLocaleString('pt-BR')} bilhetes por compra`);
      // Set to maximum allowed
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
    // Usa o novo cálculo de promoções em blocos
    const { total } = calculateTotalWithPromotions(
      quantity,
      ticketPrice,
      promotions || []
    );
    return total.toFixed(2).replace('.', ',');
  };

  const formatCurrency = (value: number) => {
    // Verificação de segurança para valores inválidos
    if (value === null || value === undefined || isNaN(value)) {
      return 'R$ 0,00';
    }
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
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

  if (mode === 'manual') {
    return null; // Manual mode uses the quota grid for selection
  }

  return (
    <div className={`quota-selector rounded-xl shadow-md p-4 sm:p-5 border transition-colors duration-300 ${getThemeClasses(campaignTheme).cardBg} ${getThemeClasses(campaignTheme).border}`}>
      <h2 className={`text-lg font-bold ${getThemeClasses(campaignTheme).text} mb-4 text-center`}>
        <span className={getThemeClasses(campaignTheme).text}>SELECIONE A QUANTIDADE DE COTAS</span>
      </h2>

      {/* Indicador de Promoção Ativa no Seletor */}
      {promotionInfo && (
        <div className={`mb-4 ${getThemeClasses(campaignTheme).cardBg} ${getThemeClasses(campaignTheme).border} border rounded-lg p-3`}>
          <div className="text-center">
            <div className={`text-xs font-medium ${getThemeClasses(campaignTheme).text} mb-1`}>
              🎉 Promoção Aplicada: {promotionInfo.discountPercentage}% OFF
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
            className={getColorClassName("text-white py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg font-medium text-xs sm:text-sm hover:brightness-90 transition-all duration-200")}
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
          className={`w-8 h-8 ${getThemeClasses(campaignTheme).cardBg} rounded-lg flex items-center justify-center transition-colors duration-200 hover:opacity-80 border ${getThemeClasses(campaignTheme).border}`}
        >
          <Minus className={`h-3 w-3 ${getThemeClasses(campaignTheme).textSecondary}`} />
        </button>
        
        <input
          type="number"
          value={quantity}
          onChange={handleQuantityChange}
          min={minTicketsPerPurchase}
          max={maxTicketsPerPurchase}
          className={`w-16 text-center py-1.5 text-sm ${getThemeClasses(campaignTheme).cardBg} border ${getThemeClasses(campaignTheme).border} rounded-lg ${getThemeClasses(campaignTheme).text} focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-200`}
          style={{ '--tw-ring-color': primaryColor || '#3B82F6' } as React.CSSProperties}
        />
        
        <button
          onClick={() => handleIncrement(1)}
          className={`w-8 h-8 ${getThemeClasses(campaignTheme).cardBg} rounded-lg flex items-center justify-center transition-colors duration-200 hover:opacity-80 border ${getThemeClasses(campaignTheme).border}`}
        >
          <Plus className={`h-3 w-3 ${getThemeClasses(campaignTheme).textSecondary}`} />
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
          <div className={`text-xs ${getThemeClasses(campaignTheme).textSecondary} mb-1`}>
            <span className="line-through">
              {formatCurrency(promotionInfo.originalTotal)}
            </span>
          </div>
        )}
        <div className={`text-xs ${getThemeClasses(campaignTheme).textSecondary} mb-1`}>Valor final</div>
        <div 
          className={`text-xl font-bold ${promotionInfo ? '' : getThemeClasses(campaignTheme).text}`}
          style={promotionInfo ? { color: "#10B981" } : {}}
        >
          R$ {calculateTotal()}
        </div>
      </div>

      {/* Buy Button */}
      <button
        onClick={onReserve}
        disabled={reserving || disabled || !onReserve}
        className={getColorClassName(`w-full py-3 rounded-lg font-bold text-base transition-colors duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
        promotionInfo
          ? 'text-white hover:brightness-90'
          : 'text-white hover:brightness-90'
      }`)}
      style={getColorStyle()}>
        {reserving ? 'RESERVANDO...' : disabled ? 'INDISPONÍVEL' : 'RESERVAR'}
      </button>
    </div>
  );
};

export default QuotaSelector;