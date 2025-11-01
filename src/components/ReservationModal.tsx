import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Phone, Shield, CheckCircle, Clock, AlertTriangle, ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react';
import CountryPhoneSelect from './CountryPhoneSelect';
import { formatReservationTime } from '../utils/timeFormatters';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReserve: (customerData: CustomerData) => Promise<void>; // ✅ MUDANÇA: Agora é Promise<void>
  quotaCount: number;
  totalValue: number;
  selectedQuotas?: number[];
  campaignTitle: string;
  primaryColor?: string | null;
  colorMode?: string | null;
  gradientClasses?: string | null;
  customGradientColors?: string | null;
  campaignTheme: string;
  reserving?: boolean;
  reservationTimeoutMinutes?: number;
}

export interface CustomerData {
  name: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
  acceptTerms: boolean;
}

const ReservationModal: React.FC<ReservationModalProps> = ({
  isOpen,
  onClose,
  onReserve,
  quotaCount,
  totalValue,
  selectedQuotas,
  campaignTitle,
  primaryColor,
  colorMode,
  gradientClasses,
  customGradientColors,
  campaignTheme,
  reserving = false,
  reservationTimeoutMinutes = 15
}) => {
  const { showSuccess, showError, showWarning } = useNotification();
  const { signInWithPhone } = useAuth();

  const [formData, setFormData] = useState<CustomerData>({
    name: '',
    email: '',
    phoneNumber: '',
    countryCode: '+55',
    acceptTerms: false
  });

  const [selectedCountry, setSelectedCountry] = useState<Country>({
    code: 'BR',
    name: 'Brasil',
    dialCode: '+55',
    flag: '🇧🇷'
  });

  const [confirmPhoneNumber, setConfirmPhoneNumber] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAllQuotas, setShowAllQuotas] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        email: '',
        phoneNumber: '',
        countryCode: '+55',
        acceptTerms: false
      });
      setConfirmPhoneNumber('');
      setErrors({});
      setShowAllQuotas(false);
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Número de celular é obrigatório';
    } else {
      const phoneNumbers = formData.phoneNumber.replace(/\D/g, '');
      if (selectedCountry.code === 'BR' && phoneNumbers.length !== 11) {
        newErrors.phoneNumber = 'Número de celular deve ter 11 dígitos';
      } else if ((selectedCountry.code === 'US' || selectedCountry.code === 'CA') && phoneNumbers.length !== 10) {
        newErrors.phoneNumber = 'Número de telefone deve ter 10 dígitos';
      } else if (phoneNumbers.length < 7) {
        newErrors.phoneNumber = 'Número de telefone inválido';
      }
    }

    if (!confirmPhoneNumber.trim()) {
      newErrors.confirmPhoneNumber = 'Confirmação do número é obrigatória';
    } else if (formData.phoneNumber !== confirmPhoneNumber) {
      newErrors.confirmPhoneNumber = 'O número de celular não confere. Por favor, digite o mesmo número nos dois campos.';
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Você deve aceitar os termos de uso';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      showWarning(firstError);
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // ✅ CORREÇÃO: Normalizar o telefone para E.164 (+55XXXXXXXXXXX)
    const phoneDigitsOnly = formData.phoneNumber.replace(/\D/g, '');
    const dialCode = selectedCountry.dialCode.replace(/\D/g, '');
    
    let finalPhoneDigits = phoneDigitsOnly;
    
    if (phoneDigitsOnly.startsWith(dialCode)) {
      finalPhoneDigits = phoneDigitsOnly.substring(dialCode.length);
    }
    
    const fullPhoneNumber = `+${dialCode}${finalPhoneDigits}`;

    // ✅ LOGS para debug conforme o plano
    console.log('═══════════════════════════════════════════');
    console.log('🔵 ReservationModal - Debug de Telefone');
    console.log('═══════════════════════════════════════════');
    console.log('📱 Input original:', formData.phoneNumber);
    console.log('🔢 Apenas dígitos:', phoneDigitsOnly);
    console.log('🌍 Código do país:', selectedCountry.dialCode, '(país:', selectedCountry.code + ')');
    console.log('🔢 Dial code limpo:', dialCode);
    console.log('📞 Dígitos finais:', finalPhoneDigits);
    console.log('✅ Formato E.164 final:', fullPhoneNumber);
    console.log('📏 Tamanho total:', fullPhoneNumber.length, 'caracteres');
    console.log('═══════════════════════════════════════════');

    if (selectedCountry.code === 'BR' && finalPhoneDigits.length !== 11) {
      showError(`Número brasileiro deve ter 11 dígitos. Você digitou ${finalPhoneDigits.length} dígitos.`);
      return;
    }

    const customerData: CustomerData = {
      name: formData.name,
      email: formData.email,
      phoneNumber: fullPhoneNumber,
      countryCode: selectedCountry.dialCode,
      acceptTerms: formData.acceptTerms
    };

    console.log('📦 ReservationModal - Customer Data to be sent:', customerData);

    try {
      console.log('🔐 ReservationModal - Attempting auto-login with:', fullPhoneNumber);
      const loginResult = await signInWithPhone(fullPhoneNumber, {
        name: formData.name,
        email: formData.email
      });

      if (loginResult.success) {
        console.log('✅ ReservationModal - Auto-login successful!');
        showSuccess('Conta criada/logada com sucesso!');
      } else {
        console.warn('⚠️ ReservationModal - Auto-login failed:', loginResult.error);
      }
    } catch (error) {
      console.error('❌ ReservationModal - Exception during auto-login:', error);
    }

    // ✅ CRITICAL FIX: Chamar onReserve e verificar o resultado
    console.log('🎫 ReservationModal - Initiating ticket reservation...');
    try {
      await onReserve(customerData);
      console.log('✅ ReservationModal - Ticket reservation successful!');
    } catch (apiError: any) {
      console.error('❌ ReservationModal - Error during ticket reservation:', apiError);
      
      const errorMessage = apiError?.message || 'Erro ao reservar cotas. Tente novamente.';
      showError(errorMessage);
      
      return;
    }
  };

  const handleClose = () => {
    if (!reserving) {
      setFormData({
        name: '',
        email: '',
        phoneNumber: '',
        countryCode: '+55',
        acceptTerms: false
      });
      setConfirmPhoneNumber('');
      setErrors({});
      onClose();
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

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatSelectedQuotas = () => {
    if (!selectedQuotas || selectedQuotas.length === 0) return null;

    const sortedQuotas = [...selectedQuotas].sort((a, b) => a - b);
    const MAX_DISPLAY = 12;

    if (sortedQuotas.length <= MAX_DISPLAY) {
      return sortedQuotas.join(', ');
    }

    if (showAllQuotas) {
      return sortedQuotas.join(', ');
    }

    const displayedQuotas = sortedQuotas.slice(0, MAX_DISPLAY);
    const remainingCount = sortedQuotas.length - MAX_DISPLAY;
    
    return `${displayedQuotas.join(', ')}... (+${remainingCount})`;
  };

  const theme = getThemeClasses(campaignTheme);

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

  const formItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (custom: number) => ({ 
      opacity: 1, 
      x: 0,
      transition: { 
        duration: 0.4, 
        ease: 'easeOut',
        delay: custom * 0.05
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
            className={`rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto ${theme.background} border ${theme.border} ${
              campaignTheme === 'claro' ? 'custom-scrollbar-light' : 'custom-scrollbar-dark'
            }`}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
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
                      Crie sua conta
                    </motion.h2>
                    <motion.p 
                      className={`text-sm ${theme.textSecondary} mt-0.5`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                    >
                      Complete seus dados para continuar
                    </motion.p>
                  </div>
                </div>
                <motion.button
                  onClick={handleClose}
                  disabled={reserving}
                  className={`p-2.5 rounded-xl transition-all duration-200 ${
                    reserving 
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

            <motion.div 
              className="px-6 pt-6"
              variants={contentVariants}
            >
              <motion.div 
                className={`p-5 ${theme.cardBg} border ${theme.border} rounded-2xl shadow-sm`}
                whileHover={{ scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className={`font-bold text-lg ${theme.text} mb-3`}>
                      {campaignTitle}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3">
                      <motion.div 
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200/30 dark:border-gray-700/30"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      >
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className={`text-sm font-semibold ${theme.text}`}>
                          {quotaCount} {quotaCount === 1 ? 'cota' : 'cotas'}
                        </span>
                      </motion.div>
                      <motion.div 
                        className={`px-4 py-1.5 rounded-lg font-bold text-lg shadow-sm ${theme.text}`}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ 
                          type: 'spring', 
                          stiffness: 200, 
                          damping: 15,
                          delay: 0.3
                        }}
                      >
                        {formatCurrency(totalValue)}
                      </motion.div>
                    </div>
                    {selectedQuotas && selectedQuotas.length > 0 && (
                      <motion.div 
                        className={`text-xs ${theme.textSecondary} mt-3 p-3 rounded-lg bg-white/30 dark:bg-gray-800/30`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ delay: 0.4, duration: 0.3 }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <span className="font-semibold block mb-1">Números selecionados:</span>
                            <span className="break-words">{formatSelectedQuotas()}</span>
                          </div>
                          {selectedQuotas.length > 12 && (
                            <motion.button
                              type="button"
                              onClick={() => setShowAllQuotas(!showAllQuotas)}
                              className={`flex-shrink-0 p-1.5 rounded-lg ${theme.hoverBg} transition-colors duration-200`}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              {showAllQuotas ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div 
              className="px-6 pt-4"
              variants={contentVariants}
            >
              <motion.div 
                className={`relative overflow-hidden p-4 border-2 rounded-2xl ${
                  campaignTheme === 'claro' 
                    ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-300/50' 
                    : 'bg-gradient-to-br from-orange-900/20 to-amber-900/20 border-orange-700/50'
                }`}
                whileHover={{ scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div className="flex items-start space-x-3">
                  <motion.div 
                    className="p-2 rounded-xl bg-orange-500/10"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </motion.div>
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${theme.text} mb-1`}>
                      Tempo de Reserva
                    </p>
                    <p className={`text-sm ${theme.textSecondary} leading-relaxed`}>
                      Suas cotas ficarão reservadas por{' '}
                      <span className="font-bold text-orange-600 dark:text-orange-400">
                        {formatReservationTime(reservationTimeoutMinutes)}
                      </span>. 
                      Complete o pagamento via Pix para confirmar sua participação.
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              <motion.div
                custom={0}
                variants={formItemVariants}
                initial="hidden"
                animate="visible"
              >
                <label className={`block text-sm font-bold ${theme.labelText} mb-2`}>
                  Nome completo <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className={`absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 ${theme.iconColor}`} />
                  <motion.input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Digite seu nome completo"
                    className={`w-full pl-11 pr-4 py-3.5 border-2 rounded-xl ${theme.inputBg} ${theme.inputText} ${theme.inputPlaceholder} focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                      errors.name ? 'border-red-500 focus:ring-red-500/20' : `${theme.inputBorder} focus:ring-opacity-20`
                    }`}
                    style={{ '--tw-ring-color': `${primaryColor || '#3B82F6'}33` } as React.CSSProperties}
                    disabled={reserving}
                    required
                    whileFocus={{ scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  />
                </div>
                <AnimatePresence>
                  {errors.name && (
                    <motion.p 
                      className="text-red-500 text-sm mt-2 font-medium flex items-center gap-1"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {errors.name}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.div
                custom={1}
                variants={formItemVariants}
                initial="hidden"
                animate="visible"
              >
                <label className={`block text-sm font-bold ${theme.labelText} mb-2`}>
                  E-mail (Obrigatório) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 ${theme.iconColor}`} />
                  <motion.input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="seu@email.com"
                    className={`w-full pl-11 pr-4 py-3.5 border-2 rounded-xl ${theme.inputBg} ${theme.inputText} ${theme.inputPlaceholder} focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                      errors.email ? 'border-red-500 focus:ring-red-500/20' : `${theme.inputBorder} focus:ring-opacity-20`
                    }`}
                    style={{ '--tw-ring-color': `${primaryColor || '#3B82F6'}33` } as React.CSSProperties}
                    disabled={reserving}
                    required
                    whileFocus={{ scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  />
                </div>
                <AnimatePresence>
                  {errors.email && (
                    <motion.p 
                      className="text-red-500 text-sm mt-2 font-medium flex items-center gap-1"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {errors.email}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.div
                custom={2}
                variants={formItemVariants}
                initial="hidden"
                animate="visible"
              >
                <label className={`block text-sm font-bold ${theme.labelText} mb-2`}>
                  Número de celular <span className="text-red-500">*</span>
                </label>
                <CountryPhoneSelect
                  selectedCountry={selectedCountry}
                  onCountryChange={(country) => {
                    setSelectedCountry(country);
                    setFormData({ ...formData, countryCode: country.dialCode });
                  }}
                  phoneNumber={formData.phoneNumber}
                  onPhoneChange={(phone) => setFormData({ ...formData, phoneNumber: phone })}
                  placeholder="Digite seu número"
                  error={errors.phoneNumber}
                  theme={campaignTheme as 'claro' | 'escuro' | 'escuro-preto'}
                />
              </motion.div>

              <motion.div
                custom={3}
                variants={formItemVariants}
                initial="hidden"
                animate="visible"
              >
                <label className={`block text-sm font-bold ${theme.labelText} mb-2`}>
                  Confirme seu número <span className="text-red-500">*</span>
                </label>
                <CountryPhoneSelect
                  selectedCountry={selectedCountry}
                  onCountryChange={(country) => setSelectedCountry(country)}
                  phoneNumber={confirmPhoneNumber}
                  onPhoneChange={setConfirmPhoneNumber}
                  placeholder="Digite novamente seu número"
                  error={errors.confirmPhoneNumber}
                  theme={campaignTheme as 'claro' | 'escuro' | 'escuro-preto'}
                />
              </motion.div>

              <motion.div 
                className="space-y-4"
                custom={4}
                variants={formItemVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div 
                  className={`p-4 rounded-xl border-2 ${theme.border} ${theme.cardBg}`}
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <label htmlFor="acceptTerms" className="flex items-start gap-3 cursor-pointer group">
                    <motion.div 
                      className="relative flex-shrink-0 mt-0.5"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <input
                        type="checkbox"
                        id="acceptTerms"
                        checked={formData.acceptTerms}
                        onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                        className="peer sr-only"
                        disabled={reserving}
                        required
                      />
                      <motion.div
                        className={`w-5 h-5 rounded-lg border-2 transition-all duration-200 flex items-center justify-center ${
                          formData.acceptTerms
                            ? 'bg-transparent border-transparent'
                            : `${theme.inputBorder} group-hover:border-gray-400`
                        }`}
                        animate={formData.acceptTerms ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 0.3 }}
                        style={formData.acceptTerms ? { borderColor: 'transparent', backgroundColor: 'transparent' } : {} as React.CSSProperties}
                      >
                        <AnimatePresence>
                          {formData.acceptTerms && (
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
                    <span className={`text-sm ${theme.textSecondary} leading-relaxed cursor-pointer`}>
                      Ao reservar, declaro ter lido e concordado com os{' '}
                      <a href="#" className="font-semibold hover:underline" style={{ color: primaryColor || '#3B82F6' }}>
                        termos de uso
                      </a>{' '}
                      e a{' '}
                      <a href="#" className="font-semibold hover:underline" style={{ color: primaryColor || '#3B82F6' }}>
                        política de privacidade
                      </a>
                      .
                    </span>
                  </label>
                </motion.div>
                <AnimatePresence>
                  {errors.acceptTerms && (
                    <motion.p 
                      className="text-red-500 text-sm font-medium flex items-center gap-1"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {errors.acceptTerms}
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.div 
                  className={`relative overflow-hidden border-2 rounded-2xl p-4 ${
                    campaignTheme === 'claro'
                      ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300/50'
                      : 'bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border-blue-700/50'
                  }`}
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <div className="flex items-start space-x-3">
                    <motion.div 
                      className="p-2 rounded-xl bg-blue-500/10"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <AlertTriangle className={`h-5 w-5 ${
                        campaignTheme === 'claro' ? 'text-blue-600' : 'text-blue-400'
                      }`} />
                    </motion.div>
                    <div className="flex-1">
                      <p className={`text-sm font-bold mb-1 ${
                        campaignTheme === 'claro' ? 'text-blue-900' : 'text-blue-100'
                      }`}>
                        Importante
                      </p>
                      <p className={`text-sm leading-relaxed ${
                        campaignTheme === 'claro' ? 'text-blue-800' : 'text-blue-200'
                      }`}>
                        Após confirmar, você terá{' '}
                        <span className="font-bold">{formatReservationTime(reservationTimeoutMinutes)}</span>{' '}
                        para efetuar o pagamento. Caso contrário, suas cotas serão liberadas automaticamente.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div 
                className={`${theme.cardBg} rounded-2xl p-5 border-2 ${theme.border} shadow-sm`}
                custom={5}
                variants={formItemVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-bold text-lg ${theme.text}`}>
                    Total a pagar
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${theme.textSecondary}`}>
                    {quotaCount} {quotaCount === 1 ? 'cota' : 'cotas'}
                  </span>
                  <motion.span 
                    className={`font-bold text-3xl ${theme.text}`}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 200, 
                      damping: 15,
                      delay: 0.5
                    }}
                  >
                    {formatCurrency(totalValue)}
                  </motion.span>
                </div>
              </motion.div>

              <motion.div 
                className="space-y-3 pt-2"
                custom={6}
                variants={formItemVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.button
                  type="submit"
                  disabled={reserving}
                  className={`w-full text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 ${!reserving ? getColorClassName() : ''}`}
                  style={reserving ? { backgroundColor: '#9CA3AF' } : getColorStyle()}
                  whileHover={!reserving ? { scale: 1.02, y: -2 } : {}}
                  whileTap={!reserving ? { scale: 0.98 } : {}}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  {reserving ? (
                    <>
                      <motion.div 
                        className="rounded-full h-5 w-5 border-b-2 border-white"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      <span>Processando reserva...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="h-5 w-5" />
                      <span>Concluir reserva</span>
                    </>
                  )}
                </motion.button>

                <motion.button
                  type="button"
                  onClick={handleClose}
                  disabled={reserving}
                  className={`w-full py-3.5 rounded-xl font-semibold transition-all duration-300 border-2 ${theme.border} ${theme.text} ${theme.hoverBg} disabled:opacity-50 disabled:cursor-not-allowed`}
                  whileHover={!reserving ? { scale: 1.01, y: -1 } : {}}
                  whileTap={!reserving ? { scale: 0.99 } : {}}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  Cancelar
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReservationModal;