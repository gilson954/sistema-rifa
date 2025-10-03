import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  X, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  ChevronDown, 
  Calendar,
  Loader2, // Adicionado para Loading
  Check, // Adicionado para Etapa Concluída
  Image, // Adicionado para Card Imagens
  FileText, // Adicionado para Card Descrição
  Gift, // Adicionado para Card Detalhes
  Settings, // Adicionado para Card Configurações
  Tag // Adicionado para Promoções
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCampaignWithRefetch } from '../hooks/useCampaigns';
import { CampaignAPI } from '../lib/api/campaigns';
import { ImageUpload } from '../components/ImageUpload';
import { useImageUpload } from '../hooks/useImageUpload';
import RichTextEditor from '../components/RichTextEditor';
import PromotionModal from '../components/PromotionModal';
import PrizesModal from '../components/PrizesModal';
import { Promotion, Prize } from '../types/promotion';
import DatePicker from 'react-datepicker';
import { registerLocale, setDefaultLocale } from 'react-datepicker';
import { ptBR } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';

// Register Portuguese locale
registerLocale('pt-BR', ptBR);
setDefaultLocale('pt-BR');

// Componente auxiliar para aprimorar o DatePicker
const CustomDatePickerInput = React.forwardRef(({ value, onClick, isInvalid, placeholder }: any, ref: any) => (
  <button 
    className={`w-full text-left py-2.5 px-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-all duration-200 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 flex items-center justify-between ${isInvalid ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
    onClick={onClick} 
    ref={ref}
  >
    <span className={!value ? 'text-gray-400 dark:text-gray-500' : ''}>
      {value || placeholder}
    </span>
    <Calendar className="h-4 w-4 text-gray-400" />
  </button>
));


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

  // Form state (Lógica Original Preservada)
  const [formData, setFormData] = useState({
    description: '',
    requireEmail: true,
    showRanking: false,
    minTicketsPerPurchase: 1,
    maxTicketsPerPurchase: 1000,
    campaignModel: 'automatic' as 'manual' | 'automatic',
    showPercentage: false,
    reservationTimeoutMinutes: 30,
    drawDate: null as Date | null,
    showDrawDateOption: 'no-date' as 'show-date' | 'no-date'
  });

  // State for inline date picker visibility
  const [showInlineDatePicker, setShowInlineDatePicker] = useState(false);

  // Modal states
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [showPrizesModal, setShowPrizesModal] = useState(false);
  
  // Promotions and prizes state
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // NEW: Campaign model validation error state
  const [campaignModelError, setCampaignModelError] = useState<string>('');

  // Load existing campaign data when component mounts
  useEffect(() => {
    if (campaign) {
      setFormData({
        description: campaign.description || '',
        requireEmail: campaign.require_email ?? true,
        showRanking: campaign.show_ranking ?? false,
        minTicketsPerPurchase: campaign.min_tickets_per_purchase || 1,
        maxTicketsPerPurchase: campaign.max_tickets_per_purchase || 1000,
        campaignModel: campaign.campaign_model || 'automatic',
        showPercentage: campaign.show_percentage ?? false,
        reservationTimeoutMinutes: campaign.reservation_timeout_minutes || 30,
        drawDate: campaign.draw_date ? new Date(campaign.draw_date) : null,
        showDrawDateOption: campaign.draw_date ? 'show-date' : 'no-date'
      });

      // Set inline date picker visibility based on existing draw date
      setShowInlineDatePicker(!!campaign.draw_date);

      // Load existing images
      if (campaign.prize_image_urls && campaign.prize_image_urls.length > 0) {
        setExistingImages(campaign.prize_image_urls);
      }

      // Load existing promotions
      if (campaign.promotions && Array.isArray(campaign.promotions)) {
        setPromotions(campaign.promotions);
      }

      // Load existing prizes
      if (campaign.prizes && Array.isArray(campaign.prizes)) {
        setPrizes(campaign.prizes);
      }
    }
  }, [campaign, setExistingImages]);

  // NEW: Validate campaign model when it changes or when total_tickets is available
  useEffect(() => {
    if (campaign?.total_tickets && formData.campaignModel === 'manual' && campaign.total_tickets > 10000) {
      setCampaignModelError('O modelo manual não é permitido para campanhas com mais de 10.000 cotas.');
    } else {
      setCampaignModelError('');
    }
  }, [formData.campaignModel, campaign?.total_tickets]);

  const handleGoBack = () => {
    // Redireciona para Step 1
    navigate(`/dashboard/create-campaign/step-1?id=${campaignId}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      const numValue = parseInt(value) || 0;
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else if (name === 'reservationTimeoutMinutes') {
      // Convert string value to integer for reservation timeout
      const numValue = parseInt(value) || 15; // Default to 15 if parsing fails
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // NEW: Handle campaign model validation
      if (name === 'campaignModel') {
        if (campaign?.total_tickets && value === 'manual' && campaign.total_tickets > 10000) {
          setCampaignModelError('O modelo manual não é permitido para campanhas com mais de 10.000 cotas.');
        } else {
          setCampaignModelError('');
        }
      }
    }
  };

  const handleDescriptionChange = (value: string) => {
    // Store the raw value from the editor without aggressive normalization
    setFormData(prev => ({ ...prev, description: value }));
  };

  // Simple function to check if editor content is effectively empty
  const isEditorContentEmpty = (content: string): boolean => {
    if (!content) return true;
    
    // Remove common empty HTML tags and whitespace
    const cleanContent = content
      .replace(/<p><br><\/p>/g, '')
      .replace(/<p><\/p>/g, '')
      .replace(/<br\s*\/?>/g, '')
      .replace(/&nbsp;/g, '')
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .trim();
    
    return cleanContent === '';
  };

  const handleDrawDateOptionChange = (option: 'show-date' | 'no-date') => {
    setFormData(prev => ({
      ...prev,
      showDrawDateOption: option,
      drawDate: option === 'no-date' ? null : prev.drawDate
    }));
    
    if (option === 'show-date') {
      setShowInlineDatePicker(true);
      // Initialize with current date if no date is set
      if (!formData.drawDate) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(20, 0, 0, 0); // Default to 8 PM
        setFormData(prev => ({ ...prev, drawDate: tomorrow }));
      }
    } else {
      setShowInlineDatePicker(false);
    }
  };

  const handleDrawDateChange = (date: Date | null) => {
    setFormData(prev => ({ ...prev, drawDate: date }));
  };

  const handleSavePromotions = (newPromotions: Promotion[]) => {
    setPromotions(newPromotions);
  };

  const handleSavePrizes = (newPrizes: Prize[]) => {
    setPrizes(newPrizes);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.minTicketsPerPurchase > formData.maxTicketsPerPurchase) {
      newErrors.minTicketsPerPurchase = 'Mínimo deve ser menor ou igual ao máximo';
    }

    if (formData.maxTicketsPerPurchase > (campaign?.total_tickets || 0)) {
      newErrors.maxTicketsPerPurchase = 'Máximo não pode ser maior que o total de cotas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // NEW: Check for campaign model validation error
    if (campaignModelError) {
      return; // Don't submit if there's a validation error
    }
    
    if (!validateForm() || !campaignId) {
      return;
    }

    setLoading(true);

    try {
      // Upload images first if there are any
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadImages(campaign?.user_id || '');
      }

      // Normalize description for database storage
      const normalizedDescription = isEditorContentEmpty(formData.description) 
        ? '' 
        : formData.description;

      const updateData = {
        id: campaignId,
        description: normalizedDescription,
        prize_image_urls: imageUrls.length > 0 ? imageUrls : campaign?.prize_image_urls || [],
        require_email: formData.requireEmail,
        show_ranking: formData.showRanking,
        min_tickets_per_purchase: formData.minTicketsPerPurchase,
        max_tickets_per_purchase: formData.maxTicketsPerPurchase,
        campaign_model: formData.campaignModel,
        total_tickets: campaign.total_tickets,
        promotions: promotions,
        prizes: prizes,
        show_percentage: formData.showPercentage,
        reservation_timeout_minutes: formData.reservationTimeoutMinutes,
        draw_date: formData.showDrawDateOption === 'show-date' && formData.drawDate 
          ? formData.drawDate.toISOString() 
          : null,
        show_draw_date: formData.showDrawDateOption === 'show-date'
      };

      // DEBUG: Log reservation timeout value being sent to API
      console.log('🔧 [STEP2 DEBUG] Sending reservation_timeout_minutes to API:', formData.reservationTimeoutMinutes);
      console.log('🔧 [STEP2 DEBUG] Full updateData:', updateData);

      const { data: updatedCampaign, error } = await CampaignAPI.updateCampaign(updateData);

      if (error) {
        console.error('Error updating campaign:', error);
        if (error.code === 'VALIDATION_ERROR') {
          setErrors({ submit: error.message });
        } else {
          setErrors({ submit: 'Erro ao atualizar campanha. Tente novamente.' });
        }
        return;
      }

      if (updatedCampaign) {
        // Navegação original para Step 3 (Publicação)
        navigate(`/dashboard/create-campaign/step-3?id=${campaignId}`);
      }
    } catch (error) {
      console.error('Error updating campaign:', error);
      setErrors({ submit: 'Erro ao atualizar campanha. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

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

  if (campaignLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-xl">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-3" />
          <p className="text-gray-700 dark:text-gray-300 font-medium">Carregando dados da campanha...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-6 rounded-lg border border-gray-200 dark:border-gray-800">
        <p className="text-center text-gray-500 dark:text-gray-400">Campanha não encontrada.</p>
      </div>
    );
  }

  // NEW: Check if form is valid (no validation errors)
  const isFormValid = !campaignModelError && Object.keys(errors).length === 0;

  return (
    // Container Modernizado (fundo de página)
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Step Indicator (Modernized Header) */}
        <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 text-center">
            Finalizar Campanha: <span className="text-purple-600 dark:text-purple-400">{campaign.title}</span>
          </h1>
          <div className="flex justify-center items-center space-x-4 pt-2 border-t border-gray-100 dark:border-gray-700/50">
            {/* Step 1: Concluída */}
            <div className="flex items-center text-green-600 dark:text-green-400 space-x-1">
              <Check className="h-5 w-5" />
              <span className="text-sm font-semibold">Etapa 1: Base</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            {/* Step 2: Atual */}
            <div className="flex items-center text-purple-600 dark:text-purple-400 space-x-1">
              <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                 <span className="text-xs font-bold">2</span>
              </div>
              <span className="text-sm font-bold">Etapa 2: Detalhes</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            {/* Step 3: Pendente */}
            <div className="flex items-center text-gray-500 dark:text-gray-400 space-x-1">
              <div className="w-6 h-6 rounded-full border border-gray-400 flex items-center justify-center">
                 <span className="text-xs font-bold">3</span>
              </div>
              <span className="text-sm">Etapa 3: Publicação</span>
            </div>
          </div>
        </div>

        {/* Main Content Form */}
        <form onSubmit={handleSubmit} className="space-y-6"> 
          
          {/* Error Message */}
          {(errors.submit || campaignModelError) && (
            <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-xl dark:bg-red-900/30 dark:text-red-300 flex items-start space-x-3 shadow-md border border-red-200 dark:border-red-800">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="font-medium">{errors.submit || campaignModelError}</p>
            </div>
          )}

          {/* Card 1: Imagens do Prêmio */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="flex items-center text-xl font-bold text-gray-900 dark:text-white mb-4 border-b pb-2 border-gray-100 dark:border-gray-700/50">
              <Image className="h-6 w-6 mr-3 text-purple-600 dark:text-purple-400" />
              1. Imagens do Prêmio
            </h2>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Faça o upload de fotos de alta qualidade do seu prêmio. A primeira imagem será a capa da campanha.
            </p>

            <ImageUpload
              images={images}
              uploading={uploadingImages}
              uploadProgress={uploadProgress}
              onAddImages={addImages}
              onRemoveImage={removeImage}
              onReorderImage={reorderImages}
            />
            {uploadingImages && (
              <div className="mt-2 text-sm text-purple-600 dark:text-purple-400 font-medium">
                <Loader2 className="w-4 h-4 mr-1 inline-block animate-spin" />
                Carregando imagens... ({Math.round(uploadProgress)}%)
              </div>
            )}
          </div>

          {/* Card 2: Descrição da Campanha */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="flex items-center text-xl font-bold text-gray-900 dark:text-white mb-4 border-b pb-2 border-gray-100 dark:border-gray-700/50">
              <FileText className="h-6 w-6 mr-3 text-purple-600 dark:text-purple-400" />
              2. Descrição e Regulamento
            </h2>
            <RichTextEditor
              value={formData.description}
              onChange={handleDescriptionChange}
              placeholder="Descreva sua campanha, prêmio e regras..."
            />
          </div>

          {/* Card 3: Promoções e Prêmios */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="flex items-center text-xl font-bold text-gray-900 dark:text-white mb-4 border-b pb-2 border-gray-100 dark:border-gray-700/50">
              <Gift className="h-6 w-6 mr-3 text-purple-600 dark:text-purple-400" />
              3. Detalhes Adicionais (Opcional)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Promoções Section */}
              <div className="p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="flex items-center font-semibold text-gray-800 dark:text-gray-200">
                     <Tag className="h-4 w-4 mr-2 text-blue-500" />
                     Promoções ({promotions.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowPromotionModal(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium text-sm transition-colors duration-200 flex items-center space-x-1 shadow-md"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Gerenciar</span>
                  </button>
                </div>

                {promotions.length > 0 ? (
                  <div className="space-y-3">
                    {promotions.map((promo) => {
                      const originalValue = promo.ticketQuantity * (campaign?.ticket_price || 0);
                      const discountPercentage = originalValue > 0 ? Math.round((promo.fixedDiscountAmount / originalValue) * 100) : 0;
                      
                      return (
                        <div
                          key={promo.id}
                          className="flex items-center justify-between bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 text-sm font-bold text-gray-800 dark:text-gray-200">
                              <span className="text-purple-600 dark:text-purple-400">🎁</span>
                              <span>{promo.ticketQuantity} Cotas</span>
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 truncate">
                                <span className="line-through mr-1">{formatCurrency(originalValue)}</span>
                                <ArrowRight className="h-3 w-3 inline-block mx-0.5" />
                                <span className="text-green-600 dark:text-green-400 font-bold ml-1">
                                    {formatCurrency(promo.discountedTotalValue)}
                                </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                              <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
                                ({discountPercentage}% OFF)
                              </span>
                              <button type="button" onClick={() => setPromotions(prev => prev.filter(p => p.id !== promo.id))} className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors duration-200" > 
                                <Trash2 className="h-4 w-4" /> 
                              </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : ( 
                  <p className="text-gray-500 dark:text-gray-400 text-sm text-center">Nenhuma promoção ativa.</p>
                )}
              </div>

              {/* Prêmios Section */}
              <div className="p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                 <div className="flex items-center justify-between mb-4">
                  <h3 className="flex items-center font-semibold text-gray-800 dark:text-gray-200">
                     <Tag className="h-4 w-4 mr-2 text-green-500" />
                     Prêmios ({prizes.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowPrizesModal(true)}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium text-sm transition-colors duration-200 flex items-center space-x-1 shadow-md"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Gerenciar</span>
                  </button>
                </div>

                {prizes.length > 0 ? (
                  <div className="space-y-3">
                    {prizes.map((prize, index) => (
                      <div key={prize.id} className="flex items-center justify-between bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600" >
                        <div className="flex items-center space-x-3">
                          <span className="w-6 h-6 text-center text-sm font-bold bg-yellow-400 text-gray-900 rounded-full flex items-center justify-center flex-shrink-0"> 
                            {index + 1}° 
                          </span> 
                          <span className="text-gray-900 dark:text-white font-medium truncate"> {prize.name} </span> 
                        </div> 
                        <button type="button" onClick={() => setPrizes(prev => prev.filter(p => p.id !== prize.id))} className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors duration-200" > 
                          <Trash2 className="h-4 w-4" /> 
                        </button> 
                      </div> 
                    ))} 
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm text-center">Nenhum prêmio adicional listado.</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Card 4: Configurações */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="flex items-center text-xl font-bold text-gray-900 dark:text-white mb-4 border-b pb-2 border-gray-100 dark:border-gray-700/50">
              <Settings className="h-6 w-6 mr-3 text-purple-600 dark:text-purple-400" />
              4. Configurações Finais
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* Require Email */}
              <div className="flex items-start">
                <input
                  id="requireEmail"
                  type="checkbox"
                  name="requireEmail"
                  checked={formData.requireEmail}
                  onChange={handleInputChange}
                  className="h-5 w-5 mt-1 text-purple-600 border-gray-300 rounded focus:ring-purple-500 bg-gray-100 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="requireEmail" className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  Exigir e-mail do comprador
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-normal mt-0.5">Obrigatório para contato.</p>
                </label>
              </div>

              {/* Show Ranking */}
              <div className="flex items-start">
                <input
                  id="showRanking"
                  type="checkbox"
                  name="showRanking"
                  checked={formData.showRanking}
                  onChange={handleInputChange}
                  className="h-5 w-5 mt-1 text-purple-600 border-gray-300 rounded focus:ring-purple-500 bg-gray-100 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="showRanking" className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  Exibir ranking de compradores
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-normal mt-0.5">Mostra os maiores compradores.</p>
                </label>
              </div>
              
              {/* Show Percentage */}
              <div className="flex items-start">
                <input
                  id="showPercentage"
                  type="checkbox"
                  name="showPercentage"
                  checked={formData.showPercentage}
                  onChange={handleInputChange}
                  className="h-5 w-5 mt-1 text-purple-600 border-gray-300 rounded focus:ring-purple-500 bg-gray-100 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="showPercentage" className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  Exibir porcentagem de vendas
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-normal mt-0.5">Barra de progresso de cotas.</p>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 mt-6 border-t border-gray-100 dark:border-gray-700/50">
              
              {/* Min/Max Tickets */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Limite de Cotas por Compra
                </h3>
                
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label htmlFor="minTicketsPerPurchase" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Mínimo
                    </label>
                    <input
                      id="minTicketsPerPurchase"
                      type="number"
                      name="minTicketsPerPurchase"
                      value={formData.minTicketsPerPurchase}
                      onChange={handleInputChange}
                      min="1"
                      className={`w-full py-2.5 px-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 ${errors.minTicketsPerPurchase ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
                    />
                    {errors.minTicketsPerPurchase && (
                      <p className="text-xs text-red-500 mt-1">{errors.minTicketsPerPurchase}</p>
                    )}
                  </div>
                  <div className="flex-1">
                    <label htmlFor="maxTicketsPerPurchase" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Máximo
                    </label>
                    <input
                      id="maxTicketsPerPurchase"
                      type="number"
                      name="maxTicketsPerPurchase"
                      value={formData.maxTicketsPerPurchase}
                      onChange={handleInputChange}
                      min="1"
                      className={`w-full py-2.5 px-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 ${errors.maxTicketsPerPurchase ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
                    />
                    {errors.maxTicketsPerPurchase && (
                      <p className="text-xs text-red-500 mt-1">{errors.maxTicketsPerPurchase}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Reservation Timeout */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Tempo de Reserva
                </h3>
                <label htmlFor="reservationTimeoutMinutes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tempo máximo para pagamento (Selecione)
                </label>
                <div className="relative">
                  <select
                    id="reservationTimeoutMinutes"
                    name="reservationTimeoutMinutes"
                    value={formData.reservationTimeoutMinutes}
                    onChange={handleInputChange}
                    className="w-full py-2.5 px-3 pr-10 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 appearance-none transition-all duration-200"
                  >
                    {reservationTimeoutOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Campaign Model */}
              <div className="space-y-4">
                 <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Modelo de Campanha
                </h3>
                <label htmlFor="campaignModel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Selecione o tipo de geração de cotas
                </label>
                <div className="relative">
                  <select
                    id="campaignModel"
                    name="campaignModel"
                    value={formData.campaignModel}
                    onChange={handleInputChange}
                    className={`w-full py-2.5 px-3 pr-10 border rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 appearance-none transition-all duration-200 ${campaignModelError ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
                    disabled={!!campaignModelError} // Disable if error exists
                  >
                    <option value="automatic">Automático (Recomendado)</option>
                    <option value="manual">Manual (Escolha de Cotas)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
                {campaignModelError && (
                  <p className="text-xs text-red-500 mt-1 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {campaignModelError}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-gray-100 dark:border-gray-700/50">
               {/* Draw Date & Visibility */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Data de Sorteio
                </h3>
                
                {/* Radio Options for Date Visibility */}
                <div className="flex space-x-4">
                  <div className="flex items-center">
                    <input
                      id="show-date"
                      type="radio"
                      name="showDrawDateOption"
                      value="show-date"
                      checked={formData.showDrawDateOption === 'show-date'}
                      onChange={() => handleDrawDateOptionChange('show-date')}
                      className="h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="show-date" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                      Exibir data e hora
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="no-date"
                      type="radio"
                      name="showDrawDateOption"
                      value="no-date"
                      checked={formData.showDrawDateOption === 'no-date'}
                      onChange={() => handleDrawDateOptionChange('no-date')}
                      className="h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="no-date" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                      Não exibir data
                    </label>
                  </div>
                </div>
                
                {/* Date Picker Input (conditional rendering) */}
                {formData.showDrawDateOption === 'show-date' && (
                  <div className="relative max-w-sm">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Selecione a Data e Hora
                    </label>
                    <DatePicker
                      selected={formData.drawDate}
                      onChange={handleDrawDateChange}
                      locale="pt-BR"
                      showTimeSelect
                      timeFormat="p"
                      timeIntervals={15}
                      dateFormat="dd/MM/yyyy HH:mm"
                      placeholderText="Clique para selecionar a data e hora"
                      customInput={<CustomDatePickerInput isInvalid={!formData.drawDate} placeholder="Selecione a Data e Hora" />}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4">
            
            {/* Back Button */}
            <button
              type="button"
              onClick={handleGoBack}
              className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 flex items-center space-x-1 px-4 py-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Voltar para Etapa 1</span>
            </button>
            
            {/* Submit Button (Modernized gradient style) */}
            <button
              type="submit"
              disabled={loading || !isFormValid || uploadingImages}
              className={`
                px-8 py-3 rounded-xl font-bold transition-all duration-300 
                flex items-center space-x-3 shadow-lg hover:shadow-xl hover:scale-[1.01]
                ${loading || !isFormValid || uploadingImages 
                  ? 'bg-gray-400 dark:bg-gray-600 text-white disabled:cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                }
              `}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : uploadingImages ? (
                 <>
                  <Upload className="h-5 w-5" />
                  <span>Carregando Imagens...</span>
                </>
              ) : (
                <>
                  <span>Próxima Etapa: Publicação</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Promotion Modal (Original Component) */}
        <PromotionModal
          isOpen={showPromotionModal}
          onClose={() => setShowPromotionModal(false)}
          onSavePromotions={handleSavePromotions}
          initialPromotions={promotions}
          originalTicketPrice={campaign?.ticket_price || 0}
          campaignTotalTickets={campaign?.total_tickets || 0}
        />

        {/* Prizes Modal (Original Component) */}
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