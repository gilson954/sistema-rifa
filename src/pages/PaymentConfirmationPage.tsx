import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Copy, CheckCircle, User, Mail, Phone, Hash, QrCode, AlertTriangle, Timer, Package, DollarSign } from 'lucide-react';
import CampaignHeader from '../components/CampaignHeader';
import CampaignFooter from '../components/CampaignFooter';
import SocialMediaFloatingMenu from '../components/SocialMediaFloatingMenu';
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
  social_media_links?: any;
}

interface Campaign {
  total_tickets: number;
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
  const [campaign, setCampaign] = useState<Campaign | null>(null);

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
          idBoxBg: 'bg-gray-100',
          idBoxText: 'text-gray-700',
          stepBg: 'bg-green-500',
          stepText: 'text-white'
        };
      case 'escuro':
        return {
          background: 'bg-slate-900',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          cardBg: 'bg-slate-800',
          border: 'border-[#101625]',
          inputBg: 'bg-slate-700',
          idBoxBg: 'bg-slate-700',
          idBoxText: 'text-gray-200',
          stepBg: 'bg-green-500',
          stepText: 'text-white'
        };
      case 'escuro-preto':
        return {
          background: 'bg-black',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          cardBg: 'bg-gray-900',
          border: 'border-gray-700',
          inputBg: 'bg-gray-800',
          idBoxBg: 'bg-gray-800',
          idBoxText: 'text-gray-200',
          stepBg: 'bg-green-500',
          stepText: 'text-white'
        };
    case 'escuro-cinza':
      return {
        background: 'bg-[#1A1A1A]',
        text: 'text-white',
        textSecondary: 'text-gray-400',
        cardBg: 'bg-[#2C2C2C]',
        border: 'border-[#1f1f1f]',
        inputBg: 'bg-[#2C2C2C]',
        idBoxBg: 'bg-[#3C3C3C]',
        idBoxText: 'text-gray-200',
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
          idBoxBg: 'bg-gray-100',
          idBoxText: 'text-gray-700',
          stepBg: 'bg-green-500',
          stepText: 'text-white'
        };
    }
  };

  const themeClasses = getThemeClasses(campaignTheme);

  const getCustomGradientStyle = (customColorsJson: string) => {
    try {
      const colors = JSON.parse(customColorsJson);
      if (Array.isArray(colors) && colors.length >= 2) {
        if (colors.length === 2) {
          return `linear-gradient(90deg, ${colors[0]}, ${colors[1]})`;
        } else if (colors.length === 3) {
          return `linear-gradient(90deg, ${colors[0]}, ${colors[1]}, ${colors[2]})`;
        }
      }
    } catch (error) {
      console.error('Error parsing custom gradient colors:', error);
    }
    return null;
  };

  const getColorStyle = (isBackground: boolean = true, isText: boolean = false) => {
    const colorMode = organizerProfile?.color_mode || 'solid';
    const primaryColor = organizerProfile?.primary_color || '#3B82F6';

    if (colorMode === 'gradient') {
      const gradientClasses = organizerProfile?.gradient_classes;
      const customGradientColors = organizerProfile?.custom_gradient_colors;

      if (gradientClasses === 'custom' && customGradientColors) {
        const gradientStyle = getCustomGradientStyle(customGradientColors);
        if (gradientStyle) {
          return {
            background: gradientStyle,
            backgroundSize: '200% 200%',
            ...(isText && {
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent'
            })
          };
        }
      }

      if (isText) {
        return {
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          color: 'transparent'
        };
      }
      return {};
    }

    if (isText) {
      return { color: primaryColor };
    }

    return isBackground ? { backgroundColor: primaryColor } : { color: primaryColor };
  };

  const getColorClassName = (baseClasses: string = '') => {
    const colorMode = organizerProfile?.color_mode || 'solid';

    if (colorMode === 'gradient') {
      const gradientClasses = organizerProfile?.gradient_classes;
      const customGradientColors = organizerProfile?.custom_gradient_colors;

      if (gradientClasses === 'custom' && customGradientColors) {
        return `${baseClasses} animate-gradient-x bg-[length:200%_200%]`;
      }

      if (gradientClasses && gradientClasses !== 'custom') {
        return `${baseClasses} bg-gradient-to-r ${gradientClasses} animate-gradient-x bg-[length:200%_200%]`;
      }
    }

    return baseClasses;
  };

  const formatQuotaNumber = (quotaNumber: number): string => {
    if (!campaign?.total_tickets) {
      return (quotaNumber - 1).toString().padStart(3, '0');
    }
    
    const digits = String(campaign.total_tickets - 1).length;
    return (quotaNumber - 1).toString().padStart(digits, '0');
  };

  useEffect(() => {
    if (!reservationData) {
      navigate('/');
      return;
    }

    if (reservationData.customerPhone && !isPhoneAuthenticated) {
      signInWithPhone(reservationData.customerPhone);
    }

    console.log('🔵 PaymentConfirmationPage - Reservation ID:', reservationData.reservationId);
    console.log('🔵 PaymentConfirmationPage - Full Reservation Data:', reservationData);
  }, [reservationData, navigate, signInWithPhone, isPhoneAuthenticated]);

  useEffect(() => {
    const loadOrganizerProfile = async () => {
      if (reservationData?.campaignId) {
        const { data: campaignData, error: campaignError } = await supabase
          .from('campaigns')
          .select('user_id, campaign_model, prize_image_urls, total_tickets')
          .eq('id', reservationData.campaignId)
          .maybeSingle();

        if (campaignError) {
          console.error('Error loading campaign data:', campaignError);
          return;
        }

        if (campaignData) {
          setCampaignModel(campaignData.campaign_model || 'manual');
          setCampaign({ total_tickets: campaignData.total_tickets || 100 });
          
          if (campaignData.prize_image_urls && campaignData.prize_image_urls.length > 0) {
            setCampaignImageUrl(campaignData.prize_image_urls[0]);
          }

          if (campaignData.user_id) {
            const { data: profile, error: profileError } = await supabase
              .from('public_profiles_view')
              .select('id, name, logo_url, primary_color, theme, color_mode, gradient_classes, custom_gradient_colors, social_media_links')
              .eq('id', campaignData.user_id)
              .maybeSingle();

            if (profileError) {
              console.error('Error loading organizer profile:', profileError);
              return;
            }

            if (profile) {
              setOrganizerProfile(profile);
            }
          }
        }
      }
    };

    loadOrganizerProfile();
  }, [reservationData]);

  // useEffect para atualizar o favicon dinamicamente
  useEffect(() => {
    const faviconLink = document.querySelector("link[rel='icon']") as HTMLLinkElement;
    
    if (organizerProfile?.logo_url) {
      // Se há logo do organizador, usar ele
      if (faviconLink) {
        faviconLink.href = organizerProfile.logo_url;
      } else {
        const newFavicon = document.createElement('link');
        newFavicon.rel = 'icon';
        newFavicon.href = organizerProfile.logo_url;
        document.head.appendChild(newFavicon);
      }
    } else {
      // Se não há logo do organizador, restaurar o padrão
      if (faviconLink) {
        faviconLink.href = '/logo-chatgpt.png';
      }
    }

    // Cleanup: restaurar favicon padrão ao desmontar
    return () => {
      const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (favicon) {
        favicon.href = '/logo-chatgpt.png';
      }
    };
  }, [organizerProfile]);

  // useEffect para atualizar o título da página dinamicamente
  useEffect(() => {
    // Sempre exibir apenas "Pagamento"
    document.title = 'Pagamento';

    // Cleanup: restaurar título padrão quando o componente desmontar
    return () => {
      document.title = 'Rifaqui';
    };
  }, []);

  useEffect(() => {
    if (!reservationData?.expiresAt) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiration = new Date(reservationData.expiresAt).getTime();
      const difference = expiration - now;

      if (difference <= 0) {
        setTimeRemaining('Expirado');
        setIsExpired(true);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [reservationData?.expiresAt]);

  const handleCopyPixKey = async () => {
    const reservationIdClean = reservationData?.reservationId.replace(/-/g, '') || 'mock-key';
    const pixKey = `00020126580014br.gov.bcb.pix0136${reservationIdClean}5204000053039865802BR5925RIFAQUI PAGAMENTOS LTDA6009SAO PAULO62070503***6304ABCD`;
    
    console.log('🔵 PaymentConfirmationPage - PIX Key generated:', pixKey);
    
    try {
      await navigator.clipboard.writeText(pixKey);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2000);
    } catch (error) {
      console.error('❌ Failed to copy PIX key:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (!reservationData) {
    const primaryColor = organizerProfile?.primary_color || '#3B82F6';
    return (
      <div className={`min-h-screen ${themeClasses.background} flex items-center justify-center`}>
        <div 
          className="animate-spin rounded-full h-16 w-16 border-b-2" 
          style={{ borderColor: primaryColor }}
        ></div>
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

        <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Timer className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
                    Pedido cancelado!
                  </h2>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    O prazo para pagamento do seu pedido expirou.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className={`${themeClasses.cardBg} rounded-2xl p-6 border ${themeClasses.border} shadow-lg`}>
              <div 
                className="flex items-start gap-4 mb-6 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate(`/c/${reservationData.campaignPublicId || reservationData.campaignId}`)}
              >
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
                    Sorteio pela Loteria Federal!
                  </p>
                  <span className="inline-block px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                    Cancelado
                  </span>
                </div>
              </div>

              <div className="border-t border-b py-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm font-medium ${themeClasses.text}`}>
                    <Package className="inline h-4 w-4 mr-1" />
                    Detalhes da sua compra
                  </span>
                </div>
                <div className={`text-xs font-mono mb-4 ${themeClasses.idBoxBg} ${themeClasses.idBoxText} p-3 rounded-lg break-all`}>
                  {reservationData.reservationId}
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
                      Data/Hora
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
                      Valor
                    </span>
                    <span className={`text-lg font-bold ${themeClasses.text}`}>
                      {formatCurrency(reservationData.totalValue)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  As cotas serão geradas após o pagamento.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6"
          >
            <button
              onClick={() => navigate(`/c/${reservationData.campaignPublicId || reservationData.campaignId}`)}
              className={getColorClassName("w-full px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105")}
              style={getColorStyle(true, false)}
            >
              Voltar para Campanha
            </button>
          </motion.div>
        </main>

        {/* Menu flutuante de redes sociais - Exibido quando há perfil do organizador */}
        {organizerProfile && (
          <SocialMediaFloatingMenu
            socialMediaLinks={organizerProfile.social_media_links}
            primaryColor={organizerProfile.primary_color || '#3B82F6'}
            colorMode={organizerProfile.color_mode || 'solid'}
            gradientClasses={organizerProfile.gradient_classes || ''}
            customGradientColors={organizerProfile.custom_gradient_colors || ''}
          />
        )}

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
                <div className={`text-3xl sm:text-4xl font-bold ${timeRemaining === 'Expirado' ? 'text-red-600 dark:text-red-400' : timeRemaining.includes('m') && !timeRemaining.includes('d') && !timeRemaining.includes('h') && parseInt(timeRemaining.split(':')[0]) < 5 ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-orange-600 dark:text-orange-400'}`}>
                  {timeRemaining}
                </div>
                <div className={`text-xs ${themeClasses.textSecondary}`}>
                  {timeRemaining === 'Expirado' ? '' : timeRemaining.includes('d') ? '' : timeRemaining.includes('h') ? '' : 'minutos'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

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
                value={`00020126580014br.gov.bcb.pix0136${reservationData.reservationId.replace(/-/g, '')}5204000053039865802BR5925RIFAQUI...`}
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className={`${themeClasses.cardBg} rounded-2xl p-6 border ${themeClasses.border} shadow-lg`}>
            <div 
              className="flex items-start gap-4 mb-6 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate(`/c/${reservationData.campaignPublicId || reservationData.campaignId}`)}
            >
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
              <div className={`text-xs font-mono mb-4 ${themeClasses.idBoxBg} ${themeClasses.idBoxText} p-3 rounded-lg break-all`}>
                {reservationData.reservationId}
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
                <p className={`text-sm font-medium ${themeClasses.text} mb-3`}>
                  ✓ Números reservados com sucesso
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {reservationData.selectedQuotas.map((quota, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center justify-center px-3 py-1.5 bg-green-500 text-white text-sm font-bold rounded-lg"
                    >
                      {formatQuotaNumber(quota)}
                    </span>
                  ))}
                </div>
                <p className={`text-xs ${themeClasses.textSecondary}`}>
                  Seus números serão liberados assim que o pagamento for confirmado.
                </p>
              </div>
            )}

            {(campaignModel !== 'manual' || !reservationData.selectedQuotas || reservationData.selectedQuotas.length === 0) && (
              <div className={`${themeClasses.inputBg} rounded-xl p-4`}>
                <p className={`text-sm font-medium ${themeClasses.text} mb-2`}>
                  ✓ Reserva realizada com sucesso
                </p>
                <p className={`text-xs ${themeClasses.textSecondary}`}>
                  Seus números serão gerados automaticamente após a confirmação do pagamento.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </main>

      {/* Menu flutuante de redes sociais - Exibido quando há perfil do organizador */}
      {organizerProfile && (
        <SocialMediaFloatingMenu
          socialMediaLinks={organizerProfile.social_media_links}
          primaryColor={organizerProfile.primary_color || '#3B82F6'}
          colorMode={organizerProfile.color_mode || 'solid'}
          gradientClasses={organizerProfile.gradient_classes || ''}
          customGradientColors={organizerProfile.custom_gradient_colors || ''}
        />
      )}

      <CampaignFooter campaignTheme={campaignTheme} />
    </div>
  );
};

export default PaymentConfirmationPage;