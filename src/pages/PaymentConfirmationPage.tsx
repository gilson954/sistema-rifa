import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Copy, CheckCircle, User, Mail, Phone, Hash, QrCode, AlertTriangle, Timer, Hourglass, Package } from 'lucide-react';
import CampaignHeader from '../components/CampaignHeader';
import CampaignFooter from '../components/CampaignFooter';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface ReservationData {
  reservationId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  quotaCount: number;
  totalValue: number;
  selectedQuotas?: number[];
  campaignTitle: string;
  campaignId: string;
  campaignPublicId?: string;
  expiresAt: string;
  reservationTimeoutMinutes?: number;
}

interface OrganizerProfile {
  id: string;
  name: string;
  logo_url?: string;
  primary_color?: string;
  theme?: string;
  color_mode?: string;
  gradient_classes?: string;
  custom_gradient_colors?: string;
}

const PaymentConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signInWithPhone, isPhoneAuthenticated } = useAuth();

  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [organizerProfile, setOrganizerProfile] = useState<OrganizerProfile | null>(null);

  const reservationData = location.state?.reservationData as ReservationData;

  const campaignTheme = organizerProfile?.theme || 'claro';

  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case 'claro':
        return {
          background: 'bg-gray-50',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          cardBg: 'bg-white',
          border: 'border-gray-200',
          inputBg: 'bg-gray-50',
          hover: 'hover:bg-gray-100'
        };
      case 'escuro':
        return {
          background: 'bg-slate-900',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          cardBg: 'bg-slate-800',
          border: 'border-slate-700',
          inputBg: 'bg-slate-700',
          hover: 'hover:bg-slate-700'
        };
      case 'escuro-preto':
        return {
          background: 'bg-black',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          cardBg: 'bg-gray-900',
          border: 'border-gray-800',
          inputBg: 'bg-gray-800',
          hover: 'hover:bg-gray-800'
        };
      default:
        return {
          background: 'bg-gray-50',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          cardBg: 'bg-white',
          border: 'border-gray-200',
          inputBg: 'bg-gray-50',
          hover: 'hover:bg-gray-100'
        };
    }
  };

  const themeClasses = getThemeClasses(campaignTheme);

  useEffect(() => {
    if (!reservationData) {
      navigate('/');
      return;
    }

    if (reservationData.customerPhone && !isPhoneAuthenticated) {
      signInWithPhone(reservationData.customerPhone);
    }
  }, [reservationData, navigate, signInWithPhone, isPhoneAuthenticated]);

  useEffect(() => {
    const loadOrganizerProfile = async () => {
      if (reservationData?.campaignId) {
        const { data: campaign } = await supabase
          .from('campaigns')
          .select('user_id')
          .eq('id', reservationData.campaignId)
          .maybeSingle();

        if (campaign?.user_id) {
          const { data: profile } = await supabase
            .from('public_profiles_view')
            .select('id, name, logo_url, primary_color, theme, color_mode, gradient_classes, custom_gradient_colors')
            .eq('id', campaign.user_id)
            .maybeSingle();

          if (profile) {
            setOrganizerProfile(profile);
          }
        }
      }
    };

    loadOrganizerProfile();
  }, [reservationData]);

  useEffect(() => {
    if (!reservationData?.expiresAt) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiration = new Date(reservationData.expiresAt).getTime();
      const difference = expiration - now;

      if (difference <= 0) {
        setTimeRemaining('00:00');
        setIsExpired(true);
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeRemaining(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [reservationData?.expiresAt]);

  const handleCopyReservationId = async () => {
    if (reservationData?.reservationId) {
      try {
        await navigator.clipboard.writeText(reservationData.reservationId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  const handleCopyPixKey = async () => {
    const pixKey = `00020126580014br.gov.bcb.pix0136${reservationData?.reservationId || 'mock-key'}5204000053039865802BR5925RIFAQUI PAGAMENTOS LTDA6009SAO PAULO62070503***6304ABCD`;
    try {
      await navigator.clipboard.writeText(pixKey);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2000);
    } catch (error) {
      console.error('Failed to copy PIX key:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (!reservationData) {
    return (
      <div className={`min-h-screen ${themeClasses.background} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className={`min-h-screen ${themeClasses.background} transition-colors duration-300 flex flex-col`}>
        <CampaignHeader
          logoUrl={organizerProfile?.logo_url}
          organizerName={organizerProfile?.name}
          organizerId={organizerProfile?.id}
          primaryColor={organizerProfile?.primary_color}
          colorMode={organizerProfile?.color_mode}
          gradientClasses={organizerProfile?.gradient_classes}
          customGradientColors={organizerProfile?.custom_gradient_colors}
          campaignTheme={campaignTheme}
          hideMyTicketsButton={false}
        />

        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${themeClasses.cardBg} rounded-2xl shadow-2xl p-12 text-center border ${themeClasses.border} max-w-md`}
          >
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Timer className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <h2 className={`text-2xl font-bold ${themeClasses.text} mb-3`}>
              Pagamento Expirado
            </h2>
            <p className={`${themeClasses.textSecondary} mb-6`}>
              Seu pagamento foi expirado. Caso o pagamento não seja confirmado, os títulos voltam a ficar disponíveis.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/c/${reservationData.campaignPublicId || reservationData.campaignId}`)}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-xl font-bold transition-all duration-200 shadow-lg"
              >
                Voltar para Campanha
              </button>
              <button
                onClick={() => navigate('/')}
                className={`w-full ${themeClasses.inputBg} ${themeClasses.hover} ${themeClasses.text} py-3 rounded-xl font-bold transition-all duration-200`}
              >
                Ir para Home
              </button>
            </div>
          </motion.div>
        </div>

        <CampaignFooter campaignTheme={campaignTheme} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses.background} transition-colors duration-300 flex flex-col`}>
      <CampaignHeader
        logoUrl={organizerProfile?.logo_url}
        organizerName={organizerProfile?.name}
        organizerId={organizerProfile?.id}
        primaryColor={organizerProfile?.primary_color}
        colorMode={organizerProfile?.color_mode}
        gradientClasses={organizerProfile?.gradient_classes}
        customGradientColors={organizerProfile?.custom_gradient_colors}
        campaignTheme={campaignTheme}
        hideMyTicketsButton={false}
      />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div className={`${themeClasses.cardBg} rounded-2xl p-6 border ${themeClasses.border} shadow-lg`}>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <Hourglass className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className={`text-2xl font-bold ${themeClasses.text} mb-1`}>
                  Aguardando Pagamento!
                </h2>
                <p className={themeClasses.textSecondary}>
                  Realize o pagamento
                </p>
              </div>
              <div className="text-right">
                <div className={`text-sm ${themeClasses.textSecondary} mb-1`}>
                  Você tem
                </div>
                <div className={`text-3xl font-bold ${timeRemaining.startsWith('0:') && parseInt(timeRemaining.split(':')[1]) < 5 ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-orange-600 dark:text-orange-400'}`}>
                  {timeRemaining}
                </div>
                <div className={`text-xs ${themeClasses.textSecondary}`}>
                  para pagar
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-6"
          >
            <div className={`${themeClasses.cardBg} rounded-2xl shadow-xl p-6 border ${themeClasses.border}`}>
              <h3 className={`text-xl font-bold ${themeClasses.text} mb-4 flex items-center space-x-2`}>
                <Package className="h-6 w-6 text-purple-600" />
                <span>{reservationData.campaignTitle}</span>
              </h3>

              <div className={`${themeClasses.inputBg} rounded-xl p-4 mb-6 border ${themeClasses.border}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${themeClasses.textSecondary}`}>Pacote Promocional</span>
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    R$0,05
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={themeClasses.textSecondary}>Títulos: {String(reservationData.quotaCount).padStart(3, '0')}</span>
                </div>
              </div>

              <div className={`${themeClasses.inputBg} rounded-xl p-4 mb-4`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${themeClasses.textSecondary}`}>Código de Identificação</span>
                  <button
                    onClick={handleCopyReservationId}
                    className={`p-1.5 ${themeClasses.hover} rounded-lg transition-colors`}
                    title="Copiar código"
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className={`h-4 w-4 ${themeClasses.textSecondary}`} />
                    )}
                  </button>
                </div>
                <div className={`font-mono text-xs ${themeClasses.text} break-all`}>
                  {reservationData.reservationId}
                </div>
              </div>

              <div className="space-y-3">
                <div className={`flex items-center space-x-3 p-3 ${themeClasses.inputBg} rounded-lg`}>
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <div className={`text-xs ${themeClasses.textSecondary}`}>Comprador</div>
                    <div className={`font-medium ${themeClasses.text}`}>{reservationData.customerName}</div>
                  </div>
                </div>

                <div className={`flex items-center space-x-3 p-3 ${themeClasses.inputBg} rounded-lg`}>
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className={`text-xs ${themeClasses.textSecondary}`}>Telefone</div>
                    <div className={`font-medium ${themeClasses.text}`}>{reservationData.customerPhone}</div>
                  </div>
                </div>

                <div className={`flex items-center space-x-3 p-3 ${themeClasses.inputBg} rounded-lg`}>
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className={`text-xs ${themeClasses.textSecondary}`}>Email</div>
                    <div className={`font-medium ${themeClasses.text} truncate`}>{reservationData.customerEmail}</div>
                  </div>
                </div>

                <div className={`flex items-center space-x-3 p-3 ${themeClasses.inputBg} rounded-lg`}>
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <Hash className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <div className={`text-xs ${themeClasses.textSecondary}`}>Quantidade</div>
                    <div className={`font-medium ${themeClasses.text}`}>{reservationData.quotaCount}</div>
                  </div>
                </div>

                <div className={`flex items-center space-x-3 p-3 ${themeClasses.inputBg} rounded-lg`}>
                  <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <div className={`text-xs ${themeClasses.textSecondary}`}>Data/horário</div>
                    <div className={`font-medium ${themeClasses.text} text-sm`}>
                      {new Date().toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>

                <div className={`flex items-center space-x-3 p-3 ${themeClasses.inputBg} rounded-lg`}>
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                    <Timer className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <div className={`text-xs ${themeClasses.textSecondary}`}>Expira em</div>
                    <div className={`font-medium ${themeClasses.text} text-sm`}>
                      {new Date(reservationData.expiresAt).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              </div>

              {reservationData.selectedQuotas && reservationData.selectedQuotas.length > 0 && (
                <div className={`mt-4 ${themeClasses.inputBg} rounded-xl p-4 border ${themeClasses.border}`}>
                  <div className={`text-sm font-medium ${themeClasses.text} mb-2`}>
                    Títulos:
                  </div>
                  <div 
                    className={`font-mono text-sm ${themeClasses.text} font-semibold max-h-48 overflow-y-auto pr-2`}
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: campaignTheme === 'claro' 
                        ? '#9333ea #e5e7eb' 
                        : campaignTheme === 'escuro'
                        ? '#a855f7 #334155'
                        : '#a855f7 #1f2937'
                    }}
                  >
                    {reservationData.selectedQuotas.sort((a, b) => a - b).join(', ')}
                  </div>
                </div>
              )}

              <div className={`mt-6 ${themeClasses.inputBg} rounded-xl p-4`}>
                <div className="flex items-center justify-between text-lg font-bold">
                  <span className={themeClasses.text}>Total</span>
                  <span className="text-green-600 dark:text-green-400">
                    {formatCurrency(reservationData.totalValue)}
                  </span>
                </div>
              </div>
            </div>

            <div className={`${themeClasses.cardBg} rounded-2xl p-6 border ${themeClasses.border} shadow-lg`}>
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-1" />
                <div className={`text-sm ${themeClasses.textSecondary}`}>
                  <p className="font-semibold mb-2">Este pagamento só pode ser realizado dentro do tempo. Após este período, caso o pagamento não seja confirmado, os títulos voltam a ficar disponíveis.</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            <div className={`${themeClasses.cardBg} rounded-2xl shadow-xl p-6 border ${themeClasses.border}`}>
              <h3 className={`text-xl font-bold ${themeClasses.text} mb-6`}>
                Como Pagar
              </h3>

              <div className="space-y-4 mb-6">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 dark:text-purple-400 font-bold">1</span>
                  </div>
                  <p className={`${themeClasses.textSecondary} pt-1`}>
                    Copie o código PIX abaixo
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 dark:text-purple-400 font-bold">2</span>
                  </div>
                  <p className={`${themeClasses.textSecondary} pt-1`}>
                    Abra o app do seu banco e escolha a opção PIX, como se fosse fazer uma transferência.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 dark:text-purple-400 font-bold">3</span>
                  </div>
                  <p className={`${themeClasses.textSecondary} pt-1`}>
                    Selecione a opção PIX copia e cola, cole a chave copiada e confirme o pagamento.
                  </p>
                </div>
              </div>

              <div className={`${themeClasses.inputBg} rounded-xl p-4 mb-4`}>
                <div className={`w-full aspect-square ${themeClasses.cardBg} border-4 ${themeClasses.border} rounded-xl flex items-center justify-center mb-4`}>
                  <QrCode className={`h-32 w-32 ${themeClasses.textSecondary}`} />
                </div>
                <p className={`text-center text-sm ${themeClasses.textSecondary} mb-1`}>
                  Mostrar QR Code
                </p>
              </div>

              <div className={`${themeClasses.inputBg} rounded-xl p-4 mb-6`}>
                <div className="flex items-start justify-between space-x-3">
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                      Chave PIX (Copia e Cola)
                    </div>
                    <div className={`font-mono text-xs ${themeClasses.text} ${themeClasses.cardBg} p-3 rounded-lg border ${themeClasses.border} break-all`}>
                      00020126580014br.gov.bcb.pix0136{reservationData.reservationId}5204000053039865802BR5925RIFAQUI PAGAMENTOS LTDA6009SAO PAULO62070503***6304ABCD
                    </div>
                  </div>
                  <button
                    onClick={handleCopyPixKey}
                    className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex-shrink-0 shadow-md"
                    title="Copiar"
                  >
                    {copiedPix ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className={`${themeClasses.inputBg} rounded-xl p-4 text-center`}>
              <p className={`text-sm ${themeClasses.textSecondary}`}>
                Problemas com sua compra?{' '}
                <button className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  Clique aqui
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      <CampaignFooter campaignTheme={campaignTheme} />
    </div>
  );
};

export default PaymentConfirmationPage;