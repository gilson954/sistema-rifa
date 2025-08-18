import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Plus, Trash2, X, ChevronDown, Upload, Eye, EyeOff, Calendar, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCampaignWithRefetch } from '../hooks/useCampaigns';
import { CampaignAPI } from '../lib/api/campaigns';
import { useImageUpload } from '../hooks/useImageUpload';
import { ImageUpload } from '../components/ImageUpload';
import RichTextEditor from '../components/RichTextEditor';
import PromotionModal from '../components/PromotionModal';
import PrizesModal from '../components/PrizesModal';
import { Promotion, Prize } from '../types/promotion';

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

  // Load campaign data when component mounts or campaign changes
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
        campaignModel: campaign.campaign_model || 'automatic',
        showPercentage: campaign.show_percentage ?? false
      });

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
    }
  }, [campaign, setExistingImages]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

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

      const updateData = {
        id: campaign.id,
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

          {/* Campaign Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Modelo da campanha
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onClick={() => setFormData({ ...formData, campaignModel: 'automatic' })}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  formData.campaignModel === 'automatic'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">Automático</h4>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.campaignModel === 'automatic'
                      ? 'border-green-500 bg-green-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {formData.campaignModel === 'automatic' && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  O sistema escolhe automaticamente os números disponíveis
                </p>
              </div>

              <div
                onClick={() => setFormData({ ...formData, campaignModel: 'manual' })}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  formData.campaignModel === 'manual'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">Manual</h4>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.campaignModel === 'manual'
                      ? 'border-green-500 bg-green-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {formData.campaignModel === 'manual' && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  O cliente escolhe os números que deseja comprar
                </p>
              </div>
            </div>
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
                  <span>Continuar</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </form>

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