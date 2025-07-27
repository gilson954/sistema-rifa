import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Upload, Plus, Trash2, Eye, ChevronDown, Gift } from 'lucide-react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useCampaign, useCampaigns } from '../hooks/useCampaigns';
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
  const { campaign, loading: isLoading } = useCampaign(campaignId || '');

  const [formData, setFormData] = useState({
    description: '',
    drawDate: '',
    paymentDeadlineHours: 24,
    requireEmail: true,
    showRanking: false,
    minTicketsPerPurchase: 1,
    maxTicketsPerPurchase: 20000,
    initialFilter: 'all' as 'all' | 'available',
    campaignModel: 'automatic' as 'manual' | 'automatic'
  });

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [showPrizesModal, setShowPrizesModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
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
    if (campaign) {
      // Force automatic model if more than 10k tickets
      const forcedModel = campaign.total_tickets > 10000 ? 'automatic' : campaign.campaign_model || 'automatic';
      
      setFormData({
        description: campaign.description || '',
        drawDate: campaign.draw_date || '',
        paymentDeadlineHours: campaign.payment_deadline_hours || 24,
        requireEmail: campaign.require_email ?? true,
        showRanking: campaign.show_ranking ?? false,
        minTicketsPerPurchase: campaign.min_tickets_per_purchase || 1,
        maxTicketsPerPurchase: campaign.max_tickets_per_purchase || 20000,
        initialFilter: (campaign.initial_filter as 'all' | 'available') || 'all',
        campaignModel: forcedModel
      });

      // Load existing images
      if (campaign.prize_image_urls && campaign.prize_image_urls.length > 0) {
        setExistingImages(campaign.prize_image_urls);
      }

      // Load existing promotions
      if (campaign.promotions) {
        setPromotions(campaign.promotions as Promotion[]);
      }

      // Load existing prizes
      if (campaign.prizes) {
        setPrizes(campaign.prizes as Prize[]);
      }

      // Reset unsaved changes flag when loading campaign data
      setHasUnsavedChanges(false);
    }
  }, [campaign, setExistingImages]);

  // Validação dos campos de bilhetes por compra
  const validateTicketLimits = () => {
    const newErrors: Record<string, string> = {};

    // Validação do mínimo de bilhetes
    if (formData.minTicketsPerPurchase <= 0) {
      newErrors.minTicketsPerPurchase = 'Mínimo deve ser maior que 0';
    }

    // Validação do máximo de bilhetes
    if (formData.maxTicketsPerPurchase <= 0) {
      newErrors.maxTicketsPerPurchase = 'Máximo deve ser maior que 0';
    }

    // Validação da relação entre mínimo e máximo
    if (formData.minTicketsPerPurchase > formData.maxTicketsPerPurchase) {
      newErrors.minTicketsPerPurchase = 'Mínimo não pode ser maior que o máximo';
    }

    // Validação em relação ao total de cotas da campanha
    if (campaign?.total_tickets && formData.maxTicketsPerPurchase > campaign.total_tickets) {
      newErrors.maxTicketsPerPurchase = `Máximo não pode exceder ${campaign.total_tickets.toLocaleString('pt-BR')} cotas`;
    }

    return newErrors;
  };

  // Manual save functionality
  const handleSaveChanges = async () => {
    if (!campaignId || saving) return;

    // Validar campos antes de salvar
    const validationErrors = validateTicketLimits();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return; // Não salva se houver erros de validação
    }

    setSaving(true);
    setErrors({}); // Limpa erros anteriores se validação passou

    try {
      // Upload images first if there are any new ones
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadImages(campaign?.user_id || '');
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
        prizes: prizes
      };

      const updatedCampaign = await updateCampaign(payload);
      
      // Atualizar formData com os dados salvos para evitar reversão
      if (updatedCampaign) {
        setFormData(prevFormData => ({
          ...prevFormData,
          minTicketsPerPurchase: updatedCampaign.min_tickets_per_purchase || 1,
          maxTicketsPerPurchase: updatedCampaign.max_tickets_per_purchase || 20000,
          paymentDeadlineHours: updatedCampaign.payment_deadline_hours || 24,
          requireEmail: updatedCampaign.require_email ?? true,
          showRanking: updatedCampaign.show_ranking ?? false,
          initialFilter: (updatedCampaign.initial_filter as 'all' | 'available') || 'all',
          campaignModel: updatedCampaign.campaign_model || 'automatic'
        }));
      }
      
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving campaign:', error);
      setErrors({ submit: 'Erro ao salvar alterações. Tente novamente.' });
    } finally {
      setSaving(false);
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

  const handleSaveAndContinue = async () => {
    // Save changes first
    await handleSaveChanges();
    
    // Only navigate if save was successful (no errors)
    if (Object.keys(errors).length === 0) {
      navigate(`/dashboard/create-campaign/step-3?id=${campaignId}`);
    }
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
    setHasUnsavedChanges(true);
  };

  const handleSavePrizes = (newPrizes: Prize[]) => {
    setPrizes(newPrizes);
    setHasUnsavedChanges(true);
  };

  // Track changes in form data
  const handleFormDataChange = (newFormData: typeof formData) => {
    setFormData(newFormData);
    setHasUnsavedChanges(true);
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

          {/* Auto-save indicator */}
          <div className="flex items-center space-x-4">
            {saving && (
              <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">Salvando alterações...</span>
              </div>
            )}
            {lastSaved && !saving && (
              <span className="text-sm text-green-600 dark:text-green-400">
                Salvo às {lastSaved.toLocaleTimeString()}
              </span>
            )}
            {hasUnsavedChanges && !saving && (
              <span className="text-sm text-orange-600 dark:text-orange-400 flex items-center space-x-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Alterações não salvas</span>
              </span>
            )}
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
              onChange={(value) => handleFormDataChange({ ...formData, description: value })}
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
                onClick={() => !hasMoreThan10kTickets && handleFormDataChange({ ...formData, campaignModel: 'automatic' })}
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
                onClick={() => !hasMoreThan10kTickets && handleFormDataChange({ ...formData, campaignModel: 'manual' })}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  hasMoreThan10kTickets
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                    : 
                  formData.campaignModel === 'manual'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer'
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
                        ? 'Indisponível para campanhas com mais de 10.000 cotas'
                        : 'O cliente visualiza todas as cotas e escolhe quais quer comprar'
                      }
                    </p>
                    {hasMoreThan10kTickets && (
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">
                        Desabilitado automaticamente
                      </div>
                    )}
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.campaignModel === 'manual' && !hasMoreThan10kTickets
                      ? 'border-purple-500 bg-purple-500'
                      : hasMoreThan10kTickets
                      ? 'border-gray-400 dark:border-gray-600 bg-gray-200 dark:bg-gray-700'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {formData.campaignModel === 'manual' && !hasMoreThan10kTickets && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                    {hasMoreThan10kTickets && (
                      <div className="w-3 h-3 flex items-center justify-center">
                        <span className="text-gray-500 dark:text-gray-400 text-xs">✕</span>
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
                  const discountPercentage = Math.round(((originalValue - promo.totalValue) / originalValue) * 100);
                  
                  return (
                    <div
                      key={promo.id}
                      className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">🎁</div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {promo.ticketQuantity} bilhetes por R$ {promo.totalValue.toFixed(2).replace('.', ',')}
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
                  onChange={(e) => handleFormDataChange({ ...formData, paymentDeadlineHours: parseInt(e.target.value) || 24 })}
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
                    max={formData.maxTicketsPerPurchase}
                    value={formData.minTicketsPerPurchase}
                    onChange={(e) => handleFormDataChange({ ...formData, minTicketsPerPurchase: parseInt(e.target.value) || 1 })}
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
                  <input
                    type="number"
                    min={formData.minTicketsPerPurchase}
                    max="20000"
                    value={formData.maxTicketsPerPurchase}
                    onChange={(e) => handleFormDataChange({ ...formData, maxTicketsPerPurchase: parseInt(e.target.value) || 20000 })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200"
                  />
                  {errors.maxTicketsPerPurchase && (
                    <p className="text-red-500 text-sm mt-1">{errors.maxTicketsPerPurchase}</p>
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
                  onChange={(e) => handleFormDataChange({ ...formData, requireEmail: e.target.checked })}
                  className="w-4 h-4 text-purple-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                />
                <span className="text-gray-700 dark:text-gray-300">Exigir email do comprador</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.showRanking}
                  onChange={(e) => handleFormDataChange({ ...formData, showRanking: e.target.checked })}
                  className="w-4 h-4 text-purple-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                />
                <span className="text-gray-700 dark:text-gray-300">Mostrar ranking de compradores</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center pt-6">
            <button
              onClick={handleSaveAndContinue}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white py-3 px-8 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Salvando...</span>
                </>
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
        saving={saving}
      />
    </div>
  );
};

export default CreateCampaignStep2Page;