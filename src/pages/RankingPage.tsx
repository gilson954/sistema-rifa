import React, { useState } from 'react';
import { ChevronDown, BarChart3 } from 'lucide-react';

const RankingPage = () => {
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('sem-filtro');

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300 min-h-[calc(100vh-176px)]">
      {/* Campaign Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Selecione uma campanha
        </label>
        <div className="relative">
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pr-10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-300"
          >
            <option value="">Escolha uma opção</option>
            <option value="rifa-iphone">Rifa do iPhone 15</option>
            <option value="rifa-notebook">Rifa do Notebook</option>
            <option value="rifa-carro">Rifa do Carro</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        </div>
        
        {/* Dados Button */}
        <div className="mt-4 flex justify-end">
          <button className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors duration-200">
            <BarChart3 className="h-4 w-4" />
            <span className="text-sm font-medium">Dados</span>
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          Filtro do ranking
        </h3>
        
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="ranking-filter"
              value="sem-filtro"
              checked={selectedFilter === 'sem-filtro'}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="w-4 h-4 text-green-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-green-500 dark:focus:ring-green-600 focus:ring-2"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Sem filtro
            </span>
          </label>
          
          <label className="flex items-center">
            <input
              type="radio"
              name="ranking-filter"
              value="ontem"
              checked={selectedFilter === 'ontem'}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="w-4 h-4 text-green-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-green-500 dark:focus:ring-green-600 focus:ring-2"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Ontem
            </span>
          </label>
          
          <label className="flex items-center">
            <input
              type="radio"
              name="ranking-filter"
              value="hoje"
              checked={selectedFilter === 'hoje'}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="w-4 h-4 text-green-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-green-500 dark:focus:ring-green-600 focus:ring-2"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Hoje
            </span>
          </label>
        </div>
      </div>

      {/* Content Area with Fixed Height */}
      <div className="min-h-[400px]">
        {/* Empty State */}
        {!selectedCampaign && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Selecione uma campanha
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Escolha uma campanha para visualizar o ranking dos compradores
            </p>
          </div>
        )}

        {/* Sample Ranking Data (when campaign is selected) */}
        {selectedCampaign && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Ranking de Compradores
            </h3>
            
            {/* Sample ranking items */}
            <div className="space-y-3">
              {[
                { position: 1, name: 'João Silva', tickets: 25, amount: 'R$ 1.250,00' },
                { position: 2, name: 'Maria Santos', tickets: 18, amount: 'R$ 900,00' },
                { position: 3, name: 'Pedro Costa', tickets: 15, amount: 'R$ 750,00' },
                { position: 4, name: 'Ana Oliveira', tickets: 12, amount: 'R$ 600,00' },
                { position: 5, name: 'Carlos Lima', tickets: 10, amount: 'R$ 500,00' }
              ].map((item) => (
                <div
                  key={item.position}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      item.position === 1 ? 'bg-yellow-500 text-white' :
                      item.position === 2 ? 'bg-gray-400 text-white' :
                      item.position === 3 ? 'bg-orange-600 text-white' :
                      'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}>
                      {item.position}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.tickets} bilhetes
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {item.amount}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RankingPage;