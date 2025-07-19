import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, Info, Upload, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CreateCampaignStep2Page = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    model: 'manual',
    description: '',
    minQuantity: 1,
    maxQuantity: 200000,
    initialFilter: 'all',
    drawDate: '',
    paymentTime: '1-day',
    requireEmail: true,
    showRanking: false
  });
  const [informarData, setInformarData] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState({ hour: '22', minute: '12' });
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleGoBack = () => {
    navigate('/dashboard/create-campaign');
  };

  const handleFinalize = () => {
    console.log('Finalizing campaign with data:', formData);
    // Handle campaign finalization
    navigate('/dashboard');
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
    { value: '10-minutes', label: '10 minutos' },
    { value: '30-minutes', label: '30 minutos' },
    { value: '1-hour', label: '1 hora' },
    { value: '1-day', label: '1 dia' },
    { value: '3-days', label: '3 dias' }
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
      setFormData({ ...formData, drawDate: formatDate(date) });
    }
  };
  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg border border-gray-200 dark:border-gray-800 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleGoBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
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
          {/* Modelo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Modelo *
            </label>
            <div className="relative">
              <select
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
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
              <div className="mt-4 p-4 border-2 border-green-500 rounded-lg bg-green-50 dark:bg-green-900/20">
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 mb-3">
                  {Array.from({ length: 50 }, (_, i) => (
                    <div
                      key={i}
                      className={`w-6 h-6 sm:w-8 sm:h-8 rounded text-xs flex items-center justify-center text-white font-medium ${
                        [12, 23, 34, 45].includes(i + 1) ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
                <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm font-medium">Cliente escolhe as cotas</span>
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
                className="w-full p-4 bg-transparent border-none resize-none focus:outline-none min-h-[120px]"
                placeholder="Digite a descrição da sua campanha..."
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
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Clique para adicionar imagens ou arraste e solte aqui
              </p>
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

          {/* Filtro inicial das cotas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filtro inicial das cotas *
            </label>
            <div className="relative">
              <select
                value={formData.initialFilter}
                onChange={(e) => setFormData({ ...formData, initialFilter: e.target.value })}
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
                value={formData.paymentTime}
                onChange={(e) => setFormData({ ...formData, paymentTime: e.target.value })}
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