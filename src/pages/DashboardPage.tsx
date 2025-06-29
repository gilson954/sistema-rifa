import React, { useState } from 'react';
import { 
  Bell, 
  Sun, 
  Moon, 
  Eye, 
  EyeOff, 
  Plus, 
  Camera,
  Clock,
  Share2,
  Settings
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const DashboardPage = () => {
  const { theme, toggleTheme } = useTheme();
  const [showRevenue, setShowRevenue] = useState(false);

  const campaigns = [
    {
      id: 1,
      title: 'Copo Grande 500ml',
      status: 'Pendente',
      timeLeft: 'Faça o pagamento em até 14 horas e 36 minutos ou ela vai expirar',
      image: null
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
            👋 Olá, Usuário Demo
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
      <div className="p-6 space-y-6">
        {/* Payment Setup Card */}
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 border border-purple-200 dark:border-purple-700/50 rounded-xl p-6 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <Share2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">Forma de recebimento</h3>
                <p className="text-gray-700 dark:text-gray-300 transition-colors duration-300">Você ainda não configurou uma forma para receber os pagamentos na sua conta</p>
              </div>
            </div>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200">
              Configurar
            </button>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">$</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">Total arrecadado</h3>
                <div className="flex items-center space-x-2">
                  {showRevenue ? (
                    <span className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">R$ 0,00</span>
                  ) : (
                    <span className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">★★★★★★★★</span>
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
        <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl font-semibold text-lg flex items-center justify-center space-x-2 transition-colors duration-200">
          <Plus className="h-6 w-6" />
          <span>Criar campanha</span>
        </button>

        {/* Campaigns List */}
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 transition-colors duration-300">
              <div className="flex items-start space-x-4">
                {/* Campaign Image Placeholder */}
                <div className="w-24 h-24 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center transition-colors duration-300">
                  <Camera className="h-8 w-8 text-gray-500 dark:text-gray-600" />
                </div>
                
                {/* Campaign Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">{campaign.title}</h3>
                      <div className="flex items-center space-x-2 mb-3">
                        <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-300 text-sm transition-colors duration-300">{campaign.timeLeft}</span>
                      </div>
                    </div>
                    
                    <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {campaign.status}
                    </span>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors duration-200">
                      <Share2 className="h-4 w-4" />
                      <span>Publicar</span>
                    </button>
                    <button className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors duration-200">
                      <Settings className="h-4 w-4" />
                      <span>Gerenciar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;