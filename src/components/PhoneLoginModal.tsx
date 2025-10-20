import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, ArrowRight } from 'lucide-react';
import CountryPhoneSelect from './CountryPhoneSelect';
import { useAuth } from '../context/AuthContext';
import { TicketsAPI } from '../lib/api/tickets';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

interface PhoneLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  primaryColor?: string;
  colorMode?: string;
  gradientClasses?: string;
  customGradientColors?: string;
  campaignTheme?: string;
}

const PhoneLoginModal: React.FC<PhoneLoginModalProps> = ({
  isOpen,
  onClose,
  primaryColor = '#3B82F6',
  colorMode = 'solid',
  gradientClasses,
  customGradientColors,
  campaignTheme = 'claro'
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPhoneNumber('');
      setError('');
      setLoading(false);
    }
  }, [isOpen]);

  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case 'claro':
        return {
          background: 'bg-white',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          inputBg: 'bg-gray-50',
          inputBorder: 'border-gray-200',
          inputFocus: 'focus:border-blue-500 focus:ring-blue-500',
          inputText: 'text-gray-900',
          inputPlaceholder: 'placeholder-gray-400',
          iconColor: 'text-gray-500',
          overlayBg: 'bg-black/50'
        };
      case 'escuro':
      case 'escuro-preto':
        return {
          background: 'bg-gray-900',
          text: 'text-white',
          textSecondary: 'text-gray-400',
          inputBg: 'bg-gray-800',
          inputBorder: 'border-gray-700',
          inputFocus: 'focus:border-blue-500 focus:ring-blue-500',
          inputText: 'text-white',
          inputPlaceholder: 'placeholder-gray-500',
          iconColor: 'text-gray-400',
          overlayBg: 'bg-black/70'
        };
      default:
        return {
          background: 'bg-white',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          inputBg: 'bg-gray-50',
          inputBorder: 'border-gray-200',
          inputFocus: 'focus:border-blue-500 focus:ring-blue-500',
          inputText: 'text-gray-900',
          inputPlaceholder: 'placeholder-gray-400',
          iconColor: 'text-gray-500',
          overlayBg: 'bg-black/50'
        };
    }
  };

  const themeClasses = getThemeClasses(campaignTheme);

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
    return { backgroundColor: primaryColor };
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

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    
    if (selectedCountry.code === 'BR') {
      if (numbers.length <= 2) return numbers;
      if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
      if (numbers.length <= 11) {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
      }
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
    
    return numbers;
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setPhoneNumber(value);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phoneNumber) {
      setError('Por favor, insira seu número de telefone');
      return;
    }

    if (phoneNumber.length < 10) {
      setError('Número de telefone inválido');
      return;
    }

    setLoading(true);

    try {
      const fullPhoneNumber = `${selectedCountry.dialCode}${phoneNumber}`;

      const { data: tickets } = await TicketsAPI.getTicketsByPhoneNumber(fullPhoneNumber);

      if (!tickets || tickets.length === 0) {
        setError('Nenhuma cota encontrada para este número de telefone');
        setLoading(false);
        return;
      }

      const customerName = tickets[0]?.customer_name || 'Cliente';
      const customerEmail = tickets[0]?.customer_email || '';

      await signInWithPhone(fullPhoneNumber, {
        name: customerName,
        email: customerEmail
      });

      onClose();
      navigate('/my-tickets');
    } catch (error) {
      console.error('Error during phone login:', error);
      setError('Erro ao fazer login. Tente novamente.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`absolute inset-0 ${themeClasses.overlayBg} backdrop-blur-sm`}
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className={`relative ${themeClasses.background} rounded-3xl shadow-2xl max-w-md w-full overflow-hidden`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <h2 className={`text-2xl font-bold ${themeClasses.text}`}>
              Ver Minhas Cotas
            </h2>
            <button
              onClick={onClose}
              className={`p-2 ${themeClasses.iconColor} hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="mb-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className={`w-20 h-20 ${getColorClassName()} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}
                style={getColorStyle()}
              >
                <Phone className="h-10 w-10 text-white" />
              </motion.div>
              <p className={`${themeClasses.textSecondary} text-sm leading-relaxed`}>
                Digite seu número de telefone para<br />visualizar suas cotas
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Campo de telefone com seletor de país */}
              <div>
                <label className={`block text-sm font-semibold ${themeClasses.text} mb-3`}>
                  Número de Telefone
                </label>
                <div className="flex gap-3">
                  <div className="w-32 flex-shrink-0">
                    <CountryPhoneSelect
                      selectedCountry={selectedCountry}
                      onCountryChange={setSelectedCountry}
                    />
                  </div>
                  <input
                    type="tel"
                    value={formatPhoneNumber(phoneNumber)}
                    onChange={handlePhoneNumberChange}
                    placeholder="(11) 98765-4321"
                    className={`flex-1 px-4 py-3.5 ${themeClasses.inputBg} ${themeClasses.inputBorder} ${themeClasses.inputText} ${themeClasses.inputPlaceholder} border-2 rounded-xl ${themeClasses.inputFocus} focus:outline-none focus:ring-2 transition-all duration-200 font-medium`}
                    maxLength={15}
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2"
                >
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full ${getColorClassName()} text-white py-4 rounded-xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-6`}
                style={getColorStyle()}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <>
                    <span>Ver Minhas Cotas</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>

      <style>{`
        /* Barra de rolagem personalizada */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, ${primaryColor}88, ${primaryColor}cc);
          border-radius: 10px;
          transition: all 0.3s ease;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, ${primaryColor}aa, ${primaryColor}ff);
        }

        /* Para Firefox */
        * {
          scrollbar-width: thin;
          scrollbar-color: ${primaryColor}88 transparent;
        }
      `}</style>
    </AnimatePresence>
  );
};

export default PhoneLoginModal;