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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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

  // Generate calendar for current month
  const generateCalendar = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
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

  const { days, month, year } = generateCalendar();
  const monthNames = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
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
                <div className="grid grid-cols-10 gap-1 mb-3">
                  {Array.from({ length: 50 }, (_, i) => (
                    <div
                      key={i}
                      className={`w-6 h-6 rounded text-xs flex items-center justify-center text-white font-medium ${
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
              <Info className="h-4 w-4 text-gray-400" />
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
          <div className="flex space-x-4">
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <span className="text-lg">🎫</span>
              <span className="text-sm font-medium">Cota premiada</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <span className="text-lg">🏆</span>
              <span className="text-sm font-medium">Prêmio</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <span className="text-lg">🎁</span>
              <span className="text-sm font-medium">Promoção</span>
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
                <Info className="h-4 w-4 text-gray-400" />
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
                <Info className="h-4 w-4 text-gray-400" />
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
              <Info className="h-4 w-4 text-gray-400" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowDatePicker(false)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors duration-200 ${
                    !showDatePicker 
                      ? 'border-gray-400 bg-gray-100 dark:bg-gray-700' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <span className="text-sm">✕</span>
                  <span className="text-sm font-medium">INFORMAR DATA</span>
                </button>
              </div>

              {showDatePicker && (
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                      <ChevronDown className="h-4 w-4 rotate-90" />
                    </button>
                    <h3 className="font-medium">
                      {monthNames[month]} {year}
                    </h3>
                    <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                      <ChevronDown className="h-4 w-4 -rotate-90" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((day) => (
                      <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 p-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {days.map((day, index) => {
                      const isCurrentMonth = day.getMonth() === month;
                      const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
                      
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            if (isCurrentMonth) {
                              setSelectedDate(day);
                              setFormData({ ...formData, drawDate: formatDate(day) });
                            }
                          }}
                          className={`p-2 text-sm rounded transition-colors duration-200 ${
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

                  {selectedDate && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                        <Clock className="h-4 w-4" />
                        <span>SEX. JUL 18 2025</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <input
                          type="time"
                          className="bg-transparent border-none text-sm focus:outline-none"
                          defaultValue="12:00"
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        INFORMAR DATA
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tempo para pagamento */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tempo para pagamento
              </label>
              <Info className="h-4 w-4 text-gray-400" />
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
                <Info className="h-4 w-4 text-gray-400" />
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
                <Info className="h-4 w-4 text-gray-400" />
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