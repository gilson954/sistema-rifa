import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Plus, Trash2, AlertTriangle, ChevronDown, Calendar, Gift, Trophy, Settings, Image as ImageIcon, FileText } from 'lucide-react';
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

registerLocale('pt-BR', ptBR);
setDefaultLocale('pt-BR');

const CreateCampaignStep2Page = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const campaignId = new URLSearchParams(location.search).get('id');
  const { campaign, loading: campaignLoading, refetch } = useCampaignWithRefetch(campaignId || '');
  
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

  const [showInlineDatePicker, setShowInlineDatePicker] = useState(false);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [showPrizesModal, setShowPrizesModal] = useState(false);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [campaignModelError, setCampaignModelError] = useState<string>('');

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
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="rounded-2xl p-6 text-center border border-gray-200/20 dark:border-gray-800/30 bg-white/60 dark:bg-gray-900/50 backdrop-blur-sm">
        <p className="text-gray-600 dark:text-gray-400">Campanha não encontrada.</p>
      </div>
    );
  }

  const isFormValid = !campaignModelError && Object.keys(errors).length === 0;

  return (
    <div className="dashboard-page min-h-screen bg-transparent text-gray-900 dark:text-white transition-colors duration-300">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header com Progress */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={handleGoBack}
              className="p-3 hover:bg-white/60 dark:hover:bg-gray-800/60 rounded-xl transition-all duration-200 border border-transparent hover:border-gray-200/20 dark:hover:border-gray-700/30"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Editar campanha
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {campaign.title}
              </p>
            </div>
          </div>

          {/* Progress Steps - Estilo Dashboard */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                ✓
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Básico</span>
            </div>
            <div className="flex-1 h-1 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 rounded-full animate-gradient-x bg-[length:200%_200%]"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                2
              </div>
              <span className="text-sm font-bold text-purple-600 dark:text-purple-400">Detalhes</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 text-sm font-bold">
                3
              </div>
              <span className="text-sm text-gray-500">Pagamento</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {errors.submit && (
            <div className="rounded-2xl p-5 border border-red-200/20 dark:border-red-800/30 bg-red-50/60 dark:bg-red-900/20 backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <p className="text-red-700 dark:text-red-300 font-medium">{errors.submit}</p>
              </div>
            </div>
          )}

          {/* Campaign Images Section */}
          <div className="rounded-2xl border border-gray-200/20 dark:border-gray-700/30 bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm overflow-hidden">
            <div className="flex items-center space-x-3 p-5 border-b border-gray-200/20 dark:border-gray-700/30">
              <div className="w-10 h-10 rounded-xl animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 flex items-center justify-center shadow-md">
                <ImageIcon className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Imagens do prêmio
              </h2>
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
          <div className="rounded-2xl border border-gray-200/20 dark:border-gray-700/30 bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm overflow-hidden">
            <div className="flex items-center space-x-3 p-5 border-b border-gray-200/20 dark:border-gray-700/30">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Descrição da campanha
              </h2>
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
          <div className="rounded-2xl border border-gray-200/20 dark:border-gray-700/30 bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200/20 dark:border-gray-700/30">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-md">
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Promoções
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowPromotionModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold shadow-md transition-all duration-300 hover:-translate-y-0.5 animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 text-white"
              >
                <Plus className="h-4 w-4" />
                Adicionar
              </button>
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
                        className="rounded-xl p-5 border border-purple-100/20 dark:border-purple-900/30 bg-purple-50/50 dark:bg-purple-900/10 backdrop-blur-sm hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-2xl">🎁</span>
                              <span className="font-bold text-lg text-gray-900 dark:text-white">
                                {promo.ticketQuantity} Bilhetes
                              </span>
                            </div>
                            <div className="flex items-center space-x-3 text-sm mb-2">
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
                            <div className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                              <span className="text-xs font-bold text-green-700 dark:text-green-400">
                                Desconto: {formatCurrency(promo.fixedDiscountAmount)} ({discountPercentage}%)
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPromotions(prev => prev.filter(p => p.id !== promo.id))}
                            className="p-3 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all duration-200"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl p-12 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
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
          <div className="rounded-2xl border border-gray-200/20 dark:border-gray-700/30 bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200/20 dark:border-gray-700/30">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-600 flex items-center justify-center shadow-md">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Prêmios
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowPrizesModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold shadow-md transition-all duration-300 hover:-translate-y-0.5 bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4" />
                Adicionar
              </button>
            </div>
            <div className="p-6">
              {prizes.length > 0 ? (
                <div className="space-y-3">
                  {prizes.map((prize, index) => (
                    <div
                      key={prize.id}
                      className="rounded-xl p-5 border border-yellow-100/20 dark:border-yellow-900/30 bg-yellow-50/50 dark:bg-yellow-900/10 backdrop-blur-sm hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-yellow-600 rounded-xl flex items-center justify-center shadow-md">
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
                          className="p-3 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all duration-200"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl p-12 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
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
          <div className="rounded-2xl border border-gray-200/20 dark:border-gray-700/30 bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm overflow-hidden">
            <div className="flex items-center space-x-3 p-5 border-b border-gray-200/20 dark:border-gray-700/30">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Data do sorteio
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => handleDrawDateOptionChange('show-date')}
                  className={`py-4 px-6 rounded-xl font-bold transition-all duration-300 border-2 ${
                    formData.showDrawDateOption === 'show-date'
                      ? 'animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 text-white border-transparent shadow-lg'
                      : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-purple-500'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Mostrar data</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleDrawDateOptionChange('no-date')}
                  className={`py-4 px-6 rounded-xl font-bold transition-all duration-300 border-2 ${
                    formData.showDrawDateOption === 'no-date'
                      ? 'animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 text-white border-transparent shadow-lg'
                      : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-purple-500'
                  }`}
                >
                  Não mostrar data
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
                <div className="rounded-xl p-12 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                  <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    A data do sorteio não será exibida publicamente
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Campaign Settings Section */}
          <div className="rounded-2xl border border-gray-200/20 dark:border-gray-700/30 bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm overflow-hidden">
            <div className="flex items-center space-x-3 p-5 border-b border-gray-200/20 dark:border-gray-700/30">
              <div className="w-10 h-10 rounded-xl bg-gray-700 flex items-center justify-center shadow-md">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Configurações da campanha
              </h2>
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
                  <div className="mt-3 flex items-start space-x-3 rounded-xl p-4 border border-orange-200/20 dark:border-orange-800/30 bg-orange-50/60 dark:bg-orange-900/20 backdrop-blur-sm">
                    <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                      <AlertTriangle className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-orange-800 dark:text-orange-200 text-sm font-medium pt-1">
                      {campaignModelError}
                    </span>
                  </div>
                )}
              </div>

              {/* Checkboxes Section */}
              <div className="space-y-3 pt-4 border-t-2 border-gray-200/20 dark:border-gray-700/30">
                <div className="flex items-center space-x-4 p-4 rounded-xl border border-purple-100/20 dark:border-purple-900/30 bg-purple-50/30 dark:bg-purple-900/10 backdrop-blur-sm hover:border-purple-300/50 dark:hover:border-purple-700/50 transition-all duration-200">
                  <input
                    type="checkbox"
                    id="requireEmail"
                    name="requireEmail"
                    checked={formData.requireEmail}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-purple-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-purple-500 focus:ring-2 cursor-pointer"
                  />
                  <label htmlFor="requireEmail" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1 font-medium">
                    Exigir email dos compradores
                  </label>
                </div>

                <div className="flex items-center space-x-4 p-4 rounded-xl border border-blue-100/20 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/10 backdrop-blur-sm hover:border-blue-300/50 dark:hover:border-blue-700/50 transition-all duration-200">
                  <input
                    type="checkbox"
                    id="showRanking"
                    name="showRanking"
                    checked={formData.showRanking}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:ring-2 cursor-pointer"
                  />
                  <label htmlFor="showRanking" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1 font-medium">
                    Mostrar ranking de compradores
                  </label>
                </div>

                <div className="flex items-center space-x-4 p-4 rounded-xl border border-green-100/20 dark:border-green-900/30 bg-green-50/30 dark:bg-green-900/10 backdrop-blur-sm hover:border-green-300/50 dark:hover:border-green-700/50 transition-all duration-200">
                  <input
                    type="checkbox"
                    id="showPercentage"
                    name="showPercentage"
                    checked={formData.showPercentage}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-green-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-green-500 focus:ring-2 cursor-pointer"
                  />
                  <label htmlFor="showPercentage" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1 font-medium">
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
              className="inline-flex items-center gap-3 px-10 py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-[#7928CA] via-[#FF0080] via-[#007CF0] to-[#FF8C00] text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent"></div>
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <span>Finalizar e continuar</span>
                  <ArrowRight className="h-6 w-6" />
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
      </main>
    </div>
  );
};

export default CreateCampaignStep2Page;