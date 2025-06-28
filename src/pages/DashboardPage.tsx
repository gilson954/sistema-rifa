import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart3, 
  Plus, 
  Settings, 
  Users, 
  DollarSign, 
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal
} from 'lucide-react';

const DashboardPage = () => {
  const { profile, logout } = useAuth();

  const campaigns = [
    {
      id: 1,
      title: 'Rifa do iPhone 15 Pro',
      price: 50,
      totalTickets: 1000,
      soldTickets: 750,
      revenue: 37500,
      status: 'active',
      endDate: '2024-02-15'
    },
    {
      id: 2,
      title: 'Rifa da Moto Honda CB 600F',
      price: 25,
      totalTickets: 2000,
      soldTickets: 1200,
      revenue: 30000,
      status: 'active',
      endDate: '2024-02-20'
    },
    {
      id: 3,
      title: 'Rifa do Notebook Gamer',
      price: 15,
      totalTickets: 500,
      soldTickets: 500,
      revenue: 7500,
      status: 'completed',
      endDate: '2024-01-30'
    }
  ];

  const stats = [
    {
      title: 'Receita Total',
      value: 'R$ 75.000',
      change: '+12%',
      icon: DollarSign,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Campanhas Ativas',
      value: '2',
      change: '+1',
      icon: BarChart3,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Bilhetes Vendidos',
      value: '2.450',
      change: '+18%',
      icon: Users,
      color: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Taxa de Conversão',
      value: '68%',
      change: '+5%',
      icon: TrendingUp,
      color: 'text-orange-600 dark:text-orange-400'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'completed':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
      case 'paused':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativa';
      case 'completed':
        return 'Finalizada';
      case 'paused':
        return 'Pausada';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-16 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                Olá, {profile?.name || 'Usuário'}! 👋
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1 transition-colors duration-300">
                Gerencie suas rifas e acompanhe seus resultados
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Nova Rifa
              </button>
              <button 
                onClick={logout}
                className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors duration-200 font-medium flex items-center"
              >
                <Settings className="h-5 w-5 mr-2" />
                Configurações
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors duration-300">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2 transition-colors duration-300">
                      {stat.value}
                    </p>
                    <p className={`text-sm font-medium mt-1 ${stat.color}`}>
                      {stat.change} este mês
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color.replace('text-', 'bg-').replace('dark:text-', 'dark:bg-').replace('-600', '-100').replace('-400', '-900/30')}`}>
                    <IconComponent className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Campaigns Table */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm transition-colors duration-300">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-300">
              Suas Campanhas
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Campanha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Progresso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Receita
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {campaigns.map((campaign) => {
                  const progress = (campaign.soldTickets / campaign.totalTickets) * 100;
                  return (
                    <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300">
                            {campaign.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                            R$ {campaign.price} por bilhete
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
                              {campaign.soldTickets}/{campaign.totalTickets}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
                              {Math.round(progress)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300">
                          R$ {campaign.revenue.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                          {getStatusText(campaign.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button className="text-gray-400 dark:text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200">
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;