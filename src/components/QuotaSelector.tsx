import React, { useState } from 'react';
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
  campaignTheme: string;
  onReserve?: () => void;
  reserving?: boolean;
  disabled?: boolean;
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
  campaignTheme,
  onReserve,
  reserving = false,
  disabled = false,
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
          buttonBg: 'bg-blue-600 hover:bg-blue-700',
          numberColor: '#000000'
        };
      case 'escuro':
        return {
          background: 'bg-gray-950',
          text: 'text-white',
          textSecondary: 'text-gray-400',
          cardBg: 'bg-gray-900',
          border: 'border-gray-800',
          inputBg: 'bg-gray-800',
          buttonBg: 'bg-blue-600 hover:bg-blue-700',
          numberColor: '#FFFFFF'
        };
      case 'escuro-preto':
        return {
          background: 'bg-black',
          text: 'text-white',
          textSecondary: 'text-gray-400',
          cardBg: 'bg-gray-950',
          border: 'border-gray-800',
          inputBg: 'bg-gray-900',
          buttonBg: 'bg-blue-600 hover:bg-blue-700',
          numberColor: '#FFFFFF'
        };
      default:
        return {
          background: 'bg-gray-50',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          cardBg: 'bg-white',
          border: 'border-gray-200',
          inputBg: 'bg-gray-50',
          buttonBg: 'bg-blue-600 hover:bg-blue-700',
          numberColor: '#000000'
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
    return total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatCurrency = (value: number) => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'R$ 0,00';
    }
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
          <TrendingUp className="w-4 h-4 text-blue-500" />
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
            className={`
              relative overflow-hidden
              text-white py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg 
              font-bold text-xs sm:text-sm
              transition-all duration-300
              hover:scale-105 hover:shadow-lg
              active:scale-95
              before:absolute before:inset-0 before:bg-white/0 hover:before:bg-white/10
              before:transition-all before:duration-300
              ${theme.buttonBg}
            `}
          >
            <span className="relative z-10">{button.label}</span>
          </button>
        ))}
      </div>

      {/* Quantity Input */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <button
          onClick={() => handleIncrement(-1)}
          disabled={quantity <= minTicketsPerPurchase}
          className={`
            group relative w-12 h-12 rounded-xl
            flex items-center justify-center 
            transition-all duration-300
            ${theme.inputBg} border-2 border-blue-500
            hover:scale-110 active:scale-95
            disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100
            shadow-lg hover:shadow-xl
          `}
        >
          <Minus 
            className="h-5 w-5 transition-all duration-300 text-blue-500"
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
              w-24 h-14 text-center text-2xl font-black
              ${theme.inputBg} border-2 border-blue-500 rounded-xl
              focus:outline-none focus:ring-4 focus:ring-blue-500/40 focus:border-transparent 
              transition-all duration-300
              shadow-lg focus:shadow-xl
            `}
            style={{ 
              color: theme.numberColor
            } as React.CSSProperties}
          />
          <div 
            className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs font-semibold whitespace-nowrap px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-500"
          >
            {quantity === 1 ? 'cota' : 'cotas'}
          </div>
        </div>
        
        <button
          onClick={() => handleIncrement(1)}
          disabled={quantity >= maxTicketsPerPurchase}
          className={`
            group relative w-12 h-12 rounded-xl
            flex items-center justify-center 
            transition-all duration-300
            ${theme.inputBg} border-2 border-blue-500
            hover:scale-110 active:scale-95
            disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100
            shadow-lg hover:shadow-xl
          `}
        >
          <Plus 
            className="h-5 w-5 transition-all duration-300 text-blue-500"
          />
        </button>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="text-center mb-3 mt-6">
          <div className="inline-block px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-red-500 text-sm font-semibold">
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {/* Total Value */}
      <div className={`text-center mb-4 mt-8 p-4 rounded-xl ${theme.inputBg} border ${theme.border}`}>
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
          className="text-3xl font-black tracking-tight"
          style={{ color: promotionInfo ? "#10B981" : "#3B82F6" }}
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
        className={`
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
          ${theme.buttonBg}
        `}
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