import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, CheckCircle, ShoppingCart, ArrowRight } from 'lucide-react';
import CountryPhoneSelect from './CountryPhoneSelect';
import { checkCustomerByPhone, CustomerData as ExistingCustomer } from '../utils/customerCheck';
import { useAuth } from '../context/AuthContext';
import { formatPhoneNumber } from '../lib/api/tickets';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

interface ReservationStep1ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewCustomer: () => void;
  onExistingCustomer: (customerData: ExistingCustomer) => void;
  quotaCount: number;
  totalValue: number;
  selectedQuotas?: number[];
  campaignTitle: string;
  primaryColor?: string | null;
  colorMode?: string | null;
  gradientClasses?: string | null;
  customGradientColors?: string | null;
  campaignTheme: string;
}

const ReservationStep1Modal: React.FC<ReservationStep1ModalProps> = ({
  isOpen,
  onClose,
  onNewCustomer,
  onExistingCustomer,
  quotaCount,
  totalValue,
  selectedQuotas,
  campaignTitle,
  primaryColor,
  colorMode,
  gradientClasses,
  customGradientColors,
  campaignTheme
}) => {
  const navigate = useNavigate();
  const { signInWithPhone } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>({
    code: 'BR',
    name: 'Brasil',
    dialCode: '+55',
    flag: '🇧🇷'
  });
  const [error, setError] = useState<string>('');
  const [checking, setChecking] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setPhoneNumber('');
      setError('');
      setChecking(false);
    }
  }, [isOpen]);

  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case 'claro':
        return {
          background: 'bg-white',
          text: 'text-gray-900',
          textSecondary: 'text-gray-700',
          cardBg: 'bg-gradient-to-br from-gray-50 to-gray-100',
          border: 'border-gray-200/50',
          inputBg: 'bg-white',
          inputBorder: 'border-gray-300',
          inputText: 'text-gray-900',
          inputPlaceholder: 'placeholder-gray-500',
          labelText: 'text-gray-900',
          iconColor: 'text-gray-600',
          hoverBg: 'hover:bg-gray-100',
          overlayBg: 'bg-gray-900/40'
        };
      case 'escuro':
      case 'escuro-preto':
        return {
          background: 'bg-gray-900',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          cardBg: 'bg-gradient-to-br from-gray-800 to-gray-900',
          border: 'border-gray-700/50',
          inputBg: 'bg-gray-800',
          inputBorder: 'border-gray-600',
          inputText: 'text-white',
          inputPlaceholder: 'placeholder-gray-400',
          labelText: 'text-gray-100',
          iconColor: 'text-gray-400',
          hoverBg: 'hover:bg-gray-800',
          overlayBg: 'bg-black/60'
        };
      default:
        return {
          background: 'bg-white',
          text: 'text-gray-900',
          textSecondary: 'text-gray-700',
          cardBg: 'bg-gradient-to-br from-gray-50 to-gray-100',
          border: 'border-gray-200/50',
          inputBg: 'bg-white',
          inputBorder: 'border-gray-300',
          inputText: 'text-gray-900',
          inputPlaceholder: 'placeholder-gray-500',
          labelText: 'text-gray-900',
          iconColor: 'text-gray-600',
          hoverBg: 'hover:bg-gray-100',
          overlayBg: 'bg-gray-900/40'
        };
    }
  };

  const getCustomGradientStyle = () => {
    if (!customGradientColors) return {};

    try {
      const colors = JSON.parse(customGradientColors);
      if (Array.isArray(colors) && colors.length >= 2) {
        return {
          backgroundImage: `linear-gradient(135deg, ${colors.join(', ')})`,
          backgroundSize: '200% 200%'
        };
      }
    } catch (e) {
      console.error('Error parsing custom gradient colors:', e);
    }
    return {};
  };

  const getColorStyle = () => {
    if (colorMode === 'gradient') {
      if (gradientClasses === 'custom') {
        return getCustomGradientStyle();
      }
      return {};
    }
    return primaryColor ? { backgroundColor: primaryColor } : {};
  };

  const getColorClassName = () => {
    if (colorMode === 'gradient') {
      if (gradientClasses === 'custom') {
        return 'animate-gradient-x bg-[length:200%_200%]';
      }
      return `bg-gradient-to-r ${gradientClasses} animate-gradient-x bg-[length:200%_200%]`;
    }
    return '';
  };

  const validatePhoneNumber = (): boolean => {
    if (!phoneNumber.trim()) {
      setError('Número de celular é obrigatório');
      return false;
    }

    const phoneNumbers = phoneNumber.replace(/\D/g, '');
    if (selectedCountry.code === 'BR' && phoneNumbers.length !== 11) {
      setError('Número de celular deve ter 11 dígitos');
      return false;
    } else if ((selectedCountry.code === 'US' || selectedCountry.code === 'CA') && phoneNumbers.length !== 10) {
      setError('Número de telefone deve ter 10 dígitos');
      return false;
    } else if (phoneNumbers.length < 7) {
      setError('Número de telefone inválido');
      return false;
    }

    return true;
  };

  const handleContinue = async () => {
    if (!validatePhoneNumber()) {
      return;
    }

    setChecking(true);
    setError('');

    try {
      // Constrói o número completo com código do país
      const fullPhoneNumber = `${selectedCountry.dialCode}${phoneNumber}`;

      // ✅ UTILIZA formatPhoneNumber centralizada para padronizar o número
      // Formato final: +5511999999999 (apenas dígitos com código do país)
      const normalizedPhoneNumber = formatPhoneNumber(fullPhoneNumber);

      console.log('Original phone:', fullPhoneNumber);
      console.log('Normalized phone:', normalizedPhoneNumber);

      // Verifica se o cliente existe no banco usando o número normalizado
      const { data: customerData, error: checkError } = await checkCustomerByPhone(normalizedPhoneNumber);

      if (checkError) {
        console.error('Error checking customer:', checkError);
        setError('Erro ao verificar número. Tente novamente.');
        return;
      }

      if (customerData) {
        console.log('Customer found:', customerData);
        // Cliente existente - fazer login e chamar callback
        await signInWithPhone(normalizedPhoneNumber, {
          name: customerData.customer_name,
          email: customerData.customer_email
        });
        onExistingCustomer(customerData);
      } else {
        console.log('New customer - opening registration modal');
        // Cliente novo - abrir modal de cadastro
        onNewCustomer();
      }
    } catch (err) {
      console.error('Error checking customer:', err);
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setChecking(false);
    }
  };

  const handleClose = () => {
    if (!checking) {
      setPhoneNumber('');
      setError('');
      onClose();
    }
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const theme = getThemeClasses(campaignTheme);

  // Variantes de animação
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2, ease: 'easeIn' }
    }
  };

  const modalVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.9,
      y: 50
    },
    visible: { 
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { 
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0,
      scale: 0.95,
      y: 30,
      transition: { 
        duration: 0.25,
        ease: 'easeIn'
      }
    }
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' }
    }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut', delay: 0.1 }
    }
  };

  const cardItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (custom: number) => ({ 
      opacity: 1, 
      x: 0,
      transition: { 
        duration: 0.3, 
        ease: 'easeOut',
        delay: custom * 0.1
      }
    })
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className={`fixed inset-0 ${theme.overlayBg} backdrop-blur-sm flex items-center justify-center z-50 p-4`}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={handleClose}
        >
          <motion.div
            className={`rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto ${theme.background} border ${theme.border} ${
              campaignTheme === 'claro' ? 'custom-scrollbar-light' : 'custom-scrollbar-dark'
            }`}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <motion.div 
              className="relative overflow-hidden"
              variants={headerVariants}
            >
              <div className="absolute inset-0 bg-gradient-to-r opacity-10" style={{
                background: `linear-gradient(135deg, ${primaryColor || '#3B82F6'} 0%, ${primaryColor || '#3B82F6'}99 100%)`
              }}></div>

              <div className={`relative flex items-center justify-between p-6 border-b ${theme.border}`}>
                <div className="flex items-center space-x-4">
                  <motion.div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg ${getColorClassName()}`}
                    style={getColorStyle()}
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <ShoppingCart className="h-6 w-6" />
                  </motion.div>
                  <div>
                    <motion.h2 
                      className={`text-2xl font-bold ${theme.text}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                    >
                      Sua conta
                    </motion.h2>
                    <motion.p 
                      className={`text-sm ${theme.textSecondary} mt-0.5`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                    >
                      Digite seu número de celular
                    </motion.p>
                  </div>
                </div>
                <motion.button
                  onClick={handleClose}
                  disabled={checking}
                  className={`p-2.5 rounded-xl transition-all duration-200 ${
                    checking
                      ? 'cursor-not-allowed opacity-50'
                      : `${theme.hoverBg}`
                  }`}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <X className={`h-5 w-5 ${theme.iconColor}`} />
                </motion.button>
              </div>
            </motion.div>

            {/* Card de resumo */}
            <motion.div 
              className="px-6 pt-6"
              variants={contentVariants}
            >
              <motion.div 
                className={`p-5 ${theme.cardBg} border ${theme.border} rounded-2xl shadow-sm`}
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <motion.div 
                  className="flex items-center justify-between gap-4"
                  custom={0}
                  variants={cardItemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </motion.div>
                    <span className={`text-sm font-semibold ${theme.text}`}>
                      Quantidade de títulos
                    </span>
                  </div>
                  <motion.span 
                    className={`text-2xl font-bold ${theme.text}`}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 200, 
                      damping: 15,
                      delay: 0.3
                    }}
                  >
                    {quotaCount}
                  </motion.span>
                </motion.div>
                <motion.div 
                  className="flex items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-200/30 dark:border-gray-700/30"
                  custom={1}
                  variants={cardItemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <span className={`text-sm font-semibold ${theme.textSecondary}`}>
                    Valor
                  </span>
                  <motion.span 
                    className={`text-2xl font-bold ${theme.text}`}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 200, 
                      damping: 15,
                      delay: 0.4
                    }}
                  >
                    {formatCurrency(totalValue)}
                  </motion.span>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Form */}
            <motion.form 
              onSubmit={(e) => { e.preventDefault(); handleContinue(); }} 
              className="p-6 space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              {/* Phone Number */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <motion.label 
                  className={`flex items-center text-sm font-semibold ${theme.labelText} mb-2`}
                  whileHover={{ x: 2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <Phone className={`h-4 w-4 mr-2 ${theme.iconColor}`} />
                  Número de Celular
                </motion.label>
                <CountryPhoneSelect
                  phoneNumber={phoneNumber}
                  onPhoneChange={setPhoneNumber}
                  selectedCountry={selectedCountry}
                  onCountryChange={setSelectedCountry}
                  placeholder="Digite seu número"
                  error={error}
                  theme={campaignTheme as 'claro' | 'escuro' | 'escuro-preto'}
                />
              </motion.div>

              {/* Continue Button */}
              <motion.button
                type="submit"
                disabled={checking}
                className={`w-full py-4 px-6 rounded-xl text-white font-bold text-lg shadow-lg flex items-center justify-center gap-2 ${
                  checking
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                } ${getColorClassName()}`}
                style={getColorStyle()}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                whileHover={!checking ? { scale: 1.02, y: -2 } : {}}
                whileTap={!checking ? { scale: 0.98 } : {}}
              >
                {checking ? (
                  <>
                    <motion.div 
                      className="rounded-full h-5 w-5 border-b-2 border-white"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <>
                    <span>Continuar</span>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <ArrowRight className="h-5 w-5" />
                    </motion.div>
                  </>
                )}
              </motion.button>
            </motion.form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReservationStep1Modal;