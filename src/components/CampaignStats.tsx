import React from 'react';
import { Users, DollarSign, Clock, Trophy } from 'lucide-react';

interface CampaignStatsProps {
  totalTickets: number;
  soldTickets: number;
  ticketPrice: number;
  status: string;
  endDate?: string;
}

const CampaignStats: React.FC<CampaignStatsProps> = ({
  totalTickets,
  soldTickets,
  ticketPrice,
  status,
  endDate
}) => {
  const availableTickets = totalTickets - soldTickets;
  const totalRevenue = soldTickets * ticketPrice;
  const progressPercentage = (soldTickets / totalTickets) * 100;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = () => {
    if (!endDate) return null;
    
    const now = new Date().getTime();
    const end = new Date(endDate).getTime();
    const difference = end - now;

    if (difference <= 0) return 'Encerrado';

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days}d ${hours}h restantes`;
    } else {
      return `${hours}h restantes`;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 transition-colors duration-300 mb-8">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
        📊 Estatísticas da Campanha
      </h2>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progresso da Campanha
          </span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {progressPercentage.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tickets */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalTickets.toLocaleString('pt-BR')}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Total de Cotas
          </div>
        </div>

        {/* Sold Tickets */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Trophy className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {soldTickets.toLocaleString('pt-BR')}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Vendidas
          </div>
        </div>

        {/* Available Tickets */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {availableTickets.toLocaleString('pt-BR')}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Disponíveis
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
            <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Arrecadado
          </div>
        </div>
      </div>

      {/* Time Remaining */}
      {endDate && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-blue-800 dark:text-blue-200 font-medium">
              {getTimeRemaining()}
            </span>
          </div>
          {endDate && (
            <div className="text-center text-sm text-blue-600 dark:text-blue-400 mt-1">
              Encerra em: {formatDate(endDate)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CampaignStats;