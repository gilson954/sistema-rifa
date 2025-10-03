import React, { useState } from 'react';
import { X, User, Mail, Phone, Shield, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
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
          cardBg: 'bg-gray-50',
          border: 'border-gray-300',
          inputBg: 'bg-white',
          inputBorder: 'border-gray-300',
          inputText: 'text-gray-900',
          inputPlaceholder: 'placeholder-gray-500',
          labelText: 'text-gray-900',
          iconColor: 'text-gray-600',
          hoverBg: 'hover:bg-gray-100'
        };
      case 'escuro':
      case 'escuro-preto':
        return {
          background: 'bg-gray-900',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          cardBg: 'bg-gray-800',
          border: 'border-gray-600',
          inputBg: 'bg-gray-800',
          inputBorder: 'border-gray-600',
          inputText: 'text-white',
          inputPlaceholder: 'placeholder-gray-400',
          labelText: 'text-gray-100',
          iconColor: 'text-gray-400',
          hoverBg: 'hover:bg-gray-800'
        };
      default:
        return {
          background: 'bg-white',
          text: 'text-gray-900',
          textSecondary: 'text-gray-700',
          cardBg: 'bg-gray-50',
          border: 'border-gray-300',
          inputBg: 'bg-white',
          inputBorder: 'border-gray-300',
          inputText: 'text-gray-900',
          inputPlaceholder: 'placeholder-gray-500',
          labelText: 'text-gray-900',
          iconColor: 'text-gray-600',
          hoverBg: 'hover:bg-gray-100'
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

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const theme = getThemeClasses(campaignTheme);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto ${theme.background} border-2 ${theme.border}`}>
        <div className={`flex items-center justify-between p-6 border-b-2 ${theme.border}`}>
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
              style={{ backgroundColor: primaryColor || '#3B82F6' }}
            >
              <CheckCircle className="h-5 w-5" />
            </div>
            <h2 className={`text-xl font-bold ${theme.text}`}>
              Reservar Cotas
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={reserving}
            className={`p-2 rounded-full transition-colors duration-200 ${
              reserving 
                ? 'cursor-not-allowed opacity-50' 
                : `${theme.hoverBg}`
            }`}
          >
            <X className={`h-5 w-5 ${theme.iconColor}`} />
          </button>
        </div>

        <div className="px-6 pt-4">
          <p className={`text-sm ${theme.textSecondary}`}>
            Complete seus dados para continuar
          </p>
        </div>

        <div className={`m-6 p-4 ${theme.cardBg} border-2 ${theme.border} rounded-xl`}>
          <div className="text-center">
            <h3 className={`font-semibold ${theme.text} mb-2`}>
              {campaignTitle}
            </h3>
            <div className="flex items-center justify-between text-sm">
              <span className={`font-medium ${theme.textSecondary}`}>
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
              <div className={`text-xs ${theme.textSecondary} mt-2`}>
                Números: {selectedQuotas.sort((a, b) => a - b).join(', ')}
              </div>
            )}
          </div>
        </div>

        <div className={`mx-6 mb-4 p-4 border-2 rounded-xl ${
          campaignTheme === 'claro' 
            ? 'bg-orange-50 border-orange-300' 
            : 'bg-orange-900/20 border-orange-700'
        }`}>
          <div className="flex items-start space-x-3">
            <Clock className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className={`text-sm font-semibold ${theme.text} mb-1`}>
                Tempo de Reserva
              </p>
              <p className={`text-sm ${theme.textSecondary}`}>
                Suas cotas ficarão reservadas por <span className="font-bold text-orange-600">
                  {formatReservationTime(reservationTimeoutMinutes)}
                </span>. 
                Complete o pagamento via Pix para confirmar sua participação.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={`block text-sm font-semibold ${theme.labelText} mb-2`}>
              Nome completo *
            </label>
            <div className="relative">
              <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${theme.iconColor}`} />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Seu nome completo"
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg ${theme.inputBg} ${theme.inputText} ${theme.inputPlaceholder} focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-200 ${
                  errors.name ? 'border-red-500' : theme.inputBorder
                }`}
                style={{ '--tw-ring-color': primaryColor || '#3B82F6' } as React.CSSProperties}
                disabled={reserving}
                required
              />
            </div>
            {errors.name && (
              <p className="text-red-500 text-sm mt-1 font-medium">{errors.name}</p>
            )}
          </div>

          <div>
            <label className={`block text-sm font-semibold ${theme.labelText} mb-2`}>
              Email (obrigatório) *
            </label>
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${theme.iconColor}`} />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="seu@email.com"
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg ${theme.inputBg} ${theme.inputText} ${theme.inputPlaceholder} focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-200 ${
                  errors.email ? 'border-red-500' : theme.inputBorder
                }`}
                style={{ '--tw-ring-color': primaryColor || '#3B82F6' } as React.CSSProperties}
                disabled={reserving}
                required
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm mt-1 font-medium">{errors.email}</p>
            )}
          </div>

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

          <div>
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
          </div>

          <div className="space-y-4">
            <div className={`flex items-start space-x-3 p-4 rounded-lg border-2 ${theme.border} ${theme.cardBg}`}>
              <input
                type="checkbox"
                id="acceptTerms"
                checked={formData.acceptTerms}
                onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                className="w-5 h-5 text-purple-600 border-2 border-gray-400 rounded focus:ring-purple-500 focus:ring-2 mt-0.5"
                disabled={reserving}
                required
              />
              <label htmlFor="acceptTerms" className={`text-sm ${theme.textSecondary} leading-relaxed`}>
                Ao reservar nesta campanha, declaro ter lido e concordado com os{' '}
                <a href="#" className="text-blue-600 hover:underline font-medium">
                  termos de uso
                </a>{' '}
                e a{' '}
                <a href="#" className="text-blue-600 hover:underline font-medium">
                  política de privacidade
                </a>
                .
              </label>
            </div>
            {errors.acceptTerms && (
              <p className="text-red-500 text-sm font-medium">{errors.acceptTerms}</p>
            )}

            <div className={`border-2 rounded-xl p-4 ${
              campaignTheme === 'claro'
                ? 'bg-blue-50 border-blue-300'
                : 'bg-blue-900/20 border-blue-700'
            }`}>
              <div className="flex items-start space-x-2">
                <AlertTriangle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                  campaignTheme === 'claro' ? 'text-blue-600' : 'text-blue-400'
                }`} />
                <div>
                  <p className={`text-sm font-bold mb-1 ${
                    campaignTheme === 'claro' ? 'text-blue-900' : 'text-blue-100'
                  }`}>
                    Importante
                  </p>
                  <p className={`text-sm ${
                    campaignTheme === 'claro' ? 'text-blue-800' : 'text-blue-200'
                  }`}>
                    Após confirmar a reserva, você terá {formatReservationTime(reservationTimeoutMinutes)} para efetuar o pagamento. 
                    Caso contrário, suas cotas serão liberadas automaticamente.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={`${theme.cardBg} rounded-xl p-4 border-2 ${theme.border}`}>
            <div className="flex items-center justify-between">
              <span className={`font-semibold ${theme.text}`}>
                Total a pagar
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className={`font-medium ${theme.textSecondary}`}>
                {quotaCount} {quotaCount === 1 ? 'cota' : 'cotas'}
              </span>
              <span 
                className="font-bold text-2xl"
                style={{ color: primaryColor || '#3B82F6' }}
              >
                {formatCurrency(totalValue)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={reserving}
            className="w-full text-white py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: primaryColor || '#3B82F6' }}
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
            onClick={onClose}
            disabled={reserving}
            className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 border-2 ${theme.border} ${theme.text} ${theme.hoverBg} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Cancelar
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReservationModal;