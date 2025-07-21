import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronDown, Info, Upload, Calendar, Clock, AlertTriangle, Eye, X, MoveUp, MoveDown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCampaign, useCampaigns } from '../hooks/useCampaigns';
import { Campaign } from '../types/campaign';
import { supabase } from '../lib/supabase';

const CreateCampaignStep2Page = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateCampaign } = useCampaigns();
  
  // Extrai o ID da campanha da URL
  const campaignId = new URLSearchParams(location.search).get('id');
  const { campaign, loading: fetchingCampaign, error: fetchError } = useCampaign(campaignId || '');
  
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
  const [showQuotaAlert, setShowQuotaAlert] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  // Check if coming from Step 1
  const fromStep1 = location.state?.fromStep1;

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
        ticketQuantity: campaign.total_tickets || 1000,
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
      
      // Load existing images
      if (campaign.prize_image_urls) {
        setExistingImageUrls(campaign.prize_image_urls);
      }
      
      setLoadingCampaign(false);
    } else if (!campaignId) {
      setErrorCampaign('ID da campanha não fornecido.');
      setLoadingCampaign(false);
    }
  }, [campaignId, campaign, fetchingCampaign, fetchError]);

  // Effect to handle quota limit logic
  useEffect(() => {
    if (formData.ticketQuantity > 10000) {
      setFormData(prev => ({ ...prev, model: 'automatic' }));
      setShowQuotaAlert(true);
    } else {
      setShowQuotaAlert(false);
    }
  }, [formData.ticketQuantity]);

  const handleGoBack = () => {
    navigate('/dashboard/create-campaign');
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

  // Image upload functions
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const validFiles: File[] = [];
    const newPreviews: string[] = [];
    
    Array.from(files).forEach(file => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} não é um arquivo de imagem válido.`);
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} é muito grande. O tamanho máximo é 5MB.`);
        return;
      }
      
      validFiles.push(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string);
        if (newPreviews.length === validFiles.length) {
          setImagePreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    setUploadedFiles(prev => [...prev, ...validFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeImage = (index: number, isExisting: boolean) => {
    if (isExisting) {
      setExistingImageUrls(prev => prev.filter((_, i) => i !== index));
    } else {
      setUploadedFiles(prev => prev.filter((_, i) => i !== index));
      setImagePreviews(prev => prev.filter((_, i) => i !== index));
    }
  };

  const moveImage = (index: number, direction: 'up' | 'down', isExisting: boolean) => {
    if (isExisting) {
      const newUrls = [...existingImageUrls];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex >= 0 && newIndex < newUrls.length) {
        [newUrls[index], newUrls[newIndex]] = [newUrls[newIndex], newUrls[index]];
        setExistingImageUrls(newUrls);
      }
    } else {
      const newFiles = [...uploadedFiles];
      const newPreviews = [...imagePreviews];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex >= 0 && newIndex < newFiles.length) {
        [newFiles[index], newFiles[newIndex]] = [newFiles[newIndex], newFiles[index]];
        [newPreviews[index], newPreviews[newIndex]] = [newPreviews[newIndex], newPreviews[index]];
        setUploadedFiles(newFiles);
        setImagePreviews(newPreviews);
      }
    }
  };

  const uploadImagesToStorage = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (const file of uploadedFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `prize-images/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('prize-images')
        .upload(filePath, file);
      
      if (uploadError) {
        throw new Error(`Erro ao fazer upload de ${file.name}: ${uploadError.message}`);
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('prize-images')
        .getPublicUrl(filePath);
      
      uploadedUrls.push(publicUrl);
    }
    
    return uploadedUrls;
  };

  const handleFinalize = async () => {
    if (!campaignId) {
      alert('Erro: ID da campanha não encontrado para finalizar.');
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

    setUploading(true);
    
    try {
      // Upload new images to storage
      const newImageUrls = uploadedFiles.length > 0 ? await uploadImagesToStorage() : [];
      
      // Combine existing and new image URLs
      const allImageUrls = [...existingImageUrls, ...newImageUrls];

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
      prize_image_urls: allImageUrls.length > 0 ? allImageUrls : null
    };

      await updateCampaign(updateData);
      console.log('Finalizing campaign with data:', updateData);
      navigate(`/dashboard/create-campaign/step-3?id=${campaignId}`);
    } catch (error) {
      console.error('Error updating campaign:', error);
      alert('Erro ao finalizar campanha. Tente novamente.');
    } finally {
      setUploading(false);
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
          {!fromStep1 && (
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
      </div>

      {/* Form Content */}
      <div className="p-6 max-w-2xl mx-auto">
        <div className="space-y-8">
          {/* Quota Alert */}
          {showQuotaAlert && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-yellow-800 dark:text-yellow-200 text-sm font-medium">
                  Acima de 10mil cotas o modelo da sua campanha muda para Sistema escolhe as cotas aleatoriamente
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
                onChange={(e) => setFormData({ ...formData, model: e.target.value as 'manual' | 'automatic' })}
                disabled={formData.ticketQuantity > 10000}
                className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pr-10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
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
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Imagens
              </label>
              <span className="text-xs text-green-600 dark:text-green-400">
                Tamanho recomendado: 1365x758 pixels
              </span>
            </div>
            
            {/* Image Upload Area */}
            <div 
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors duration-200"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Clique para adicionar imagens ou arraste e solte aqui
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                Máximo 5MB por imagem
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="mt-4 inline-block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors duration-200"
              >
                Selecionar Imagens
              </label>
            </div>
            
            {/* Image Previews */}
            {(existingImageUrls.length > 0 || imagePreviews.length > 0) && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {/* Existing Images */}
                {existingImageUrls.map((url, index) => (
                  <div key={`existing-${index}`} className="relative group">
                    <img
                      src={url}
                      alt={`Prize ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity duration-200"
                      onClick={() => setSelectedImageIndex(index)}
                    />
                    <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {index > 0 && (
                        <button
                          onClick={() => moveImage(index, 'up', true)}
                          className="p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70"
                        >
                          <MoveUp className="h-3 w-3" />
                        </button>
                      )}
                      {index < existingImageUrls.length - 1 && (
                        <button
                          onClick={() => moveImage(index, 'down', true)}
                          className="p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70"
                        >
                          <MoveDown className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        onClick={() => removeImage(index, true)}
                        className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* New Image Previews */}
                {imagePreviews.map((preview, index) => (
                  <div key={`new-${index}`} className="relative group">
                    <img
                      src={preview}
                      alt={`New Prize ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity duration-200"
                      onClick={() => setSelectedImageIndex(existingImageUrls.length + index)}
                    />
                    <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {index > 0 && (
                        <button
                          onClick={() => moveImage(index, 'up', false)}
                          className="p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70"
                        >
                          <MoveUp className="h-3 w-3" />
                        </button>
                      )}
                      {index < imagePreviews.length - 1 && (
                        <button
                          onClick={() => moveImage(index, 'down', false)}
                          className="p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70"
                        >
                          <MoveDown className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        onClick={() => removeImage(index, false)}
                        className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
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
                  <option value="BR">🇧🇷 +55</option>
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
              disabled={uploading}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              {uploading ? 'Salvando...' : 'Finalizar'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Image Enlargement Modal */}
      {selectedImageIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedImageIndex(null)}
              className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 z-10"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={selectedImageIndex < existingImageUrls.length 
                ? existingImageUrls[selectedImageIndex] 
                : imagePreviews[selectedImageIndex - existingImageUrls.length]
              }
              alt="Enlarged view"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateCampaignStep2Page;