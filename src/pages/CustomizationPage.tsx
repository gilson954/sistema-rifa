import React, { useState } from 'react';
import { Upload, Plus, ArrowRight, X, Loader2, Trash2, ExternalLink, CheckCircle, AlertCircle, Clock, Sparkles, Palette, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // Importação do framer-motion
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { supabase } from '../lib/supabase';
import { CustomDomainsAPI, CustomDomain } from '../lib/api/customDomains';
import ConfirmModal from '../components/ConfirmModal';

// Variantes para Staggering (entrada em cascata)
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 12 } },
};

const tabContentVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const CustomizationPage = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useNotification();
  const [activeTab, setActiveTab] = useState('cores-tema');
  const [selectedTheme, setSelectedTheme] = useState('claro');
  const [colorMode, setColorMode] = useState<'solid' | 'gradient'>('solid');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [selectedGradient, setSelectedGradient] = useState('from-purple-600 via-pink-500 to-blue-600');
  const [customGradientColors, setCustomGradientColors] = useState<string[]>(['#9333EA', '#EC4899', '#3B82F6']);
  const [isCustomGradient, setIsCustomGradient] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [customDomains, setCustomDomains] = useState<CustomDomain[]>([]);
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [verifyingDomain, setVerifyingDomain] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const [showRemoveLogoConfirm, setShowRemoveLogoConfirm] = useState(false);
  const [showDeleteDomainConfirm, setShowDeleteDomainConfirm] = useState(false);
  const [selectedDomainToDelete, setSelectedDomainToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const solidColors = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E',
    '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#C026D2', '#EC4899', '#F43F5E'
  ];

  const gradients = [
    { id: 1, classes: 'from-purple-600 via-pink-500 to-blue-600', name: 'Roxo Rosa Azul' },
    { id: 2, classes: 'from-blue-600 via-cyan-500 to-teal-500', name: 'Azul Ciano Verde' },
    { id: 3, classes: 'from-orange-500 via-red-500 to-pink-600', name: 'Laranja Vermelho Rosa' },
    { id: 4, classes: 'from-green-500 via-emerald-500 to-teal-600', name: 'Verde Esmeralda' },
    { id: 5, classes: 'from-indigo-600 via-purple-600 to-pink-600', name: 'Índigo Roxo Rosa' },
    { id: 6, classes: 'from-yellow-500 via-orange-500 to-red-600', name: 'Amarelo Laranja Vermelho' },
    { id: 7, classes: 'from-pink-500 via-rose-500 to-red-600', name: 'Rosa Carmesim' },
    { id: 8, classes: 'from-blue-500 via-indigo-600 to-purple-700', name: 'Azul Índigo Roxo' },
    { id: 9, classes: 'from-teal-500 via-cyan-600 to-blue-700', name: 'Verde-água Azul' },
    { id: 10, classes: 'from-fuchsia-600 via-purple-600 to-indigo-600', name: 'Fúcsia Roxo' },
    { id: 11, classes: 'from-lime-500 via-green-600 to-emerald-700', name: 'Lima Verde' },
    { id: 12, classes: 'from-amber-500 via-orange-600 to-red-700', name: 'Âmbar Laranja' }
  ];

  const tabs = [
    { id: 'cores-tema', label: 'Cores e tema', icon: Palette },
    { id: 'sua-logo', label: 'Sua logo', icon: Upload },
    { id: 'dominios', label: 'Domínios', icon: ExternalLink }
  ];

  React.useEffect(() => {
    const loadUserSettings = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('primary_color, theme, logo_url, color_mode, gradient_classes, custom_gradient_colors')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Error loading user settings:', error);
          } else if (data) {
            if (data.primary_color) setSelectedColor(data.primary_color);
            if (data.theme) setSelectedTheme(data.theme);
            if (data.logo_url) setCurrentLogoUrl(data.logo_url);
            if (data.color_mode) setColorMode(data.color_mode);
            if (data.gradient_classes) setSelectedGradient(data.gradient_classes);
            if (data.custom_gradient_colors) {
              setCustomGradientColors(JSON.parse(data.custom_gradient_colors));
              setIsCustomGradient(true);
            }
          }
        } catch (error) {
          console.error('Error loading user settings:', error);
        }
      }
    };

    loadUserSettings();
  }, [user]);

  React.useEffect(() => {
    const loadCustomDomains = async () => {
      if (user && activeTab === 'dominios') {
        setLoadingDomains(true);
        try {
          const { data, error } = await CustomDomainsAPI.getUserCustomDomains(user.id);
          if (error) {
            console.error('Error loading custom domains:', error);
          } else {
            setCustomDomains(data || []);
          }
        } catch (error) {
          console.error('Error loading custom domains:', error);
        } finally {
          setLoadingDomains(false);
        }
      }
    };

    loadCustomDomains();
  }, [user, activeTab]);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showError('Por favor, selecione apenas arquivos de imagem.');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showError('A imagem deve ter no máximo 5MB.');
        return;
      }
      
      setLogoFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleUploadLogo = async () => {
    if (!logoFile || !user) {
      showWarning('Por favor, selecione uma imagem primeiro.');
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, logoFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ logo_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setCurrentLogoUrl(publicUrl);
      setLogoFile(null);
      setLogoPreviewUrl(null);

      showSuccess('Logo atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload da logo:', error);
      showError('Erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!currentLogoUrl || !user) return;
    setShowRemoveLogoConfirm(true);
  };

  const confirmRemoveLogo = async () => {
    if (!currentLogoUrl || !user) return;

    setUploadingLogo(true);
    try {
      const urlParts = currentLogoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${user.id}/${fileName}`;

      const { error: deleteError } = await supabase.storage
        .from('logos')
        .remove([filePath]);

      if (deleteError) {
        console.warn('Erro ao remover arquivo do storage:', deleteError);
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ logo_url: null })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setCurrentLogoUrl(null);
      setShowRemoveLogoConfirm(false);
      showSuccess('Logo removida com sucesso!');
    } catch (error) {
      console.error('Erro ao remover logo:', error);
      showError('Erro ao remover logo. Tente novamente.');
    } finally {
      setUploadingLogo(false);
      setShowRemoveLogoConfirm(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!user) {
      showWarning('Você precisa estar logado para salvar as alterações');
      return;
    }

    setSaving(true);
    try {
      let updateData: any = {
        theme: selectedTheme,
        color_mode: colorMode
      };

      if (colorMode === 'gradient') {
        updateData.gradient_classes = isCustomGradient ? 'custom' : selectedGradient;
        updateData.custom_gradient_colors = isCustomGradient ? JSON.stringify(customGradientColors) : null;
        updateData.primary_color = null;
      } else {
        updateData.primary_color = selectedColor;
        updateData.gradient_classes = null;
        updateData.custom_gradient_colors = null;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error('Error saving settings:', error);
        showError('Erro ao salvar as configurações. Tente novamente.');
      } else {
        showSuccess('Configurações salvas com sucesso!');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showError('Erro ao salvar as configurações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case 'claro':
        return {
          background: 'bg-white',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          cardBg: 'bg-gray-50',
          border: 'border-gray-200'
        };
      case 'escuro':
        return {
          background: 'bg-slate-900',
          text: 'text-white',
          textSecondary: 'text-slate-300',
          cardBg: 'bg-slate-800',
          border: 'border-slate-700'
        };
      case 'escuro-preto':
        return {
          background: 'bg-black',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          cardBg: 'bg-gray-900',
          border: 'border-gray-700'
        };
      case 'escuro-cinza':
        return {
          background: 'bg-[#1A1A1A]',
          text: 'text-white',
          textSecondary: 'text-[#A0A0A0]',
          cardBg: 'bg-[#2C2C2C]',
          border: 'border-[#404040]'
        };
      default:
        return {
          background: 'bg-white',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          cardBg: 'bg-gray-50',
          border: 'border-gray-200'
        };
    }
  };

  const handleSaveDomain = async () => {
    if (!newDomain.trim() || !user) return;

    setSaving(true);
    try {
      const { data, error } = await CustomDomainsAPI.createCustomDomain(
        { domain_name: newDomain.trim() },
        user.id
      );

      if (error) {
        console.error('Error creating custom domain:', error);
        showError('Erro ao adicionar domínio. Verifique se o formato está correto e tente novamente.');
      } else {
        setCustomDomains(prev => [data!, ...prev]);
        setShowDomainModal(false);
        setNewDomain('');
        showSuccess('Domínio adicionado com sucesso! Siga as instruções DNS para ativá-lo.');
      }
    } catch (error) {
      console.error('Error saving domain:', error);
      showError('Erro ao salvar domínio. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyDomain = async (domainId: string) => {
    setVerifyingDomain(domainId);
    try {
      const { data, error } = await CustomDomainsAPI.verifyDNS(domainId);
      
      if (error) {
        console.error('Error verifying domain:', error);
        showError('Erro ao verificar domínio. Tente novamente.');
      } else if (data?.verified) {
        showSuccess('Domínio verificado com sucesso! SSL será ativado automaticamente.');
        setCustomDomains(prev =>
          prev.map(domain =>
            domain.id === domainId
              ? { ...domain, is_verified: true, ssl_status: 'active' as const }
              : domain
          )
        );
      } else {
        showWarning('Domínio ainda não está apontando corretamente. Verifique as configurações DNS e tente novamente em alguns minutos.');
      }
    } catch (error) {
      console.error('Error verifying domain:', error);
      showError('Erro ao verificar domínio. Tente novamente.');
    } finally {
      setVerifyingDomain(null);
    }
  };

  const handleDeleteDomain = async (domainId: string, domainName: string) => {
    setSelectedDomainToDelete({ id: domainId, name: domainName });
    setShowDeleteDomainConfirm(true);
  };

  const confirmDeleteDomain = async () => {
    if (!selectedDomainToDelete || !user) return;
    const { id: domainId } = selectedDomainToDelete;

    setDeleting(true);
    try {
      const { error } = await CustomDomainsAPI.deleteCustomDomain(domainId, user!.id);

      if (error) {
        console.error('Error deleting domain:', error);
        showError('Erro ao remover domínio. Tente novamente.');
      } else {
        setCustomDomains(prev => prev.filter(domain => domain.id !== domainId));
        setShowDeleteDomainConfirm(false);
        setSelectedDomainToDelete(null);
        showSuccess('Domínio removido com sucesso.');
      }
    } catch (error) {
      console.error('Error deleting domain:', error);
      showError('Erro ao remover domínio. Tente novamente.');
    } finally {
      setDeleting(false);
      setShowDeleteDomainConfirm(false);
      setSelectedDomainToDelete(null);
    }
  };

  const getStatusIcon = (domain: CustomDomain) => {
    if (domain.is_verified && domain.ssl_status === 'active') {
      return <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />;
    } else if (domain.ssl_status === 'failed') {
      return <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />;
    } else {
      return <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />;
    }
  };

  const getStatusText = (domain: CustomDomain) => {
    if (domain.is_verified && domain.ssl_status === 'active') {
      return 'Ativo';
    } else if (domain.ssl_status === 'failed') {
      return 'Erro';
    } else if (domain.is_verified) {
      return 'Verificado';
    } else {
      return 'Pendente';
    }
  };

  const getCustomGradientStyle = () => {
    if (customGradientColors.length === 2) {
      return `linear-gradient(90deg, ${customGradientColors[0]}, ${customGradientColors[1]})`;
    } else if (customGradientColors.length === 3) {
      return `linear-gradient(90deg, ${customGradientColors[0]}, ${customGradientColors[1]}, ${customGradientColors[2]})`;
    }
    return `linear-gradient(90deg, ${customGradientColors[0] || '#9333EA'}, ${customGradientColors[1] || '#EC4899'})`;
  };

  const handleAddCustomColor = () => {
    if (customGradientColors.length < 3) {
      setCustomGradientColors([...customGradientColors, '#3B82F6']);
    }
  };

  const handleRemoveCustomColor = (index: number) => {
    if (customGradientColors.length > 2) {
      setCustomGradientColors(customGradientColors.filter((_, i) => i !== index));
    }
  };

  const handleUpdateCustomColor = (index: number, color: string) => {
    const newColors = [...customGradientColors];
    newColors[index] = color;
    setCustomGradientColors(newColors);
  };

  const handleRandomGradient = () => {
    const randomColor = () => {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    };

    const numberOfColors = Math.floor(Math.random() * 2) + 2;
    const newColors = Array.from({ length: numberOfColors }, () => randomColor());
    setCustomGradientColors(newColors);
    setIsCustomGradient(true);
  };

  return (
    // Animação de entrada da página principal
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="min-h-screen bg-transparent text-gray-900 dark:text-white transition-colors duration-300"
    >
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
        {/* Container para o Staggering dos principais blocos */}
        <motion.div initial="hidden" animate="show" variants={containerVariants}>
          {/* Header */}
          <motion.div variants={itemVariants} className="mb-6 sm:mb-8 relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-xl border border-purple-200/30 dark:border-purple-800/30 bg-gradient-to-br from-purple-50/80 to-blue-50/80 dark:from-purple-900/20 dark:to-blue-900/20 backdrop-blur-sm">
            <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-tr from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
            
            <div className="relative flex items-center space-x-3 sm:space-x-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <Sparkles className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">Personalização</h1>
                <p className="text-xs sm:text-base text-gray-600 dark:text-gray-300">Personalize a aparência das suas campanhas e configure domínios customizados</p>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div variants={itemVariants} className="mb-4 sm:mb-6 bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-200/20 dark:border-gray-700/30 p-1.5 sm:p-2 shadow-lg">
            <div className="flex space-x-1.5 sm:space-x-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <motion.button // Animação interativa para os botões de tab
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    whileHover={{ scale: 1.03, transition: { type: 'spring', stiffness: 400, damping: 10 } }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 text-white shadow-lg animate-gradient-x bg-[length:200%_200%]'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Tab Content */}
          <motion.div variants={itemVariants} className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-200/20 dark:border-gray-700/30 p-4 sm:p-8 shadow-lg">
            <AnimatePresence mode="wait">
              {/* Cores e tema Tab */}
              {activeTab === 'cores-tema' && (
                <motion.div 
                  key="cores-tema" 
                  variants={tabContentVariants} 
                  initial="hidden" 
                  animate="show" 
                  exit="exit" 
                  transition={{ duration: 0.2 }}
                  className="space-y-6 sm:space-y-8"
                >
                  {/* Theme Selection */}
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 flex items-center gap-2">
                      <Palette className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                      Tema visual
                    </h2>
                    <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                      Escolha o tema que melhor combina com sua marca
                    </p>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
                      {/* Light Theme */}
                      <motion.div // Animação no card de seleção de tema
                        onClick={() => setSelectedTheme('claro')}
                        className={`cursor-pointer rounded-xl sm:rounded-2xl p-3 sm:p-5 transition-all duration-300 ${
                          selectedTheme === 'claro'
                            ? 'ring-2 sm:ring-4 ring-purple-500 shadow-xl'
                            : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600 shadow-md'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        animate={selectedTheme === 'claro' ? { boxShadow: '0 10px 15px -3px rgba(168, 85, 247, 0.5), 0 4px 6px -2px rgba(168, 85, 247, 0.2)' } : {}}
                      >
                        <div className={`w-full h-36 sm:h-40 ${getThemeClasses('claro').background} rounded-lg sm:rounded-xl p-2.5 sm:p-4 mb-3 sm:mb-4 ${getThemeClasses('claro').border} border-2 shadow-inner`}>
                          <div className="space-y-1 sm:space-y-2">
                            <div className={`text-[10px] sm:text-sm font-bold ${getThemeClasses('claro').text} leading-tight`}>
                              Rifa do iPhone 15
                            </div>
                            <div className={`text-[9px] sm:text-xs ${getThemeClasses('claro').textSecondary} leading-tight`}>
                              R$ 5,00 por bilhete
                            </div>
                            <div className={`${getThemeClasses('claro').cardBg} rounded-md sm:rounded-lg p-1.5 sm:p-3 space-y-1 sm:space-y-2`}>
                              <div className={`text-[9px] sm:text-xs font-medium ${getThemeClasses('claro').textSecondary} leading-tight`}>
                                Progresso
                              </div>
                              <div className="bg-gray-200 rounded-full h-1.5 sm:h-2">
                                <div 
                                  className={`h-1.5 sm:h-2 rounded-full w-2/3 ${colorMode === 'gradient' ? (isCustomGradient ? 'animate-gradient-x bg-[length:200%_200%]' : `bg-gradient-to-r ${selectedGradient} animate-gradient-x bg-[length:200%_200%]`) : ''}`}
                                  style={colorMode === 'solid' ? { backgroundColor: selectedColor } : (isCustomGradient ? { background: getCustomGradientStyle(), backgroundSize: '200% 200%' } : {})}
                                ></div>
                              </div>
                            </div>
                            <div 
                              className={`text-white text-[10px] sm:text-xs py-1.5 sm:py-2 px-2 sm:px-3 rounded-md sm:rounded-lg text-center font-semibold shadow-md leading-tight ${colorMode === 'gradient' ? (isCustomGradient ? 'animate-gradient-x bg-[length:200%_200%]' : `bg-gradient-to-r ${selectedGradient} animate-gradient-x bg-[length:200%_200%]`) : ''}`}
                              style={colorMode === 'solid' ? { backgroundColor: selectedColor } : (isCustomGradient ? { background: getCustomGradientStyle(), backgroundSize: '200% 200%' } : {})}
                            >
                              Participar
                            </div>
                          </div>
                        </div>
                        <p className="text-center text-sm sm:text-base font-bold text-gray-900 dark:text-white">Claro</p>
                      </motion.div>

                      {/* Dark Theme */}
                      <motion.div // Animação no card de seleção de tema
                        onClick={() => setSelectedTheme('escuro')}
                        className={`cursor-pointer rounded-xl sm:rounded-2xl p-3 sm:p-5 transition-all duration-300 ${
                          selectedTheme === 'escuro'
                            ? 'ring-2 sm:ring-4 ring-purple-500 shadow-xl'
                            : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600 shadow-md'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        animate={selectedTheme === 'escuro' ? { boxShadow: '0 10px 15px -3px rgba(168, 85, 247, 0.5), 0 4px 6px -2px rgba(168, 85, 247, 0.2)' } : {}}
                      >
                        <div className={`w-full h-36 sm:h-40 ${getThemeClasses('escuro').background} rounded-lg sm:rounded-xl p-2.5 sm:p-4 mb-3 sm:mb-4 border-2 ${getThemeClasses('escuro').border} shadow-inner`}>
                          <div className="space-y-1 sm:space-y-2">
                            <div className={`text-[10px] sm:text-sm font-bold ${getThemeClasses('escuro').text} leading-tight`}>
                              Rifa do iPhone 15
                            </div>
                            <div className={`text-[9px] sm:text-xs ${getThemeClasses('escuro').textSecondary} leading-tight`}>
                              R$ 5,00 por bilhete
                            </div>
                            <div className={`${getThemeClasses('escuro').cardBg} rounded-md sm:rounded-lg p-1.5 sm:p-3 space-y-1 sm:space-y-2`}>
                              <div className={`text-[9px] sm:text-xs font-medium ${getThemeClasses('escuro').textSecondary} leading-tight`}>
                                Progresso
                              </div>
                              <div className="bg-gray-600 rounded-full h-1.5 sm:h-2">
                                <div 
                                  className={`h-1.5 sm:h-2 rounded-full w-2/3 ${colorMode === 'gradient' ? (isCustomGradient ? 'animate-gradient-x bg-[length:200%_200%]' : `bg-gradient-to-r ${selectedGradient} animate-gradient-x bg-[length:200%_200%]`) : ''}`}
                                  style={colorMode === 'solid' ? { backgroundColor: selectedColor } : (isCustomGradient ? { background: getCustomGradientStyle(), backgroundSize: '200% 200%' } : {})}
                                ></div>
                              </div>
                            </div>
                            <div 
                              className={`text-white text-[10px] sm:text-xs py-1.5 sm:py-2 px-2 sm:px-3 rounded-md sm:rounded-lg text-center font-semibold shadow-md leading-tight ${colorMode === 'gradient' ? (isCustomGradient ? 'animate-gradient-x bg-[length:200%_200%]' : `bg-gradient-to-r ${selectedGradient} animate-gradient-x bg-[length:200%_200%]`) : ''}`}
                              style={colorMode === 'solid' ? { backgroundColor: selectedColor } : (isCustomGradient ? { background: getCustomGradientStyle(), backgroundSize: '200% 200%' } : {})}
                            >
                              Participar
                            </div>
                          </div>
                        </div>
                        <p className="text-center text-sm sm:text-base font-bold text-gray-900 dark:text-white">Escuro</p>
                      </motion.div>

                      {/* Dark Black Theme */}
                      <motion.div // Animação no card de seleção de tema
                        onClick={() => setSelectedTheme('escuro-preto')}
                        className={`cursor-pointer rounded-xl sm:rounded-2xl p-3 sm:p-5 transition-all duration-300 ${
                          selectedTheme === 'escuro-preto'
                            ? 'ring-2 sm:ring-4 ring-purple-500 shadow-xl'
                            : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600 shadow-md'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        animate={selectedTheme === 'escuro-preto' ? { boxShadow: '0 10px 15px -3px rgba(168, 85, 247, 0.5), 0 4px 6px -2px rgba(168, 85, 247, 0.2)' } : {}}
                      >
                        <div className={`w-full h-36 sm:h-40 ${getThemeClasses('escuro-preto').background} rounded-lg sm:rounded-xl p-2.5 sm:p-4 mb-3 sm:mb-4 border-2 ${getThemeClasses('escuro-preto').border} shadow-inner`}>
                          <div className="space-y-1 sm:space-y-2">
                            <div className={`text-[10px] sm:text-sm font-bold ${getThemeClasses('escuro-preto').text} leading-tight`}>
                              Rifa do iPhone 15
                            </div>
                            <div className={`text-[9px] sm:text-xs ${getThemeClasses('escuro-preto').textSecondary} leading-tight`}>
                              R$ 5,00 por bilhete
                            </div>
                            <div className={`${getThemeClasses('escuro-preto').cardBg} rounded-md sm:rounded-lg p-1.5 sm:p-3 space-y-1 sm:space-y-2`}>
                              <div className={`text-[9px] sm:text-xs font-medium ${getThemeClasses('escuro-preto').textSecondary} leading-tight`}>
                                Progresso
                              </div>
                              <div className="bg-gray-700 rounded-full h-1.5 sm:h-2">
                                <div 
                                  className={`h-1.5 sm:h-2 rounded-full w-2/3 ${colorMode === 'gradient' ? (isCustomGradient ? 'animate-gradient-x bg-[length:200%_200%]' : `bg-gradient-to-r ${selectedGradient} animate-gradient-x bg-[length:200%_200%]`) : ''}`}
                                  style={colorMode === 'solid' ? { backgroundColor: selectedColor } : (isCustomGradient ? { background: getCustomGradientStyle(), backgroundSize: '200% 200%' } : {})}
                                ></div>
                              </div>
                            </div>
                            <div 
                              className={`text-white text-[10px] sm:text-xs py-1.5 sm:py-2 px-2 sm:px-3 rounded-md sm:rounded-lg text-center font-semibold shadow-md leading-tight ${colorMode === 'gradient' ? (isCustomGradient ? 'animate-gradient-x bg-[length:200%_200%]' : `bg-gradient-to-r ${selectedGradient} animate-gradient-x bg-[length:200%_200%]`) : ''}`}
                              style={colorMode === 'solid' ? { backgroundColor: selectedColor } : (isCustomGradient ? { background: getCustomGradientStyle(), backgroundSize: '200% 200%' } : {})}
                            >
                              Participar
                            </div>
                          </div>
                        </div>
                        <p className="text-center text-sm sm:text-base font-bold text-gray-900 dark:text-white">Escuro Preto</p>
                      </motion.div>

                      {/* Dark Gray Theme */}
                      <motion.div // Animação no card de seleção de tema
                        onClick={() => setSelectedTheme('escuro-cinza')}
                        className={`cursor-pointer rounded-xl sm:rounded-2xl p-3 sm:p-5 transition-all duration-300 ${
                          selectedTheme === 'escuro-cinza'
                            ? 'ring-2 sm:ring-4 ring-purple-500 shadow-xl'
                            : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600 shadow-md'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        animate={selectedTheme === 'escuro-cinza' ? { boxShadow: '0 10px 15px -3px rgba(168, 85, 247, 0.5), 0 4px 6px -2px rgba(168, 85, 247, 0.2)' } : {}}
                      >
                        <div className={`w-full h-36 sm:h-40 ${getThemeClasses('escuro-cinza').background} rounded-lg sm:rounded-xl p-2.5 sm:p-4 mb-3 sm:mb-4 border-2 ${getThemeClasses('escuro-cinza').border} shadow-inner`}>
                          <div className="space-y-1 sm:space-y-2">
                            <div className={`text-[10px] sm:text-sm font-bold ${getThemeClasses('escuro-cinza').text} leading-tight`}>
                              Rifa do iPhone 15
                            </div>
                            <div className={`text-[9px] sm:text-xs ${getThemeClasses('escuro-cinza').textSecondary} leading-tight`}>
                              R$ 5,00 por bilhete
                            </div>
                            <div className={`${getThemeClasses('escuro-cinza').cardBg} rounded-md sm:rounded-lg p-1.5 sm:p-3 space-y-1 sm:space-y-2`}>
                              <div className={`text-[9px] sm:text-xs font-medium ${getThemeClasses('escuro-cinza').textSecondary} leading-tight`}>
                                Progresso
                              </div>
                              <div className="bg-gray-700 rounded-full h-1.5 sm:h-2">
                                <div 
                                  className={`h-1.5 sm:h-2 rounded-full w-2/3 ${colorMode === 'gradient' ? (isCustomGradient ? 'animate-gradient-x bg-[length:200%_200%]' : `bg-gradient-to-r ${selectedGradient} animate-gradient-x bg-[length:200%_200%]`) : ''}`}
                                  style={colorMode === 'solid' ? { backgroundColor: selectedColor } : (isCustomGradient ? { background: getCustomGradientStyle(), backgroundSize: '200% 200%' } : {})}
                                ></div>
                              </div>
                            </div>
                            <div 
                              className={`text-white text-[10px] sm:text-xs py-1.5 sm:py-2 px-2 sm:px-3 rounded-md sm:rounded-lg text-center font-semibold shadow-md leading-tight ${colorMode === 'gradient' ? (isCustomGradient ? 'animate-gradient-x bg-[length:200%_200%]' : `bg-gradient-to-r ${selectedGradient} animate-gradient-x bg-[length:200%_200%]`) : ''}`}
                              style={colorMode === 'solid' ? { backgroundColor: selectedColor } : (isCustomGradient ? { background: getCustomGradientStyle(), backgroundSize: '200% 200%' } : {})}
                            >
                              Participar
                            </div>
                          </div>
                        </div>
                        <p className="text-center text-sm sm:text-base font-bold text-gray-900 dark:text-white">Escuro Cinza</p>
                      </motion.div>
                    </div>
                  </div>

                  {/* Color Mode Selection */}
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                      Modo de Cor
                    </h2>
                    <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                      Escolha entre uma cor sólida para um design clássico ou um gradiente animado para um efeito moderno.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <motion.button // Animação interativa
                        onClick={() => setColorMode('solid')}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 ${
                          colorMode === 'solid'
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <span className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">Cor Sólida</span>
                          {colorMode === 'solid' && <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />}
                        </div>
                        <div className="w-full h-6 sm:h-8 rounded-lg shadow-md" style={{ backgroundColor: selectedColor }}></div>
                      </motion.button>
                      <motion.button // Animação interativa
                        onClick={() => setColorMode('gradient')}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 ${
                          colorMode === 'gradient'
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <span className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">Gradiente Animado</span>
                          {colorMode === 'gradient' && <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />}
                        </div>
                        <div className={`w-full h-6 sm:h-8 rounded-lg shadow-md ${isCustomGradient ? 'animate-gradient-x bg-[length:200%_200%]' : `bg-gradient-to-r ${selectedGradient} animate-gradient-x bg-[length:200%_200%]`}`} style={isCustomGradient ? { background: getCustomGradientStyle(), backgroundSize: '200% 200%' } : {}} ></div>
                      </motion.button>
                    </div>
                  </div>

                  {/* Solid Colors */}
                  <div className={colorMode === 'gradient' ? 'opacity-40 pointer-events-none' : ''}>
                    <div>
                      <div className="flex items-center justify-between mb-1 sm:mb-2">
                        <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white"> Cor principal </h2>
                        {colorMode === 'gradient' && (
                          <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 sm:px-3 py-1 rounded-full"> Desabilitado </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                        {colorMode === 'gradient' ? 'A cor principal está desabilitada porque o Gradiente Animado está ativo' : 'Escolha a cor principal que será usada em botões e elementos de destaque'}
                      </p>
                      <div className="grid grid-cols-6 md:grid-cols-9 lg:grid-cols-12 gap-3 sm:gap-4 mb-6 sm:mb-8">
                        {solidColors.map((color) => (
                          <motion.div // Animação interativa para seleção de cor
                            key={color}
                            onClick={() => colorMode === 'solid' && setSelectedColor(color)}
                            className={`w-full aspect-square rounded-lg sm:rounded-xl cursor-pointer shadow-md transition-all duration-150 ${
                              selectedColor === color && colorMode === 'solid'
                                ? 'ring-4 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-purple-500 scale-110'
                                : 'hover:scale-105'
                            }`}
                            style={{ backgroundColor: color }}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          ></motion.div>
                        ))}
                      </div>
                      <div className="flex items-center space-x-4 sm:space-x-6">
                        <input
                          type="color"
                          value={selectedColor}
                          onChange={(e) => setSelectedColor(e.target.value)}
                          className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                        />
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Cor Hexadecimal
                          </label>
                          <input
                            type="text"
                            value={selectedColor.toUpperCase()}
                            onChange={(e) => setSelectedColor(e.target.value)}
                            className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base font-mono focus:ring-purple-500 focus:border-purple-500"
                            maxLength={7}
                            onBlur={() => {
                              if (!/^#([0-9A-F]{3}){1,2}$/i.test(selectedColor)) {
                                setSelectedColor('#3B82F6');
                                showError('Código de cor inválido. Usando o padrão.');
                              }
                            }}
                          />
                        </div>
                        <div className="w-16 sm:w-20 text-center">
                            <span className="text-gray-900 dark:text-white font-mono text-base sm:text-lg font-bold">{selectedColor.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gradients */}
                  <div className={colorMode === 'solid' ? 'opacity-40 pointer-events-none' : ''}>
                    <div>
                      <div className="flex items-center justify-between mb-1 sm:mb-2">
                        <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white"> Gradientes animados </h2>
                        {colorMode === 'solid' && (
                          <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 sm:px-3 py-1 rounded-full"> Desabilitado </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                        {colorMode === 'solid' ? 'Os gradientes estão desabilitados porque a Cor Sólida está ativa' : 'Escolha um gradiente pré-definido ou crie o seu próprio com até 3 cores' }
                      </p>
                      <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6">
                        <motion.button
                          onClick={() => colorMode === 'gradient' && setIsCustomGradient(false)}
                          disabled={colorMode === 'solid'}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className={`flex-1 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm rounded-lg sm:rounded-xl font-semibold transition-all duration-300 ${
                            !isCustomGradient && colorMode === 'gradient'
                              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                          } ${colorMode === 'solid' ? 'cursor-not-allowed' : ''}`}
                        >
                          Predefinidos
                        </motion.button>
                        <motion.button
                          onClick={() => colorMode === 'gradient' && setIsCustomGradient(true)}
                          disabled={colorMode === 'solid'}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className={`flex-1 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm rounded-lg sm:rounded-xl font-semibold transition-all duration-300 ${
                            isCustomGradient && colorMode === 'gradient'
                              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                          } ${colorMode === 'solid' ? 'cursor-not-allowed' : ''}`}
                        >
                          Personalizado
                        </motion.button>
                      </div>

                      {/* Predefined Gradients */}
                      {!isCustomGradient && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          exit={{ opacity: 0, y: -10 }}
                          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
                        >
                          {gradients.map((gradient) => (
                            <motion.div // Animação interativa para seleção de gradiente
                              key={gradient.id}
                              onClick={() => colorMode === 'gradient' && setSelectedGradient(gradient.classes)}
                              className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl cursor-pointer border-2 transition-all duration-300 ${
                                selectedGradient === gradient.classes && colorMode === 'gradient'
                                  ? 'ring-2 ring-purple-500 shadow-xl'
                                  : 'hover:border-gray-300 dark:hover:border-gray-600 shadow-md'
                              }`}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.98 }}
                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                              animate={selectedGradient === gradient.classes && colorMode === 'gradient' ? { boxShadow: '0 5px 10px rgba(168, 85, 247, 0.3)' } : {}}
                            >
                              <div className={`w-full h-8 sm:h-10 rounded-lg mb-2 sm:mb-3 shadow-lg bg-gradient-to-r ${gradient.classes} animate-gradient-x bg-[length:200%_200%]`}></div>
                              <p className="text-center text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{gradient.name}</p>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}

                      {/* Custom Gradient */}
                      {isCustomGradient && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          exit={{ opacity: 0, y: -10 }}
                          className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-gray-200/50 dark:border-gray-700/50 mb-4 sm:mb-6"
                        >
                          <div className="flex items-center justify-between mb-4 sm:mb-6">
                            <h3 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white"> Suas cores personalizadas </h3>
                            <motion.button // Animação interativa para botão Random
                              onClick={colorMode === 'gradient' ? handleRandomGradient : undefined}
                              disabled={colorMode === 'solid'}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              transition={{ type: "spring", stiffness: 500, damping: 20 }}
                              className={`px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 sm:gap-2 ${
                                colorMode === 'solid' ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                              }`}
                            >
                              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" /> Random
                            </motion.button>
                          </div>
                          <div className="space-y-3 sm:space-y-4">
                            {customGradientColors.map((color, index) => (
                              <div key={index} className="flex items-center gap-2 sm:gap-4">
                                <div className="flex-shrink-0 text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 w-12 sm:w-16"> Cor {index + 1} </div>
                                <div className="relative flex-1">
                                  <input type="color" value={color} onChange={(e) => handleUpdateCustomColor(index, e.target.value)} className="w-full h-10 sm:h-12 rounded-lg sm:rounded-xl border-2 border-gray-300 dark:border-gray-600 cursor-pointer" style={{ backgroundColor: color }} />
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3 flex-1">
                                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl shadow-lg border-2 border-white dark:border-gray-700" style={{ backgroundColor: color }} ></div>
                                  <input type="text" value={color.toUpperCase()} onChange={(e) => handleUpdateCustomColor(index, e.target.value)} className="flex-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base font-mono focus:ring-purple-500 focus:border-purple-500" maxLength={7} />
                                </div>
                                {index >= 2 && (
                                  <motion.button // Animação interativa para botão Remover
                                    onClick={() => handleRemoveCustomColor(index)}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                                    className="text-red-500 hover:text-red-700 p-1 sm:p-2 rounded-full transition-all"
                                  >
                                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                                  </motion.button>
                                )}
                              </div>
                            ))}
                            {customGradientColors.length < 3 && (
                              <motion.button // Animação interativa para botão Adicionar
                                onClick={colorMode === 'gradient' ? handleAddCustomColor : undefined}
                                disabled={colorMode === 'solid'}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-500 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Plus className="h-4 w-4 sm:h-5 sm:w-5" /> Adicionar Cor
                              </motion.button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Preview */}
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3 }}>
                    <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 flex items-center gap-2">
                      <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" /> Pré-visualização 
                    </h3>
                    <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6"> Veja como sua campanha ficará para os visitantes </p>
                    <div className={`${getThemeClasses(selectedTheme).background} rounded-xl sm:rounded-2xl p-4 sm:p-8 ${getThemeClasses(selectedTheme).border} border-2 transition-all duration-300 shadow-xl`}>
                      <div className="space-y-3 sm:space-y-5">
                        <h4 className={`text-lg sm:text-2xl font-bold ${getThemeClasses(selectedTheme).text}`}> Rifa do iPhone 15 Pro Max </h4>
                        <div className={`${getThemeClasses(selectedTheme).cardBg} rounded-lg sm:rounded-xl p-3 sm:p-4 inline-flex items-center space-x-2 sm:space-x-3 shadow-md`}>
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg ${colorMode === 'gradient' ? (isCustomGradient ? 'animate-gradient-x bg-[length:200%_200%]' : `bg-gradient-to-r ${selectedGradient} animate-gradient-x bg-[length:200%_200%]`) : ''}`} style={colorMode === 'solid' ? { backgroundColor: selectedColor } : (isCustomGradient ? { background: getCustomGradientStyle(), backgroundSize: '200% 200%' } : {})} > G </div>
                          <div>
                            <div className={`text-xs ${getThemeClasses(selectedTheme).textSecondary}`}> Organizado por: </div>
                            <div className={`text-sm sm:text-base font-bold ${getThemeClasses(selectedTheme).text}`}> João Silva </div>
                          </div>
                        </div>
                        <div className={`${getThemeClasses(selectedTheme).cardBg} rounded-lg sm:rounded-xl p-3 sm:p-5 shadow-md`}>
                          <div className={`text-xs sm:text-sm font-semibold ${getThemeClasses(selectedTheme).textSecondary} mb-2`}>
                            Progresso
                          </div>
                          <div className={`rounded-full h-2 sm:h-2.5 ${selectedTheme === 'claro' ? 'bg-gray-200' : 'bg-gray-600'}`}>
                            <div 
                              className={`h-2 sm:h-2.5 rounded-full w-2/3 ${colorMode === 'gradient' ? (isCustomGradient ? 'animate-gradient-x bg-[length:200%_200%]' : `bg-gradient-to-r ${selectedGradient} animate-gradient-x bg-[length:200%_200%]`) : ''}`}
                              style={colorMode === 'solid' ? { backgroundColor: selectedColor } : (isCustomGradient ? { background: getCustomGradientStyle(), backgroundSize: '200% 200%' } : {})}
                            ></div>
                          </div>
                        </div>
                        <div 
                          className={`text-white text-base sm:text-lg py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl text-center font-bold shadow-lg ${colorMode === 'gradient' ? (isCustomGradient ? 'animate-gradient-x bg-[length:200%_200%]' : `bg-gradient-to-r ${selectedGradient} animate-gradient-x bg-[length:200%_200%]`) : ''}`}
                          style={colorMode === 'solid' ? { backgroundColor: selectedColor } : (isCustomGradient ? { background: getCustomGradientStyle(), backgroundSize: '200% 200%' } : {})}
                        >
                          Participar Agora
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <div className="p-4 sm:p-6 bg-blue-50 dark:bg-blue-900/30 rounded-xl sm:rounded-2xl border border-blue-200 dark:border-blue-800 shadow-md flex items-start space-x-3 sm:space-x-4">
                    <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-blue-900 dark:text-blue-100 text-sm sm:text-base font-bold mb-1 sm:mb-2"> Dica de Design </p>
                      <p className="text-blue-800 dark:text-blue-200 text-xs sm:text-sm"> {colorMode === 'solid' ? 'Para melhor legibilidade, escolha cores mais escuras como cor principal. Cores muito claras podem dificultar a leitura do texto branco nos botões.' : 'Gradientes animados criam um efeito visual impressionante e moderno. Eles são perfeitos para destacar botões e elementos importantes da sua campanha.' } </p>
                    </div>
                  </div>

                  {/* Save Button */}
                  <motion.button // Animação interativa para o botão Salvar
                    onClick={handleSaveChanges}
                    disabled={saving}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg transition-all duration-300 flex items-center justify-center space-x-2 sm:space-x-3 shadow-lg animate-gradient-x bg-[length:200%_200%]"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <span>Salvar alterações</span>
                        <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}

              {/* Logo Tab */}
              {activeTab === 'sua-logo' && (
                <motion.div 
                  key="sua-logo" 
                  variants={tabContentVariants} 
                  initial="hidden" 
                  animate="show" 
                  exit="exit" 
                  transition={{ duration: 0.2 }}
                >
                  <h2 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
                    <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400" /> Sua logo
                  </h2>
                  <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400 mb-6 sm:mb-8"> Adicione sua logo e deixe suas campanhas com a identidade da sua marca. </p>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                    {/* Current Logo / Preview */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                      <h3 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
                        Logo Atual
                      </h3>
                      {currentLogoUrl ? (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ type: "spring", stiffness: 100, damping: 15 }}
                          className="relative flex justify-center items-center p-6 sm:p-10 bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-inner border border-gray-200 dark:border-gray-700 min-h-[150px]"
                        >
                          <img 
                            src={currentLogoUrl} 
                            alt="Logo Atual" 
                            className="max-h-24 sm:max-h-32 w-auto object-contain"
                          />
                          <motion.button // Animação interativa para botão Remover Logo
                            onClick={handleRemoveLogo}
                            disabled={uploadingLogo}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 500, damping: 20 }}
                            className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-red-500 hover:bg-red-600 text-white p-2 sm:p-2.5 rounded-full transition-all duration-300 shadow-lg disabled:opacity-50"
                            title="Remover Logo"
                          >
                            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                          </motion.button>
                        </motion.div>
                      ) : (
                        <div className="text-center py-10 sm:py-16 bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-inner border border-gray-200 dark:border-gray-700">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-700 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                            <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-gray-500 dark:text-gray-400" />
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 font-medium text-sm sm:text-base">Nenhuma logo definida</p>
                        </div>
                      )}
                    </div>

                    {/* Upload Section */}
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-purple-200/50 dark:border-purple-800/50 shadow-lg">
                      <h3 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
                        Fazer Upload
                      </h3>
                      <input
                        type="file"
                        accept="image/*"
                        ref={logoInputRef}
                        onChange={handleLogoSelect}
                        className="hidden"
                      />
                      
                      {logoPreviewUrl ? (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          className="relative p-6 sm:p-8 bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-inner border border-gray-300 dark:border-gray-600 text-center"
                        >
                          <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-4">Nova Logo - Pré-visualização:</p>
                          <img 
                            src={logoPreviewUrl} 
                            alt="Pré-visualização da Logo" 
                            className="max-h-24 sm:max-h-32 w-auto object-contain mx-auto"
                          />
                          <motion.button // Animação interativa para botão Cancelar
                            onClick={() => { setLogoFile(null); setLogoPreviewUrl(null); }}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 500, damping: 20 }}
                            className="absolute -top-2 sm:-top-3 -right-2 sm:-right-3 bg-gray-500 hover:bg-gray-600 text-white p-1.5 sm:p-2 rounded-full transition-all duration-300 shadow-lg" 
                            title="Cancelar"
                          >
                            <X className="h-4 w-4 sm:h-5 sm:w-5" />
                          </motion.button>
                          
                          <div className="mt-4 sm:mt-6">
                            <motion.button // Animação interativa para botão Confirmar Upload
                              onClick={handleUploadLogo}
                              disabled={uploadingLogo}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.98 }}
                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base transition-all duration-300 flex items-center space-x-2 sm:space-x-3 shadow-lg mx-auto"
                            >
                              {uploadingLogo ? (
                                <> 
                                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                                  <span>Enviando...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                  <span>Confirmar Upload</span>
                                </>
                              )}
                            </motion.button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div // Animação interativa para a área de drop/clique
                          onClick={() => logoInputRef.current?.click()} 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.99 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center transition-all duration-300 cursor-pointer hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 group"
                        >
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                            <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600 dark:text-purple-400" />
                          </div>
                          <p className="text-gray-800 dark:text-gray-200 font-bold text-sm sm:text-lg mb-1">
                            Clique para selecionar ou arraste
                          </p>
                          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                            PNG, JPG, SVG (Máx. 5MB)
                          </p>
                        </motion.div>
                      )}

                      <div className="mt-6 sm:mt-8 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl sm:rounded-2xl border border-blue-200 dark:border-blue-800 shadow-md flex items-start space-x-3 sm:space-x-4">
                        <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-blue-900 dark:text-blue-100 text-sm sm:text-base font-bold mb-1 sm:mb-2"> Otimização </p>
                          <p className="text-blue-800 dark:text-blue-200 text-xs sm:text-sm"> Para melhor visualização, recomendamos logos com fundo transparente (PNG ou SVG) e um bom contraste com os temas claro e escuro. </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Dominios Tab */}
              {activeTab === 'dominios' && (
                <motion.div 
                  key="dominios" 
                  variants={tabContentVariants} 
                  initial="hidden" 
                  animate="show" 
                  exit="exit" 
                  transition={{ duration: 0.2 }}
                >
                  <h2 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
                    <ExternalLink className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400" /> Domínios Customizados
                  </h2>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400">
                      Publique suas campanhas em seu próprio domínio (ex: rifa.minhamarca.com).
                    </p>
                    <motion.button // Animação interativa para botão Adicionar Domínio
                      onClick={() => setShowDomainModal(true)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-2xl text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base transition-all duration-300 flex items-center justify-center space-x-1.5 sm:space-x-2 shadow-lg whitespace-nowrap"
                    >
                      <Plus className="h-4 w-4 sm:h-5 sm:w-5" /> <span>Adicionar Domínio</span>
                    </motion.button>
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                    <h3 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6"> Domínios configurados </h3>
                    {loadingDomains ? (
                      <div className="text-center py-12 sm:py-16">
                        <motion.div // Animação de loading
                          className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-4 border-purple-600 mx-auto mb-3 sm:mb-4"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        ></motion.div>
                        <p className="text-gray-600 dark:text-gray-400 font-medium text-sm sm:text-base">Carregando domínios...</p>
                      </div>
                    ) : customDomains.length > 0 ? (
                      <div className="space-y-3 sm:space-y-4">
                        {customDomains.map((domain) => (
                          <motion.div // Animação de entrada e hover para cada item de domínio
                            key={domain.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                            whileHover={{ scale: 1.01, boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)' }}
                            className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-md transition-all duration-300"
                          >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                              <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                                <div className="flex-shrink-0">
                                  {getStatusIcon(domain)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-base sm:text-lg text-gray-900 dark:text-white truncate">
                                    {domain.domain_name}
                                  </div>
                                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                    <span className={`font-semibold ${
                                      domain.is_verified && domain.ssl_status === 'active' ? 'text-green-500' : 
                                      domain.ssl_status === 'failed' ? 'text-red-500' : 'text-yellow-500'
                                    }`}>
                                      {getStatusText(domain)}
                                    </span>
                                    {domain.is_verified && domain.ssl_status === 'active' && (
                                      <a href={`https://${domain.domain_name}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                        (Acessar)
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-2 sm:gap-3 ml-auto sm:ml-0 flex-shrink-0">
                                {!domain.is_verified && (
                                  <motion.button // Animação interativa para botão Verificar
                                    onClick={() => handleVerifyDomain(domain.id)}
                                    disabled={verifyingDomain === domain.id}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    className="text-blue-600 dark:text-blue-400 font-semibold text-xs sm:text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-1.5 whitespace-nowrap p-1 sm:p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                  >
                                    {verifyingDomain === domain.id ? (
                                      <>
                                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                        <span>Verificando...</span>
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                        <span>Verificar</span>
                                      </>
                                    )}
                                  </motion.button>
                                )}
                                <motion.button // Animação interativa para botão Remover
                                  onClick={() => handleDeleteDomain(domain.id, domain.domain_name)}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                  className="text-red-500 dark:text-red-400 font-semibold text-xs sm:text-sm transition-all duration-300 flex items-center gap-1 sm:gap-1.5 whitespace-nowrap p-1 sm:p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30"
                                >
                                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span>Remover</span>
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 sm:py-16">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 dark:bg-gray-700 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                          <ExternalLink className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 dark:text-gray-500" />
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg font-medium mb-1 sm:mb-2"> Nenhum domínio configurado </p>
                        <p className="text-gray-500 dark:text-gray-500 text-xs sm:text-sm"> Adicione seu primeiro domínio personalizado </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </main> 

      {/* Domain Modal */}
      <AnimatePresence>
        {showDomainModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
          >
            <motion.div 
              initial={{ y: 50, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
              className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                  Adicionar Domínio
                </h3>
                <motion.button 
                  onClick={() => setShowDomainModal(false)}
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1.5 sm:p-2 rounded-full transition-all"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </motion.button>
              </div>

              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                Insira o domínio completo que você deseja usar (ex: `rifa.minhamarca.com`).
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="newDomain" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Domínio
                  </label>
                  <input
                    type="text"
                    id="newDomain"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="ex: rifa.minhamarca.com"
                    className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl px-4 py-3 text-base focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div className="flex justify-end">
                  <motion.button // Animação interativa para botão Salvar Domínio no Modal
                    onClick={handleSaveDomain}
                    disabled={saving || !newDomain.trim()}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 sm:px-8 py-3 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Adicionando...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span>Salvar Domínio</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>

              <div className="mt-6 p-4 sm:p-5 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800 shadow-inner flex items-start space-x-3 sm:space-x-4">
                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">
                    <strong className="block mb-1">Como funciona:</strong>
                    Após adicionar o domínio, você receberá instruções para configurar o DNS. 
                    O certificado SSL será ativado automaticamente após a verificação bem-sucedida.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Modals */}
      <ConfirmModal
        isOpen={showRemoveLogoConfirm}
        title="Remover Logo"
        message="Tem certeza que deseja remover sua logo? Esta ação não pode ser desfeita."
        confirmText="Remover"
        cancelText="Cancelar"
        type="danger"
        loading={uploadingLogo}
        onConfirm={confirmRemoveLogo}
        onCancel={() => setShowRemoveLogoConfirm(false)}
      />

      <ConfirmModal
        isOpen={showDeleteDomainConfirm}
        title="Remover Domínio"
        message={`Tem certeza que deseja remover o domínio ${selectedDomainToDelete?.name}? Esta ação não pode ser desfeita.`}
        confirmText="Remover"
        cancelText="Cancelar"
        type="danger"
        loading={deleting}
        onConfirm={confirmDeleteDomain}
        onCancel={() => {
          setShowDeleteDomainConfirm(false);
          setSelectedDomainToDelete(null);
        }}
      />
    </motion.div>
  );
};

export default CustomizationPage;