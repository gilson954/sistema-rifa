import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { calculateTotalWithPromotions } from '../utils/currency';
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
  reserving = false
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
  if (mode === 'manual') {
    return null; // Manual mode uses the quota grid for selection
  }

  return (
    <div 
      className={`quota-selector rounded-2xl shadow-xl p-6 sm:p-8 border transition-colors duration-300 ${getThemeClasses(campaignTheme).cardBg} ${getThemeClasses(campaignTheme).border}`}
    >
      <h2 className={`text-xl font-bold ${getThemeClasses(campaignTheme).text} mb-6 text-center`}>
        <span className={getThemeClasses(campaignTheme).text}>SELECIONE A QUANTIDADE DE COTAS</span>
      </h2>

      {/* Indicador de Promoção Ativa no Seletor */}
      {promotionInfo && (
        <div className={`mb-6 ${getThemeClasses(campaignTheme).cardBg} ${getThemeClasses(campaignTheme).border} border rounded-lg p-4`}>
          <div className="text-center">
            <div className={`text-sm font-medium ${getThemeClasses(campaignTheme).text} mb-1`}>
              🎉 Promoção Aplicada: {promotionInfo.discountPercentage}% OFF
            </div>
          </div>
        </div>
      )}
      {/* Increment Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {incrementButtons.map((button, index) => (
          <button
            key={index}
            onClick={() => handleIncrement(button.value)}
            className="text-white py-3 px-4 rounded-lg font-medium hover:brightness-90 transition-all duration-200"
            style={{ backgroundColor: primaryColor || '#3B82F6' }}
          >
            {button.label}
          </button>
        ))}
      </div>

      {/* Quantity Input */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        <button
          onClick={() => handleIncrement(-1)}
          className={`w-10 h-10 ${getThemeClasses(campaignTheme).cardBg} rounded-lg flex items-center justify-center transition-colors duration-200 hover:opacity-80`}
        >
          <Minus className={`h-4 w-4 ${getThemeClasses(campaignTheme).textSecondary}`} />
        </button>
        
        <input
          type="number"
          value={quantity}
          onChange={handleQuantityChange}
          min={minTicketsPerPurchase}
          max={maxTicketsPerPurchase}
          className={`w-20 text-center py-2 ${getThemeClasses(campaignTheme).cardBg} border ${getThemeClasses(campaignTheme).border} rounded-lg ${getThemeClasses(campaignTheme).text} focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-200`}
          style={{ '--tw-ring-color': primaryColor || '#3B82F6' } as React.CSSProperties}
        />
        
        <button
          onClick={() => handleIncrement(1)}
          className={`w-10 h-10 ${getThemeClasses(campaignTheme).cardBg} rounded-lg flex items-center justify-center transition-colors duration-200 hover:opacity-80`}
        >
          <Plus className={`h-4 w-4 ${getThemeClasses(campaignTheme).textSecondary}`} />
        </button>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="text-center mb-4">
          <p className="text-red-500 text-sm font-medium">
            {errorMessage}
          </p>
        </div>
      )}

      {/* Total Value */}
      <div className="text-center mb-6">
        {/* Exibição do preço original riscado se houver promoção */}
        {promotionInfo && (
          <div className={`text-sm ${getThemeClasses(campaignTheme).textSecondary} mb-1`}>
            <span className="line-through">
              {formatCurrency(promotionInfo.originalTotal)}
            </span>
          </div>
        )}
        <div className={`text-sm ${getThemeClasses(campaignTheme).textSecondary} mb-1`}>Valor final</div>
        <div 
          className={`text-2xl font-bold ${promotionInfo ? '' : getThemeClasses(campaignTheme).text}`}
          style={promotionInfo ? { color: "#10B981" } : {}}
        >
          R$ {calculateTotal()}
        </div>
      </div>

      {/* Buy Button */}
      <button 
        onClick={onReserve}
        disabled={reserving}
        className={`w-full py-4 rounded-lg font-bold text-lg transition-colors duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
        promotionInfo 
          ? 'text-white hover:brightness-90' 
          : 'text-white hover:brightness-90'
      }`}
      style={{ 
        backgroundColor: primaryColor || '#3B82F6'
      }}>
        {reserving ? 'RESERVANDO...' : 'RESERVAR'}
      </button>
    </div>
  );
};

export default QuotaSelector;