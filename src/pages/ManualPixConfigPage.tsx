import React, { useState } from 'react';
import { ArrowLeft, AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ManualPixConfigPage = () => {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [keyType, setKeyType] = useState('CPF');
  const [pixKey, setPixKey] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  const handleGoBack = () => {
    navigate('/dashboard/integrations');
  };

  const handleSavePix = () => {
    // Handle saving PIX configuration
    console.log('Saving PIX configuration:', {
      isActive,
      keyType,
      pixKey,
      accountHolder
    });
    // Navigate back to integrations page after saving
    navigate('/dashboard/integrations');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleGoBack}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-white">
              Baixa Manual
            </h1>
            <p className="text-gray-400 text-sm">
              Receba diretamente em sua conta porém é necessário fazer a baixa manual das compras
            </p>
          </div>
        </div>
        <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
          Configurar
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto p-6">
        {/* PIX Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="text-2xl font-bold text-teal-400">pix</div>
            </div>
          </div>

          {/* Alert */}
          <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4 mb-6 flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-blue-300 text-sm">
                <span className="font-semibold">Atenção</span>
              </p>
              <p className="text-blue-200 text-sm">
                Pedidos com este meio de pagamento NÃO liberam automaticamente, você terá que aprovar as compras manualmente.
              </p>
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-white font-medium">Ativo</span>
            <button
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                isActive ? 'bg-purple-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Key Type */}
          <div className="mb-6">
            <label className="block text-white font-medium mb-3">
              Tipo de chave
            </label>
            <div className="relative">
              <select
                value={keyType}
                onChange={(e) => setKeyType(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
              >
                <option value="CPF">CPF</option>
                <option value="CNPJ">CNPJ</option>
                <option value="Email">Email</option>
                <option value="Telefone">Telefone</option>
                <option value="Chave Aleatória">Chave Aleatória</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* PIX Key */}
          <div className="mb-6">
            <label className="block text-white font-medium mb-3">
              Chave pix
            </label>
            <input
              type="text"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="Digite sua chave PIX"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Account Holder */}
          <div className="mb-8">
            <label className="block text-white font-medium mb-3">
              Titular da conta
            </label>
            <input
              type="text"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              placeholder="Nome completo do titular"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSavePix}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <span>Salvar pix</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualPixConfigPage;