import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, Save, Eye, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface CampaignFormData {
  title: string;
  ticketQuantity: number;
  ticketPrice: string;
  drawMethod: string;
  phoneNumber: string;
}

const CreateCampaignPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showTaxes, setShowTaxes] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [formData, setFormData] = useState<CampaignFormData>({
    title: '',
    ticketQuantity: 25,
    ticketPrice: '0,00',
    drawMethod: '',
    phoneNumber: ''
  });

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  const handleInputChange = (field: keyof CampaignFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCurrency = (value: string) => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    
    // If empty, return default
    if (!numericValue) {
      return '0,00';
    }
    
    // Convert to number (treating as cents)
    const cents = parseInt(numericValue, 10);
    
    // Convert cents to reais
    const reais = cents / 100;
    
    // Format as Brazilian currency
    return reais.toFixed(2).replace('.', ',');
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formattedValue = formatCurrency(inputValue);
    setFormData({ ...formData, ticketPrice: formattedValue });
  };

  // Predefined ticket quantity options
  const ticketOptions = [
    25, 50, 100, 200, 300, 500, 1000, 2000, 3000, 5000, 
    10000, 20000, 30000, 50000, 100000, 200000, 300000, 
    500000, 1000000, 2000000, 3000000, 5000000, 10000000
  ];

  // Draw method options
  const drawMethods = [
    'Loteria Federal',
    'Sorteador.com.br',
    'Live no Instagram',
    'Live no Youtube',
    'Live no TikTok',
    'Outros'
  ];

  // Calculate estimated revenue
  const calculateRevenue = () => {
    const price = parseFloat(formData.ticketPrice.replace(',', '.'));
    return (price * formData.ticketQuantity).toFixed(2).replace('.', ',');
  };

  // Calculate publication tax based on revenue ranges
  const calculatePublicationTax = () => {
    const revenue = parseFloat(calculateRevenue().replace(',', '.'));
    
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
    
    return 3997.00; // Above R$ 150,000
  };

  const handleSaveDraft = async () => {
    if (!formData.title.trim()) {
      alert('Por favor, preencha o título da campanha.');
      return;
    }

    if (!user) {
      alert('Usuário não autenticado');
      return;
    }

    setLoading(true);
    try {
      const price = parseFloat(formData.ticketPrice.replace(',', '.'));
      
      const { error } = await supabase
        .from('campaigns')
        .insert({
          user_id: user.id,
          title: formData.title,
          prize_description: 'Prêmio a ser definido',
          ticket_price: price,
          total_tickets: formData.ticketQuantity,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          status: 'draft'
        });

      if (error) {
        console.error('Error creating campaign:', error);
        alert('Erro ao salvar campanha. Tente novamente.');
      } else {
        alert('Campanha salva como rascunho com sucesso!');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Erro ao salvar campanha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!formData.title.trim() || !formData.drawMethod || !acceptTerms) {
      alert('Por favor, preencha todos os campos obrigatórios e aceite os termos.');
      return;
    }

    if (!user) {
      alert('Usuário não autenticado');
      return;
    }

    setLoading(true);
    try {
      const price = parseFloat(formData.ticketPrice.replace(',', '.'));
      
      const { error } = await supabase
        .from('campaigns')
        .insert({
          user_id: user.id,
          title: formData.title,
          prize_description: 'Prêmio a ser definido',
          ticket_price: price,
          total_tickets: formData.ticketQuantity,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active'
        });

      if (error) {
        console.error('Error creating campaign:', error);
        alert('Erro ao publicar campanha. Tente novamente.');
      } else {
        alert('Campanha publicada com sucesso!');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Erro ao publicar campanha. Tente novamente.');
    } finally {
      setLoading(false);
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
              Criar campanha
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Insira os dados de como deseja a sua campanha abaixo, eles poderão ser editados depois
            </p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6 max-w-2xl">
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Digite o título sua campanha"
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
            />
          </div>

          {/* Ticket Quantity and Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ticket Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quantidade de cotas
              </label>
              <div className="relative">
                <select
                  value={formData.ticketQuantity}
                  onChange={(e) => handleInputChange('ticketQuantity', parseInt(e.target.value))}
                  className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pr-10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
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
            </div>

            {/* Ticket Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Valor da cota
              </label>
              <input
                type="text"
                value={formData.ticketPrice}
                onChange={handlePriceChange}
                placeholder="0,00"
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
              />
            </div>
          </div>

          {/* Draw Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Por onde será feito o sorteio?
            </label>
            <div className="relative">
              <select
                value={formData.drawMethod}
                onChange={(e) => handleInputChange('drawMethod', e.target.value)}
                className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pr-10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
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
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Número de celular
            </label>
            <div className="flex space-x-2">
              <div className="relative">
                <select className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pr-8 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200">
                  <option value="BR">BR</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                placeholder="Digite seu número"
                className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
              />
            </div>
          </div>

          {/* Publication Taxes */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Taxas de publicação
              </h3>
              <button
                onClick={() => setShowTaxes(!showTaxes)}
                className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium transition-colors duration-200"
              >
                Ver taxas
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Taxa de publicação</span>
                <span className="text-red-600 dark:text-red-400 font-medium">
                  - R$ {calculatePublicationTax().toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Arrecadação estimada</span>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  + R$ {calculateRevenue()}
                </span>
              </div>
            </div>

            {/* Tax Table Modal */}
            {showTaxes && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Tabela de Taxas
                    </h3>
                    <button
                      onClick={() => setShowTaxes(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg overflow-hidden">
                    <div className="grid grid-cols-2 gap-px bg-gray-600">
                      <div className="bg-gray-700 px-4 py-3 text-center">
                        <span className="text-green-400 font-semibold">ARRECADAÇÃO</span>
                      </div>
                      <div className="bg-gray-700 px-4 py-3 text-center">
                        <span className="text-yellow-400 font-semibold">TAXA</span>
                      </div>
                    </div>
                    
                    {[
                      ['R$ 0,00 a R$ 100,00', 'R$ 7,00'],
                      ['R$ 100,00 a R$ 200,00', 'R$ 17,00'],
                      ['R$ 200,00 a R$ 400,00', 'R$ 27,00'],
                      ['R$ 400,00 a R$ 701,00', 'R$ 37,00'],
                      ['R$ 701,00 a R$ 1.000,00', 'R$ 47,00'],
                      ['R$ 1.000,00 a R$ 2.000,00', 'R$ 67,00'],
                      ['R$ 2.000,00 a R$ 4.000,00', 'R$ 77,00'],
                      ['R$ 4.000,00 a R$ 7.100,00', 'R$ 127,00'],
                      ['R$ 7.100,00 a R$ 10.000,00', 'R$ 197,00'],
                      ['R$ 10.000,00 a R$ 20.000,00', 'R$ 247,00'],
                      ['R$ 20.000,00 a R$ 30.000,00', 'R$ 497,00'],
                      ['R$ 30.000,00 a R$ 50.000,00', 'R$ 997,00'],
                      ['R$ 50.000,00 a R$ 70.000,00', 'R$ 1.497,00'],
                      ['R$ 70.000,00 a R$ 100.000,00', 'R$ 1.997,00'],
                      ['R$ 100.000,00 a R$ 150.000,00', 'R$ 2.997,00'],
                      ['Acima de R$ 150.000,00', 'R$ 3.997,00']
                    ].map(([range, tax], index) => (
                      <div key={index} className="grid grid-cols-2 gap-px bg-gray-600">
                        <div className="bg-gray-800 px-4 py-2 text-center">
                          <span className="text-green-400 text-sm">{range}</span>
                        </div>
                        <div className="bg-gray-800 px-4 py-2 text-center">
                          <span className="text-yellow-400 text-sm">{tax}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="terms"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-1 w-4 h-4 text-purple-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 dark:focus:ring-purple-600 focus:ring-2"
            />
            <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400">
              Ao criar esta campanha, você aceita nossos{' '}
              <a href="#" className="text-purple-600 dark:text-purple-400 hover:underline">
                Termos de Uso
              </a>{' '}
              e a nossa{' '}
              <a href="#" className="text-purple-600 dark:text-purple-400 hover:underline">
                Política de Privacidade
              </a>
              .
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              onClick={handleSaveDraft}
              disabled={loading || !formData.title.trim()}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>Salvar Rascunho</span>
            </button>
            
            <button
              onClick={handlePublish}
              disabled={loading || !formData.title.trim() || !formData.drawMethod || !acceptTerms}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Prosseguir</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaignPage;