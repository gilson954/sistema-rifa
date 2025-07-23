import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronDown, Info, Calendar, Clock, AlertTriangle, Eye, Save, CheckCircle } from 'lucide-react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useCampaign, useCampaigns } from '../hooks/useCampaigns';
import { Campaign } from '../types/campaign';
import { useImageUpload } from '../hooks/useImageUpload';
import { ImageUpload } from '../components/ImageUpload';
import { useAuth } from '../context/AuthContext';

const CreateCampaignStep2Page = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const imageUpload = useImageUpload();
  
  // Extrai o ID da campanha da URL
  const campaignId = new URLSearchParams(location.search).get('id');
  const { campaign, loading: fetchingCampaign, error: fetchError, updateCampaign } = useCampaign(campaignId || '');
  
  // Check if user came from Step 1
  const [showQuotaAlert, setShowQuotaAlert] = useState(false);
  const fromStep1 = location.state?.fromStep1 === true;
  
  const [formData, setFormData] = useState({
    title: '',
    ticketQuantity: 1000,
    ticketPrice: '1,00',
    drawLocation: '',
    phoneNumber: '',
    model: 'manual' as 'manual' | 'automatic',
    description: '',
    minQuantity: 1,
    maxQuantity: 200000,
    initialFilter: 'all',
    drawDate: null as string | null,
    paymentDeadlineHours: 24,
    requireEmail: true,
    showRanking: false
  });
  const [informarData, setInformarData] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState({ hour: '22', minute: '12' });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loadingCampaign, setLoadingCampaign] = useState(true);
  const [errorCampaign, setErrorCampaign] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [modelDisabled, setModelDisabled] = useState(false);
  const [showBackButton, setShowBackButton] = useState(true);

  // Check if coming from Step 1 to hide back button
  useEffect(() => {
    if (location.state?.fromStep1) {
      setShowBackButton(false);
    }
  }, [location.state]);

  // Efeito para carregar os dados da campanha quando o ID estiver disponível
  useEffect(() => {
    if (fetchingCampaign) {
      setLoadingCampaign(true);
      return;
    }
    if (fetchError) {
      setErrorCampaign('Erro ao carregar dados da campanha.');
      setLoadingCampaign(false);
      return;
    }
    if (campaign) {
      // Preenche o formData com os dados da campanha
      setFormData({
        title: campaign.title || '',
        ticketQuantity: campaign.total_tickets || 100,
        ticketPrice: campaign.ticket_price ? campaign.ticket_price.toFixed(2).replace('.', ',') : '1,00',
        drawLocation: campaign.draw_method || '',
        phoneNumber: campaign.phone_number || '',
        model: campaign.campaign_model,
        description: campaign.description || '',
        minQuantity: campaign.min_tickets_per_purchase,
        maxQuantity: campaign.max_tickets_per_purchase,
        initialFilter: campaign.initial_filter,
        drawDate: campaign.draw_date,
        paymentDeadlineHours: campaign.payment_deadline_hours,
        requireEmail: campaign.require_email,
        showRanking: campaign.show_ranking
      });

      // Configura o estado do calendário se houver draw_date
      if (campaign.draw_date) {
        const date = new Date(campaign.draw_date);
        setSelectedDate(date);
        setSelectedTime({
          hour: date.getHours().toString().padStart(2, '0'),
          minute: date.getMinutes().toString().padStart(2, '0')
        });
        setInformarData(true);
      }
      setLoadingCampaign(false);
      
      // Set existing images if available
      if (campaign.prize_image_urls && campaign.prize_image_urls.length > 0) {
        imageUpload.setExistingImages(campaign.prize_image_urls);
      }
      
    } else if (!campaignId) {
      setErrorCampaign('ID da campanha não fornecido.');
      setLoadingCampaign(false);
    }
  }, [campaignId, campaign, fetchingCampaign, fetchError]);

  const handleGoBack = () => {
    navigate('/dashboard/create-campaign');
  };

  // Effect to handle quota limit logic
  useEffect(() => {
    if (formData.ticketQuantity > 10000) {
      setFormData(prev => ({ ...prev, model: 'automatic' }));
      setShowQuotaAlert(true);
      setModelDisabled(true);
    } else {
      setShowQuotaAlert(false);
      setModelDisabled(false);
    }
  }, [formData.ticketQuantity]);

  // Auto-save functionality with debouncing
  useEffect(() => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    const timeout = setTimeout(() => {
      handleAutoSave();
    }, 500);

    setAutoSaveTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [formData, selectedDate, selectedTime, informarData]);

  /**
   * Auto-save function with debouncing
   */
  const handleAutoSave = async () => {
    if (!campaignId || !user || saveStatus === 'saving') return;

    try {
      setSaveStatus('saving');
      
      // Convert form data to API format
      let finalDrawDate = null;
      if (informarData && selectedDate) {
        const date = new Date(selectedDate);
        date.setHours(parseInt(selectedTime.hour));
        date.setMinutes(parseInt(selectedTime.minute));
        finalDrawDate = date.toISOString();
      }

      const updateData = {
        id: campaignId,
        title: formData.title,
        total_tickets: formData.ticketQuantity,
        ticket_price: parseFloat(formData.ticketPrice.replace(',', '.')),
        draw_method: formData.drawLocation,
        phone_number: formData.phoneNumber.replace(/\D/g, ''),
        description: formData.description,
        min_tickets_per_purchase: formData.minQuantity,
        max_tickets_per_purchase: formData.maxQuantity,
        initial_filter: formData.initialFilter,
        draw_date: finalDrawDate,
        payment_deadline_hours: formData.paymentDeadlineHours,
        require_email: formData.requireEmail,
        show_ranking: formData.showRanking,
        campaign_model: formData.model
      };

      await updateCampaign(updateData);
      setSaveStatus('saved');
      
      // Reset to idle after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Auto-save error:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // Função para formatar o valor monetário
  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return '0,00';
    const cents = parseInt(numericValue, 10);
    const reais = cents / 100;
    return reais.toFixed(2).replace('.', ',');
  };

  // Função para formatar o número de telefone
  const formatPhoneNumber = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length <= 2) {
      return `(${numericValue}`;
    } else if (numericValue.length <= 7) {
      return `(${numericValue.slice(0, 2)}) ${numericValue.slice(2)}`;
    } else {
      return `(${numericValue.slice(0, 2)}) ${numericValue.slice(2, 7)}-${numericValue.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    if (numericValue.length <= 11) {
      const formattedValue = formatPhoneNumber(value);
      setFormData({ ...formData, phoneNumber: formattedValue });
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formattedValue = formatCurrency(inputValue);
    setFormData({ ...formData, ticketPrice: formattedValue });
  };

  const handleFinalize = async () => {
    if (!campaignId) {
      alert('Erro: ID da campanha não encontrado para finalizar.');
      return;
    }

    if (!user) {
      alert('Usuário não autenticado');
      return;
    }

    // Converte a data e hora selecionadas para o formato ISO string
    let finalDrawDate = null;
    if (informarData && selectedDate) {
      const date = new Date(selectedDate);
      date.setHours(parseInt(selectedTime.hour));
      date.setMinutes(parseInt(selectedTime.minute));
      finalDrawDate = date.toISOString();
    }

    try {
      // Upload images first if there are any
      let imageUrls: string[] = [];
      if (imageUpload.images.length > 0) {
        imageUrls = await imageUpload.uploadImages(user.id);
      }

      // Prepara os dados para atualização
      const updateData = {
        id: campaignId,
        title: formData.title,
        total_tickets: formData.ticketQuantity,
        ticket_price: parseFloat(formData.ticketPrice.replace(',', '.')),
        draw_method: formData.drawLocation,
        phone_number: formData.phoneNumber.replace(/\D/g, ''), // Remove formatação para salvar
        description: formData.description,
        min_tickets_per_purchase: formData.minQuantity,
        max_tickets_per_purchase: formData.maxQuantity,
        initial_filter: formData.initialFilter,
        draw_date: finalDrawDate,
        payment_deadline_hours: formData.paymentDeadlineHours,
        require_email: formData.requireEmail,
        show_ranking: formData.showRanking,
        campaign_model: formData.model,
        prize_image_urls: imageUrls.length > 0 ? imageUrls : undefined
      };

      await updateCampaign(updateData);
      console.log('Finalizing campaign with data:', updateData);
      navigate(`/dashboard/create-campaign/step-3?id=${campaignId}`);
    } catch (error) {
      console.error('Error updating campaign:', error);
      alert('Erro ao finalizar campanha. Tente novamente.');
    }
  };

  const modelOptions = [
    { value: 'manual', label: 'Cliente escolhe as cotas manualmente' },
    { value: 'automatic', label: 'Sistema escolhe as cotas aleatoriamente' }
  ];

  const filterOptions = [
    { value: 'all', label: 'Mostrar todas cotas' },
    { value: 'available', label: 'Mostrar somente cotas disponíveis' }
  ];

  const paymentTimeOptions = [
    { value: 1, label: '1 hora' },
    { value: 24, label: '1 dia' },
    { value: 72, label: '3 dias' }
  ];

  // Generate calendar for specific month
  const generateCalendar = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return { days, month, year };
  };

  const { days, month, year } = generateCalendar(currentMonth);
  const monthNames = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];

  const dayNames = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const dayAbbrev = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
  const monthAbbrev = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatSelectedDate = (date: Date) => {
    const dayOfWeek = dayAbbrev[date.getDay()];
    const monthName = monthAbbrev[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${dayOfWeek}. ${monthName}. ${day} ${year}`;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentMonth(newDate);
  };

  const handleDateSelect = (date: Date) => {
    if (date.getMonth() === month) {
      setSelectedDate(date);
    }
  };

  if (loadingCampaign) {
    return (
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-6 rounded-lg border border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Carregando campanha...</span>
        </div>
      </div>
    );
  }

  if (errorCampaign) {
    return (
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-6 rounded-lg border border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <div className="flex items-center justify-center py-12 text-red-500">
          <AlertTriangle className="h-8 w-8 mr-2" />
          <span>{errorCampaign}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg border border-gray-200 dark:border-gray-800 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-4">
          {showBackButton && (
            <button
              onClick={handleGoBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Configurar campanha
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Configure os detalhes da sua campanha
            </p>
          </div>
        </div>
        
        {/* Save Status Indicator */}
        <div className="flex items-center space-x-2">
          {saveStatus === 'saving' && (
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">Salvando...</span>
            </div>
          )}
          {saveStatus === 'saved' && (
            <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Salvo</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <span className="text-sm text-red-600 dark:text-red-400">Erro ao salvar</span>
          )}
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6 max-w-2xl mx-auto">
        <div className="space-y-8">
          {/* Quota Alert for >10k quotas */}
          {showQuotaAlert && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-yellow-800 dark:text-yellow-200 text-sm font-medium mb-1">
                  ⚠️ Acima de 10mil cotas o modelo da sua campanha muda para Sistema escolhe as cotas aleatoriamente
                </p>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                  Para campanhas acima de 10 mil cotas, o sistema passa a selecionar as cotas de forma automática e aleatória.
                </p>
              </div>
            </div>
          )}

          {/* Título da campanha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título da campanha
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Digite o título da sua campanha"
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
            />
          </div>

          {/* Modelo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Modelo *
            </label>
            <div className="relative">
              <select
                value={formData.model}
                disabled={modelDisabled}
                onChange={(e) => setFormData({ ...formData, model: e.target.value as 'manual' | 'automatic' })}
                className={`w-full appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pr-10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 ${modelDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {modelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>

            {/* Visual representation */}
            {formData.model === 'manual' && (
              <div className="mt-4 p-6 border-2 border-green-500 rounded-lg bg-green-50 dark:bg-green-900/20">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4 text-center">
                  Visualização: Seleção Manual de Cotas
                </h4>
                
                {/* Manual Selection Preview */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
                  <div className="text-center mb-3">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Filtro de cota</span>
                  </div>
                  <div className="flex justify-center gap-1 mb-3 text-xs">
                    <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Todos</span>
                    <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Disponíveis</span>
                    <span className="px-2 py-1 bg-blue-500 text-white rounded">Meus Nº</span>
                  </div>
                  <div className="grid grid-cols-10 gap-1 mb-3">
                    {Array.from({ length: 50 }, (_, i) => (
                      <div
                        key={i}
                        className={`w-6 h-6 rounded text-xs flex items-center justify-center font-medium ${
                          [12, 23, 34, 45].includes(i + 1) 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm font-medium">Cliente escolhe as cotas manualmente</span>
                </div>
              </div>
            )}

            {formData.model === 'automatic' && (
              <div className="mt-4 p-6 border-2 border-purple-500 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4 text-center">
                  Visualização: Seleção Automática de Cotas
                </h4>
                
                {/* Automatic Selection Preview */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
                  <div className="text-center mb-4">
                    <h5 className="font-bold text-gray-900 dark:text-white mb-2">SELECIONE A QUANTIDADE DE COTAS</h5>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {['+1', '+5', '+15', '+150'].map((btn) => (
                      <div key={btn} className="bg-gray-100 dark:bg-gray-700 py-2 px-3 rounded text-xs text-center">
                        {btn}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-xs">-</div>
                    <div className="w-12 h-6 bg-purple-100 dark:bg-purple-900 border border-purple-300 dark:border-purple-600 rounded text-xs flex items-center justify-center">1</div>
                    <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-xs">+</div>
                  </div>
                  <div className="text-center mb-3">
                    <div className="text-xs text-gray-600 dark:text-gray-400">Valor final</div>
                    <div className="font-bold text-gray-900 dark:text-white">R$ 1,00</div>
                  </div>
                  <div className="bg-green-500 text-white py-2 rounded text-xs text-center font-bold">
                    RESERVAR
                  </div>
                </div>
                
                <div className="flex items-center justify-center space-x-2 text-purple-600 dark:text-purple-400">
                  <div className="w-4 h-4 bg-purple-500 rounded"></div>
                  <span className="text-sm font-medium">Sistema escolhe as cotas aleatoriamente</span>
                </div>
              </div>
            )}
          </div>

          {/* Descrição / Regulamento */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Descrição / Regulamento
              </label>
              <div className="relative group">
                <Info className="h-4 w-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-xs rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                  Descreva o regulamento da sua campanha
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                </div>
              </div>
            </div>
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg">
              <div className="flex items-center space-x-2 p-3 border-b border-gray-300 dark:border-gray-600">
                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  <span className="text-lg">+</span>
                </button>
                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  <span className="text-lg">&lt;/&gt;</span>
                </button>
                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  <span className="text-lg">T</span>
                </button>
                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded ml-auto">
                  <Calendar className="h-4 w-4" />
                </button>
              </div>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-4 bg-transparent border-none resize-none focus:outline-none min-h-[500px]"
                placeholder="Digite a descrição da sua campanha..."
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 sm:gap-4">
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <span className="text-lg">🎫</span>
              <span className="text-xs sm:text-sm font-medium">Cota premiada</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <span className="text-lg">🏆</span>
              <span className="text-xs sm:text-sm font-medium">Prêmio</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <span className="text-lg">🎁</span>
              <span className="text-xs sm:text-sm font-medium">Promoção</span>
            </button>
          </div>

          {/* Imagens */}
          <div>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Imagens
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Tamanho recomendado: 1365x758 pixels • Máximo 5MB por imagem
              </p>
            </div>
            
            <ImageUpload
              images={imageUpload.images}
              uploading={imageUpload.uploading}
              uploadProgress={imageUpload.uploadProgress}
              onAddImages={imageUpload.addImages}
              onRemoveImage={imageUpload.removeImage}
              onReorderImage={imageUpload.reorderImages}
            />
          </div>

          {/* Quantidade de cotas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quantidade de cotas
            </label>
            <div className="relative">
              <select
                value={formData.ticketQuantity}
                onChange={(e) => setFormData({ ...formData, ticketQuantity: parseInt(e.target.value) })}
                className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pr-10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
              >
                <option value={25}>25 cotas</option>
                <option value={50}>50 cotas</option>
                <option value={100}>100 cotas</option>
                <option value={200}>200 cotas</option>
                <option value={300}>300 cotas</option>
                <option value={500}>500 cotas</option>
                <option value={1000}>1.000 cotas</option>
                <option value={2000}>2.000 cotas</option>
                <option value={3000}>3.000 cotas</option>
                <option value={5000}>5.000 cotas</option>
                <option value={10000}>10.000 cotas</option>
                <option value={20000}>20.000 cotas</option>
                <option value={30000}>30.000 cotas</option>
                <option value={50000}>50.000 cotas</option>
                <option value={100000}>100.000 cotas</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Quantidade mínima e máxima */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quantidade mínima de cotas por compra
                </label>
                <div className="relative group">
                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-xs rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    O participante deve selecionar pelo menos essa quantidade de cotas para poder participar.
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🛒</span>
                <input
                  type="number"
                  value={formData.minQuantity}
                  onChange={(e) => setFormData({ ...formData, minQuantity: parseInt(e.target.value) })}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quantidade máxima de cotas por compra
                </label>
                <div className="relative group">
                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-xs rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    Essa é a quantidade máxima de cotas que o participante pode escolher em uma única compra.
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🛒</span>
                <input
                  type="number"
                  value={formData.maxQuantity}
                  onChange={(e) => setFormData({ ...formData, maxQuantity: parseInt(e.target.value) })}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                />
              </div>
            </div>
          </div>

          {/* Valor da cota */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Valor da cota
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">R$</span>
              <input
                type="text"
                value={formData.ticketPrice}
                onChange={handlePriceChange}
                placeholder="0,00"
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
              />
            </div>
          </div>

          {/* Local de sorteio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Local de sorteio
            </label>
            <div className="relative">
              <select
                value={formData.drawLocation}
                onChange={(e) => setFormData({ ...formData, drawLocation: e.target.value })}
                className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pr-10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
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

          {/* Filtro inicial das cotas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filtro inicial das cotas *
            </label>
            <div className="relative">
              <select
                value={formData.initialFilter}
                onChange={(e) => setFormData({ ...formData, initialFilter: e.target.value as 'all' | 'available' })}
                className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pr-10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
              >
                {filterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Número de celular */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Número de celular
            </label>
            <div className="flex space-x-2">
              <div className="relative">
                <select className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pr-8 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200">
                  <option value="+55">🇧🇷 +55</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+33">🇫🇷 +33</option>
                  <option value="+49">🇩🇪 +49</option>
                  <option value="+39">🇮🇹 +39</option>
                  <option value="+34">🇪🇸 +34</option>
                  <option value="+351">🇵🇹 +351</option>
                  <option value="+54">🇦🇷 +54</option>
                  <option value="+56">🇨🇱 +56</option>
                  <option value="+57">🇨🇴 +57</option>
                  <option value="+51">🇵🇪 +51</option>
                  <option value="+52">🇲🇽 +52</option>
                  <option value="+598">🇺🇾 +598</option>
                  <option value="+595">🇵🇾 +595</option>
                  <option value="+591">🇧🇴 +591</option>
                  <option value="+593">🇪🇨 +593</option>
                  <option value="+58">🇻🇪 +58</option>
                  <option value="+592">🇬🇾 +592</option>
                  <option value="+597">🇸🇷 +597</option>
                  <option value="+594">🇬🇫 +594</option>
                  <option value="+81">🇯🇵 +81</option>
                  <option value="+82">🇰🇷 +82</option>
                  <option value="+86">🇨🇳 +86</option>
                  <option value="+91">🇮🇳 +91</option>
                  <option value="+61">🇦🇺 +61</option>
                  <option value="+64">🇳🇿 +64</option>
                  <option value="+27">🇿🇦 +27</option>
                  <option value="+20">🇪🇬 +20</option>
                  <option value="+234">🇳🇬 +234</option>
                  <option value="+254">🇰🇪 +254</option>
                  <option value="+212">🇲🇦 +212</option>
                  <option value="+213">🇩🇿 +213</option>
                  <option value="+216">🇹🇳 +216</option>
                  <option value="+218">🇱🇾 +218</option>
                  <option value="+220">🇬🇲 +220</option>
                  <option value="+221">🇸🇳 +221</option>
                  <option value="+222">🇲🇷 +222</option>
                  <option value="+223">🇲🇱 +223</option>
                  <option value="+224">🇬🇳 +224</option>
                  <option value="+225">🇨🇮 +225</option>
                  <option value="+226">🇧🇫 +226</option>
                  <option value="+227">🇳🇪 +227</option>
                  <option value="+228">🇹🇬 +228</option>
                  <option value="+229">🇧🇯 +229</option>
                  <option value="+230">🇲🇺 +230</option>
                  <option value="+231">🇱🇷 +231</option>
                  <option value="+232">🇸🇱 +232</option>
                  <option value="+233">🇬🇭 +233</option>
                  <option value="+235">🇹🇩 +235</option>
                  <option value="+236">🇨🇫 +236</option>
                  <option value="+237">🇨🇲 +237</option>
                  <option value="+238">🇨🇻 +238</option>
                  <option value="+239">🇸🇹 +239</option>
                  <option value="+240">🇬🇶 +240</option>
                  <option value="+241">🇬🇦 +241</option>
                  <option value="+242">🇨🇬 +242</option>
                  <option value="+243">🇨🇩 +243</option>
                  <option value="+244">🇦🇴 +244</option>
                  <option value="+245">🇬🇼 +245</option>
                  <option value="+246">🇮🇴 +246</option>
                  <option value="+248">🇸🇨 +248</option>
                  <option value="+249">🇸🇩 +249</option>
                  <option value="+250">🇷🇼 +250</option>
                  <option value="+251">🇪🇹 +251</option>
                  <option value="+252">🇸🇴 +252</option>
                  <option value="+253">🇩🇯 +253</option>
                  <option value="+255">🇹🇿 +255</option>
                  <option value="+256">🇺🇬 +256</option>
                  <option value="+257">🇧🇮 +257</option>
                  <option value="+258">🇲🇿 +258</option>
                  <option value="+260">🇿🇲 +260</option>
                  <option value="+261">🇲🇬 +261</option>
                  <option value="+262">🇷🇪 +262</option>
                  <option value="+263">🇿🇼 +263</option>
                  <option value="+264">🇳🇦 +264</option>
                  <option value="+265">🇲🇼 +265</option>
                  <option value="+266">🇱🇸 +266</option>
                  <option value="+267">🇧🇼 +267</option>
                  <option value="+268">🇸🇿 +268</option>
                  <option value="+269">🇰🇲 +269</option>
                  <option value="+290">🇸🇭 +290</option>
                  <option value="+291">🇪🇷 +291</option>
                  <option value="+297">🇦🇼 +297</option>
                  <option value="+298">🇫🇴 +298</option>
                  <option value="+299">🇬🇱 +299</option>
                  <option value="+350">🇬🇮 +350</option>
                  <option value="+352">🇱🇺 +352</option>
                  <option value="+353">🇮🇪 +353</option>
                  <option value="+354">🇮🇸 +354</option>
                  <option value="+355">🇦🇱 +355</option>
                  <option value="+356">🇲🇹 +356</option>
                  <option value="+357">🇨🇾 +357</option>
                  <option value="+358">🇫🇮 +358</option>
                  <option value="+359">🇧🇬 +359</option>
                  <option value="+370">🇱🇹 +370</option>
                  <option value="+371">🇱🇻 +371</option>
                  <option value="+372">🇪🇪 +372</option>
                  <option value="+373">🇲🇩 +373</option>
                  <option value="+374">🇦🇲 +374</option>
                  <option value="+375">🇧🇾 +375</option>
                  <option value="+376">🇦🇩 +376</option>
                  <option value="+377">🇲🇨 +377</option>
                  <option value="+378">🇸🇲 +378</option>
                  <option value="+380">🇺🇦 +380</option>
                  <option value="+381">🇷🇸 +381</option>
                  <option value="+382">🇲🇪 +382</option>
                  <option value="+383">🇽🇰 +383</option>
                  <option value="+385">🇭🇷 +385</option>
                  <option value="+386">🇸🇮 +386</option>
                  <option value="+387">🇧🇦 +387</option>
                  <option value="+389">🇲🇰 +389</option>
                  <option value="+420">🇨🇿 +420</option>
                  <option value="+421">🇸🇰 +421</option>
                  <option value="+423">🇱🇮 +423</option>
                  <option value="+43">🇦🇹 +43</option>
                  <option value="+41">🇨🇭 +41</option>
                  <option value="+45">🇩🇰 +45</option>
                  <option value="+46">🇸🇪 +46</option>
                  <option value="+47">🇳🇴 +47</option>
                  <option value="+48">🇵🇱 +48</option>
                  <option value="+31">🇳🇱 +31</option>
                  <option value="+32">🇧🇪 +32</option>
                  <option value="+30">🇬🇷 +30</option>
                  <option value="+40">🇷🇴 +40</option>
                  <option value="+36">🇭🇺 +36</option>
                  <option value="+7">🇷🇺 +7</option>
                  <option value="+90">🇹🇷 +90</option>
                  <option value="+98">🇮🇷 +98</option>
                  <option value="+92">🇵🇰 +92</option>
                  <option value="+93">🇦🇫 +93</option>
                  <option value="+94">🇱🇰 +94</option>
                  <option value="+95">🇲🇲 +95</option>
                  <option value="+60">🇲🇾 +60</option>
                  <option value="+62">🇮🇩 +62</option>
                  <option value="+63">🇵🇭 +63</option>
                  <option value="+65">🇸🇬 +65</option>
                  <option value="+66">🇹🇭 +66</option>
                  <option value="+84">🇻🇳 +84</option>
                  <option value="+855">🇰🇭 +855</option>
                  <option value="+856">🇱🇦 +856</option>
                  <option value="+880">🇧🇩 +880</option>
                  <option value="+960">🇲🇻 +960</option>
                  <option value="+961">🇱🇧 +961</option>
                  <option value="+962">🇯🇴 +962</option>
                  <option value="+963">🇸🇾 +963</option>
                  <option value="+964">🇮🇶 +964</option>
                  <option value="+965">🇰🇼 +965</option>
                  <option value="+966">🇸🇦 +966</option>
                  <option value="+967">🇾🇪 +967</option>
                  <option value="+968">🇴🇲 +968</option>
                  <option value="+970">🇵🇸 +970</option>
                  <option value="+971">🇦🇪 +971</option>
                  <option value="+972">🇮🇱 +972</option>
                  <option value="+973">🇧🇭 +973</option>
                  <option value="+974">🇶🇦 +974</option>
                  <option value="+975">🇧🇹 +975</option>
                  <option value="+976">🇲🇳 +976</option>
                  <option value="+977">🇳🇵 +977</option>
                  <option value="+992">🇹🇯 +992</option>
                  <option value="+993">🇹🇲 +993</option>
                  <option value="+994">🇦🇿 +994</option>
                  <option value="+995">🇬🇪 +995</option>
                  <option value="+996">🇰🇬 +996</option>
                  <option value="+998">🇺🇿 +998</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={handlePhoneChange}
                placeholder="(62) 98112-7960"
                maxLength={15}
                className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
              />
            </div>
          </div>

          {/* Data de sorteio */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Data de sorteio
              </label>
              <div className="relative group">
                <Info className="h-4 w-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-xs rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                  Defina a data e hora do sorteio. Caso informada, os participantes poderão fazer reservas somente até esse prazo.
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                </div>
              </div>
            </div>
            
            {informarData && (
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800 mb-4">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-4">
                  <button 
                    onClick={() => navigateMonth('prev')}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
                  >
                    <ChevronDown className="h-4 w-4 rotate-90 text-gray-600 dark:text-gray-400" />
                  </button>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {monthNames[month]} {year}
                  </h3>
                  <button 
                    onClick={() => navigateMonth('next')}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
                  >
                    <ChevronDown className="h-4 w-4 -rotate-90 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>

                {/* Calendar Days Header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((day, index) => (
                    <div key={index} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 p-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {days.map((day, index) => {
                    const isCurrentMonth = day.getMonth() === month;
                    const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
                    
                    return (
                      <button
                        key={index}
                        onClick={() => handleDateSelect(day)}
                        className={`p-1 sm:p-2 text-xs sm:text-sm rounded-full transition-colors duration-200 ${
                          !isCurrentMonth 
                            ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                            : isSelected
                              ? 'bg-blue-500 text-white'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                        }`}
                        disabled={!isCurrentMonth}
                      >
                        {day.getDate()}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Date Display and Time Picker */}
                {selectedDate && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">
                        {formatSelectedDate(selectedDate)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <select
                        value={selectedTime.hour}
                        onChange={(e) => setSelectedTime({ ...selectedTime, hour: e.target.value })}
                        className="bg-transparent border-none text-xs sm:text-sm focus:outline-none text-gray-900 dark:text-white"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i.toString().padStart(2, '0')}>
                            {i.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                      <span className="text-gray-500 dark:text-gray-400">:</span>
                      <select
                        value={selectedTime.minute}
                        onChange={(e) => setSelectedTime({ ...selectedTime, minute: e.target.value })}
                        className="bg-transparent border-none text-xs sm:text-sm focus:outline-none text-gray-900 dark:text-white"
                      >
                        {Array.from({ length: 60 }, (_, i) => (
                          <option key={i} value={i.toString().padStart(2, '0')}>
                            {i.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Toggle Button */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setInformarData(!informarData)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  informarData ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    informarData ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                INFORMAR DATA
              </span>
            </div>
          </div>

          {/* Tempo para pagamento */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tempo para pagamento
              </label>
              <div className="relative group">
                <Info className="h-4 w-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-xs rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                  Defina o tempo que o participante terá para concluir o pagamento. Após esse prazo, se a cota não for paga, ela será liberada novamente para outros usuários.
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                </div>
              </div>
            </div>
            <div className="relative">
              <select
                value={formData.paymentDeadlineHours}
                onChange={(e) => setFormData({ ...formData, paymentDeadlineHours: parseInt(e.target.value) })}
                className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pr-10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
              >
                {paymentTimeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Requerir email para reserva */}
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Requerir email para reserva?
                </label>
                <div className="relative group">
                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-xs rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    Ao escolher o Mercado Pago como forma de pagamento, o uso do e-mail se torna obrigatório e não pode ser desabilitado.
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setFormData({ ...formData, requireEmail: !formData.requireEmail })}
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
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-yellow-800 dark:text-yellow-200 text-sm font-medium mb-1">
                ⚠️ Importante:
              </p>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                Ao escolher o Mercado Pago como método de pagamento, o campo de e-mail será obrigatório para finalizar a campanha.
              </p>
            </div>
          </div>

          {/* Mostrar top 3 ranking */}
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mostrar top 3 ranking
                </label>
                <div className="relative group">
                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-xs rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    Ao habilitar está função irá mostrar na sua página os 3 maiores colaboradores da sua campanha.
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setFormData({ ...formData, showRanking: !formData.showRanking })}
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
          </div>

          {/* Finalizar Button */}
          <div className="pt-6">
            <button
              onClick={handleFinalize}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              Finalizar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaignStep2Page;