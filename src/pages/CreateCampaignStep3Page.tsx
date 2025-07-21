import React, { useState } from 'react';
import { ArrowLeft, Edit, Eye, CreditCard, TrendingUp, AlertCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCampaign } from '../hooks/useCampaigns';

const CreateCampaignStep3Page = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('pix');

  // Extrai o ID da campanha da URL
  const campaignId = new URLSearchParams(location.search).get('id');
  
  // Fetch campaign data using the hook
  const { data: campaign, isLoading } = useCampaign(campaignId || '');

  // Use campaign data or fallback to mock data
  const campaignData = campaign ? {
    title: campaign.title,
    totalTickets: campaign.total_tickets,
    ticketPrice: campaign.ticket_price,
    images: campaign.prize_image_urls || ['https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1']
  } : {
    title: 'Setup Gamer',
    totalTickets: 100,
    ticketPrice: 1.00,
    images: ['https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1']
  };

  const handleGoBack = () => {
    navigate('/dashboard/create-campaign/step-2');
  };

  const handleEdit = () => {
    navigate(`/dashboard/create-campaign/step-2?id=${campaignId}`);
  };

  const handlePreview = () => {
    // Pass the campaign model to the preview page via state
    navigate(`/c/${campaignId || 'mock-campaign-id'}`, {
      state: { 
        campaignModel: campaign?.campaign_model || 'manual',
        previewMode: true 
      }
    });
  };

  const handlePayment = () => {
    // Implementar processamento do pagamento
    console.log('Processar pagamento:', selectedPaymentMethod);
    // Redirecionar para dashboard após pagamento
    navigate('/dashboard');
  };

  // Cálculos dinâmicos
  const estimatedRevenue = campaignData.totalTickets * campaignData.ticketPrice;
  const publicationTax = 7.00; // Taxa base para arrecadação até R$ 100
  const cardTax = selectedPaymentMethod === 'card' ? estimatedRevenue * 0.0399 + 0.39 : 0;
  const totalTax = publicationTax + cardTax;

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

            {/* Payment Method Selection */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Forma de pagamento
              </h3>
              
              <div className="space-y-3">
                {/* PIX Option */}
                <div
                  onClick={() => setSelectedPaymentMethod('pix')}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                    selectedPaymentMethod === 'pix'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">₽</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">Pix</div>
                      <div className="text-sm text-green-600 dark:text-green-400">Sem taxa</div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedPaymentMethod === 'pix'
                        ? 'border-green-500 bg-green-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {selectedPaymentMethod === 'pix' && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Credit Card Option */}
                <div
                  onClick={() => setSelectedPaymentMethod('card')}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                    selectedPaymentMethod === 'card'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">Cartão de crédito</div>
                      <div className="text-sm text-red-600 dark:text-red-400">
                        Taxa cartão (3,99% + R$ 0,39)
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedPaymentMethod === 'card'
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {selectedPaymentMethod === 'card' && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
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
                    R$ {publicationTax.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                {selectedPaymentMethod === 'card' && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="text-gray-700 dark:text-gray-300">Taxa do cartão</span>
                    </div>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      R$ {cardTax.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                )}

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span className="text-gray-900 dark:text-white">Total a pagar</span>
                    <span className="text-gray-900 dark:text-white">
                      R$ {totalTax.toFixed(2).replace('.', ',')}
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
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-semibold text-lg transition-colors duration-200 shadow-md"
            >
              Pagar
            </button>
          </div>

          {/* Right Column - Campaign Summary */}
          <div className="space-y-6">
            {/* Campaign Images Gallery with Edit/Preview buttons */}
            <div className="space-y-4">
              {campaignData.images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image}
                    alt={`${campaignData.title} - Image ${index + 1}`}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  {index === 0 && (
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
                  )}
                </div>
              ))}
              
              {campaignData.images.length > 1 && (
                <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                  {campaignData.images.length} imagens do prêmio
                </div>
              </div>
            </div>

            {/* Campaign Details */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {campaignData.title}
              </h3>
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-purple-600 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    {campaignData.totalTickets} cotas
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-600 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    R$ {campaignData.ticketPrice.toFixed(2).replace('.', ',')} por cota
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