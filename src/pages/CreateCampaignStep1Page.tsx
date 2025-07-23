import React, { useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCampaigns } from '../hooks/useCampaigns';

const CreateCampaignStep1Page = () => {
  const navigate = useNavigate();
  const { createCampaign } = useCampaigns();

  const [formData, setFormData] = useState({
    title: '',
    ticketQuantity: '',
    ticketPrice: '0,00',
    drawMethod: '',
    phoneNumber: '',
    acceptTerms: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const drawMethods = [
    'Loteria Federal',
    'Sorteador.com.br',
    'Live no Instagram',
    'Live no Youtube',
    'Live no TikTok',
    'Outros'
  ];

  const ticketQuantityOptions = [
    { value: 50, label: '50 cotas' },
    { value: 100, label: '100 cotas' },
    { value: 200, label: '200 cotas' },
    { value: 500, label: '500 cotas' },
    { value: 1000, label: '1000 cotas' },
    { value: 2000, label: '2000 cotas' },
    { value: 5000, label: '5000 cotas' },
    { value: 10000, label: '10000 cotas' }
  ];

  // Phone number formatting function
  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');
    
    // Limit to 11 digits
    const limitedNumbers = numbers.slice(0, 11);
    
    // Format as (XX) XXXXX-XXXX
    if (limitedNumbers.length <= 2) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 7) {
      return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2)}`;
    } else {
      return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 7)}-${limitedNumbers.slice(7)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phoneNumber: formattedValue });
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Remove all non-numeric characters except comma
    value = value.replace(/[^\d,]/g, '');
    
    // Ensure only one comma
    const parts = value.split(',');
    if (parts.length > 2) {
      value = parts[0] + ',' + parts.slice(1).join('');
    }
    
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      value = parts[0] + ',' + parts[1].substring(0, 2);
    }

    setFormData({ ...formData, ticketPrice: value });
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

    if (!formData.ticketPrice.trim() || formData.ticketPrice === '0,00') {
      newErrors.ticketPrice = 'Preço da cota é obrigatório';
    }

    if (!formData.drawMethod) {
      newErrors.drawMethod = 'Método de sorteio é obrigatório';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Número de celular é obrigatório';
    } else {
      // Validate phone number format (should have 11 digits)
      const numbers = formData.phoneNumber.replace(/\D/g, '');
      if (numbers.length !== 11) {
        newErrors.phoneNumber = 'Número de celular deve ter 11 dígitos';
      }
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Você deve aceitar os termos de uso';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculate publication tax based on estimated revenue
  const calculatePublicationTax = () => {
    const ticketPrice = parseFloat(formData.ticketPrice.replace(',', '.')) || 0;
    const quantity = parseInt(formData.ticketQuantity) || 0;
    const revenue = ticketPrice * quantity;
    
    if (revenue <= 100) return 7.00;
    if (revenue <= 200) return 17.00;
    if (revenue <= 400) return 27.00;
    if (revenue <= 701) return 37.00;
    if (revenue <= 1000) return 47.00;
    if (revenue <= 2000) return 67.00;
    if (revenue <= 4000) return 77.00;
    if (revenue <= 7100) return 127.00;
    if (revenue <= 10000) return 197.00;
    if (revenue <= 20000) return 247.00;
    if (revenue <= 30000) return 497.00;
    if (revenue <= 50000) return 997.00;
    if (revenue <= 70000) return 1497.00;
    if (revenue <= 100000) return 1997.00;
    if (revenue <= 150000) return 2997.00;
    
    return 3997.00;
  };

  const getEstimatedRevenue = () => {
    const ticketPrice = parseFloat(formData.ticketPrice.replace(',', '.')) || 0;
    const quantity = parseInt(formData.ticketQuantity) || 0;
    return ticketPrice * quantity;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Convert price from Brazilian format to number
      const ticketPrice = parseFloat(formData.ticketPrice.replace(',', '.'));
      const ticketQuantity = parseInt(formData.ticketQuantity);

      // Create campaign data
      const campaignData = {
        title: formData.title,
        ticket_price: ticketPrice,
        total_tickets: ticketQuantity,
        draw_method: formData.drawMethod,
        phone_number: formData.phoneNumber,
        payment_deadline_hours: 24,
        require_email: true,
        show_ranking: false,
        min_tickets_per_purchase: 1,
        max_tickets_per_purchase: 1000,
        initial_filter: 'all' as 'all' | 'available',
        campaign_model: 'manual' as 'manual' | 'automatic',
        prize_image_urls: []
      };

      const campaign = await createCampaign(campaignData);
      
      if (campaign) {
        // Navigate to step 2 with the campaign ID
        navigate(`/dashboard/create-campaign/step-2?id=${campaign.id}`);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      setErrors({ submit: 'Erro ao criar campanha. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-6 rounded-lg border border-gray-200 dark:border-gray-800 transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Criar campanha
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Insira os dados de como deseja a sua campanha abaixo, eles poderão ser editados depois
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-700 dark:text-red-300 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Campaign Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Digite o título sua campanha"
              className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200 ${
                errors.title ? 'border-red-500' : 'border-green-500'
              }`}
              required
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Ticket Configuration Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ticket Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quantidade de cotas *
              </label>
              <div className="relative">
                <select
                  value={formData.ticketQuantity}
                  onChange={(e) => setFormData({ ...formData, ticketQuantity: e.target.value })}
                  className={`w-full appearance-none px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200 ${
                    errors.ticketQuantity ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  required
                >
                  <option value="">Escolha uma opção</option>
                  {ticketQuantityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
              {errors.ticketQuantity && (
                <p className="text-red-500 text-sm mt-1">{errors.ticketQuantity}</p>
              )}
            </div>

            {/* Ticket Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Valor da cota *
              </label>
              <input
                type="text"
                value={formData.ticketPrice}
                onChange={handlePriceChange}
                placeholder="0,00"
                className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200 ${
                  errors.ticketPrice ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                required
              />
              {errors.ticketPrice && (
                <p className="text-red-500 text-sm mt-1">{errors.ticketPrice}</p>
              )}
            </div>
          </div>

          {/* Draw Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Por onde será feito o sorteio? *
            </label>
            <div className="relative">
              <select
                value={formData.drawMethod}
                onChange={(e) => setFormData({ ...formData, drawMethod: e.target.value })}
                className={`w-full appearance-none px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200 ${
                  errors.drawMethod ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                required
              >
                <option value="">Escolha uma opção</option>
                {drawMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
            {errors.drawMethod && (
              <p className="text-red-500 text-sm mt-1">{errors.drawMethod}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Número de celular *
            </label>
            <div className="flex space-x-2">
              <div className="flex-shrink-0">
                <div className="px-3 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white">
                  BR
                </div>
              </div>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={handlePhoneChange}
                placeholder="(11) 99999-9999"
                maxLength={15}
                className={`flex-1 px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200 ${
                  errors.phoneNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                required
              />
            </div>
            {errors.phoneNumber && (
              <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>
            )}
          </div>

          {/* Publication Tax Section */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Taxas de publicação
              </h3>
              <button
                type="button"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Ver taxas
              </button>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Taxa de publicação</span>
                <span className="text-red-600 dark:text-red-400 font-medium">
                  - R$ {calculatePublicationTax().toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Arrecadação estimada</span>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  + R$ {getEstimatedRevenue().toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>

          {/* Terms Acceptance */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="acceptTerms"
              checked={formData.acceptTerms}
              onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
              className="w-4 h-4 text-green-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-green-500 focus:ring-2 mt-1"
              required
            />
            <label htmlFor="acceptTerms" className="text-sm text-gray-700 dark:text-gray-300">
              Ao criar esta campanha, você aceita nossos{' '}
              <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
                Termos de Uso
              </a>{' '}
              e a nossa{' '}
              <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
                Política de Privacidade
              </a>
              .
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="text-red-500 text-sm">{errors.acceptTerms}</p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <span>Prosseguir</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateCampaignStep1Page;