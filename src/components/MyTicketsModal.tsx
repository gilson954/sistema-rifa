import React, { useState } from 'react';
import { X, Ticket, Search, CheckCircle, Clock, Ban, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CountryPhoneSelect from './CountryPhoneSelect';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/currency';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

interface MyTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  campaignTitle: string;
  campaignTheme: string;
  primaryColor?: string | null;
  colorMode?: string | null;
  gradientClasses?: string | null;
  customGradientColors?: string | null;
}

interface TicketData {
  ticket_number: number;
  status: 'available' | 'reserved' | 'purchased';
  customer_name?: string;
  customer_phone?: string;
  reservation_expires_at?: string;
  purchased_at?: string;
  price: number;
}

const MyTicketsModal: React.FC<MyTicketsModalProps> = ({
  isOpen,
  onClose,
  campaignId,
  campaignTitle,
  campaignTheme,
  primaryColor,
  colorMode,
  gradientClasses,
  customGradientColors,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>({
    code: 'BR',
    name: 'Brasil',
    dialCode: '+55',
    flag: '🇧🇷'
  });
  const [error, setError] = useState<string>('');
  const [searching, setSearching] = useState(false);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [customerName, setCustomerName] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setPhoneNumber('');
      setError('');
      setSearching(false);
      setTickets([]);
      setShowResults(false);
      setCustomerName('');
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

  const handleSearch = async () => {
    if (!validatePhoneNumber()) {
      return;
    }

    setSearching(true);
    setError('');

    try {
      const fullPhoneNumber = `${selectedCountry.dialCode} ${phoneNumber}`;

      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('customer_phone', fullPhoneNumber)
        .order('ticket_number', { ascending: true });

      if (ticketsError) throw ticketsError;

      if (!ticketsData || ticketsData.length === 0) {
        setError('Nenhuma cota encontrada com este número de telefone.');
        setSearching(false);
        return;
      }

      setTickets(ticketsData);
      setCustomerName(ticketsData[0].customer_name || 'Cliente');
      setShowResults(true);
    } catch (err) {
      console.error('Error searching tickets:', err);
      setError('Erro ao buscar suas cotas. Tente novamente.');
    } finally {
      setSearching(false);
    }
  };

  const handleBack = () => {
    setShowResults(false);
    setTickets([]);
    setCustomerName('');
    setPhoneNumber('');
    setError('');
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'purchased':
        return {
          label: 'Pago',
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: campaignTheme === 'claro' ? 'bg-green-50' : 'bg-green-900/20',
          borderColor: campaignTheme === 'claro' ? 'border-green-200' : 'border-green-800'
        };
      case 'reserved':
        return {
          label: 'Reservado',
          icon: Clock,
          color: 'text-orange-500',
          bgColor: campaignTheme === 'claro' ? 'bg-orange-50' : 'bg-orange-900/20',
          borderColor: campaignTheme === 'claro' ? 'border-orange-200' : 'border-orange-800'
        };
      default:
        return {
          label: 'Disponível',
          icon: Ban,
          color: 'text-gray-500',
          bgColor: campaignTheme === 'claro' ? 'bg-gray-50' : 'bg-gray-800',
          borderColor: campaignTheme === 'claro' ? 'border-gray-200' : 'border-gray-700'
        };
    }
  };


  const theme = getThemeClasses(campaignTheme);

  if (!isOpen) return null;

  const purchasedTickets = tickets.filter(t => t.status === 'purchased');
  const reservedTickets = tickets.filter(t => t.status === 'reserved');
  const totalValue = purchasedTickets.reduce((sum, t) => sum + (t.price || 0), 0);

  return (
    <div className={`fixed inset-0 ${theme.overlayBg} backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto ${theme.background} border ${theme.border} ${
          campaignTheme === 'claro' ? 'custom-scrollbar-light' : 'custom-scrollbar-dark'
        }`}
      >
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r opacity-10" style={{
            background: `linear-gradient(135deg, ${primaryColor || '#3B82F6'} 0%, ${primaryColor || '#3B82F6'}99 100%)`
          }}></div>

          <div className={`relative flex items-center justify-between p-6 border-b ${theme.border}`}>
            <div className="flex items-center space-x-4">
              {showResults && (
                <button
                  onClick={handleBack}
                  className={`p-2 rounded-xl transition-all duration-200 ${theme.hoverBg}`}
                >
                  <ArrowLeft className={`h-5 w-5 ${theme.iconColor}`} />
                </button>
              )}
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg transform hover:scale-105 transition-transform duration-200 ${getColorClassName()}`}
                style={getColorStyle()}
              >
                <Ticket className="h-6 w-6" />
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${theme.text}`}>
                  {showResults ? 'Suas Cotas' : 'Minhas Cotas'}
                </h2>
                <p className={`text-sm ${theme.textSecondary} mt-0.5`}>
                  {showResults ? campaignTitle : 'Digite seu número de celular para ver suas cotas compradas'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2.5 rounded-xl transition-all duration-200 ${theme.hoverBg} hover:scale-105`}
            >
              <X className={`h-5 w-5 ${theme.iconColor}`} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {!showResults ? (
              <motion.div
                key="search"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div>
                  <label className={`block text-sm font-semibold ${theme.text} mb-2`}>
                    Número de Telefone
                    </label>
                  <CountryPhoneSelect
                    phoneNumber={phoneNumber}
                    onPhoneChange={setPhoneNumber}
                    selectedCountry={selectedCountry}
                    onCountryChange={setSelectedCountry}
                    placeholder="Seu número de celular"
                    error={error}
                    theme={campaignTheme as 'claro' | 'escuro' | 'escuro-preto'}
                  />
                </div>

                <button
                  onClick={handleSearch}
                  disabled={searching}
                  className={`w-full py-4 px-6 rounded-xl text-white font-bold text-lg shadow-lg transform transition-all duration-200 flex items-center justify-center gap-2 ${
                    searching
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:scale-105 hover:shadow-xl active:scale-95'
                  } ${getColorClassName()}`}
                  style={getColorStyle()}
                >
                  {searching ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Buscando...</span>
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5" />
                      <span>Buscar Minhas Cotas</span>
                    </>
                  )}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-2xl border ${theme.border} ${theme.cardBg}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm ${theme.textSecondary} mb-1`}>Total de Cotas</p>
                        <p className={`text-3xl font-bold ${theme.text}`}>{tickets.length}</p>
                      </div>
                      <Ticket className={`h-10 w-10 ${theme.iconColor} opacity-50`} />
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl border border-green-200 dark:border-green-800 ${
                    campaignTheme === 'claro' ? 'bg-green-50' : 'bg-green-900/20'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-700 dark:text-green-300 mb-1">Pagas</p>
                        <p className="text-3xl font-bold text-green-600 dark:text-green-400">{purchasedTickets.length}</p>
                      </div>
                      <CheckCircle className="h-10 w-10 text-green-500 opacity-50" />
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl border border-orange-200 dark:border-orange-800 ${
                    campaignTheme === 'claro' ? 'bg-orange-50' : 'bg-orange-900/20'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-orange-700 dark:text-orange-300 mb-1">Reservadas</p>
                        <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{reservedTickets.length}</p>
                      </div>
                      <Clock className="h-10 w-10 text-orange-500 opacity-50" />
                    </div>
                  </div>
                </div>

                <div className={`p-5 rounded-2xl border ${theme.border} ${theme.cardBg}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${theme.textSecondary} mb-1`}>Cliente</p>
                      <p className={`text-lg font-bold ${theme.text}`}>{customerName}</p>
                      <p className={`text-sm ${theme.textSecondary}`}>{selectedCountry.dialCode} {phoneNumber}</p>
                    </div>
                    {purchasedTickets.length > 0 && (
                      <div className="text-right">
                        <p className={`text-sm ${theme.textSecondary} mb-1`}>Valor Total Pago</p>
                        <p className={`text-2xl font-bold ${theme.text}`}>{formatCurrency(totalValue)}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className={`text-lg font-bold ${theme.text} mb-4`}>Seus Números</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {tickets.map((ticket) => {
                      const statusInfo = getStatusInfo(ticket.status);
                      const StatusIcon = statusInfo.icon;

                      return (
                        <motion.div
                          key={ticket.ticket_number}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`p-4 rounded-xl border ${statusInfo.borderColor} ${statusInfo.bgColor} transition-all duration-200 hover:scale-105`}
                        >
                          <div className="flex flex-col items-center space-y-2">
                            <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                            <p className={`text-2xl font-bold ${theme.text}`}>
                              {ticket.ticket_number.toString().padStart(4, '0')}
                            </p>
                            <span className={`text-xs font-semibold ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default MyTicketsModal;