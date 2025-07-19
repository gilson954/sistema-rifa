import React, { useState, useEffect } from 'react';
import { ArrowLeft, Info, CheckCircle, AlertTriangle, ArrowRight, ChevronDown, Upload, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PaymentIntegrationsPage = () => {
  const navigate = useNavigate();
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [isEfiModalOpen, setIsEfiModalOpen] = useState(false);
  const [isPaggueModalOpen, setIsPaggueModalOpen] = useState(false);
  const [isPay2mModalOpen, setIsPay2mModalOpen] = useState(false);
  const [isFluxsisModalOpen, setIsFluxsisModalOpen] = useState(false);
  const [isMercadoPagoModalOpen, setIsMercadoPagoModalOpen] = useState(false);

  const [pixConfig, setPixConfig] = useState({
    isActive: false,
    keyType: 'CPF',
    pixKey: '',
    accountHolder: ''
  });

  const [efiConfig, setEfiConfig] = useState({
    isActive: false,
    clientId: '',
    clientSecret: '',
    pixKey: '',
    certificate: null as File | null
  });

  const [paggueConfig, setPaggueConfig] = useState({
    isActive: false,
    clientKey: '',
    clientSecret: '',
    signatureToken: ''
  });

  const [pay2mConfig, setPay2mConfig] = useState({
    isActive: false,
    clientKey: '',
    clientSecret: ''
  });

  const [fluxsisConfig, setFluxsisConfig] = useState({
    isActive: false,
    clientId: '',
    clientSecret: '',
    pixKey: ''
  });

  const [mercadoPagoConfig, setMercadoPagoConfig] = useState({
    isActive: false,
    integrationKey: ''
  });

  // Load configurations from localStorage on component mount
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

    const savedEfiConfig = localStorage.getItem('efiConfig');
    if (savedEfiConfig) {
      try {
        const parsedConfig = JSON.parse(savedEfiConfig);
        setEfiConfig(parsedConfig);
      } catch (error) {
        console.error('Error parsing saved Efi config:', error);
      }
    }

    const savedPaggueConfig = localStorage.getItem('paggueConfig');
    if (savedPaggueConfig) {
      try {
        const parsedConfig = JSON.parse(savedPaggueConfig);
        setPaggueConfig(parsedConfig);
      } catch (error) {
        console.error('Error parsing saved Paggue config:', error);
      }
    }

    const savedPay2mConfig = localStorage.getItem('pay2mConfig');
    if (savedPay2mConfig) {
      try {
        const parsedConfig = JSON.parse(savedPay2mConfig);
        setPay2mConfig(parsedConfig);
      } catch (error) {
        console.error('Error parsing saved Pay2m config:', error);
      }
    }

    const savedFluxsisConfig = localStorage.getItem('fluxsisConfig');
    if (savedFluxsisConfig) {
      try {
        const parsedConfig = JSON.parse(savedFluxsisConfig);
        setFluxsisConfig(parsedConfig);
      } catch (error) {
        console.error('Error parsing saved Fluxsis config:', error);
      }
    }

    const savedMercadoPagoConfig = localStorage.getItem('mercadoPagoConfig');
    if (savedMercadoPagoConfig) {
      try {
        const parsedConfig = JSON.parse(savedMercadoPagoConfig);
        setMercadoPagoConfig(parsedConfig);
      } catch (error) {
        console.error('Error parsing saved Mercado Pago config:', error);
      }
    }
  }, []);

  // Save configurations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pixConfig', JSON.stringify(pixConfig));
    
    // Update payment configuration status
    const isPixConfigured = pixConfig.isActive && pixConfig.pixKey.trim() && pixConfig.accountHolder.trim();
    const isEfiConfigured = efiConfig.isActive && efiConfig.clientId.trim() && efiConfig.clientSecret.trim() && efiConfig.pixKey.trim();
    const isPaggueConfigured = paggueConfig.isActive && paggueConfig.clientKey.trim() && paggueConfig.clientSecret.trim() && paggueConfig.signatureToken.trim();
    const isPay2mConfigured = pay2mConfig.isActive && pay2mConfig.clientKey.trim() && pay2mConfig.clientSecret.trim();
    const isFluxsisConfigured = fluxsisConfig.isActive && fluxsisConfig.clientId.trim() && fluxsisConfig.clientSecret.trim() && fluxsisConfig.pixKey.trim();
    const isMercadoPagoConfigured = mercadoPagoConfig.isActive && mercadoPagoConfig.integrationKey.trim();
    
    const isPaymentConfigured = isPixConfigured || isEfiConfigured || isPaggueConfigured || isPay2mConfigured || isFluxsisConfigured || isMercadoPagoConfigured;
    localStorage.setItem('isPaymentConfigured', JSON.stringify(isPaymentConfigured));
  }, [pixConfig, efiConfig, paggueConfig, pay2mConfig, fluxsisConfig, mercadoPagoConfig]);

  useEffect(() => {
    localStorage.setItem('efiConfig', JSON.stringify({
      ...efiConfig,
      certificate: null // Don't store file in localStorage
    }));
  }, [efiConfig]);

  useEffect(() => {
    localStorage.setItem('paggueConfig', JSON.stringify(paggueConfig));
  }, [paggueConfig]);

  useEffect(() => {
    localStorage.setItem('pay2mConfig', JSON.stringify(pay2mConfig));
  }, [pay2mConfig]);

  useEffect(() => {
    localStorage.setItem('fluxsisConfig', JSON.stringify(fluxsisConfig));
  }, [fluxsisConfig]);

  useEffect(() => {
    localStorage.setItem('mercadoPagoConfig', JSON.stringify(mercadoPagoConfig));
  }, [mercadoPagoConfig]);

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  const handlePixConfig = () => {
    setIsPixModalOpen(true);
  };

  const handleEfiConfig = () => {
    setIsEfiModalOpen(true);
  };

  const handlePaggueConfig = () => {
    setIsPaggueModalOpen(true);
  };

  const handlePay2mConfig = () => {
    setIsPay2mModalOpen(true);
  };

  const handleFluxsisConfig = () => {
    setIsFluxsisModalOpen(true);
  };

  const handleMercadoPagoConfig = () => {
    setIsMercadoPagoModalOpen(true);
  };

  const handleSavePix = () => {
    // Validate required fields
    if (!pixConfig.pixKey.trim() || !pixConfig.accountHolder.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    console.log('Saving PIX configuration:', pixConfig);
    setIsPixModalOpen(false);
    alert('Configuração PIX salva com sucesso!');
  };

  const handleSaveEfi = () => {
    // Validate required fields
    if (!efiConfig.clientId.trim() || !efiConfig.clientSecret.trim() || !efiConfig.pixKey.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    console.log('Saving Efi Bank configuration:', efiConfig);
    setIsEfiModalOpen(false);
    alert('Configuração Efi Bank salva com sucesso!');
  };

  const handleSavePaggue = () => {
    // Validate required fields
    if (!paggueConfig.clientKey.trim() || !paggueConfig.clientSecret.trim() || !paggueConfig.signatureToken.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    console.log('Saving Paggue configuration:', paggueConfig);
    setIsPaggueModalOpen(false);
    alert('Configuração Paggue salva com sucesso!');
  };

  const handleSavePay2m = () => {
    // Validate required fields
    if (!pay2mConfig.clientKey.trim() || !pay2mConfig.clientSecret.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    console.log('Saving Pay2m configuration:', pay2mConfig);
    setIsPay2mModalOpen(false);
    alert('Configuração Pay2m salva com sucesso!');
  };

  const handleSaveFluxsis = () => {
    // Validate required fields
    if (!fluxsisConfig.clientId.trim() || !fluxsisConfig.clientSecret.trim() || !fluxsisConfig.pixKey.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    console.log('Saving Fluxsis configuration:', fluxsisConfig);
    setIsFluxsisModalOpen(false);
    alert('Configuração Fluxsis salva com sucesso!');
  };

  const handleSaveMercadoPago = () => {
    // Validate required fields
    if (!mercadoPagoConfig.integrationKey.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    console.log('Saving Mercado Pago configuration:', mercadoPagoConfig);
    setIsMercadoPagoModalOpen(false);
    alert('Configuração Mercado Pago salva com sucesso!');
  };

  const handleCertificateUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setEfiConfig({ ...efiConfig, certificate: file });
    }
  };

  const handleWhatsAppSupport = () => {
    window.open('https://wa.me/5562981127960', '_blank');
  };

  const handleClosePixModal = () => {
    setIsPixModalOpen(false);
  };

  const handleCloseEfiModal = () => {
    setIsEfiModalOpen(false);
  };

  const handleClosePaggueModal = () => {
    setIsPaggueModalOpen(false);
  };

  const handleClosePay2mModal = () => {
    setIsPay2mModalOpen(false);
  };

  const handleCloseFluxsisModal = () => {
    setIsFluxsisModalOpen(false);
  };

  const handleCloseMercadoPagoModal = () => {
    setIsMercadoPagoModalOpen(false);
  };

  const paymentProviders = [
    {
      name: 'Fluxsis',
      logo: '/api/placeholder/120/40',
      status: 'inactive',
      recommended: true,
      handler: handleFluxsisConfig,
      isConfigured: fluxsisConfig.isActive && fluxsisConfig.clientId.trim() && fluxsisConfig.clientSecret.trim() && fluxsisConfig.pixKey.trim()
    },
    {
      name: 'Pay2m',
      logo: '/api/placeholder/120/40',
      status: 'inactive',
      handler: handlePay2mConfig,
      isConfigured: pay2mConfig.isActive && pay2mConfig.clientKey.trim() && pay2mConfig.clientSecret.trim()
    },
    {
      name: 'Paggue',
      logo: '/api/placeholder/120/40',
      status: 'inactive',
      handler: handlePaggueConfig,
      isConfigured: paggueConfig.isActive && paggueConfig.clientKey.trim() && paggueConfig.clientSecret.trim() && paggueConfig.signatureToken.trim()
    },
    {
      name: 'Mercado Pago',
      logo: '/api/placeholder/120/40',
      status: 'inactive',
      handler: handleMercadoPagoConfig,
      isConfigured: mercadoPagoConfig.isActive && mercadoPagoConfig.integrationKey.trim()
    },
    {
      name: 'Efí Bank',
      logo: '/api/placeholder/120/40',
      status: 'inactive',
      handler: handleEfiConfig,
      isConfigured: efiConfig.isActive && efiConfig.clientId.trim() && efiConfig.clientSecret.trim() && efiConfig.pixKey.trim()
    }
  ];

  // Check if payment methods are configured
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
          
          {!paymentProviders.some(p => p.isConfigured) && !isPixConfigured ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-yellow-800 dark:text-yellow-200">
                Nenhum método de pagamento ativo até o momento
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              {isPixConfigured && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-green-800 dark:text-green-200">
                    PIX Manual configurado e ativo
                  </span>
                </div>
              )}
              {paymentProviders.filter(p => p.isConfigured).map((provider) => (
                <div key={provider.name} className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-green-800 dark:text-green-200">
                    {provider.name} configurado e ativo
                  </span>
                </div>
              ))}
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
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors duration-300"
              >
                <div className="flex items-center space-x-4 min-w-0 flex-1">
                  <div className={`w-3 h-3 rounded-full ${
                    provider.isConfigured ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <div className="w-20 sm:w-24 h-8 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate px-1">
                      {provider.name}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {provider.recommended && (
                      <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
                        Recomendado
                      </span>
                    )}
                    {provider.isConfigured && (
                      <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
                        Configurado
                      </span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={provider.handler}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 w-full sm:w-auto flex-shrink-0"
                >
                  {provider.isConfigured ? 'Editar' : 'Configurar'}
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

          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors duration-300">
            <div className="flex items-center space-x-4 min-w-0 flex-1">
              <div className={`w-3 h-3 rounded-full ${isPixConfigured ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <div className="flex items-center space-x-3">
                <div className="text-2xl font-bold text-teal-400">pix</div>
                {isPixConfigured && (
                  <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
                    Configurado
                  </span>
                )}
              </div>
            </div>
            <button 
              onClick={handlePixConfig}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 w-full sm:w-auto flex-shrink-0"
            >
              {isPixConfigured ? 'Editar' : 'Configurar'}
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Precisa de ajuda?
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                Nossa equipe está disponível para ajudar você a configurar suas integrações de pagamento.
              </p>
              <button 
                onClick={handleWhatsAppSupport}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 w-full sm:w-auto"
              >
                Falar com Suporte
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PIX Configuration Modal */}
      {isPixModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-gray-900 rounded-lg p-6 w-full max-w-md text-white max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Configurar PIX Manual
              </h2>
              <button
                onClick={handleClosePixModal}
                className="p-1 hover:bg-gray-800 rounded transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
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
        </div>
      )}

      {/* Efi Bank Configuration Modal */}
      {isEfiModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-gray-900 rounded-lg p-6 w-full max-w-md text-white max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <h2 className="text-lg font-semibold text-white">efi BANK</h2>
              </div>
              <button
                onClick={handleCloseEfiModal}
                className="p-1 hover:bg-gray-800 rounded transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-white font-medium">Ativo</span>
              <button
                onClick={() => setEfiConfig({ ...efiConfig, isActive: !efiConfig.isActive })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  efiConfig.isActive ? 'bg-purple-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    efiConfig.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Client ID */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-3">
                Chave Client ID
              </label>
              <input
                type="text"
                value={efiConfig.clientId}
                onChange={(e) => setEfiConfig({ ...efiConfig, clientId: e.target.value })}
                placeholder="Cole aqui"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Client Secret */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-3">
                Chave Client Secret
              </label>
              <input
                type="text"
                value={efiConfig.clientSecret}
                onChange={(e) => setEfiConfig({ ...efiConfig, clientSecret: e.target.value })}
                placeholder="Cole aqui"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* PIX Key Efi */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-3">
                Chave pix Efi
              </label>
              <input
                type="text"
                value={efiConfig.pixKey}
                onChange={(e) => setEfiConfig({ ...efiConfig, pixKey: e.target.value })}
                placeholder="Cole aqui"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Certificate Upload */}
            <div className="mb-8">
              <label className="block text-white font-medium mb-3">
                Anexe o certificado Efi bank
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".p12,.pfx"
                  onChange={handleCertificateUpload}
                  className="hidden"
                  id="certificate-upload"
                />
                <label
                  htmlFor="certificate-upload"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-gray-400 cursor-pointer hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>
                    {efiConfig.certificate ? efiConfig.certificate.name : 'Escolher arquivo Nenhum arquivo escolhido'}
                  </span>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveEfi}
              disabled={!efiConfig.clientId.trim() || !efiConfig.clientSecret.trim() || !efiConfig.pixKey.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 mb-4"
            >
              <span>Salvar Chave</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Info Link */}
            <div className="text-center">
              <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors duration-200 flex items-center space-x-2 mx-auto">
                <Info className="h-4 w-4" />
                <span>Clique aqui para ir direto a página do banco Efi clique aqui</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paggue Configuration Modal */}
      {isPaggueModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-gray-900 rounded-lg p-6 w-full max-w-md text-white max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <h2 className="text-lg font-semibold text-white">Paggue</h2>
              </div>
              <button
                onClick={handleClosePaggueModal}
                className="p-1 hover:bg-gray-800 rounded transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Alert */}
            <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4 mb-6 flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-blue-300 text-sm">
                  <span className="font-semibold">Atenção</span>
                </p>
                <p className="text-blue-200 text-sm">
                  Esta forma de pagamento tem enfrentado problemas com bloqueios imprevistos. Se possível, prefira utilizar as outras formas de pagamento.
                </p>
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-white font-medium">Ativo</span>
              <button
                onClick={() => setPaggueConfig({ ...paggueConfig, isActive: !paggueConfig.isActive })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  paggueConfig.isActive ? 'bg-purple-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    paggueConfig.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Client Key */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-3">
                Client_key
              </label>
              <input
                type="text"
                value={paggueConfig.clientKey}
                onChange={(e) => setPaggueConfig({ ...paggueConfig, clientKey: e.target.value })}
                placeholder="Cole aqui a chave"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Client Secret */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-3">
                Client_secret
              </label>
              <input
                type="text"
                value={paggueConfig.clientSecret}
                onChange={(e) => setPaggueConfig({ ...paggueConfig, clientSecret: e.target.value })}
                placeholder="Cole aqui a chave"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Token de assinatura */}
            <div className="mb-8">
              <label className="block text-white font-medium mb-3">
                Token de assinatura
              </label>
              <input
                type="text"
                value={paggueConfig.signatureToken}
                onChange={(e) => setPaggueConfig({ ...paggueConfig, signatureToken: e.target.value })}
                placeholder="Cole aqui a chave"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleSavePaggue}
              disabled={!paggueConfig.clientKey.trim() || !paggueConfig.clientSecret.trim() || !paggueConfig.signatureToken.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 mb-4"
            >
              <span>Salvar Chave</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Info Link */}
            <div className="text-center">
              <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors duration-200 flex items-center space-x-2 mx-auto">
                <Info className="h-4 w-4" />
                <span>Para ir direto a página do banco paggue clique aqui</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay2m Configuration Modal */}
      {isPay2mModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-gray-900 rounded-lg p-6 w-full max-w-md text-white max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <h2 className="text-lg font-semibold text-white">Pay2m</h2>
              </div>
              <button
                onClick={handleClosePay2mModal}
                className="p-1 hover:bg-gray-800 rounded transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Alert */}
            <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4 mb-6 flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-blue-300 text-sm">
                  <span className="font-semibold">Atenção</span>
                </p>
                <p className="text-blue-200 text-sm">
                  O valor mínimo para compras com o Pay2M é de R$ 1,00. Para compras abaixo desse valor, configure um segundo método de pagamento.
                </p>
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-white font-medium">Ativo</span>
              <button
                onClick={() => setPay2mConfig({ ...pay2mConfig, isActive: !pay2mConfig.isActive })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  pay2mConfig.isActive ? 'bg-purple-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    pay2mConfig.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Client Key */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-3">
                Client_key
              </label>
              <input
                type="text"
                value={pay2mConfig.clientKey}
                onChange={(e) => setPay2mConfig({ ...pay2mConfig, clientKey: e.target.value })}
                placeholder="Cole aqui a chave"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Client Secret */}
            <div className="mb-8">
              <label className="block text-white font-medium mb-3">
                Client_secret
              </label>
              <input
                type="text"
                value={pay2mConfig.clientSecret}
                onChange={(e) => setPay2mConfig({ ...pay2mConfig, clientSecret: e.target.value })}
                placeholder="Cole aqui a chave"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleSavePay2m}
              disabled={!pay2mConfig.clientKey.trim() || !pay2mConfig.clientSecret.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 mb-4"
            >
              <span>Salvar Chave</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Info Link */}
            <div className="text-center">
              <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors duration-200 flex items-center space-x-2 mx-auto">
                <Info className="h-4 w-4" />
                <span>Para ir direto a página do Pay2M clique aqui</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fluxsis Configuration Modal */}
      {isFluxsisModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-gray-900 rounded-lg p-6 w-full max-w-md text-white max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <h2 className="text-lg font-semibold text-white">Fluxsis</h2>
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded text-xs font-medium">
                      Recomendado
                    </span>
              </div>
              <button
                onClick={handleCloseFluxsisModal}
                className="p-1 hover:bg-gray-800 rounded transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-white font-medium">Ativo</span>
              <button
                onClick={() => setFluxsisConfig({ ...fluxsisConfig, isActive: !fluxsisConfig.isActive })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  fluxsisConfig.isActive ? 'bg-purple-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    fluxsisConfig.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* ID do cliente */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-3">
                ID do cliente
              </label>
              <input
                type="text"
                value={fluxsisConfig.clientId}
                onChange={(e) => setFluxsisConfig({ ...fluxsisConfig, clientId: e.target.value })}
                placeholder="Cole aqui a chave"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Segredo do cliente */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-3">
                Segredo do cliente
              </label>
              <input
                type="text"
                value={fluxsisConfig.clientSecret}
                onChange={(e) => setFluxsisConfig({ ...fluxsisConfig, clientSecret: e.target.value })}
                placeholder="Cole aqui a chave"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Chave pix */}
            <div className="mb-8">
              <label className="block text-white font-medium mb-3">
                Chave pix
              </label>
              <input
                type="text"
                value={fluxsisConfig.pixKey}
                onChange={(e) => setFluxsisConfig({ ...fluxsisConfig, pixKey: e.target.value })}
                placeholder="Cole aqui a chave"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveFluxsis}
              disabled={!fluxsisConfig.clientId.trim() || !fluxsisConfig.clientSecret.trim() || !fluxsisConfig.pixKey.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 mb-4"
            >
              <span>Salvar Chave</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Info Link */}
            <div className="text-center">
              <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors duration-200 flex items-center space-x-2 mx-auto">
                <Info className="h-4 w-4" />
                <span>Para ir direto a página do Fluxsis clique aqui</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mercado Pago Configuration Modal */}
      {isMercadoPagoModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-gray-900 rounded-lg p-6 w-full max-w-md text-white max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <h2 className="text-lg font-semibold text-white">Mercado Pago</h2>
              </div>
              <button
                onClick={handleCloseMercadoPagoModal}
                className="p-1 hover:bg-gray-800 rounded transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Alert */}
            <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4 mb-6 flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-blue-300 text-sm">
                  <span className="font-semibold">Atenção</span>
                </p>
                <p className="text-blue-200 text-sm">
                  Esta forma de pagamento tem enfrentado problemas com bloqueios imprevistos. Se possível, prefira utilizar as outras formas de pagamento.
                </p>
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-white font-medium">Ativo</span>
              <button
                onClick={() => setMercadoPagoConfig({ ...mercadoPagoConfig, isActive: !mercadoPagoConfig.isActive })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  mercadoPagoConfig.isActive ? 'bg-purple-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    mercadoPagoConfig.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Chave de Integração */}
            <div className="mb-8">
              <label className="block text-white font-medium mb-3">
                Chave de Integração
              </label>
              <input
                type="text"
                value={mercadoPagoConfig.integrationKey}
                onChange={(e) => setMercadoPagoConfig({ ...mercadoPagoConfig, integrationKey: e.target.value })}
                placeholder="Cole aqui a chave"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveMercadoPago}
              disabled={!mercadoPagoConfig.integrationKey.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 mb-4"
            >
              <span>Salvar Chave</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Info Link */}
            <div className="text-center">
              <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors duration-200 flex items-center space-x-2 mx-auto">
                <Info className="h-4 w-4" />
                <span>Clique aqui para ir direto a página do mercado pago clique aqui</span>
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* PIX Configuration Modal */}
      {isPixModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-gray-900 rounded-lg p-6 w-full max-w-md text-white max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Configurar PIX Manual
              </h2>
              <button
                onClick={handleClosePixModal}
                className="p-1 hover:bg-gray-800 rounded transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
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
        </div>
      )}

      {/* Efi Bank Configuration Modal */}
      {isEfiModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-gray-900 rounded-lg p-6 w-full max-w-md text-white max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <h2 className="text-lg font-semibold text-white">efi BANK</h2>
              </div>
              <button
                onClick={handleCloseEfiModal}
                className="p-1 hover:bg-gray-800 rounded transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-white font-medium">Ativo</span>
              <button
                onClick={() => setEfiConfig({ ...efiConfig, isActive: !efiConfig.isActive })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  efiConfig.isActive ? 'bg-purple-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    efiConfig.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Client ID */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-3">
                Chave Client ID
              </label>
              <input
                type="text"
                value={efiConfig.clientId}
                onChange={(e) => setEfiConfig({ ...efiConfig, clientId: e.target.value })}
                placeholder="Cole aqui"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Client Secret */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-3">
                Chave Client Secret
              </label>
              <input
                type="text"
                value={efiConfig.clientSecret}
                onChange={(e) => setEfiConfig({ ...efiConfig, clientSecret: e.target.value })}
                placeholder="Cole aqui"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* PIX Key Efi */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-3">
                Chave pix Efi
              </label>
              <input
                type="text"
                value={efiConfig.pixKey}
                onChange={(e) => setEfiConfig({ ...efiConfig, pixKey: e.target.value })}
                placeholder="Cole aqui"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Certificate Upload */}
            <div className="mb-8">
              <label className="block text-white font-medium mb-3">
                Anexe o certificado Efi bank
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".p12,.pfx"
                  onChange={handleCertificateUpload}
                  className="hidden"
                  id="certificate-upload"
                />
                <label
                  htmlFor="certificate-upload"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-gray-400 cursor-pointer hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>
                    {efiConfig.certificate ? efiConfig.certificate.name : 'Escolher arquivo Nenhum arquivo escolhido'}
                  </span>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveEfi}
              disabled={!efiConfig.clientId.trim() || !efiConfig.clientSecret.trim() || !efiConfig.pixKey.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 mb-4"
            >
              <span>Salvar Chave</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Info Link */}
            <div className="text-center">
              <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors duration-200 flex items-center space-x-2 mx-auto">
                <Info className="h-4 w-4" />
                <span>Clique aqui para ir direto a página do banco Efi clique aqui</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paggue Configuration Modal */}
      {isPaggueModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-gray-900 rounded-lg p-6 w-full max-w-md text-white max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <h2 className="text-lg font-semibold text-white">Paggue</h2>
              </div>
              <button
                onClick={handleClosePaggueModal}
                className="p-1 hover:bg-gray-800 rounded transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Alert */}
            <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4 mb-6 flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-blue-300 text-sm">
                  <span className="font-semibold">Atenção</span>
                </p>
                <p className="text-blue-200 text-sm">
                  Esta forma de pagamento tem enfrentado problemas com bloqueios imprevistos. Se possível, prefira utilizar as outras formas de pagamento.
                </p>
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-white font-medium">Ativo</span>
              <button
                onClick={() => setPaggueConfig({ ...paggueConfig, isActive: !paggueConfig.isActive })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  paggueConfig.isActive ? 'bg-purple-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    paggueConfig.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Client Key */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-3">
                Client_key
              </label>
              <input
                type="text"
                value={paggueConfig.clientKey}
                onChange={(e) => setPaggueConfig({ ...paggueConfig, clientKey: e.target.value })}
                placeholder="Cole aqui a chave"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Client Secret */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-3">
                Client_secret
              </label>
              <input
                type="text"
                value={paggueConfig.clientSecret}
                onChange={(e) => setPaggueConfig({ ...paggueConfig, clientSecret: e.target.value })}
                placeholder="Cole aqui a chave"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Token de assinatura */}
            <div className="mb-8">
              <label className="block text-white font-medium mb-3">
                Token de assinatura
              </label>
              <input
                type="text"
                value={paggueConfig.signatureToken}
                onChange={(e) => setPaggueConfig({ ...paggueConfig, signatureToken: e.target.value })}
                placeholder="Cole aqui a chave"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleSavePaggue}
              disabled={!paggueConfig.clientKey.trim() || !paggueConfig.clientSecret.trim() || !paggueConfig.signatureToken.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 mb-4"
            >
              <span>Salvar Chave</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Info Link */}
            <div className="text-center">
              <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors duration-200 flex items-center space-x-2 mx-auto">
                <Info className="h-4 w-4" />
                <span>Para ir direto a página do banco paggue clique aqui</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay2m Configuration Modal */}
      {isPay2mModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-gray-900 rounded-lg p-6 w-full max-w-md text-white max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <h2 className="text-lg font-semibold text-white">Pay2m</h2>
              </div>
              <button
                onClick={handleClosePay2mModal}
                className="p-1 hover:bg-gray-800 rounded transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Alert */}
            <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4 mb-6 flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-blue-300 text-sm">
                  <span className="font-semibold">Atenção</span>
                </p>
                <p className="text-blue-200 text-sm">
                  O valor mínimo para compras com o Pay2M é de R$ 1,00. Para compras abaixo desse valor, configure um segundo método de pagamento.
                </p>
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-white font-medium">Ativo</span>
              <button
                onClick={() => setPay2mConfig({ ...pay2mConfig, isActive: !pay2mConfig.isActive })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  pay2mConfig.isActive ? 'bg-purple-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    pay2mConfig.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Client Key */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-3">
                Client_key
              </label>
              <input
                type="text"
                value={pay2mConfig.clientKey}
                onChange={(e) => setPay2mConfig({ ...pay2mConfig, clientKey: e.target.value })}
                placeholder="Cole aqui a chave"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Client Secret */}
            <div className="mb-8">
              <label className="block text-white font-medium mb-3">
                Client_secret
              </label>
              <input
                type="text"
                value={pay2mConfig.clientSecret}
                onChange={(e) => setPay2mConfig({ ...pay2mConfig, clientSecret: e.target.value })}
                placeholder="Cole aqui a chave"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleSavePay2m}
              disabled={!pay2mConfig.clientKey.trim() || !pay2mConfig.clientSecret.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 mb-4"
            >
              <span>Salvar Chave</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Info Link */}
            <div className="text-center">
              <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors duration-200 flex items-center space-x-2 mx-auto">
                <Info className="h-4 w-4" />
                <span>Para ir direto a página do Pay2M clique aqui</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fluxsis Configuration Modal */}
      {isFluxsisModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-gray-900 rounded-lg p-6 w-full max-w-md text-white max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <h2 className="text-lg font-semibold text-white">Fluxsis</h2>
                <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                  Recomendado
                </span>
              </div>
              <button
                onClick={handleCloseFluxsisModal}
                className="p-1 hover:bg-gray-800 rounded transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-white font-medium">Ativo</span>
              <button
                onClick={() => setFluxsisConfig({ ...fluxsisConfig, isActive: !fluxsisConfig.isActive })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  fluxsisConfig.isActive ? 'bg-purple-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    fluxsisConfig.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* ID do cliente */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-3">
                ID do cliente
              </label>
              <input
                type="text"
                value={fluxsisConfig.clientId}
                onChange={(e) => setFluxsisConfig({ ...fluxsisConfig, clientId: e.target.value })}
                placeholder="Cole aqui a chave"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Segredo do cliente */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-3">
                Segredo do cliente
              </label>
              <input
                type="text"
                value={fluxsisConfig.clientSecret}
                onChange={(e) => setFluxsisConfig({ ...fluxsisConfig, clientSecret: e.target.value })}
                placeholder="Cole aqui a chave"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Chave pix */}
            <div className="mb-8">
              <label className="block text-white font-medium mb-3">
                Chave pix
              </label>
              <input
                type="text"
                value={fluxsisConfig.pixKey}
                onChange={(e) => setFluxsisConfig({ ...fluxsisConfig, pixKey: e.target.value })}
                placeholder="Cole aqui a chave"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveFluxsis}
              disabled={!fluxsisConfig.clientId.trim() || !fluxsisConfig.clientSecret.trim() || !fluxsisConfig.pixKey.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 mb-4"
            >
              <span>Salvar Chave</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Info Link */}
            <div className="text-center">
              <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors duration-200 flex items-center space-x-2 mx-auto">
                <Info className="h-4 w-4" />
                <span>Para ir direto a página do Fluxsis clique aqui</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mercado Pago Configuration Modal */}
      {isMercadoPagoModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-gray-900 rounded-lg p-6 w-full max-w-md text-white max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <h2 className="text-lg font-semibold text-white">Mercado Pago</h2>
              </div>
              <button
                onClick={handleCloseMercadoPagoModal}
                className="p-1 hover:bg-gray-800 rounded transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Alert */}
            <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4 mb-6 flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-blue-300 text-sm">
                  <span className="font-semibold">Atenção</span>
                </p>
                <p className="text-blue-200 text-sm">
                  Esta forma de pagamento tem enfrentado problemas com bloqueios imprevistos. Se possível, prefira utilizar as outras formas de pagamento.
                </p>
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-white font-medium">Ativo</span>
              <button
                onClick={() => setMercadoPagoConfig({ ...mercadoPagoConfig, isActive: !mercadoPagoConfig.isActive })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  mercadoPagoConfig.isActive ? 'bg-purple-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    mercadoPagoConfig.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Chave de Integração */}
            <div className="mb-8">
              <label className="block text-white font-medium mb-3">
                Chave de Integração
              </label>
              <input
                type="text"
                value={mercadoPagoConfig.integrationKey}
                onChange={(e) => setMercadoPagoConfig({ ...mercadoPagoConfig, integrationKey: e.target.value })}
                placeholder="Cole aqui a chave"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveMercadoPago}
              disabled={!mercadoPagoConfig.integrationKey.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 mb-4"
            >
              <span>Salvar Chave</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Info Link */}
            <div className="text-center">
              <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors duration-200 flex items-center space-x-2 mx-auto">
                <Info className="h-4 w-4" />
                <span>Clique aqui para ir direto a página do mercado pago clique aqui</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentIntegrationsPage;