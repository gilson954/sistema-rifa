import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Plus, Trash2, X, ChevronDown, Upload, Eye, EyeOff, Calendar, Clock, AlertTriangle, CheckCircle, Phone } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCampaignWithRefetch } from '../hooks/useCampaigns';
import { CampaignAPI } from '../lib/api/campaigns';
import { useImageUpload } from '../hooks/useImageUpload';
import { ImageUpload } from '../components/ImageUpload';
import RichTextEditor from '../components/RichTextEditor';
import PromotionModal from '../components/PromotionModal';
import PrizesModal from '../components/PrizesModal';
import CountryPhoneSelect from '../components/CountryPhoneSelect';
import { Promotion, Prize } from '../types/promotion';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

const CreateCampaignStep2Page = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract campaign ID from URL
  const campaignId = new URLSearchParams(location.search).get('id');
  
  // Fetch campaign data
  const { campaign, loading: campaignLoading, refetch } = useCampaignWithRefetch(campaignId || '');
  
  // Image upload hook
  const {
    images,
    uploading: uploadingImages,
    uploadProgress,
    addImages,
    removeImage,
    reorderImages,
    uploadImages,
    setExistingImages
  } = useImageUpload();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    ticketQuantity: '',
    ticketPrice: '0,00',
    drawMethod: '',
    phoneNumber: '',
    description: '',
    drawDate: '',
    requireEmail: true,
    showRanking: false,
    minTicketsPerPurchase: 1,
    maxTicketsPerPurchase: 1000,
    initialFilter: 'all' as 'all' | 'available',
    campaignModel: 'automatic' as 'manual' | 'automatic',
    showPercentage: false
  });

  const [reservationTimeout, setReservationTimeout] = useState<string>('15');
  const [selectedCountry, setSelectedCountry] = useState<Country>({
    code: 'BR',
    name: 'Brasil',
    dialCode: '+55',
    flag: '🇧🇷'
  });
  const [rawTicketPrice, setRawTicketPrice] = useState('');
  const [estimatedRevenue, setEstimatedRevenue] = useState(0);
  const [publicationTax, setPublicationTax] = useState(0);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [showPrizesModal, setShowPrizesModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Reservation timeout options
  const reservationTimeoutOptions = [
    { value: 10, label: '10 minutos' },
    { value: 30, label: '30 minutos' },
    { value: 60, label: '1 hora' },
    { value: 180, label: '3 horas' },
    { value: 720, label: '12 horas' },
    { value: 1440, label: '1 dia' },
    { value: 2880, label: '2 dias' },
    { value: 5760, label: '4 dias' }
  ];

  const ticketQuantityOptions = [
    { value: 25, label: '25 cotas' },
    { value: 50, label: '50 cotas' },
    { value: 100, label: '100 cotas' },
    { value: 200, label: '200 cotas' },
    { value: 300, label: '300 cotas' },
    { value: 400, label: '400 cotas' },
    { value: 500, label: '500 cotas' },
    { value: 600, label: '600 cotas' },
    { value: 700, label: '700 cotas' },
    { value: 800, label: '800 cotas' },
    { value: 900, label: '900 cotas' },
    { value: 1000, label: '1.000 cotas' },
    { value: 2000, label: '2.000 cotas' },
    { value: 3000, label: '3.000 cotas' },
    { value: 4000, label: '4.000 cotas' },
    { value: 5000, label: '5.000 cotas' },
    { value: 10000, label: '10.000 cotas' },
    { value: 20000, label: '20.000 cotas' },
    { value: 30000, label: '30.000 cotas' },
    { value: 40000, label: '40.000 cotas' },
    { value: 50000, label: '50.000 cotas' },
    { value: 100000, label: '100.000 cotas' },
    { value: 500000, label: '500.000 cotas' },
    { value: 1000000, label: '1.000.000 cotas' },
    { value: 10000000, label: '10.000.000 cotas' }
  ];

  const drawMethods = [
    'Loteria Federal',
    'Sorteador.com.br',
    'Live no Instagram',
    'Live no Youtube',
    'Live no TikTok',
    'Outros'
  ];

  // Calculate publication tax based on estimated revenue
  const calculatePublicationTax = (revenue: number): number => {
    if (revenue <= 100) return 7.00;
    if (revenue <= 200) return 17.00;
    if (revenue <= 400) return 27.00;
    if (revenue <= 701) return 37.00;
    if (revenue <= 1000) return 57.00;
    if (revenue <= 2000) return 67.00;
    if (revenue <= 4000) return 77.00;
    if (revenue <= 7000) return 127.00;
    if (revenue <= 10000) return 197.00;
    if (revenue <= 20000) return 247.00;
    if (revenue <= 30000) return 497.00;
    if (revenue <= 50000) return 997.00;
    if (revenue <= 70000) return 1297.00;
    if (revenue <= 100000) return 1997.00;
    if (revenue <= 150000) return 2997.00;
    return 3997.00;
  };

  // Update calculations when price or quantity changes
  const updateCalculations = (price: string, quantity: string) => {
    const ticketPrice = parseFloat(price) / 100 || 0;
    const ticketQuantity = parseInt(quantity) || 0;
    const revenue = ticketPrice * ticketQuantity;
    const tax = calculatePublicationTax(revenue);
    
    setEstimatedRevenue(revenue);
    setPublicationTax(tax);
  };

  /**
   * Formats raw numeric input as Brazilian currency
   */
  const formatCurrencyDisplay = (rawValue: string): string => {
    const numericValue = rawValue.replace(/\D/g, '');
    
    if (!numericValue) return '';
    
    const cents = parseInt(numericValue, 10);
    const reais = cents / 100;
    
    const formatted = reais.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return formatted;
  };

  /**
   * Parse phone number from full format to extract country and number
   */
  const parsePhoneNumber = (fullPhoneNumber: string) => {
    if (!fullPhoneNumber) return { dialCode: '+55', phoneNumber: '', country: selectedCountry };
    
    // Extract dial code and phone number
    const parts = fullPhoneNumber.split(' ');
    const dialCode = parts[0] || '+55';
    const phoneNumber = parts.slice(1).join(' ') || '';
    
    // Find matching country
    const countries = [
      { code: 'BR', name: 'Brasil', dialCode: '+55', flag: '🇧🇷' },
      { code: 'US', name: 'Estados Unidos', dialCode: '+1', flag: '🇺🇸' },
      { code: 'CA', name: 'Canadá', dialCode: '+1', flag: '🇨🇦' },
      // Add more countries as needed
    ];
    
    const country = countries.find(c => c.dialCode === dialCode) || countries[0];
    
    return { dialCode, phoneNumber, country };
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numericValue = inputValue.replace(/\D/g, '');
    
    setRawTicketPrice(numericValue);
    const formattedValue = formatCurrencyDisplay(numericValue);
    setFormData({ ...formData, ticketPrice: formattedValue });
    
    updateCalculations(numericValue, formData.ticketQuantity);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const quantity = e.target.value;
    setFormData({ ...formData, ticketQuantity: quantity });
    updateCalculations(rawTicketPrice, quantity);
  };

  // Load campaign data when component mounts or campaign changes
  useEffect(() => {
    if (campaign) {
      setFormData({
        title: campaign.title || '',
        ticketQuantity: campaign.total_tickets?.toString() || '',
        ticketPrice: campaign.ticket_price ? (campaign.ticket_price * 100).toString() : '0,00',
        drawMethod: campaign.draw_method || '',
        phoneNumber: '',
        description: campaign.description || '',
        drawDate: campaign.draw_date ? new Date(campaign.draw_date).toISOString().slice(0, 16) : '',
        requireEmail: campaign.require_email ?? true,
        showRanking: campaign.show_ranking ?? false,
        minTicketsPerPurchase: campaign.min_tickets_per_purchase || 1,
        maxTicketsPerPurchase: campaign.max_tickets_per_purchase || 1000,
        initialFilter: campaign.initial_filter || 'all',
        campaignModel: campaign.campaign_model || 'automatic',
        showPercentage: campaign.show_percentage ?? false
      });

      // Set raw ticket price for calculations
      if (campaign.ticket_price) {
        const rawPrice = (campaign.ticket_price * 100).toString();
        setRawTicketPrice(rawPrice);
        const formattedPrice = formatCurrencyDisplay(rawPrice);
        setFormData(prev => ({ ...prev, ticketPrice: formattedPrice }));
      }

      // Parse and set phone number
      if (campaign.phone_number) {
        const { dialCode, phoneNumber, country } = parsePhoneNumber(campaign.phone_number);
        setSelectedCountry(country);
        setFormData(prev => ({ ...prev, phoneNumber }));
      }

      // Set reservation timeout
      setReservationTimeout((campaign.reservation_timeout_minutes || 15).toString());

      // Set existing images
      if (campaign.prize_image_urls && campaign.prize_image_urls.length > 0) {
        setExistingImages(campaign.prize_image_urls);
      }

      // Set promotions
      if (campaign.promotions && Array.isArray(campaign.promotions)) {
        setPromotions(campaign.promotions);
      }

      // Set prizes
      if (campaign.prizes && Array.isArray(campaign.prizes)) {
        setPrizes(campaign.prizes);
      }

      // Update calculations with loaded data
      if (campaign.ticket_price && campaign.total_tickets) {
        const rawPrice = (campaign.ticket_price * 100).toString();
        updateCalculations(rawPrice, campaign.total_tickets.toString());
      }
    }
  }, [campaign, setExistingImages]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate Step 1 fields
    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Título deve ter pelo menos 3 caracteres';
    }

    if (!formData.ticketQuantity) {
      newErrors.ticketQuantity = 'Quantidade de cotas é obrigatória';
    }

    if (!rawTicketPrice || rawTicketPrice === '0') {
      newErrors.ticketPrice = 'Preço da cota é obrigatório';
    }

    if (!formData.drawMethod) {
      newErrors.drawMethod = 'Método de sorteio é obrigatório';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Número de celular é obrigatório';
    } else {
      const numbers = formData.phoneNumber.replace(/\D/g, '');
      if (selectedCountry.code === 'BR' && numbers.length !== 11) {
        newErrors.phoneNumber = 'Número de celular deve ter 11 dígitos';
      } else if ((selectedCountry.code === 'US' || selectedCountry.code === 'CA') && numbers.length !== 10) {
        newErrors.phoneNumber = 'Número de telefone deve ter 10 dígitos';
      } else if (numbers.length < 7) {
        newErrors.phoneNumber = 'Número de telefone inválido';
      }
    }

    if (formData.minTicketsPerPurchase < 1) {
      newErrors.minTicketsPerPurchase = 'Mínimo deve ser pelo menos 1';
    }

    if (formData.maxTicketsPerPurchase < 1) {
      newErrors.maxTicketsPerPurchase = 'Máximo deve ser pelo menos 1';
    }

    if (formData.minTicketsPerPurchase > formData.maxTicketsPerPurchase) {
      newErrors.minTicketsPerPurchase = 'Mínimo não pode ser maior que o máximo';
    }

    if (campaign && formData.maxTicketsPerPurchase > campaign.total_tickets) {
      newErrors.maxTicketsPerPurchase = 'Máximo não pode ser maior que o total de cotas';
    }

    // Validate reservation timeout
    const timeoutValue = parseInt(reservationTimeout);
    if (!reservationTimeout || isNaN(timeoutValue)) {
      newErrors.reservationTimeout = 'Prazo para reserva é obrigatório';
    } else if (timeoutValue < 1) {
      newErrors.reservationTimeout = 'Prazo deve ser pelo menos 1 minuto';
    } else if (timeoutValue > 10080) {
      newErrors.reservationTimeout = 'Prazo máximo é 7 dias (10080 minutos)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !campaign) {
      return;
    }

    setLoading(true);

    try {
      // Upload images first if there are any new ones
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadImages(campaign.user_id);
      }

      const drawDate = formData.drawDate ? new Date(formData.drawDate).toISOString() : null;
      const ticketPrice = parseFloat(rawTicketPrice) / 100;
      const ticketQuantity = parseInt(formData.ticketQuantity);
      const fullPhoneNumber = `${selectedCountry.dialCode} ${formData.phoneNumber}`;

      const updateData = {
        id: campaign.id,
        title: formData.title,
        ticket_price: ticketPrice,
        total_tickets: ticketQuantity,
        draw_method: formData.drawMethod,
        phone_number: fullPhoneNumber,
        description: formData.description,
        draw_date: drawDate,
        require_email: formData.requireEmail,
        show_ranking: formData.showRanking,
        min_tickets_per_purchase: formData.minTicketsPerPurchase,
        max_tickets_per_purchase: formData.maxTicketsPerPurchase,
        initial_filter: formData.initialFilter,
        campaign_model: formData.campaignModel,
        show_percentage: formData.showPercentage,
        reservation_timeout_minutes: parseInt(reservationTimeout),
        ...(imageUrls.length > 0 && { prize_image_urls: imageUrls }),
        ...(promotions.length > 0 && { promotions }),
        ...(prizes.length > 0 && { prizes })
      };

      console.log('🔧 [DEBUG] Updating campaign with data:', updateData);

      const updatedCampaign = await CampaignAPI.updateCampaign(updateData);

      if (updatedCampaign.data) {
        console.log('✅ [DEBUG] Campaign updated successfully');
        navigate(`/dashboard/create-campaign/step-3?id=${campaign.id}`);
      }
    } catch (error) {
      console.error('Error updating campaign:', error);
      setErrors({ submit: 'Erro ao atualizar campanha. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/dashboard/create-campaign');
  };

  const handleSavePromotions = (newPromotions: Promotion[]) => {
    setPromotions(newPromotions);
  };

  const handleSavePrizes = (newPrizes: Prize[]) => {
    setPrizes(newPrizes);
  };

  if (campaignLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-6 rounded-lg border border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-6 rounded-lg border border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400">Campanha não encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-6 rounded-lg border border-gray-200 dark:border-gray-800 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={handleGoBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Editar campanha
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Configure os detalhes da sua campanha
              </p>
            </div>
          </div>

          {/* Campaign Title Display */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {campaign.title}
            </h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-2">
              <span>{campaign.total_tickets} cotas</span>
              <span>•</span>
              <span>R$ {campaign.ticket_price.toFixed(2).replace('.', ',')}</span>
              <span>•</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                campaign.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                campaign.status === 'draft' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' :
                'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
              }`}>
                {campaign.status === 'active' ? 'Ativa' : 
                 campaign.status === 'draft' ? 'Rascunho' : 
                 campaign.status}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-700 dark:text-red-300 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Step 1 Fields - Basic Campaign Data */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Dados Básicos da Campanha
            </h3>
            
            <div className="space-y-6">
              {/* Campaign Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Digite o título sua campanha"
                  className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200 ${
                    errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  required
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                )}
              </div>

              {/* Ticket Configuration Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ticket Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quantidade de cotas *
                  </label>
                  <div className="relative">
                    <select
                      value={formData.ticketQuantity}
                      onChange={handleQuantityChange}
                      className={`w-full appearance-none px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200 ${
                        errors.ticketQuantity ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      required
                    >
                      <option value="">Escolha uma opção</option>
                      {ticketQuantityOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                  {errors.ticketQuantity && (
                    <p className="text-red-500 text-sm mt-1">{errors.ticketQuantity}</p>
                  )}
                </div>

                {/* Ticket Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valor da cota *
                  </label>
                  <input
                    type="text"
                    value={formData.ticketPrice}
                    onChange={handlePriceChange}
                    placeholder="R$ 0,00"
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200 ${
                      errors.ticketPrice ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    required
                  />
                  {errors.ticketPrice && (
                    <p className="text-red-500 text-sm mt-1">{errors.ticketPrice}</p>
                  )}
                  
                  {/* Real-time Tax Display */}
                  {rawTicketPrice && formData.ticketQuantity && (
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 dark:text-gray-300">Arrecadação estimada:</span>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            R$ {estimatedRevenue.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 dark:text-gray-300">Taxa da campanha:</span>
                          <span className="font-medium text-red-600 dark:text-red-400">
                            R$ {publicationTax.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Draw Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Por onde será feito o sorteio? *
                </label>
                <div className="relative">
                  <select
                    value={formData.drawMethod}
                    onChange={(e) => setFormData({ ...formData, drawMethod: e.target.value })}
                    className={`w-full appearance-none px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200 ${
                      errors.drawMethod ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    required
                  >
                    <option value="">Escolha uma opção</option>
                    {drawMethods.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
                {errors.drawMethod && (
                  <p className="text-red-500 text-sm mt-1">{errors.drawMethod}</p>
                )}
              </div>

              {/* Phone Number with Country Selection */}
              <CountryPhoneSelect
                selectedCountry={selectedCountry}
                onCountryChange={setSelectedCountry}
                phoneNumber={formData.phoneNumber}
                onPhoneChange={(phone) => setFormData({ ...formData, phoneNumber: phone })}
                placeholder="Número de telefone"
                error={errors.phoneNumber}
              />
            </div>
          </div>

          {/* Prize Images Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Imagens do Prêmio
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Adicione imagens atrativas do seu prêmio para aumentar o interesse dos participantes
            </p>
            
            <ImageUpload
              images={images}
              uploading={uploadingImages}
              uploadProgress={uploadProgress}
              onAddImages={addImages}
              onRemoveImage={removeImage}
              onReorderImage={reorderImages}
            />
          </div>

          {/* Description Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Descrição da Campanha
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Descreva seu prêmio e as regras da sua rifa de forma clara e atrativa
            </p>
            
            <RichTextEditor
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="Descreva seu prêmio, regras da rifa, data do sorteio..."
              error={errors.description}
            />
          </div>

          {/* Prizes Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Prêmios
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Configure os prêmios da sua campanha
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPrizesModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar</span>
              </button>
            </div>

            {/* Prizes List */}
            {prizes.length > 0 ? (
              <div className="space-y-3">
                {prizes.map((prize, index) => (
                  <div
                    key={prize.id}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-4 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {prize.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updatedPrizes = prizes.filter(p => p.id !== prize.id);
                        setPrizes(updatedPrizes);
                      }}
                      className="p-1 text-red-500 hover:text-red-700 transition-colors duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">
                  Nenhum prêmio adicionado ainda
                </p>
              </div>
            )}
          </div>

          {/* Promotions Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Promoções
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Crie promoções para incentivar a compra de mais bilhetes
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPromotionModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar</span>
              </button>
            </div>

            {/* Promotions List */}
            {promotions.length > 0 ? (
              <div className="space-y-3">
                {promotions.map((promotion) => {
                  const originalValue = promotion.ticketQuantity * campaign.ticket_price;
                  const discountPercentage = originalValue > 0 ? Math.round((promotion.fixedDiscountAmount / originalValue) * 100) : 0;
                  
                  return (
                    <div
                      key={promotion.id}
                      className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-4 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-purple-500 text-xl">🎁</div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {promotion.ticketQuantity} bilhetes por R$ {promotion.discountedTotalValue.toFixed(2).replace('.', ',')}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Desconto: R$ {promotion.fixedDiscountAmount.toFixed(2).replace('.', ',')} ({discountPercentage}%)
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updatedPromotions = promotions.filter(p => p.id !== promotion.id);
                          setPromotions(updatedPromotions);
                        }}
                        className="p-1 text-red-500 hover:text-red-700 transition-colors duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">
                  Nenhuma promoção criada ainda
                </p>
              </div>
            )}
          </div>

          {/* Campaign Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Draw Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data do sorteio (opcional)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="datetime-local"
                  value={formData.drawDate}
                  onChange={(e) => setFormData({ ...formData, drawDate: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200"
                />
              </div>
            </div>

            {/* Reservation Timeout */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prazo para reserva expirar (minutos) *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={reservationTimeout}
                  onChange={(e) => setReservationTimeout(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200 ${
                    errors.reservationTimeout ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  required
                >
                  {reservationTimeoutOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
              {errors.reservationTimeout && (
                <p className="text-red-500 text-sm mt-1">{errors.reservationTimeout}</p>
              )}
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Tempo que o cliente tem para finalizar o pagamento após reservar
              </p>
            </div>
          </div>

          {/* Purchase Limits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mínimo de bilhetes por compra
              </label>
              <input
                type="number"
                value={formData.minTicketsPerPurchase}
                onChange={(e) => setFormData({ ...formData, minTicketsPerPurchase: parseInt(e.target.value) || 1 })}
                min="1"
                className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200 ${
                  errors.minTicketsPerPurchase ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                required
              />
              {errors.minTicketsPerPurchase && (
                <p className="text-red-500 text-sm mt-1">{errors.minTicketsPerPurchase}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Máximo de bilhetes por compra
              </label>
              <input
                type="number"
                value={formData.maxTicketsPerPurchase}
                onChange={(e) => setFormData({ ...formData, maxTicketsPerPurchase: parseInt(e.target.value) || 1000 })}
                min="1"
                max={campaign.total_tickets}
                className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200 ${
                  errors.maxTicketsPerPurchase ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                required
              />
              {errors.maxTicketsPerPurchase && (
                <p className="text-red-500 text-sm mt-1">{errors.maxTicketsPerPurchase}</p>
              )}
            </div>
          </div>

              </div>
            </div>
          </div>

          {/* Campaign Model Preview */}
          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
              Pré-visualização do Modelo
            </h4>
            
            {/* Automatic Model Preview */}
            {formData.campaignModel === 'automatic' && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
                  Modelo Automático
                </h5>
                
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-600 mb-4">
                  <h6 className="text-md font-medium text-gray-900 dark:text-white mb-4 text-center">
                    SELECIONE A QUANTIDADE DE COTAS
                  </h6>
                  
                  {/* Increment Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    <button disabled={true} className="bg-blue-600 text-white py-2 px-3 rounded text-sm font-medium cursor-not-allowed opacity-75 transition-all duration-200">
                      +1
                    </button>
                    <button disabled={true} className="bg-blue-600 text-white py-2 px-3 rounded text-sm font-medium cursor-not-allowed opacity-75 transition-all duration-200">
                      +5
                    </button>
                    <button disabled={true} className="bg-blue-600 text-white py-2 px-3 rounded text-sm font-medium cursor-not-allowed opacity-75 transition-all duration-200">
                      +15
                    </button>
                    <button disabled={true} className="bg-blue-600 text-white py-2 px-3 rounded text-sm font-medium cursor-not-allowed opacity-75 transition-all duration-200">
                      +150
                    </button>
                  </div>
                  
                  {/* Quantity Selector */}
                  <div className="flex items-center justify-center space-x-4 mb-4">
                    <button disabled={true} className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center cursor-not-allowed opacity-75 transition-colors duration-200">
                      <span className="text-gray-600 dark:text-gray-300">-</span>
                    </button>
                    <input
                      type="number"
                      value="5"
                      readOnly={true}
                      className="w-16 text-center py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white cursor-not-allowed opacity-75 transition-colors duration-200"
                    />
                    <button disabled={true} className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center cursor-not-allowed opacity-75 transition-colors duration-200">
                      <span className="text-gray-600 dark:text-gray-300">+</span>
                    </button>
                  </div>
                  
                  {/* Total Value */}
                  <div className="text-center mb-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Valor final</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      R$ {(5 * (parseFloat(rawTicketPrice) / 100 || 1)).toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                  
                  {/* Buy Button */}
                  <button disabled={true} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg cursor-not-allowed opacity-75 transition-colors duration-200 shadow-md">
                    RESERVAR
                  </button>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Os números serão escolhidos automaticamente pelo sistema
                </p>
              </div>
            )}
            
            {/* Manual Model Preview */}
            {formData.campaignModel === 'manual' && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
                  Modelo Manual
                </h5>
                
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-600 mb-4">
                  {/* Filter Tabs */}
                  <div className="flex flex-wrap justify-center gap-2 mb-4">
                    <button disabled={true} className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium cursor-not-allowed opacity-75 transition-colors duration-200">
                      Todos <span className="ml-1 bg-white/20 px-1 rounded text-xs">100</span>
                    </button>
                    <button disabled={true} className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded text-sm cursor-not-allowed opacity-75 transition-colors duration-200">
                      Disponíveis <span className="ml-1 bg-gray-300 dark:bg-gray-600 px-1 rounded text-xs">75</span>
                    </button>
                    <button disabled={true} className="bg-orange-500 text-white px-3 py-1 rounded text-sm cursor-not-allowed opacity-75 transition-colors duration-200">
                      Reservados <span className="ml-1 bg-orange-600 px-1 rounded text-xs">15</span>
                    </button>
                    <button disabled={true} className="bg-green-500 text-white px-3 py-1 rounded text-sm cursor-not-allowed opacity-75 transition-colors duration-200">
                      Comprados <span className="ml-1 bg-green-600 px-1 rounded text-xs">10</span>
                    </button>
                  </div>
                  
                  {/* Numbers Grid */}
                  <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-15 gap-1 mb-4">
                    {Array.from({ length: 60 }, (_, index) => {
                      const number = index + 1;
                      let bgColor = 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 cursor-not-allowed opacity-75'; // Available
                      
                      if ([5, 12, 23].includes(number)) {
                        bgColor = 'bg-blue-600 text-white border border-blue-700 cursor-not-allowed opacity-75'; // Selected
                      } else if ([8, 15, 31, 42].includes(number)) {
                        bgColor = 'bg-green-500 text-white border border-green-600 cursor-not-allowed opacity-75'; // Purchased
                      } else if ([3, 19, 27].includes(number)) {
                        bgColor = 'bg-orange-500 text-white border border-orange-600 cursor-not-allowed opacity-75'; // Reserved
                      }
                      
                      return (
                        <div
                          key={number}
                          disabled={true}
                          className={`w-8 h-8 text-xs font-medium rounded flex items-center justify-center transition-all duration-200 ${bgColor}`}
                        >
                          {number.toString().padStart(2, '0')}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Selected Summary */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-800 dark:text-blue-200">
                        3 cotas selecionadas: 05, 12, 23
                      </span>
                      <span className="font-bold text-blue-900 dark:text-blue-100">
                        R$ {(3 * (parseFloat(rawTicketPrice) / 100 || 1)).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                  
                  {/* Buy Button */}
                  <button disabled={true} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg cursor-not-allowed opacity-75 transition-colors duration-200 shadow-md">
                    RESERVAR NÚMEROS SELECIONADOS
                  </button>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  O comprador escolhe exatamente quais números quer comprar
                </p>
              </div>
            )}
          </div>

          {/* Initial Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Filtro inicial dos bilhetes
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onClick={() => setFormData({ ...formData, initialFilter: 'all' })}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  formData.initialFilter === 'all'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">Todos</h4>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.initialFilter === 'all'
                      ? 'border-green-500 bg-green-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {formData.initialFilter === 'all' && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Mostra todos os bilhetes (disponíveis, reservados e comprados)
                </p>
              </div>

              <div
                onClick={() => setFormData({ ...formData, initialFilter: 'available' })}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  formData.initialFilter === 'available'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">Disponíveis</h4>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.initialFilter === 'available'
                      ? 'border-green-500 bg-green-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {formData.initialFilter === 'available' && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Mostra apenas os bilhetes disponíveis para compra
                </p>
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Opções adicionais
            </h3>

            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.requireEmail}
                  onChange={(e) => setFormData({ ...formData, requireEmail: e.target.checked })}
                  className="w-4 h-4 text-green-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-green-500 focus:ring-2"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  Exigir email dos compradores
                </span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.showRanking}
                  onChange={(e) => setFormData({ ...formData, showRanking: e.target.checked })}
                  className="w-4 h-4 text-green-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-green-500 focus:ring-2"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  Mostrar ranking de compradores
                </span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.showPercentage}
                  onChange={(e) => setFormData({ ...formData, showPercentage: e.target.checked })}
                  className="w-4 h-4 text-green-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-green-500 focus:ring-2"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  Mostrar porcentagem de vendas
                </span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white py-3 px-8 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <span>Finalizar</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

        {/* Modals */}
        <PromotionModal
          isOpen={showPromotionModal}
          onClose={() => setShowPromotionModal(false)}
          onSavePromotions={handleSavePromotions}
          initialPromotions={promotions}
          originalTicketPrice={campaign.ticket_price}
          campaignTotalTickets={campaign.total_tickets}
        />

        <PrizesModal
          isOpen={showPrizesModal}
          onClose={() => setShowPrizesModal(false)}
          prizes={prizes}
          onSavePrizes={handleSavePrizes}
        />
      </div>
    </div>
  );
};

export default CreateCampaignStep2Page;