import React, { useState, useEffect } from 'react';
import { ArrowLeft, X, ArrowRight, Trash2, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PaymentsAPI, PaymentIntegrationConfig } from '../lib/api/payments';

const PaymentIntegrationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Modal states
  const [showFluxsisModal, setShowFluxsisModal] = useState(false);
  const [showPay2mModal, setShowPay2mModal] = useState(false);
  const [showPaggueModal, setShowPaggueModal] = useState(false);
  const [showEfiBankModal, setShowEfiBankModal] = useState(false);

  // Configuration states
  const [fluxsisConfig, setFluxsisConfig] = useState({ api_key: '', secret_key: '', webhook_url: '' });
  const [pay2mConfig, setPay2mConfig] = useState({ api_key: '', secret_key: '', webhook_url: '' });
  const [paggueConfig, setPaggueConfig] = useState({ api_key: '', secret_key: '', webhook_url: '' });
  const [efiBankConfig, setEfiBankConfig] = useState({ client_id: '', client_secret: '', webhook_url: '' });

  // Status states
  const [isFluxsisConfigured, setIsFluxsisConfigured] = useState(false);
  const [isPay2mConfigured, setIsPay2mConfigured] = useState(false);
  const [isPaggueConfigured, setIsPaggueConfigured] = useState(false);
  const [isEfiBankConfigured, setIsEfiBankConfigured] = useState(false);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load payment configurations when component mounts
  useEffect(() => {
    const loadPaymentConfig = async () => {
      if (!user) return;

      try {
        const { data, error } = await PaymentsAPI.getPaymentConfig(user.id);
        
        if (error) {
          console.error('Error loading payment config:', error);
          return;
        }

        if (data) {
          if (data.fluxsis) {
            setFluxsisConfig({
              api_key: data.fluxsis.api_key || '',
              secret_key: data.fluxsis.secret_key || '',
              webhook_url: data.fluxsis.webhook_url || ''
            });
            setIsFluxsisConfigured(!!data.fluxsis.api_key);
          }

          if (data.pay2m) {
            setPay2mConfig({
              api_key: data.pay2m.api_key || '',
              secret_key: data.pay2m.secret_key || '',
              webhook_url: data.pay2m.webhook_url || ''
            });
            setIsPay2mConfigured(!!data.pay2m.api_key);
          }

          if (data.paggue) {
            setPaggueConfig({
              api_key: data.paggue.api_key || '',
              secret_key: data.paggue.secret_key || '',
              webhook_url: data.paggue.webhook_url || ''
            });
            setIsPaggueConfigured(!!data.paggue.api_key);
          }

          if (data.efi_bank) {
            setEfiBankConfig({
              client_id: data.efi_bank.client_id || '',
              client_secret: data.efi_bank.client_secret || '',
              webhook_url: data.efi_bank.webhook_url || ''
            });
            setIsEfiBankConfigured(!!data.efi_bank.client_id);
          }
        }
      } catch (error) {
        console.error('Error loading payment configurations:', error);
      }
    };

    loadPaymentConfig();
  }, [user]);

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  // Fluxsis handlers
  const handleFluxsisConfig = () => {
    setShowFluxsisModal(true);
  };

  const handleSaveFluxsisConfig = async () => {
    if (!user || !fluxsisConfig.api_key.trim() || !fluxsisConfig.secret_key.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const { data: currentConfig } = await PaymentsAPI.getPaymentConfig(user.id);
      const updatedConfig: PaymentIntegrationConfig = {
        ...currentConfig,
        fluxsis: {
          api_key: fluxsisConfig.api_key,
          secret_key: fluxsisConfig.secret_key,
          webhook_url: fluxsisConfig.webhook_url,
          configured_at: new Date().toISOString()
        }
      };

      const { error } = await PaymentsAPI.updatePaymentConfig(user.id, updatedConfig);
      
      if (error) {
        console.error('Error saving Fluxsis config:', error);
        alert('Erro ao salvar configuração. Tente novamente.');
      } else {
        setIsFluxsisConfigured(true);
        setShowFluxsisModal(false);
        alert('Configuração do Fluxsis salva com sucesso!');
        localStorage.setItem('isPaymentConfigured', 'true');
      }
    } catch (error) {
      console.error('Error saving Fluxsis config:', error);
      alert('Erro ao salvar configuração. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFluxsisConfig = async () => {
    if (!user) return;

    if (!window.confirm('Tem certeza que deseja remover a configuração do Fluxsis?')) {
      return;
    }

    setDeleting(true);
    try {
      const { data: currentConfig } = await PaymentsAPI.getPaymentConfig(user.id);
      const updatedConfig: PaymentIntegrationConfig = { ...currentConfig };
      delete updatedConfig.fluxsis;

      const { error } = await PaymentsAPI.updatePaymentConfig(user.id, updatedConfig);
      
      if (error) {
        console.error('Error deleting Fluxsis config:', error);
        alert('Erro ao remover configuração. Tente novamente.');
      } else {
        setIsFluxsisConfigured(false);
        setFluxsisConfig({ api_key: '', secret_key: '', webhook_url: '' });
        setShowFluxsisModal(false);
        alert('Configuração do Fluxsis removida com sucesso!');
      }
    } catch (error) {
      console.error('Error deleting Fluxsis config:', error);
      alert('Erro ao remover configuração. Tente novamente.');
    } finally {
      setDeleting(false);
    }
  };

  // Pay2m handlers
  const handlePay2mConfig = () => {
    setShowPay2mModal(true);
  };

  const handleSavePay2mConfig = async () => {
    if (!user || !pay2mConfig.api_key.trim() || !pay2mConfig.secret_key.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const { data: currentConfig } = await PaymentsAPI.getPaymentConfig(user.id);
      const updatedConfig: PaymentIntegrationConfig = {
        ...currentConfig,
        pay2m: {
          api_key: pay2mConfig.api_key,
          secret_key: pay2mConfig.secret_key,
          webhook_url: pay2mConfig.webhook_url,
          configured_at: new Date().toISOString()
        }
      };

      const { error } = await PaymentsAPI.updatePaymentConfig(user.id, updatedConfig);
      
      if (error) {
        console.error('Error saving Pay2m config:', error);
        alert('Erro ao salvar configuração. Tente novamente.');
      } else {
        setIsPay2mConfigured(true);
        setShowPay2mModal(false);
        alert('Configuração do Pay2m salva com sucesso!');
        localStorage.setItem('isPaymentConfigured', 'true');
      }
    } catch (error) {
      console.error('Error saving Pay2m config:', error);
      alert('Erro ao salvar configuração. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePay2mConfig = async () => {
    if (!user) return;

    if (!window.confirm('Tem certeza que deseja remover a configuração do Pay2m?')) {
      return;
    }

    setDeleting(true);
    try {
      const { data: currentConfig } = await PaymentsAPI.getPaymentConfig(user.id);
      const updatedConfig: PaymentIntegrationConfig = { ...currentConfig };
      delete updatedConfig.pay2m;

      const { error } = await PaymentsAPI.updatePaymentConfig(user.id, updatedConfig);
      
      if (error) {
        console.error('Error deleting Pay2m config:', error);
        alert('Erro ao remover configuração. Tente novamente.');
      } else {
        setIsPay2mConfigured(false);
        setPay2mConfig({ api_key: '', secret_key: '', webhook_url: '' });
        setShowPay2mModal(false);
        alert('Configuração do Pay2m removida com sucesso!');
      }
    } catch (error) {
      console.error('Error deleting Pay2m config:', error);
      alert('Erro ao remover configuração. Tente novamente.');
    } finally {
      setDeleting(false);
    }
  };

  // Paggue handlers
  const handlePaggueConfig = () => {
    setShowPaggueModal(true);
  };

  const handleSavePaggueConfig = async () => {
    if (!user || !paggueConfig.api_key.trim() || !paggueConfig.secret_key.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const { data: currentConfig } = await PaymentsAPI.getPaymentConfig(user.id);
      const updatedConfig: PaymentIntegrationConfig = {
        ...currentConfig,
        paggue: {
          api_key: paggueConfig.api_key,
          secret_key: paggueConfig.secret_key,
          webhook_url: paggueConfig.webhook_url,
          configured_at: new Date().toISOString()
        }
      };

      const { error } = await PaymentsAPI.updatePaymentConfig(user.id, updatedConfig);
      
      if (error) {
        console.error('Error saving Paggue config:', error);
        alert('Erro ao salvar configuração. Tente novamente.');
      } else {
        setIsPaggueConfigured(true);
        setShowPaggueModal(false);
        alert('Configuração do Paggue salva com sucesso!');
        localStorage.setItem('isPaymentConfigured', 'true');
      }
    } catch (error) {
      console.error('Error saving Paggue config:', error);
      alert('Erro ao salvar configuração. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaggueConfig = async () => {
    if (!user) return;

    if (!window.confirm('Tem certeza que deseja remover a configuração do Paggue?')) {
      return;
    }

    setDeleting(true);
    try {
      const { data: currentConfig } = await PaymentsAPI.getPaymentConfig(user.id);
      const updatedConfig: PaymentIntegrationConfig = { ...currentConfig };
      delete updatedConfig.paggue;

      const { error } = await PaymentsAPI.updatePaymentConfig(user.id, updatedConfig);
      
      if (error) {
        console.error('Error deleting Paggue config:', error);
        alert('Erro ao remover configuração. Tente novamente.');
      } else {
        setIsPaggueConfigured(false);
        setPaggueConfig({ api_key: '', secret_key: '', webhook_url: '' });
        setShowPaggueModal(false);
        alert('Configuração do Paggue removida com sucesso!');
      }
    } catch (error) {
      console.error('Error deleting Paggue config:', error);
      alert('Erro ao remover configuração. Tente novamente.');
    } finally {
      setDeleting(false);
    }
  };

  // Efi Bank handlers
  const handleEfiBankConfig = () => {
    setShowEfiBankModal(true);
  };

  const handleSaveEfiBankConfig = async () => {
    if (!user || !efiBankConfig.client_id.trim() || !efiBankConfig.client_secret.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const { data: currentConfig } = await PaymentsAPI.getPaymentConfig(user.id);
      const updatedConfig: PaymentIntegrationConfig = {
        ...currentConfig,
        efi_bank: {
          client_id: efiBankConfig.client_id,
          client_secret: efiBankConfig.client_secret,
          webhook_url: efiBankConfig.webhook_url,
          configured_at: new Date().toISOString()
        }
      };

      const { error } = await PaymentsAPI.updatePaymentConfig(user.id, updatedConfig);
      
      if (error) {
        console.error('Error saving Efi Bank config:', error);
        alert('Erro ao salvar configuração. Tente novamente.');
      } else {
        setIsEfiBankConfigured(true);
        setShowEfiBankModal(false);
        alert('Configuração do Efi Bank salva com sucesso!');
        localStorage.setItem('isPaymentConfigured', 'true');
      }
    } catch (error) {
      console.error('Error saving Efi Bank config:', error);
      alert('Erro ao salvar configuração. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEfiBankConfig = async () => {
    if (!user) return;

    if (!window.confirm('Tem certeza que deseja remover a configuração do Efi Bank?')) {
      return;
    }

    setDeleting(true);
    try {
      const { data: currentConfig } = await PaymentsAPI.getPaymentConfig(user.id);
      const updatedConfig: PaymentIntegrationConfig = { ...currentConfig };
      delete updatedConfig.efi_bank;

      const { error } = await PaymentsAPI.updatePaymentConfig(user.id, updatedConfig);
      
      if (error) {
        console.error('Error deleting Efi Bank config:', error);
        alert('Erro ao remover configuração. Tente novamente.');
      } else {
        setIsEfiBankConfigured(false);
        setEfiBankConfig({ client_id: '', client_secret: '', webhook_url: '' });
        setShowEfiBankModal(false);
        alert('Configuração do Efi Bank removida com sucesso!');
      }
    } catch (error) {
      console.error('Error deleting Efi Bank config:', error);
      alert('Erro ao remover configuração. Tente novamente.');
    } finally {
      setDeleting(false);
    }
  };

  const paymentMethods = [
    {
      id: 'fluxsis',
      name: 'Fluxsis',
      logo: '/fluxsis22.png',
      description: 'Pagamentos automáticos via PIX e cartão',
      isConfigured: isFluxsisConfigured,
      onConfigure: handleFluxsisConfig
    },
    {
      id: 'pay2m',
      name: 'Pay2m',
      logo: '/pay2m2.png',
      description: 'Soluções de pagamento digital',
      isConfigured: isPay2mConfigured,
      onConfigure: handlePay2mConfig
    },
    {
      id: 'paggue',
      name: 'Paggue',
      logo: '/paggue2.png',
      description: 'Plataforma de pagamentos online',
      isConfigured: isPaggueConfigured,
      onConfigure: handlePaggueConfig
    },
    {
      id: 'efi_bank',
      name: 'Efi Bank',
      logo: '/efi2.png',
      description: 'Banco digital com soluções de pagamento',
      isConfigured: isEfiBankConfigured,
      onConfigure: handleEfiBankConfig
    }
  ];

  return (
    <div className="min-h-screen bg-transparent text-gray-900 dark:text-white transition-colors duration-300">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleGoBack}
            className="p-2 hover:bg-white/10 dark:hover:bg-gray-800/50 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="h-6 w-6 text-gray-700 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Métodos de Pagamento
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Configure suas integrações para receber pagamentos
            </p>
          </div>
        </div>

        {/* Info Card */}
        <div className="mb-6 rounded-2xl p-4 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/20 dark:border-blue-800/30">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                Receba pagamentos automaticamente
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Configure pelo menos um método de pagamento para começar a vender suas cotas. Todos os pagamentos são processados de forma segura e automática.
              </p>
            </div>
          </div>
        </div>

        {/* Payment Methods Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {paymentMethods.map((method) => (
            <article
              key={method.id}
              className="rounded-2xl p-6 border transition-all duration-200 bg-white/60 dark:bg-gray-900/40 border-gray-200/20 dark:border-gray-700/20 hover:border-purple-500/30 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-200/20 dark:border-gray-700/20 p-2">
                    <img 
                      src={method.logo} 
                      alt={`${method.name} Logo`} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {method.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {method.description}
                    </p>
                    <div className="flex items-center gap-2">
                      {method.isConfigured ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">Conectado</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">Não conectado</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={method.onConfigure}
                className="w-full mt-4 inline-flex items-center justify-center gap-2 animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-[#7928CA] via-[#FF0080] via-[#007CF0] to-[#FF8C00] text-white px-4 py-3 rounded-xl font-semibold shadow-md transition transform hover:-translate-y-0.5"
              >
                <span>Configurar</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </article>
          ))}
        </div>
      </main>

      {/* Fluxsis Modal */}
      {showFluxsisModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200/20 dark:border-gray-700/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Configurar Fluxsis
              </h2>
              <button
                onClick={() => setShowFluxsisModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Configure sua integração com o Fluxsis para receber pagamentos automáticos
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API Key *
                </label>
                <input
                  type="text"
                  value={fluxsisConfig.api_key}
                  onChange={(e) => setFluxsisConfig({ ...fluxsisConfig, api_key: e.target.value })}
                  placeholder="Sua API Key do Fluxsis"
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Secret Key *
                </label>
                <input
                  type="password"
                  value={fluxsisConfig.secret_key}
                  onChange={(e) => setFluxsisConfig({ ...fluxsisConfig, secret_key: e.target.value })}
                  placeholder="Sua Secret Key do Fluxsis"
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={fluxsisConfig.webhook_url}
                  onChange={(e) => setFluxsisConfig({ ...fluxsisConfig, webhook_url: e.target.value })}
                  placeholder="https://seusite.com/webhook/fluxsis"
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              {isFluxsisConfigured && (
                <button
                  onClick={handleDeleteFluxsisConfig}
                  disabled={deleting || loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
                >
                  {deleting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Excluir</span>
                    </>
                  )}
                </button>
              )}
              
              <button
                onClick={handleSaveFluxsisConfig}
                disabled={loading || deleting}
                className={`animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-purple-600 via-blue-500 to-indigo-600 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${
                  isFluxsisConfigured ? 'flex-1' : 'w-full'
                }`}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <span>Salvar</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay2m Modal */}
      {showPay2mModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200/20 dark:border-gray-700/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Configurar Pay2m
              </h2>
              <button
                onClick={() => setShowPay2mModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Configure sua integração com o Pay2m para receber pagamentos automáticos
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API Key *
                </label>
                <input
                  type="text"
                  value={pay2mConfig.api_key}
                  onChange={(e) => setPay2mConfig({ ...pay2mConfig, api_key: e.target.value })}
                  placeholder="Sua API Key do Pay2m"
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Secret Key *
                </label>
                <input
                  type="password"
                  value={pay2mConfig.secret_key}
                  onChange={(e) => setPay2mConfig({ ...pay2mConfig, secret_key: e.target.value })}
                  placeholder="Sua Secret Key do Pay2m"
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={pay2mConfig.webhook_url}
                  onChange={(e) => setPay2mConfig({ ...pay2mConfig, webhook_url: e.target.value })}
                  placeholder="https://seusite.com/webhook/pay2m"
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              {isPay2mConfigured && (
                <button
                  onClick={handleDeletePay2mConfig}
                  disabled={deleting || loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
                >
                  {deleting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Excluir</span>
                    </>
                  )}
                </button>
              )}
              
              <button
                onClick={handleSavePay2mConfig}
                disabled={loading || deleting}
                className={`animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-purple-600 via-blue-500 to-indigo-600 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${
                  isPay2mConfigured ? 'flex-1' : 'w-full'
                }`}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <span>Salvar</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paggue Modal */}
      {showPaggueModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200/20 dark:border-gray-700/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Configurar Paggue
              </h2>
              <button
                onClick={() => setShowPaggueModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Configure sua integração com o Paggue para receber pagamentos automáticos
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API Key *
                </label>
                <input
                  type="text"
                  value={paggueConfig.api_key}
                  onChange={(e) => setPaggueConfig({ ...paggueConfig, api_key: e.target.value })}
                  placeholder="Sua API Key do Paggue"
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Secret Key *
                </label>
                <input
                  type="password"
                  value={paggueConfig.secret_key}
                  onChange={(e) => setPaggueConfig({ ...paggueConfig, secret_key: e.target.value })}
                  placeholder="Sua Secret Key do Paggue"
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={paggueConfig.webhook_url}
                  onChange={(e) => setPaggueConfig({ ...paggueConfig, webhook_url: e.target.value })}
                  placeholder="https://seusite.com/webhook/paggue"
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              {isPaggueConfigured && (
                <button
                  onClick={handleDeletePaggueConfig}
                  disabled={deleting || loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
                >
                  {deleting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Excluir</span>
                    </>
                  )}
                </button>
              )}
              
              <button
                onClick={handleSavePaggueConfig}
                disabled={loading || deleting}
                className={`animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-purple-600 via-blue-500 to-indigo-600 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${
                  isPaggueConfigured ? 'flex-1' : 'w-full'
                }`}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <span>Salvar</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Efi Bank Modal */}
      {showEfiBankModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200/20 dark:border-gray-700/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Configurar Efi Bank
              </h2>
              <button
                onClick={() => setShowEfiBankModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Configure sua integração com o Efi Bank para receber pagamentos automáticos
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Client ID *
                </label>
                <input
                  type="text"
                  value={efiBankConfig.client_id}
                  onChange={(e) => setEfiBankConfig({ ...efiBankConfig, client_id: e.target.value })}
                  placeholder="Seu Client ID do Efi Bank"
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Client Secret *
                </label>
                <input
                  type="password"
                  value={efiBankConfig.client_secret}
                  onChange={(e) => setEfiBankConfig({ ...efiBankConfig, client_secret: e.target.value })}
                  placeholder="Seu Client Secret do Efi Bank"
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={efiBankConfig.webhook_url}
                  onChange={(e) => setEfiBankConfig({ ...efiBankConfig, webhook_url: e.target.value })}
                  placeholder="https://seusite.com/webhook/efibank"
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              {isEfiBankConfigured && (
                <button
                  onClick={handleDeleteEfiBankConfig}
                  disabled={deleting || loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
                >
                  {deleting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Excluir</span>
                    </>
                  )}
                </button>
              )}
              
              <button
                onClick={handleSaveEfiBankConfig}
                disabled={loading || deleting}
                className={`animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-purple-600 via-blue-500 to-indigo-600 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${
                  isEfiBankConfigured ? 'flex-1' : 'w-full'
                }`}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <span>Salvar</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentIntegrationsPage;