import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  X, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  ChevronDown, 
  Calendar,
  Image,
  FileText,
  Settings,
  Gift,
  Tag,
  Loader2,
  Check
} from 'lucide-react';
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

// Componente auxiliar para aprimorar o DatePicker
const CustomDatePickerInput = React.forwardRef(({ value, onClick, isInvalid, placeholder }: any, ref: any) => (
  <button 
    className={`w-full text-left py-2 px-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-all duration-200 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 flex items-center justify-between ${isInvalid ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
    onClick={onClick} 
    ref={ref}
  >
    <span className={!value ? 'text-gray-400 dark:text-gray-500' : ''}>
      {value || placeholder}
    </span>
    <Calendar className="h-4 w-4 text-gray-400" />
  </button>
));

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
    uploadImagesToSupabase,
    setInitialImages,
  } = useImageUpload();

  // Local state for form
  const [description, setDescription] = useState('');
  const [drawDate, setDrawDate] = useState<Date | null>(null);
  const [showDrawDate, setShowDrawDate] = useState(true);
  const [drawMethod, setDrawMethod] = useState<'sorteio-ao-vivo' | 'milhar-federal' | 'outros'>('milhar-federal');
  const [showPercentage, setShowPercentage] = useState(true);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modal states
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [showPrizesModal, setShowPrizesModal] = useState(false);

  // --- Effect: Initialize form state with campaign data ---
  useEffect(() => {
    if (campaign && !campaignLoading) {
      setDescription(campaign.description || '');
      setDrawDate(campaign.draw_date ? new Date(campaign.draw_date) : null);
      setShowDrawDate(campaign.show_draw_date ?? true);
      setDrawMethod(campaign.draw_method as 'sorteio-ao-vivo' | 'milhar-federal' | 'outros' || 'milhar-federal');
      setShowPercentage(campaign.show_percentage ?? true);
      setPromotions(campaign.promotions || []);
      setPrizes(campaign.prizes || []);
      
      // Initialize image hook
      if (campaign.prize_image_urls) {
        setInitialImages(campaign.prize_image_urls.map(url => ({ url, file: null })));
      }
    }
  }, [campaign, campaignLoading, setInitialImages]);

  // --- Handlers for Modals ---
  const handleSavePromotions = (newPromotions: Promotion[]) => {
    setPromotions(newPromotions);
  };

  const handleSavePrizes = (newPrizes: Prize[]) => {
    setPrizes(newPrizes);
  };

  // --- Form Validation ---
  const isFormValid = (
    images.length > 0 &&
    (showDrawDate ? drawDate !== null : true)
  );
  
  // --- Main Submission Logic ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignId || loading || !isFormValid) return;
    
    setLoading(true);
    setError('');

    try {
      // 1. Upload new images and get all URLs (new and existing)
      const image_urls = await uploadImagesToSupabase(campaignId);

      // 2. Prepare data for update
      const updateData = {
        description,
        draw_date: showDrawDate && drawDate ? drawDate.toISOString() : null,
        show_draw_date: showDrawDate,
        draw_method: drawMethod,
        show_percentage: showPercentage,
        promotions: promotions,
        prizes: prizes,
        prize_image_urls: image_urls,
        status: 'active' as 'active' | 'draft', // Set to active on final step
      };

      // 3. Update campaign
      const success = await CampaignAPI.updateCampaign(campaignId, updateData);

      if (success) {
        // Navigate to dashboard or final success page
        navigate('/dashboard?success=campaign-created');
      } else {
        setError('Erro ao finalizar a campanha. Tente novamente.');
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      setError(`Ocorreu um erro: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // --- Loading/Error States ---
  if (campaignLoading || !campaignId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-xl">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-3" />
          <p className="text-gray-700 dark:text-gray-300 font-medium">Carregando dados da campanha...</p>
        </div>
      </div>
    );
  }

  // --- Rendered Component (Modernized) ---
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Step Indicator (Modernized Header) */}
        <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
            Finalizar Campanha: {campaign.title}
          </h1>
          <div className="flex justify-center items-center space-x-2">
            <div className="flex items-center text-green-600 dark:text-green-400">
              <Check className="h-5 w-5 mr-1" />
              <span className="text-sm font-semibold">Etapa 1: Base</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div className="flex items-center text-purple-600 dark:text-purple-400">
              <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mr-1">
                 <span className="text-xs font-bold">2</span>
              </div>
              <span className="text-sm font-bold">Etapa 2: Detalhes</span>
            </div>
          </div>
        </div>
        
        {/* Main Content Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Error Alert */}
          {error && (
            <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-300 flex items-start space-x-3 shadow-md border border-red-200 dark:border-red-800">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="font-medium">{error}</p>
            </div>
          )}
          
          {/* Card 1: Imagens do Prêmio */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="flex items-center text-xl font-bold text-gray-900 dark:text-white mb-4 border-b pb-2 border-gray-100 dark:border-gray-700/50">
              <Image className="h-6 w-6 mr-3 text-purple-600 dark:text-purple-400" />
              1. Imagens do Prêmio <span className="text-red-500 ml-1">*</span>
            </h2>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Faça o upload de fotos de alta qualidade do seu prêmio. A primeira imagem será a capa da campanha.
            </p>

            <ImageUpload
              images={images}
              uploading={uploadingImages}
              uploadProgress={uploadProgress}
              addImages={addImages}
              removeImage={removeImage}
              reorderImages={reorderImages}
              maxImages={5}
            />
            
            {images.length === 0 && (
              <p className="text-red-500 text-sm mt-2 font-medium flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                É necessário pelo menos uma imagem.
              </p>
            )}
            {uploadingImages && (
              <div className="mt-2 text-sm text-purple-600 dark:text-purple-400 font-medium">
                <Loader2 className="w-4 h-4 mr-1 inline-block animate-spin" />
                Carregando... ({Math.round(uploadProgress)}%)
              </div>
            )}
          </div>

          {/* Card 2: Descrição e Regulamento */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="flex items-center text-xl font-bold text-gray-900 dark:text-white mb-4 border-b pb-2 border-gray-100 dark:border-gray-700/50">
              <FileText className="h-6 w-6 mr-3 text-purple-600 dark:text-purple-400" />
              2. Descrição e Regulamento
            </h2>
            <RichTextEditor 
              value={description} 
              onChange={setDescription} 
              placeholder="Descreva o prêmio, as regras de participação e os detalhes da entrega/pagamento..."
            />
          </div>
          
          {/* Card 3: Promoções e Prêmios */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="flex items-center text-xl font-bold text-gray-900 dark:text-white mb-4 border-b pb-2 border-gray-100 dark:border-gray-700/50">
              <Gift className="h-6 w-6 mr-3 text-purple-600 dark:text-purple-400" />
              3. Detalhes Adicionais (Opcional)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Promoções Section */}
              <div className="p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <h3 className="flex items-center font-semibold text-gray-800 dark:text-gray-200 mb-3">
                   <Tag className="h-4 w-4 mr-2 text-blue-500" />
                   Promoções ({promotions.length})
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Crie descontos por quantidade de cotas. Ex: Leve 5 por R$X,00.
                </p>
                <button
                  type="button"
                  onClick={() => setShowPromotionModal(true)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 shadow-md"
                >
                  <Plus className="h-4 w-4" />
                  <span>Gerenciar Promoções</span>
                </button>
              </div>

              {/* Prêmios Section */}
              <div className="p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                 <h3 className="flex items-center font-semibold text-gray-800 dark:text-gray-200 mb-3">
                   <Gift className="h-4 w-4 mr-2 text-green-500" />
                   Prêmios ({prizes.length})
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Liste os prêmios da sua campanha (1º, 2º, 3º lugar, etc.).
                </p>
                <button
                  type="button"
                  onClick={() => setShowPrizesModal(true)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 shadow-md"
                >
                  <Plus className="h-4 w-4" />
                  <span>Gerenciar Prêmios</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 4: Configurações de Sorteio e Exibição */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="flex items-center text-xl font-bold text-gray-900 dark:text-white mb-4 border-b pb-2 border-gray-100 dark:border-gray-700/50">
              <Settings className="h-6 w-6 mr-3 text-purple-600 dark:text-purple-400" />
              4. Configurações Finais
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Draw Date & Visibility */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Data do Sorteio
                </h3>
                
                {/* Checkbox for visibility */}
                <div className="flex items-center">
                  <input
                    id="show_draw_date"
                    type="checkbox"
                    checked={showDrawDate}
                    onChange={(e) => setShowDrawDate(e.target.checked)}
                    className="h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 bg-gray-100 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label htmlFor="show_draw_date" className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                    Exibir data de sorteio na página
                  </label>
                </div>
                
                {/* Date Picker Input */}
                {showDrawDate && (
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Selecione a Data <span className="text-red-500">*</span>
                    </label>
                    <DatePicker
                      selected={drawDate}
                      onChange={(date: Date | null) => setDrawDate(date)}
                      locale="pt-BR"
                      showTimeSelect
                      timeFormat="p"
                      timeIntervals={15}
                      dateFormat="dd/MM/yyyy HH:mm"
                      placeholderText="Clique para selecionar a data e hora"
                      customInput={<CustomDatePickerInput isInvalid={!drawDate} placeholder="Selecione a Data e Hora" />}
                    />
                     {!drawDate && (
                        <p className="text-red-500 text-xs mt-1">A data de sorteio é obrigatória quando exibida.</p>
                      )}
                  </div>
                )}
              </div>

              {/* Draw Method */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Método de Sorteio
                </h3>
                <div className="relative">
                  <select
                    id="draw_method"
                    value={drawMethod}
                    onChange={(e) => setDrawMethod(e.target.value as 'sorteio-ao-vivo' | 'milhar-federal' | 'outros')}
                    className="w-full py-2.5 px-3 pr-10 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 appearance-none transition-all duration-200"
                  >
                    <option value="milhar-federal">Milhar da Loteria Federal</option>
                    <option value="sorteio-ao-vivo">Sorteio ao Vivo (Manual)</option>
                    <option value="outros">Outros</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                  O método escolhido será exibido na página da campanha.
                </p>
                
                {/* Show Percentage Checkbox */}
                 <div className="flex items-center pt-3 border-t border-gray-100 dark:border-gray-700/50">
                  <input
                    id="show_percentage"
                    type="checkbox"
                    checked={showPercentage}
                    onChange={(e) => setShowPercentage(e.target.checked)}
                    className="h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 bg-gray-100 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label htmlFor="show_percentage" className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                    Exibir porcentagem de cotas vendidas
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading || !isFormValid || uploadingImages}
              className={`
                bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white
                px-8 py-3 rounded-xl font-bold transition-all duration-300 
                flex items-center space-x-3 shadow-lg hover:shadow-xl hover:scale-[1.01]
              `}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Finalizando...</span>
                </>
              ) : uploadingImages ? (
                 <>
                  <Upload className="h-5 w-5" />
                  <span>Carregando Imagens ({Math.round(uploadProgress)}%)</span>
                </>
              ) : (
                <>
                  <span>Finalizar Campanha</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
          
          {/* Back Button */}
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => navigate(`/create-campaign-step-1?id=${campaignId}`)}
              className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 flex items-center space-x-1 px-4 py-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Voltar para Etapa 1</span>
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