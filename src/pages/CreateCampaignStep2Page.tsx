import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Plus, Trash2, AlertTriangle, ChevronDown, Calendar, Gift, Trophy, Settings, Image as ImageIcon, FileText, Check } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCampaignWithRefetch } from '../hooks/useCampaigns';
import { CampaignAPI } from '../lib/api/campaigns';
import { ImageUpload } from '../components/ImageUpload';
import { useImageUpload } from '../hooks/useImageUpload';
import RichTextEditor from '../components/RichTextEditor';
import PromotionModal from '../components/PromotionModal';
import PrizesModal from '../components/PrizesModal';
import DateTimePickerModal from '../components/DateTimePickerModal';
import { Promotion, Prize } from '../types/promotion';
import 'react-datepicker/dist/react-datepicker.css';
import { motion, AnimatePresence } from 'framer-motion'; // Importação do Framer Motion

// =================================================================
// NOVO COMPONENTE: AnimatedCheckbox
// =================================================================

interface AnimatedCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  name: string;
}

/**
 * Componente de Checkbox animado com Framer Motion e estilizado com Tailwind CSS.
 * Utiliza a animação pathLength para o ícone de check.
 */
const AnimatedCheckbox: React.FC<AnimatedCheckboxProps> = ({ checked, onChange, label, description, name }) => {
  const checkVariants = {
    checked: { pathLength: 1, opacity: 1 },
    unchecked: { pathLength: 0, opacity: 0 }
  };

  return (
    <div className="relative">
      <input
        type="checkbox"
        id={name}
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      
      <label 
        htmlFor={name} 
        className="flex items-start p-4 bg-white/60 dark:bg-gray-800/60 rounded-2xl cursor-pointer transition-all duration-300 hover:bg-white/90 dark:hover:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md"
      >
        <div className="flex-shrink-0 pt-1">
          <motion.div
            className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors duration-200 ease-in-out border-2 ${
              checked
                ? 'bg-gradient-to-br from-purple-600 to-blue-600 border-transparent shadow-lg shadow-purple-500/50'
                : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
            }`}
            initial={false}
            animate={checked ? 'checked' : 'unchecked'}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence initial={false}>
              {checked && (
                <motion.svg
                  key="check"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-white"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <motion.path
                    d="M5 13L9 17L19 7"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    variants={checkVariants}
                    initial="unchecked"
                    animate="checked"
                    transition={{ duration: 0.3 }}
                  />
                </motion.svg>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <div className="ml-4">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">{label}</span>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
          )}
        </div>
      </label>
    </div>
  );
};


// =================================================================
// CreateCampaignStep2Page
// =================================================================

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
  const [showDateTimeModal, setShowDateTimeModal] = useState(false);
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
      // Este bloco agora é reservado para checkboxes não animados ou outros inputs com type='checkbox'
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

  /**
   * Novo handler para os checkboxes animados, que recebem o nome e o status.
   */
  const handleAnimatedCheckboxChange = (name: keyof typeof formData, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
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

  const handleOpenDateTimeModal = () => {
    setShowDateTimeModal(true);
  };

  const handleDateTimeConfirm = (date: Date) => {
    setFormData(prev => ({ ...prev, drawDate: date }));
    setShowDateTimeModal(false);
  };

  const formatDateTimeDisplay = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        require_email: formData.requireEmail, // Manteve requireEmail do formData
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
          
          {/* ======================================= */}
          {/* Seção: Configurações Adicionais (Novos Checkboxes) */}
          {/* ======================================= */}
          <section className="bg-white/50 dark:bg-gray-900/50 rounded-3xl p-6 sm:p-8 backdrop-blur-sm shadow-xl border border-gray-200/50 dark:border-gray-800/50">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <Settings className="h-6 w-6 mr-3 text-purple-600 dark:text-purple-400" />
              Configurações Adicionais
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Checkbox: showRanking */}
              <AnimatedCheckbox
                name="showRanking"
                label="Mostrar Ranking de Compradores"
                description="Exibe um ranking público com os nomes e o total de cotas dos maiores compradores."
                checked={formData.showRanking}
                onChange={(checked) => handleAnimatedCheckboxChange('showRanking', checked)}
              />

              {/* Checkbox: showPercentage */}
              <AnimatedCheckbox
                name="showPercentage"
                label="Mostrar Percentual de Cotas Vendidas"
                description="Exibe na página da campanha a porcentagem de cotas já vendidas."
                checked={formData.showPercentage}
                onChange={(checked) => handleAnimatedCheckboxChange('showPercentage', checked)}
              />

              {/* Checkbox: requireEmail (Usando o input padrão para referência) */}
              <label htmlFor="requireEmail" className="flex items-start p-4 bg-white/60 dark:bg-gray-800/60 rounded-2xl cursor-pointer transition-all duration-300 hover:bg-white/90 dark:hover:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md">
                <div className="flex-shrink-0 pt-1">
                  <input
                    id="requireEmail"
                    name="requireEmail"
                    type="checkbox"
                    checked={formData.requireEmail}
                    onChange={handleInputChange}
                    className="w-6 h-6 rounded-md text-purple-600 border-gray-300 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-purple-600"
                  />
                </div>
                <div className="ml-4">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">Obrigar Email na Compra</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Solicita o email do comprador em todas as finalizações de compra.</p>
                </div>
              </label>

              {/* Outras configurações do formulário podem vir aqui */}

            </div>
          </section>

          {/* ... Outras seções do formulário (Imagens, Descrição, Prêmios, Promoções, etc.) ... */}

          {/* Seção: Imagens do Prêmio */}
          <section className="bg-white/50 dark:bg-gray-900/50 rounded-3xl p-6 sm:p-8 backdrop-blur-sm shadow-xl border border-gray-200/50 dark:border-gray-800/50">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <ImageIcon className="h-6 w-6 mr-3 text-purple-600 dark:text-purple-400" />
              Imagens do Prêmio
            </h2>
            <ImageUpload
              images={images}
              uploading={uploadingImages}
              uploadProgress={uploadProgress}
              onAddImages={addImages}
              onRemoveImage={removeImage}
              onReorderImages={reorderImages}
              multiple={true}
            />
          </section>

          {/* Seção: Descrição */}
          <section className="bg-white/50 dark:bg-gray-900/50 rounded-3xl p-6 sm:p-8 backdrop-blur-sm shadow-xl border border-gray-200/50 dark:border-gray-800/50">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <FileText className="h-6 w-6 mr-3 text-purple-600 dark:text-purple-400" />
              Descrição Detalhada
            </h2>
            <RichTextEditor
              value={formData.description}
              onChange={handleDescriptionChange}
              placeholder="Descreva seu prêmio, regras e detalhes importantes..."
            />
          </section>

          {/* Seção: Prêmios Adicionais e Promoções */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Prêmios Adicionais */}
            <div className="bg-white/50 dark:bg-gray-900/50 rounded-3xl p-6 backdrop-blur-sm shadow-xl border border-gray-200/50 dark:border-gray-800/50">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                Prêmios Adicionais ({prizes.length})
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Adicione prêmios para outros compradores (ex: 2º, 3º lugar, etc.).
              </p>
              <button
                type="button"
                onClick={() => setShowPrizesModal(true)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-purple-600 text-purple-600 rounded-xl hover:bg-purple-50 dark:hover:bg-gray-800 transition-colors duration-200"
              >
                <Plus className="h-5 w-5" />
                <span>Gerenciar Prêmios</span>
              </button>
              {prizes.length > 0 && (
                <ul className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                  {prizes.map((prize, index) => (
                    <li key={index} className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                      <span>{prize.name} ({prize.ticket_amount} cotas)</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Promoções */}
            <div className="bg-white/50 dark:bg-gray-900/50 rounded-3xl p-6 backdrop-blur-sm shadow-xl border border-gray-200/50 dark:border-gray-800/50">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <Gift className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                Promoções de Compra ({promotions.length})
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Configure descontos para a compra de múltiplas cotas.
              </p>
              <button
                type="button"
                onClick={() => setShowPromotionModal(true)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-purple-600 text-purple-600 rounded-xl hover:bg-purple-50 dark:hover:bg-gray-800 transition-colors duration-200"
              >
                <Plus className="h-5 w-5" />
                <span>Gerenciar Promoções</span>
              </button>
              {promotions.length > 0 && (
                <ul className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                  {promotions.map((promo, index) => (
                    <li key={index} className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                      <span>{promo.tickets_min} Cotas - {promo.discount_type === 'percentage' ? `${promo.discount_value}% OFF` : `R$ ${promo.discount_value.toFixed(2)} OFF`}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Seção: Modelo e Limites */}
          <section className="bg-white/50 dark:bg-gray-900/50 rounded-3xl p-6 sm:p-8 backdrop-blur-sm shadow-xl border border-gray-200/50 dark:border-gray-800/50">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <Settings className="h-6 w-6 mr-3 text-purple-600 dark:text-purple-400" />
              Modelo e Limites de Compra
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Modelo de Campanha */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                  Modelo de Escolha de Cotas
                </label>
                <select
                  name="campaignModel"
                  value={formData.campaignModel}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 transition-colors duration-200 appearance-none"
                  disabled={campaignModelError.includes('modelo manual não é permitido')}
                >
                  <option value="automatic">Automático (Escolha do sistema)</option>
                  <option value="manual">Manual (Escolha do comprador)</option>
                </select>
                {campaignModelError && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" /> {campaignModelError}
                  </p>
                )}
              </div>
              
              {/* Tempo de Reserva */}
              <div className="space-y-2">
                <label htmlFor="reservationTimeoutMinutes" className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                  Tempo de Reserva de Cotas
                </label>
                <select
                  id="reservationTimeoutMinutes"
                  name="reservationTimeoutMinutes"
                  value={formData.reservationTimeoutMinutes}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 transition-colors duration-200 appearance-none"
                >
                  {reservationTimeoutOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Tempo que o comprador tem para finalizar o pagamento antes da cota ser liberada.
                </p>
              </div>

              {/* Limite Mínimo */}
              <div className="space-y-2">
                <label htmlFor="minTicketsPerPurchase" className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                  Mínimo de Cotas por Compra
                </label>
                <input
                  id="minTicketsPerPurchase"
                  name="minTicketsPerPurchase"
                  type="number"
                  min="1"
                  max={formData.maxTicketsPerPurchase}
                  value={formData.minTicketsPerPurchase}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border ${errors.minTicketsPerPurchase ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 transition-colors duration-200`}
                />
                {errors.minTicketsPerPurchase && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" /> {errors.minTicketsPerPurchase}
                  </p>
                )}
              </div>

              {/* Limite Máximo */}
              <div className="space-y-2">
                <label htmlFor="maxTicketsPerPurchase" className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                  Máximo de Cotas por Compra
                </label>
                <input
                  id="maxTicketsPerPurchase"
                  name="maxTicketsPerPurchase"
                  type="number"
                  min={formData.minTicketsPerPurchase}
                  max={campaign.total_tickets}
                  value={formData.maxTicketsPerPurchase}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border ${errors.maxTicketsPerPurchase ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 transition-colors duration-200`}
                />
                {errors.maxTicketsPerPurchase && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" /> {errors.maxTicketsPerPurchase}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Seção: Data do Sorteio */}
          <section className="bg-white/50 dark:bg-gray-900/50 rounded-3xl p-6 sm:p-8 backdrop-blur-sm shadow-xl border border-gray-200/50 dark:border-gray-800/50">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <Calendar className="h-6 w-6 mr-3 text-purple-600 dark:text-purple-400" />
              Data do Sorteio
            </h2>

            <div className="flex space-x-4 mb-4">
              <button
                type="button"
                onClick={() => handleDrawDateOptionChange('no-date')}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-colors duration-200 ${
                  formData.showDrawDateOption === 'no-date'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/50'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Sem Data Prevista
              </button>
              <button
                type="button"
                onClick={() => handleDrawDateOptionChange('show-date')}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-colors duration-200 ${
                  formData.showDrawDateOption === 'show-date'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/50'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Com Data Prevista
              </button>
            </div>

            <AnimatePresence>
              {showInlineDatePicker && formData.showDrawDateOption === 'show-date' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden pt-4"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                      Data e Hora do Sorteio
                    </label>
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white flex items-center justify-between">
                        <span>
                          {formData.drawDate
                            ? formatDateTimeDisplay(formData.drawDate)
                            : 'Selecione uma data e hora'}
                        </span>
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenDateTimeModal}
                        className="p-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors duration-200 flex-shrink-0"
                      >
                        <ChevronDown className="h-6 w-6 transform rotate-90" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={handleGoBack}
              className="px-6 py-3 rounded-xl font-semibold text-gray-700 dark:text-gray-300 bg-gray-200/50 dark:bg-gray-800/50 hover:bg-gray-300/50 dark:hover:bg-gray-700/50 transition-colors duration-200 flex items-center space-x-2 shadow-sm"
            >
              <ArrowLeft className="h-6 w-6" />
              <span>Voltar</span>
            </button>
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="px-8 py-3 rounded-xl font-bold transition-all duration-300 ease-in-out flex items-center justify-center space-x-3 
                disabled:opacity-50 disabled:cursor-not-allowed
                bg-gradient-to-r from-[#7928CA] via-[#FF0080] via-[#007CF0] to-[#FF8C00] text-white"
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

        {/* DateTime Picker Modal */}
        <DateTimePickerModal
          isOpen={showDateTimeModal}
          onClose={() => setShowDateTimeModal(false)}
          onConfirm={handleDateTimeConfirm}
          selectedDate={formData.drawDate}
          minDate={new Date()}
        />
      </main>
    </div>
  );
};

export default CreateCampaignStep2Page;