import React, { useState } from 'react';
import { X, User, Mail, Phone, Shield, CheckCircle } from 'lucide-react';
import CountryPhoneSelect from './CountryPhoneSelect';

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
  reserving = false
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
      newErrors.confirmPhoneNumber = 'Os números de celular não coincidem';
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto ${getThemeClasses(campaignTheme).background} ${getThemeClasses(campaignTheme).border} border`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: primaryColor || '#3B82F6' }}
            >
              <CheckCircle className="h-5 w-5" />
            </div>
            <h2 className={`text-xl font-bold ${getThemeClasses(campaignTheme).text}`}>
              Reservar
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={reserving}
            className={`p-2 rounded-full transition-colors duration-200 ${
              reserving 
                ? 'cursor-not-allowed opacity-50' 
                : `hover:${getThemeClasses(campaignTheme).cardBg}`
            }`}
          >
            <X className={`h-5 w-5 ${getThemeClasses(campaignTheme).textSecondary}`} />
          </button>
        </div>

        {/* Campaign Summary */}
        <div className={`p-4 ${getThemeClasses(campaignTheme).cardBg} border-b ${getThemeClasses(campaignTheme).border}`}>
          <div className="text-center">
            <h3 className={`font-semibold ${getThemeClasses(campaignTheme).text} mb-2`}>
              {campaignTitle}
            </h3>
            <div className="flex items-center justify-between text-sm">
              <span className={getThemeClasses(campaignTheme).textSecondary}>
                {quotaCount} {quotaCount === 1 ? 'cota' : 'cotas'}
              </span>
              <span 
                className="font-bold text-lg"
                style={{ color: primaryColor || '#3B82F6' }}
              >
                {formatCurrency(totalValue)}
              </span>
            </div>
            {selectedQuotas && selectedQuotas.length > 0 && (
              <div className={`text-xs ${getThemeClasses(campaignTheme).textSecondary} mt-2`}>
                Números: {selectedQuotas.sort((a, b) => a - b).join(', ')}
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name Field */}
          <div>
            <label className={`block text-sm font-medium ${getThemeClasses(campaignTheme).text} mb-2`}>
              Nome completo *
            </label>
            <div className="relative">
              <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${getThemeClasses(campaignTheme).textSecondary}`} />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Seu nome completo"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg ${getThemeClasses(campaignTheme).background} ${getThemeClasses(campaignTheme).text} placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-200 ${
                  errors.name ? 'border-red-500' : getThemeClasses(campaignTheme).border
                }`}
                style={{ '--tw-ring-color': primaryColor || '#3B82F6' } as React.CSSProperties}
                disabled={reserving}
                required
              />
            </div>
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label className={`block text-sm font-medium ${getThemeClasses(campaignTheme).text} mb-2`}>
              Email *
            </label>
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${getThemeClasses(campaignTheme).textSecondary}`} />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="seu@email.com"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg ${getThemeClasses(campaignTheme).background} ${getThemeClasses(campaignTheme).text} placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-200 ${
                  errors.email ? 'border-red-500' : getThemeClasses(campaignTheme).border
                }`}
                style={{ '--tw-ring-color': primaryColor || '#3B82F6' } as React.CSSProperties}
                disabled={reserving}
                required
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Phone Number Field */}
          <div>
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
          </div>

          {/* Confirm Phone Number Field */}
          <div>
            <label className={`block text-sm font-medium ${getThemeClasses(campaignTheme).text} mb-2`}>
              Repita o número de celular *
            </label>
            <div className="relative">
              <Phone className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${getThemeClasses(campaignTheme).textSecondary}`} />
              <input
                type="tel"
                value={confirmPhoneNumber}
                onChange={(e) => setConfirmPhoneNumber(e.target.value)}
                placeholder="Confirme seu número"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg ${getThemeClasses(campaignTheme).background} ${getThemeClasses(campaignTheme).text} placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-200 ${
                  errors.confirmPhoneNumber ? 'border-red-500' : getThemeClasses(campaignTheme).border
                }`}
                style={{ '--tw-ring-color': primaryColor || '#3B82F6' } as React.CSSProperties}
                disabled={reserving}
                required
              />
            </div>
            {errors.confirmPhoneNumber && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPhoneNumber}</p>
            )}
          </div>

          {/* Terms Acceptance */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="acceptTerms"
                checked={formData.acceptTerms}
                onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                className="w-4 h-4 text-purple-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 focus:ring-2 mt-1"
                disabled={reserving}
                required
              />
              <label htmlFor="acceptTerms" className={`text-sm ${getThemeClasses(campaignTheme).textSecondary} leading-relaxed`}>
                Ao reservar nesta campanha, declaro ter lido e concordado com os{' '}
                <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
                  termos de uso
                </a>{' '}
                e a{' '}
                <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
                  política de privacidade
                </a>
                .
              </label>
            </div>
            {errors.acceptTerms && (
              <p className="text-red-500 text-sm">{errors.acceptTerms}</p>
            )}
          </div>

          {/* Summary */}
          <div className={`${getThemeClasses(campaignTheme).cardBg} rounded-lg p-4 border ${getThemeClasses(campaignTheme).border}`}>
            <div className="flex items-center justify-between">
              <span className={`font-medium ${getThemeClasses(campaignTheme).text}`}>
                {quotaCount} {quotaCount === 1 ? 'cota' : 'cotas'}
              </span>
              <span 
                className="font-bold text-xl"
                style={{ color: primaryColor || '#3B82F6' }}
              >
                {formatCurrency(totalValue)}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={reserving}
            className="w-full text-white py-4 rounded-lg font-bold text-lg transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            style={{ backgroundColor: primaryColor || '#3B82F6' }}
          >
            {reserving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Reservando...</span>
              </>
            ) : (
              <>
                <Shield className="h-5 w-5" />
                <span>Reservar ({formatCurrency(totalValue)})</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReservationModal;