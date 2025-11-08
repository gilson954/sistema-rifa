// src/components/ReservationStep2Modal.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, CheckCircle, ShoppingCart, Phone } from 'lucide-react';
import { CustomerData } from '../utils/customerCheck';

// CRITICAL: Interface para os dados que serão enviados para reserveTickets
interface CustomerDataForReservation {
  name: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
  acceptTerms: boolean;
}

interface ReservationStep2ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (customerData: CustomerDataForReservation, totalQuantity: number, orderId: string, reservationTimestamp: Date) => void; // CRITICAL FIX: Adicionar parâmetros
  customerData: CustomerData;
  quotaCount: number;
  totalValue: number;
  selectedQuotas?: number[];
  campaignTitle: string;
  primaryColor?: string | null;
  colorMode?: string | null;
  gradientClasses?: string | null;
  customGradientColors?: string | null;
  campaignTheme: string;
  confirming?: boolean;
  orderId: string; // CRITICAL: Novo parâmetro - RECEBIDO COMO PROP
  reservationTimestamp: Date; // CRITICAL: Novo parâmetro - RECEBIDO COMO PROP
}

const ReservationStep2Modal: React.FC<ReservationStep2ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  customerData,
  quotaCount,
  totalValue,
  selectedQuotas,
  campaignTitle,
  primaryColor,
  colorMode,
  gradientClasses,
  customGradientColors,
  campaignTheme,
  confirming = false,
  orderId, // CRITICAL: Receber orderId como prop (gerado no Step1)
  reservationTimestamp // CRITICAL: Receber reservationTimestamp como prop (gerado no Step1)
}) => {
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string>('');

  React.useEffect(() => {
    if (isOpen) {
      setAcceptTerms(false);
      setError('');
      
      // CRITICAL: Log dos valores recebidos
      console.log('═══════════════════════════════════════════');
      console.log('🔵 ReservationStep2Modal - Modal Opened');
      console.log('═══════════════════════════════════════════');
      console.log('🆔 Received Order ID (from prop):', orderId);
      console.log('⏰ Received Timestamp (from prop):', reservationTimestamp.toISOString());
      console.log('👤 Customer Data:', customerData);
      console.log('📊 Quota Count:', quotaCount);
      console.log('═══════════════════════════════════════════');
    }
  }, [isOpen, orderId, reservationTimestamp, customerData, quotaCount]);

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
          labelText: 'text-gray-900',
          iconColor: 'text-gray-600',
          hoverBg: 'hover:bg-gray-100',
          overlayBg: 'bg-gray-900/40',
          userBg: 'bg-gray-100'
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
          labelText: 'text-gray-100',
          iconColor: 'text-gray-400',
          hoverBg: 'hover:bg-gray-800',
          overlayBg: 'bg-black/60',
          userBg: 'bg-gray-800'
        };
    case 'escuro-cinza':
      return {
        background: 'bg-[#1A1A1A]',
        text: 'text-white',
        textSecondary: 'text-gray-400',
        cardBg: 'bg-gradient-to-br from-[#2C2C2C] to-[#1A1A1A]',
        border: 'border-gray-900/50',
        inputBg: 'bg-[#2C2C2C]',
        inputBorder: 'border-gray-700',
        inputText: 'text-white',
        labelText: 'text-white',
        iconColor: 'text-gray-400',
        hoverBg: 'hover:bg-[#3C3C3C]',
        overlayBg: 'bg-black/60',
        userBg: 'bg-[#2C2C2C]'
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
          labelText: 'text-gray-900',
          iconColor: 'text-gray-600',
          hoverBg: 'hover:bg-gray-100',
          overlayBg: 'bg-gray-900/40',
          userBg: 'bg-gray-100'
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

  // ✅ CRITICAL FIX: handleConfirm agora passa customerData, totalQuantity, orderId e reservationTimestamp
  const handleConfirm = () => {
    console.log('╔═══════════════════════════════════════╗');
    console.log('🔵 ReservationStep2Modal - handleConfirm');
    console.log('╚═══════════════════════════════════════╝');

    if (!acceptTerms) {
      console.log('❌ Terms not accepted');
      setError('Você deve aceitar os termos de uso');
      return;
    }

    console.log('📊 Customer Data (from utils):', customerData);
    console.log('📊 Quota Count:', quotaCount);
    console.log('🆔 Order ID (from prop):', orderId);
    console.log('⏰ Reservation Timestamp (from prop):', reservationTimestamp.toISOString());

    // CRITICAL: Converter CustomerData para CustomerDataForReservation
    const customerDataForReservation: CustomerDataForReservation = {
      name: customerData.customer_name,
      email: customerData.customer_email,
      phoneNumber: customerData.customer_phone,
      countryCode: customerData.customer_phone.match(/^\+\d+/)?.[0] || '+55',
      acceptTerms: true
    };

    console.log('📦 Customer Data (for reservation):', customerDataForReservation);
    console.log('🔄 Calling onConfirm with:');
    console.log('   - customerData:', customerDataForReservation);
    console.log('   - totalQuantity:', quotaCount);
    console.log('   - orderId:', orderId);
    console.log('   - reservationTimestamp:', reservationTimestamp.toISOString());

    setError('');
    
    // CRITICAL FIX: Passar customerData, totalQuantity, orderId e reservationTimestamp
    onConfirm(customerDataForReservation, quotaCount, orderId, reservationTimestamp);
  };

  const handleClose = () => {
    if (!confirming) {
      setAcceptTerms(false);
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

  const customerCardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
        delay: 0.2
      }
    }
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
                      Confirme seus dados
                    </motion.p>
                  </div>
                </div>
                <motion.button
                  onClick={handleClose}
                  disabled={confirming}
                  className={`p-2.5 rounded-xl transition-all duration-200 ${
                    confirming
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

            {/* Customer Info Card */}
            <motion.div 
              className="px-6 pt-6"
              variants={customerCardVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div 
                className={`p-5 ${theme.cardBg} border ${theme.border} rounded-2xl shadow-sm`}
                whileHover={{ scale: 1.01, y: -2 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <motion.div 
                    className={`w-16 h-16 rounded-full ${theme.userBg} flex items-center justify-center`}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 200, 
                      damping: 15,
                      delay: 0.4
                    }}
                  >
                    <User className={`h-8 w-8 ${theme.iconColor}`} />
                  </motion.div>

                  {/* Customer Data */}
                  <motion.div 
                    className="flex-1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                  >
                    <h3 className={`text-lg font-bold ${theme.text}`}>
                      {customerData.customer_name}
                    </h3>
                    <motion.div 
                      className={`flex items-center gap-2 mt-1 text-sm ${theme.textSecondary}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6, duration: 0.3 }}
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>{customerData.customer_phone}</span>
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>

            {/* Terms and Confirm */}
            <motion.div 
              className="p-6 space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              {/* Terms Checkbox */}
              <motion.div 
                className={`p-4 rounded-xl border ${theme.border} ${theme.cardBg}`}
                whileHover={{ scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <label className="flex items-start gap-3 cursor-pointer group">
                  <motion.div 
                    className="relative flex-shrink-0 mt-0.5"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => {
                        setAcceptTerms(e.target.checked);
                        setError('');
                      }}
                      className="peer sr-only"
                    />
                    <motion.div
                      className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                        acceptTerms
                          ? 'bg-transparent border-transparent'
                          : `bg-transparent ${theme.inputBorder} group-hover:border-gray-400`
                      }`}
                      animate={acceptTerms ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      <AnimatePresence>
                        {acceptTerms && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 180 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                          >
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </motion.div>
                  <span className={`text-sm ${theme.text} leading-relaxed`}>
                    Ao realizar esta ação e confirmar minha participação nesta ação, declaro ter lido e concordado com os{' '}
                    <a
                      href="/termos"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold underline hover:opacity-80 transition-opacity"
                      style={{ color: primaryColor || '#3B82F6' }}
                    >
                      termos de uso
                    </a>{' '}
                    desta plataforma.
                  </span>
                </label>
                <AnimatePresence>
                  {error && (
                    <motion.p 
                      className="text-red-500 text-xs mt-2 font-medium"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Confirm Button */}
              <motion.button
                type="button"
                onClick={handleConfirm}
                disabled={confirming}
                className={`w-full py-4 px-6 rounded-xl text-white font-bold text-lg shadow-lg flex items-center justify-center gap-2 ${
                  confirming
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                } ${getColorClassName()}`}
                style={getColorStyle()}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                whileHover={!confirming ? { scale: 1.02, y: -2 } : {}}
                whileTap={!confirming ? { scale: 0.98 } : {}}
              >
                {confirming ? (
                  <>
                    <motion.div 
                      className="rounded-full h-5 w-5 border-b-2 border-white"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <span>Concluir reserva</span>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <CheckCircle className="h-5 w-5" />
                    </motion.div>
                  </>
                )}
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReservationStep2Modal;