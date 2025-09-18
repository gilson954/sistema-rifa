// PaymentIntegrationsPage_removed_mercado.tsx
import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  AlertCircle,
  Trash2,
  X,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const PaymentIntegrationsPage: React.FC = () => {
  // Estados de carregamento / feedback
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fluxsis
  const [showFluxsisModal, setShowFluxsisModal] = useState(false);
  const [fluxsisConfig, setFluxsisConfig] = useState({
    api_key: '',
    secret_key: '',
    webhook_url: ''
  });
  const [isFluxsisConfigured, setIsFluxsisConfigured] = useState(false);

  // Pay2m
  const [showPay2mModal, setShowPay2mModal] = useState(false);
  const [pay2mConfig, setPay2mConfig] = useState({
    api_key: '',
    secret_key: '',
    webhook_url: ''
  });
  const [isPay2mConfigured, setIsPay2mConfigured] = useState(false);

  // Paggue
  const [showPaggueModal, setShowPaggueModal] = useState(false);
  const [paggueConfig, setPaggueConfig] = useState({
    api_key: '',
    secret_key: '',
    webhook_url: ''
  });
  const [isPaggueConfigured, setIsPaggueConfigured] = useState(false);

  // Efi Bank
  const [showEfiBankModal, setShowEfiBankModal] = useState(false);
  const [efiBankConfig, setEfiBankConfig] = useState({
    client_id: '',
    client_secret: '',
    webhook_url: ''
  });
  const [isEfiBankConfigured, setIsEfiBankConfigured] = useState(false);

  // Carrega configurações de pagamentos quando o componente monta
  useEffect(() => {
    const loadPaymentConfig = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('payment_integrations')
          .select('*')
          .maybeSingle();

        if (error) {
          console.error('Error loading payment integrations config:', error);
        } else if (data) {
          // Fluxsis
          if (data.fluxsis) {
            setFluxsisConfig({
              api_key: data.fluxsis.api_key || '',
              secret_key: data.fluxsis.secret_key || '',
              webhook_url: data.fluxsis.webhook_url || ''
            });
            setIsFluxsisConfigured(true);
          }

          // Pay2m
          if (data.pay2m) {
            setPay2mConfig({
              api_key: data.pay2m.api_key || '',
              secret_key: data.pay2m.secret_key || '',
              webhook_url: data.pay2m.webhook_url || ''
            });
            setIsPay2mConfigured(true);
          }

          // Paggue
          if (data.paggue) {
            setPaggueConfig({
              api_key: data.paggue.api_key || '',
              secret_key: data.paggue.secret_key || '',
              webhook_url: data.paggue.webhook_url || ''
            });
            setIsPaggueConfigured(true);
          }

          // Efi Bank
          if (data.efi_bank) {
            setEfiBankConfig({
              client_id: data.efi_bank.client_id || '',
              client_secret: data.efi_bank.client_secret || '',
              webhook_url: data.efi_bank.webhook_url || ''
            });
            setIsEfiBankConfigured(true);
          }
        }
      } catch (error) {
        console.error('Error loading payment integrations config:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPaymentConfig();
  }, []);

  // Fluxsis handlers
  const handleFluxsisConfig = () => {
    setShowFluxsisModal(true);
  };

  const handleSaveFluxsisConfig = async () => {
    setLoading(true);
    try {
      // Salva no banco (exemplo)
      const { error } = await supabase
        .from('payment_integrations')
        .upsert({
          id: 1,
          fluxsis: fluxsisConfig
        });

      if (error) throw error;
      setIsFluxsisConfigured(true);
      setShowFluxsisModal(false);
    } catch (err) {
      console.error('Erro ao salvar Fluxsis config:', err);
      alert('Erro ao salvar configuração do Fluxsis.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFluxsisConfig = async () => {
    setDeleting(true);
    try {
      // Fetch existing
      const { data: existing, error: fetchError } = await supabase
        .from('payment_integrations')
        .select('*')
        .maybeSingle();
      if (fetchError) throw fetchError;

      const updated = {
        ...existing,
        fluxsis: null
      };

      const { error } = await supabase
        .from('payment_integrations')
        .upsert(updated);

      if (error) throw error;

      setIsFluxsisConfigured(false);
      setFluxsisConfig({ api_key: '', secret_key: '', webhook_url: '' });
      setShowFluxsisModal(false);
    } catch (err) {
      console.error('Erro ao deletar Fluxsis config:', err);
      alert('Erro ao excluir configuração do Fluxsis.');
    } finally {
      setDeleting(false);
    }
  };

  // Pay2m handlers
  const handlePay2mConfig = () => {
    setShowPay2mModal(true);
  };

  const handleSavePay2mConfig = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('payment_integrations')
        .upsert({
          id: 1,
          pay2m: pay2mConfig
        });

      if (error) throw error;
      setIsPay2mConfigured(true);
      setShowPay2mModal(false);
    } catch (err) {
      console.error('Erro ao salvar Pay2m config:', err);
      alert('Erro ao salvar configuração do Pay2m.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePay2mConfig = async () => {
    setDeleting(true);
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('payment_integrations')
        .select('*')
        .maybeSingle();
      if (fetchError) throw fetchError;

      const updated = {
        ...existing,
        pay2m: null
      };

      const { error } = await supabase
        .from('payment_integrations')
        .upsert(updated);

      if (error) throw error;

      setIsPay2mConfigured(false);
      setPay2mConfig({ api_key: '', secret_key: '', webhook_url: '' });
      setShowPay2mModal(false);
    } catch (err) {
      console.error('Erro ao deletar Pay2m config:', err);
      alert('Erro ao excluir configuração do Pay2m.');
    } finally {
      setDeleting(false);
    }
  };

  // Paggue handlers
  const handlePaggueConfig = () => {
    setShowPaggueModal(true);
  };

  const handleSavePaggueConfig = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('payment_integrations')
        .upsert({
          id: 1,
          paggue: paggueConfig
        });

      if (error) throw error;
      setIsPaggueConfigured(true);
      setShowPaggueModal(false);
    } catch (err) {
      console.error('Erro ao salvar Paggue config:', err);
      alert('Erro ao salvar configuração do Paggue.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaggueConfig = async () => {
    setDeleting(true);
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('payment_integrations')
        .select('*')
        .maybeSingle();
      if (fetchError) throw fetchError;

      const updated = {
        ...existing,
        paggue: null
      };

      const { error } = await supabase
        .from('payment_integrations')
        .upsert(updated);

      if (error) throw error;

      setIsPaggueConfigured(false);
      setPaggueConfig({ api_key: '', secret_key: '', webhook_url: '' });
      setShowPaggueModal(false);
    } catch (err) {
      console.error('Erro ao deletar Paggue config:', err);
      alert('Erro ao excluir configuração do Paggue.');
    } finally {
      setDeleting(false);
    }
  };

  // Efi Bank handlers
  const handleEfiBankConfig = () => {
    setShowEfiBankModal(true);
  };

  const handleSaveEfiBankConfig = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('payment_integrations')
        .upsert({
          id: 1,
          efi_bank: efiBankConfig
        });

      if (error) throw error;
      setIsEfiBankConfigured(true);
      setShowEfiBankModal(false);
    } catch (err) {
      console.error('Erro ao salvar Efi Bank config:', err);
      alert('Erro ao salvar configuração do Efi Bank.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEfiBankConfig = async () => {
    setDeleting(true);
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('payment_integrations')
        .select('*')
        .maybeSingle();
      if (fetchError) throw fetchError;

      const updated = {
        ...existing,
        efi_bank: null
      };

      const { error } = await supabase
        .from('payment_integrations')
        .upsert(updated);

      if (error) throw error;

      setIsEfiBankConfigured(false);
      setEfiBankConfig({ client_id: '', client_secret: '', webhook_url: '' });
      setShowEfiBankModal(false);
    } catch (err) {
      console.error('Erro ao deletar Efi Bank config:', err);
      alert('Erro ao excluir configuração do Efi Bank.');
    } finally {
      setDeleting(false);
    }
  };

  // Render
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Métodos de pagamentos</h1>

      <div className="grid gap-4">
        {/* Fluxsis */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors duration-200">
          <div className="flex items-center space-x-4">
            <img 
              src="https://fluxsis.com.br/wp-content/uploads/2023/09/logo-fluxsis-horizontal-preto.png" 
              alt="Fluxsis Logo" 
              className="w-12 h-12 object-contain"
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Fluxsis
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pagamentos automáticos via PIX e cartão
              </p>
              <div className="flex items-center space-x-2 mt-2">
                {isFluxsisConfigured ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600 dark:text-green-400">Conectado</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Não conectado</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleFluxsisConfig}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Configurar
          </button>
        </div>

        {/* Pay2m */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors duration-200">
          <div className="flex items-center space-x-4">
            <img 
              src="https://pay2m.com.br/wp-content/uploads/2023/03/logo-pay2m-horizontal.png" 
              alt="Pay2m Logo" 
              className="w-12 h-12 object-contain"
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Pay2m
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Soluções de pagamento digital
              </p>
              <div className="flex items-center space-x-2 mt-2">
                {isPay2mConfigured ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600 dark:text-green-400">Conectado</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Não conectado</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handlePay2mConfig}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Configurar
          </button>
        </div>

        {/* Paggue */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors duration-200">
          <div className="flex items-center space-x-4">
            <img 
              src="https://paggue.io/wp-content/uploads/2023/03/logo-paggue-horizontal.png" 
              alt="Paggue Logo" 
              className="w-12 h-12 object-contain"
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Paggue
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Plataforma de pagamentos online
              </p>
              <div className="flex items-center space-x-2 mt-2">
                {isPaggueConfigured ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600 dark:text-green-400">Conectado</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Não conectado</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handlePaggueConfig}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Configurar
          </button>
        </div>

        {/* Efi Bank */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors duration-200">
          <div className="flex items-center space-x-4">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/a/a7/Efi-bank-logo.png" 
              alt="Efi Bank Logo" 
              className="w-12 h-12 object-contain"
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Efi Bank
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Banco digital com soluções de pagamento
              </p>
              <div className="flex items-center space-x-2 mt-2">
                {isEfiBankConfigured ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600 dark:text-green-400">Conectado</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Não conectado</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleEfiBankConfig}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Configurar
          </button>
        </div>
      </div>

      {/* Fluxsis Modal */}
      {showFluxsisModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Configurar Fluxsis
              </h2>
              <button
                onClick={() => setShowFluxsisModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
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

            <div className="flex space-x-3 mt-6">
              {isFluxsisConfigured && (
                <button
                  onClick={handleDeleteFluxsisConfig}
                  disabled={deleting || loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {deleting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
                className={`bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 ${
                  isFluxsisConfigured ? 'flex-1' : 'w-full'
                }`}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Configurar Pay2m
              </h2>
              <button
                onClick={() => setShowPay2mModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
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

            <div className="flex space-x-3 mt-6">
              {isPay2mConfigured && (
                <button
                  onClick={handleDeletePay2mConfig}
                  disabled={deleting || loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {deleting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
                className={`bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 ${
                  isPay2mConfigured ? 'flex-1' : 'w-full'
                }`}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Configurar Paggue
              </h2>
              <button
                onClick={() => setShowPaggueModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
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

            <div className="flex space-x-3 mt-6">
              {isPaggueConfigured && (
                <button
                  onClick={handleDeletePaggueConfig}
                  disabled={deleting || loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {deleting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
                className={`bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 ${
                  isPaggueConfigured ? 'flex-1' : 'w-full'
                }`}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Configurar Efi Bank
              </h2>
              <button
                onClick={() => setShowEfiBankModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
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

            <div className="flex space-x-3 mt-6">
              {isEfiBankConfigured && (
                <button
                  onClick={handleDeleteEfiBankConfig}
                  disabled={deleting || loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {deleting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
                className={`bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 ${
                  isEfiBankConfigured ? 'flex-1' : 'w-full'
                }`}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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

export default PaymentIntegrationsPage_removed_mercado;
