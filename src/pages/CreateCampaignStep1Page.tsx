import React, { useState } from 'react';
import { ArrowRight, ChevronDown, Sparkles, DollarSign, TrendingUp, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCampaigns } from '../hooks/useCampaigns';
import PublicationFeesModal from '../components/PublicationFeesModal';
import { CampaignAPI } from '../lib/api/campaigns';

const CreateCampaignStep1Page = () => {
  const navigate = useNavigate();
  const { createCampaign } = useCampaigns();

  const [formData, setFormData] = useState({
    title: '',
    ticketQuantity: '',
    ticketPrice: '0,00',
    drawMethod: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showFeesModal, setShowFeesModal] = useState(false);
  const [estimatedRevenue, setEstimatedRevenue] = useState(0);
  const [publicationTax, setPublicationTax] = useState(0);
  const [rawTicketPrice, setRawTicketPrice] = useState('');

  const drawMethods = [
    'Loteria Federal',
    'Sorteador.com.br',
    'Live no Instagram',
    'Live no Youtube',
    'Live no TikTok',
    'Outros'
  ];

  const ticketQuantityOptions = [
    { value: 25, label: '25 cotas' },
    { value: 50, label: '50 cotas' },
    { value: 100, label: '100 cotas' },
    { value: 200, label: '200 cotas' },
    { value: 300, label: '300 cotas' },
    { value: 400, label: '400 cotas' },
    { value: 500, label: '500 cotas' },
    { value: 600, label: '600 cotas' },
    { value: 700, label: '700 cotas' },
    { value: 800, label: '800 cotas' },
    { value: 900, label: '900 cotas' },
    { value: 1000, label: '1.000 cotas' },
    { value: 2000, label: '2.000 cotas' },
    { value: 3000, label: '3.000 cotas' },
    { value: 4000, label: '4.000 cotas' },
    { value: 5000, label: '5.000 cotas' },
    { value: 10000, label: '10.000 cotas' },
    { value: 20000, label: '20.000 cotas' },
    { value: 30000, label: '30.000 cotas' },
    { value: 40000, label: '40.000 cotas' },
    { value: 50000, label: '50.000 cotas' },
    { value: 100000, label: '100.000 cotas' },
    { value: 500000, label: '500.000 cotas' },
    { value: 1000000, label: '1.000.000 cotas' },
    { value: 10000000, label: '10.000.000 cotas' }
  ];

  const updateCalculations = (price: string, quantity: string) => {
    const ticketPrice = parseFloat(price) / 100 || 0;
    const ticketQuantity = parseInt(quantity) || 0;
    const revenue = ticketPrice * ticketQuantity;
    const tax = CampaignAPI.getPublicationTax(revenue)?.price || 0;

    setEstimatedRevenue(revenue);
    setPublicationTax(tax);
  };

  const formatCurrencyDisplay = (rawValue: string): string => {
    const numericValue = rawValue.replace(/\D/g, '');
    
    if (!numericValue) return '';
    
    const cents = parseInt(numericValue, 10);
    const reais = cents / 100;
    
    const formatted = reais.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return formatted;
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numericValue = inputValue.replace(/\D/g, '');
    
    setRawTicketPrice(numericValue);
    const formattedValue = formatCurrencyDisplay(numericValue);
    
    setFormData({ ...formData, ticketPrice: formattedValue });
    updateCalculations(numericValue, formData.ticketQuantity);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const quantity = e.target.value;
    setFormData({ ...formData, ticketQuantity: quantity });
    updateCalculations(rawTicketPrice, quantity);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Título deve ter pelo menos 3 caracteres';
    }

    if (!formData.ticketQuantity) {
      newErrors.ticketQuantity = 'Quantidade de cotas é obrigatória';
    }

    if (!rawTicketPrice || rawTicketPrice === '0') {
      newErrors.ticketPrice = 'Preço da cota é obrigatório';
    }

    if (!formData.drawMethod) {
      newErrors.drawMethod = 'Método de sorteio é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const ticketPrice = parseFloat(rawTicketPrice) / 100;
    const totalTickets = parseInt(formData.ticketQuantity);
    const campaignModel = totalTickets > 10000 ? 'automatic' : 'manual';

    setLoading(true);

    try {
      const maxTicketsPerPurchase = Math.min(20000, totalTickets);

      const campaignData = {
        title: formData.title,
        ticket_price: ticketPrice,
        total_tickets: totalTickets,
        draw_method: formData.drawMethod,
        require_email: true,
        show_ranking: false,
        min_tickets_per_purchase: 1,
        max_tickets_per_purchase: maxTicketsPerPurchase,
        initial_filter: 'all',
        campaign_model: campaignModel,
        prize_image_urls: []
      };

      const campaign = await createCampaign(campaignData);

      if (campaign) {
        navigate(`/dashboard/create-campaign/step-2?id=${campaign.id}`);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      
      let errorMessage = 'Erro ao criar campanha. Tente novamente.';
      
      if (error && typeof error === 'object') {
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        } else if ('details' in error && Array.isArray(error.details)) {
          errorMessage = error.details.map((detail: any) => detail.message).join(', ');
        }
      }
      
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrencyForDisplay = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const netRevenue = estimatedRevenue - publicationTax;

  return (
    <div className="min-h-screen bg-transparent text-gray-900 dark:text-white transition-colors duration-300">
      <style>
        {`
          @media (max-width: 640px) {
            ::-webkit-scrollbar {
              width: 8px;
            }
            ::-webkit-scrollbar-track {
              background: linear-gradient(to bottom, rgba(139, 92, 246, 0.05), rgba(219, 39, 119, 0.05));
              border-radius: 10px;
            }
            ::-webkit-scrollbar-thumb {
              background: linear-gradient(to bottom, #a855f7, #ec4899, #3b82f6);
              border-radius: 10px;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(to bottom, #c084fc, #f472b6);
            }
            ::-webkit-scrollbar-thumb:active {
              background: linear-gradient(to bottom, #7c3aed, #db2777);
            }
          }
          
          @media (min-width: 641px) {
            ::-webkit-scrollbar {
              width: 12px;
            }
            ::-webkit-scrollbar-track {
              background: linear-gradient(to bottom, rgba(139, 92, 246, 0.05), rgba(219, 39, 119, 0.05));
              border-radius: 10px;
            }
            ::-webkit-scrollbar-thumb {
              background: linear-gradient(to bottom, #a855f7, #ec4899, #3b82f6);
              border-radius: 10px;
              box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
            }
            ::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(to bottom, #c084fc, #f472b6);
              box-shadow: 0 0 15px rgba(192, 132, 252, 0.6);
            }
          }
        `}
      </style>
      <main className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header com gradiente */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 sm:mb-8 relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-xl border border-purple-200/30 dark:border-purple-800/30 bg-gradient-to-br from-purple-50/80 to-blue-50/80 dark:from-purple-900/20 dark:to-blue-900/20 backdrop-blur-sm"
        >
          <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-tr from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          
          <div className="relative flex items-center space-x-3 sm:space-x-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">Criar nova campanha</h1>
              <p className="text-xs sm:text-base text-gray-600 dark:text-gray-300">Configure os dados básicos e calcule sua arrecadação estimada</p>
            </div>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Error Message */}
          {errors.submit && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 sm:p-4 shadow-md"
            >
              <p className="text-red-700 dark:text-red-300 text-xs sm:text-sm font-medium">{errors.submit}</p>
            </motion.div>
          )}

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-200/20 dark:border-gray-700/30 p-4 sm:p-8 shadow-lg"
          >
            <div className="space-y-4 sm:space-y-6">
              {/* Campaign Title */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                  Título da campanha *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Rifa do iPhone 15 Pro Max"
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3.5 text-xs sm:text-base border-2 rounded-lg sm:rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-4 transition-all duration-200 ${
                    errors.title 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-500 focus:ring-purple-500/20'
                  }`}
                  required
                />
                {errors.title && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1 sm:mt-2 font-medium">{errors.title}</p>
                )}
              </motion.div>

              {/* Ticket Configuration Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Ticket Quantity */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                    Quantidade de cotas *
                  </label>
                  <div className="relative">
                    <select
                      value={formData.ticketQuantity}
                      onChange={handleQuantityChange}
                      className={`w-full appearance-none px-3 sm:px-4 py-2.5 sm:py-3.5 text-xs sm:text-base border-2 rounded-lg sm:rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-4 transition-all duration-200 ${
                        errors.ticketQuantity 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                          : 'border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-500 focus:ring-purple-500/20'
                      }`}
                      required
                    >
                      <option value="">Selecione a quantidade</option>
                      {ticketQuantityOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 pointer-events-none" />
                  </div>
                  {errors.ticketQuantity && (
                    <p className="text-red-500 text-xs sm:text-sm mt-1 sm:mt-2 font-medium">{errors.ticketQuantity}</p>
                  )}
                </motion.div>

                {/* Ticket Price */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                    Valor por cota *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.ticketPrice}
                      onChange={handlePriceChange}
                      placeholder="0,00"
                      className={`w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3.5 text-xs sm:text-base border-2 rounded-lg sm:rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-4 transition-all duration-200 ${
                        errors.ticketPrice 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                          : 'border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-500 focus:ring-purple-500/20'
                      }`}
                      required
                    />
                  </div>
                  {errors.ticketPrice && (
                    <p className="text-red-500 text-xs sm:text-sm mt-1 sm:mt-2 font-medium">{errors.ticketPrice}</p>
                  )}
                </motion.div>
              </div>

              {/* Draw Method */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                  Método de sorteio *
                </label>
                <div className="relative">
                  <select
                    value={formData.drawMethod}
                    onChange={(e) => setFormData({ ...formData, drawMethod: e.target.value })}
                    className={`w-full appearance-none px-3 sm:px-4 py-2.5 sm:py-3.5 text-xs sm:text-base border-2 rounded-lg sm:rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-4 transition-all duration-200 ${
                      errors.drawMethod 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                        : 'border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-500 focus:ring-purple-500/20'
                    }`}
                    required
                  >
                    <option value="">Selecione o método</option>
                    {drawMethods.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 pointer-events-none" />
                </div>
                {errors.drawMethod && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1 sm:mt-2 font-medium">{errors.drawMethod}</p>
                )}
              </motion.div>
            </div>
          </motion.div>

          {/* Revenue Calculation Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative overflow-hidden bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-green-200/30 dark:border-green-800/30 p-4 sm:p-8 shadow-lg"
          >
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-tr from-emerald-400/20 to-green-400/20 rounded-full blur-3xl"></div>
            
            <div className="relative">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-600 to-emerald-600 text-white rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <h3 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">
                    Projeção financeira
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFeesModal(true)}
                  className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200 underline decoration-2 underline-offset-4"
                >
                  Ver taxas
                </button>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-200/30 dark:border-green-800/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Arrecadação bruta</span>
                    </div>
                    <span className="text-base sm:text-xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrencyForDisplay(estimatedRevenue)}
                    </span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-red-200/30 dark:border-red-800/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                        <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Taxa de publicação</span>
                    </div>
                    <span className="text-base sm:text-xl font-bold text-red-600 dark:text-red-400">
                      - {formatCurrencyForDisplay(publicationTax)}
                    </span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-lg sm:rounded-xl p-4 sm:p-5 border-2 border-purple-300/50 dark:border-purple-700/50 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                        <Award className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">Lucro estimado</span>
                    </div>
                    <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      {formatCurrencyForDisplay(netRevenue)}
                    </span>
                  </div>
                </motion.div>
              </div>

              {estimatedRevenue > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                  className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg sm:rounded-xl"
                >
                  <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 text-center">
                    Vendendo todas as cotas, você receberá <span className="font-bold">{formatCurrencyForDisplay(netRevenue)}</span> líquidos
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-lg shadow-xl transition-all duration-300 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 text-white flex items-center justify-center space-x-2 sm:space-x-3"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-white"></div>
                <span>Criando campanha...</span>
              </>
            ) : (
              <>
                <span>Continuar para próxima etapa</span>
                <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" />
              </>
            )}
          </motion.button>

          <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Na próxima etapa você poderá adicionar fotos, descrição e outros detalhes
          </p>
        </form>
      </main>

      {/* Publication Fees Modal */}
      <PublicationFeesModal
        isOpen={showFeesModal}
        onClose={() => setShowFeesModal(false)}
      />
    </div>
  );
};

export default CreateCampaignStep1Page;