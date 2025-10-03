import React, { useState, useEffect } from 'react';
import { Minus, Plus } from 'lucide-react';
import { calculateTotalWithPromotions } from '../utils/currency';
import { motion } from 'framer-motion'; // ADICIONADO: Importação do Framer Motion

interface PromotionInfo {
// ... (mantenha a interface PromotionInfo)
}

interface QuotaSelectorProps {
// ... (mantenha a interface QuotaSelectorProps)
}

// NOVO COMPONENTE: AnimatedCounter (Para a animação do número)
// Usamos o <AnimatePresence> para transição de entrada/saída do valor.
const AnimatedCounter: React.FC<{ value: number, theme: string }> = ({ value, theme }) => {
  // Uma função simples para classes de texto, replicando a lógica de getThemeClasses para o texto.
  const getTextColor = (campaignTheme: string) => {
    if (campaignTheme === 'claro') return 'text-gray-900';
    if (campaignTheme === 'escuro' || campaignTheme === 'escuro-preto') return 'text-white';
    return 'text-gray-900';
  };

  return (
    <div className="relative h-full w-full flex items-center justify-center overflow-hidden">
      <motion.div
        key={value} // A chave é o valor, para forçar a animação a cada mudança
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: '0%', opacity: 1 }}
        exit={{ y: '-100%', opacity: 0 }}
        transition={{ duration: 0.25, type: 'tween' }}
        className={`absolute text-2xl sm:text-3xl font-extrabold ${getTextColor(theme)}`}
      >
        {value.toLocaleString('pt-BR')}
      </motion.div>
    </div>
  );
};


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
  
  // O estado `displayQuantity` será usado no <input> ou no <AnimatedCounter>
  const [displayQuantity, setDisplayQuantity] = useState(quantity);
  
  // Atualiza o displayQuantity quando a animação terminar
  useEffect(() => {
    setDisplayQuantity(quantity);
  }, [quantity]);
  
  // Update quantity when initialQuantity or minTicketsPerPurchase changes
  React.useEffect(() => {
    const validQuantity = Math.max(initialQuantity, minTicketsPerPurchase);
    setQuantity(validQuantity);
    onQuantityChange(validQuantity);
  }, [initialQuantity, minTicketsPerPurchase, onQuantityChange]);

  // Function to get theme classes (MANTIDO)
  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case 'claro':
        return {
          background: 'bg-gray-50',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          cardBg: 'bg-white',
          border: 'border-gray-200',
          inputBg: 'bg-white',
          inputBorderFocus: 'focus:border-blue-500',
        };
      case 'escuro':
        return {
          background: 'bg-gray-950',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          cardBg: 'bg-gray-900',
          border: 'border-gray-800',
          inputBg: 'bg-gray-700', // Escuro mais claro para contraste com botões
          inputBorderFocus: 'focus:border-blue-400',
        };
      case 'escuro-preto':
        return {
          background: 'bg-black',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          cardBg: 'bg-gray-900',
          border: 'border-gray-800',
          inputBg: 'bg-gray-800',
          inputBorderFocus: 'focus:border-blue-400',
        };
      default:
        return {
          background: 'bg-gray-50',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          cardBg: 'bg-white',
          border: 'border-gray-200',
          inputBg: 'bg-white',
          inputBorderFocus: 'focus:border-blue-500',
        };
    }
  };

  const incrementButtons = [
// ... (mantenha os botões de incremento)
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
    // Permite que o usuário digite no campo
    const rawValue = e.target.value.replace(/\D/g, ''); // Remove não-dígitos
    const value = parseInt(rawValue) || minTicketsPerPurchase;
    handleUpdateQuantity(value);
  };
  
  const handleQuantityBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Garante que, ao desfocar, o valor esteja dentro dos limites
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

  // Função para gerar gradiente customizado (MANTIDA)
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

  // Função para obter style para cor ou gradiente (MANTIDA)
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

  // Função para obter className para gradientes (MANTIDA)
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

  const themeClasses = getThemeClasses(campaignTheme);

  if (mode === 'manual') {
    return null;
  }

  return (
    <div className={`quota-selector rounded-xl shadow-md p-4 sm:p-5 border transition-colors duration-300 ${themeClasses.cardBg} ${themeClasses.border}`}>
      <h2 className={`text-lg font-bold ${themeClasses.text} mb-4 text-center`}>
        <span className={themeClasses.text}>SELECIONE A QUANTIDADE DE COTAS</span>
      </h2>

      {/* Indicador de Promoção Ativa no Seletor */}
      {promotionInfo && (
        <div className={`mb-4 ${themeClasses.cardBg} ${themeClasses.border} border rounded-lg p-3`}>
          <div className="text-center">
            <div className={`text-xs font-medium ${themeClasses.text} mb-1`}>
              🎉 Promoção Aplicada: {promotionInfo.discountPercentage}% OFF
            </div>
          </div>
        </div> // CORRIGIDO: O erro de sintaxe do `*` estava aqui, faltava o fechamento da div.
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

      {/* Quantity Input - NOVO DESIGN: Bonito, Minimalista e Moderno (Inspirado no image_fbe8c6.png) */}
      <div className="flex items-center justify-center mb-4">
        <div 
          className={`flex items-center rounded-2xl overflow-hidden shadow-lg`}
          style={{ 
            boxShadow: campaignTheme === 'claro' 
              ? '0 6px 12px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.08)' 
              : '0 10px 20px -5px rgba(0, 0, 0, 0.3), 0 6px 10px -3px rgba(0, 0, 0, 0.15)',
            // Usa a cor primária para um destaque sutil na borda
            border: `2px solid ${primaryColor && colorMode === 'solid' ? primaryColor : themeClasses.border}`
          }}
        >
          {/* Botão Decremento */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleIncrement(-1)}
            className={`w-14 h-14 flex items-center justify-center transition-colors duration-200 ${
              campaignTheme === 'claro' ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
            disabled={quantity <= minTicketsPerPurchase}
          >
            <Minus className="h-5 w-5" />
          </motion.button>
          
          {/* Input/Display de Quantidade com Framer Motion */}
          <div className={`relative w-28 h-14 flex items-center justify-center ${themeClasses.inputBg}`}>
            {/* Opção 1: Input editável sem animação de números, mas formatado */}
            <input
              type="text" // Usamos text para melhor controle de formatação
              value={quantity.toLocaleString('pt-BR')} // Exibe formatado
              onChange={handleQuantityChange}
              onBlur={handleQuantityBlur}
              min={minTicketsPerPurchase}
              max={maxTicketsPerPurchase}
              className={`absolute inset-0 w-full h-full text-center text-2xl sm:text-3xl font-extrabold transition-all duration-200 focus:outline-none appearance-none bg-transparent ${themeClasses.text}`}
              // Estilos para esconder o seletor numérico padrão no Chrome/Edge/Firefox
              style={{
                MozAppearance: 'textfield',
                WebkitAppearance: 'none',
                padding: 0
              } as React.CSSProperties}
            />

            {/* Opção 2: Display Animado (Substitui o input acima se o campo for apenas de visualização) */}
            {/* <AnimatePresence mode="wait">
               <AnimatedCounter value={quantity} theme={campaignTheme} />
            </AnimatePresence>
            */}
          </div>
          
          {/* Botão Incremento */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleIncrement(1)}
            className={`w-14 h-14 flex items-center justify-center transition-colors duration-200 ${
              campaignTheme === 'claro' ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
            disabled={quantity >= maxTicketsPerPurchase}
          >
            <Plus className="h-5 w-5" />
          </motion.button>
        </div>
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
          <div className={`text-xs ${themeClasses.textSecondary} mb-1`}>
            <span className="line-through">
              {formatCurrency(promotionInfo.originalTotal)}
            </span>
          </div>
        )}
        <div className={`text-xs ${themeClasses.textSecondary} mb-1`}>Valor final</div>
        <div 
          className={`text-xl font-bold ${promotionInfo ? '' : themeClasses.text}`}
          // Adiciona a cor verde vibrante para promoções, como no print (image_fbe8ad.png)
          style={promotionInfo ? { color: "#10B981" } : {}} 
        >
          R$ {calculateTotal()}
        </div>
      </div>

      {/* Buy Button */}
      <button
        onClick={onReserve}
        disabled={reserving || disabled || !onReserve}
        className={getColorClassName(`w-full py-3 rounded-xl font-bold text-base transition-colors duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
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