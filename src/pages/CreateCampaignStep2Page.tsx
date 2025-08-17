import React, { useState, useEffect } from 'react';
import { ArrowRight, Upload, Plus, Trash2, Eye, ChevronDown, Gift } from 'lucide-react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useCampaignWithRefetch, useCampaigns } from '../hooks/useCampaigns';
import { useImageUpload } from '../hooks/useImageUpload';
import { ImageUpload } from '../components/ImageUpload';
import RichTextEditor from '../components/RichTextEditor';
import PromotionModal from '../components/PromotionModal';
import PrizesModal from '../components/PrizesModal';
import CountryPhoneSelect from '../components/CountryPhoneSelect';
import PublicationFeesModal from '../components/PublicationFeesModal';
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
  const { campaignId: paramsCampaignId } = useParams<{ campaignId: string }>();
  const { updateCampaign } = useCampaigns();
  
  // Extract campaign ID from URL
  const campaignId = new URLSearchParams(location.search).get('id') || paramsCampaignId;
  
  // Fetch campaign data using the hook
  const { campaign, loading: isLoading, refetch } = useCampaignWithRefetch(campaignId || '');

  // Basic campaign data (moved from Step1)
  const [basicFormData, setBasicFormData] = useState({
    title: '',
    ticketQuantity: '',
    ticketPrice: '0,00',
    drawMethod: '',
    phoneNumber: '',
  });

  const [selectedCountry, setSelectedCountry] = useState<Country>({
    code: 'BR',
    name: 'Brasil',
    dialCode: '+55',
    flag: '🇧🇷'
  });

  const [rawTicketPrice, setRawTicketPrice] = useState('');
  const [estimatedRevenue, setEstimatedRevenue] = useState(0);
  const [publicationTax, setPublicationTax] = useState(0);
  const [showFeesModal, setShowFeesModal] = useState(false);

  // Advanced campaign data
  const [formData, setFormData] = useState({
    description: '',
    drawDate: '',
    paymentDeadlineHours: 24,
    requireEmail: true,
    showRanking: false,
    minTicketsPerPurchase: 1,
    maxTicketsPerPurchase: 1000,
    initialFilter: 'all' as 'all' | 'available',
    campaignModel: 'automatic' as 'manual' | 'automatic',
    showPercentage: false,
    reservationTimeoutMinutes: 15
  });

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [showPrizesModal, setShowPrizesModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  
  // Check if campaign has more than 10,000 tickets
  const hasMoreThan10kTickets = campaign?.total_tickets && campaign.total_tickets > 10000;

  // Image upload hook
  const {
    images,
    uploading,
    uploadProgress,
    addImages,
    removeImage,
    reorderImages,
    uploadImages,
    setExistingImages
  } = useImageUpload();

  const drawMethods = [
    'Loteria Federal',
    'Sorteador.com.br',
    'Live no Instagram',
    'Live no Youtube',
    'Live no TikTok',
    'Outros'
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
    // Convert raw price (in cents) to reais for calculations
    const ticketPrice = parseFloat(price) / 100 || 0;
    const ticketQuantity = parseInt(quantity) || 0;
    const revenue = ticketPrice * ticketQuantity;
    const tax = calculatePublicationTax(revenue);
    
    setEstimatedRevenue(revenue);
    setPublicationTax(tax);
  };

  /**
   * Formats raw numeric input as Brazilian currency
   * Treats input as cents and converts to reais format
   * Examples: "1" -> "0,01", "100" -> "1,00", "100000" -> "1.000,00"
   */
  const formatCurrencyDisplay = (rawValue: string): string => {
    // Remove all non-numeric characters
    const numericValue = rawValue.replace(/\D/g, '');
    
    // Handle empty input
    if (!numericValue) return '';
    
    // Convert to number (treating as cents)
    const cents = parseInt(numericValue, 10);
    
    // Convert cents to reais
    const reais = cents / 100;
    
    // Format as Brazilian currency without R$ prefix
    const formatted = reais.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return formatted;
  };

  const handleBasicPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Extract only numeric characters
    const numericValue = inputValue.replace(/\D/g, '');
    
    // Store raw numeric value for calculations
    setRawTicketPrice(numericValue);
    
    // Format for display
    const formattedValue = formatCurrencyDisplay(numericValue);
    
    setBasicFormData({ ...basicFormData, ticketPrice: formattedValue });
    
    // Update calculations using raw value (in cents)
    updateCalculations(numericValue, basicFormData.ticketQuantity);
  };

  const handleBasicQuantityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const quantity = e.target.value;
    setBasicFormData({ ...basicFormData, ticketQuantity: quantity });
    updateCalculations(rawTicketPrice, quantity);
  };

  // Format currency for display with Brazilian formatting
  const formatCurrencyForDisplay = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Load campaign data when component mounts or campaign changes
  useEffect(() => {
    console.log('🔄 [DEBUG] Loading campaign data:', campaign);
    if (campaign) {
      console.log('📊 [DEBUG] Campaign model from DB:', campaign.campaign_model);
      console.log('📊 [DEBUG] Min tickets from DB:', campaign.min_tickets_per_purchase);
      console.log('📊 [DEBUG] Max tickets from DB:', campaign.max_tickets_per_purchase);
      
      // Load basic campaign data
      const loadedTicketPriceCents = (campaign.ticket_price * 100).toFixed(0);
      setRawTicketPrice(loadedTicketPriceCents);

      // Extract phone number parts
      const phoneNumberParts = campaign.phone_number?.split(' ') || [];
      const dialCode = phoneNumberParts[0] || '+55';
      const phoneNumber = phoneNumberParts.slice(1).join(' ') || '';

      // Find matching country
      const countries = [
        { code: 'BR', name: 'Brasil', dialCode: '+55', flag: '🇧🇷' },
        { code: 'US', name: 'Estados Unidos', dialCode: '+1', flag: '🇺🇸' },
        { code: 'CA', name: 'Canadá', dialCode: '+1', flag: '🇨🇦' },
        { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
        { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱' },
        { code: 'CO', name: 'Colômbia', dialCode: '+57', flag: '🇨🇴' },
        { code: 'PE', name: 'Peru', dialCode: '+51', flag: '🇵🇪' },
        { code: 'UY', name: 'Uruguai', dialCode: '+598', flag: '🇺🇾' },
        { code: 'PY', name: 'Paraguai', dialCode: '+595', flag: '🇵🇾' },
        { code: 'BO', name: 'Bolívia', dialCode: '+591', flag: '🇧🇴' },
        { code: 'EC', name: 'Equador', dialCode: '+593', flag: '🇪🇨' },
        { code: 'VE', name: 'Venezuela', dialCode: '+58', flag: '🇻🇪' },
        { code: 'MX', name: 'México', dialCode: '+52', flag: '🇲🇽' },
        { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹' },
        { code: 'ES', name: 'Espanha', dialCode: '+34', flag: '🇪🇸' }
      ];

      const matchingCountry = countries.find(c => c.dialCode === dialCode) || {
        code: 'BR',
        name: 'Brasil',
        dialCode: '+55',
        flag: '🇧🇷'
      };
      setSelectedCountry(matchingCountry);

      // Set basic form data
      setBasicFormData({
        title: campaign.title,
        ticketQuantity: campaign.total_tickets.toString(),
        ticketPrice: formatCurrencyDisplay(loadedTicketPriceCents),
        drawMethod: campaign.draw_method || '',
        phoneNumber: phoneNumber,
      });

      // Update calculations for existing campaign
      updateCalculations(loadedTicketPriceCents, campaign.total_tickets.toString());
      
      // Ensure maxTicketsPerPurchase doesn't exceed total_tickets
      const maxAllowed = campaign.total_tickets;
      const currentMax = campaign.max_tickets_per_purchase ?? 1000;
      const adjustedMax = Math.min(currentMax, maxAllowed);
      
      console.log('🔧 [DEBUG] Max tickets adjustment:', {
        totalTickets: campaign.total_tickets,
        currentMax,
        adjustedMax
      });
      
      setFormData({
        description: campaign.description || '',
        drawDate: campaign.draw_date || '',
        paymentDeadlineHours: campaign.payment_deadline_hours || 24,
        requireEmail: campaign.require_email ?? true,
        showRanking: campaign.show_ranking ?? false,
        minTicketsPerPurchase: campaign.min_tickets_per_purchase ?? 1,
        maxTicketsPerPurchase: Math.min(campaign.max_tickets_per_purchase ?? 20000, maxAllowed),
        initialFilter: (campaign.initial_filter as 'all' | 'available') || 'all',
        campaignModel: campaign.campaign_model || 'automatic',
        showPercentage: campaign.show_percentage ?? false,
        reservationTimeoutMinutes: campaign.reservation_timeout_minutes ?? 15
      });
      
      console.log('✅ [DEBUG] Form data set:', {
        campaignModel: campaign.campaign_model || 'automatic',
        minTicketsPerPurchase: campaign.min_tickets_per_purchase ?? 1,
        maxTicketsPerPurchase: adjustedMax
      });

      // Load existing images
      if (campaign.prize_image_urls && campaign.prize_image_urls.length > 0) {
        setExistingImages(campaign.prize_image_urls);
      }

      // Load existing promotions
      if (campaign.promotions) {
        setPromotions(campaign.promotions || []);
      }

      // Load existing prizes
      if (campaign.prizes) {
        setPrizes(campaign.prizes as Prize[]);
      }
    }
  }, [campaign, setExistingImages]);

  const validateBasicForm = () => {
    const newErrors: Record<string, string> = {};

    if (!basicFormData.title.trim()) {
      newErrors.title = 'Título é obrigatório';
    } else if (basicFormData.title.length < 3) {
      newErrors.title = 'Título deve ter pelo menos 3 caracteres';
    }

    if (!basicFormData.ticketQuantity) {
      newErrors.ticketQuantity = 'Quantidade de cotas é obrigatória';
    }

    if (!rawTicketPrice || rawTicketPrice === '0') {
      newErrors.ticketPrice = 'Preço da cota é obrigatório';
    }

    if (!basicFormData.drawMethod) {
      newErrors.drawMethod = 'Método de sorteio é obrigatório';
    }

    if (!basicFormData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Número de celular é obrigatório';
    } else {
      // Validate phone number format based on country
      const numbers = basicFormData.phoneNumber.replace(/\D/g, '');
      if (selectedCountry.code === 'BR' && numbers.length !== 11) {
        newErrors.phoneNumber = 'Número de celular deve ter 11 dígitos';
      } else if ((selectedCountry.code === 'US' || selectedCountry.code === 'CA') && numbers.length !== 10) {
        newErrors.phoneNumber = 'Número de telefone deve ter 10 dígitos';
      } else if (numbers.length < 7) {
        newErrors.phoneNumber = 'Número de telefone inválido';
      }
    }

    return newErrors;
  };

  // Manual save functionality
  const handleManualSave = async () => {
    if (!campaignId || loading) return;

    setLoading(true);
    setErrors({});

    // Validate basic form data
    const basicValidationErrors = validateBasicForm();

    // Validate advanced form data
    const advancedValidationErrors: Record<string, string> = {};

    // Validate min/max tickets per purchase
    if (formData.minTicketsPerPurchase <= 0) {
      advancedValidationErrors.minTicketsPerPurchase = 'Mínimo deve ser maior que 0';
    }

    if (formData.maxTicketsPerPurchase <= 0) {
      advancedValidationErrors.maxTicketsPerPurchase = 'Máximo deve ser maior que 0';
    }

    if (formData.minTicketsPerPurchase > formData.maxTicketsPerPurchase) {
      advancedValidationErrors.minTicketsPerPurchase = 'Mínimo deve ser menor ou igual ao máximo';
    }

    if (campaign && formData.maxTicketsPerPurchase > campaign.total_tickets) {
      advancedValidationErrors.maxTicketsPerPurchase = `Máximo não pode exceder o total de cotas (${campaign.total_tickets})`;
    }

    const allErrors = { ...basicValidationErrors, ...advancedValidationErrors };

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      setLoading(false);
      return;
    }

    try {
      console.log('💾 [DEBUG] Saving campaign data...');
      console.log('📝 [DEBUG] Basic form data:', basicFormData);
      console.log('📝 [DEBUG] Advanced form data:', formData);
      
      // Upload images first if there are any new ones
      let imageUrls: string[] = [];
      if (images.length > 0) {
        console.log('📸 [DEBUG] Uploading images...');
        imageUrls = await uploadImages(campaign?.user_id || '');
        console.log('✅ [DEBUG] Images uploaded:', imageUrls);
      }

      // Convert basic form data for database
      const ticketPrice = parseFloat(rawTicketPrice) / 100; // Convert cents to reais
      const ticketQuantity = parseInt(basicFormData.ticketQuantity);

      // Prepare update payload with both basic and advanced data
      const payload = {
        id: campaignId,
        // Basic data from the moved fields
        title: basicFormData.title,
        ticket_price: ticketPrice,
        total_tickets: ticketQuantity,
        draw_method: basicFormData.drawMethod,
        phone_number: `${selectedCountry.dialCode} ${basicFormData.phoneNumber}`,
        // Advanced data
        description: formData.description,
        draw_date: formData.drawDate || null,
        payment_deadline_hours: formData.paymentDeadlineHours,
        require_email: formData.requireEmail,
        show_ranking: formData.showRanking,
        min_tickets_per_purchase: formData.minTicketsPerPurchase,
        max_tickets_per_purchase: formData.maxTicketsPerPurchase,
        initial_filter: formData.initialFilter,
        campaign_model: formData.campaignModel,
        prize_image_urls: imageUrls.length > 0 ? imageUrls : campaign?.prize_image_urls || [],
        promotions: promotions,
        prizes: prizes,
        show_percentage: formData.showPercentage,
        reservation_timeout_minutes: formData.reservationTimeoutMinutes
      };

      console.log('📤 [DEBUG] Payload being sent:', payload);
      
      await updateCampaign(payload);
      console.log('✅ [DEBUG] Campaign updated successfully');
      
      // Refetch campaign data to ensure UI shows latest values
      console.log('🔄 [DEBUG] Refetching campaign data...');
      await refetch();
      console.log('✅ [DEBUG] Campaign data refetched');
      
      // Navigate to step 3 after successful save
      navigate(`/dashboard/create-campaign/step-3?id=${campaignId}`);
    } catch (error) {
      console.error('Error saving campaign:', error);
      setErrors({ submit: 'Erro ao salvar alterações. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    // Navigate to campaign page with preview data
    if (campaign?.slug) {
      window.open(`/c/${campaign.slug}`, '_blank');
    } else {
      window.open(`/c/${campaignId}`, '_blank');
    }
  };

  const handleSavePromotions = (newPromotions: Promotion[]) => {
    setPromotions(newPromotions);
  };

  const handleSavePrizes = (newPrizes: Prize[]) => {
    setPrizes(newPrizes);
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-6 rounded-lg border border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
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
        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Editar campanha
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {campaign.title}
            </p>
          </div>
        </div>

                    errors.title ? 'border-red-500' : 'border-green-500'
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
                      value={basicFormData.ticketQuantity}
                      onChange={handleBasicQuantityChange}
                      className={\`w-full appearance-none px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200 ${
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
                    value={basicFormData.ticketPrice}
                    onChange={handleBasicPriceChange}
                    placeholder="R$ 0,00"
                    className={\`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200 ${
                      errors.ticketPrice ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    required
                  />
                  {errors.ticketPrice && (
                    <p className="text-red-500 text-sm mt-1">{errors.ticketPrice}</p>
                  )}
                  
                  {/* Real-time Tax Display */}
                  {rawTicketPrice && basicFormData.ticketQuantity && (
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
                    value={basicFormData.drawMethod}
                    onChange={(e) => setBasicFormData({ ...basicFormData, drawMethod: e.target.value })}
                    className={\`w-full appearance-none px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200 ${
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
                phoneNumber={basicFormData.phoneNumber}
                onPhoneChange={(phone) => setBasicFormData({ ...basicFormData, phoneNumber: phone })}
                placeholder="Número de telefone"
                error={errors.phoneNumber}
              />

              {/* Publication Tax Section */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Taxas de publicação
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowFeesModal(true)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
                  >
                    Ver taxas
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300">Taxa de publicação</span>
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      - {formatCurrencyForDisplay(publicationTax)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300">Arrecadação estimada</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      + {formatCurrencyForDisplay(estimatedRevenue)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Images Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Imagens do Prêmio
            </h2>
            <ImageUpload
              images={images}
              uploading={uploading}
              uploadProgress={uploadProgress}
              onAddImages={addImages}
              onRemoveImage={removeImage}
              onReorderImage={reorderImages}
            />
          </div>

          {/* Description Section with Rich Text Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descrição / Regulamento
            </label>
            <RichTextEditor
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="Digite a descrição da sua campanha..."
              error={errors.description}
            />
          </div>

          {/* Campaign Model Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Modelo
            </label>
            
            {/* Alert message for campaigns with more than 10k tickets */}
            {hasMoreThan10kTickets && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-sm font-bold">!</span>
                  </div>
                  <div>
                    <p className="text-blue-800 dark:text-blue-200 text-sm font-medium mb-1">
                      Seleção automática obrigatória
                    </p>
                    <p className="text-blue-700 dark:text-blue-300 text-sm">
                      Ao ultrapassar 10.000 cotas, o sistema mudará automaticamente o modelo da campanha para seleção aleatória de cotas.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              {/* Automatic Model Option */}
              <div
                onClick={() => !hasMoreThan10kTickets && setFormData({ ...formData, campaignModel: 'automatic' })}
                className={\`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  formData.campaignModel === 'automatic'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* Visual Mockup for Automatic Selection */}
                  <div className="flex-shrink-0 bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600 shadow-sm">
                    <div className="w-48 space-y-3">
                      {/* Header */}
                      <div className="text-center">
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                          Quantidade de bilhetes
                        </div>
                      </div>
                      
                      {/* Quick Add Buttons */}
                      <div className="grid grid-cols-4 gap-1">
                        {['+1', '+5', '+15', '+150'].map((btn, idx) => (
                          <div key={idx} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs py-1 px-2 rounded text-center">
                            {btn}
                          </div>
                        ))}
                      </div>
                      
                      {/* Quantity Selector */}
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400">-</span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm font-medium text-gray-900 dark:text-white">
                          5
                        </div>
                        <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400">+</span>
                        </div>
                      </div>
                      
                      {/* Total Display */}
                      <div className="text-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">R$ 5,00</div>
                      </div>
                      
                      {/* Action Button */}
                      <div className="bg-blue-500 text-white text-xs py-2 px-3 rounded text-center font-medium">
                        Seleção aleatória
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Sistema escolhe as cotas aleatoriamente
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      O cliente escolhe a quantidade e o sistema sorteia os números automaticamente
                    </p>
                  </div>
                  <div className={\`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.campaignModel === 'automatic'
                      ? 'border-purple-500 bg-purple-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {formData.campaignModel === 'automatic' && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>

              {/* Manual Model Option */}
              <div
                onClick={() => {
                  if (!hasMoreThan10kTickets) {
                    setFormData({ ...formData, campaignModel: 'manual' });
                  }
                }}
                className={\`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  hasMoreThan10kTickets
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 opacity-60 cursor-not-allowed'
                    : 
                  formData.campaignModel === 'manual'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* Visual Mockup for Manual Selection */}
                  <div className="flex-shrink-0 bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600 shadow-sm">
                    <div className="w-48 space-y-3">
                      {/* Header */}
                      <div className="text-center">
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                          Visualização dos bilhetes
                        </div>
                      </div>
                      
                      {/* Filter Buttons */}
                      <div className="flex justify-center space-x-1">
                        <div className="bg-gray-600 text-white text-xs py-1 px-2 rounded">
                          Todos <span className="bg-gray-500 px-1 rounded">100</span>
                        </div>
                        <div className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs py-1 px-2 rounded">
                          Disponíveis <span className="bg-gray-400 text-white px-1 rounded">95</span>
                        </div>
                      </div>
                      
                      {/* Numbers Grid */}
                      <div className="grid grid-cols-8 gap-1">
                        {Array.from({ length: 32 }, (_, i) => {
                          const number = i + 1;
                          const isSelected = [5, 12, 23].includes(number);
                          const isPurchased = [8, 15].includes(number);
                          const isReserved = [19, 27].includes(number);
                          
                          return (
                            <div
                              key={number}
                              className={\`w-5 h-5 text-xs flex items-center justify-center rounded text-white font-medium ${
                                isSelected
                                  ? 'bg-blue-500'
                                  : isPurchased
                                  ? 'bg-green-500'
                                  : isReserved
                                  ? 'bg-orange-500'
                                  : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {number.toString().padStart(2, '0')}
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Selection Info */}
                      <div className="text-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Meus N°: 05, 12, 23</div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">Total: R$ 3,00</div>
                      </div>
                      
                      {/* Action Button */}
                      <div className="bg-green-500 text-white text-xs py-2 px-3 rounded text-center font-medium">
                        Seleção manual
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Cliente escolhe as cotas manualmente
                    </h3>
                    <p className={\`text-sm ${
                      hasMoreThan10kTickets 
                        ? 'text-gray-400 dark:text-gray-500' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {hasMoreThan10kTickets 
                        ? 'Indisponível para campanhas com mais de 10.000 cotas por questões de performance'
                        : 'O cliente visualiza todas as cotas e escolhe quais quer comprar'
                      }
                    </p>
                    {hasMoreThan10kTickets && (
                      <div className="mt-2 text-xs text-orange-600 dark:text-orange-400 font-medium">
                        ⚠️ Opção desabilitada para otimização de performance
                      </div>
                    )}
                  </div>
                  <div className={\`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.campaignModel === 'manual' && !hasMoreThan10kTickets
                      ? 'border-purple-500 bg-purple-500'
                      : hasMoreThan10kTickets
                      ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {formData.campaignModel === 'manual' && !hasMoreThan10kTickets && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                    {hasMoreThan10kTickets && (
                      <div className="w-4 h-4 flex items-center justify-center">
                        <span className="text-orange-500 dark:text-orange-400 text-xs font-bold">⚠</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Promotions Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Promoções
              </h2>
              <button
                onClick={() => setShowPromotionModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar</span>
              </button>
            </div>

            {promotions.length > 0 ? (
              <div className="grid gap-3">
                {promotions.map((promo) => {
                  const originalValue = promo.ticketQuantity * (campaign?.ticket_price || 0);
                  const discountPercentage = Math.round(((originalValue - promo.discountedTotalValue) / originalValue) * 100);
                  
                  return (
                    <div
                      key={promo.id}
                      className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">🎁</div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {promo.ticketQuantity} bilhetes por R$ {(promo.discountedTotalValue || 0).toFixed(2).replace('.', ',')}
                          </div>
                          <div className="text-sm text-green-600 dark:text-green-400">
                            {discountPercentage}% de desconto
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setPromotions(prev => prev.filter(p => p.id !== promo.id))}
                        className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-4xl mb-2">🎁</div>
                <p className="text-gray-600 dark:text-gray-400">
                  Nenhuma promoção adicionada
                </p>
              </div>
            )}
          </div>

          {/* Prizes Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Prêmios
              </h2>
              <button
                onClick={() => setShowPrizesModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <Gift className="h-4 w-4" />
                <span>Adicionar</span>
              </button>
            </div>

            {prizes.length > 0 ? (
              <div className="space-y-3">
                {prizes.map((prize, index) => (
                  <div
                    key={prize.id}
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {index + 1}°
                      </div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {prize.name}
                      </div>
                    </div>
                    <button
                      onClick={() => setPrizes(prev => prev.filter(p => p.id !== prize.id))}
                      className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-4xl mb-2">🏆</div>
                <p className="text-gray-600 dark:text-gray-400">
                  Nenhum prêmio adicionado
                </p>
              </div>
            )}
          </div>

          {/* Advanced Settings */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Configurações Avançadas
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payment Deadline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prazo para pagamento (horas)
                </label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={formData.paymentDeadlineHours}
                  onChange={(e) => setFormData({ ...formData, paymentDeadlineHours: parseInt(e.target.value) || 24 })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200"
                />
              </div>

              {/* Min/Max Tickets */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mínimo de bilhetes por compra
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minTicketsPerPurchase}
                    onChange={(e) => setFormData({ ...formData, minTicketsPerPurchase: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200"
                  />
                  {errors.minTicketsPerPurchase && (
                    <p className="text-red-500 text-sm mt-1">{errors.minTicketsPerPurchase}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Máximo de bilhetes por compra
                  </label>
                  {campaign && (
                    <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-sm text-blue-800 dark:text-blue-200">
                      <span className="font-medium">Limite:</span> Máximo {campaign.total_tickets.toLocaleString('pt-BR')} bilhetes (total de cotas da campanha)
                    </div>
                  )}
                  <input
                    type="number"
                    min="1"
                    max={campaign?.total_tickets || 20000}
                    value={formData.maxTicketsPerPurchase}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      const maxAllowed = campaign?.total_tickets || 20000;
                      const adjustedValue = Math.min(value, maxAllowed);
                      
                      console.log('🔢 [DEBUG] Max tickets input change:', {
                        inputValue: value,
                        maxAllowed,
                        adjustedValue
                      });
                      
                      setFormData({ ...formData, maxTicketsPerPurchase: adjustedValue });
                    }}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200"
                  />
                  {errors.maxTicketsPerPurchase && (
                    <p className="text-red-500 text-sm mt-1">{errors.maxTicketsPerPurchase}</p>
                  )}
                  {campaign && formData.maxTicketsPerPurchase >= campaign.total_tickets && (
                    <p className="text-orange-600 dark:text-orange-400 text-sm mt-1 flex items-center space-x-1">
                      <span>⚠️</span>
                      <span>Valor limitado ao total de cotas da campanha ({campaign.total_tickets.toLocaleString('pt-BR')})</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="mt-6 space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.requireEmail}
                  onChange={(e) => setFormData({ ...formData, requireEmail: e.target.checked })}
                  className="w-4 h-4 text-purple-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                />
                <span className="text-gray-700 dark:text-gray-300">Exigir email do comprador</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.showRanking}
                  onChange={(e) => setFormData({ ...formData, showRanking: e.target.checked })}
                  className="w-4 h-4 text-purple-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                />
                <span className="text-gray-700 dark:text-gray-300">Mostrar ranking de compradores</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.showPercentage}
                  onChange={(e) => setFormData({ ...formData, showPercentage: e.target.checked })}
                  className="w-4 h-4 text-purple-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                />
                <span className="text-gray-700 dark:text-gray-300">Mostrar porcentagem de progresso</span>
              </label>

              {/* Reservation Timeout */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prazo para reserva expirar
                </label>
                <select
                  value={formData.reservationTimeoutMinutes}
                  onChange={(e) => setFormData({ ...formData, reservationTimeoutMinutes: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200"
                >
                  <option value={10}>10 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={60}>1 hora</option>
                  <option value={180}>3 horas</option>
                  <option value={720}>12 horas</option>
                  <option value={1440}>1 dia</option>
                  <option value={2880}>2 dias</option>
                  <option value={5760}>4 dias</option>
                </select>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Tempo que uma cota fica reservada antes de ser liberada automaticamente
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4 pt-6">
            <button
              onClick={handlePreview}
              className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2"
            >
              <Eye className="h-5 w-5" />
              <span>Visualizar</span>
            </button>
            
            <button
              onClick={handleManualSave}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white py-3 px-8 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <span>Salvar alterações</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PromotionModal
        isOpen={showPromotionModal}
        onClose={() => setShowPromotionModal(false)}
        onSavePromotions={handleSavePromotions}
        initialPromotions={promotions}
        originalTicketPrice={campaign?.ticket_price || 0}
        campaignTotalTickets={campaign?.total_tickets || 0}
      />

      <PrizesModal
        isOpen={showPrizesModal}
        onClose={() => setShowPrizesModal(false)}
        prizes={prizes}
        onSavePrizes={handleSavePrizes}
        saving={loading}
      />

      <PublicationFeesModal
        isOpen={showFeesModal}
        onClose={() => setShowFeesModal(false)}
      />
    </div>
  );
};

export default CreateCampaignStep2Page;