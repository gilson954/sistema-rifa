import React from 'react';
import { Trophy, Calendar, Gift, ExternalLink } from 'lucide-react';

interface Winner {
  id: string;
  campaignTitle: string;
  winnerName: string;
  prize: string;
  drawDate: string;
  ticketNumber: number;
  campaignId: string;
}

const RecentWinners: React.FC = () => {
  // Mock data - em produção viria do banco de dados
  const recentWinners: Winner[] = [
    {
      id: '1',
      campaignTitle: 'iPhone 15 Pro Max',
      winnerName: 'João Silva',
      prize: 'iPhone 15 Pro Max 256GB',
      drawDate: '2024-01-15',
      ticketNumber: 1247,
      campaignId: 'camp-1'
    },
    {
      id: '2',
      campaignTitle: 'Notebook Gamer',
      winnerName: 'Maria Santos',
      prize: 'Notebook Gamer RTX 4060',
      drawDate: '2024-01-10',
      ticketNumber: 856,
      campaignId: 'camp-2'
    },
    {
      id: '3',
      campaignTitle: 'Setup Completo',
      winnerName: 'Pedro Costa',
      prize: 'Setup Gamer Completo',
      drawDate: '2024-01-05',
      ticketNumber: 2341,
      campaignId: 'camp-3'
    }
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-800 transition-colors duration-300">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
          <Trophy className="h-6 w-6 text-yellow-500 mr-2" />
          Ganhadores Recentes
        </h2>
        <button className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium flex items-center">
          Ver todos
          <ExternalLink className="h-4 w-4 ml-1" />
        </button>
      </div>

      <div className="space-y-4">
        {recentWinners.map((winner, index) => (
          <div
            key={winner.id}
            className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-4 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start space-x-4">
              {/* Position Badge */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                index === 0 ? 'bg-yellow-500 text-white' :
                index === 1 ? 'bg-gray-400 text-white' :
                index === 2 ? 'bg-orange-600 text-white' :
                'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
              }`}>
                {index + 1}
              </div>

              {/* Winner Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {winner.winnerName}
                  </h3>
                  <span className="text-xs bg-yellow-500 text-white px-2 py-1 rounded-full">
                    GANHADOR
                  </span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <Gift className="h-4 w-4" />
                  <span className="truncate">{winner.prize}</span>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(winner.drawDate)}</span>
                  </div>
                  <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                    Nº {winner.ticketNumber.toString().padStart(4, '0')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Call to Action */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Você pode ser o próximo ganhador!
        </p>
        <button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200 shadow-md">
          Participar Agora
        </button>
      </div>
    </div>
  );
};

export default RecentWinners;