import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, AlertCircle, CheckCircle, Zap, Pencil, Trash2, Plus } from 'lucide-react';
import { motion, easeOut, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { PaymentsAPI, PaymentIntegrationConfig } from '../lib/api/payments';
import { formatPixKey } from '../utils/pixValidation';
import ConfirmModal from '../components/ConfirmModal';
import ConfigModal from '../components/ConfigModal';
import PixKeyModal from '../components/pix/PixKeyModal';
import PixLogo from '../components/pix/PixLogo';
import { ManualPixAPI, type ManualPixKey } from '../lib/api/manualPix';

const PaymentIntegrationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useNotification();

  const [showFluxsisModal, setShowFluxsisModal] = useState(false);
  const [showPay2mModal, setShowPay2mModal] = useState(false);
  const [showPaggueModal, setShowPaggueModal] = useState(false);
  const [showEfiBankModal, setShowEfiBankModal] = useState(false);
  const [showSuitPayModal, setShowSuitPayModal] = useState(false);

  const [fluxsisConfig, setFluxsisConfig] = useState({ api_key: '', secret_key: '', webhook_url: '' });
  const [pay2mConfig, setPay2mConfig] = useState({ api_key: '', secret_key: '', webhook_url: '' });
  const [paggueConfig, setPaggueConfig] = useState({ api_key: '', secret_key: '', webhook_url: '' });
  const [efiBankConfig, setEfiBankConfig] = useState({ client_id: '', client_secret: '', webhook_url: '' });
  const [suitPayConfig, setSuitPayConfig] = useState({ client_id: '', client_secret: '', webhook_url: '' });

  const [isFluxsisConfigured, setIsFluxsisConfigured] = useState(false);
  const [isPay2mConfigured, setIsPay2mConfigured] = useState(false);
  const [isPaggueConfigured, setIsPaggueConfigured] = useState(false);
  const [isEfiBankConfigured, setIsEfiBankConfigured] = useState(false);
  const [isSuitPayConfigured, setIsSuitPayConfigured] = useState(false);

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [activeTab, setActiveTab] = useState<'automatic' | 'manual'>('automatic');
  const [pixKeys, setPixKeys] = useState<ManualPixKey[]>([]);
  const [showAddPixModal, setShowAddPixModal] = useState(false);
  const [editingPix, setEditingPix] = useState<ManualPixKey | null>(null);
  const [savingPix, setSavingPix] = useState(false);
  const [activePrimary, setActivePrimary] = useState<'manual_pix' | 'pay2m' | 'fluxsis' | 'paggue' | 'efi_bank' | 'suitpay'>(() => {
    const v = localStorage.getItem('activePaymentMethod');
    const allowed = ['manual_pix','pay2m','fluxsis','paggue','efi_bank','suitpay'];
    return allowed.includes(v || '') ? (v as 'manual_pix' | 'pay2m' | 'fluxsis' | 'paggue' | 'efi_bank' | 'suitpay') : 'pay2m';
  });

  const [showDeleteFluxsisConfirm, setShowDeleteFluxsisConfirm] = useState(false);
  const [showDeletePay2mConfirm, setShowDeletePay2mConfirm] = useState(false);
  const [showDeletePaggueConfirm, setShowDeletePaggueConfirm] = useState(false);
  const [showDeleteEfiBankConfirm, setShowDeleteEfiBankConfirm] = useState(false);
  const [showDeleteSuitPayConfirm, setShowDeleteSuitPayConfirm] = useState(false);

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

        if (data.suitpay) {
          const suit = data.suitpay;
          setSuitPayConfig({
            client_id: suit.client_id || '',
            client_secret: suit.client_secret || '',
            webhook_url: suit.webhook_url || ''
          });
          setIsSuitPayConfigured(!!suit.client_id);
        }
        }
      } catch (error) {
        console.error('Error loading payment configurations:', error);
      }
    };

    loadPaymentConfig();
  }, [user]);

  useEffect(() => {
    const loadPix = async () => {
      if (!user || activeTab !== 'manual') return;
      const { data } = await ManualPixAPI.listKeys(user.id);
      setPixKeys(data || []);
    };
    loadPix();
  }, [user, activeTab]);

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  const handleFluxsisConfig = () => {
    setShowFluxsisModal(true);
  };

  const handleSaveFluxsisConfig = async () => {
    if (!user || !fluxsisConfig.api_key.trim() || !fluxsisConfig.secret_key.trim()) {
      showWarning('Por favor, preencha todos os campos obrigatórios');
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
        showError('Erro ao salvar configuração. Tente novamente.');
      } else {
        setIsFluxsisConfigured(true);
        setShowFluxsisModal(false);
        showSuccess('Configuração do Fluxsis salva com sucesso!');
        localStorage.setItem('isPaymentConfigured', 'true');
      }
    } catch (error) {
      console.error('Error saving Fluxsis config:', error);
      showError('Erro ao salvar configuração. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFluxsisConfig = () => {
    setShowDeleteFluxsisConfirm(true);
  };

  const confirmDeleteFluxsisConfig = async () => {
    if (!user) return;

    setDeleting(true);
    try {
      const { data: currentConfig } = await PaymentsAPI.getPaymentConfig(user.id);
      const updatedConfig: PaymentIntegrationConfig = { ...currentConfig };
      delete updatedConfig.fluxsis;

      const { error } = await PaymentsAPI.updatePaymentConfig(user.id, updatedConfig);
      
      if (error) {
        console.error('Error deleting Fluxsis config:', error);
        showError('Erro ao remover configuração. Tente novamente.');
      } else {
        setIsFluxsisConfigured(false);
        setFluxsisConfig({ api_key: '', secret_key: '', webhook_url: '' });
        setShowFluxsisModal(false);
        setShowDeleteFluxsisConfirm(false);
        showSuccess('Configuração do Fluxsis removida com sucesso!');
      }
    } catch (error) {
      console.error('Error deleting Fluxsis config:', error);
      showError('Erro ao remover configuração. Tente novamente.');
    } finally {
      setDeleting(false);
      setShowDeleteFluxsisConfirm(false);
    }
  };

  const handlePay2mConfig = () => {
    setShowPay2mModal(true);
  };

  const handleSavePay2mConfig = async () => {
    if (!user || !pay2mConfig.api_key.trim() || !pay2mConfig.secret_key.trim()) {
      showWarning('Por favor, preencha todos os campos obrigatórios');
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
        showError('Erro ao salvar configuração. Tente novamente.');
      } else {
        setIsPay2mConfigured(true);
        setShowPay2mModal(false);
        showSuccess('Configuração do Pay2m salva com sucesso!');
        localStorage.setItem('isPaymentConfigured', 'true');
      }
    } catch (error) {
      console.error('Error saving Pay2m config:', error);
      showError('Erro ao salvar configuração. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePay2mConfig = () => {
    setShowDeletePay2mConfirm(true);
  };

  const confirmDeletePay2mConfig = async () => {
    if (!user) return;

    setDeleting(true);
    try {
      const { data: currentConfig } = await PaymentsAPI.getPaymentConfig(user.id);
      const updatedConfig: PaymentIntegrationConfig = { ...currentConfig };
      delete updatedConfig.pay2m;

      const { error } = await PaymentsAPI.updatePaymentConfig(user.id, updatedConfig);
      
      if (error) {
        console.error('Error deleting Pay2m config:', error);
        showError('Erro ao remover configuração. Tente novamente.');
      } else {
        setIsPay2mConfigured(false);
        setPay2mConfig({ api_key: '', secret_key: '', webhook_url: '' });
        setShowPay2mModal(false);
        setShowDeletePay2mConfirm(false);
        showSuccess('Configuração do Pay2m removida com sucesso!');
      }
    } catch (error) {
      console.error('Error deleting Pay2m config:', error);
      showError('Erro ao remover configuração. Tente novamente.');
    } finally {
      setDeleting(false);
      setShowDeletePay2mConfirm(false);
    }
  };

  const handlePaggueConfig = () => {
    setShowPaggueModal(true);
  };

  const handleSavePaggueConfig = async () => {
    if (!user || !paggueConfig.api_key.trim() || !paggueConfig.secret_key.trim()) {
      showWarning('Por favor, preencha todos os campos obrigatórios');
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
        showError('Erro ao salvar configuração. Tente novamente.');
      } else {
        setIsPaggueConfigured(true);
        setShowPaggueModal(false);
        showSuccess('Configuração do Paggue salva com sucesso!');
        localStorage.setItem('isPaymentConfigured', 'true');
      }
    } catch (error) {
      console.error('Error saving Paggue config:', error);
      showError('Erro ao salvar configuração. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaggueConfig = () => {
    setShowDeletePaggueConfirm(true);
  };

  const confirmDeletePaggueConfig = async () => {
    if (!user) return;

    setDeleting(true);
    try {
      const { data: currentConfig } = await PaymentsAPI.getPaymentConfig(user.id);
      const updatedConfig: PaymentIntegrationConfig = { ...currentConfig };
      delete updatedConfig.paggue;

      const { error } = await PaymentsAPI.updatePaymentConfig(user.id, updatedConfig);
      
      if (error) {
        console.error('Error deleting Paggue config:', error);
        showError('Erro ao remover configuração. Tente novamente.');
      } else {
        setIsPaggueConfigured(false);
        setPaggueConfig({ api_key: '', secret_key: '', webhook_url: '' });
        setShowPaggueModal(false);
        setShowDeletePaggueConfirm(false);
        showSuccess('Configuração do Paggue removida com sucesso!');
      }
    } catch (error) {
      console.error('Error deleting Paggue config:', error);
      showError('Erro ao remover configuração. Tente novamente.');
    } finally {
      setDeleting(false);
      setShowDeletePaggueConfirm(false);
    }
  };

  const handleEfiBankConfig = () => {
    setShowEfiBankModal(true);
  };

  const handleSuitPayConfig = () => {
    setShowSuitPayModal(true);
  };

  const handleSaveEfiBankConfig = async () => {
    if (!user || !efiBankConfig.client_id.trim() || !efiBankConfig.client_secret.trim()) {
      showWarning('Por favor, preencha todos os campos obrigatórios');
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
        showError('Erro ao salvar configuração. Tente novamente.');
      } else {
        setIsEfiBankConfigured(true);
        setShowEfiBankModal(false);
        showSuccess('Configuração do Efi Bank salva com sucesso!');
        localStorage.setItem('isPaymentConfigured', 'true');
      }
    } catch (error) {
      console.error('Error saving Efi Bank config:', error);
      showError('Erro ao salvar configuração. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEfiBankConfig = () => {
    setShowDeleteEfiBankConfirm(true);
  };

  const handleSaveSuitPayConfig = async () => {
    if (!user || !suitPayConfig.client_id.trim() || !suitPayConfig.client_secret.trim()) {
      showWarning('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const { data: currentConfig } = await PaymentsAPI.getPaymentConfig(user.id);
      const updatedConfig: PaymentIntegrationConfig = {
        ...currentConfig,
        suitpay: {
          client_id: suitPayConfig.client_id,
          client_secret: suitPayConfig.client_secret,
          webhook_url: suitPayConfig.webhook_url,
          configured_at: new Date().toISOString()
        }
      };

      const { error } = await PaymentsAPI.updatePaymentConfig(user.id, updatedConfig);
      
      if (error) {
        console.error('Error saving SuitPay config:', error);
        showError('Erro ao salvar configuração. Tente novamente.');
      } else {
        setIsSuitPayConfigured(true);
        setShowSuitPayModal(false);
        showSuccess('Configuração do SuitPay salva com sucesso!');
        localStorage.setItem('isPaymentConfigured', 'true');
      }
    } catch (error) {
      console.error('Error saving SuitPay config:', error);
      showError('Erro ao salvar configuração. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSuitPayConfig = () => {
    setShowDeleteSuitPayConfirm(true);
  };

  const confirmDeleteSuitPayConfig = async () => {
    if (!user) return;

    setDeleting(true);
    try {
      const { data: currentConfig } = await PaymentsAPI.getPaymentConfig(user.id);
      const updatedConfig: PaymentIntegrationConfig = { ...currentConfig };
      delete updatedConfig.suitpay;

      const { error } = await PaymentsAPI.updatePaymentConfig(user.id, updatedConfig);
      
      if (error) {
        console.error('Error deleting SuitPay config:', error);
        showError('Erro ao remover configuração. Tente novamente.');
      } else {
        setIsSuitPayConfigured(false);
        setSuitPayConfig({ client_id: '', client_secret: '', webhook_url: '' });
        setShowSuitPayModal(false);
        setShowDeleteSuitPayConfirm(false);
        showSuccess('Configuração do SuitPay removida com sucesso!');
      }
    } catch (error) {
      console.error('Error deleting SuitPay config:', error);
      showError('Erro ao remover configuração. Tente novamente.');
    } finally {
      setDeleting(false);
      setShowDeleteSuitPayConfirm(false);
    }
  };

  const confirmDeleteEfiBankConfig = async () => {
    if (!user) return;

    setDeleting(true);
    try {
      const { data: currentConfig } = await PaymentsAPI.getPaymentConfig(user.id);
      const updatedConfig: PaymentIntegrationConfig = { ...currentConfig };
      delete updatedConfig.efi_bank;

      const { error } = await PaymentsAPI.updatePaymentConfig(user.id, updatedConfig);
      
      if (error) {
        console.error('Error deleting Efi Bank config:', error);
        showError('Erro ao remover configuração. Tente novamente.');
      } else {
        setIsEfiBankConfigured(false);
        setEfiBankConfig({ client_id: '', client_secret: '', webhook_url: '' });
        setShowEfiBankModal(false);
        setShowDeleteEfiBankConfirm(false);
        showSuccess('Configuração do Efi Bank removida com sucesso!');
      }
    } catch (error) {
      console.error('Error deleting Efi Bank config:', error);
      showError('Erro ao remover configuração. Tente novamente.');
    } finally {
      setDeleting(false);
      setShowDeleteEfiBankConfirm(false);
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
    },
    {
      id: 'suitpay',
      name: 'SuitPay',
      logo: '/suitpay.svg',
      description: 'PIX com split automático e webhook seguro',
      isConfigured: isSuitPayConfigured,
      onConfigure: handleSuitPayConfig
    }
  ];

  // Variantes de animação
  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: easeOut }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: 0.3 + (i * 0.1),
        duration: 0.4,
        ease: easeOut
      }
    }),
    hover: {
      y: -8,
      scale: 1.02,
      transition: { duration: 0.3, ease: easeOut }
    }
  };

  const tabSectionVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25, ease: easeOut } },
    exit: { opacity: 0, y: -10, scale: 0.98, transition: { duration: 0.2, ease: easeOut } }
  };


  return (
    <div className="min-h-screen bg-transparent text-gray-900 dark:text-white transition-colors duration-300">
      <style>
        {`
          @media (max-width: 640px) {
            ::-webkit-scrollbar {
              width: 8px;
            }
            ::-webkit-scrollbar-track {
              background: linear-gradient(to bottom, rgba(139, 92, 246, 0.05), rgba(219, 39, 119, 0.05));
              border-radius: 10px;
            }
            ::-webkit-scrollbar-thumb {
              background: linear-gradient(to bottom, #a855f7, #ec4899, #3b82f6);
              border-radius: 10px;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(to bottom, #c084fc, #f472b6);
            }
            ::-webkit-scrollbar-thumb:active {
              background: linear-gradient(to bottom, #7c3aed, #db2777);
            }
          }
          
          @media (min-width: 641px) {
            ::-webkit-scrollbar {
              width: 12px;
            }
            ::-webkit-scrollbar-track {
              background: linear-gradient(to bottom, rgba(139, 92, 246, 0.05), rgba(219, 39, 119, 0.05));
              border-radius: 10px;
            }
            ::-webkit-scrollbar-thumb {
              background: linear-gradient(to bottom, #a855f7, #ec4899, #3b82f6);
              border-radius: 10px;
              box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
            }
            ::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(to bottom, #c084fc, #f472b6);
              box-shadow: 0 0 15px rgba(192, 132, 252, 0.6);
            }
          }
        `}
      </style>
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
      <motion.div 
        className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8"
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >
          <motion.button
            onClick={handleGoBack}
            className="p-1.5 sm:p-2 hover:bg-white/10 dark:hover:bg-gray-800/50 rounded-lg transition-colors duration-200"
            whileHover={{ scale: 1.1, x: -4 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700 dark:text-gray-300" />
          </motion.button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Métodos de Pagamento
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
              Configure suas integrações para receber pagamentos
            </p>
          </div>
        </motion.div>

        <div className="mb-4 sm:mb-6 bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-200/20 dark:border-gray-700/30 p-1.5 sm:p-2 shadow-lg">
          <div className="flex space-x-1.5 sm:space-x-2">
            <button
              onClick={() => setActiveTab('automatic')}
              className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all duration-300 ${activeTab === 'automatic' ? 'bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 text-white shadow-lg animate-gradient-x bg-[length:200%_200%]' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'}`}
            >
              <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Formas automáticas</span>
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all duration-300 ${activeTab === 'manual' ? 'bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 text-white shadow-lg animate-gradient-x bg-[length:200%_200%]' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'}`}
            >
              <PixLogo variant="icon" className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Formas manuais</span>
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
        {activeTab === 'automatic' && (
        <motion.div 
          className="mb-4 sm:mb-6 rounded-xl sm:rounded-2xl p-3 sm:p-4 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/20 dark:border-blue-800/30"
          variants={tabSectionVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="flex items-start gap-2 sm:gap-3">
            <motion.div 
              className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0"
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.5 }}
            >
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </motion.div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1">
                Receba pagamentos automaticamente
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                Configure pelo menos um método de pagamento para começar a vender suas cotas. Todos os pagamentos são processados de forma segura e automática.
              </p>
            </div>
          </div>
        </motion.div>
        )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
        {activeTab === 'automatic' && (
        <motion.div className="grid gap-3 sm:gap-4 md:grid-cols-2" variants={tabSectionVariants} initial="hidden" animate="visible" exit="exit">
          {paymentMethods.map((method, index) => (
            <motion.article
              key={method.id}
              custom={index}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              className="rounded-xl sm:rounded-2xl p-4 sm:p-6 border transition-all duration-200 bg-white/60 dark:bg-gray-900/40 border-gray-200/20 dark:border-gray-700/20 hover:border-purple-500/30 hover:shadow-lg cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                  <motion.div 
                    className="w-12 h-12 sm:w-16 sm:h-16 bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-200/20 dark:border-gray-700/20 p-2"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img 
                      src={method.logo} 
                      alt={`${method.name} Logo`} 
                      className="w-full h-full object-contain"
                    />
                  </motion.div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {method.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-3">
                      {method.description}
                    </p>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {method.isConfigured ? (
                        <>
                          <motion.div
                            animate={{ 
                              scale: [1, 1.2, 1],
                              opacity: [0.7, 1, 0.7]
                            }}
                            transition={{ 
                              duration: 2, 
                              repeat: Infinity 
                            }}
                          >
                            <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                          </motion.div>
                          <span className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">Conectado</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Não conectado</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {(['pay2m','suitpay','fluxsis','paggue','efi_bank'].includes(method.id)) && (
                  <button
                    onClick={() => {
                      const key = method.id as 'pay2m' | 'fluxsis' | 'paggue' | 'efi_bank' | 'suitpay';
                      setActivePrimary(key);
                      localStorage.setItem('activePaymentMethod', key);
                      showSuccess(`${method.name} definido como principal`);
                    }}
                    aria-pressed={activePrimary === method.id}
                    className={`relative inline-flex items-center w-12 h-6 rounded-full border ${activePrimary === method.id ? 'bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 text-white border-transparent' : 'bg-gray-200 dark:bg-gray-800 border-gray-300/50 dark:border-gray-700/50'}`}
                  >
                    <motion.span
                      className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow"
                      animate={{ x: activePrimary === method.id ? 24 : 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    />
                  </button>
                )}
              </div>
              
              <motion.button
                onClick={() => {
                  method.onConfigure();
                }}
                className="w-full mt-3 sm:mt-4 inline-flex items-center justify-center gap-2 animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-[#7928CA] via-[#FF0080] via-[#007CF0] to-[#FF8C00] text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold shadow-md transition transform"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Configurar</span>
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </motion.div>
              </motion.button>
            </motion.article>
          ))}
        </motion.div>
        )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
        {activeTab === 'manual' && (
          <motion.div className="space-y-4 sm:space-y-6" variants={tabSectionVariants} initial="hidden" animate="visible" exit="exit">
            <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-200/20 dark:border-gray-700/30 p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4">
                  <motion.div 
                    className="w-12 h-12 sm:w-16 sm:h-16 bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-200/20 dark:border-gray-700/20 p-2"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  >
                    <PixLogo className="w-full h-full object-contain" />
                  </motion.div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold">Pix manual</h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Cadastre chaves Pix para receber pagamentos manualmente</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setActivePrimary('manual_pix'); localStorage.setItem('activePaymentMethod', 'manual_pix'); showSuccess('Pix manual definido como principal'); }}
                    aria-pressed={activePrimary === 'manual_pix'}
                    className={`relative inline-flex items-center w-12 h-6 rounded-full border ${activePrimary === 'manual_pix' ? 'bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 text-white border-transparent' : 'bg-gray-200 dark:bg-gray-800 border-gray-300/50 dark:border-gray-700/50'}`}
                  >
                    <motion.span
                      className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow"
                      animate={{ x: activePrimary === 'manual_pix' ? 24 : 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    />
                  </button>
                  <button onClick={() => setShowAddPixModal(true)} className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 via-blue-500 to-indigo-600 text-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold shadow-md">
                    <Plus className="h-4 w-4" /> Adicionar Pix
                  </button>
                  <button onClick={() => navigate('/dashboard/pix-approval')} className="ml-2 inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold border border-gray-200/30 dark:border-gray-700/30">
                    Aprovar comprovantes
                  </button>
                </div>
              </div>
              <div className="mt-4 sm:mt-6 space-y-3">
                {pixKeys.length === 0 ? (
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Nenhuma chave cadastrada</p>
                ) : (
                  pixKeys.map((k) => (
                    <div key={k.id} className="flex items-center justify-between p-3 border border-gray-200/30 dark:border-gray-700/30 rounded-lg">
                      <div>
                        <p className="text-sm font-semibold capitalize">{k.key_type}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{formatPixKey(k.key_type as 'telefone' | 'cpf' | 'cnpj' | 'email' | 'aleatoria', k.key_value)}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{k.holder_name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditingPix(k)} className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={async () => { setDeleting(true); const { error } = await ManualPixAPI.deleteKey(k.id); if (!error) setPixKeys((prev) => prev.filter((x) => x.id !== k.id)); setDeleting(false); }} className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 text-xs">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
        <PixKeyModal
          show={showAddPixModal}
          onClose={() => setShowAddPixModal(false)}
          title="Adicionar Pix"
          saving={savingPix}
          onSave={async (payload) => {
            if (!user) return;
            setSavingPix(true);
            const { data, error } = await ManualPixAPI.createKey({ user_id: user.id, ...payload });
            if (!error && data) {
              setPixKeys((prev) => [data, ...prev]);
              setShowAddPixModal(false);
              showSuccess('Pix adicionado');
            } else {
              showError('Erro ao adicionar Pix');
            }
            setSavingPix(false);
          }}
        />
        <PixKeyModal
          show={!!editingPix}
          onClose={() => setEditingPix(null)}
          title="Editar Pix"
          saving={savingPix}
          initial={editingPix ? { key_type: editingPix.key_type, key_value: editingPix.key_value, holder_name: editingPix.holder_name } : null}
          onSave={async (payload) => {
            if (!editingPix) return;
            setSavingPix(true);
            const { data, error } = await ManualPixAPI.updateKey(editingPix.id, payload);
            if (!error && data) {
              setPixKeys((prev) => prev.map((x) => (x.id === data.id ? data : x)));
              setEditingPix(null);
              showSuccess('Pix atualizado');
            } else {
              showError('Erro ao atualizar Pix');
            }
            setSavingPix(false);
          }}
        />
      </main>

      <ConfigModal
        show={showSuitPayModal}
        onClose={() => setShowSuitPayModal(false)}
        title="Configurar SuitPay"
        config={suitPayConfig}
        setConfig={setSuitPayConfig}
        onSave={handleSaveSuitPayConfig}
        onDelete={handleDeleteSuitPayConfig}
        isConfigured={isSuitPayConfigured}
        loading={loading}
        deleting={deleting}
        helper={(
          <div className="space-y-2">
            <p>
              Para obter suas credenciais, acesse o painel da SuitPay com seu login.
            </p>
            <p>
              No menu lateral, navegue até <span className="font-semibold">VENDAS</span> → <span className="font-semibold">GATEWAY DE PAGAMENTO</span> → <span className="font-semibold">Chaves API</span> e siga as instruções exibidas para criar as chaves.
            </p>
            <p>
              Ao finalizar, serão apresentados o <span className="font-semibold">Client ID (ci)</span> e o <span className="font-semibold">Client Secret (cs)</span>. Informe esses dados nos campos abaixo.
            </p>
          </div>
        )}
        fields={[
          { name: 'client_id', label: 'Client ID (ci)', type: 'text', placeholder: 'Seu Client ID da SuitPay', required: true },
          { name: 'client_secret', label: 'Client Secret (cs)', type: 'password', placeholder: 'Seu Client Secret da SuitPay', required: true },
          { name: 'webhook_url', label: 'Webhook URL', type: 'url', placeholder: 'https://seusite.com/webhooks/suitpay', required: false }
        ]}
      />

      <ConfigModal
        show={showFluxsisModal}
        onClose={() => setShowFluxsisModal(false)}
        title="Configurar Fluxsis"
        config={fluxsisConfig}
        setConfig={setFluxsisConfig}
        onSave={handleSaveFluxsisConfig}
        onDelete={handleDeleteFluxsisConfig}
        isConfigured={isFluxsisConfigured}
        loading={loading}
        deleting={deleting}
        fields={[
          { name: 'api_key', label: 'API Key', type: 'text', placeholder: 'Sua API Key do Fluxsis', required: true },
          { name: 'secret_key', label: 'Secret Key', type: 'password', placeholder: 'Sua Secret Key do Fluxsis', required: true },
          { name: 'webhook_url', label: 'Webhook URL', type: 'url', placeholder: 'https://seusite.com/webhook/fluxsis', required: false }
        ]}
      />

      <ConfigModal
        show={showPay2mModal}
        onClose={() => setShowPay2mModal(false)}
        title="Configurar Pay2m"
        config={pay2mConfig}
        setConfig={setPay2mConfig}
        onSave={handleSavePay2mConfig}
        onDelete={handleDeletePay2mConfig}
        isConfigured={isPay2mConfigured}
        loading={loading}
        deleting={deleting}
        fields={[
          { name: 'api_key', label: 'API Key', type: 'text', placeholder: 'Sua API Key do Pay2m', required: true },
          { name: 'secret_key', label: 'Secret Key', type: 'password', placeholder: 'Sua Secret Key do Pay2m', required: true },
          { name: 'webhook_url', label: 'Webhook URL', type: 'url', placeholder: 'https://seusite.com/webhook/pay2m', required: false }
        ]}
      />

      <ConfigModal
        show={showPaggueModal}
        onClose={() => setShowPaggueModal(false)}
        title="Configurar Paggue"
        config={paggueConfig}
        setConfig={setPaggueConfig}
        onSave={handleSavePaggueConfig}
        onDelete={handleDeletePaggueConfig}
        isConfigured={isPaggueConfigured}
        loading={loading}
        deleting={deleting}
        fields={[
          { name: 'api_key', label: 'API Key', type: 'text', placeholder: 'Sua API Key do Paggue', required: true },
          { name: 'secret_key', label: 'Secret Key', type: 'password', placeholder: 'Sua Secret Key do Paggue', required: true },
          { name: 'webhook_url', label: 'Webhook URL', type: 'url', placeholder: 'https://seusite.com/webhook/paggue', required: false }
        ]}
      />

      <ConfigModal
        show={showEfiBankModal}
        onClose={() => setShowEfiBankModal(false)}
        title="Configurar Efi Bank"
        config={efiBankConfig}
        setConfig={setEfiBankConfig}
        onSave={handleSaveEfiBankConfig}
        onDelete={handleDeleteEfiBankConfig}
        isConfigured={isEfiBankConfigured}
        loading={loading}
        deleting={deleting}
        fields={[
          { name: 'client_id', label: 'Client ID', type: 'text', placeholder: 'Seu Client ID do Efi Bank', required: true },
          { name: 'client_secret', label: 'Client Secret', type: 'password', placeholder: 'Seu Client Secret do Efi Bank', required: true },
          { name: 'webhook_url', label: 'Webhook URL', type: 'url', placeholder: 'https://seusite.com/webhook/efibank', required: false }
        ]}
      />

      <ConfirmModal
        isOpen={showDeleteFluxsisConfirm}
        title="Remover Configuração"
        message="Tem certeza que deseja remover a configuração do Fluxsis? Esta ação não pode ser desfeita."
        confirmText="Remover"
        cancelText="Cancelar"
        type="danger"
        loading={deleting}
        onConfirm={confirmDeleteFluxsisConfig}
        onCancel={() => setShowDeleteFluxsisConfirm(false)}
      />

      <ConfirmModal
        isOpen={showDeletePay2mConfirm}
        title="Remover Configuração"
        message="Tem certeza que deseja remover a configuração do Pay2m? Esta ação não pode ser desfeita."
        confirmText="Remover"
        cancelText="Cancelar"
        type="danger"
        loading={deleting}
        onConfirm={confirmDeletePay2mConfig}
        onCancel={() => setShowDeletePay2mConfirm(false)}
      />

      <ConfirmModal
        isOpen={showDeleteSuitPayConfirm}
        title="Remover Configuração"
        message="Tem certeza que deseja remover a configuração do SuitPay? Esta ação não pode ser desfeita."
        confirmText="Remover"
        cancelText="Cancelar"
        type="danger"
        loading={deleting}
        onConfirm={confirmDeleteSuitPayConfig}
        onCancel={() => setShowDeleteSuitPayConfirm(false)}
      />

      <ConfirmModal
        isOpen={showDeletePaggueConfirm}
        title="Remover Configuração"
        message="Tem certeza que deseja remover a configuração do Paggue? Esta ação não pode ser desfeita."
        confirmText="Remover"
        cancelText="Cancelar"
        type="danger"
        loading={deleting}
        onConfirm={confirmDeletePaggueConfig}
        onCancel={() => setShowDeletePaggueConfirm(false)}
      />

      <ConfirmModal
        isOpen={showDeleteEfiBankConfirm}
        title="Remover Configuração"
        message="Tem certeza que deseja remover a configuração do Efi Bank? Esta ação não pode ser desfeita."
        confirmText="Remover"
        cancelText="Cancelar"
        type="danger"
        loading={deleting}
        onConfirm={confirmDeleteEfiBankConfig}
        onCancel={() => setShowDeleteEfiBankConfirm(false)}
      />
    </div>
  );
};

export default PaymentIntegrationsPage;
