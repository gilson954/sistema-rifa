import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Upload, X, ChevronDown, Plus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCampaigns } from '../hooks/useCampaigns';
import { useCampaign } from '../hooks/useCampaigns';
import { useImageUpload } from '../hooks/useImageUpload';
import { ImageUpload } from '../components/ImageUpload';
import { useAuth } from '../context/AuthContext';
import { CampaignFormData } from '../types/campaign';
import PromotionModal from '../components/PromotionModal';
import { Promotion } from '../types/promotion';
import { formatCurrency } from '../utils/currency';

const CreateCampaignStep2Page = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { updateCampaign } = useCampaigns();
  
  // Get campaign ID from URL params
  const campaignId = new URLSearchParams(location.search).get('id');
  const { campaign, loading: campaignLoading } = useCampaign(campaignId || '');

  // Image upload hook
  const {
    images,
    uploading,
    uploadProgress,
    addImages,
    removeImage,
    reorderImages,
    uploadImages,
    clearImages,
    setExistingImages
  } = useImageUpload();

  // Form state
  const [formData, setFormData] = useState<CampaignFormData>({
    title: '',
    ticketQuantity: 0,
    ticketPrice: '0,00',
    drawMethod: '',
    phoneNumber: '',
    drawDate: null,
    paymentDeadlineHours: 24,
    requireEmail: true,
    showRanking: false,
    minTicketsPerPurchase: 1,
    maxTicketsPerPurchase: 1000,
    initialFilter: 'all',
    campaignModel: 'manual'
  });

  // Promotion state
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [showPromotionModal, setShowPromotionModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load campaign data when component mounts
  useEffect(() => {
    if (campaign) {
      setFormData({
        title: campaign.title,
        ticketQuantity: campaign.total_tickets,
        ticketPrice: campaign.ticket_price.toFixed(2).replace('.', ','),
        drawMethod: campaign.draw_method || '',
        phoneNumber: campaign.phone_number || '',
        drawDate: campaign.draw_date,
        paymentDeadlineHours: campaign.payment_deadline_hours || 24,
        requireEmail: campaign.require_email ?? true,
        showRanking: campaign.show_ranking ?? false,
        minTicketsPerPurchase: campaign.min_tickets_per_purchase || 1,
        maxTicketsPerPurchase: campaign.max_tickets_per_purchase || 1000,
        initialFilter: campaign.initial_filter || 'all',
        campaignModel: campaign.campaign_model || 'manual'
      });

      // Load existing images if any
      if (campaign.prize_image_urls && campaign.prize_image_urls.length > 0) {
        setExistingImages(campaign.prize_image_urls);
      }
    }
  }, [campaign, setExistingImages]);

  const handleGoBack = () => {
    navigate('/dashboard/create-campaign/step-1');
  };

  const handleSavePromotions = (newPromotions: Promotion[]) => {
    setPromotions(newPromotions);
  };

  const handleRemovePromotion = (promotionId: string) => {
    setPromotions(promotions.filter(p => p.id !== promotionId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!campaignId) {
      setError('ID da campanha não encontrado');
      return;
    }

    if (!user) {
      setError('Usuário não autenticado');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Upload images first
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadImages(user.id);
      }

      // Convert price from Brazilian format to number
      const ticketPrice = parseFloat(formData.ticketPrice.replace(',', '.'));

      // Update campaign data
      const updateData = {
        id: campaignId,
        title: formData.title,
        ticket_price: ticketPrice,
        total_tickets: formData.ticketQuantity,
        draw_method: formData.drawMethod,
        phone_number: formData.phoneNumber,
        draw_date: formData.drawDate,
        payment_deadline_hours: formData.paymentDeadlineHours,
        require_email: formData.requireEmail,
        show_ranking: formData.showRanking,
        min_tickets_per_purchase: formData.minTicketsPerPurchase,
        max_tickets_per_purchase: formData.maxTicketsPerPurchase,
        initial_filter: formData.initialFilter,
        campaign_model: formData.campaignModel,
        prize_image_urls: imageUrls.length > 0 ? imageUrls : undefined
      };

      await updateCampaign(updateData);
      
      // Navigate to step 3 with promotions data
      navigate(`/dashboard/create-campaign/step-3?id=${campaignId}`, {
        state: { promotions }
      });
    } catch (error) {
      console.error('Error updating campaign:', error);
      setError('Erro ao salvar campanha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (campaignLoading) {
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
        <div className="flex items-center space-x-4 mb-8">
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

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Campaign Images */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Imagens do Prêmio
            </h3>
            <ImageUpload
              images={images}
              uploading={uploading}
              uploadProgress={uploadProgress}
              onAddImages={addImages}
              onRemoveImage={removeImage}
              onReorderImage={reorderImages}
            />
          </div>

          {/* Campaign Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Título da Campanha
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200"
                required
              />
            </div>

            {/* Ticket Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Valor da Cota
              </label>
              <input
                type="text"
                value={`R$ ${formData.ticketPrice}`}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d,]/g, '');
                  setFormData({ ...formData, ticketPrice: value });
                }}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200"
                required
              />
            </div>

            {/* Ticket Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quantidade de Cotas
              </label>
              <input
                type="number"
                value={formData.ticketQuantity}
                onChange={(e) => setFormData({ ...formData, ticketQuantity: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200"
                required
              />
            </div>

            {/* Draw Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Local de Sorteio
              </label>
              <div className="relative">
                <select
                  value={formData.drawMethod}
                  onChange={(e) => setFormData({ ...formData, drawMethod: e.target.value })}
                  className="w-full appearance-none px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200"
                  required
                >
                  <option value="">Escolha uma opção</option>
                  <option value="Loteria Federal">Loteria Federal</option>
                  <option value="Sorteador.com.br">Sorteador.com.br</option>
                  <option value="Live no Instagram">Live no Instagram</option>
                  <option value="Live no Youtube">Live no Youtube</option>
                  <option value="Live no TikTok">Live no TikTok</option>
                  <option value="Outros">Outros</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Campaign Model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Modelo da Campanha
              </label>
              <div className="relative">
                <select
                  value={formData.campaignModel}
                  onChange={(e) => setFormData({ ...formData, campaignModel: e.target.value as 'manual' | 'automatic' })}
                  className="w-full appearance-none px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200"
                >
                  <option value="manual">Cliente escolhe as cotas manualmente</option>
                  <option value="automatic">Sistema escolhe as cotas aleatoriamente</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Min Tickets Per Purchase */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quantidade mínima de cotas por compra
              </label>
              <input
                type="number"
                value={formData.minTicketsPerPurchase}
                onChange={(e) => setFormData({ ...formData, minTicketsPerPurchase: parseInt(e.target.value) || 1 })}
                min="1"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200"
              />
            </div>

            {/* Max Tickets Per Purchase */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quantidade máxima de cotas por compra
              </label>
              <input
                type="number"
                value={formData.maxTicketsPerPurchase}
                onChange={(e) => setFormData({ ...formData, maxTicketsPerPurchase: parseInt(e.target.value) || 1000 })}
                min="1"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200"
              />
            </div>

            {/* Payment Deadline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prazo para pagamento (horas)
              </label>
              <input
                type="number"
                value={formData.paymentDeadlineHours}
                onChange={(e) => setFormData({ ...formData, paymentDeadlineHours: parseInt(e.target.value) || 24 })}
                min="1"
                max="168"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Número de Telefone
              </label>
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200"
                required
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="requireEmail"
                checked={formData.requireEmail}
                onChange={(e) => setFormData({ ...formData, requireEmail: e.target.checked })}
                className="w-4 h-4 text-purple-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
              />
              <label htmlFor="requireEmail" className="text-sm text-gray-700 dark:text-gray-300">
                Exigir email do comprador
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="showRanking"
                checked={formData.showRanking}
                onChange={(e) => setFormData({ ...formData, showRanking: e.target.checked })}
                className="w-4 h-4 text-purple-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
              />
              <label htmlFor="showRanking" className="text-sm text-gray-700 dark:text-gray-300">
                Mostrar ranking de compradores
              </label>
            </div>
          </div>

          {/* Promotions Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Promoções
              </h3>
              <button
                type="button"
                onClick={() => setShowPromotionModal(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <span>🎁</span>
                <span>Promoção</span>
              </button>
            </div>

            {/* Promotions List */}
            {promotions.length > 0 && (
              <div className="space-y-3">
                {promotions.map((promotion) => (
                  <div
                    key={promotion.id}
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🎁</span>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {promotion.ticketQuantity} Bilhetes
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          De {formatCurrency(promotion.originalPricePerTicket * promotion.ticketQuantity)} → Por {formatCurrency(promotion.totalValue)}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePromotion(promotion.id)}
                      className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                      title="Remover promoção"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {promotions.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>Nenhuma promoção criada ainda</p>
                <p className="text-sm">Clique no botão "Promoção" para adicionar</p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || uploading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2"
            >
              {loading || uploading ? (
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

        {/* Promotion Modal */}
        <PromotionModal
          isOpen={showPromotionModal}
          onClose={() => setShowPromotionModal(false)}
          onSave={handleSavePromotions}
          originalTicketPrice={parseFloat(formData.ticketPrice.replace(',', '.')) || 0}
          existingPromotions={promotions}
        />
      </div>
    </div>
  );
};

export default CreateCampaignStep2Page;