import React, { useState } from 'react';
import { X, User, CheckCircle, Sparkles, Phone } from 'lucide-react';
import { CustomerData } from '../utils/customerCheck';

interface ReservationStep2ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
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
  confirming = false
}) => {
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string>('');

  React.useEffect(() => {
    if (isOpen) {
      setAcceptTerms(false);
      setError('');
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

  const handleConfirm = () => {
    if (!acceptTerms) {
      setError('Você deve aceitar os termos de uso');
      return;
    }

    setError('');
    onConfirm();
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
                  Confirme seus dados
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={confirming}
              className={`p-2.5 rounded-xl transition-all duration-200 ${
                confirming
                  ? 'cursor-not-allowed opacity-50'
                  : `${theme.hoverBg} hover:scale-105`
              }`}
            >
              <X className={`h-5 w-5 ${theme.iconColor}`} />
            </button>
          </div>
        </div>

        {/* Card de resumo - ÍCONE VERDE E VALOR COM COR DO TEMA */}
        <div className="px-6 pt-6">
          <div className={`p-5 ${theme.cardBg} border ${theme.border} rounded-2xl shadow-sm`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
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

        {/* Customer Info Card */}
        <div className="px-6 pt-6">
          <div className={`p-5 ${theme.cardBg} border ${theme.border} rounded-2xl shadow-sm`}>
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className={`w-16 h-16 rounded-full ${theme.userBg} flex items-center justify-center`}>
                <User className={`h-8 w-8 ${theme.iconColor}`} />
              </div>

              {/* Customer Data */}
              <div className="flex-1">
                <h3 className={`text-lg font-bold ${theme.text}`}>
                  {customerData.customer_name}
                </h3>
                <div className={`flex items-center gap-2 mt-1 text-sm ${theme.textSecondary}`}>
                  <Phone className="h-3.5 w-3.5" />
                  <span>{customerData.customer_phone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Terms and Confirm */}
        <div className="p-6 space-y-4">
          {/* Terms Checkbox */}
          <div className={`p-4 rounded-xl border ${theme.border} ${theme.cardBg}`}>
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => {
                    setAcceptTerms(e.target.checked);
                    setError('');
                  }}
                  className="peer sr-only"
                />
                <div
                  className={`w-5 h-5 rounded border-2 transition-all duration-200 ${
                    acceptTerms
                      ? 'border-transparent'
                      : `${theme.inputBorder} group-hover:border-gray-400`
                  }`}
                  style={acceptTerms ? getColorStyle() : {}}
                >
                  {acceptTerms && (
                    <CheckCircle className="w-5 h-5 text-white -mt-0.5 -ml-0.5" />
                  )}
                </div>
              </div>
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
            {error && (
              <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>
            )}
          </div>

          {/* Confirm Button */}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirming}
            className={`w-full py-4 px-6 rounded-xl text-white font-bold text-lg shadow-lg transform transition-all duration-200 flex items-center justify-center gap-2 ${
              confirming
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:scale-105 hover:shadow-xl active:scale-95'
            } ${getColorClassName()}`}
            style={getColorStyle()}
          >
            {confirming ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Processando...</span>
              </>
            ) : (
              <>
                <span>Concluir reserva</span>
                <CheckCircle className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReservationStep2Modal;