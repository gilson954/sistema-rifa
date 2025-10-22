import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, ArrowRight, Plus, Trash2, AlertTriangle, ChevronDown, Calendar, Gift, Trophy, Settings, Image as ImageIcon, FileText, CheckCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // Adicionado imports de framer-motion
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

// Interface temporária para os dados do formulário
interface CampaignFormData {
    description: string;
    requireEmail: boolean;
    showRanking: boolean;
    minTicketsPerPurchase: number;
    maxTicketsPerPurchase: number;
    drawDate: Date | null;
    ticketPrice: number;
    totalTickets: number;
    acceptCampaignTerms: boolean; // NOVO CAMPO
    // ... outros campos necessários
}

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

  const [formData, setFormData] = useState<CampaignFormData>({
    description: '',
    requireEmail: true,
    showRanking: false,
    minTicketsPerPurchase: 1,
    maxTicketsPerPurchase: 50,
    drawDate: null,
    ticketPrice: 0,
    totalTickets: 0,
    acceptCampaignTerms: false, // NOVO CAMPO
  });

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [showPrizesModal, setShowPrizesModal] = useState(false);
  const [showDateTimeModal, setShowDateTimeModal] = useState(false);

  useEffect(() => {
    if (campaign) {
      setFormData({
        description: campaign.description || '',
        requireEmail: campaign.require_email || true,
        showRanking: campaign.show_ranking || false,
        minTicketsPerPurchase: campaign.min_tickets_per_purchase || 1,
        maxTicketsPerPurchase: campaign.max_tickets_per_purchase || 50,
        drawDate: campaign.draw_date ? new Date(campaign.draw_date) : null,
        ticketPrice: campaign.ticket_price || 0,
        totalTickets: campaign.total_tickets || 0,
        acceptCampaignTerms: false, // Mantenha false ao carregar, ou carregue do dado se existir
      });
      setExistingImages(campaign.images || []);
      setPromotions(campaign.promotions || []);
      setPrizes(campaign.prizes || []);
    }
  }, [campaign, setExistingImages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleCheckboxChange = (name: keyof CampaignFormData, checked: boolean) => {
    setFormData(prev => ({
        ...prev,
        [name]: checked
    }));
  };

  const handleRichTextChange = (content: string) => {
    setFormData(prev => ({ ...prev, description: content }));
  };

  const handleSavePromotions = (newPromotions: Promotion[]) => {
    setPromotions(newPromotions);
    setShowPromotionModal(false);
  };

  const handleSavePrizes = (newPrizes: Prize[]) => {
    setPrizes(newPrizes);
    setShowPrizesModal(false);
  };

  const handleDateTimeConfirm = (date: Date) => {
    setFormData(prev => ({ ...prev, drawDate: date }));
    setShowDateTimeModal(false);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.description || formData.description.length < 50) {
      newErrors.description = 'A descrição da campanha deve ter no mínimo 50 caracteres.';
    }
    if (!formData.drawDate) {
        newErrors.drawDate = 'A data e hora do sorteio são obrigatórias.';
    }
    if (prizes.length === 0) {
        newErrors.prizes = 'É obrigatório cadastrar pelo menos 1 prêmio.';
    }
    if (images.length === 0) {
        newErrors.images = 'É obrigatório carregar pelo menos 1 imagem.';
    }
    // Adicionando a validação para o novo campo
    if (!formData.acceptCampaignTerms) {
        newErrors.acceptCampaignTerms = 'Você deve aceitar os termos de criação da campanha para continuar.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveAndContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
        console.error("Validation failed", errors);
        return;
    }

    setLoading(true);
    let uploadedImagesUrls = campaign?.images || [];

    // 1. Upload Images
    if (images.some(img => img.file)) {
      try {
        uploadedImagesUrls = await uploadImages(campaignId || '');
      } catch (error) {
        console.error('Error uploading images:', error);
        setErrors(prev => ({ ...prev, images: 'Erro ao fazer upload das imagens.' }));
        setLoading(false);
        return;
      }
    }

    // 2. Prepare Data
    const campaignDataToSave = {
        ...formData,
        draw_date: formData.drawDate?.toISOString(),
        images: uploadedImagesUrls,
        promotions: promotions,
        prizes: prizes,
        // Não envie acceptCampaignTerms para a API, pois é um campo de UI/validação
        // ...removendo acceptCampaignTerms
    };
    
    // 3. Save Campaign Data
    try {
        if (campaignId) {
            await CampaignAPI.updateCampaign(campaignId, campaignDataToSave);
        } else {
            // Este passo não deveria ser alcançado se o Step1 foi completado corretamente
            console.error('Campaign ID missing for update.');
            setLoading(false);
            return;
        }
        
        // Success
        navigate(`/admin/campaigns/${campaignId}/step3`);
    } catch (error) {
        console.error('Error saving campaign data:', error);
        setErrors(prev => ({ ...prev, api: 'Erro ao salvar a campanha. Tente novamente.' }));
    } finally {
        setLoading(false);
    }
  };

  if (campaignLoading) {
    return <div className="text-center p-8">Carregando dados da campanha...</div>;
  }

  // Define um layout simples de admin
  const primaryColor = campaign?.primary_color || '#3B82F6';

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 sm:p-8">
      <main className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-10">
        <div className="flex justify-between items-center mb-8 pb-4 border-b dark:border-gray-700">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Detalhes da Campanha - {campaign?.title || 'Nova Campanha'}
            </h1>
            <button 
                onClick={() => navigate(`/admin/campaigns/${campaignId}/step1`)}
                className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 transition"
            >
                <ArrowLeft className="w-5 h-5" />
                <span>Voltar</span>
            </button>
        </div>

        <form onSubmit={handleSaveAndContinue} className="space-y-8">
            {/* Seção 1: Descrição e Mídia */}
            <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-6 h-6 text-indigo-500" /> Descrição e Mídia
                </h2>

                {/* Descrição */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Descrição Detalhada da Campanha <span className="text-red-500">*</span>
                    </label>
                    <RichTextEditor 
                        content={formData.description}
                        onContentChange={handleRichTextChange}
                    />
                    {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                </div>

                {/* Imagens */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" /> Imagens da Campanha <span className="text-red-500">*</span>
                    </label>
                    <ImageUpload
                        images={images}
                        uploading={uploadingImages}
                        uploadProgress={uploadProgress}
                        onAddImages={addImages}
                        onRemoveImage={removeImage}
                        onReorderImages={reorderImages}
                    />
                    {errors.images && <p className="text-red-500 text-sm mt-1">{errors.images}</p>}
                </div>
            </div>

            {/* Seção 2: Prêmios e Datas */}
            <div className="space-y-6 pt-6 border-t dark:border-gray-700">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-pink-500" /> Prêmios e Sorteio
                </h2>

                {/* Prêmios */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            Prêmios Cadastrados ({prizes.length}) <span className="text-red-500">*</span>
                        </label>
                        <button 
                            type="button" 
                            onClick={() => setShowPrizesModal(true)}
                            className="flex items-center px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition"
                        >
                            <Gift className="w-4 h-4 mr-2" /> Gerenciar Prêmios
                        </button>
                    </div>
                    {prizes.length === 0 && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
                            <p className="text-sm text-red-600 dark:text-red-300">
                                {errors.prizes || 'Nenhum prêmio cadastrado. Clique em "Gerenciar Prêmios" para adicionar.'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Data do Sorteio */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Calendar className="w-5 h-5" /> Data e Hora do Sorteio <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={formData.drawDate ? formData.drawDate.toLocaleString('pt-BR') : 'Clique para selecionar a data'}
                            readOnly
                            onClick={() => setShowDateTimeModal(true)}
                            className={`w-full p-3.5 border-2 rounded-xl text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 cursor-pointer transition ${
                                errors.drawDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                            } hover:border-indigo-500 dark:hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                        />
                        <Calendar className="absolute right-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </div>
                    {errors.drawDate && <p className="text-red-500 text-sm mt-1">{errors.drawDate}</p>}
                </div>
            </div>

            {/* Seção 3: Configurações Adicionais */}
            <div className="space-y-6 pt-6 border-t dark:border-gray-700">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Settings className="w-6 h-6 text-green-500" /> Configurações
                </h2>

                {/* Configurações de Checkbox/Switch */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border dark:border-gray-600">
                        <label htmlFor="requireEmail" className="text-base font-medium text-gray-900 dark:text-white cursor-pointer">
                            Exigir E-mail no Cadastro
                        </label>
                        <input
                            id="requireEmail"
                            type="checkbox"
                            checked={formData.requireEmail}
                            onChange={(e) => handleCheckboxChange('requireEmail', e.target.checked)}
                            className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border dark:border-gray-600">
                        <label htmlFor="showRanking" className="text-base font-medium text-gray-900 dark:text-white cursor-pointer">
                            Mostrar Ranking de Compradores
                        </label>
                        <input
                            id="showRanking"
                            type="checkbox"
                            checked={formData.showRanking}
                            onChange={(e) => handleCheckboxChange('showRanking', e.target.checked)}
                            className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                    </div>
                </div>

                {/* Promoções */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Gift className="w-5 h-5" /> Promoções Cadastradas ({promotions.length})
                        </label>
                        <button 
                            type="button" 
                            onClick={() => setShowPromotionModal(true)}
                            className="flex items-center px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Gerenciar Promoções
                        </button>
                    </div>
                </div>
            </div>
            
            {/* SEÇÃO DO CHECKBOX ANIMADO (NOVO) */}
            <motion.div 
              className="space-y-4 pt-6 border-t dark:border-gray-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Confirmação</h2>
              <motion.div 
                className={`p-4 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-md`}
                whileHover={{ scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <label htmlFor="acceptCampaignTerms" className="flex items-start gap-3 cursor-pointer group">
                  <motion.div 
                    className="relative flex-shrink-0 mt-0.5"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <input
                      type="checkbox"
                      id="acceptCampaignTerms"
                      checked={formData.acceptCampaignTerms}
                      onChange={(e) => handleCheckboxChange('acceptCampaignTerms', e.target.checked)}
                      className="peer sr-only" // Input real, invisível mas acessível
                      required
                    />
                    <motion.div
                      className={`w-5 h-5 rounded-lg border-2 transition-all duration-200 flex items-center justify-center ${
                        formData.acceptCampaignTerms
                          ? 'bg-transparent border-transparent'
                          : 'border-gray-400 dark:border-gray-500 group-hover:border-indigo-500'
                      }`}
                      animate={formData.acceptCampaignTerms ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.3 }}
                      style={formData.acceptCampaignTerms ? { borderColor: 'transparent', backgroundColor: 'transparent' } : {} as React.CSSProperties}
                    >
                      <AnimatePresence>
                        {formData.acceptCampaignTerms && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 180 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                          >
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </motion.div>
                  <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed cursor-pointer">
                    Ao finalizar, declaro que li e concordo com os{' '}
                    <a href="#" className="font-semibold hover:underline text-indigo-600 dark:text-indigo-400">
                      termos de uso
                    </a>{' '}
                    e as{' '}
                    <a href="#" className="font-semibold hover:underline text-indigo-600 dark:text-indigo-400">
                      políticas de criação de campanhas
                    </a>
                    .
                  </span>
                </label>
              </motion.div>
              <AnimatePresence>
                {errors.acceptCampaignTerms && (
                    <motion.p 
                        className="text-red-500 text-sm font-medium flex items-center gap-1 mt-2"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {errors.acceptCampaignTerms}
                    </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
            {/* FIM DA SEÇÃO DO CHECKBOX ANIMADO */}

            {/* Botão Finalizar e continuar */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center space-x-2 px-6 py-4 rounded-xl text-lg font-bold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed
                bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white
              `}
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

            {errors.api && (
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                <p className="font-medium">{errors.api}</p>
              </div>
            )}
          </div>
        </form>

        {/* Promotion Modal */}
        <PromotionModal
          isOpen={showPromotionModal}
          onClose={() => setShowPromotionModal(false)}
          onSavePromotions={handleSavePromotions}
          initialPromotions={promotions}
          originalTicketPrice={campaign?.ticket_price || formData.ticketPrice}
          campaignTotalTickets={campaign?.total_tickets || formData.totalTickets}
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