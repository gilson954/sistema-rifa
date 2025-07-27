import React from 'react';
import { Trophy, Calendar, User } from 'lucide-react';

interface Winner {
  id: string;
  name: string;
  prize: string;
  date: string;
  ticketNumber: string;
  campaignTitle: string;
}

interface RecentWinnersProps {
  winners?: Winner[];
}

const RecentWinners: React.FC<RecentWinnersProps> = ({ winners = [] }) => {
  // Mock data for demonstration
  const mockWinners: Winner[] = [
    {
      id: '1',
      name: 'João Silva',
      prize: 'iPhone 15 Pro Max',
      date: '2024-01-15',
      ticketNumber: '0157',
      campaignTitle: 'Rifa do iPhone'
    },
    {
      id: '2',
      name: 'Maria Santos',
      prize: 'Notebook Gamer',
      date: '2024-01-10',
      ticketNumber: '0892',
      campaignTitle: 'Rifa do Setup Gamer'
    },
    {
      id: '3',
      name: 'Pedro Costa',
      prize: 'R$ 5.000 em dinheiro',
      date: '2024-01-05',
      ticketNumber: '1234',
      campaignTitle: 'Rifa do Dinheiro'
    }
  ];

  const displayWinners = winners.length > 0 ? winners : mockWinners;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 transition-colors duration-300">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
        🏆 Ganhadores Recentes
      </h2>
      
      <div className="space-y-4">
        {displayWinners.map((winner, index) => (
          <div
            key={winner.id}
            className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            {/* Position Badge */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
              index === 0 ? 'bg-yellow-500' :
              index === 1 ? 'bg-gray-400' :
              index === 2 ? 'bg-orange-600' :
              'bg-purple-600'
            }`}>
              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏆'}
            </div>

            {/* Winner Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="font-semibold text-gray-900 dark:text-white truncate">
                  {winner.name}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                <Trophy className="h-3 w-3 inline mr-1" />
                {winner.prize}
              </div>
              
              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(winner.date)}</span>
                </div>
                <div>
                  Bilhete: <span className="font-mono font-bold">{winner.ticketNumber}</span>
                </div>
              </div>
            </div>

            {/* Campaign Badge */}
            <div className="text-right">
              <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-2 py-1 rounded text-xs font-medium">
                {winner.campaignTitle}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trust Message */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
        <div className="text-center">
          <Trophy className="h-6 w-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
          <p className="text-sm text-purple-800 dark:text-purple-200 font-medium">
            Todos os sorteios são realizados de forma transparente e pública
          </p>
        </div>
      </div>
    </div>
  );
};

export default RecentWinners;