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

  // Reset form when modal opens/closes
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

  // Function to get theme classes
  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case 'claro':
        return {
          background: 'bg-white',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          cardBg: 'bg-gray-50',
          border: 'border-gray-200'
        };
      case 'escuro':
        return {
          background: 'bg-gray-900',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          cardBg: 'bg-gray-800',
          border: 'border-gray-700'
        };
      case 'escuro-preto':
        return {
          background: 'bg-gray-900',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          cardBg: 'bg-gray-800',
          border: 'border-gray-700'
        };
      default:
        return {
          background: 'bg-white',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          cardBg: 'bg-gray-50',
          border: 'border-gray-200'
        };
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Phone validation
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

    // Confirm phone validation
    if (!confirmPhoneNumber.trim()) {
      newErrors.confirmPhoneNumber = 'Confirmação do número é obrigatória';
    } else if (formData.phoneNumber !== confirmPhoneNumber) {
      newErrors.confirmPhoneNumber = 'O número de celular não confere. Por favor, digite o mesmo número nos dois campos.';
    }

    // Terms validation
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

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  if (!isOpen) return null;

  const themeClasses = getThemeClasses(campaignTheme);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className={`rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden ${themeClasses.background} border ${themeClasses.border} animate-in zoom-in-95 duration-300`}>
        {/* Header com gradiente */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-pink-900/20"></div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
          
          <div className="relative flex items-center justify-between p-6 border-b border-gray-200/30 dark:border-gray-700/30">
            <div className="flex items-center space-x-4">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg animate-gradient-x bg-[length:200%_200%]"
                style={{ background: `linear-gradient(135deg, ${primaryColor || '#7928CA'}, ${primaryColor || '#FF0080'})` }}
              >
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${themeClasses.text}`}>
                  Reservar Cotas
                </h2>
                <p className={`text-sm ${themeClasses.textSecondary}`}>
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
                  : `hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-110`
              }`}
            >
              <X className={`h-5 w-5 ${themeClasses.textSecondary}`} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Campaign Summary - Melhorado */}
          <div className="p-6 space-y-4">
            <div className="relative overflow-hidden rounded-2xl p-5 border border-purple-200/30 dark:border-purple-800/30 bg-gradient-to-br from-purple-50/80 to-blue-50/80 dark:from-purple-900/20 dark:to-blue-900/20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
              
              <div className="relative">
                <h3 className={`font-bold text-lg ${themeClasses.text} mb-3 line-clamp-2`}>
                  {campaignTitle}
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="px-4 py-2 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/30 dark:border-gray-700/30">
                      <span className={`text-sm font-semibold ${themeClasses.text}`}>
                        {quotaCount} {quotaCount === 1 ? 'cota' : 'cotas'}
                      </span>
                    </div>
                  </div>
                  <div 
                    className="text-3xl font-bold"
                    style={{ color: primaryColor || '#7928CA' }}
                  >
                    {formatCurrency(totalValue)}
                  </div>
                </div>
                
                {selectedQuotas && selectedQuotas.length > 0 && (
                  <div className="mt-3 p-3 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/30 dark:border-gray-700/30">
                    <p className={`text-xs font-semibold ${themeClasses.textSecondary} mb-1`}>
                      Números selecionados:
                    </p>
                    <p className={`text-sm font-bold ${themeClasses.text}`}>
                      {selectedQuotas.sort((a, b) => a - b).join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Reservation Warning - Melhorado */}
            <div className="relative overflow-hidden rounded-2xl p-4 border border-orange-200/30 dark:border-orange-800/30 bg-gradient-to-br from-orange-50/80 to-amber-50/80 dark:from-orange-900/20 dark:to-amber-900/20">
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-orange-400/20 to-amber-400/20 rounded-full blur-3xl"></div>
              
              <div className="relative flex items-start space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-bold ${themeClasses.text} mb-1`}>
                    Tempo de Reserva
                  </p>
                  <p className={`text-sm ${themeClasses.textSecondary} leading-relaxed`}>
                    Suas cotas ficarão reservadas por <span className="font-bold text-orange-600 dark:text-orange-400">{formatReservationTime(reservationTimeoutMinutes)}</span>. 
                    Complete o pagamento via Pix para confirmar.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form - Melhorado */}
          <div className="px-6 pb-6 space-y-4">
            {/* Name Field */}
            <div>
              <label className={`block text-sm font-bold ${themeClasses.text} mb-2`}>
                Nome completo *
              </label>
              <div className="relative">
                <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${themeClasses.textSecondary}`} />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Seu nome completo"
                  className={`w-full pl-10 pr-4 py-3.5 border rounded-xl ${themeClasses.background} ${themeClasses.text} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md ${
                    errors.name ? 'border-red-500 ring-2 ring-red-200' : themeClasses.border
                  }`}
                  disabled={reserving}
                  required
                />
              </div>
              {errors.name && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className={`block text-sm font-bold ${themeClasses.text} mb-2`}>
                Email (obrigatório) *
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${themeClasses.textSecondary}`} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="seu@email.com"
                  className={`w-full pl-10 pr-4 py-3.5 border rounded-xl ${themeClasses.background} ${themeClasses.text} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md ${
                    errors.email ? 'border-red-500 ring-2 ring-red-200' : themeClasses.border
                  }`}
                  disabled={reserving}
                  required
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Phone Number Field */}
            <CountryPhoneSelect
              selectedCountry={selectedCountry}
              onCountryChange={(country) => {
                setSelectedCountry(country);
                setFormData({ ...formData, countryCode: country.dialCode });
              }}
              phoneNumber={formData.phoneNumber}
              onPhoneChange={(phone) => setFormData({ ...formData, phoneNumber: phone })}
              placeholder="Número de celular"
              error={errors.phoneNumber}
            />

            {/* Confirm Phone Number Field */}
            <CountryPhoneSelect
              selectedCountry={selectedCountry}
              onCountryChange={(country) => {
                setSelectedCountry(country);
              }}
              phoneNumber={confirmPhoneNumber}
              onPhoneChange={setConfirmPhoneNumber}
              placeholder="Confirme seu número"
              error={errors.confirmPhoneNumber}
            />

            {/* Terms Acceptance - Melhorado */}
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border ${errors.acceptTerms ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'}`}>
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                    className="w-5 h-5 text-purple-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-purple-500 focus:ring-2 mt-0.5 cursor-pointer"
                    disabled={reserving}
                    required
                  />
                  <label htmlFor="acceptTerms" className={`text-sm ${themeClasses.textSecondary} leading-relaxed cursor-pointer`}>
                    Ao reservar nesta campanha, declaro ter lido e concordado com os{' '}
                    <a href="#" className="text-purple-600 dark:text-purple-400 hover:underline font-semibold">
                      termos de uso
                    </a>{' '}
                    e a{' '}
                    <a href="#" className="text-purple-600 dark:text-purple-400 hover:underline font-semibold">
                      política de privacidade
                    </a>
                    .
                  </label>
                </div>
              </div>
              {errors.acceptTerms && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.acceptTerms}
                </p>
              )}

              {/* Important Notice - Melhorado */}
              <div className="relative overflow-hidden rounded-2xl p-4 border border-blue-200/30 dark:border-blue-800/30 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-2xl"></div>
                
                <div className="relative flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-md">
                    <AlertTriangle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-900 dark:text-blue-200 font-bold mb-1">
                      Importante
                    </p>
                    <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                      Após confirmar a reserva, você terá {formatReservationTime(reservationTimeoutMinutes)} para efetuar o pagamento. 
                      Caso contrário, suas cotas serão liberadas automaticamente.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Total - Melhorado */}
            <div className="relative overflow-hidden rounded-2xl p-5 border border-purple-200/30 dark:border-purple-800/30 bg-gradient-to-br from-purple-50/80 to-blue-50/80 dark:from-purple-900/20 dark:to-blue-900/20">
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
              
              <div className="relative flex items-center justify-between">
                <div>
                  <p className={`text-sm ${themeClasses.textSecondary} mb-1`}>
                    Total a pagar
                  </p>
                  <p className={`text-lg font-bold ${themeClasses.text}`}>
                    {quotaCount} {quotaCount === 1 ? 'cota' : 'cotas'}
                  </p>
                </div>
                <div 
                  className="text-4xl font-bold"
                  style={{ color: primaryColor || '#7928CA' }}
                >
                  {formatCurrency(totalValue)}
                </div>
              </div>
            </div>

            {/* Submit Button - Melhorado */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={reserving}
              className="w-full text-white py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transform hover:-translate-y-0.5 hover:shadow-2xl animate-gradient-x bg-[length:200%_200%]"
              style={{ 
                background: reserving 
                  ? '#9CA3AF' 
                  : `linear-gradient(135deg, ${primaryColor || '#7928CA'}, ${primaryColor || '#FF0080'}, ${primaryColor || '#007CF0'})`
              }}
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

            {/* Cancel Button - Melhorado */}
            <button
              type="button"
              onClick={handleClose}
              disabled={reserving}
              className={`w-full py-3.5 rounded-xl font-semibold transition-all duration-200 border ${themeClasses.border} ${themeClasses.text} hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md`}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationModal;