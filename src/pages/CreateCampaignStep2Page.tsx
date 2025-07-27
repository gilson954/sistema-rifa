import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Image, Plus, Trash2, Eye, AlertCircle, Info } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useCampaigns } from '../hooks/useCampaigns';
import { useImageUpload } from '../hooks/useImageUpload';
import { Campaign } from '../types/campaign';
import { ImageUpload } from '../components/ImageUpload';
import PromotionModal from '../components/PromotionModal';
import PrizesModal from '../components/PrizesModal';
import { Promotion, Prize } from '../types/promotion';
import { formatCurrency } from '../utils/currency';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

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
    drawDate: null as string | null,
    paymentDeadlineHours: 24,
    requireEmail: true,
    showRanking: false,
    minTicketsPerPurchase: 1,
    maxTicketsPerPurchase: 1000,
    initialFilter: 'all' as 'all' | 'available',
    campaignModel: 'automatic' as 'manual' | 'automatic'
  });

  const [selectedCountry, setSelectedCountry] = useState<Country>({
    code: 'BR',
    name: 'Brasil',
    dialCode: '+55',
    flag: '🇧🇷'
  });

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [showPrizesModal, setShowPrizesModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);

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

  // Load campaign data if editing
  useEffect(() => {
    const loadCampaign = async () => {
      if (campaignId) {
        try {
          // In a real app, you would fetch the campaign data here
          // For now, we'll use mock data or the campaign from context
          console.log('Loading campaign:', campaignId);
        } catch (error) {
          console.error('Error loading campaign:', error);
        }
      }
    };

    loadCampaign();
  }, [campaignId]);

  // Auto-save functionality
  const handleAutoSave = useCallback(async () => {
    if (!campaignId || autoSaving) return;

    setAutoSaving(true);
    try {
      // Upload images first if there are any
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadImages('mock-user-id'); // In real app, use actual user ID
      }

      // Prepare campaign data for update
      const payload = {
        id: campaignId,
        title: formData.title,
        description: formData.description,
        ticket_price: parseFloat(formData.ticketPrice.replace(',', '.')) || 0,
        total_tickets: formData.totalTickets,
        draw_method: formData.drawMethod,
        phone_number: `${selectedCountry.dialCode} ${formData.phoneNumber}`,
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
    } catch (error) {
      console.error('Auto-save error:', error);
    } finally {
      setAutoSaving(false);
    }
  }, [campaignId, formData, selectedCountry, images, promotions, prizes, updateCampaign, uploadImages, autoSaving]);

  // Auto-save on form changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (campaignId) {
        handleAutoSave();
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timer);
  }, [formData, promotions, prizes, images, handleAutoSave, campaignId]);

  const handleGoBack = () => {
    navigate('/dashboard/create-campaign/step-1');
  };

  const handlePreview = () => {
    // Navigate to campaign preview with current data
    navigate(`/c/${campaignId}`, {
      state: {
        previewData: {
          ...formData,
          promotions,
          prizes,
          images: images.map(img => img.url || img.preview)
        },
        campaignModel: formData.campaignModel
      }
    });
  };

  const handleContinue = () => {
    navigate(`/dashboard/create-campaign/step-3?id=${campaignId}`);
  };

  const handlePromotionClick = (promo: Promotion) => {
    // Handle promotion selection logic here
    console.log('Promotion clicked:', promo);
  };

  // Rich text editor modules configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['blockquote', 'code-block'],
      ['link'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['clean']
    ],
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent', 'blockquote', 'code-block',
    'link', 'color', 'background', 'align'
  ];

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
                  Editar campanha
                </h1>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  {autoSaving && (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600"></div>
                      <span>Salvando...</span>
                    </>
                  )}
                  {lastSaved && !autoSaving && (
                    <span>Salvo às {lastSaved.toLocaleTimeString()}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handlePreview}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors duration-200"
              >
                <Eye className="h-4 w-4" />
                <span>Visualizar</span>
              </button>
              
              <button
                onClick={handleContinue}
                className="flex items-center space-x-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                <span>Continuar</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Campaign Images */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300">
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

          {/* Campaign Details */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Detalhes da Campanha
            </h2>
            
            <div className="space-y-6">
              {/* Campaign Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título da Campanha
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Digite o título da sua campanha"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                />
              </div>

              {/* Campaign Description with Rich Text Editor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrição / Regulamento <Info className="inline-block h-4 w-4 text-gray-400 ml-1" />
                </label>
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  <ReactQuill
                    theme="snow"
                    value={formData.description}
                    onChange={(value) => setFormData({ ...formData, description: value })}
                    placeholder="Digite a descrição da sua campanha..."
                    modules={quillModules}
                    formats={quillFormats}
                    className="bg-white dark:bg-gray-800"
                    style={{ minHeight: '200px' }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Use este campo para descrever os prêmios, regras do sorteio e outras informações importantes.
                </p>
              </div>

              {/* Campaign Model Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  Modelo da Campanha
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Manual Mode */}
                  <div
                    onClick={() => setFormData({ ...formData, campaignModel: 'manual' })}
                    className={`cursor-pointer border-2 rounded-lg p-4 transition-all duration-200 ${
                      formData.campaignModel === 'manual'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Manual</h3>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        formData.campaignModel === 'manual'
                          ? 'border-purple-500 bg-purple-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {formData.campaignModel === 'manual' && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Participantes escolhem números específicos
                    </p>
                  </div>

                  {/* Automatic Mode */}
                  <div
                    onClick={() => setFormData({ ...formData, campaignModel: 'automatic' })}
                    className={`cursor-pointer border-2 rounded-lg p-4 transition-all duration-200 ${
                      formData.campaignModel === 'automatic'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Automático</h3>
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Números são gerados automaticamente
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Promotions Section */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {promotions.map((promo) => {
                  const originalValue = promo.ticketQuantity * parseFloat(formData.ticketPrice.replace(',', '.') || '0');
                  const discountPercentage = Math.round(((originalValue - promo.totalValue) / originalValue) * 100);
                  
                  return (
                    <div
                      key={promo.id}
                      className="relative bg-gray-900 dark:bg-gray-800 text-white rounded-lg p-4 border border-gray-700 dark:border-gray-600 group"
                    >
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        –{discountPercentage}%
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm font-semibold">
                          {promo.ticketQuantity} cotas por {formatCurrency(promo.totalValue)}
                        </div>
                      </div>

                      <button
                        onClick={() => setPromotions(prev => prev.filter(p => p.id !== promo.id))}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-red-600 rounded"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>Nenhuma promoção adicionada ainda</p>
              </div>
            )}
          </div>

          {/* Prizes Section */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300">
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
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        {index + 1}°
                      </div>
                      <span className="text-gray-900 dark:text-white">{prize.name}</span>
                    </div>
                    <button
                      onClick={() => setPrizes(prev => prev.filter(p => p.id !== prize.id))}
                      className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>Nenhum prêmio adicionado ainda</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <PromotionModal
        isOpen={showPromotionModal}
        onClose={() => setShowPromotionModal(false)}
        onSavePromotions={setPromotions}
        initialPromotions={promotions}
        originalTicketPrice={parseFloat(formData.ticketPrice.replace(',', '.')) || 0}
      />

      <PrizesModal
        isOpen={showPrizesModal}
        onClose={() => setShowPrizesModal(false)}
        prizes={prizes}
        onSavePrizes={setPrizes}
      />

      {/* Custom Styles for Quill Editor */}
      <style jsx global>{`
        .ql-editor {
          min-height: 150px;
          font-size: 14px;
          line-height: 1.5;
        }
        
        .ql-toolbar {
          border-top: 1px solid #e5e7eb;
          border-left: 1px solid #e5e7eb;
          border-right: 1px solid #e5e7eb;
          border-bottom: none;
        }
        
        .ql-container {
          border-bottom: 1px solid #e5e7eb;
          border-left: 1px solid #e5e7eb;
          border-right: 1px solid #e5e7eb;
          border-top: none;
        }
        
        .dark .ql-toolbar {
          border-color: #4b5563;
          background-color: #374151;
        }
        
        .dark .ql-container {
          border-color: #4b5563;
          background-color: #1f2937;
        }
        
        .dark .ql-editor {
          color: #f9fafb;
        }
        
        .dark .ql-toolbar .ql-stroke {
          stroke: #9ca3af;
        }
        
        .dark .ql-toolbar .ql-fill {
          fill: #9ca3af;
        }
        
        .dark .ql-toolbar button:hover .ql-stroke {
          stroke: #f3f4f6;
        }
        
        .dark .ql-toolbar button:hover .ql-fill {
          fill: #f3f4f6;
        }
      `}</style>
    </div>
  );
};

export default CreateCampaignStep2Page;