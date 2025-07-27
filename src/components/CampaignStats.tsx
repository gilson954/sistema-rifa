import React from 'react';
import { TrendingUp, Users, DollarSign, Calendar, Target, Award } from 'lucide-react';

interface CampaignStatsProps {
  campaign: {
    total_tickets: number;
    sold_tickets: number;
    ticket_price: number;
    created_at: string;
    status: string;
  };
}

const CampaignStats: React.FC<CampaignStatsProps> = ({ campaign }) => {
  const soldPercentage = (campaign.sold_tickets / campaign.total_tickets) * 100;
  const totalRevenue = campaign.sold_tickets * campaign.ticket_price;
  const estimatedRevenue = campaign.total_tickets * campaign.ticket_price;
  const remainingTickets = campaign.total_tickets - campaign.sold_tickets;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const stats = [
    {
      icon: Users,
      label: 'Cotas Vendidas',
      value: `${campaign.sold_tickets}/${campaign.total_tickets}`,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      icon: Target,
      label: 'Progresso',
      value: `${soldPercentage.toFixed(1)}%`,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    },
    {
      icon: DollarSign,
      label: 'Arrecadado',
      value: formatCurrency(totalRevenue),
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30'
    },
    {
      icon: TrendingUp,
      label: 'Meta Total',
      value: formatCurrency(estimatedRevenue),
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30'
    },
    {
      icon: Award,
      label: 'Restantes',
      value: remainingTickets.toLocaleString('pt-BR'),
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30'
    },
    {
      icon: Calendar,
      label: 'Criada em',
      value: formatDate(campaign.created_at),
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-900/30'
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-800 transition-colors duration-300">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
        📊 Estatísticas da Campanha
      </h2>
      
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progresso de Vendas</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{soldPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(soldPercentage, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="text-center">
              <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                <IconComponent className={`h-6 w-6 ${stat.color}`} />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Status Badge */}
      <div className="mt-6 text-center">
        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
          campaign.status === 'active' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            : campaign.status === 'draft'
            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
        }`}>
          {campaign.status === 'active' ? '🟢 Campanha Ativa' : 
           campaign.status === 'draft' ? '🟡 Rascunho' : 
           '⚪ Inativa'}
        </span>
      </div>
    </div>
  );
};

export default CampaignStats;