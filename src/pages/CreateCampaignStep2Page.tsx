import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Upload, X, Plus, Trash2, AlertTriangle, ChevronDown, Calendar, Image, FileText, Gift, Trophy, Settings, Sparkles, Clock } from 'lucide-react';
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
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-200/20 dark:border-gray-700/30 p-8 shadow-lg">
          <p className="text-gray-500 dark:text-gray-400">Campanha não encontrada.</p>
        </div>
      </div>
    );
  }

  const isFormValid = !campaignModelError && Object.keys(errors).length === 0;

  return (
    <div className="min-h-screen bg-transparent text-gray-900 dark:text-white transition-colors duration-300">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header com gradiente */}
        <div className="mb-8 relative overflow-hidden rounded-2xl p-6 shadow-xl border border-purple-200/30 dark:border-purple-800/30 bg-gradient-to-br from-purple-50/80 to-blue-50/80 dark:from-purple-900/20 dark:to-blue-900/20 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          
          <div className="relative flex items-center space-x-4">
            <button
              onClick={handleGoBack}
              className="w-12 h-12 flex items-center justify-center hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-xl transition-all duration-200 hover:scale-110"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">Editar campanha</h1>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">{campaign.title}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 shadow-md">
              <p className="text-red-700 dark:text-red-300 text-sm font-medium">{errors.submit}</p>
            </div>
          )}

          {/* Imagens do Prêmio */}
          <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-200/20 dark:border-gray-700/30 p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <Image className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Imagens do prêmio</h2>
            </div>
            <ImageUpload
              images={images}
              uploading={uploadingImages}
              uploadProgress={uploadProgress}
              onAddImages={addImages}
              onRemoveImage={removeImage}
              onReorderImage={reorderImages}
            />
          </div>

          {/* Descrição da Campanha */}
          <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-200/20 dark:border-gray-700/30 p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Descrição da campanha</h2>
            </div>
            <RichTextEditor
              value={formData.description}
              onChange={handleDescriptionChange}
              placeholder="Descreva sua campanha, prêmio e regras..."
            />
          </div>

          {/* Promoções */}
          <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-200/20 dark:border-gray-700/30 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center shadow-md">
                  <Gift className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Promoções</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowPromotionModal(true)}
                className="px-4 py-2 rounded-xl font-semibold text-sm shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg bg-gradient-to-r from-pink-600 to-rose-600 text-white flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar</span>
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
                      className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-xl border border-green-200/50 dark:border-green-800/50 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="text-2xl">🎁</span>
                          <span className="font-bold text-gray-900 dark:text-white">{promo.ticketQuantity}</span>
                          <span className="text-gray-600 dark:text-gray-400">cotas</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm mt-1">
                          <span className="text-gray-500 dark:text-gray-400">De:</span>
                          <span className="line-through text-gray-500 dark:text-gray-400">
                            {formatCurrency(originalValue)}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">→</span>
                          <span className="font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(promo.discountedTotalValue)}
                          </span>
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400 font-semibold mt-1">
                          Desconto: {formatCurrency(promo.fixedDiscountAmount)} ({discountPercentage}%)
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPromotions(prev => prev.filter(p => p.id !== promo.id))}
                        className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors duration-200"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-gray-50/50 dark:bg-gray-800/30 rounded-xl p-12 text-center border-2 border-dashed border-gray-300 dark:border-gray-700">
                <div className="text-5xl mb-3">🎁</div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhuma promoção adicionada</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Clique em "Adicionar" para criar promoções</p>
              </div>
            )}
          </div>

          {/* Prêmios */}
          <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-200/20 dark:border-gray-700/30 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Prêmios</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowPrizesModal(true)}
                className="px-4 py-2 rounded-xl font-semibold text-sm shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg bg-gradient-to-r from-yellow-600 to-orange-600 text-white flex items-center space-x-2"
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
                    className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 rounded-xl border border-amber-200/50 dark:border-amber-800/50 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-sm">{index + 1}º</span>
                      </div>
                      <span className="text-gray-900 dark:text-white font-semibold">{prize.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPrizes(prev => prev.filter(p => p.id !== prize.id))}
                      className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors duration-200"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50/50 dark:bg-gray-800/30 rounded-xl p-12 text-center border-2 border-dashed border-gray-300 dark:border-gray-700">
                <div className="text-5xl mb-3">🏆</div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum prêmio adicionado</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Clique em "Adicionar" para definir os prêmios</p>
              </div>
            )}
          </div>

          {/* Data do Sorteio */}
          <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-200/20 dark:border-gray-700/30 p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Data do sorteio</h2>
            </div>
            
            <div className="flex gap-3 mb-6">
              <button
                type="button"
                onClick={() => handleDrawDateOptionChange('show-date')}
                className={`flex-1 py-3.5 px-4 rounded-xl font-semibold transition-all duration-300 border-2 ${
                  formData.showDrawDateOption === 'show-date'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border-transparent shadow-lg'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500'
                }`}
              >
                Mostrar data
              </button>
              <button
                type="button"
                onClick={() => handleDrawDateOptionChange('no-date')}
                className={`flex-1 py-3.5 px-4 rounded-xl font-semibold transition-all duration-300 border-2 ${
                  formData.showDrawDateOption === 'no-date'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border-transparent shadow-lg'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500'
                }`}
              >
                Não mostrar data
              </button>
            </div>

            {formData.showDrawDateOption === 'show-date' && (
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
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
                  className="w-full px-4 py-3.5 border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-4 transition-all duration-200 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-500 focus:ring-purple-500/20"
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                />
          
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  A data será exibida publicamente na página da campanha
                </p>
              </div>
            )}

            {formData.showDrawDateOption === 'no-date' && (
              <div className="bg-gray-50/50 dark:bg-gray-800/30 rounded-xl p-10 text-center border-2 border-dashed border-gray-300 dark:border-gray-700">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  A data do sorteio não será exibida publicamente
                </p>
              </div>
            )}
          </div>

          {/* Configurações da Campanha */}
          <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-200/20 dark:border-gray-700/30 p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Configurações da campanha</h2>
            </div>
            
            <div className="space-y-6">
              {/* Tempo de Reserva */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  Tempo de reserva das cotas
                </label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    name="reservationTimeoutMinutes"
                    value={formData.reservationTimeoutMinutes}
                    onChange={handleInputChange}
                    className="w-full appearance-none pl-12 pr-10 py-3.5 border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-4 transition-all duration-200 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-500 focus:ring-purple-500/20"
                  >
                    {reservationTimeoutOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Tempo que o cliente tem para concluir o pagamento após reservar as cotas
                </p>
              </div>

              {/* Grid de Configurações */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mínimo de Bilhetes */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    Mínimo de cotas por compra
                  </label>
                  <input
                    type="number"
                    name="minTicketsPerPurchase"
                    value={formData.minTicketsPerPurchase}
                    onChange={handleInputChange}
                    min="1"
                    className={`w-full px-4 py-3.5 border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-4 transition-all duration-200 ${
                      errors.minTicketsPerPurchase 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                        : 'border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-500 focus:ring-purple-500/20'
                    }`}
                  />
                  {errors.minTicketsPerPurchase && (
                    <p className="text-red-500 text-sm mt-2 font-medium">{errors.minTicketsPerPurchase}</p>
                  )}
                </div>

                {/* Máximo de Bilhetes */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    Máximo de cotas por compra
                  </label>
                  <input
                    type="number"
                    name="maxTicketsPerPurchase"
                    value={formData.maxTicketsPerPurchase}
                    onChange={handleInputChange}
                    min="1"
                    className={`w-full px-4 py-3.5 border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-4 transition-all duration-200 ${
                      errors.maxTicketsPerPurchase 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                        : 'border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-500 focus:ring-purple-500/20'
                    }`}
                  />
                  {errors.maxTicketsPerPurchase && (
                    <p className="text-red-500 text-sm mt-2 font-medium">{errors.maxTicketsPerPurchase}</p>
                  )}
                </div>
              </div>

              {/* Modelo da Campanha */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  Modelo da campanha
                </label>
                <div className="relative">
                  <select
                    name="campaignModel"
                    value={formData.campaignModel}
                    onChange={handleInputChange}
                    className={`w-full appearance-none px-4 py-3.5 border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-4 transition-all duration-200 ${
                      campaignModelError 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                        : 'border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-500 focus:ring-purple-500/20'
                    }`}
                  >
                    <option value="automatic">Automático</option>
                    <option value="manual">Manual</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
                
                {campaignModelError && (
                  <div className="mt-3 flex items-start space-x-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-3">
                    <div className="w-5 h-5 bg-orange-500 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertTriangle className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-orange-800 dark:text-orange-200 text-sm font-medium">
                      {campaignModelError}
                    </span>
                  </div>
                )}
                
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <strong>Automático:</strong> As cotas são selecionadas automaticamente. <strong>Manual:</strong> O cliente escolhe os números das cotas.
                </p>
              </div>

              {/* Checkboxes */}
              <div className="space-y-4 pt-2">
                <div className="flex items-start space-x-3 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200">
                  <input
                    type="checkbox"
                    id="requireEmail"
                    name="requireEmail"
                    checked={formData.requireEmail}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-purple-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 focus:ring-2 mt-0.5"
                  />
                  <label htmlFor="requireEmail" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                    Exigir email dos compradores
                  </label>
                </div>

                <div className="flex items-start space-x-3 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200">
                  <input
                    type="checkbox"
                    id="showRanking"
                    name="showRanking"
                    checked={formData.showRanking}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-purple-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 focus:ring-2 mt-0.5"
                  />
                  <label htmlFor="showRanking" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                    Mostrar ranking de compradores
                  </label>
                </div>

                <div className="flex items-start space-x-3 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200">
                  <input
                    type="checkbox"
                    id="showPercentage"
                    name="showPercentage"
                    checked={formData.showPercentage}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-purple-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 focus:ring-2 mt-0.5"
                  />
                  <label htmlFor="showPercentage" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                    Mostrar porcentagem de vendas
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Botão de Finalizar */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="px-8 py-4 rounded-xl font-bold text-lg shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 text-white flex items-center space-x-3"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <span>Continuar</span>
                  <ArrowRight className="h-6 w-6" />
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
          originalTicketPrice={campaign?.ticket_price || 0}
          campaignTotalTickets={campaign?.total_tickets || 0}
        />

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

export default CreateCampaignStep2Page; disabled:opacity-50"
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
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200