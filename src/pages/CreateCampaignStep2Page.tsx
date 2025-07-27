import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Image, Plus, Trash2, Eye, AlertCircle, Info } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useCampaigns } from '../hooks/useCampaigns';
import { useImageUpload } from '../hooks/useImageUpload';
import { Campaign } from '../types/campaign';
import { Promotion, Prize } from '../types/promotion';
import PromotionModal from '../components/PromotionModal';
import PrizesModal from '../components/PrizesModal';
import { ImageUpload } from '../components/ImageUpload';

const CreateCampaignStep2Page = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateCampaign } = useCampaigns();
  
  // Extract campaign ID from URL
  const campaignId = new URLSearchParams(location.search).get('id');
  
  const [formData, setFormData] = useState({
    title: '',
    totalTickets: 0,
    ticketPrice: '',
    drawMethod: '',
    description: '',
    phoneNumber: '',
    drawDate: null,
    paymentDeadlineHours: 24,
    requireEmail: true,
    showRanking: false,
    minTicketsPerPurchase: 1,
    maxTicketsPerPurchase: 1000,
    initialFilter: 'all' as 'all' | 'available',
    campaignModel: 'automatic' as 'manual' | 'automatic'
  });

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [showPrizesModal, setShowPrizesModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [savingPromotions, setSavingPromotions] = useState(false);
  const [savingPrizes, setSavingPrizes] = useState(false);

  // Image upload hook
  const {
    images,
    uploading: uploadingImages,
    uploadProgress,
    addImages,
    removeImage,
    reorderImages,
    uploadImages,
    clearImages,
    setExistingImages
  } = useImageUpload();

  // Load campaign data if editing
  useEffect(() => {
    const loadCampaignData = async () => {
      if (campaignId) {
        try {
          // In a real app, you would fetch the campaign data here
          // For now, we'll use mock data or data from location state
          const campaignData = location.state?.campaignData;
          if (campaignData) {
            setFormData({
              title: campaignData.title || '',
              totalTickets: campaignData.total_tickets || 0,
              ticketPrice: campaignData.ticket_price?.toFixed(2).replace('.', ',') || '',
              drawMethod: campaignData.draw_method || '',
              description: campaignData.description || '',
              phoneNumber: campaignData.phone_number || '',
              drawDate: campaignData.draw_date || null,
              paymentDeadlineHours: campaignData.payment_deadline_hours || 24,
              requireEmail: campaignData.require_email ?? true,
              showRanking: campaignData.show_ranking ?? false,
              minTicketsPerPurchase: campaignData.min_tickets_per_purchase || 1,
              maxTicketsPerPurchase: campaignData.max_tickets_per_purchase || 1000,
              initialFilter: campaignData.initial_filter || 'all',
              campaignModel: campaignData.campaign_model || 'automatic'
            });

            // Load existing images
            if (campaignData.prize_image_urls && campaignData.prize_image_urls.length > 0) {
              setExistingImages(campaignData.prize_image_urls);
            }

            // Load existing promotions
            if (campaignData.promotions) {
              setPromotions(campaignData.promotions);
            }

            // Load existing prizes
            if (campaignData.prizes) {
              setPrizes(campaignData.prizes);
            }
          }
        } catch (error) {
          console.error('Error loading campaign data:', error);
          setError('Erro ao carregar dados da campanha');
        }
      }
    };

    loadCampaignData();
  }, [campaignId, location.state]);

  // Auto-save functionality
  const handleAutoSave = useCallback(async () => {
    if (!campaignId) return;

    try {
      setLoading(true);
      
      // Upload images first if there are any
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadImages('mock-user-id'); // In real app, use actual user ID
      }

      // Convert price from Brazilian format to number
      const ticketPrice = parseFloat(formData.ticketPrice.replace(',', '.')) || 0;

      const payload = {
        id: campaignId,
        title: formData.title,
        ticket_price: ticketPrice,
        total_tickets: formData.totalTickets,
        draw_method: formData.drawMethod,
        description: formData.description,
        phone_number: formData.phoneNumber,
        draw_date: formData.drawDate,
        payment_deadline_hours: formData.paymentDeadlineHours,
        require_email: formData.requireEmail,
        show_ranking: formData.showRanking,
        min_tickets_per_purchase: formData.minTicketsPerPurchase,
        max_tickets_per_purchase: formData.maxTicketsPerPurchase,
        initial_filter: formData.initialFilter,
        campaign_model: formData.campaignModel,
        prize_image_urls: imageUrls.length > 0 ? imageUrls : undefined,
        promotions: promotions.length > 0 ? promotions : undefined,
        prizes: prizes.length > 0 ? prizes : undefined
      };

      await updateCampaign(payload);
      setLastSaved(new Date());
      setError(null);
    } catch (error) {
      console.error('Error auto-saving campaign:', error);
      setError('Erro ao salvar automaticamente');
    } finally {
      setLoading(false);
    }
  }, [campaignId, formData, images, promotions, prizes, updateCampaign, uploadImages]);

  // Auto-save when form data changes
  useEffect(() => {
    if (campaignId && formData.title) {
      const timeoutId = setTimeout(() => {
        handleAutoSave();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [formData, handleAutoSave, campaignId]);

  const handleGoBack = () => {
    navigate('/dashboard/create-campaign/step-1');
  };

  const handleNext = () => {
    navigate(`/dashboard/create-campaign/step-3?id=${campaignId}`);
  };

  const handlePreview = () => {
    // Pass current form data as preview data
    const previewData = {
      ...formData,
      images: images.map(img => img.preview || img.url).filter(Boolean),
      promotions,
      prizes
    };
    
    navigate(`/c/${campaignId}`, { 
      state: { 
        previewData,
        campaignModel: formData.campaignModel
      } 
    });
  };

  const handleSavePromotions = async (newPromotions: Promotion[]) => {
    setSavingPromotions(true);
    try {
      setPromotions(newPromotions);
      // Auto-save will be triggered by the useEffect
    } catch (error) {
      console.error('Error saving promotions:', error);
    } finally {
      setSavingPromotions(false);
    }
  };

  const handleSavePrizes = async (newPrizes: Prize[]) => {
    setSavingPrizes(true);
    try {
      setPrizes(newPrizes);
      // Auto-save will be triggered by the useEffect
    } catch (error) {
      console.error('Error saving prizes:', error);
    } finally {
      setSavingPrizes(false);
    }
  };

  // Rich text editor modules configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      ['blockquote', 'code-block'],
      ['link'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'list', 'bullet', 'indent',
    'blockquote', 'code-block', 'link'
  ];

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg border border-gray-200 dark:border-gray-800 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleGoBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Editar campanha
            </h1>
            {lastSaved && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Salvo automaticamente às {lastSaved.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handlePreview}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            <Eye className="h-4 w-4" />
            <span>Visualizar</span>
          </button>
          
          <button
            onClick={handleNext}
            className="flex items-center space-x-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            <span>Prosseguir</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 max-w-2xl mx-auto">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
          </div>
        )}

        <div className="space-y-8">
          {/* Campaign Images */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Imagens do Prêmio
            </h2>
            <ImageUpload
              images={images}
              uploading={uploadingImages}
              uploadProgress={uploadProgress}
              onAddImages={addImages}
              onRemoveImage={removeImage}
              onReorderImage={reorderImages}
            />
          </div>

          {/* Promotions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Promoções
              </h2>
              <button
                onClick={() => setShowPromotionModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar</span>
              </button>
            </div>
            
            {promotions.length > 0 ? (
              <div className="space-y-3">
                {promotions.map((promo) => (
                  <div
                    key={promo.id}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-4 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-purple-600 dark:text-purple-400">🎁</span>
                        <span className="font-bold text-gray-900 dark:text-white">{promo.ticketQuantity}</span>
                        <span className="text-gray-600 dark:text-gray-400">bilhetes por</span>
                        <span className="font-bold text-green-600 dark:text-green-400">
                          R$ {promo.totalValue.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">Nenhuma promoção adicionada</p>
              </div>
            )}
          </div>

          {/* Prizes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Prêmios
              </h2>
              <button
                onClick={() => setShowPrizesModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar</span>
              </button>
            </div>
            
            {prizes.length > 0 ? (
              <div className="space-y-3">
                {prizes.map((prize, index) => (
                  <div
                    key={prize.id}
                    className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg"
                  >
                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {index + 1}°
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white">{prize.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">Nenhum prêmio adicionado</p>
              </div>
            )}
          </div>

          {/* Rich Text Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descrição / Regulamento <Info className="inline-block h-4 w-4 text-gray-400 ml-1" />
            </label>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600">
              <ReactQuill
                theme="snow"
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                placeholder="Digite a descrição da sua campanha..."
                modules={quillModules}
                formats={quillFormats}
                style={{
                  backgroundColor: 'inherit',
                  color: 'inherit'
                }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Use a barra de ferramentas para formatar o texto com negrito, itálico, listas e mais.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PromotionModal
        isOpen={showPromotionModal}
        onClose={() => setShowPromotionModal(false)}
        onSavePromotions={handleSavePromotions}
        initialPromotions={promotions}
        originalTicketPrice={parseFloat(formData.ticketPrice.replace(',', '.')) || 0}
      />

      <PrizesModal
        isOpen={showPrizesModal}
        onClose={() => setShowPrizesModal(false)}
        prizes={prizes}
        onSavePrizes={handleSavePrizes}
        saving={savingPrizes}
      />
    </div>
  );
};

export default CreateCampaignStep2Page;