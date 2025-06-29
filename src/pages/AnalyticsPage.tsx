import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  Filter,
  Download,
  Eye
} from 'lucide-react';

const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState('7d');

  const stats = [
    {
      title: 'Receita Total',
      value: 'R$ 61.500',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Bilhetes Vendidos',
      value: '1.550',
      change: '+8.2%',
      trend: 'up',
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Taxa de Conversão',
      value: '11.2%',
      change: '+2.1%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Visualizações',
      value: '13.8K',
      change: '-3.2%',
      trend: 'down',
      icon: Eye,
      color: 'text-orange-600 dark:text-orange-400'
    }
  ];

  const campaignPerformance = [
    {
      name: 'iPhone 15 Pro Max',
      revenue: 37500,
      tickets: 750,
      conversion: 15.2,
      views: 8500
    },
    {
      name: 'Smart TV 65"',
      revenue: 24000,
      tickets: 800,
      conversion: 12.8,
      views: 5300
    },
    {
      name: 'Notebook Gamer',
      revenue: 0,
      tickets: 0,
      conversion: 0,
      views: 0
    }
  ];

  const timeRanges = [
    { value: '7d', label: 'Últimos 7 dias' },
    { value: '30d', label: 'Últimos 30 dias' },
    { value: '90d', label: 'Últimos 90 dias' },
    { value: '1y', label: 'Último ano' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">Acompanhe o desempenho das suas campanhas</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors duration-300"
          >
            {timeRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200">
            <Download className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="text-gray-700 dark:text-gray-300">Exportar</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className={`h-4 w-4 mr-1 ${
                      stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                    } ${stat.trend === 'down' ? 'rotate-180' : ''}`} />
                    <span className={`text-sm font-medium ${
                      stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  stat.color.includes('green') ? 'bg-green-100 dark:bg-green-900/30' :
                  stat.color.includes('blue') ? 'bg-blue-100 dark:bg-blue-900/30' :
                  stat.color.includes('purple') ? 'bg-purple-100 dark:bg-purple-900/30' :
                  'bg-orange-100 dark:bg-orange-900/30'
                }`}>
                  <IconComponent className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Receita por Dia</h3>
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200">
              <Filter className="h-5 w-5" />
            </button>
          </div>
          
          {/* Placeholder Chart */}
          <div className="h-64 bg-gradient-to-t from-purple-50 to-transparent dark:from-purple-900/20 rounded-lg flex items-end justify-center space-x-2 p-4">
            {[40, 65, 45, 80, 55, 70, 85].map((height, index) => (
              <div
                key={index}
                className="bg-gradient-to-t from-purple-600 to-purple-400 rounded-t"
                style={{ height: `${height}%`, width: '20px' }}
              />
            ))}
          </div>
          
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-4">
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
            <span>Dom</span>
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Fontes de Tráfego</h3>
          
          <div className="space-y-4">
            {[
              { source: 'Instagram', percentage: 45, color: 'bg-pink-500' },
              { source: 'WhatsApp', percentage: 30, color: 'bg-green-500' },
              { source: 'Facebook', percentage: 15, color: 'bg-blue-500' },
              { source: 'Direto', percentage: 10, color: 'bg-gray-500' }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="text-gray-900 dark:text-white font-medium">{item.source}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-gray-600 dark:text-gray-400 text-sm w-8">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Campaign Performance Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors duration-300">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance por Campanha</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-white">Campanha</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-white">Receita</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-white">Bilhetes</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-white">Conversão</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-white">Visualizações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {campaignPerformance.map((campaign, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 dark:text-white">{campaign.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 dark:text-white">
                      R$ {campaign.revenue.toLocaleString()}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-900 dark:text-white">{campaign.tickets}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-900 dark:text-white">{campaign.conversion}%</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-900 dark:text-white">{campaign.views.toLocaleString()}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;