import React, { useState } from 'react';
import { ArrowLeft, Edit, Eye, CreditCard, TrendingUp, AlertCircle, ChevronLeft, ChevronRight, Copy, CheckCircle, QrCode, Loader2, Crown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCampaign, useCampaignWithRefetch } from '../hooks/useCampaigns';
import { StripeAPI } from '../lib/api/stripe';
import { STRIPE_PRODUCTS, formatPrice } from '../stripe-config';

// Declare Stripe global variable
declare global {
  interface Window {
    Stripe: any;
  }
}

const CreateCampaignStep3Page = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('pix');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [stripe, setStripe] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentStatusMessage, setPaymentStatusMessage] = useState('');
  const [qrCodeImage, setQrCodeImage] = useState(null);
  const [pixCopyPasteCode, setPixCopyPasteCode] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // Extrai o ID da campanha da URL
  const campaignId = new URLSearchParams(location.search).get('id') || '';
  
  // Fetch campaign data using the hook
  const { campaign, loading: isLoading } = useCampaign(campaignId || '');

  // Initialize Stripe
  React.useEffect(() => {
    if (window.Stripe && import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
      const stripeInstance = window.Stripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
      setStripe(stripeInstance);
    }
  }, []);

  // Mock data - em produção, estes dados viriam do contexto ou props
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
    // Navigate to campaign page using slug
    if (campaign?.slug) {
      window.open(`/c/${campaign.slug}`, '_blank');
    } else {
      // Fallback to ID if no slug exists
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

    // Calculate estimated revenue to get the correct publication product
    const estimatedRevenue = totalTickets * ticketPrice;
    const publicationProduct = STRIPE_PRODUCTS.find(p => p.mode === 'payment' && estimatedRevenue >= (p.minRevenue || 0) && estimatedRevenue <= (p.maxRevenue || Infinity));

    if (!publicationProduct) {
      alert('Erro: Não foi possível determinar a taxa de publicação para esta campanha.');
      setProcessing(false);
      return;
    }

    try {
      // Create Stripe checkout session
      const { data: checkoutData, error } = await StripeAPI.createCheckoutSession({
        priceId: publicationProduct.priceId,
        campaignId: campaignId,
        successUrl: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&campaign_id=${campaignId}`,
        cancelUrl: `${window.location.origin}/payment-cancelled`
      });

      if (error || !checkoutData?.success) {
        throw new Error(error?.message || checkoutData?.error || 'Erro ao criar checkout');
      }

      // Redirect to Stripe checkout
      if (checkoutData.checkout_url) {
        window.location.href = checkoutData.checkout_url;
      } else {
        throw new Error('URL de checkout não encontrada');
      }

    } catch (error) {
      console.error('Error processing payment:', error);
      setPaymentStatusMessage('Falha no pagamento');
      alert(error.message || 'Erro ao processar pagamento. Tente novamente.');
      setProcessing(false);
    } finally {
      // Don't set processing to false here since we're redirecting
    }
  };

  const startPaymentStatusPolling = (paymentId: string) => {
    // In production, you would poll the payment status or use real-time subscriptions
    // For demo, we'll simulate payment confirmation after 10 seconds
    setTimeout(() => {
      setPaymentStatusMessage('Pagamento confirmado!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    }, 10000);
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

  const handlePaymentSimulation = async () => {
    if (!campaignId || !campaign) {
      alert('Erro: Campanha não encontrada');
      return;
    }

    if (processing) return;

    setProcessing(true);
    setPaymentStatusMessage(
      selectedPaymentMethod === 'pix' 
        ? 'Gerando QR Code PIX...' 
        : 'Preparando pagamento...'
    );

    // Simulate Stripe checkout creation
    setTimeout(async () => {
      try {
        if (selectedPaymentMethod === 'pix') {
          // Simulate PIX QR Code generation
          setQrCodeImage('https://via.placeholder.com/200x200/000000/FFFFFF?text=QR+CODE');
          setPixCopyPasteCode(`00020126580014br.gov.bcb.pix0136${campaignId}5204000053039865802BR5925RIFAQUI PAGAMENTOS LTDA6009SAO PAULO62070503***6304ABCD`);
          setPaymentStatusMessage('Aguardando pagamento PIX...');
          
          // Simulate payment confirmation after 10 seconds
          setTimeout(() => {
            setPaymentStatusMessage('Pagamento confirmado!');
            setTimeout(() => {
              navigate('/dashboard');
            }, 2000);
          }, 10000);
          
        } else {
          // Simulate card payment processing
          setPaymentStatusMessage('Processando pagamento...');
          
          // Simulate successful card payment
          setTimeout(() => {
            setPaymentStatusMessage('Pagamento confirmado!');
            setTimeout(() => {
              navigate('/dashboard');
            }, 2000);
          }, 3000);
        }
      } catch (error) {
        console.error('Error processing payment:', error);
        setPaymentStatusMessage('Falha no pagamento');
        alert('Erro ao processar pagamento. Tente novamente.');
      } finally {
        setProcessing(false);
      }
    }, 1500);
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

  // Cálculos dinâmicos
  const estimatedRevenue = totalTickets * ticketPrice;
  const publicationTaxProduct = STRIPE_PRODUCTS.find(p => p.mode === 'payment' && estimatedRevenue >= (p.minRevenue || 0) && estimatedRevenue <= (p.maxRevenue || Infinity));

  if (isLoading) {
    return <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleGoBack}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Voltar
                </h1>
              </div>
            </div>
            
            {/* Payment Deadline Notice */}
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Pague em até 3 dias</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Payment Form */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Pague a taxa de publicação
            </h2>

            {/* Payment Status Message */}
            {paymentStatusMessage && (
              <div className={`p-4 rounded-lg border ${
                paymentStatusMessage.includes('confirmado') 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                  : paymentStatusMessage.includes('Falha') 
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
              }`}>
                <div className="flex items-center space-x-2">
                  {processing && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>}
                  <span className="font-medium">{paymentStatusMessage}</span>
                </div>
              </div>
            )}

            {/* PIX Payment Display */}
            {selectedPaymentMethod === 'pix' && qrCodeImage && (
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
                  Pagamento PIX
                </h3>
                
                {/* QR Code */}
                <div className="text-center mb-6">
                  <div className="w-48 h-48 mx-auto bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                    <img src={qrCodeImage} alt="QR Code PIX" className="w-full h-full object-contain rounded-lg" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Escaneie o QR Code com o app do seu banco
                  </p>
                </div>

                {/* PIX Copy and Paste */}
                {pixCopyPasteCode && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Código PIX (Copia e Cola)
                      </span>
                      <button
                        onClick={handleCopyPixCode}
                        className="flex items-center space-x-1 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors duration-200"
                      >
                        {copied ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        <span className="text-sm">{copied ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                    <div className="bg-white dark:bg-gray-700 rounded p-3 font-mono text-xs break-all text-gray-900 dark:text-white">
                      {pixCopyPasteCode}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Payment Method Selection */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Taxa de Publicação
              </h3>
              
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700/50 rounded-lg p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Rifaqui
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Taxa de publicação para ativar sua campanha
                    </p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                      R$ 7,00
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-gray-700 dark:text-gray-300">Arrecadação estimada</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    R$ {estimatedRevenue.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-gray-700 dark:text-gray-300">Taxa de publicação</span>
                  </div>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {publicationTaxProduct ? formatPrice(publicationTaxProduct.price) : 'R$ 0,00'}
                  </span>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span className="text-gray-900 dark:text-white">Total a pagar</span>
                    <span className="text-gray-900 dark:text-white">
                      {publicationTaxProduct ? formatPrice(publicationTaxProduct.price) : 'R$ 0,00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tax Information */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 transition-colors duration-300">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                A taxa de publicação é cobrada uma única vez e permite que sua campanha seja 
                publicada na plataforma.
              </p>
            </div>

            {/* Payment Button */}
            <button
              onClick={handlePayment}
              disabled={processing}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white py-4 rounded-lg font-semibold text-lg transition-colors duration-200 shadow-md flex items-center justify-center space-x-2"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Redirecionando...</span>
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5" />
                  <span>Pagar Taxa de Publicação</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column - Campaign Summary */}
          <div className="space-y-6">
            {/* Campaign Image with Edit/Preview buttons */}
            <div className="relative group rounded-lg overflow-hidden">
              {/* Image Gallery */}
              <img
                src={prizeImages[currentImageIndex]}
                alt={campaignTitle}
                className="w-full h-64 object-cover rounded-lg transition-opacity duration-300"
              />
              
              {/* Navigation Arrows (only show if multiple prizeImages) */}
              {prizeImages.length > 1 && (
                <>
                  <button
                    onClick={handlePreviousImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-75"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-75"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
              
              {/* Image Counter */}
              {prizeImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {prizeImages.length}
                </div>
              )}
              
              {/* Thumbnail Strip */}
              {prizeImages.length > 1 && (
                <div className="flex space-x-2 mt-4 overflow-x-auto pb-2 px-2">
                  {prizeImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                        index === currentImageIndex
                          ? 'border-purple-500 opacity-100'
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
                </div>
              )}
              
              <div className="absolute top-4 right-4 flex space-x-2">
                <button
                  onClick={handleEdit}
                  className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-1 shadow-md"
                >
                  <Edit className="h-4 w-4" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={handlePreview}
                  className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-1 shadow-md"
                >
                  <Eye className="h-4 w-4" />
                  <span>Visualizar</span>
                </button>
              </div>
            </div>

            {/* Campaign Details */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {campaignTitle}
              </h3>
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-purple-600 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    {totalTickets} cotas
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-600 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    {formatPrice(ticketPrice)} por cota
                  </span>
                </div>
              </div>

              {/* Revenue Display */}
              <div className="bg-green-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm opacity-90">ARRECADAÇÃO ESTIMADA</div>
                    <div className="text-2xl font-bold">
                      R$ {estimatedRevenue.toFixed(2).replace('.', ',')}
                    </div> 
                  </div>
                  <TrendingUp className="h-8 w-8 opacity-80" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8">
            <a
              href="#"
              className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200"
            >
              Política de privacidade
            </a>
            <span className="hidden sm:block text-gray-300 dark:text-gray-600">•</span>
            <a
              href="#"
              className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200"
            >
              Termos de uso
            </a>
            <span className="hidden sm:block text-gray-300 dark:text-gray-600">•</span>
            <a
              href="#"
              className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200"
            >
              Suporte
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CreateCampaignStep3Page;