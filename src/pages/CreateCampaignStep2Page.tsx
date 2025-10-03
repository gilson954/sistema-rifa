import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Upload, X, Plus, Trash2, AlertTriangle, ChevronDown, Calendar, Gift, Trophy, Settings, Image as ImageIcon, FileText } from 'lucide-react';
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
  
  // Campaign model validation error state
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

      setShowInlineDatePicker(!!campaign.draw_date);

      if (campaign.prize_image_urls && campaign.prize_image_urls.length > 0) {
        setExistingImages(campaign.prize_image_urls);
      }

      if (campaign.promotions && Array.isArray(campaign.promotions)) {
        setPromotions(campaign.promotions);
      }

      if (campaign.prizes && Array.isArray(campaign.prizes)) {
        setPrizes(campaign.prizes);
      }
    }
  }, [campaign, setExistingImages]);

  // Validate campaign model when it changes or when total_tickets is available
  useEffect(() => {
    if (campaign?.total_tickets && formData.campaignModel === 'manual' && campaign.total_tickets > 10000) {
      setCampaignModelError('O modelo manual não é permitido para campanhas com mais de 10.000 cotas.');
    } else {
      setCampaignModelError('');
    }
  }, [formData.campaignModel, campaign?.total_tickets]);

  const handleGoBack = () => {
    navigate(`/dashboard/create-campaign?id=${campaignId}`);
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
      const numValue = parseInt(value) || 15;
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      
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
    setFormData(prev => ({ ...prev, description: value }));
  };

  const isEditorContentEmpty = (content: string): boolean => {
    if (!content) return true;
    
    const cleanContent = content
      .replace(/<p><br><\/p>/g, '')
      .replace(/<p><\/p>/g, '')
      .replace(/<br\s*\/?>/g, '')
      .replace(/&nbsp;/g, '')
      .replace(/<[^>]*>/g, '')
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
      if (!formData.drawDate) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(20, 0, 0, 0);
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
    
    if (campaignModelError) {
      return;
    }
    
    if (!validateForm() || !campaignId) {
      return;
    }

    setLoading(true);

    try {
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadImages(campaign?.user_id || '');
      }

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
      <div className="flex items-center justify-center py-20">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-900 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-purple-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl text-gray-900 dark:text-white p-8 rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">Campanha não encontrada.</p>
        </div>
      </div>
    );
  }

  const isFormValid = !campaignModelError && Object.keys(errors).length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/20 dark:from-gray-950 dark:via-purple-950/20 dark:to-pink-950/10 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={handleGoBack}
              className="group p-3 hover:bg-white/80 dark:hover:bg-gray-800/80 rounded-xl transition-all duration-200 border border-transparent hover:border-purple-200 dark:hover:border-purple-800/50"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
            </button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Editar campanha
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {campaign.title}
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                ✓
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Básico</span>
            </div>
            <div className="flex-1 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-sm font-bold shadow-lg animate-pulse">
                2
              </div>
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">Detalhes</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-500 text-sm font-bold">
                3
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-500">Pagamento</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-xl border border-red-200 dark:border-red-800/50 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <p className="text-red-700 dark:text-red-300">{errors.submit}</p>
              </div>
            </div>
          )}

          {/* Campaign Images Section */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">
                  Imagens do prêmio
                </h2>
              </div>
            </div>
            <div className="p-6">
              <ImageUpload
                images={images}
                uploading={uploadingImages}
                uploadProgress={uploadProgress}
                onAddImages={addImages}
                onRemoveImage={removeImage}
                onReorderImage={reorderImages}
              />
            </div>
          </div>

          {/* Campaign Description Section */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">
                  Descrição da campanha
                </h2>
              </div>
            </div>
            <div className="p-6">
              <RichTextEditor
                value={formData.description}
                onChange={handleDescriptionChange}
                placeholder="Descreva sua campanha, prêmio e regras..."
              />
            </div>
          </div>

          {/* Promotions Section */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Gift className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Promoções
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPromotionModal(true)}
                  className="group relative bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-5 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <Plus className="h-4 w-4 relative z-10" />
                  <span className="relative z-10">Adicionar</span>
                </button>
              </div>
            </div>
            <div className="p-6">
              {promotions.length > 0 ? (
                <div className="space-y-3">
                  {promotions.map((promo) => {
                    const originalValue = promo.ticketQuantity * (campaign?.ticket_price || 0);
                    const discountPercentage = originalValue > 0 ? Math.round((promo.fixedDiscountAmount / originalValue) * 100) : 0;
                    
                    return (
                      <div
                        key={promo.id}
                        className="group relative bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10 p-5 rounded-xl border border-purple-100 dark:border-purple-900/30 hover:border-purple-300 dark:hover:border-purple-700/50 transition-all duration-200 hover:shadow-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-2xl">🎁</span>
                              <span className="font-bold text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                {promo.ticketQuantity} Bilhetes
                              </span>
                            </div>
                            <div className="flex items-center space-x-3 text-sm">
                              <span className="text-gray-500 dark:text-gray-400">De:</span>
                              <span className="line-through text-gray-500 dark:text-gray-400">
                                {formatCurrency(originalValue)}
                              </span>
                              <span className="text-gray-400">→</span>
                              <span className="text-gray-500 dark:text-gray-400">Por:</span>
                              <span className="text-green-600 dark:text-green-400 font-bold text-base">
                                {formatCurrency(promo.discountedTotalValue)}
                              </span>
                            </div>
                            <div className="mt-2 inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                              <span className="text-xs font-medium text-green-700 dark:text-green-400">
                                💰 Desconto: {formatCurrency(promo.fixedDiscountAmount)} ({discountPercentage}%)
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPromotions(prev => prev.filter(p => p.id !== promo.id))}
                            className="p-3 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-gray-800/50 dark:to-purple-900/10 rounded-xl p-12 text-center border-2 border-dashed border-gray-300 dark:border-gray-700">
                  <div className="text-6xl mb-3">🎁</div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    Nenhuma promoção adicionada
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                    Adicione promoções para incentivar compras maiores
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Prizes Section */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Prêmios
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPrizesModal(true)}
                  className="group relative bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-5 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <Plus className="h-4 w-4 relative z-10" />
                  <span className="relative z-10">Adicionar</span>
                </button>
              </div>
            </div>
            <div className="p-6">
              {prizes.length > 0 ? (
                <div className="space-y-3">
                  {prizes.map((prize, index) => (
                    <div
                      key={prize.id}
                      className="group relative bg-gradient-to-r from-yellow-50/50 to-orange-50/50 dark:from-yellow-900/10 dark:to-orange-900/10 p-5 rounded-xl border border-yellow-100 dark:border-yellow-900/30 hover:border-yellow-300 dark:hover:border-yellow-700/50 transition-all duration-200 hover:shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg">
                              {index + 1}º
                            </span>
                          </div>
                          <span className="text-gray-900 dark:text-white font-medium text-lg">
                            {prize.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPrizes(prev => prev.filter(p => p.id !== prize.id))}
                          className="p-3 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gradient-to-br from-gray-50 to-yellow-50/30 dark:from-gray-800/50 dark:to-yellow-900/10 rounded-xl p-12 text-center border-2 border-dashed border-gray-300 dark:border-gray-700">
                  <div className="text-6xl mb-3">🏆</div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    Nenhum prêmio adicionado
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                    Defina os prêmios que serão sorteados
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Draw Date Section */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">
                  Data do sorteio
                </h2>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => handleDrawDateOptionChange('show-date')}
                  className={`group relative py-4 px-6 rounded-xl font-medium transition-all duration-200 border-2 overflow-hidden ${
                    formData.showDrawDateOption === 'show-date'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent shadow-lg shadow-purple-500/50'
                      : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-500'
                  }`}
                >
                  {formData.showDrawDateOption === 'show-date' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  )}
                  <span className="relative z-10 flex items-center justify-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Mostrar data</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDrawDateOptionChange('no-date')}
                  className={`group relative py-4 px-6 rounded-xl font-medium transition-all duration-200 border-2 overflow-hidden ${
                    formData.showDrawDateOption === 'no-date'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent shadow-lg shadow-purple-500/50'
                      : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-500'
                  }`}
                >
                  {formData.showDrawDateOption === 'no-date' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  )}
                  <span className="relative z-10 flex items-center justify-center space-x-2">
                    <X className="w-4 h-4" />
                    <span>Não mostrar data</span>
                  </span>
                </button>
              </div>

              {formData.showDrawDateOption === 'show-date' && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Selecione a data e hora do sorteio
                  </label>
                  <DatePicker
                    selected={formData.drawDate}
                    onChange={handleDrawDateChange}
                    showTimeSelect
                    timeFormat="HH:mm"
                    dateFormat="dd/MM/yyyy HH:mm"
                    timeIntervals={15}
                    minDate={new Date()}
                    locale="pt-BR"
                    placeholderText="Clique para selecionar data e hora"
                    className="w-full px-5 py-4 border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 border-gray-300 dark:border-gray-600"
                    renderCustomHeader={({
                      date,
                      decreaseMonth,
                      increaseMonth,
                      prevMonthButtonDisabled,
                      nextMonthButtonDisabled,
                    }) => (
                      <div className="flex items-center justify-between px-2 py-1">
                        <button
                          onClick={decreaseMonth}
                          disabled={prevMonthButtonDisabled}
                          type="button"
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200 disabled:opacity-50"
                        >
                          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        
                        <span className="text-gray-900 dark:text-white font-medium text-base">
                          {date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </span>
                        
                        <button
                          onClick={increaseMonth}
                          disabled={nextMonthButtonDisabled}
                          type="button"
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200 disabled:opacity-50"
                        >
                          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                    <span>A data será exibida publicamente na página da campanha</span>
                  </p>
                </div>
              )}

              {formData.showDrawDateOption === 'no-date' && (
                <div className="bg-gradient-to-br from-gray-50 to-indigo-50/30 dark:from-gray-800/50 dark:to-indigo-900/10 rounded-xl p-12 text-center border-2 border-dashed border-gray-300 dark:border-gray-700">
                  <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    A data do sorteio não será exibida publicamente
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Campaign Settings Section */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-gray-700 to-gray-900 px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">
                  Configurações da campanha
                </h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Reservation Timeout */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Tempo de reserva das cotas
                </label>
                <div className="relative">
                  <select
                    name="reservationTimeoutMinutes"
                    value={formData.reservationTimeoutMinutes}
                    onChange={handleInputChange}
                    className="w-full appearance-none px-5 py-4 border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 border-gray-300 dark:border-gray-600"
                  >
                    {reservationTimeoutOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Min and Max Tickets Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Min Tickets Per Purchase */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Mínimo de bilhetes por compra
                  </label>
                  <input
                    type="number"
                    name="minTicketsPerPurchase"
                    value={formData.minTicketsPerPurchase}
                    onChange={handleInputChange}
                    min="1"
                    className={`w-full px-5 py-4 border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                      errors.minTicketsPerPurchase ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.minTicketsPerPurchase && (
                    <p className="text-red-500 text-sm mt-2 flex items-center space-x-1">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{errors.minTicketsPerPurchase}</span>
                    </p>
                  )}
                </div>

                {/* Max Tickets Per Purchase */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Máximo de bilhetes por compra
                  </label>
                  <input
                    type="number"
                    name="maxTicketsPerPurchase"
                    value={formData.maxTicketsPerPurchase}
                    onChange={handleInputChange}
                    min="1"
                    className={`w-full px-5 py-4 border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                      errors.maxTicketsPerPurchase ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.maxTicketsPerPurchase && (
                    <p className="text-red-500 text-sm mt-2 flex items-center space-x-1">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{errors.maxTicketsPerPurchase}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Campaign Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Modelo da campanha
                </label>
                <div className="relative">
                  <select
                    name="campaignModel"
                    value={formData.campaignModel}
                    onChange={handleInputChange}
                    className={`w-full appearance-none px-5 py-4 border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                      campaignModelError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <option value="automatic">Automático</option>
                    <option value="manual">Manual</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
                
                {campaignModelError && (
                  <div className="mt-3 flex items-start space-x-3 bg-orange-50/80 dark:bg-orange-900/20 backdrop-blur-sm border border-orange-200 dark:border-orange-800/50 rounded-xl px-4 py-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-orange-800 dark:text-orange-200 text-sm font-medium pt-1">
                      {campaignModelError}
                    </span>
                  </div>
                )}
              </div>

              {/* Checkboxes Section */}
              <div className="space-y-4 pt-4 border-t-2 border-gray-200 dark:border-gray-800">
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-xl border border-purple-100 dark:border-purple-900/30 hover:border-purple-300 dark:hover:border-purple-700/50 transition-all duration-200">
                  <input
                    type="checkbox"
                    id="requireEmail"
                    name="requireEmail"
                    checked={formData.requireEmail}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-purple-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-purple-500 focus:ring-2 cursor-pointer"
                  />
                  <label htmlFor="requireEmail" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1">
                    Exigir email dos compradores
                  </label>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-900/10 dark:to-cyan-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700/50 transition-all duration-200">
                  <input
                    type="checkbox"
                    id="showRanking"
                    name="showRanking"
                    checked={formData.showRanking}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:ring-2 cursor-pointer"
                  />
                  <label htmlFor="showRanking" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1">
                    Mostrar ranking de compradores
                  </label>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-xl border border-green-100 dark:border-green-900/30 hover:border-green-300 dark:hover:border-green-700/50 transition-all duration-200">
                  <input
                    type="checkbox"
                    id="showPercentage"
                    name="showPercentage"
                    checked={formData.showPercentage}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-green-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-green-500 focus:ring-2 cursor-pointer"
                  />
                  <label htmlFor="showPercentage" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1">
                    Mostrar porcentagem de vendas
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="group relative bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white px-10 py-4 rounded-xl font-bold text-lg transition-all duration-200 flex items-center space-x-3 shadow-xl hover:shadow-2xl hover:scale-105 disabled:hover:scale-100 overflow-hidden"
            >
              {!loading && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              )}
              {loading ? (
                <div className="relative z-10 flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent"></div>
                  <span>Processando...</span>
                </div>
              ) : (
                <>
                  <span className="relative z-10">Finalizar e continuar</span>
                  <ArrowRight className="h-6 w-6 relative z-10 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>

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
        />
      </div>
    </div>
  );
};

export default CreateCampaignStep2Page;