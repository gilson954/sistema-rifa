import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Eye, CreditCard, TrendingUp, AlertCircle, ChevronLeft, ChevronRight, Copy, CheckCircle, Crown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCampaign } from '../hooks/useCampaigns';
import { StripeAPI } from '../lib/api/stripe';
import { STRIPE_PRODUCTS } from '../stripe-config';

// Declare Stripe global variable
declare global {
  interface Window {
    Stripe: any;
  }
}

const formatPrice = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

const CreateCampaignStep3Page = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('pix');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [stripe, setStripe] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentStatusMessage, setPaymentStatusMessage] = useState('');
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [pixCopyPasteCode, setPixCopyPasteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const campaignId = new URLSearchParams(location.search).get('id') || '';
  const { campaign, loading: isLoading } = useCampaign(campaignId);

  useEffect(() => {
    if (window.Stripe && import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
      setStripe(window.Stripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY));
    }
  }, []);

  if (isLoading || !campaign) {
    return <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
    </div>;
  }

  const campaignTitle = campaign.title || 'Sua Campanha';
  const totalTickets = campaign.total_tickets || 0;
  const ticketPrice = campaign.ticket_price || 0;
  const prizeImages = campaign.prize_image_urls && campaign.prize_image_urls.length > 0
    ? campaign.prize_image_urls
    : ['https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'];

  const currentImage = prizeImages[currentImageIndex];

  const handlePreviousImage = () => {
    setCurrentImageIndex(prev => prev === 0 ? prizeImages.length - 1 : prev - 1);
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => prev === prizeImages.length - 1 ? 0 : prev + 1);
  };

  const estimatedRevenue = totalTickets * ticketPrice;
  const publicationTaxProduct = STRIPE_PRODUCTS.find(p =>
    p.mode === 'payment' &&
    estimatedRevenue >= (p.minRevenue || 0) &&
    estimatedRevenue <= (p.maxRevenue || Infinity)
  );

  const handleGoBack = () => navigate(`/dashboard/create-campaign/step-2?id=${campaignId}`);
  const handleEdit = () => navigate(`/dashboard/create-campaign/step-2?id=${campaignId}`);
  const handlePreview = () => window.open(`/c/${campaign.slug || campaignId}`, '_blank');

  const handleCopyPixCode = async () => {
    if (!pixCopyPasteCode) return;
    try {
      await navigator.clipboard.writeText(pixCopyPasteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy PIX code:', error);
    }
  };

  // ... O resto das funções de pagamento (handlePayment, handlePaymentSimulation) podem permanecer iguais

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Header */}
      {/* ... Mantém seu JSX existente, substituindo campaignData por campaign ou prizeImages */}
      {/* Exemplo: */}
      <img
        src={currentImage}
        alt={campaignTitle}
        className="w-full h-64 object-cover rounded-lg transition-opacity duration-300"
      />
      {/* Carousel arrows */}
      {prizeImages.length > 1 && (
        <>
          <button onClick={handlePreviousImage} className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-75">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={handleNextImage} className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-75">
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
};

export default CreateCampaignStep3Page;
