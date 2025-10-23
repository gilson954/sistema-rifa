import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Copy, CheckCircle, User, Mail, Phone, Hash, QrCode, AlertTriangle, Timer, Package, DollarSign } from 'lucide-react';
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
  campaignModel?: string;
  prizeImageUrl?: string;
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
  const [copiedPix, setCopiedPix] = useState(false);
  const [organizerProfile, setOrganizerProfile] = useState<OrganizerProfile | null>(null);
  const [campaignModel, setCampaignModel] = useState<string>('manual');
  const [campaignImageUrl, setCampaignImageUrl] = useState<string>('');

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
          stepBg: 'bg-green-500',
          stepText: 'text-white'
        };
      case 'escuro':
        return {
          background: 'bg-slate-900',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          cardBg: 'bg-slate-800',
          border: 'border-slate-700',
          inputBg: 'bg-slate-700',
          stepBg: 'bg-green-500',
          stepText: 'text-white'
        };
      case 'escuro-preto':
        return {
          background: 'bg-black',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          cardBg: 'bg-gray-900',
          border: 'border-gray-800',
          inputBg: 'bg-gray-800',
          stepBg: 'bg-green-500',
          stepText: 'text-white'
        };
      default:
        return {
          background: 'bg-gray-50',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          cardBg: 'bg-white',
          border: 'border-gray-200',
          inputBg: 'bg-gray-50',
          stepBg: 'bg-green-500',
          stepText: 'text-white'
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
          .select('user_id, campaign_model, prize_image_urls')
          .eq('id', reservationData.campaignId)
          .maybeSingle();

        if (campaign) {
          setCampaignModel(campaign.campaign_model || 'manual');
          
          // Define a imagem da campanha
          if (campaign.prize_image_urls && campaign.prize_image_urls.length > 0) {
            setCampaignImageUrl(campaign.prize_image_urls[0]);
          }

          if (campaign.user_id) {
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

      const minutes = Math.floor(difference / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [reservationData?.expiresAt]);

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
          campaignId={reservationData?.campaignId}
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
        campaignId={reservationData?.campaignId}
      />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header com Timer */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className={`${themeClasses.cardBg} rounded-2xl p-6 border-2 border-yellow-500 shadow-lg`}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <CheckCircle className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className={`text-xl sm:text-2xl font-bold ${themeClasses.text}`}>
                    Aguardando Confirmação!
                  </h2>
                  <p className={`text-sm ${themeClasses.textSecondary}`}>
                    Complete o pagamento para garantir seus números
                  </p>
                </div>
              </div>
              <div className="text-center">
                <div className={`text-sm ${themeClasses.textSecondary} mb-1`}>
                  Tempo restante
                </div>
                <div className={`text-3xl sm:text-4xl font-bold ${parseInt(timeRemaining.split(':')[0]) < 5 ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-orange-600 dark:text-orange-400'}`}>
                  {timeRemaining}
                </div>
                <div className={`text-xs ${themeClasses.textSecondary}`}>
                  minutos
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 ${themeClasses.stepBg} ${themeClasses.stepText} rounded-md flex items-center justify-center font-bold flex-shrink-0`}>
                1
              </div>
              <p className={`${themeClasses.text} pt-1 font-medium`}>
                Copie o código de pagamento PIX apresentado abaixo.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 ${themeClasses.stepBg} ${themeClasses.stepText} rounded-md flex items-center justify-center font-bold flex-shrink-0`}>
                2
              </div>
              <p className={`${themeClasses.text} pt-1 font-medium`}>
                Acesse seu aplicativo bancário e escolha pagar via PIX.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 ${themeClasses.stepBg} ${themeClasses.stepText} rounded-md flex items-center justify-center font-bold flex-shrink-0`}>
                3
              </div>
              <p className={`${themeClasses.text} pt-1 font-medium`}>
                Cole o código copiado na opção "PIX Copia e Cola" e finalize o pagamento.
              </p>
            </div>
          </div>
        </motion.div>

        {/* PIX Code */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <div className={`${themeClasses.cardBg} rounded-2xl p-6 border ${themeClasses.border} shadow-lg`}>
            <div className="flex items-center justify-between mb-4">
              <input
                type="text"
                readOnly
                value={`00020126580014br.gov.bcb.pix0136${reservationData.reservationId}5204000053039865802BR5925RIFAQUI...`}
                className={`flex-1 ${themeClasses.inputBg} ${themeClasses.text} px-4 py-3 rounded-lg border ${themeClasses.border} font-mono text-sm`}
              />
              <button
                onClick={handleCopyPixKey}
                className="ml-3 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition-all duration-200 shadow-md flex items-center gap-2"
              >
                {copiedPix ? (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    <span className="hidden sm:inline">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-5 w-5" />
                    <span className="hidden sm:inline">Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Warning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8"
        >
          <div className={`${themeClasses.inputBg} rounded-xl p-4 border-l-4 border-yellow-500`}>
            <p className={`text-sm ${themeClasses.text}`}>
              <strong>Atenção:</strong> Este pagamento possui prazo limitado. Caso não seja confirmado dentro do tempo estabelecido, a reserva será cancelada e os números ficarão disponíveis novamente.
            </p>
          </div>
        </motion.div>

        {/* Detalhes da Compra */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className={`${themeClasses.cardBg} rounded-2xl p-6 border ${themeClasses.border} shadow-lg`}>
            <div className="flex items-start gap-4 mb-6">
              <img
                src={campaignImageUrl || reservationData.prizeImageUrl || 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=400'}
                alt="Campanha"
                className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className={`text-lg font-bold ${themeClasses.text} mb-1`}>
                  {reservationData.campaignTitle}
                </h3>
                <p className={`text-sm ${themeClasses.textSecondary} mb-2`}>
                  Concorra a prêmios incríveis!
                </p>
                <span className="inline-block px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                  Reservado
                </span>
              </div>
            </div>

            <div className="border-t border-b py-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-medium ${themeClasses.text}`}>
                  <Package className="inline h-4 w-4 mr-1" />
                  Informações do Pedido
                </span>
              </div>
              <div className={`text-xs ${themeClasses.textSecondary} font-mono mb-4 bg-gray-100 dark:bg-gray-800 p-2 rounded`}>
                ID: {reservationData.reservationId}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${themeClasses.textSecondary} flex items-center gap-2`}>
                    <User className="h-4 w-4" />
                    Nome
                  </span>
                  <span className={`text-sm font-medium ${themeClasses.text}`}>
                    {reservationData.customerName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${themeClasses.textSecondary} flex items-center gap-2`}>
                    <Phone className="h-4 w-4" />
                    Telefone
                  </span>
                  <span className={`text-sm font-medium ${themeClasses.text}`}>
                    {reservationData.customerPhone}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${themeClasses.textSecondary} flex items-center gap-2`}>
                    <Clock className="h-4 w-4" />
                    Realizado em
                  </span>
                  <span className={`text-sm font-medium ${themeClasses.text}`}>
                    {new Date().toLocaleString('pt-BR', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${themeClasses.textSecondary} flex items-center gap-2`}>
                    <Hash className="h-4 w-4" />
                    Quantidade
                  </span>
                  <span className={`text-sm font-medium ${themeClasses.text}`}>
                    {reservationData.quotaCount} {reservationData.quotaCount === 1 ? 'Número' : 'Números'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className={`text-sm ${themeClasses.textSecondary} flex items-center gap-2`}>
                    <DollarSign className="h-4 w-4" />
                    Valor Total
                  </span>
                  <span className={`text-lg font-bold text-green-600 dark:text-green-400`}>
                    {formatCurrency(reservationData.totalValue)}
                  </span>
                </div>
              </div>
            </div>

            {campaignModel === 'manual' && reservationData.selectedQuotas && reservationData.selectedQuotas.length > 0 && (
              <div className={`${themeClasses.inputBg} rounded-xl p-4`}>
                <p className={`text-sm font-medium ${themeClasses.text} mb-2`}>
                  ✓ Números reservados com sucesso
                </p>
                <p className={`text-xs ${themeClasses.textSecondary}`}>
                  Seus números serão liberados assim que o pagamento for confirmado.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Suporte */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-6 text-center"
        >
          <p className={`text-sm ${themeClasses.textSecondary}`}>
            Problemas com sua compra?{' '}
            <button className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
              Clique aqui
            </button>
          </p>
        </motion.div>
      </main>

      <CampaignFooter campaignTheme={campaignTheme} />
    </div>
  );
};

export default PaymentConfirmationPage;