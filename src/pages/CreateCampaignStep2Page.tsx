import React, { useState, useEffect } from 'react';
import { ArrowRight, ChevronDown, Trophy, Plus, Trash2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCampaigns } from '../hooks/useCampaigns';
import CountryPhoneSelect from '../components/CountryPhoneSelect';
import PublicationFeesModal from '../components/PublicationFeesModal';
import PrizesModal from '../components/PrizesModal';
import { Prize } from '../types/promotion';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

const CreateCampaignStep2Page = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('id');
  const { getCampaign, updateCampaign } = useCampaigns();

  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPrizesModal, setShowPrizesModal] = useState(false);
  const [prizes, setPrizes] = useState<Prize[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    ticketQuantity: '',
    ticketPrice: '0,00',
    drawMethod: '',
    phoneNumber: '',
    acceptTerms: false
  });

  const [selectedCountry, setSelectedCountry] = useState<Country>({
    code: 'BR',
    name: 'Brasil',
    dialCode: '+55',
    flag: '🇧🇷'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showFeesModal, setShowFeesModal] = useState(false);
  const [estimatedRevenue, setEstimatedRevenue] = useState(0);
  const [publicationTax, setPublicationTax] = useState(0);
  const [rawTicketPrice, setRawTicketPrice] = useState('');

  // Load campaign data
  useEffect(() => {
    const loadCampaign = async () => {
      if (!campaignId) {
        navigate('/dashboard/create-campaign/step-1');
        return;
      }

      try {
        const campaignData = await getCampaign(campaignId);
        if (campaignData) {
          setCampaign(campaignData);
          
          // Load existing prizes
          if (campaignData.prizes) {
            setPrizes(campaignData.prizes);
          }
          
          // Populate form with existing data
          setFormData({
            title: campaignData.title || '',
            ticketQuantity: campaignData.total_tickets?.toString() || '',
            ticketPrice: campaignData.ticket_price?.toFixed(2).replace('.', ',') || '0,00',
            drawMethod: campaignData.draw_method || '',
            phoneNumber: campaignData.phone_number?.replace(/^\+\d+\s/, '') || '',
            acceptTerms: true
          });
          
          // Set raw price for calculations
          const priceInCents = Math.round((campaignData.ticket_price || 0) * 100);
          setRawTicketPrice(priceInCents.toString());
          
          // Update calculations
          updateCalculations(priceInCents.toString(), campaignData.total_tickets?.toString() || '');
        }
      } catch (error) {
        console.error('Error loading campaign:', error);
        setErrors({ submit: 'Erro ao carregar campanha. Tente novamente.' });
      } finally {
        setLoading(false);
      }
    };

    loadCampaign();
  }, [campaignId, getCampaign, navigate]);

  // Format currency for display with Brazilian formatting
  const formatCurrencyForDisplay = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

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

  // Calculate publication tax based on estimated revenue
  const calculatePublicationTax = (revenue: number): number => {
    if (revenue <= 100) return 7.00;
    if (revenue <= 200) return 17.00;
    if (revenue <= 400) return 27.00;
    if (revenue <= 701) return 37.00;
    if (revenue <= 1000) return 57.00;
    if (revenue <= 2000) return 67.00;
    if (revenue <= 4000) return 77.00;
    if (revenue <= 7000) return 127.00;
    if (revenue <= 10000) return 197.00;
    if (revenue <= 20000) return 247.00;
    if (revenue <= 30000) return 497.00;
    if (revenue <= 50000) return 997.00;
    if (revenue <= 70000) return 1297.00;
    if (revenue <= 100000) return 1997.00;
    if (revenue <= 150000) return 2997.00;
    return 3997.00;
  };

  // Update calculations when price or quantity changes
  const updateCalculations = (price: string, quantity: string) => {
    const ticketPrice = parseFloat(price) / 100 || 0;
    const ticketQuantity = parseInt(quantity) || 0;
    const revenue = ticketPrice * ticketQuantity;
    const tax = calculatePublicationTax(revenue);
    
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

  // Auto-save function for prizes
  const handleSavePrizes = async (updatedPrizes: Prize[], showFeedback = true) => {
    if (!campaignId) return;

    try {
      setSaving(true);
      
      // Update campaign with new prizes
      await updateCampaign({
        id: campaignId,
        prizes: updatedPrizes
      });
      
      // Update local state
      setPrizes(updatedPrizes);
      
      if (showFeedback) {
        console.log('Prêmios salvos com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao salvar prêmios:', error);
      if (showFeedback) {
        alert('Erro ao salvar prêmios. Tente novamente.');
      }
    } finally {
      setSaving(false);
    }
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

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Número de celular é obrigatório';
    } else {
      const numbers = formData.phoneNumber.replace(/\D/g, '');
      if (selectedCountry.code === 'BR' && numbers.length !== 11) {
        newErrors.phoneNumber = 'Número de celular deve ter 11 dígitos';
      } else if ((selectedCountry.code === 'US' || selectedCountry.code === 'CA') && numbers.length !== 10) {
        newErrors.phoneNumber = 'Número de telefone deve ter 10 dígitos';
      } else if (numbers.length < 7) {
        newErrors.phoneNumber = 'Número de telefone inválido';
      }
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Você deve aceitar os termos de uso';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const ticketPrice = parseFloat(rawTicketPrice) / 100;
      const ticketQuantity = parseInt(formData.ticketQuantity);

      const updateData = {
        id: campaignId!,
        title: formData.title,
        ticket_price: ticketPrice,
        total_tickets: ticketQuantity,
        draw_method: formData.drawMethod,
        phone_number: `${selectedCountry.dialCode} ${formData.phoneNumber}`,
        prizes: prizes
      };

      await updateCampaign(updateData);
      
      // Navigate to step 3
      navigate(`/dashboard/create-campaign/step-3?id=${campaignId}`);
    } catch (error) {
      console.error('Error updating campaign:', error);
      setErrors({ submit: 'Erro ao atualizar campanha. Tente novamente.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-6 rounded-lg border border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-6 rounded-lg border border-gray-200 dark:border-gray-800 transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Editar campanha
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Ajuste os dados da sua campanha conforme necessário
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
                  onChange={handleQuantityChange}
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
                placeholder="R$ 0,00"
                className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200 ${
                  errors.ticketPrice ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                required
              />
              {errors.ticketPrice && (
                <p className="text-red-500 text-sm mt-1">{errors.ticketPrice}</p>
              )}
              
              {/* Real-time Tax Display */}
              {rawTicketPrice && formData.ticketQuantity && (
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 dark:text-gray-300">Arrecadação estimada:</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        R$ {estimatedRevenue.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 dark:text-gray-300">Taxa da campanha:</span>
                      <span className="font-medium text-red-600 dark:text-red-400">
                        R$ {publicationTax.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                </div>
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

          {/* Phone Number with Country Selection */}
          <CountryPhoneSelect
            selectedCountry={selectedCountry}
            onCountryChange={setSelectedCountry}
            phoneNumber={formData.phoneNumber}
            onPhoneChange={(phone) => setFormData({ ...formData, phoneNumber: phone })}
            placeholder="Número de telefone"
            error={errors.phoneNumber}
          />

          {/* Prizes Section */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span>Prêmios da Campanha</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPrizesModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 relative"
              >
                <Plus className="h-4 w-4" />
                <span>Prêmios</span>
                {prizes.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {prizes.length}
                  </span>
                )}
                {saving && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                )}
              </button>
            </div>
            
            {prizes.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Prêmios configurados ({prizes.length}):
                </p>
                <div className="grid gap-2">
                  {prizes.map((prize, index) => (
                    <div
                      key={prize.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          {index + 1}°
                        </span>
                        <span className="text-gray-900 dark:text-white">
                          {prize.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updatedPrizes = prizes.filter(p => p.id !== prize.id);
                          handleSavePrizes(updatedPrizes);
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors duration-200"
                        disabled={saving}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Nenhum prêmio configurado. Clique em "Prêmios" para adicionar.
              </p>
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
                onClick={() => setShowFeesModal(true)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
              >
                Ver taxas
              </button>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Taxa de publicação</span>
                <span className="text-red-600 dark:text-red-400 font-medium">
                  - {formatCurrencyForDisplay(publicationTax)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Arrecadação estimada</span>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  + {formatCurrencyForDisplay(estimatedRevenue)}
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
            disabled={saving}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <span>Salvar e Continuar</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Prizes Modal */}
      <PrizesModal
        isOpen={showPrizesModal}
        onClose={() => setShowPrizesModal(false)}
        prizes={prizes}
        onSave={handleSavePrizes}
        campaignId={campaignId || ''}
      />

      {/* Publication Fees Modal */}
      <PublicationFeesModal
        isOpen={showFeesModal}
        onClose={() => setShowFeesModal(false)}
      />
    </div>
  );
};

export default CreateCampaignStep2Page;