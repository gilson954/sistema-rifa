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
  campaignId?: string;
  organizerId?: string;
}

const PhoneLoginModal: React.FC<PhoneLoginModalProps> = ({
  isOpen,
  onClose,
  primaryColor = '#3B82F6',
  colorMode = 'solid',
  gradientClasses,
  customGradientColors,
  campaignTheme = 'claro',
  campaignId,
  organizerId
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
          inputBg: 'bg-white',
          inputBorder: 'border-gray-300',
          inputText: 'text-gray-900',
          inputPlaceholder: 'placeholder-gray-500',
          labelText: 'text-gray-900',
          iconColor: 'text-gray-600',
          overlayBg: 'bg-gray-900/40',
          borderColor: 'border-gray-200'
        };
      case 'escuro':
      case 'escuro-preto':
        return {
          background: 'bg-gray-900',
          text: 'text-white',
          textSecondary: 'text-gray-400',
          inputBg: 'bg-gray-800',
          inputBorder: 'border-gray-600',
          inputText: 'text-white',
          inputPlaceholder: 'placeholder-gray-400',
          labelText: 'text-gray-100',
          iconColor: 'text-gray-400',
          overlayBg: 'bg-black/60',
          borderColor: 'border-gray-800'
        };
      default:
        return {
          background: 'bg-white',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          inputBg: 'bg-white',
          inputBorder: 'border-gray-300',
          inputText: 'text-gray-900',
          inputPlaceholder: 'placeholder-gray-500',
          labelText: 'text-gray-900',
          iconColor: 'text-gray-600',
          overlayBg: 'bg-gray-900/40',
          borderColor: 'border-gray-200'
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validação básica
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
      // Combina dialCode + digits para formar o número completo
      const phoneDigitsOnly = phoneNumber.replace(/\D/g, '');
      const fullPhoneNumber = `${selectedCountry.dialCode}${phoneDigitsOnly}`;

      console.log('🔵 PhoneLoginModal - Phone digits only:', phoneDigitsOnly);
      console.log('🟢 PhoneLoginModal - Full phone number:', fullPhoneNumber);

      // Buscar tickets usando o número de telefone completo
      // O banco de dados agora faz matching flexível automaticamente
      const { data: tickets, error: ticketsError } = await TicketsAPI.getTicketsByPhoneNumber(fullPhoneNumber);

      if (ticketsError) {
        console.error('❌ PhoneLoginModal - Error fetching tickets:', ticketsError);
        setError('Erro ao buscar suas cotas. Tente novamente.');
        setLoading(false);
        return;
      }

      console.log('🟡 PhoneLoginModal - Tickets found:', tickets?.length || 0);

      if (!tickets || tickets.length === 0) {
        setError('Nenhuma cota encontrada para este número de telefone');
        setLoading(false);
        return;
      }

      // Extrair dados do cliente do primeiro ticket
      const customerName = tickets[0]?.customer_name || 'Cliente';
      const customerEmail = tickets[0]?.customer_email || '';

      console.log('✅ PhoneLoginModal - Customer found:', customerName);

      // Fazer login com o número de telefone
      const loginResult = await signInWithPhone(fullPhoneNumber, {
        name: customerName,
        email: customerEmail
      });

      if (!loginResult.success) {
        console.error('❌ PhoneLoginModal - Login failed:', loginResult.error);
        setError('Erro ao fazer login. Tente novamente.');
        setLoading(false);
        return;
      }

      console.log('✅ PhoneLoginModal - Login successful, navigating to my-tickets');

      // Fechar modal e navegar para página de tickets
      onClose();
      navigate('/my-tickets', {
        state: {
          campaignId,
          organizerId
        }
      });
    } catch (error) {
      console.error('❌ PhoneLoginModal - Unexpected error:', error);
      setError('Erro inesperado. Tente novamente.');
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
          className={`relative ${themeClasses.background} rounded-2xl shadow-2xl w-full max-w-md overflow-hidden modal-scrollbar`}
          style={{ maxHeight: '90vh' }}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${themeClasses.borderColor}`}>
            <h2 className={`text-2xl font-bold ${themeClasses.text}`}>
              Ver Minhas Cotas
            </h2>
            <button
              onClick={onClose}
              className={`p-2 ${themeClasses.iconColor} hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="overflow-y-auto modal-scrollbar" style={{ maxHeight: 'calc(90vh - 80px)' }}>
            <div className="p-6">
              {/* Icon and Description */}
              <div className="mb-6 text-center">
                <div
                  className={`w-16 h-16 ${getColorClassName()} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}
                  style={getColorStyle()}
                >
                  <Phone className="h-8 w-8 text-white" />
                </div>
                <p className={`${themeClasses.textSecondary} text-sm leading-relaxed`}>
                  Digite seu número de telefone para ver suas cotas
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.labelText} mb-2`}>
                    Número de Celular
                  </label>
                  <CountryPhoneSelect
                    selectedCountry={selectedCountry}
                    onCountryChange={setSelectedCountry}
                    phoneNumber={phoneNumber}
                    onPhoneChange={setPhoneNumber}
                    placeholder="(00) 00000-0000"
                    error={error}
                    theme={campaignTheme as 'claro' | 'escuro' | 'escuro-preto'}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full ${getColorClassName()} text-white py-3.5 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]`}
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
          </div>
        </motion.div>

        {/* Custom Scrollbar Styles */}
        <style>{`
          .modal-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          
          .modal-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          
          .modal-scrollbar::-webkit-scrollbar-thumb {
            background: ${campaignTheme === 'claro' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)'};
            border-radius: 10px;
          }
          
          .modal-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${campaignTheme === 'claro' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)'};
          }
          
          /* Firefox */
          .modal-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: ${campaignTheme === 'claro' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)'} transparent;
          }
        `}</style>
      </div>
    </AnimatePresence>
  );
};

export default PhoneLoginModal;