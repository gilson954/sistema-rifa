import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Upload, X, Plus, Trash2, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCampaignWithRefetch } from '../hooks/useCampaigns';
import { CampaignAPI } from '../lib/api/campaigns';
import RichTextEditor from '../components/RichTextEditor';
import { ImageUpload } from '../components/ImageUpload';
import { useImageUpload } from '../hooks/useImageUpload';
import PromotionModal from '../components/PromotionModal';
import PrizesModal from '../components/PrizesModal';
import { Promotion, Prize } from '../types/promotion';

const CreateCampaignStep2Page = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract campaign ID from URL
  const campaignId = new URLSearchParams(location.search).get('id');
  
  // Fetch campaign data using the hook
  const { campaign, loading: isLoading, refetch } = useCampaignWithRefetch(campaignId || '');

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
    description: '',
    drawDate: '',
    requireEmail: true,
    showRanking: false,
    minTicketsPerPurchase: 1,
    maxTicketsPerPurchase: 1000,
    initialFilter: 'all' as 'all' | 'available',
    showPercentage: false
  });

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [showPrizesModal, setShowPrizesModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load campaign data when it's available
  useEffect(() => {
    if (campaign) {
      setFormData({
        description: campaign.description || '',
        drawDate: campaign.draw_date ? new Date(campaign.draw_date).toISOString().slice(0, 16) : '',
        requireEmail: campaign.require_email ?? true,
        showRanking: campaign.show_ranking ?? false,
        minTicketsPerPurchase: campaign.min_tickets_per_purchase || 1,
        maxTicketsPerPurchase: campaign.max_tickets_per_purchase || 1000,
        initialFilter: campaign.initial_filter || 'all',
        showPercentage: campaign.show_percentage ?? false
      });

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

  const handleGoBack = () => {
    navigate(`/dashboard/create-campaign?id=${campaignId}`);
  };

  const handleNext = () => {
    navigate(`/dashboard/create-campaign/step-3?id=${campaignId}`);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.minTicketsPerPurchase < 1) {
      newErrors.minTicketsPerPurchase = 'Mínimo deve ser pelo menos 1';
    }

    if (formData.maxTicketsPerPurchase < 1) {
      newErrors.maxTicketsPerPurchase = 'Máximo deve ser pelo menos 1';
    }

    if (formData.minTicketsPerPurchase > formData.maxTicketsPerPurchase) {
      newErrors.minTicketsPerPurchase = 'Mínimo deve ser menor ou igual ao máximo';
    }

    if (campaign && formData.maxTicketsPerPurchase > campaign.total_tickets) {
      newErrors.maxTicketsPerPurchase = 'Máximo não pode ser maior que o total de cotas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !campaignId || !campaign) {
      return;
    }

    setSaving(true);

    try {
      // Upload images first if there are any
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadImages(campaign.user_id);
      }

      const updateData = {
        id: campaignId,
        description: formData.description || null,
        draw_date: formData.drawDate ? new Date(formData.drawDate).toISOString() : null,
        require_email: formData.requireEmail,
        show_ranking: formData.showRanking,
        min_tickets_per_purchase: formData.minTicketsPerPurchase,
        max_tickets_per_purchase: formData.maxTicketsPerPurchase,
        initial_filter: formData.initialFilter,
        show_percentage: formData.showPercentage,
        prize_image_urls: imageUrls.length > 0 ? imageUrls : campaign.prize_image_urls,
        promotions: promotions.length > 0 ? promotions : null,
        prizes: prizes.length > 0 ? prizes : null
      };

      console.log('🔧 [DEBUG] Saving campaign with data:', updateData);

      const updatedCampaign = await CampaignAPI.updateCampaign(updateData);

      if (updatedCampaign) {
        console.log('✅ [DEBUG] Campaign saved successfully');
        // Refetch campaign data to ensure UI is in sync
        await refetch();
      }
    } catch (error) {
      console.error('Error saving campaign:', error);
      setErrors({ submit: 'Erro ao salvar campanha. Tente novamente.' });
    } finally {
      setSaving(false);
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
                Personalize os detalhes da sua campanha
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>Salvar</span>
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-700 dark:text-red-300 text-sm">{errors.submit}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Campaign Images */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Imagens do prêmio
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Adicione imagens atrativas do seu prêmio para aumentar as vendas
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

          {/* Campaign Description */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Descrição da campanha
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Descreva seu prêmio e campanha de forma detalhada
            </p>
            
            <RichTextEditor
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="Descreva sua campanha, o prêmio e as regras..."
              className="mb-4"
            />
          </div>

          {/* Draw Date */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Data do sorteio (opcional)
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Defina quando será realizado o sorteio
            </p>
            
            <input
              type="datetime-local"
              value={formData.drawDate}
              onChange={(e) => setFormData({ ...formData, drawDate: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200"
            />
          </div>

          {/* Campaign Settings */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Configurações da campanha
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Min Tickets Per Purchase */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mínimo de cotas por compra
                </label>
                <input
                  type="number"
                  value={formData.minTicketsPerPurchase}
                  onChange={(e) => setFormData({ ...formData, minTicketsPerPurchase: parseInt(e.target.value) || 1 })}
                  min="1"
                  className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200 ${
                    errors.minTicketsPerPurchase ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.minTicketsPerPurchase && (
                  <p className="text-red-500 text-sm mt-1">{errors.minTicketsPerPurchase}</p>
                )}
              </div>

              {/* Max Tickets Per Purchase */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Máximo de cotas por compra
                </label>
                <input
                  type="number"
                  value={formData.maxTicketsPerPurchase}
                  onChange={(e) => setFormData({ ...formData, maxTicketsPerPurchase: parseInt(e.target.value) || 1000 })}
                  min="1"
                  className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200 ${
                    errors.maxTicketsPerPurchase ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.maxTicketsPerPurchase && (
                  <p className="text-red-500 text-sm mt-1">{errors.maxTicketsPerPurchase}</p>
                )}
              </div>
            </div>
          </div>

          {/* Campaign Options */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Opções da campanha
            </h2>
            
            <div className="space-y-6">
              {/* Require Email */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Exigir email</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Obrigar participantes a fornecerem email
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requireEmail}
                    onChange={(e) => setFormData({ ...formData, requireEmail: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                </label>
              </div>

              {/* Show Ranking */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Mostrar ranking</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Exibir ranking dos maiores compradores
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showRanking}
                    onChange={(e) => setFormData({ ...formData, showRanking: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                </label>
              </div>

              {/* Show Percentage */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Mostrar porcentagem</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Exibir porcentagem de cotas vendidas
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showPercentage}
                    onChange={(e) => setFormData({ ...formData, showPercentage: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                </label>
              </div>

              {/* Initial Filter */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Filtro inicial</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Como as cotas aparecerão inicialmente para os visitantes
                </p>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="initialFilter"
                      value="all"
                      checked={formData.initialFilter === 'all'}
                      onChange={(e) => setFormData({ ...formData, initialFilter: e.target.value as 'all' | 'available' })}
                      className="w-4 h-4 text-green-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Mostrar todas as cotas
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="initialFilter"
                      value="available"
                      checked={formData.initialFilter === 'available'}
                      onChange={(e) => setFormData({ ...formData, initialFilter: e.target.value as 'all' | 'available' })}
                      className="w-4 h-4 text-green-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Mostrar apenas cotas disponíveis
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Promotions Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Promoções
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Crie promoções para incentivar compras em maior quantidade
                </p>
              </div>
              <button
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
                  const originalValue = promotion.ticketQuantity * (campaign?.ticket_price || 0);
                  const discountPercentage = originalValue > 0 ? Math.round((promotion.fixedDiscountAmount / originalValue) * 100) : 0;
                  
                  return (
                    <div
                      key={promotion.id}
                      className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-4 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 text-sm text-gray-900 dark:text-white">
                          <span className="text-purple-600 dark:text-purple-400">🎁</span>
                          <span className="font-bold">{promotion.ticketQuantity}</span>
                          <span>Bilhetes</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm mt-1">
                          <span className="text-gray-600 dark:text-gray-400">De:</span>
                          <span className="line-through text-gray-600 dark:text-gray-400">
                            R$ {originalValue.toFixed(2).replace('.', ',')}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">→</span>
                          <span className="text-gray-600 dark:text-gray-400">Por:</span>
                          <span className="text-green-600 dark:text-green-400 font-bold">
                            R$ {promotion.discountedTotalValue.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                          Desconto: R$ {promotion.fixedDiscountAmount.toFixed(2).replace('.', ',')} ({discountPercentage}%)
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const updatedPromotions = promotions.filter(p => p.id !== promotion.id);
                          setPromotions(updatedPromotions);
                        }}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors duration-200"
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

          {/* Prizes Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Prêmios
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Defina os prêmios da sua campanha
                </p>
              </div>
              <button
                onClick={() => setShowPrizesModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
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
                      <div className="text-blue-600 dark:text-blue-400 font-bold">
                        {index + 1}°
                      </div>
                      <span className="text-gray-900 dark:text-white">
                        {prize.name}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const updatedPrizes = prizes.filter(p => p.id !== prize.id);
                        setPrizes(updatedPrizes);
                      }}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">
                  Nenhum prêmio criado ainda
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleGoBack}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </button>

            <button
              onClick={handleNext}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200"
            >
              <span>Próximo</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Promotion Modal */}
      <PromotionModal
        isOpen={showPromotionModal}
        onClose={() => setShowPromotionModal(false)}
        onSavePromotions={handleSavePromotions}
        initialPromotions={promotions}
        originalTicketPrice={campaign?.ticket_price || 0}
        campaignTotalTickets={campaign?.total_tickets || 0}
      />

      {/* Prizes Modal */}
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