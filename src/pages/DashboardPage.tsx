import React, { useState } from 'react';
import { 
  Bell, 
  Sun, 
  Moon, 
  Eye, 
  EyeOff, 
  Plus, 
  Share2,
  Play
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const DashboardPage = () => {
  const { theme, toggleTheme } = useTheme();
  const [showRevenue, setShowRevenue] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-colors duration-300 mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
            🏠 Home - Dashboard
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors duration-200">
            <Bell className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-600 rounded-full"></span>
          </button>
          
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors duration-200"
          >
            {theme === 'light' ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
          </button>
          
          <div className="text-right">
            <p className="text-gray-900 dark:text-white font-medium transition-colors duration-300">
              {theme === 'light' ? 'Claro' : 'Escuro'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Payment Setup Card */}
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 border border-purple-200 dark:border-purple-700/50 rounded-lg p-4 shadow-sm transition-colors duration-300 h-20 flex items-center">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <Share2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white transition-colors duration-300">Forma de recebimento</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">Você ainda não configurou uma forma para receber os pagamentos na sua conta</p>
              </div>
            </div>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200">
              Configurar
            </button>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-300 h-20 flex items-center">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-4">
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">$</div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white transition-colors duration-300">Total arrecadado</h3>
                <div className="flex items-center space-x-2">
                  {showRevenue ? (
                    <span className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">R$ 0,00</span>
                  ) : (
                    <span className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">★★★★★★★★</span>
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
          <button className="w-fit bg-purple-600 hover:bg-purple-700 text-white py-3 px-8 rounded-lg font-semibold text-lg flex items-center space-x-2 transition-colors duration-200 shadow-md mx-auto">
            <Plus className="h-6 w-6" />
            <span>Criar campanha</span>
          </button>
        </div>

        {/* Video Tutorial Section */}
        <div className="max-w-[600px] mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
              Aprenda a criar uma rifa
            </h2>
            <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
              Criamos um vídeo explicando todos os passos para você criar sua campanha
            </p>
          </div>
          
          <div className="relative bg-gray-900 rounded-lg overflow-hidden shadow-lg group cursor-pointer">
            {/* Video Thumbnail */}
            <div className="aspect-video bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center relative">
              <div className="absolute inset-0 bg-black/20"></div>
              
              {/* Play Button */}
              <div className="relative z-10 w-20 h-20 bg-white/90 rounded-full flex items-center justify-center group-hover:bg-white transition-colors duration-200">
                <Play className="h-8 w-8 text-gray-900 ml-1" fill="currentColor" />
              </div>
              
              {/* Video Title Overlay */}
              <div className="absolute bottom-4 left-4 right-4 z-10">
                <h3 className="text-white font-semibold text-lg mb-1">Como criar uma rifa online</h3>
                <p className="text-white/80 text-sm">Rifaqui • 5:32</p>
              </div>
              
              {/* YouTube-style elements */}
              <div className="absolute top-4 right-4 z-10">
                <div className="bg-black/60 text-white text-xs px-2 py-1 rounded">
                  HD
                </div>
              </div>
            </div>
            
            {/* Video Info */}
            <div className="p-4 bg-white dark:bg-gray-800 transition-colors duration-300">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                  <img 
                    src="/32132123.png" 
                    alt="Rifaqui" 
                    className="w-6 h-6 object-contain"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white transition-colors duration-300">
                    Tutorial completo: Como criar sua primeira rifa
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-300">
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