import React, { useState } from 'react';
import { X, Phone, CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import CountryPhoneSelect from './CountryPhoneSelect';
import { checkCustomerByPhone, CustomerData as ExistingCustomer } from '../utils/customerCheck';

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
      const fullPhoneNumber = `${selectedCountry.dialCode} ${phoneNumber}`;
      const { data, error: checkError } = await checkCustomerByPhone(fullPhoneNumber);

      if (checkError) {
        setError('Erro ao verificar número. Tente novamente.');
        setChecking(false);
        return;
      }

      if (data) {
        // Cliente existente
        onExistingCustomer(data);
      } else {
        // Cliente novo
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

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 ${theme.overlayBg} backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300`}>
      <div className={`rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto ${theme.background} border ${theme.border} transform transition-all duration-300 animate-in slide-in-from-bottom-4`}>

        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r opacity-10" style={{
            background: `linear-gradient(135deg, ${primaryColor || '#3B82F6'} 0%, ${primaryColor || '#3B82F6'}99 100%)`
          }}></div>

          <div className={`relative flex items-center justify-between p-6 border-b ${theme.border}`}>
            <div className="flex items-center space-x-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg transform hover:scale-105 transition-transform duration-200 ${getColorClassName()}`}
                style={getColorStyle()}
              >
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${theme.text}`}>
                  Sua conta
                </h2>
                <p className={`text-sm ${theme.textSecondary} mt-0.5`}>
                  Digite seu número de celular
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={checking}
              className={`p-2.5 rounded-xl transition-all duration-200 ${
                checking
                  ? 'cursor-not-allowed opacity-50'
                  : `${theme.hoverBg} hover:scale-105`
              }`}
            >
              <X className={`h-5 w-5 ${theme.iconColor}`} />
            </button>
          </div>
        </div>

        {/* Card de resumo */}
        <div className="px-6 pt-6">
          <div className={`p-5 ${theme.cardBg} border ${theme.border} rounded-2xl shadow-sm`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle className={`h-5 w-5 ${theme.text}`} />
                <span className={`text-sm font-semibold ${theme.text}`}>
                  Quantidade de títulos
                </span>
              </div>
              <span className={`text-2xl font-bold ${theme.text}`}>
                {quotaCount}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-200/30 dark:border-gray-700/30">
              <span className={`text-sm font-semibold ${theme.textSecondary}`}>
                Valor
              </span>
              <span className={`text-2xl font-bold ${theme.text}`}>
                {formatCurrency(totalValue)}
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleContinue(); }} className="p-6 space-y-6">
          {/* Phone Number */}
          <div>
            <label className={`flex items-center text-sm font-semibold ${theme.labelText} mb-2`}>
              <Phone className={`h-4 w-4 mr-2 ${theme.iconColor}`} />
              Número de Celular
            </label>
            <CountryPhoneSelect
              phoneNumber={phoneNumber}
              onPhoneChange={setPhoneNumber}
              selectedCountry={selectedCountry}
              onCountryChange={setSelectedCountry}
              placeholder="Digite seu número"
              error={error}
              theme={campaignTheme as 'claro' | 'escuro' | 'escuro-preto'}
            />
          </div>

          {/* Continue Button */}
          <button
            type="submit"
            disabled={checking}
            className={`w-full py-4 px-6 rounded-xl text-white font-bold text-lg shadow-lg transform transition-all duration-200 flex items-center justify-center gap-2 ${
              checking
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:scale-105 hover:shadow-xl active:scale-95'
            } ${getColorClassName()}`}
            style={getColorStyle()}
          >
            {checking ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Verificando...</span>
              </>
            ) : (
              <>
                <span>Continuar</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReservationStep1Modal;