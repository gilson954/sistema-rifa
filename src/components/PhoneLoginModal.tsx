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
          textSecondary: 'text-gray-700',
          inputBg: 'bg-white',
          inputBorder: 'border-gray-300',
          inputText: 'text-gray-900',
          inputPlaceholder: 'placeholder-gray-500',
          labelText: 'text-gray-900',
          iconColor: 'text-gray-600',
          overlayBg: 'bg-gray-900/40'
        };
      case 'escuro':
      case 'escuro-preto':
        return {
          background: 'bg-gray-900',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          inputBg: 'bg-gray-800',
          inputBorder: 'border-gray-600',
          inputText: 'text-white',
          inputPlaceholder: 'placeholder-gray-400',
          labelText: 'text-gray-100',
          iconColor: 'text-gray-400',
          overlayBg: 'bg-black/60'
        };
      default:
        return {
          background: 'bg-white',
          text: 'text-gray-900',
          textSecondary: 'text-gray-700',
          inputBg: 'bg-white',
          inputBorder: 'border-gray-300',
          inputText: 'text-gray-900',
          inputPlaceholder: 'placeholder-gray-500',
          labelText: 'text-gray-900',
          iconColor: 'text-gray-600',
          overlayBg: 'bg-gray-900/40'
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
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative ${themeClasses.background} rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto`}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className={`text-2xl font-bold ${themeClasses.text}`}>
              Ver Minhas Cotas
            </h2>
            <button
              onClick={onClose}
              className={`p-2 ${themeClasses.iconColor} hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200`}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6">
            <div className="mb-6 text-center">
              <div
                className={`w-16 h-16 ${getColorClassName()} rounded-full flex items-center justify-center mx-auto mb-4`}
                style={getColorStyle()}
              >
                <Phone className="h-8 w-8 text-white" />
              </div>
              <p className={`${themeClasses.textSecondary} text-sm`}>
                Digite seu número de telefone para ver suas cotas
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.labelText} mb-2`}>
                  Número de Telefone
                </label>
                <div className="flex space-x-2">
                  <CountryPhoneSelect
                    selectedCountry={selectedCountry}
                    onCountryChange={setSelectedCountry}
                  />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneNumberChange}
                    placeholder="11987654321"
                    className={`flex-1 px-4 py-3 ${themeClasses.inputBg} ${themeClasses.inputBorder} ${themeClasses.inputText} ${themeClasses.inputPlaceholder} border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200`}
                    style={{
                      focusRing: colorMode === 'gradient' ? undefined : primaryColor
                    }}
                    maxLength={15}
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm"
                >
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full ${getColorClassName()} text-white py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                style={getColorStyle()}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
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
    </AnimatePresence>
  );
};

export default PhoneLoginModal;
