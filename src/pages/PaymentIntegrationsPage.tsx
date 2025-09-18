import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, X, ArrowRight, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
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
          // Fluxsis
          if (data.fluxsis) {
            setFluxsisConfig({
              api_key: data.fluxsis.api_key || '',
              secret_key: data.fluxsis.secret_key || '',
              webhook_url: data.fluxsis.webhook_url || ''
            });
            setIsFluxsisConfigured(!!data.fluxsis.api_key);
          }

          // Pay2m
          if (data.pay2m) {
            setPay2mConfig({
              api_key: data.pay2m.api_key || '',
              secret_key: data.pay2m.secret_key || '',
              webhook_url: data.pay2m.webhook_url || ''
            });
            setIsPay2mConfigured(!!data.pay2m.api_key);
          }

          // Paggue
          if (data.paggue) {
            setPaggueConfig({
              api_key: data.paggue.api_key || '',
              secret_key: data.paggue.secret_key || '',
              webhook_url: data.paggue.webhook_url || ''
            });
            setIsPaggueConfigured(!!data.paggue.api_key);
          }

          // Efi Bank
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
    if (!window.confirm('Tem certeza que deseja remover a configuração do Fluxsis?')) return;

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
    if (!window.confirm('Tem certeza que deseja remover a configuração do Pay2m?')) return;

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
    if (!window.confirm('Tem certeza que deseja remover a configuração do Paggue?')) return;

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
    if (!window.confirm('Tem certeza que deseja remover a configuração do Efi Bank?')) return;

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

  return (
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

      {/* Payment Methods Grid */}
      <div className="p-6 space-y-4">
        {/* Fluxsis */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors duration-200">
          <div className="flex items-center space-x-4">
            <img src="/fluxsis22.png" alt="Fluxsis Logo" className="w-12 h-12 object-contain" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Fluxsis</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pagamentos automáticos via PIX e cartão</p>
              <div className="flex items-center space-x-2 mt-2">
                {isFluxsisConfigured ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600 dark:text-green-400
