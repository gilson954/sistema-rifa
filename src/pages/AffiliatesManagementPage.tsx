import React, { useState } from 'react';
import { ArrowLeft, Search, Plus, UserPlus, X, ArrowRight, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AffiliatesManagementPage = () => {
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newAffiliate, setNewAffiliate] = useState({
    email: '',
    commissionType: 'percentage', // 'percentage' or 'fixed'
    commissionValue: 10,
    fixedCommissionValue: 'R$ 0,00'
  });

  const handleGoBack = () => {
    navigate('/dashboard/affiliations');
  };

  const handleAddAffiliate = () => {
    setShowAddModal(true);
  };

  const handleSaveAffiliate = () => {
    // Handle saving new affiliate
    console.log('Saving affiliate:', newAffiliate);
    setShowAddModal(false);
    setNewAffiliate({
      email: '',
      commissionType: 'percentage',
      commissionValue: 10,
      fixedCommissionValue: 'R$ 0,00'
    });
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setNewAffiliate({
      email: '',
      commissionType: 'percentage',
      commissionValue: 10,
      fixedCommissionValue: 'R$ 0,00'
    });
  };

  const handleCommissionChange = (value: number) => {
    setNewAffiliate({ ...newAffiliate, commissionValue: value });
  };

  // Currency formatting function
  const formatCurrency = (value: string) => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    
    // If empty, return default
    if (!numericValue) {
      return 'R$ 0,00';
    }
    
    // Convert to number (treating as cents)
    const cents = parseInt(numericValue, 10);
    
    // Convert cents to reais
    const reais = cents / 100;
    
    // Format as Brazilian currency
    return `R$ ${reais.toFixed(2).replace('.', ',')}`;
  };

  const handleFixedAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formattedValue = formatCurrency(inputValue);
    setNewAffiliate({ ...newAffiliate, fixedCommissionValue: formattedValue });
  };

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg border border-gray-200 dark:border-gray-800 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleGoBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Meus afiliados
          </h1>
        </div>
      </div>

      {/* Search and Add Section */}
      <div className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por afiliado, comissão ou data"
              className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
            />
          </div>

          {/* Filter Button */}
          <button className="px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2">
            <div className="w-4 h-4 border border-gray-400 dark:border-gray-500"></div>
          </button>

          {/* Add Affiliate Button */}
          <button
            onClick={handleAddAffiliate}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Adicionar</span>
          </button>
        </div>

        {/* Empty State */}
        <div className="text-center py-16">
          <div className="text-6xl mb-4">:(</div>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Você ainda não adicionou nenhum afiliado!
          </p>
        </div>
      </div>

      {/* Add Affiliate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Adicionar afiliado
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Endereço de e-mail do afiliado{' '}
                  <span 
                    className="inline-flex items-center justify-center w-4 h-4 bg-blue-500 text-white text-xs rounded-full font-bold cursor-help relative group"
                    title="O afiliado precisa ter uma conta no Rifaqui"
                  >
                    ?
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      O afiliado precisa ter uma conta no Rifaqui
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
                    </div>
                  </span>
                </label>
                <input
                  type="email"
                  value={newAffiliate.email}
                  onChange={(e) => setNewAffiliate({ ...newAffiliate, email: e.target.value })}
                  placeholder="Digite o e-mail"
                  className={`w-full bg-white dark:bg-gray-700 border rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 ${
                    !newAffiliate.email.trim() ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {!newAffiliate.email.trim() && (
                  <p className="text-red-500 text-xs mt-1">Este é um campo obrigatório!</p>
                )}
              </div>

              {/* Commission Type */}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Comissão{' '}
                  <span 
                    className="inline-flex items-center justify-center w-4 h-4 bg-blue-500 text-white text-xs rounded-full font-bold cursor-help relative group"
                    title="Tipo da comissão que o afiliado irá receber por cada venda"
                  >
                    ?
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      Tipo da comissão que o afiliado irá receber por cada venda
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
                    </div>
                  </span>
                </label>

                {/* Percentage Option */}
                <div 
                  onClick={() => setNewAffiliate({ ...newAffiliate, commissionType: 'percentage' })}
                  className={`border rounded-lg p-4 mb-3 cursor-pointer transition-colors duration-200 ${
                    newAffiliate.commissionType === 'percentage' 
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="text-purple-500 text-xl">%</div>
                      <span className="font-medium text-gray-900 dark:text-white">Porcentagem</span>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      newAffiliate.commissionType === 'percentage' 
                        ? 'border-purple-500 bg-purple-500' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {newAffiliate.commissionType === 'percentage' && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Porcentagem em cima do total da venda
                  </p>
                </div>

                {/* Fixed Amount Option */}
                <div 
                  onClick={() => setNewAffiliate({ ...newAffiliate, commissionType: 'fixed' })}
                  className={`border rounded-lg p-4 mb-4 cursor-pointer transition-colors duration-200 ${
                    newAffiliate.commissionType === 'fixed' 
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="text-gray-600 dark:text-gray-400 text-xl">$</div>
                      <span className="font-medium text-gray-900 dark:text-white">Dinheiro fixo</span>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      newAffiliate.commissionType === 'fixed' 
                        ? 'border-purple-500 bg-purple-500' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {newAffiliate.commissionType === 'fixed' && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Dinheiro fixo por venda, independente da quantidade
                  </p>
                </div>

                {/* Percentage Slider */}
                {newAffiliate.commissionType === 'percentage' && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">0%</span>
                      <span className="font-medium text-gray-900 dark:text-white">{newAffiliate.commissionValue}%</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">100%</span>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={newAffiliate.commissionValue}
                        onChange={(e) => handleCommissionChange(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${newAffiliate.commissionValue}%, #e5e7eb ${newAffiliate.commissionValue}%, #e5e7eb 100%)`
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Fixed Amount Input */}
                {newAffiliate.commissionType === 'fixed' && (
                  <div className="mb-4">
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Valor
                    </label>
                    <input
                      type="text"
                      value={newAffiliate.fixedCommissionValue}
                      onChange={handleFixedAmountChange}
                      placeholder="R$ 0,00"
                      className="w-full bg-white dark:bg-gray-700 border border-green-500 rounded-lg px-4 py-3 text-green-600 dark:text-green-400 placeholder-green-400 dark:placeholder-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                    />
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleSaveAffiliate}
              disabled={!newAffiliate.email.trim()}
              className={`w-full py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 mt-6 ${
                newAffiliate.email.trim()
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-gray-400 cursor-not-allowed text-white'
              }`}
            >
              <span>Enviar convite</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <style jsx>{`
              .slider::-webkit-slider-thumb {
                appearance: none;
                height: 20px;
                width: 20px;
                border-radius: 50%;
                background: #8b5cf6;
                cursor: pointer;
                border: 2px solid #ffffff;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
              }
              
              .slider::-moz-range-thumb {
                height: 20px;
                width: 20px;
                border-radius: 50%;
                background: #8b5cf6;
                cursor: pointer;
                border: 2px solid #ffffff;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
};

export default AffiliatesManagementPage;