import React, { useState } from 'react';
import { X, User, Mail, Phone, Shield, CheckCircle, Clock, AlertTriangle, Sparkles } from 'lucide-react';
import CountryPhoneSelect from './CountryPhoneSelect';
import { formatReservationTime } from '../utils/timeFormatters';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReserve: (customerData: CustomerData) => void;
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
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const customerData: CustomerData = {
      ...formData,
      countryCode: selectedCountry.dialCode,
      phoneNumber: formData.phoneNumber
    };

    onReserve(customerData);
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

  // Função auxiliar para obter o gradiente CSS real a partir das classes Tailwind
  const getGradientCssValue = (gradientClasses: string | null | undefined, customColorsJson: string | null | undefined): string | null => {
    if (gradientClasses === 'custom' && customColorsJson) {
      try {
        const colors = JSON.parse(customColorsJson);
        if (Array.isArray(colors) && colors.length >= 2) {
          return `linear-gradient(135deg, ${colors.join(', ')})`;
        }
      } catch (e) {
        console.error('Error parsing custom gradient colors:', e);
      }
    } else if (gradientClasses) {
      // Mapeamento de classes Tailwind para valores CSS de gradiente
      switch (gradientClasses) {
        case 'from-purple-600 via-blue-500 to-indigo-600':
          return 'linear-gradient(135deg, #9333ea, #3b82f6, #4f46e5)';
        case 'from-pink-500 via-red-500 to-yellow-500':
          return 'linear-gradient(135deg, #ec4899, #ef4444, #eab308)';
        case 'from-green-400 via-blue-500 to-purple-600':
          return 'linear-gradient(135deg, #4ade80, #3b82f6, #9333ea)';
        case 'from-yellow-400 via-red-500 to-pink-500':
          return 'linear-gradient(135deg, #facc15, #ef4444, #ec4899)';
        case 'from-indigo-500 via-purple-500 to-pink-500':
          return 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)';
        case 'from-blue-400 via-teal-500 to-green-500':
          return 'linear-gradient(135deg, #60a5fa, #14b8a6, #22c55e)';
        case 'from-red-500 via-orange-500 to-yellow-500':
          return 'linear-gradient(135deg, #ef4444, #f97316, #eab308)';
        case 'from-cyan-400 via-blue-500 to-indigo-600':
          return 'linear-gradient(135deg, #22d3ee, #3b82f6, #4f46e5)';
        case 'from-[#7928CA] via-[#FF0080] via-[#007CF0] to-[#FF8C00]':
          return 'linear-gradient(135deg, #7928CA, #FF0080, #007CF0, #FF8C00)';
        // Adicione mais casos para outros gradientes predefinidos que você usa
        default:
          return null;
      }
    }
    return null;
  };

  const getColorStyle = () => {
    if (colorMode === 'gradient') {
      const gradientValue = getGradientCssValue(gradientClasses, customGradientColors);
      if (gradientValue) {
        return {
          background: gradientValue,
          backgroundSize: '200% 200%'
        };
      }
    }
    // Fallback para cor sólida ou padrão se não for gradiente ou gradiente inválido
    return primaryColor ? { backgroundColor: primaryColor } : { backgroundColor: '#3B82F6' };
  };

  const getColorClassName = () => {
    if (colorMode === 'gradient') {
      if (gradientClasses) {
        return `animate-gradient-x bg-[length:200%_200%]`;
      }
    }
    return '';
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const theme = getThemeClasses(campaignTheme);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 ${theme.overlayBg} backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300`}>
      <div className={`rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto ${theme.background} border ${theme.border} transform transition-all duration-300 animate-in slide-in-from-bottom-4`}>
        
        {/* Header com gradiente e efeito moderno */}
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
                  Crie sua conta
                </h2>
                <p className={`text-sm ${theme.textSecondary} mt-0.5`}>
                  Complete seus dados para continuar
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={reserving}
              className={`p-2.5 rounded-xl transition-all duration-200 ${
                reserving 
                  ? 'cursor-not-allowed opacity-50' 
                  : `${theme.hoverBg} hover:scale-105`
              }`}
            >
              <X className={`h-5 w-5 ${theme.iconColor}`} />
            </button>
          </div>
        </div>

        {/* Card de resumo da campanha - ÍCONE VERDE E VALOR COM COR DO TEMA */}
        <div className="px-6 pt-6">
          <div className={`p-5 ${theme.cardBg} border ${theme.border} rounded-2xl shadow-sm`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className={`font-bold text-lg ${theme.text} mb-3`}>
                  {campaignTitle}
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200/30 dark:border-gray-700/30">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className={`text-sm font-semibold ${theme.text}`}>
                      {quotaCount} {quotaCount === 1 ? 'cota' : 'cotas'}
                    </span>
                  </div>
                  <div className={`px-4 py-1.5 rounded-lg font-bold text-lg shadow-sm ${theme.text}`}>
                    {formatCurrency(totalValue)}
                  </div>
                </div>
                {selectedQuotas && selectedQuotas.length > 0 && (
                  <div className={`text-xs ${theme.textSecondary} mt-3 p-2 rounded-lg bg-white/30 dark:bg-gray-800/30`}>
                    <span className="font-semibold">Números selecionados:</span> {selectedQuotas.sort((a, b) => a - b).join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Aviso de tempo de reserva - Melhorado */}
        <div className="px-6 pt-4">
          <div className={`relative overflow-hidden p-4 border-2 rounded-2xl ${
            campaignTheme === 'claro' 
              ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-300/50' 
              : 'bg-gradient-to-br from-orange-900/20 to-amber-900/20 border-orange-700/50'
          }`}>
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-orange-500/10">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
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
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Campo Nome */}
          <div>
            <label className={`block text-sm font-bold ${theme.labelText} mb-2`}>
              Nome completo <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className={`absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 ${theme.iconColor}`} />
              <input
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
              />
            </div>
            {errors.name && (
              <p className="text-red-500 text-sm mt-2 font-medium flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Campo Email */}
          <div>
            <label className={`block text-sm font-bold ${theme.labelText} mb-2`}>
              E-mail (Obrigatório) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className={`absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 ${theme.iconColor}`} />
              <input
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
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm mt-2 font-medium flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Campo Telefone */}
          <div>
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
          </div>

          {/* Campo Confirmar Telefone */}
          <div>
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
          </div>

          {/* Termos e Avisos */}
          <div className="space-y-4">
            
            {/* Checkbox de Termos */}
            <div className={`flex items-start space-x-3 p-4 rounded-xl border-2 ${theme.border} ${theme.cardBg}`}>
              <input
                type="checkbox"
                id="acceptTerms"
                checked={formData.acceptTerms}
                onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                className="w-5 h-5 rounded-lg border-2 border-gray-400 focus:ring-2 mt-0.5 cursor-pointer"
                style={{ 
                  accentColor: primaryColor || '#3B82F6',
                  '--tw-ring-color': `${primaryColor || '#3B82F6'}33`
                } as React.CSSProperties}
                disabled={reserving}
                required
              />
              <label htmlFor="acceptTerms" className={`text-sm ${theme.textSecondary} leading-relaxed cursor-pointer`}>
                Ao reservar, declaro ter lido e concordado com os{' '}
                <a href="#" className="font-semibold hover:underline" style={{ color: primaryColor || '#3B82F6' }}>
                  termos de uso
                </a>{' '}
                e a{' '}
                <a href="#" className="font-semibold hover:underline" style={{ color: primaryColor || '#3B82F6' }}>
                  política de privacidade
                </a>
                .
              </label>
            </div>
            {errors.acceptTerms && (
              <p className="text-red-500 text-sm font-medium flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                {errors.acceptTerms}
              </p>
            )}

            {/* Aviso Importante */}
            <div className={`relative overflow-hidden border-2 rounded-2xl p-4 ${
              campaignTheme === 'claro'
                ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300/50'
                : 'bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border-blue-700/50'
            }`}>
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-xl bg-blue-500/10">
                  <AlertTriangle className={`h-5 w-5 ${
                    campaignTheme === 'claro' ? 'text-blue-600' : 'text-blue-400'
                  }`} />
                </div>
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
            </div>
          </div>

          {/* Card Total a Pagar - VALOR COM COR DO TEMA */}
          <div className={`${theme.cardBg} rounded-2xl p-5 border-2 ${theme.border} shadow-sm`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`font-bold text-lg ${theme.text}`}>
                Total a pagar
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`font-medium ${theme.textSecondary}`}>
                {quotaCount} {quotaCount === 1 ? 'cota' : 'cotas'}
              </span>
              <span className={`font-bold text-3xl ${theme.text}`}>
                {formatCurrency(totalValue)}
              </span>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="space-y-3 pt-2">
            <button
              type="submit"
              disabled={reserving}
              className={`w-full text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transform hover:scale-[1.02] active:scale-[0.98] ${!reserving ? getColorClassName() : ''}`}
              style={reserving ? { backgroundColor: '#9CA3AF' } : getColorStyle()}
            >
              {reserving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processando reserva...</span>
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5" />
                  <span>Concluir reserva</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleClose}
              disabled={reserving}
              className={`w-full py-3.5 rounded-xl font-semibold transition-all duration-300 border-2 ${theme.border} ${theme.text} ${theme.hoverBg} disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]`}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReservationModal;