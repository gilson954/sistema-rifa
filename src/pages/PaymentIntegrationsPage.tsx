import React, { useState, useEffect } from 'react';
import { ArrowLeft, Info, CheckCircle, AlertTriangle, ArrowRight, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PaymentIntegrationsPage = () => {
  const navigate = useNavigate();
  const [showPixConfig, setShowPixConfig] = useState(false);
  const [pixConfig, setPixConfig] = useState({
    isActive: false,
    keyType: 'CPF',
    pixKey: '',
    accountHolder: ''
  });

  // Load PIX configuration from localStorage on component mount
  useEffect(() => {
    const savedPixConfig = localStorage.getItem('pixConfig');
    if (savedPixConfig) {
      try {
        const parsedConfig = JSON.parse(savedPixConfig);
        setPixConfig(parsedConfig);
      } catch (error) {
        console.error('Error parsing saved PIX config:', error);
      }
    }
  }, []);

  // Save PIX configuration to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('pixConfig', JSON.stringify(pixConfig));
    
    // Update payment configuration status
    const isPaymentConfigured = pixConfig.isActive && pixConfig.pixKey.trim() && pixConfig.accountHolder.trim();
    localStorage.setItem('isPaymentConfigured', JSON.stringify(isPaymentConfigured));
  }, [pixConfig]);

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  const handlePixConfig = () => {
    setShowPixConfig(!showPixConfig);
  };

  const handleSavePix = () => {
    // Validate required fields
    if (!pixConfig.pixKey.trim() || !pixConfig.accountHolder.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Handle saving PIX configuration
    console.log('Saving PIX configuration:', pixConfig);
    
    // Update payment configuration status
    const isPaymentConfigured = pixConfig.isActive && pixConfig.pixKey.trim() && pixConfig.accountHolder.trim();
    localStorage.setItem('isPaymentConfigured', JSON.stringify(isPaymentConfigured));
    
    setShowPixConfig(false);
    
    // Show success message
    alert('Configuração PIX salva com sucesso!');
  };

  const handleWhatsAppSupport = () => {
    window.open('https://wa.me/5562981127960', '_blank');
  };

  const paymentProviders = [
    {
      name: 'Fluxsis',
      logo: '/api/placeholder/120/40',
      status: 'inactive',
      recommended: true
    },
    {
      name: 'Pay2m',
      logo: '/api/placeholder/120/40',
      status: 'inactive'
    },
    {
      name: 'Paggue',
      logo: '/api/placeholder/120/40',
      status: 'inactive'
    },
    {
      name: 'Mercado Pago',
      logo: '/api/placeholder/120/40',
      status: 'inactive'
    },
    {
      name: 'Efí Bank',
      logo: '/api/placeholder/120/40',
      status: 'inactive'
    }
  ];

  // Check if PIX is configured and active
  const isPixConfigured = pixConfig.isActive && pixConfig.pixKey.trim() && pixConfig.accountHolder.trim();

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg border border-gray-200 dark:border-gray-800 transition-colors duration-300 min-h-[calc(100vh-176px)]">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleGoBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Integrações de pagamento
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Processing Order Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Ordem de processamento
            </h2>
            <Info className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Arraste os métodos de pagamento para definir a ordem de processamento.
          </p>
          
          {!isPixConfigured ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-yellow-800 dark:text-yellow-200">
                Nenhum método de pagamento ativo até o momento
              </span>
            </div>
          ) : (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-green-800 dark:text-green-200">
                PIX Manual configurado e ativo
              </span>
            </div>
          )}
        </div>

        {/* Automatic Download Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Baixa automática
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receba diretamente em sua conta e a baixa dos bilhetes é automática
              </p>
            </div>
            <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium">
              Recomendado
            </span>
          </div>

          <div className="space-y-4">
            {paymentProviders.map((provider, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between transition-colors duration-300"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-24 h-8 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {provider.name}
                    </span>
                  </div>
                  {provider.recommended && (
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded text-xs font-medium">
                      Recomendado
                    </span>
                  )}
                </div>
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                  Configurar
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Manual Download Section */}
        <div>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Baixa Manual
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Receba diretamente em sua conta porém é necessário fazer a baixa manual das compras
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between transition-colors duration-300 mb-4">
            <div className="flex items-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${isPixConfigured ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <div className="flex items-center space-x-3">
                <div className="text-2xl font-bold text-teal-400">pix</div>
                {isPixConfigured && (
                  <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded text-xs font-medium">
                    Configurado
                  </span>
                )}
              </div>
            </div>
            <button 
              onClick={handlePixConfig}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              {isPixConfigured ? 'Editar' : 'Configurar'}
            </button>
          </div>

          {/* PIX Configuration Panel */}
          {showPixConfig && (
            <div className="bg-gray-900 rounded-lg p-6 text-white">
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
                  onClick={() => setPixConfig({ ...pixConfig, isActive: !pixConfig.isActive })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                    pixConfig.isActive ? 'bg-purple-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      pixConfig.isActive ? 'translate-x-6' : 'translate-x-1'
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
                    value={pixConfig.keyType}
                    onChange={(e) => setPixConfig({ ...pixConfig, keyType: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
                  >
                    <option value="CPF">CPF</option>
                    <option value="CNPJ">CNPJ</option>
                    <option value="Email">Email</option>
                    <option value="Telefone">Telefone</option>
                    <option value="Chave Aleatória">Chave Aleatória</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* PIX Key */}
              <div className="mb-6">
                <label className="block text-white font-medium mb-3">
                  Chave pix *
                </label>
                <input
                  type="text"
                  value={pixConfig.pixKey}
                  onChange={(e) => setPixConfig({ ...pixConfig, pixKey: e.target.value })}
                  placeholder="Digite sua chave pix"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Account Holder */}
              <div className="mb-8">
                <label className="block text-white font-medium mb-3">
                  Titular da conta *
                </label>
                <input
                  type="text"
                  value={pixConfig.accountHolder}
                  onChange={(e) => setPixConfig({ ...pixConfig, accountHolder: e.target.value })}
                  placeholder="Digite o titular da conta"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Save Button */}
              <button
                onClick={handleSavePix}
                disabled={!pixConfig.pixKey.trim() || !pixConfig.accountHolder.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <span>Salvar pix</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Precisa de ajuda?
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                Nossa equipe está disponível para ajudar você a configurar suas integrações de pagamento.
              </p>
              <button 
                onClick={handleWhatsAppSupport}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Falar com Suporte
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentIntegrationsPage;