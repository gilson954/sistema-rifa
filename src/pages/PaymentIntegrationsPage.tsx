import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, X, ArrowRight, Check, AlertCircle, Copy, ExternalLink, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const PaymentIntegrationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [isMercadoPagoModalOpen, setIsMercadoPagoModalOpen] = useState(false);
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState('cpf');
  const [isPaymentConfigured, setIsPaymentConfigured] = useState(false);
  const [isFluxsisModalOpen, setIsFluxsisModalOpen] = useState(false);
  const [isPay2mModalOpen, setIsPay2mModalOpen] = useState(false);
  const [showPaggueModal, setShowPaggueModal] = useState(false);
  const [mercadoPagoConfig, setMercadoPagoConfig] = useState({
    clientId: '',
    clientSecret: '',
    accessToken: '',
    webhookUrl: ''
  });
  const [isMercadoPagoConfigured, setIsMercadoPagoConfigured] = useState(false);
  const [fluxsisConfig, setFluxsisConfig] = useState({
    apiKey: '',
    secretKey: '',
    webhookUrl: ''
  });
  const [paggueConfig, setPaggueConfig] = useState({
    apiKey: '',
    secretKey: ''
  });
  const [isFluxsisConfigured, setIsFluxsisConfigured] = useState(false);
  const [pay2mConfig, setPay2mConfig] = useState({
    apiKey: '',
    secretKey: '',
    webhookUrl: ''
  });
  
  const [isPay2mConfigured, setIsPay2mConfigured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copySuccessFluxsis, setCopySuccessFluxsis] = useState(false);
  const [copySuccessPay2m, setCopySuccessPay2m] = useState(false);

  // Check if payment is configured on component mount
  useEffect(() => {
    const configured = localStorage.getItem('isPaymentConfigured');
    if (configured) {
      try {
        setIsPaymentConfigured(JSON.parse(configured));
      } catch (error) {
        console.error('Error parsing payment configuration status:', error);
      }
    }
  }, []);

  // Load Mercado Pago configuration
  useEffect(() => {
    const loadPaymentConfigs = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('payment_integrations_config')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error loading payment integrations:', error);
          return;
        }

        const config = data?.payment_integrations_config || {};
        const mercadoPago = config.mercado_pago || {};
        const fluxsis = config.fluxsis || {};
        const pay2m = config.pay2m || {};
        
        if (mercadoPago.client_id || mercadoPago.access_token) {
          setIsMercadoPagoConfigured(true);
          setMercadoPagoConfig({
            clientId: mercadoPago.client_id || '',
            clientSecret: mercadoPago.client_secret || '',
            accessToken: mercadoPago.access_token || '',
            webhookUrl: mercadoPago.webhook_url || ''
          });
        }

        if (fluxsis.api_key) {
          setIsFluxsisConfigured(true);
          setFluxsisConfig({
            apiKey: fluxsis.api_key || '',
            secretKey: fluxsis.secret_key || '',
            webhookUrl: fluxsis.webhook_url || ''
          });
        }

        if (pay2m.api_key) {
          setIsPay2mConfigured(true);
          setPay2mConfig({
            apiKey: pay2m.api_key || '',
            secretKey: pay2m.secret_key || '',
            webhookUrl: pay2m.webhook_url || ''
          });
        }
      } catch (error) {
        console.error('Error loading payment configs:', error);
      }
    };

    loadPaymentConfigs();
  }, [user]);

  // Generate webhook URL
  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mercado-pago-webhook`;
  const fluxsisWebhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fluxsis-webhook`;
  const pay2mWebhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pay2m-webhook`;

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  const handlePixConfiguration = () => {
    setIsPixModalOpen(true);
  };

  const handleSavePixConfiguration = () => {
    if (pixKey.trim()) {
      // Save PIX configuration
      console.log('PIX Key:', pixKey, 'Type:', pixKeyType);
      
      // Mark payment as configured
      setIsPaymentConfigured(true);
      localStorage.setItem('isPaymentConfigured', 'true');
      
      setIsPixModalOpen(false);
      setPixKey('');
      setPixKeyType('cpf');
    }
  };

  const handleClosePixModal = () => {
    setIsPixModalOpen(false);
    setPixKey('');
    setPixKeyType('cpf');
  };

  const handleMercadoPagoConfiguration = () => {
    setMercadoPagoConfig(prev => ({ ...prev, webhookUrl }));
    setIsMercadoPagoModalOpen(true);
  };

  const handleFluxsisConfiguration = () => {
    setFluxsisConfig(prev => ({ ...prev, webhookUrl: fluxsisWebhookUrl }));
    setIsFluxsisModalOpen(true);
  };

  const handlePay2mConfiguration = () => {
    setPay2mConfig(prev => ({ ...prev, webhookUrl: pay2mWebhookUrl }));
    setIsPay2mModalOpen(true);
  };

  const handleSaveMercadoPagoConfiguration = async () => {
    if (!user || (!mercadoPagoConfig.clientId.trim() && !mercadoPagoConfig.accessToken.trim())) {
      alert('Por favor, preencha pelo menos o Client ID ou Access Token');
      return;
    }

    setLoading(true);
    try {
      // Get current payment integrations config
      const { data: currentData, error: fetchError } = await supabase
        .from('profiles')
        .select('payment_integrations_config')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching current config:', fetchError);
        alert('Erro ao carregar configurações. Tente novamente.');
        return;
      }

      const currentConfig = currentData?.payment_integrations_config || {};
      
      // Update Mercado Pago configuration
      const updatedConfig = {
        ...currentConfig,
        mercado_pago: {
          client_id: mercadoPagoConfig.clientId.trim(),
          client_secret: mercadoPagoConfig.clientSecret.trim(),
          access_token: mercadoPagoConfig.accessToken.trim(),
          webhook_url: webhookUrl,
          configured_at: new Date().toISOString()
        }
      };

      // Save to database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ payment_integrations_config: updatedConfig })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error saving Mercado Pago config:', updateError);
        alert('Erro ao salvar configuração. Tente novamente.');
        return;
      }

      setIsMercadoPagoConfigured(true);
      setIsMercadoPagoModalOpen(false);
      alert('Configuração do Mercado Pago salva com sucesso!');
      
    } catch (error) {
      console.error('Error saving Mercado Pago config:', error);
      alert('Erro ao salvar configuração. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFluxsisConfiguration = async () => {
    if (!user || !fluxsisConfig.apiKey.trim()) {
      alert('Por favor, preencha a API Key');
      return;
    }

    setLoading(true);
    try {
      // Get current payment integrations config
      const { data: currentData, error: fetchError } = await supabase
        .from('profiles')
        .select('payment_integrations_config')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching current config:', fetchError);
        alert('Erro ao carregar configurações. Tente novamente.');
        return;
      }

      const currentConfig = currentData?.payment_integrations_config || {};
      
      // Update Fluxsis configuration
      const updatedConfig = {
        ...currentConfig,
        fluxsis: {
          api_key: fluxsisConfig.apiKey.trim(),
          secret_key: fluxsisConfig.secretKey.trim(),
          webhook_url: fluxsisWebhookUrl,
          configured_at: new Date().toISOString()
        }
      };

      // Save to database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ payment_integrations_config: updatedConfig })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error saving Fluxsis config:', updateError);
        alert('Erro ao salvar configuração. Tente novamente.');
        return;
      }

      setIsFluxsisConfigured(true);
      setIsFluxsisModalOpen(false);
      alert('Configuração do Fluxsis salva com sucesso!');
      
    } catch (error) {
      console.error('Error saving Fluxsis config:', error);
      alert('Erro ao salvar configuração. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePaggue = async () => {
    if (!paggueConfig.apiKey.trim() || !paggueConfig.secretKey.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const { data: currentConfig } = await PaymentsAPI.getPaymentConfig(user!.id);
      
      const updatedConfig = {
        ...currentConfig,
        paggue: {
          api_key: paggueConfig.apiKey.trim(),
          secret_key: paggueConfig.secretKey.trim(),
          webhook_url: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paggue-webhook`,
          configured_at: new Date().toISOString()
        }
      };

      const { error } = await PaymentsAPI.updatePaymentConfig(user!.id, updatedConfig);
      
      if (error) {
        console.error('Error saving Paggue config:', error);
        alert('Erro ao salvar configuração. Tente novamente.');
      } else {
        alert('Configuração do Paggue salva com sucesso!');
        setShowPaggueModal(false);
        loadPaymentConfig(); // Reload to update UI
      }
    } catch (error) {
      console.error('Error saving Paggue config:', error);
      alert('Erro ao salvar configuração. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePay2mConfiguration = async () => {
    if (!user || !pay2mConfig.apiKey.trim()) {
      alert('Por favor, preencha a API Key');
      return;
    }

    setLoading(true);
    try {
      // Get current payment integrations config
      const { data: currentData, error: fetchError } = await supabase
        .from('profiles')
        .select('payment_integrations_config')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching current config:', fetchError);
        alert('Erro ao carregar configurações. Tente novamente.');
        return;
      }

      const currentConfig = currentData?.payment_integrations_config || {};
      
      // Update Pay2m configuration
      const updatedConfig = {
        ...currentConfig,
        pay2m: {
          api_key: pay2mConfig.apiKey.trim(),
          secret_key: pay2mConfig.secretKey.trim(),
          webhook_url: pay2mWebhookUrl,
          configured_at: new Date().toISOString()
        }
      };

      // Save to database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ payment_integrations_config: updatedConfig })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error saving Pay2m config:', updateError);
        alert('Erro ao salvar configuração. Tente novamente.');
        return;
      }

      setIsPay2mConfigured(true);
      setIsPay2mModalOpen(false);
      alert('Configuração do Pay2m salva com sucesso!');
      
    } catch (error) {
      console.error('Error saving Pay2m config:', error);
      alert('Erro ao salvar configuração. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseMercadoPagoModal = () => {
    setIsMercadoPagoModalOpen(false);
    setMercadoPagoConfig({
      clientId: '',
      clientSecret: '',
      accessToken: '',
      webhookUrl: ''
    });
  };

  const handleCloseFluxsisModal = () => {
    setIsFluxsisModalOpen(false);
    setFluxsisConfig({
      apiKey: '',
      secretKey: '',
      webhookUrl: ''
    });
  };

  const handleClosePay2mModal = () => {
    setIsPay2mModalOpen(false);
    setPay2mConfig({
      apiKey: '',
      secretKey: '',
      webhookUrl: ''
    });
  };

  const handleCopyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('Erro ao copiar URL. Tente selecionar e copiar manualmente.');
    }
  };

  const handleCopyFluxsisWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(fluxsisWebhookUrl);
      setCopySuccessFluxsis(true);
      setTimeout(() => setCopySuccessFluxsis(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('Erro ao copiar URL. Tente selecionar e copiar manualmente.');
    }
  };

  const handleCopyPay2mWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(pay2mWebhookUrl);
      setCopySuccessPay2m(true);
      setTimeout(() => setCopySuccessPay2m(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('Erro ao copiar URL. Tente selecionar e copiar manualmente.');
    }
  };

  const formatPixKey = (value: string, type: string) => {
    // Remove all non-numeric characters for CPF/CNPJ
    if (type === 'cpf' || type === 'cnpj') {
      const numbers = value.replace(/\D/g, '');
      
      if (type === 'cpf') {
        // Format CPF: 000.000.000-00
        return numbers
          .slice(0, 11)
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d{1,2})/, '$1-$2');
      } else {
        // Format CNPJ: 00.000.000/0000-00
        return numbers
          .slice(0, 14)
          .replace(/(\d{2})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1/$2')
          .replace(/(\d{4})(\d{1,2})/, '$1-$2');
      }
    }
    
    // For email and phone, return as is
    return value;
  };

  const handlePixKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = formatPixKey(value, pixKeyType);
    setPixKey(formattedValue);
  };

  const getPixKeyPlaceholder = (type: string) => {
    switch (type) {
      case 'cpf':
        return '000.000.000-00';
      case 'cnpj':
        return '00.000.000/0000-00';
      case 'email':
        return 'seu@email.com';
      case 'phone':
        return '(11) 99999-9999';
      case 'random':
        return 'Chave aleatória';
      default:
        return '';
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg border border-gray-200 dark:border-gray-800 transition-colors duration-300">
        {/* Header */}
        <div className="flex items-center space-x-4 p-6 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={handleGoBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
          <h1 className="text-xl font-medium text-gray-900 dark:text-white">
            Métodos de pagamentos
          </h1>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* PIX Manual Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              PIX manual
            </h2>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors duration-200">
              <div className="flex items-center space-x-4 min-w-0 flex-1">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">₽</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-base font-medium text-gray-900 dark:text-white">PIX</span>
                    {isPaymentConfigured && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        <Check className="w-3 h-3 mr-1" />
                        Configurado
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate px-1">
                    Receba pagamentos via PIX de forma manual
                  </p>
                </div>
              </div>
              <button 
                onClick={handlePixConfiguration}
                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                {isPaymentConfigured ? 'Editar' : 'Configurar'}
              </button>
            </div>
          </div>

          {/* Baixa automática Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Baixa automática
            </h2>
            
            <div className="space-y-4">
              {/* Fluxsis */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors duration-200">
                <div className="flex items-center space-x-4 min-w-0 flex-1">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">FX</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-base font-medium text-gray-900 dark:text-white">Fluxsis</span>
                      {isFluxsisConfigured && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          <Check className="w-3 h-3 mr-1" />
                          Configurado
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate px-1">
                      Pagamentos automáticos via PIX e cartão
                    </p>
                  </div>
                </div>
                <button 
                  onClick={handleFluxsisConfiguration}
                  className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  {isFluxsisConfigured ? 'Editar' : 'Configurar'}
                </button>
              </div>

              {/* Pay2m */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors duration-200">
                <div className="flex items-center space-x-4 min-w-0 flex-1">
                  <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">P2</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-base font-medium text-gray-900 dark:text-white">Pay2m</span>
                      {isPay2mConfigured && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          <Check className="w-3 h-3 mr-1" />
                          Configurado
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate px-1">
                      Soluções de pagamento digital
                    </p>
                  </div>
                </div>
                <button 
                  onClick={handlePay2mConfiguration}
                  className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  {isPay2mConfigured ? 'Editar' : 'Configurar'}
                </button>
              </div>

              {/* Paggue */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors duration-200">
                <div className="flex items-center space-x-4 min-w-0 flex-1">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">PG</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate px-1">Paggue</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate px-1">
                      Plataforma de pagamentos online
                    </p>
                  </div>
                </div>
                <button className="w-full sm:w-auto bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
                  Configurar
                </button>
              </div>

              {/* Mercado Pago */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors duration-200">
                <div className="flex items-center space-x-4 min-w-0 flex-1">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">MP</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-base font-medium text-gray-900 dark:text-white">Mercado Pago</span>
                      {isMercadoPagoConfigured && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          <Check className="w-3 h-3 mr-1" />
                          Configurado
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate px-1">
                      Pagamentos automáticos via PIX e cartão
                    </p>
                  </div>
                </div>
                <button 
                  onClick={handleMercadoPagoConfiguration}
                  className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  {isMercadoPagoConfigured ? 'Editar' : 'Configurar'}
                </button>
              </div>

              {/* Efí Bank */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors duration-200">
                <div className="flex items-center space-x-4 min-w-0 flex-1">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">EF</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate px-1">Efí Bank</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate px-1">
                      Banco digital com soluções de pagamento
                    </p>
                  </div>
                </div>
                <button className="w-full sm:w-auto bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
                  Configurar
                </button>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-6 transition-colors duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Precisa de ajuda?
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  Nossa equipe está pronta para ajudar você a configurar seus métodos de pagamento. 
                  Entre em contato conosco para suporte personalizado.
                </p>
              </div>
              <button className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200">
                Falar com Suporte
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PIX Configuration Modal */}
      {isPixModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Configurar PIX
              </h2>
              <button
                onClick={handleClosePixModal}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Configure sua chave PIX para receber pagamentos
            </p>

            <div className="space-y-4">
              {/* PIX Key Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de chave PIX
                </label>
                <select
                  value={pixKeyType}
                  onChange={(e) => {
                    setPixKeyType(e.target.value);
                    setPixKey(''); // Clear the key when type changes
                  }}
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                >
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="email">E-mail</option>
                  <option value="phone">Telefone</option>
                  <option value="random">Chave aleatória</option>
                </select>
              </div>

              {/* PIX Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chave PIX
                </label>
                <input
                  type="text"
                  value={pixKey}
                  onChange={handlePixKeyChange}
                  placeholder={getPixKeyPlaceholder(pixKeyType)}
                  className="w-full bg-white dark:bg-gray-700 border border-purple-500 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                />
              </div>
            </div>

            <button
              onClick={handleSavePixConfiguration}
              disabled={!pixKey.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 mt-6"
            >
              <span>Salvar configuração</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mercado Pago Configuration Modal */}
      {isMercadoPagoModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Configurar Mercado Pago
              </h2>
              <button
                onClick={handleCloseMercadoPagoModal}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Configure suas credenciais do Mercado Pago para receber pagamentos automáticos
            </p>

            <div className="space-y-6">
              {/* Webhook URL Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL do Webhook
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={webhookUrl}
                    readOnly
                    className="flex-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white text-sm"
                  />
                  <button
                    onClick={handleCopyWebhookUrl}
                    className="px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Copy className="h-4 w-4" />
                    <span>{copySuccess ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Configure esta URL no painel do Mercado Pago para receber notificações de pagamento
                </p>
              </div>

              {/* Credentials Section */}
              <div className="space-y-4">
                <h3 className="text-md font-medium text-gray-900 dark:text-white">
                  Credenciais da Aplicação
                </h3>
                
                {/* Client ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Client ID
                  </label>
                  <input
                    type="text"
                    value={mercadoPagoConfig.clientId}
                    onChange={(e) => setMercadoPagoConfig({ ...mercadoPagoConfig, clientId: e.target.value })}
                    placeholder="Seu Client ID do Mercado Pago"
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                  />
                </div>

                {/* Client Secret */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Client Secret
                  </label>
                  <input
                    type="password"
                    value={mercadoPagoConfig.clientSecret}
                    onChange={(e) => setMercadoPagoConfig({ ...mercadoPagoConfig, clientSecret: e.target.value })}
                    placeholder="Seu Client Secret do Mercado Pago"
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                  />
                </div>

                {/* Access Token */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Access Token (Opcional)
                  </label>
                  <input
                    type="password"
                    value={mercadoPagoConfig.accessToken}
                    onChange={(e) => setMercadoPagoConfig({ ...mercadoPagoConfig, accessToken: e.target.value })}
                    placeholder="Seu Access Token do Mercado Pago"
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Use o Access Token para testes ou quando não tiver Client ID/Secret
                  </p>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Como configurar no Mercado Pago
                </h4>
                <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                  <li>Acesse o <a href="https://www.mercadopago.com.br/developers" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">painel de desenvolvedores</a></li>
                  <li>Crie uma nova aplicação ou use uma existente</li>
                  <li>Copie o Client ID e Client Secret da sua aplicação</li>
                  <li>Configure a URL do webhook nas notificações IPN</li>
                  <li>Cole as credenciais nos campos acima e salve</li>
                </ol>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCloseMercadoPagoModal}
                disabled={loading}
                className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Cancelar
              </button>
              
              <button
                onClick={handleSaveMercadoPagoConfiguration}
                disabled={loading || (!mercadoPagoConfig.clientId.trim() && !mercadoPagoConfig.accessToken.trim())}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <span>Salvar configuração</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fluxsis Configuration Modal */}
      {isFluxsisModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Configurar Fluxsis
              </h2>
              <button
                onClick={handleCloseFluxsisModal}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Configure suas credenciais do Fluxsis para receber pagamentos automáticos
            </p>

            <div className="space-y-6">
              {/* Webhook URL Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL do Webhook
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={fluxsisWebhookUrl}
                    readOnly
                    className="flex-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white text-sm"
                  />
                  <button
                    onClick={handleCopyFluxsisWebhookUrl}
                    className="px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Copy className="h-4 w-4" />
                    <span>{copySuccessFluxsis ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Configure esta URL no painel do Fluxsis para receber notificações de pagamento
                </p>
              </div>

              {/* Credentials Section */}
              <div className="space-y-4">
                <h3 className="text-md font-medium text-gray-900 dark:text-white">
                  Credenciais da API
                </h3>
                
                {/* API Key */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    API Key *
                  </label>
                  <input
                    type="password"
                    value={fluxsisConfig.apiKey}
                    onChange={(e) => setFluxsisConfig({ ...fluxsisConfig, apiKey: e.target.value })}
                    placeholder="Sua API Key do Fluxsis"
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                  />
                </div>

                {/* Secret Key */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Secret Key
                  </label>
                  <input
                    type="password"
                    value={fluxsisConfig.secretKey}
                    onChange={(e) => setFluxsisConfig({ ...fluxsisConfig, secretKey: e.target.value })}
                    placeholder="Sua Secret Key do Fluxsis"
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                  />
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Como configurar no Fluxsis
                </h4>
                <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                  <li>Acesse o <a href="https://fluxsis.com.br" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">painel do Fluxsis</a></li>
                  <li>Vá para a seção de "Integrações" ou "API"</li>
                  <li>Copie sua API Key e Secret Key</li>
                  <li>Configure a URL do webhook nas notificações</li>
                  <li>Cole as credenciais nos campos acima e salve</li>
                </ol>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCloseFluxsisModal}
                disabled={loading}
                className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Cancelar
              </button>
              
              <button
                onClick={handleSaveFluxsisConfiguration}
                disabled={loading || !fluxsisConfig.apiKey.trim()}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <span>Salvar configuração</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay2m Configuration Modal */}
      {isPay2mModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Configurar Pay2m
              </h2>
              <button
                onClick={handleClosePay2mModal}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Configure suas credenciais do Pay2m para receber pagamentos automáticos
            </p>

            <div className="space-y-6">
              {/* Webhook URL Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL do Webhook
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={pay2mWebhookUrl}
                    readOnly
                    className="flex-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white text-sm"
                  />
                  <button
                    onClick={handleCopyPay2mWebhookUrl}
                    className="px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Copy className="h-4 w-4" />
                    <span>{copySuccessPay2m ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Configure esta URL no painel do Pay2m para receber notificações de pagamento
                </p>
              </div>

              {/* Credentials Section */}
              <div className="space-y-4">
                <h3 className="text-md font-medium text-gray-900 dark:text-white">
                  Credenciais da API
                </h3>
                
                {/* API Key */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    API Key *
                  </label>
                  <input
                    type="password"
                    value={pay2mConfig.apiKey}
                    onChange={(e) => setPay2mConfig({ ...pay2mConfig, apiKey: e.target.value })}
                    placeholder="Sua API Key do Pay2m"
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                  />
                </div>

                {/* Secret Key */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Secret Key
                  </label>
                  <input
                    type="password"
                    value={pay2mConfig.secretKey}
                    onChange={(e) => setPay2mConfig({ ...pay2mConfig, secretKey: e.target.value })}
                    placeholder="Sua Secret Key do Pay2m"
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                  />
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Como configurar no Pay2m
                </h4>
                <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                  <li>Acesse o <a href="https://pay2m.com.br" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">painel do Pay2m</a></li>
                  <li>Vá para a seção de "Integrações" ou "API"</li>
                  <li>Copie sua API Key e Secret Key</li>
                  <li>Configure a URL do webhook nas notificações</li>
                  <li>Cole as credenciais nos campos acima e salve</li>
                </ol>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleClosePay2mModal}
                disabled={loading}
                className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Cancelar
              </button>
              
              <button
                onClick={handleSavePay2mConfiguration}
                disabled={loading || !pay2mConfig.apiKey.trim()}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <span>Salvar configuração</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentIntegrationsPage;