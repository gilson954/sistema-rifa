import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Eye, CreditCard, TrendingUp, AlertCircle, ChevronLeft, ChevronRight, Copy, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCampaign } from '../hooks/useCampaigns';
import { StripeAPI } from '../lib/api/stripe';
import { STRIPE_PRODUCTS, formatPrice } from '../stripe-config';
import { translateAuthError } from '../utils/errorTranslators';

declare global {
  interface Window {
    Stripe: any;
  }
}

const getTimeRemaining = (expiresAt: string) => {
  const now = new Date().getTime();
  const expiration = new Date(expiresAt).getTime();
  const difference = expiration - now;

  if (difference <= 0) {
    return { expired: true, text: 'Expirado' };
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return { expired: false, text: `${days}d ${hours}h ${minutes}m` };
  } else if (hours > 0) {
    return { expired: false, text: `${hours}h ${minutes}m` };
  } else {
    return { expired: false, text: `${minutes}m` };
  }
};

const CreateCampaignStep3Page = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('pix');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [stripe, setStripe] = useState<any | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentStatusMessage, setPaymentStatusMessage] = useState('');
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [pixCopyPasteCode, setPixCopyPasteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const campaignId = new URLSearchParams(location.search).get('id') || '';
  const { campaign, loading: isLoading } = useCampaign(campaignId || '');

  React.useEffect(() => {
    if (window.Stripe && import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
      const stripeInstance = window.Stripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
      setStripe(stripeInstance);
    }
  }, []);

  const campaignTitle = campaign?.title || 'Sua Campanha';
  const totalTickets = campaign?.total_tickets || 0;
  const ticketPrice = campaign?.ticket_price || 0;
  const prizeImages = campaign?.prize_image_urls && campaign.prize_image_urls.length > 0 
    ? campaign.prize_image_urls 
    : ['https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'];

  const handleGoBack = () => {
    navigate(`/dashboard/create-campaign/step-2?id=${campaignId}`);
  };

  const handleEdit = () => {
    navigate(`/dashboard/create-campaign/step-2?id=${campaignId}`);
  };

  const handlePreview = () => {
    if (campaign?.public_id) {
      window.open(`/c/${campaign.public_id}`, '_blank');
    } else {
      window.open(`/c/${campaignId}`, '_blank');
    }
  };

  const handlePayment = async () => {
    if (!campaignId || !campaign) {
      alert('Erro: Campanha não encontrada');
      return;
    }

    if (processing) return;

    setProcessing(true);
    setPaymentStatusMessage('Redirecionando para pagamento...');

    const estimatedRevenue = totalTickets * ticketPrice;
    const publicationProduct = STRIPE_PRODUCTS.find(p => p.mode === 'payment' && estimatedRevenue >= (p.minRevenue || 0) && estimatedRevenue <= (p.maxRevenue || Infinity));

    if (!publicationProduct) {
      alert('Erro: Não foi possível determinar a taxa de publicação para esta campanha.');
      setProcessing(false);
      return;
    }

    try {
      const { data: checkoutData, error: stripeError } = await StripeAPI.createCheckoutSession({
        priceId: publicationProduct.priceId,
        campaignId: campaignId,
        successUrl: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&campaign_id=${campaignId}`,
        cancelUrl: `${window.location.origin}/payment-cancelled`
      });

      if (stripeError || !checkoutData?.success) {
        throw new Error(translateAuthError(stripeError?.message || checkoutData?.error || 'Erro ao criar checkout'));
      }

      if (checkoutData.checkout_url) {
        window.location.href = checkoutData.checkout_url;
      } else {
        throw new Error(translateAuthError('URL de checkout não encontrada'));
      }

    } catch (error: any) {
      console.error('Error processing payment:', error);
      setPaymentStatusMessage('Falha no pagamento');
      alert(translateAuthError(error?.message || 'Erro ao processar pagamento. Tente novamente.'));
      setProcessing(false);
    }
  };

  const handleCopyPixCode = async () => {
    if (pixCopyPasteCode) {
      try {
        await navigator.clipboard.writeText(pixCopyPasteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy PIX code:', error);
      }
    }
  };

  const handlePreviousImage = () => {
    setCurrentImageIndex(prev => 
      prev === 0 ? prizeImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => 
      prev === prizeImages.length - 1 ? 0 : prev + 1
    );
  };

  const currentImage = prizeImages[currentImageIndex];
  const estimatedRevenue = totalTickets * ticketPrice;
  const publicationTaxProduct = STRIPE_PRODUCTS.find(p => p.mode === 'payment' && estimatedRevenue >= (p.minRevenue || 0) && estimatedRevenue <= (p.maxRevenue || Infinity));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 sm:py-12">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-page min-h-screen bg-transparent text-gray-900 dark:text-white transition-colors duration-300">
      <style>
        {`
          @media (max-width: 640px) {
            ::-webkit-scrollbar {
              width: 8px;
            }
            ::-webkit-scrollbar-track {
              background: linear-gradient(to bottom, rgba(139, 92, 246, 0.05), rgba(219, 39, 119, 0.05));
              border-radius: 10px;
            }
            ::-webkit-scrollbar-thumb {
              background: linear-gradient(to bottom, #a855f7, #ec4899, #3b82f6);
              border-radius: 10px;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(to bottom, #c084fc, #f472b6);
            }
            ::-webkit-scrollbar-thumb:active {
              background: linear-gradient(to bottom, #7c3aed, #db2777);
            }
          }
          
          @media (min-width: 641px) {
            ::-webkit-scrollbar {
              width: 12px;
            }
            ::-webkit-scrollbar-track {
              background: linear-gradient(to bottom, rgba(139, 92, 246, 0.05), rgba(219, 39, 119, 0.05));
              border-radius: 10px;
            }
            ::-webkit-scrollbar-thumb {
              background: linear-gradient(to bottom, #a855f7, #ec4899, #3b82f6);
              border-radius: 10px;
              box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
            }
            ::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(to bottom, #c084fc, #f472b6);
              box-shadow: 0 0 15px rgba(192, 132, 252, 0.6);
            }
          }
        `}
      </style>
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <motion.div 
          className="mb-6 sm:mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={handleGoBack}
                className="p-2 sm:p-3 hover:bg-white/60 dark:hover:bg-gray-800/60 rounded-lg sm:rounded-xl transition-all duration-200 border border-transparent hover:border-gray-200/20 dark:hover:border-gray-700/30"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  Publicar campanha
                </h1>
                <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">
                  {campaignTitle}
                </p>
              </div>
            </div>
            
            {/* Payment Deadline Notice */}
            {campaign?.status === 'draft' && campaign.expires_at && !campaign.is_paid && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {(() => {
                  const timeRemaining = getTimeRemaining(campaign.expires_at);
                  const isUrgent = !timeRemaining.expired && campaign.expires_at && 
                    new Date(campaign.expires_at).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000;
                  
                  return (
                    <div className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium ${
                      timeRemaining.expired
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        : isUrgent
                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                    }`}>
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">
                        {timeRemaining.expired 
                          ? 'Campanha expirada - Faça o pagamento para reativar'
                          : `Faça o pagamento em até ${timeRemaining.text} ou ela vai expirar`
                        }
                      </span>
                      <span className="sm:hidden">
                        {timeRemaining.expired ? 'Expirada' : timeRemaining.text}
                      </span>
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </div>

          {/* Progress Steps */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-md">
                ✓
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Básico</span>
            </div>
            <div className="flex-1 h-0.5 sm:h-1 bg-green-600 rounded-full"></div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-md">
                ✓
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Detalhes</span>
            </div>
            <div className="flex-1 h-0.5 sm:h-1 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 rounded-full animate-gradient-x bg-[length:200%_200%]"></div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-lg">
                3
              </div>
              <span className="text-xs sm:text-sm font-bold text-purple-600 dark:text-purple-400">Pagamento</span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Left Column - Payment Form */}
          <motion.div 
            className="space-y-4 sm:space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
              Pague a taxa de publicação
            </h2>

            {/* Payment Status Message */}
            {paymentStatusMessage && (
              <motion.div 
                className={`rounded-lg sm:rounded-xl p-3 sm:p-5 border backdrop-blur-sm ${
                  paymentStatusMessage.includes('confirmado') 
                    ? 'bg-green-50/60 dark:bg-green-900/20 border-green-200/20 dark:border-green-800/30 text-green-800 dark:text-green-200'
                    : paymentStatusMessage.includes('Falha') 
                    ? 'bg-red-50/60 dark:bg-red-900/20 border-red-200/20 dark:border-red-800/30 text-red-800 dark:text-red-200'
                    : 'bg-blue-50/60 dark:bg-blue-900/20 border-blue-200/20 dark:border-blue-800/30 text-blue-800 dark:text-blue-200'
                }`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  {processing && <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />}
                  <span className="text-xs sm:text-base font-medium">{paymentStatusMessage}</span>
                </div>
              </motion.div>
            )}

            {/* PIX Payment Display */}
            {selectedPaymentMethod === 'pix' && qrCodeImage && (
              <motion.div 
                className="rounded-xl sm:rounded-2xl border border-gray-200/20 dark:border-gray-700/30 bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm p-4 sm:p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 text-center">
                  Pagamento PIX
                </h3>
                
                <div className="text-center mb-4 sm:mb-6">
                  <div className="w-40 h-40 sm:w-48 sm:h-48 mx-auto bg-gray-100 dark:bg-gray-800 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-md">
                    <img src={qrCodeImage} alt="QR Code PIX" className="w-full h-full object-contain rounded-lg sm:rounded-xl" />
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Escaneie o QR Code com o app do seu banco
                  </p>
                </div>

                {pixCopyPasteCode && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                        Código PIX (Copia e Cola)
                      </span>
                      <button
                        onClick={handleCopyPixCode}
                        className="flex items-center space-x-1 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors duration-200"
                      >
                        {copied ? (
                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                        ) : (
                          <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                        <span className="text-xs sm:text-sm font-medium">{copied ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-2 sm:p-3 font-mono text-[10px] sm:text-xs break-all text-gray-900 dark:text-white">
                      {pixCopyPasteCode}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Payment Summary */}
            <motion.div 
              className="rounded-xl sm:rounded-2xl border border-gray-200/20 dark:border-gray-700/30 bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm p-4 sm:p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                    <span className="text-xs sm:text-base text-gray-700 dark:text-gray-300 font-medium">Arrecadação estimada</span>
                  </div>
                  <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                    {formatPrice(estimatedRevenue)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
                    <span className="text-xs sm:text-base text-gray-700 dark:text-gray-300 font-medium">Taxa de publicação</span>
                  </div>
                  <span className="text-sm sm:text-base font-bold text-red-600 dark:text-red-400">
                    {publicationTaxProduct ? formatPrice(publicationTaxProduct.price) : 'R$ 0,00'}
                  </span>
                </div>

                <div className="border-t-2 border-gray-200/20 dark:border-gray-700/30 pt-3 sm:pt-4">
                  <div className="flex items-center justify-between text-base sm:text-lg">
                    <span className="font-bold text-gray-900 dark:text-white">Total a pagar</span>
                    <span className="font-bold text-gray-900 dark:text-white text-lg sm:text-xl">
                      {publicationTaxProduct ? formatPrice(publicationTaxProduct.price) : 'R$ 0,00'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Tax Information */}
            <motion.div 
              className="rounded-lg sm:rounded-xl border border-blue-200/20 dark:border-blue-800/30 bg-blue-50/60 dark:bg-blue-900/20 backdrop-blur-sm p-3 sm:p-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 font-medium">
                A taxa de publicação é cobrada uma única vez e permite que sua campanha seja 
                publicada na plataforma.
              </p>
            </motion.div>

            {/* Payment Button or Active Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              {campaign?.status === 'active' ? (
                <div className="w-full bg-green-600 text-white py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg flex items-center justify-center space-x-2 shadow-lg">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span>✅ Campanha Ativa</span>
                </div>
              ) : (
                <button
                  onClick={handlePayment}
                  disabled={processing}
                  className="w-full inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-[#7928CA] via-[#FF0080] via-[#007CF0] to-[#FF8C00] text-white"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                      <span>Redirecionando...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />
                      <span>Pagar Taxa de Publicação</span>
                    </>
                  )}
                </button>
              )}
            </motion.div>
          </motion.div>

          {/* Right Column - Campaign Summary */}
          <motion.div 
            className="space-y-4 sm:space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {/* Campaign Image */}
            <div className="relative group rounded-xl sm:rounded-2xl overflow-hidden">
              <img
                src={prizeImages[currentImageIndex]}
                alt={campaignTitle}
                className="w-full h-48 sm:h-64 object-cover rounded-xl sm:rounded-2xl transition-opacity duration-300 shadow-lg"
              />
              
              {/* Navigation Arrows */}
              {prizeImages.length > 1 && (
                <>
                  <button
                    onClick={handlePreviousImage}
                    className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 bg-black/50 backdrop-blur-sm text-white p-1.5 sm:p-2 rounded-lg sm:rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/70 shadow-lg"
                  >
                    <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                  
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 bg-black/50 backdrop-blur-sm text-white p-1.5 sm:p-2 rounded-lg sm:rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/70 shadow-lg"
                  >
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </>
              )}
              
              {/* Image Counter */}
              {prizeImages.length > 1 && (
                <div className="absolute bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium shadow-lg">
                  {currentImageIndex + 1} / {prizeImages.length}
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex space-x-1.5 sm:space-x-2">
                <button
                  onClick={handleEdit}
                  className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center space-x-1 sm:space-x-2 shadow-lg hover:shadow-xl"
                >
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Editar</span>
                </button>
                <button
                  onClick={handlePreview}
                  className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center space-x-1 sm:space-x-2 shadow-lg hover:shadow-xl"
                >
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Visualizar</span>
                </button>
              </div>
            </div>

            {/* Thumbnail Strip */}
            {prizeImages.length > 1 && (
              <motion.div 
                className="flex space-x-2 sm:space-x-3 overflow-x-auto pb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                {prizeImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all duration-200 shadow-md hover:shadow-lg ${
                      index === currentImageIndex
                        ? 'border-purple-500 ring-2 ring-purple-500/50 opacity-100 scale-105'
                        : 'border-gray-300 dark:border-gray-600 opacity-60 hover:opacity-80'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </motion.div>
            )}

            {/* Campaign Details */}
            <motion.div 
              className="rounded-xl sm:rounded-2xl border border-gray-200/20 dark:border-gray-700/30 bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm p-4 sm:p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <h3 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                {campaignTitle}
              </h3>
              
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="flex items-center space-x-2 sm:space-x-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-purple-50/50 dark:bg-purple-900/10">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-purple-600 rounded-full"></div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Cotas</p>
                    <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                      {totalTickets.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-green-50/50 dark:bg-green-900/10">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-600 rounded-full"></div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Por cota</p>
                    <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                      {formatPrice(ticketPrice)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Revenue Display */}
              <div className="rounded-lg sm:rounded-xl p-4 sm:p-5 animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] sm:text-xs opacity-90 font-medium mb-1">ARRECADAÇÃO ESTIMADA</div>
                    <div className="text-xl sm:text-3xl font-bold">
                      {formatPrice(estimatedRevenue)}
                    </div>
                  </div>
                  <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 opacity-80" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default CreateCampaignStep3Page;