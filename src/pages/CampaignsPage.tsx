import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  LayoutGrid,
  Trophy,
  Tag,
  Globe,
  Settings,
  BarChart3
} from 'lucide-react';

const CampaignsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const campaigns = [
    {
      id: 1,
      title: 'iPhone 15 Pro Max',
      status: 'Ativa',
      ticketPrice: 50,
      totalTickets: 1000,
      soldTickets: 750,
      revenue: 37500,
      endDate: '2024-02-15',
      image: '/api/placeholder/80/80',
      winningTickets: [123, 456, 789],
      topBuyers: [
        { name: 'João Silva', tickets: 25 },
        { name: 'Maria Santos', tickets: 18 },
        { name: 'Pedro Costa', tickets: 15 }
      ]
    },
    {
      id: 2,
      title: 'Notebook Gamer',
      status: 'Pendente',
      ticketPrice: 25,
      totalTickets: 500,
      soldTickets: 0,
      revenue: 0,
      endDate: '2024-02-20',
      image: '/api/placeholder/80/80',
      winningTickets: [],
      topBuyers: []
    },
    {
      id: 3,
      title: 'Smart TV 65"',
      status: 'Finalizada',
      ticketPrice: 30,
      totalTickets: 800,
      soldTickets: 800,
      revenue: 24000,
      endDate: '2024-01-30',
      image: '/api/placeholder/80/80',
      winningTickets: [100, 250, 500],
      topBuyers: [
        { name: 'Ana Lima', tickets: 30 },
        { name: 'Carlos Mendes', tickets: 22 },
        { name: 'Lucia Ferreira', tickets: 20 }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativa':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Pendente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Finalizada':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = campaigns.reduce((sum, campaign) => sum + campaign.revenue, 0);
  const totalTicketsSold = campaigns.reduce((sum, campaign) => sum + campaign.soldTickets, 0);
  const activeCampaigns = campaigns.filter(c => c.status === 'Ativa').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Campanhas</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie todas as suas rifas em um só lugar</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors duration-200"
        >
          <Plus className="h-5 w-5" />
          <span>Nova Campanha</span>
        </button>
      </div>

      {/* Metrics Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total de Campanhas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{campaigns.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <LayoutGrid className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Campanhas Ativas</p>
              <p className="text-2xl font-bold text-green-600">{activeCampaigns}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Arrecadado</p>
              <p className="text-2xl font-bold text-blue-600">R$ {totalRevenue.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Bilhetes Vendidos</p>
              <p className="text-2xl font-bold text-orange-600">{totalTicketsSold.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Buscar campanhas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
          />
        </div>
        <button className="flex items-center space-x-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200">
          <Filter className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <span className="text-gray-700 dark:text-gray-300">Filtros</span>
        </button>
      </div>

      {/* Campaigns List */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-white">Campanha</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-white">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-white">Progresso</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-white">Arrecadado</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-white">Data Final</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCampaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500 dark:text-gray-400 text-xs">IMG</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{campaign.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">R$ {campaign.ticketPrice}/bilhete</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{campaign.soldTickets}/{campaign.totalTickets}</span>
                        <span className="text-gray-600 dark:text-gray-400">{Math.round((campaign.soldTickets / campaign.totalTickets) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(campaign.soldTickets / campaign.totalTickets) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 dark:text-white">R$ {campaign.revenue.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">{new Date(campaign.endDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaign Features Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Winning Tickets */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
              Bilhetes Premiados
            </h3>
            <button className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors duration-200">
              <Settings className="h-5 w-5" />
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Configure bilhetes especiais com prêmios extras</p>
          <div className="space-y-3">
            {campaigns.filter(c => c.winningTickets.length > 0).map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{campaign.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Bilhetes: {campaign.winningTickets.join(', ')}
                  </p>
                </div>
                <Trophy className="h-5 w-5 text-yellow-500" />
              </div>
            ))}
          </div>
        </div>

        {/* Top Buyers Ranking */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <BarChart3 className="h-5 w-5 text-blue-500 mr-2" />
              Ranking de Participantes
            </h3>
            <button className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors duration-200">
              <Eye className="h-5 w-5" />
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Maiores compradores das suas campanhas</p>
          <div className="space-y-3">
            {campaigns[0].topBuyers.map((buyer, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">{buyer.name}</p>
                </div>
                <span className="text-blue-600 dark:text-blue-400 font-semibold">{buyer.tickets} bilhetes</span>
              </div>
            ))}
          </div>
        </div>

        {/* Promotions & Coupons */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Tag className="h-5 w-5 text-green-500 mr-2" />
              Promoções e Cupons
            </h3>
            <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200">
              Criar Cupom
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Crie cupons de desconto e promoções especiais</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">DESCONTO10</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">10% de desconto - 25 usos restantes</p>
              </div>
              <span className="text-green-600 dark:text-green-400 text-sm font-medium">Ativo</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">PROMO50</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">R$ 5 de desconto - Expirado</p>
              </div>
              <span className="text-gray-500 dark:text-gray-400 text-sm">Inativo</span>
            </div>
          </div>
        </div>

        {/* Custom Domain */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Globe className="h-5 w-5 text-purple-500 mr-2" />
              Domínio Próprio
            </h3>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200">
              Configurar
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Use seu próprio domínio para suas campanhas</p>
          <div className="space-y-3">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="font-medium text-gray-900 dark:text-white">minhasrifas.com.br</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Domínio configurado e ativo</p>
            </div>
            <div className="p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Adicionar novo domínio</p>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredCampaigns.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhuma campanha encontrada</h3>
          <p className="text-gray-600 dark:text-gray-400">Tente ajustar os filtros ou criar uma nova campanha.</p>
        </div>
      )}
    </div>
  );
};

export default CampaignsPage;