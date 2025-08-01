import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Upload, Plus, Trash2, Eye, ChevronDown, Gift } from 'lucide-react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useCampaignWithRefetch, useCampaigns } from '../hooks/useCampaigns';
import { useImageUpload } from '../hooks/useImageUpload';
import { ImageUpload } from '../components/ImageUpload';
import RichTextEditor from '../components/RichTextEditor';
import PromotionModal from '../components/PromotionModal';
import PrizesModal from '../components/PrizesModal';
import { Promotion, Prize } from '../types/promotion';

const CreateCampaignStep2Page = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { campaignId: paramsCampaignId } = useParams<{ campaignId: string }>();
  const { updateCampaign } = useCampaigns();
  
  // Extract campaign ID from URL
  const campaignId = new URLSearchParams(location.search).get('id') || paramsCampaignId;
  
  // Fetch campaign data using the hook
  const { campaign, loading: isLoading, refetch } = useCampaignWithRefetch(campaignId || '');

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

  // Load campaign data when component mounts or campaign changes
  useEffect(() => {
    console.log('🔄 [DEBUG] Loading campaign data:', campaign);
    if (campaign) {
      console.log('📊 [DEBUG] Campaign model from DB:', campaign.campaign_model);
      console.log('📊 [DEBUG] Min tickets from DB:', campaign.min_tickets_per_purchase);
      console.log('📊 [DEBUG] Max tickets from DB:', campaign.max_tickets_per_purchase);
      
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

  // Manual save functionality
  const handleManualSave = async () => {
    if (!campaignId || loading) return;

    setLoading(true);
    setErrors({});

    // Validate form data before saving
    const validationErrors: Record<string, string> = {};

    // Validate min/max tickets per purchase
    if (formData.minTicketsPerPurchase <= 0) {
      validationErrors.minTicketsPerPurchase = 'Mínimo deve ser maior que 0';
    }

    if (formData.maxTicketsPerPurchase <= 0) {
      validationErrors.maxTicketsPerPurchase = 'Máximo deve ser maior que 0';
    }

    if (formData.minTicketsPerPurchase > formData.maxTicketsPerPurchase) {
      validationErrors.minTicketsPerPurchase = 'Mínimo deve ser menor ou igual ao máximo';
    }

    if (campaign && formData.maxTicketsPerPurchase > campaign.total_tickets) {
      validationErrors.maxTicketsPerPurchase = `Máximo não pode exceder o total de cotas (${campaign.total_tickets})`;
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      console.log('💾 [DEBUG] Saving campaign data...');
      console.log('📝 [DEBUG] Form data before save:', formData);
      
      // Upload images first if there are any new ones
      let imageUrls: string[] = [];
      if (images.length > 0) {
        console.log('📸 [DEBUG] Uploading images...');
        imageUrls = await uploadImages(campaign?.user_id || '');
        console.log('✅ [DEBUG] Images uploaded:', imageUrls);
      }

      // Prepare update payload
      const payload = {
        id: campaignId,
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

  const handleGoBack = () => {
    // Pass the campaignId back to step-1 if it exists
    if (campaignId) {
      navigate(`/dashboard/create-campaign/${campaignId}`);
    } else {
      navigate(`/dashboard/create-campaign`);
    }
  };

  const handleNext = () => {
    navigate(`/dashboard/create-campaign/step-3?id=${campaignId}`);
  };

  const handlePreview = () => {
    // Navigate to campaign page with preview data
    navigate(`/c/${campaignId}`, {
      state: {
        previewData: {
          ...campaign,
          description: formData.description,
          campaignModel: formData.campaignModel,
          promotions: promotions,
          prizes: prizes
        }
      }
    });
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
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
                {campaign.title}
              </p>
            </div>
          </div>

        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-700 dark:text-red-300 text-sm">{errors.submit}</p>
          </div>
        )}

        <div className="space-y-8">
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
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
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
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
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
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
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
                              className={`w-5 h-5 text-xs flex items-center justify-center rounded text-white font-medium ${
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
                    <p className={`text-sm ${
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
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
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
          <div className="flex justify-center pt-6">
            <button
              onClick={handleManualSave}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white py-3 px-8 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <span>Salvar alterações</span>
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
    </div>
  );
};

export default CreateCampaignStep2Page;