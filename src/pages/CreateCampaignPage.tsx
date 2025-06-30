import React, { useState } from 'react';
import { ArrowLeft, Upload, Calendar, DollarSign, Ticket, Save, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface CampaignFormData {
  title: string;
  description: string;
  prizeDescription: string;
  prizeImageUrl: string;
  ticketPrice: string;
  totalTickets: string;
  startDate: string;
  endDate: string;
}

const CreateCampaignPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CampaignFormData>({
    title: '',
    description: '',
    prizeDescription: '',
    prizeImageUrl: '',
    ticketPrice: '',
    totalTickets: '',
    startDate: '',
    endDate: ''
  });

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  const handleInputChange = (field: keyof CampaignFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.title.trim()) return 'Título é obrigatório';
    if (!formData.prizeDescription.trim()) return 'Descrição do prêmio é obrigatória';
    if (!formData.ticketPrice || parseFloat(formData.ticketPrice) <= 0) return 'Preço do bilhete deve ser maior que zero';
    if (!formData.totalTickets || parseInt(formData.totalTickets) <= 0) return 'Número de bilhetes deve ser maior que zero';
    if (!formData.startDate) return 'Data de início é obrigatória';
    if (!formData.endDate) return 'Data de fim é obrigatória';
    
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const now = new Date();
    
    if (startDate < now) return 'Data de início deve ser no futuro';
    if (endDate <= startDate) return 'Data de fim deve ser posterior à data de início';
    
    return null;
  };

  const handleSaveDraft = async () => {
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    if (!user) {
      alert('Usuário não autenticado');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('campaigns')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description || null,
          prize_description: formData.prizeDescription,
          prize_image_url: formData.prizeImageUrl || null,
          ticket_price: parseFloat(formData.ticketPrice),
          total_tickets: parseInt(formData.totalTickets),
          start_date: formData.startDate,
          end_date: formData.endDate,
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
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    if (!user) {
      alert('Usuário não autenticado');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('campaigns')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description || null,
          prize_description: formData.prizeDescription,
          prize_image_url: formData.prizeImageUrl || null,
          ticket_price: parseFloat(formData.ticketPrice),
          total_tickets: parseInt(formData.totalTickets),
          start_date: formData.startDate,
          end_date: formData.endDate,
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

  // Calculate potential revenue
  const potentialRevenue = formData.ticketPrice && formData.totalTickets 
    ? (parseFloat(formData.ticketPrice) * parseInt(formData.totalTickets)).toFixed(2)
    : '0.00';

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
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Criar Nova Campanha
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Configure sua rifa e comece a vender bilhetes
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSaveDraft}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>Salvar Rascunho</span>
          </button>
          <button
            onClick={handlePublish}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
          >
            <Eye className="h-4 w-4" />
            <span>Publicar</span>
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Informações Básicas
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Título da Campanha *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ex: Rifa do iPhone 15 Pro Max"
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descrição (Opcional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Descreva sua campanha, regras, como será o sorteio..."
                    rows={4}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Prize Information */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Informações do Prêmio
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descrição do Prêmio *
                  </label>
                  <textarea
                    value={formData.prizeDescription}
                    onChange={(e) => handleInputChange('prizeDescription', e.target.value)}
                    placeholder="Descreva detalhadamente o prêmio: modelo, cor, especificações..."
                    rows={3}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    URL da Imagem do Prêmio (Opcional)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      value={formData.prizeImageUrl}
                      onChange={(e) => handleInputChange('prizeImageUrl', e.target.value)}
                      placeholder="https://exemplo.com/imagem-do-premio.jpg"
                      className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                    />
                    <button className="px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200">
                      <Upload className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign Settings */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Configurações da Campanha
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preço por Bilhete (R$) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.ticketPrice}
                      onChange={(e) => handleInputChange('ticketPrice', e.target.value)}
                      placeholder="50.00"
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Total de Bilhetes *
                  </label>
                  <div className="relative">
                    <Ticket className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      min="1"
                      value={formData.totalTickets}
                      onChange={(e) => handleInputChange('totalTickets', e.target.value)}
                      placeholder="1000"
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data de Início *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data de Fim *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Preview & Stats */}
          <div className="space-y-6">
            {/* Campaign Preview */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Prévia da Campanha
              </h3>
              
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                {formData.prizeImageUrl && (
                  <img
                    src={formData.prizeImageUrl}
                    alt="Prêmio"
                    className="w-full h-32 object-cover rounded-lg mb-3"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {formData.title || 'Título da Campanha'}
                </h4>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {formData.prizeDescription || 'Descrição do prêmio aparecerá aqui...'}
                </p>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Preço:</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    R$ {formData.ticketPrice || '0,00'}
                  </span>
                </div>
              </div>
            </div>

            {/* Campaign Stats */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Estatísticas
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Total de Bilhetes:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formData.totalTickets || '0'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Preço por Bilhete:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    R$ {formData.ticketPrice || '0,00'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Receita Potencial:</span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    R$ {potentialRevenue}
                  </span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                💡 Dicas para o Sucesso
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Use imagens de alta qualidade do prêmio</li>
                <li>• Seja claro nas regras e descrições</li>
                <li>• Configure métodos de pagamento antes de publicar</li>
                <li>• Promova nas suas redes sociais</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaignPage;