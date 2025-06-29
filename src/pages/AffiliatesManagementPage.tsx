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
    fixedCommissionValue: 0 // Changed to number
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
      fixedCommissionValue: 0
    });
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setNewAffiliate({
      email: '',
      commissionType: 'percentage',
      commissionValue: 10,
      fixedCommissionValue: 0
    });
  };

  const handleCommissionChange = (value: number) => {
    setNewAffiliate({ ...newAffiliate, commissionValue: value });
  };

  // Enhanced currency formatting function using Intl.NumberFormat
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const handleFixedAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Remove all non-numeric characters except comma and period
    let cleanValue = inputValue.replace(/[^\d,.-]/g, '');
    
    // Replace comma with period for proper parsing
    cleanValue = cleanValue.replace(',', '.');
    
    // Parse the cleaned value as a float
    const numericValue = parseFloat(cleanValue) || 0;
    
    // Update the state with the numeric value
    setNewAffiliate({ ...newAffiliate, fixedCommissionValue: numericValue });
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
                  Endereço de e-mail do afiliado <span className="text-blue-500">?</span>
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
                  Comissão <span className="text-blue-500">?</span>
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
                      value={formatCurrency(newAffiliate.fixedCommissionValue)}
                      onChange={handleFixedAmountChange}
                      placeholder="R$ 0,00"
                      className="w-full bg-white dark:bg-gray-700 border border-purple-500 rounded-lg px-4 py-3 text-purple-600 dark:text-purple-400 placeholder-purple-400 dark:placeholder-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                    />
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleSaveAffiliate}
              disabled={!newAffiliate.email.trim()}
              className="w-full bg-gray-400 hover:bg-gray-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 mt-6"
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