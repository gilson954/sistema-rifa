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
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center space-x-4">
          <img 
            src="/32132123.png" 
            alt="Rifaqui Logo" 
            className="w-8 h-8 object-contain"
          />
          <h1 className="text-2xl font-bold text-white">
            👋 Olá, Gilson Rezende
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="relative p-2 text-gray-400 hover:text-white transition-colors duration-200">
            <Bell className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-600 rounded-full"></span>
          </button>
          
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-400 hover:text-white transition-colors duration-200"
          >
            {theme === 'light' ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Payment Setup Card */}
        <div className="bg-purple-900 border border-purple-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <Share2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Forma de recebimento</h3>
                <p className="text-gray-300">Você ainda não configurou uma forma para receber os pagamentos na sua conta</p>
              </div>
            </div>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200">
              Configurar
            </button>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-4xl font-bold text-purple-400">$</div>
              <div>
                <h3 className="text-lg font-semibold text-white">Total arrecadado</h3>
                <div className="flex items-center space-x-2">
                  {showRevenue ? (
                    <span className="text-2xl font-bold text-white">R$ 0,00</span>
                  ) : (
                    <span className="text-2xl font-bold text-white">★★★★★★★★</span>
                  )}
                  <button
                    onClick={() => setShowRevenue(!showRevenue)}
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {showRevenue ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Create Campaign Button */}
        <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl font-semibold text-lg flex items-center justify-center space-x-2 transition-colors duration-200">
          <Plus className="h-6 w-6" />
          <span>Criar campanha</span>
        </button>

        {/* Learn Section */}
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white mb-2">Aprenda a criar uma rifa</h2>
            <p className="text-gray-400">Criamos um vídeo explicando todos os passos para você criar sua campanha</p>
          </div>

          {/* Video Thumbnail */}
          <div className="relative bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-8 overflow-hidden">
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Play className="h-4 w-4 text-white ml-0.5" />
                  </div>
                  <span className="text-white font-medium">Como criar uma rifa online</span>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-4">
                  Como <span className="underline">criar</span> uma<br />
                  Rifa online
                </h3>
                
                <div className="flex items-center space-x-4">
                  <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2">
                    <Play className="h-4 w-4" />
                    <span>Assistir no</span>
                  </button>
                  <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
                    Compartilhar
                  </button>
                </div>
              </div>
              
              {/* Phone Mockup */}
              <div className="relative">
                <div className="w-32 h-56 bg-white rounded-2xl p-2 shadow-2xl">
                  <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-8 h-8 bg-white/30 rounded-lg mx-auto mb-2"></div>
                      <div className="w-16 h-2 bg-white/30 rounded mx-auto mb-1"></div>
                      <div className="w-12 h-2 bg-white/30 rounded mx-auto"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-4 w-16 h-16 border-2 border-white rounded-full"></div>
              <div className="absolute bottom-4 left-4 w-8 h-8 border-2 border-white rounded-full"></div>
              <div className="absolute top-1/2 left-8 w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;