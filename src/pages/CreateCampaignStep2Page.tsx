import React, { useState, useEffect } from 'react';
import { Upload, X, ChevronDown, Save, Eye, Info, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCampaign, useCampaigns } from '../hooks/useCampaigns';
import { useImageUpload } from '../hooks/useImageUpload';
import { ImageUpload } from '../components/ImageUpload';

const CreateCampaignStep2Page = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateCampaign } = useCampaigns();
  const imageUpload = useImageUpload();
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('id');
  const location = useLocation();

  // Fetch campaign data using the hook
  const { campaign, loading: fetchingCampaign, error: fetchError } = useCampaign(campaignId || '');

  const [formData, setFormData] = useState({
    title: '',
    ticketQuantity: 25,
    ticketPrice: '0,00',
    drawLocation: '',
    phoneNumber: '+55',
    countryCode: '+55',
    model: 'manual',
    description: '',
    minQuantity: 1,
    maxQuantity: 200000,
    initialFilter: 'all',
    drawDate: null as string | null,
    paymentDeadlineHours: 24,
    requireEmail: true,
    showRanking: false
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Load campaign data when available
  useEffect(() => {
    if (campaign) {
      setFormData({
        title: campaign.title || '',
        ticketQuantity: campaign.total_tickets || 25,
        ticketPrice: campaign.ticket_price ? campaign.ticket_price.toFixed(2).replace('.', ',') : '0,00',
        drawLocation: campaign.draw_method || '',
        phoneNumber: campaign.phone_number || '+55',
        countryCode: '+55',
        model: campaign.campaign_model || 'manual',
        description: campaign.description || '',
        minQuantity: campaign.min_tickets_per_purchase || 1,
        maxQuantity: campaign.max_tickets_per_purchase || 200000,
        initialFilter: campaign.initial_filter || 'all',
        drawDate: campaign.draw_date,
        paymentDeadlineHours: campaign.payment_deadline_hours || 24,
        requireEmail: campaign.require_email ?? true,
        showRanking: campaign.show_ranking ?? false
      });

      // Set existing images if available
      if (campaign.prize_image_urls && campaign.prize_image_urls.length > 0) {
        imageUpload.setExistingImages(campaign.prize_image_urls);
      }
    }
  }, [campaign]);

  // Predefined ticket quantity options (same as Step 1)
  const ticketOptions = [
    25, 50, 100, 200, 300, 500, 1000, 2000, 3000, 5000, 
    10000, 20000, 30000, 50000, 100000, 200000, 300000, 
    500000, 1000000, 2000000, 3000000, 5000000, 10000000
  ];

  // Auto-save functionality with debounce
  useEffect(() => {
    if (!campaignId || !user) return;

    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    const timeout = setTimeout(() => {
      handleAutoSave();
    }, 1000);

    setAutoSaveTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [formData]);

  const handleAutoSave = async () => {
    if (!campaignId || !user || saveStatus === 'saving') return;

    try {
      setSaveStatus('saving');
      const updateData = convertFormDataToAPI(formData);
      await updateCampaign({ id: campaignId, ...updateData });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Auto-save error:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEdit = () => {
    // Allow editing - this is already the edit page
  };

  const handlePreview = () => {
    if (campaignId) {
      window.open(`/campaign/${campaignId}`, '_blank');
    }
  };

  const handleFinalize = async () => {
    if (!campaignId || !user) return;

    try {
      setSaveStatus('saving');
      
      // Upload images first if there are any
      let imageUrls: string[] = [];
      if (imageUpload.images.length > 0) {
        imageUrls = await imageUpload.uploadImages(user.id);
      }

      const updateData = convertFormDataToAPI(formData);
      updateData.prize_image_urls = imageUrls.length > 0 ? imageUrls : undefined;

      await updateCampaign({ id: campaignId, ...updateData });
      navigate(`/dashboard/create-campaign/step-3?id=${campaignId}`);
    } catch (error) {
      console.error('Error finalizing campaign:', error);
      setSaveStatus('error');
    }
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return '0,00';
    const cents = parseInt(numericValue, 10);
    const reais = cents / 100;
    return reais.toFixed(2).replace('.', ',');
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formattedValue = formatCurrency(inputValue);
    handleInputChange('ticketPrice', formattedValue);
  };

  // Validation functions
  const getFieldError = (field: string) => {
    switch (field) {
      case 'title':
        return !formData.title ? 'Título é obrigatório' : null;
      case 'ticketQuantity':
        return !formData.ticketQuantity || formData.ticketQuantity < 1 ? 'Quantidade deve ser maior que 0' : null;
      case 'ticketPrice':
        return !formData.ticketPrice || parseFloat(formData.ticketPrice.replace(',', '.')) <= 0 ? 'Preço deve ser maior que 0' : null;
      case 'drawLocation':
        return !formData.drawLocation ? 'Local de sorteio é obrigatório' : null;
      case 'phoneNumber':
        return !formData.phoneNumber || formData.phoneNumber.length < 10 ? 'Número de telefone inválido' : null;
      case 'model':
        return !formData.model ? 'Modelo é obrigatório' : null;
      default:
        return null;
    }
  };

  if (fetchingCampaign) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          <span className="text-gray-600 dark:text-gray-400">Carregando campanha...</span>
        </div>
      </div>
    );
  }

  if (fetchError || !campaign) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Erro ao carregar campanha
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {fetchError || 'Campanha não encontrada'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                ✏️ Editando: {formData.title || 'Nova Campanha'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleEdit}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <Save className="h-4 w-4 mr-2" />
                Editar
              </button>
              
              <button
                onClick={handlePreview}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors duration-200"
              >
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <div className="p-6">
            {/* Save Status */}
            {saveStatus !== 'idle' && (
              <div className="mb-6 flex items-center justify-center">
                {saveStatus === 'saving' && (
                  <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Salvando automaticamente...</span>
                  </div>
                )}
                {saveStatus === 'saved' && (
                  <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                    <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
                      <div className="h-2 w-2 bg-white rounded-full"></div>
                    </div>
                    <span className="text-sm">Salvo automaticamente</span>
                  </div>
                )}
                {saveStatus === 'error' && (
                  <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Erro ao salvar</span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título da campanha *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Digite o título da sua campanha"
                  className={`w-full bg-white dark:bg-gray-800 border rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 ${
                    getFieldError('title') ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {getFieldError('title') && (
                  <div className="mt-1 flex items-center space-x-1 text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{getFieldError('title')}</span>
                  </div>
                )}
              </div>

              {/* Ticket Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quantidade de cotas *
                </label>
                <div className="relative">
                  <select
                    value={formData.ticketQuantity}
                    onChange={(e) => handleInputChange('ticketQuantity', parseInt(e.target.value))}
                    className={`w-full appearance-none bg-white dark:bg-gray-800 border rounded-lg px-4 py-3 pr-10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 ${
                      getFieldError('ticketQuantity') ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <option value="">Escolha uma opção</option>
                    {ticketOptions.map((option) => (
                      <option key={option} value={option}>
                        {option.toLocaleString('pt-BR')} cotas
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
                {getFieldError('ticketQuantity') && (
                  <div className="mt-1 flex items-center space-x-1 text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{getFieldError('ticketQuantity')}</span>
                  </div>
                )}
              </div>

              {/* Ticket Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valor da cota *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">R$</span>
                  <input
                    type="text"
                    value={formData.ticketPrice}
                    onChange={handlePriceChange}
                    placeholder="0,00"
                    className={`w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 ${
                      getFieldError('ticketPrice') ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                </div>
                {getFieldError('ticketPrice') && (
                  <div className="mt-1 flex items-center space-x-1 text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{getFieldError('ticketPrice')}</span>
                  </div>
                )}
              </div>

              {/* Draw Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Local de sorteio *
                </label>
                <div className="relative">
                  <select
                    value={formData.drawLocation}
                    onChange={(e) => handleInputChange('drawLocation', e.target.value)}
                    className={`w-full appearance-none bg-white dark:bg-gray-800 border rounded-lg px-4 py-3 pr-10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 ${
                      getFieldError('drawLocation') ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
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
                {getFieldError('drawLocation') && (
                  <div className="mt-1 flex items-center space-x-1 text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{getFieldError('drawLocation')}</span>
                  </div>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Número de celular *
                </label>
                <div className="flex space-x-2">
                  <div className="relative">
                    <select 
                      value={formData.countryCode}
                      onChange={(e) => handleInputChange('countryCode', e.target.value)}
                      className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pr-8 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                    >
                      <option value="+55">🇧🇷 Brasil (+55)</option>
                      <option value="+376">🇦🇩 Andorra (+376)</option>
                      <option value="+971">🇦🇪 Emirados Árabes Unidos (+971)</option>
                      <option value="+93">🇦🇫 Afeganistão (+93)</option>
                      <option value="+1268">🇦🇬 Antígua e Barbuda (+1268)</option>
                      <option value="+1264">🇦🇮 Anguilla (+1264)</option>
                      <option value="+355">🇦🇱 Albânia (+355)</option>
                      <option value="+374">🇦🇲 Armênia (+374)</option>
                      <option value="+244">🇦🇴 Angola (+244)</option>
                      <option value="+672">🇦🇶 Antártida (+672)</option>
                      <option value="+54">🇦🇷 Argentina (+54)</option>
                      <option value="+1684">🇦🇸 Samoa Americana (+1684)</option>
                      <option value="+43">🇦🇹 Áustria (+43)</option>
                      <option value="+61">🇦🇺 Austrália (+61)</option>
                      <option value="+297">🇦🇼 Aruba (+297)</option>
                      <option value="+358">🇦🇽 Ilhas Åland (+358)</option>
                      <option value="+994">🇦🇿 Azerbaijão (+994)</option>
                      <option value="+387">🇧🇦 Bósnia e Herzegovina (+387)</option>
                      <option value="+1246">🇧🇧 Barbados (+1246)</option>
                      <option value="+880">🇧🇩 Bangladesh (+880)</option>
                      <option value="+32">🇧🇪 Bélgica (+32)</option>
                      <option value="+226">🇧🇫 Burkina Faso (+226)</option>
                      <option value="+359">🇧🇬 Bulgária (+359)</option>
                      <option value="+973">🇧🇭 Bahrein (+973)</option>
                      <option value="+257">🇧🇮 Burundi (+257)</option>
                      <option value="+229">🇧🇯 Benin (+229)</option>
                      <option value="+590">🇧🇱 São Bartolomeu (+590)</option>
                      <option value="+1441">🇧🇲 Bermudas (+1441)</option>
                      <option value="+673">🇧🇳 Brunei (+673)</option>
                      <option value="+591">🇧🇴 Bolívia (+591)</option>
                      <option value="+599">🇧🇶 Bonaire (+599)</option>
                      <option value="+1242">🇧🇸 Bahamas (+1242)</option>
                      <option value="+975">🇧🇹 Butão (+975)</option>
                      <option value="+47">🇧🇻 Ilha Bouvet (+47)</option>
                      <option value="+267">🇧🇼 Botsuana (+267)</option>
                      <option value="+375">🇧🇾 Bielorrússia (+375)</option>
                      <option value="+501">🇧🇿 Belize (+501)</option>
                      <option value="+1">🇨🇦 Canadá (+1)</option>
                      <option value="+61">🇨🇨 Ilhas Cocos (+61)</option>
                      <option value="+243">🇨🇩 República Democrática do Congo (+243)</option>
                      <option value="+236">🇨🇫 República Centro-Africana (+236)</option>
                      <option value="+242">🇨🇬 República do Congo (+242)</option>
                      <option value="+41">🇨🇭 Suíça (+41)</option>
                      <option value="+225">🇨🇮 Costa do Marfim (+225)</option>
                      <option value="+682">🇨🇰 Ilhas Cook (+682)</option>
                      <option value="+56">🇨🇱 Chile (+56)</option>
                      <option value="+237">🇨🇲 Camarões (+237)</option>
                      <option value="+86">🇨🇳 China (+86)</option>
                      <option value="+57">🇨🇴 Colômbia (+57)</option>
                      <option value="+506">🇨🇷 Costa Rica (+506)</option>
                      <option value="+53">🇨🇺 Cuba (+53)</option>
                      <option value="+238">🇨🇻 Cabo Verde (+238)</option>
                      <option value="+599">🇨🇼 Curaçao (+599)</option>
                      <option value="+61">🇨🇽 Ilha Christmas (+61)</option>
                      <option value="+357">🇨🇾 Chipre (+357)</option>
                      <option value="+420">🇨🇿 República Tcheca (+420)</option>
                      <option value="+49">🇩🇪 Alemanha (+49)</option>
                      <option value="+253">🇩🇯 Djibuti (+253)</option>
                      <option value="+45">🇩🇰 Dinamarca (+45)</option>
                      <option value="+1767">🇩🇲 Dominica (+1767)</option>
                      <option value="+1809">🇩🇴 República Dominicana (+1809)</option>
                      <option value="+213">🇩🇿 Argélia (+213)</option>
                      <option value="+593">🇪🇨 Equador (+593)</option>
                      <option value="+372">🇪🇪 Estônia (+372)</option>
                      <option value="+20">🇪🇬 Egito (+20)</option>
                      <option value="+212">🇪🇭 Saara Ocidental (+212)</option>
                      <option value="+291">🇪🇷 Eritreia (+291)</option>
                      <option value="+34">🇪🇸 Espanha (+34)</option>
                      <option value="+251">🇪🇹 Etiópia (+251)</option>
                      <option value="+358">🇫🇮 Finlândia (+358)</option>
                      <option value="+679">🇫🇯 Fiji (+679)</option>
                      <option value="+500">🇫🇰 Ilhas Malvinas (+500)</option>
                      <option value="+691">🇫🇲 Micronésia (+691)</option>
                      <option value="+298">🇫🇴 Ilhas Faroé (+298)</option>
                      <option value="+33">🇫🇷 França (+33)</option>
                      <option value="+241">🇬🇦 Gabão (+241)</option>
                      <option value="+44">🇬🇧 Reino Unido (+44)</option>
                      <option value="+1473">🇬🇩 Granada (+1473)</option>
                      <option value="+995">🇬🇪 Geórgia (+995)</option>
                      <option value="+594">🇬🇫 Guiana Francesa (+594)</option>
                      <option value="+44">🇬🇬 Guernsey (+44)</option>
                      <option value="+233">🇬🇭 Gana (+233)</option>
                      <option value="+350">🇬🇮 Gibraltar (+350)</option>
                      <option value="+299">🇬🇱 Groenlândia (+299)</option>
                      <option value="+220">🇬🇲 Gâmbia (+220)</option>
                      <option value="+224">🇬🇳 Guiné (+224)</option>
                      <option value="+590">🇬🇵 Guadalupe (+590)</option>
                      <option value="+240">🇬🇶 Guiné Equatorial (+240)</option>
                      <option value="+30">🇬🇷 Grécia (+30)</option>
                      <option value="+500">🇬🇸 Geórgia do Sul (+500)</option>
                      <option value="+502">🇬🇹 Guatemala (+502)</option>
                      <option value="+1671">🇬🇺 Guam (+1671)</option>
                      <option value="+245">🇬🇼 Guiné-Bissau (+245)</option>
                      <option value="+592">🇬🇾 Guiana (+592)</option>
                      <option value="+852">🇭🇰 Hong Kong (+852)</option>
                      <option value="+672">🇭🇲 Ilha Heard (+672)</option>
                      <option value="+504">🇭🇳 Honduras (+504)</option>
                      <option value="+385">🇭🇷 Croácia (+385)</option>
                      <option value="+509">🇭🇹 Haiti (+509)</option>
                      <option value="+36">🇭🇺 Hungria (+36)</option>
                      <option value="+62">🇮🇩 Indonésia (+62)</option>
                      <option value="+353">🇮🇪 Irlanda (+353)</option>
                      <option value="+972">🇮🇱 Israel (+972)</option>
                      <option value="+44">🇮🇲 Ilha de Man (+44)</option>
                      <option value="+91">🇮🇳 Índia (+91)</option>
                      <option value="+246">🇮🇴 Território Britânico do Oceano Índico (+246)</option>
                      <option value="+964">🇮🇶 Iraque (+964)</option>
                      <option value="+98">🇮🇷 Irã (+98)</option>
                      <option value="+354">🇮🇸 Islândia (+354)</option>
                      <option value="+39">🇮🇹 Itália (+39)</option>
                      <option value="+44">🇯🇪 Jersey (+44)</option>
                      <option value="+1876">🇯🇲 Jamaica (+1876)</option>
                      <option value="+962">🇯🇴 Jordânia (+962)</option>
                      <option value="+81">🇯🇵 Japão (+81)</option>
                      <option value="+254">🇰🇪 Quênia (+254)</option>
                      <option value="+996">🇰🇬 Quirguistão (+996)</option>
                      <option value="+855">🇰🇭 Camboja (+855)</option>
                      <option value="+686">🇰🇮 Kiribati (+686)</option>
                      <option value="+269">🇰🇲 Comores (+269)</option>
                      <option value="+1869">🇰🇳 São Cristóvão e Nevis (+1869)</option>
                      <option value="+850">🇰🇵 Coreia do Norte (+850)</option>
                      <option value="+82">🇰🇷 Coreia do Sul (+82)</option>
                      <option value="+965">🇰🇼 Kuwait (+965)</option>
                      <option value="+1345">🇰🇾 Ilhas Cayman (+1345)</option>
                      <option value="+7">🇰🇿 Cazaquistão (+7)</option>
                      <option value="+856">🇱🇦 Laos (+856)</option>
                      <option value="+961">🇱🇧 Líbano (+961)</option>
                      <option value="+1758">🇱🇨 Santa Lúcia (+1758)</option>
                      <option value="+423">🇱🇮 Liechtenstein (+423)</option>
                      <option value="+94">🇱🇰 Sri Lanka (+94)</option>
                      <option value="+231">🇱🇷 Libéria (+231)</option>
                      <option value="+266">🇱🇸 Lesoto (+266)</option>
                      <option value="+370">🇱🇹 Lituânia (+370)</option>
                      <option value="+352">🇱🇺 Luxemburgo (+352)</option>
                      <option value="+371">🇱🇻 Letônia (+371)</option>
                      <option value="+218">🇱🇾 Líbia (+218)</option>
                      <option value="+212">🇲🇦 Marrocos (+212)</option>
                      <option value="+377">🇲🇨 Mônaco (+377)</option>
                      <option value="+373">🇲🇩 Moldávia (+373)</option>
                      <option value="+382">🇲🇪 Montenegro (+382)</option>
                      <option value="+590">🇲🇫 São Martinho (+590)</option>
                      <option value="+261">🇲🇬 Madagascar (+261)</option>
                      <option value="+692">🇲🇭 Ilhas Marshall (+692)</option>
                      <option value="+389">🇲🇰 Macedônia do Norte (+389)</option>
                      <option value="+223">🇲🇱 Mali (+223)</option>
                      <option value="+95">🇲🇲 Myanmar (+95)</option>
                      <option value="+976">🇲🇳 Mongólia (+976)</option>
                      <option value="+853">🇲🇴 Macau (+853)</option>
                      <option value="+1670">🇲🇵 Ilhas Marianas do Norte (+1670)</option>
                      <option value="+596">🇲🇶 Martinica (+596)</option>
                      <option value="+222">🇲🇷 Mauritânia (+222)</option>
                      <option value="+1664">🇲🇸 Montserrat (+1664)</option>
                      <option value="+356">🇲🇹 Malta (+356)</option>
                      <option value="+230">🇲🇺 Maurício (+230)</option>
                      <option value="+960">🇲🇻 Maldivas (+960)</option>
                      <option value="+265">🇲🇼 Malawi (+265)</option>
                      <option value="+52">🇲🇽 México (+52)</option>
                      <option value="+60">🇲🇾 Malásia (+60)</option>
                      <option value="+258">🇲🇿 Moçambique (+258)</option>
                      <option value="+264">🇳🇦 Namíbia (+264)</option>
                      <option value="+687">🇳🇨 Nova Caledônia (+687)</option>
                      <option value="+227">🇳🇪 Níger (+227)</option>
                      <option value="+672">🇳🇫 Ilha Norfolk (+672)</option>
                      <option value="+234">🇳🇬 Nigéria (+234)</option>
                      <option value="+505">🇳🇮 Nicarágua (+505)</option>
                      <option value="+31">🇳🇱 Países Baixos (+31)</option>
                      <option value="+47">🇳🇴 Noruega (+47)</option>
                      <option value="+977">🇳🇵 Nepal (+977)</option>
                      <option value="+674">🇳🇷 Nauru (+674)</option>
                      <option value="+683">🇳🇺 Niue (+683)</option>
                      <option value="+64">🇳🇿 Nova Zelândia (+64)</option>
                      <option value="+968">🇴🇲 Omã (+968)</option>
                      <option value="+507">🇵🇦 Panamá (+507)</option>
                      <option value="+51">🇵🇪 Peru (+51)</option>
                      <option value="+689">🇵🇫 Polinésia Francesa (+689)</option>
                      <option value="+675">🇵🇬 Papua-Nova Guiné (+675)</option>
                      <option value="+63">🇵🇭 Filipinas (+63)</option>
                      <option value="+92">🇵🇰 Paquistão (+92)</option>
                      <option value="+48">🇵🇱 Polônia (+48)</option>
                      <option value="+508">🇵🇲 São Pedro e Miquelon (+508)</option>
                      <option value="+64">🇵🇳 Ilhas Pitcairn (+64)</option>
                      <option value="+1787">🇵🇷 Porto Rico (+1787)</option>
                      <option value="+970">🇵🇸 Palestina (+970)</option>
                      <option value="+351">🇵🇹 Portugal (+351)</option>
                      <option value="+680">🇵🇼 Palau (+680)</option>
                      <option value="+595">🇵🇾 Paraguai (+595)</option>
                      <option value="+974">🇶🇦 Catar (+974)</option>
                      <option value="+262">🇷🇪 Reunião (+262)</option>
                      <option value="+40">🇷🇴 Romênia (+40)</option>
                      <option value="+381">🇷🇸 Sérvia (+381)</option>
                      <option value="+7">🇷🇺 Rússia (+7)</option>
                      <option value="+250">🇷🇼 Ruanda (+250)</option>
                      <option value="+966">🇸🇦 Arábia Saudita (+966)</option>
                      <option value="+677">🇸🇧 Ilhas Salomão (+677)</option>
                      <option value="+248">🇸🇨 Seicheles (+248)</option>
                      <option value="+249">🇸🇩 Sudão (+249)</option>
                      <option value="+46">🇸🇪 Suécia (+46)</option>
                      <option value="+65">🇸🇬 Singapura (+65)</option>
                      <option value="+290">🇸🇭 Santa Helena (+290)</option>
                      <option value="+386">🇸🇮 Eslovênia (+386)</option>
                      <option value="+47">🇸🇯 Svalbard e Jan Mayen (+47)</option>
                      <option value="+421">🇸🇰 Eslováquia (+421)</option>
                      <option value="+232">🇸🇱 Serra Leoa (+232)</option>
                      <option value="+378">🇸🇲 San Marino (+378)</option>
                      <option value="+221">🇸🇳 Senegal (+221)</option>
                      <option value="+252">🇸🇴 Somália (+252)</option>
                      <option value="+597">🇸🇷 Suriname (+597)</option>
                      <option value="+211">🇸🇸 Sudão do Sul (+211)</option>
                      <option value="+239">🇸🇹 São Tomé e Príncipe (+239)</option>
                      <option value="+503">🇸🇻 El Salvador (+503)</option>
                      <option value="+1721">🇸🇽 Sint Maarten (+1721)</option>
                      <option value="+963">🇸🇾 Síria (+963)</option>
                      <option value="+268">🇸🇿 Eswatini (+268)</option>
                      <option value="+1649">🇹🇨 Ilhas Turks e Caicos (+1649)</option>
                      <option value="+235">🇹🇩 Chade (+235)</option>
                      <option value="+262">🇹🇫 Terras Austrais Francesas (+262)</option>
                      <option value="+228">🇹🇬 Togo (+228)</option>
                      <option value="+66">🇹🇭 Tailândia (+66)</option>
                      <option value="+992">🇹🇯 Tajiquistão (+992)</option>
                      <option value="+690">🇹🇰 Tokelau (+690)</option>
                      <option value="+670">🇹🇱 Timor-Leste (+670)</option>
                      <option value="+993">🇹🇲 Turcomenistão (+993)</option>
                      <option value="+216">🇹🇳 Tunísia (+216)</option>
                      <option value="+676">🇹🇴 Tonga (+676)</option>
                      <option value="+90">🇹🇷 Turquia (+90)</option>
                      <option value="+1868">🇹🇹 Trinidad e Tobago (+1868)</option>
                      <option value="+688">🇹🇻 Tuvalu (+688)</option>
                      <option value="+886">🇹🇼 Taiwan (+886)</option>
                      <option value="+255">🇹🇿 Tanzânia (+255)</option>
                      <option value="+380">🇺🇦 Ucrânia (+380)</option>
                      <option value="+256">🇺🇬 Uganda (+256)</option>
                      <option value="+1">🇺🇲 Ilhas Menores dos EUA (+1)</option>
                      <option value="+1">🇺🇸 Estados Unidos (+1)</option>
                      <option value="+598">🇺🇾 Uruguai (+598)</option>
                      <option value="+998">🇺🇿 Uzbequistão (+998)</option>
                      <option value="+39">🇻🇦 Vaticano (+39)</option>
                      <option value="+1784">🇻🇨 São Vicente e Granadinas (+1784)</option>
                      <option value="+58">🇻🇪 Venezuela (+58)</option>
                      <option value="+1284">🇻🇬 Ilhas Virgens Britânicas (+1284)</option>
                      <option value="+1340">🇻🇮 Ilhas Virgens Americanas (+1340)</option>
                      <option value="+84">🇻🇳 Vietnã (+84)</option>
                      <option value="+678">🇻🇺 Vanuatu (+678)</option>
                      <option value="+681">🇼🇫 Wallis e Futuna (+681)</option>
                      <option value="+685">🇼🇸 Samoa (+685)</option>
                      <option value="+967">🇾🇪 Iêmen (+967)</option>
                      <option value="+262">🇾🇹 Mayotte (+262)</option>
                      <option value="+27">🇿🇦 África do Sul (+27)</option>
                      <option value="+260">🇿🇲 Zâmbia (+260)</option>
                      <option value="+263">🇿🇼 Zimbábue (+263)</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                  <input
                    type="text"
                    value={formData.phoneNumber.replace(formData.countryCode, '')}
                    onChange={(e) => {
                      const phoneOnly = e.target.value.replace(/\D/g, '');
                      const maskedPhone = phoneOnly
                        .slice(0, 11)
                        .replace(/(\d{2})(\d)/, '($1) $2')
                        .replace(/(\d{5})(\d)/, '$1-$2');
                      handleInputChange('phoneNumber', formData.countryCode + phoneOnly);
                    }}
                    placeholder="Digite seu número"
                    className={`flex-1 bg-white dark:bg-gray-800 border rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 ${
                      getFieldError('phoneNumber') ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                </div>
                {getFieldError('phoneNumber') && (
                  <div className="mt-1 flex items-center space-x-1 text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{getFieldError('phoneNumber')}</span>
                  </div>
                )}
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Modelo *
                  {formData.ticketQuantity > 10000 && (
                    <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        <span className="text-sm text-yellow-800 dark:text-yellow-200">
                          Para campanhas acima de 10 mil cotas, o sistema passa a selecionar as cotas de forma automática e aleatória.
                        </span>
                      </div>
                    </div>
                  )}
                </label>
                <div className="relative">
                  <select
                    value={formData.model}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                    disabled={formData.ticketQuantity > 10000}
                    className={`w-full appearance-none bg-white dark:bg-gray-800 border rounded-lg px-4 py-3 pr-10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 ${
                      getFieldError('model') ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } ${formData.ticketQuantity > 10000 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <option value="">Escolha uma opção</option>
                    <option value="manual">Cliente escolhe as cotas manualmente</option>
                    <option value="automatic">Sistema escolhe as cotas automaticamente</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
                {getFieldError('model') && (
                  <div className="mt-1 flex items-center space-x-1 text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{getFieldError('model')}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrição / Regulamento
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={6}
                  placeholder="Digite a descrição da sua campanha..."
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 resize-vertical"
                />
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Imagens do prêmio
                </label>
                <ImageUpload
                  images={imageUpload.images}
                  uploading={imageUpload.uploading}
                  uploadProgress={imageUpload.uploadProgress}
                  onAddImages={imageUpload.addImages}
                  onRemoveImage={imageUpload.removeImage}
                  onReorderImage={imageUpload.reorderImages}
                />
              </div>

              {/* Min/Max Quantity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quantidade mínima por compra
                  </label>
                  <input
                    type="number"
                    value={formData.minQuantity}
                    onChange={(e) => handleInputChange('minQuantity', parseInt(e.target.value) || 1)}
                    min="1"
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quantidade máxima por compra
                  </label>
                  <input
                    type="number"
                    value={formData.maxQuantity}
                    onChange={(e) => handleInputChange('maxQuantity', parseInt(e.target.value) || 200000)}
                    min="1"
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                  />
                </div>
              </div>

              {/* Initial Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Filtro inicial das cotas
                </label>
                <div className="relative">
                  <select
                    value={formData.initialFilter}
                    onChange={(e) => handleInputChange('initialFilter', e.target.value)}
                    className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pr-10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                  >
                    <option value="all">Mostrar todas as cotas</option>
                    <option value="available">Mostrar somente cotas disponíveis</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Payment Deadline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tempo para pagamento
                </label>
                <div className="relative">
                  <select
                    value={formData.paymentDeadlineHours}
                    onChange={(e) => handleInputChange('paymentDeadlineHours', parseInt(e.target.value))}
                    className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pr-10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                  >
                    <option value={1}>1 hora</option>
                    <option value={24}>1 dia</option>
                    <option value={72}>3 dias</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Require Email */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Requerir email para reserva
                  </label>
                  <div className="relative group">
                    <Info className="h-4 w-4 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-xs rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      Obrigatório para pagamentos via Mercado Pago
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleInputChange('requireEmail', !formData.requireEmail)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                    formData.requireEmail ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      formData.requireEmail ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Show Ranking */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mostrar top 3 ranking
                  </label>
                  <div className="relative group">
                    <Info className="h-4 w-4 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-xs rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      Mostra os 3 maiores colaboradores da campanha
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleInputChange('showRanking', !formData.showRanking)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                    formData.showRanking ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      formData.showRanking ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => navigate('/dashboard/campaigns')}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleFinalize}
                  disabled={saveStatus === 'saving'}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                >
                  {saveStatus === 'saving' && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Finalizar Campanha</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const convertFormDataToAPI = (data: any) => {
    const ticketPrice = parseFloat(data.ticketPrice.replace(',', '.'));
    const phoneNumber = data.phoneNumber.startsWith(data.countryCode) 
      ? data.phoneNumber 
      : data.countryCode + data.phoneNumber.replace(/\D/g, '');
  function convertFormDataToAPI(data: FormData): UpdateCampaignData {
    return {
      title: data.title,
      description: data.description,
      ticket_price: ticketPrice,
      total_tickets: data.ticketQuantity,
      draw_method: data.drawLocation,
      phone_number: phoneNumber,
      campaign_model: data.model,
      min_tickets_per_purchase: data.minQuantity,
      max_tickets_per_purchase: data.maxQuantity,
      initial_filter: data.initialFilter,
      draw_date: data.drawDate,
      payment_deadline_hours: data.paymentDeadlineHours,
      require_email: data.requireEmail,
      show_ranking: data.showRanking,
      prize_image_urls: imageUrls
    };
  }

  // Auto-switch to automatic model when quotas > 10000
  useEffect(() => {
    if (formData.ticketQuantity > 10000 && formData.model !== 'automatic') {
      setFormData(prev => ({ ...prev, model: 'automatic' }));
    }
  }, [formData.ticketQuantity]);
};

export default CreateCampaignStep2Page;