import React, { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  Plus, 
  Share2,
  Play
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const [showRevenue, setShowRevenue] = useState(false);
  const navigate = useNavigate();

  const handleConfigurePayment = () => {
    navigate('/dashboard/integrations');
  };

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-gray-800 transition-colors duration-300 min-h-[calc(100vh-200px)]">
      <div className="space-y-6">
        {/* Payment Setup Card */}
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 border border-purple-200 dark:border-purple-700/50 rounded-lg p-4 shadow-sm transition-colors duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center space-x-4 flex-1 min-w-0">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Share2 className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white transition-colors duration-300">
                  Forma de recebimento
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">
                  Você ainda não configurou uma forma para receber os pagamentos na sua conta
                </p>
              </div>
            </div>
            <button 
              onClick={handleConfigurePayment}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors duration-200 w-full sm:w-auto"
            >
              Configurar
            </button>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center space-x-4 flex-1 min-w-0">
              <div className="text-3xl sm:text-4xl font-bold text-purple-600 dark:text-purple-400 flex-shrink-0">$</div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white transition-colors duration-300">
                  Total arrecadado
                </h3>
                <div className="flex items-center space-x-2">
                  {showRevenue ? (
                    <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                      R$ 0,00
                    </span>
                  ) : (
                    <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                      ★★★★★★★★
                    </span>
                  )}
                  <button
                    onClick={() => setShowRevenue(!showRevenue)}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors duration-200"
                  >
                    {showRevenue ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Create Campaign Button */}
        <div className="flex justify-center">
          <button className="w-full sm:w-fit bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 sm:px-8 rounded-lg font-semibold text-lg flex items-center justify-center space-x-2 transition-colors duration-200 shadow-md">
            <Plus className="h-6 w-6" />
            <span>Criar campanha</span>
          </button>
        </div>

        {/* Video Tutorial Section */}
        <div className="w-full max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
              Aprenda a criar uma rifa
            </h2>
            <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300 text-sm sm:text-base">
              Criamos um vídeo explicando todos os passos para você criar sua campanha
            </p>
          </div>
          
          <div className="relative bg-gray-900 rounded-lg overflow-hidden shadow-lg group cursor-pointer">
            {/* Video Thumbnail */}
            <div className="aspect-video bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center relative">
              <div className="absolute inset-0 bg-black/20"></div>
              
              {/* Play Button */}
              <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 bg-white/90 rounded-full flex items-center justify-center group-hover:bg-white transition-colors duration-200">
                <Play className="h-6 w-6 sm:h-8 sm:w-8 text-gray-900 ml-1" fill="currentColor" />
              </div>
              
              {/* Video Title Overlay */}
              <div className="absolute bottom-4 left-4 right-4 z-10">
                <h3 className="text-white font-semibold text-sm sm:text-lg mb-1">Como criar uma rifa online</h3>
                <p className="text-white/80 text-xs sm:text-sm">Rifaqui • 5:32</p>
              </div>
              
              {/* YouTube-style elements */}
              <div className="absolute top-4 right-4 z-10">
                <div className="bg-black/60 text-white text-xs px-2 py-1 rounded">
                  HD
                </div>
              </div>
            </div>
            
            {/* Video Info */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/32132123.png" 
                    alt="Rifaqui" 
                    className="w-4 h-4 sm:w-6 sm:h-6 object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white transition-colors duration-300 text-sm sm:text-base">
                    Tutorial completo: Como criar sua primeira rifa
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-300">
                    Rifaqui • 12.5K visualizações • há 2 dias
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;