import React, { useState } from 'react';
import { Upload, Plus, ArrowRight, X, Loader2, Trash2, ExternalLink, CheckCircle, AlertCircle, Clock, Sparkles, Palette, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { supabase } from '../lib/supabase';
import { CustomDomainsAPI, CustomDomain } from '../lib/api/customDomains';
import ConfirmModal from '../components/ConfirmModal';
import { motion, AnimatePresence } from 'framer-motion';

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6 sm:mb-8 relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-xl border border-purple-200/30 dark:border-purple-800/30 bg-gradient-to-br from-purple-50/80 to-blue-50/80 dark:from-purple-900/20 dark:to-blue-900/20 backdrop-blur-sm"
        >
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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-4 sm:mb-6 bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-200/20 dark:border-gray-700/30 p-1.5 sm:p-2 shadow-lg"
        >
          <div className="flex space-x-1.5 sm:space-x-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab.id)}
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
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-200/20 dark:border-gray-700/30 p-4 sm:p-8 shadow-lg"
          >
            {/* Cores e tema Tab */}
            {activeTab === 'cores-tema' && (
              <div className="space-y-6 sm:space-y-8">
                {/* Theme Selection */}
                <div>
                  <motion.h2
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 flex items-center gap-2"
                  >
                    <Palette className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                    Tema visual
                  </motion.h2>
                  <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                    Escolha o tema que melhor combina com sua marca
                  </p>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
                    {[
                      { id: 'claro', label: 'Claro' },
                      { id: 'escuro', label: 'Escuro' },
                      { id: 'escuro-preto', label: 'Escuro Preto' },
                      { id: 'escuro-cinza', label: 'Escuro Cinza' }
                    ].map((theme, index) => (
                      <motion.div
                        key={theme.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => setSelectedTheme(theme.id)}
                        className={`cursor-pointer rounded-xl sm:rounded-2xl p-3 sm:p-5 transition-all duration-300 ${
                          selectedTheme === theme.id
                            ? 'ring-2 sm:ring-4 ring-purple-500 shadow-xl'
                            : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600 shadow-md'
                        }`}
                      >
                        <div className={`w-full h-36 sm:h-40 ${getThemeClasses(theme.id).background} rounded-lg sm:rounded-xl p-2.5 sm:p-4 mb-3 sm:mb-4 ${getThemeClasses(theme.id).border} border-2 shadow-inner`}>
                          <div className="space-y-1 sm:space-y-2">
                            <div className={`text-[10px] sm:text-sm font-bold ${getThemeClasses(theme.id).text} leading-tight`}>
                              Rifa do iPhone 15
                            </div>
                            <div className={`text-[9px] sm:text-xs ${getThemeClasses(theme.id).textSecondary} leading-tight`}>
                              R$ 5,00 por bilhete
                            </div>
                            <div className={`${getThemeClasses(theme.id).cardBg} rounded-md sm:rounded-lg p-1.5 sm:p-3 space-y-1 sm:space-y-2`}>
                              <div className={`text-[9px] sm:text-xs font-medium ${getThemeClasses(theme.id).textSecondary} leading-tight`}>
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
                        <p className="text-center text-sm sm:text-base font-bold text-gray-900 dark:text-white">{theme.label}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Color Mode Selection */}
                <div>
                  <motion.h2
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 flex items-center gap-2"
                  >
                    <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                    Estilo de cor
                  </motion.h2>
                  <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                    Escolha entre cor sólida ou gradiente animado
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    {(['solid', 'gradient'] as const).map((mode, index) => (
                      <motion.button
                        key={mode}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setColorMode(mode)}
                        className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 ${
                          colorMode === mode
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <span className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">
                            {mode === 'solid' ? 'Cor Sólida' : 'Gradiente Animado'}
                          </span>
                          {colorMode === mode && <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />}
                        </div>
                        <div 
                          className={`w-full h-6 sm:h-8 rounded-lg shadow-md ${mode === 'gradient' && isCustomGradient ? 'animate-gradient-x bg-[length:200%_200%]' : mode === 'gradient' ? `bg-gradient-to-r ${selectedGradient} animate-gradient-x bg-[length:200%_200%]` : ''}`}
                          style={mode === 'solid' ? { backgroundColor: selectedColor } : (isCustomGradient ? { background: getCustomGradientStyle(), backgroundSize: '200% 200%' } : {})}
                        ></div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Solid Colors */}
                <AnimatePresence>
                  {colorMode === 'solid' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1 sm:mb-2">
                          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                            Cor principal
                          </h2>
                        </div>
                        <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                          A cor selecionada será aplicada aos elementos principais da sua campanha
                        </p>

                        <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
                          {solidColors.map((color, index) => (
                            <motion.button
                              key={color}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.02 }}
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setSelectedColor(color)}
                              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl transition-all duration-300 shadow-md hover:shadow-xl ${
                                selectedColor === color
                                  ? 'ring-2 sm:ring-4 ring-purple-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 scale-110'
                                  : 'hover:scale-105'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}

                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="relative"
                          >
                            <input
                              type="color"
                              value={selectedColor}
                              onChange={(e) => setSelectedColor(e.target.value)}
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl border-2 border-gray-300 dark:border-gray-600 opacity-0 absolute inset-0 cursor-pointer"
                            />
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300 shadow-md">
                              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500"></div>
                            </div>
                          </motion.div>
                        </div>

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                          className="mb-4 sm:mb-6 p-3 sm:p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-xl sm:rounded-2xl border border-gray-200/50 dark:border-gray-700/50"
                        >
                          <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">Cor selecionada:</p>
                          <div className="flex items-center space-x-3 sm:space-x-4">
                            <div
                              className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl shadow-lg border-4 border-white dark:border-gray-700"
                              style={{ backgroundColor: selectedColor }}
                            ></div>
                            <div>
                              <span className="text-gray-900 dark:text-white font-mono text-base sm:text-lg font-bold">{selectedColor.toUpperCase()}</span>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Código hexadecimal</p>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Gradients */}
                <AnimatePresence>
                  {colorMode === 'gradient' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1 sm:mb-2">
                          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                            Gradientes animados
                          </h2>
                        </div>
                        <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                          Escolha um gradiente pré-definido ou crie o seu próprio com até 3 cores
                        </p>

                        <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsCustomGradient(false)}
                            className={`flex-1 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm rounded-lg sm:rounded-xl font-semibold transition-all duration-300 ${
                              !isCustomGradient
                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            Predefinidos
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsCustomGradient(true)}
                            className={`flex-1 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm rounded-lg sm:rounded-xl font-semibold transition-all duration-300 ${
                              isCustomGradient
                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            Personalizado
                          </motion.button>
                        </div>

                        <AnimatePresence mode="wait">
                          {!isCustomGradient && (
                            <motion.div
                              key="predefined"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.3 }}
                              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6"
                            >
                              {gradients.map((gradient, index) => (
                                <motion.button
                                  key={gradient.id}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: index * 0.03 }}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setSelectedGradient(gradient.classes)}
                                  className={`group relative overflow-hidden rounded-xl sm:rounded-2xl transition-all duration-300 ${
                                    selectedGradient === gradient.classes && !isCustomGradient
                                      ? 'ring-2 sm:ring-4 ring-purple-500 shadow-2xl scale-105'
                                      : 'hover:scale-105 hover:shadow-xl'
                                  }`}
                                >
                                  <div className={`h-20 sm:h-24 bg-gradient-to-r ${gradient.classes} animate-gradient-x bg-[length:200%_200%]`}></div>
                                  {selectedGradient === gradient.classes && !isCustomGradient && (
                                    <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 bg-white dark:bg-gray-900 rounded-full p-1 shadow-lg">
                                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                                    </div>
                                  )}
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 sm:p-3">
                                    <p className="text-white text-xs font-semibold text-center">{gradient.name}</p>
                                  </div>
                                </motion.button>
                              ))}
                            </motion.div>
                          )}

                          {isCustomGradient && (
                            <motion.div
                              key="custom"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.3 }}
                            >
                              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-gray-200/50 dark:border-gray-700/50 mb-4 sm:mb-6">
                                <div className="flex items-center justify-between mb-4 sm:mb-6">
                                  <h3 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">
                                    Suas cores personalizadas
                                  </h3>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleRandomGradient}
                                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 sm:gap-2"
                                  >
                                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                                    Random
                                  </motion.button>
                                </div>

                                <div className="space-y-3 sm:space-y-4">
                                  {customGradientColors.map((color, index) => (
                                    <motion.div
                                      key={index}
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: index * 0.05 }}
                                      className="flex items-center gap-2 sm:gap-4"
                                    >
                                      <div className="flex-shrink-0 text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 w-12 sm:w-16">
                                        Cor {index + 1}
                                      </div>
                                      
                                      <div className="relative flex-1">
                                        <input
                                          type="color"
                                          value={color}
                                          onChange={(e) => handleUpdateCustomColor(index, e.target.value)}
                                          className="w-full h-10 sm:h-12 rounded-lg sm:rounded-xl border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                                          style={{ backgroundColor: color }}
                                        />
                                      </div>

                                      <div className="flex items-center gap-2 sm:gap-3 flex-1">
                                        <div 
                                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl shadow-lg border-2 border-white dark:border-gray-700"
                                          style={{ backgroundColor: color }}
                                        ></div>
                                        <input
                                          type="text"
                                          value={color.toUpperCase()}
                                          onChange={(e) => handleUpdateCustomColor(index, e.target.value)}
                                          className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md sm:rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                          placeholder="#000000"
                                        />
                                      </div>

                                      {customGradientColors.length > 2 && (
                                        <motion.button
                                          whileHover={{ scale: 1.1 }}
                                          whileTap={{ scale: 0.9 }}
                                          onClick={() => handleRemoveCustomColor(index)}
                                          className="flex-shrink-0 p-1.5 sm:p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg sm:rounded-xl transition-all duration-300"
                                          title="Remover cor"
                                        >
                                          <X className="h-4 w-4 sm:h-5 sm:w-5" />
                                        </motion.button>
                                      )}
                                    </motion.div>
                                  ))}
                                </div>

                                {customGradientColors.length < 3 && (
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleAddCustomColor}
                                    className="mt-3 sm:mt-4 w-full py-2 sm:py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 font-semibold"
                                  >
                                    <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                                    Adicionar cor (máx. 3)
                                  </motion.button>
                                )}
                              </div>

                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-4 sm:mb-6 p-3 sm:p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-xl sm:rounded-2xl border border-gray-200/50 dark:border-gray-700/50"
                              >
                                <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">Gradiente personalizado:</p>
                                <div 
                                  className="w-full h-16 sm:h-20 rounded-xl sm:rounded-2xl shadow-xl animate-gradient-x bg-[length:200%_200%]"
                                  style={{ 
                                    background: getCustomGradientStyle(),
                                    backgroundSize: '200% 200%'
                                  }}
                                ></div>
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {!isCustomGradient && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 sm:mb-6 p-3 sm:p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-xl sm:rounded-2xl border border-gray-200/50 dark:border-gray-700/50"
                          >
                            <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">Gradiente selecionado:</p>
                            <div className={`w-full h-16 sm:h-20 rounded-xl sm:rounded-2xl shadow-xl bg-gradient-to-r ${selectedGradient} animate-gradient-x bg-[length:200%_200%]`}></div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Preview */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mb-6 sm:mb-8"
                >
                  <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 flex items-center gap-2">
                    <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                    Pré-visualização
                  </h3>
                  <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                    Veja como sua campanha ficará para os visitantes
                  </p>
                  <div className={`${getThemeClasses(selectedTheme).background} rounded-xl sm:rounded-2xl p-4 sm:p-8 ${getThemeClasses(selectedTheme).border} border-2 transition-all duration-300 shadow-xl`}>
                    {/* ... preview content ... */}
                  </div>
                  <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg sm:rounded-xl">
                    <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 text-center">
                      Esta é uma prévia de como sua campanha aparecerá para os visitantes
                    </p>
                  </div>
                </motion.div>

                {/* Save Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveChanges}
                  disabled={saving}
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
              </div>
            )}

            {/* Sua Logo Tab */}
            {activeTab === 'sua-logo' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                {/* ... todo o conteúdo da logo com animações internas ... */}
              </motion.div>
            )}

            {/* Domínios Tab */}
            {activeTab === 'dominios' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-3 sm:gap-4">
                  <div>
                    <h2 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
                      <ExternalLink className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400" />
                      Domínio personalizado
                    </h2>
                    <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400">
                      Use seu próprio domínio para suas campanhas (ex: rifaminhaloja.com)
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowDomainModal(true)}
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-2xl text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base transition-all duration-300 flex items-center justify-center space-x-1.5 sm:space-x-2 shadow-lg"
                  >
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Adicionar Domínio</span>
                  </motion.button>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                  <h3 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                    Domínios configurados
                  </h3>

                  {loadingDomains ? (
                    <div className="text-center py-12 sm:py-16">
                      <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-4 border-purple-600 mx-auto mb-3 sm:mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-400 font-medium text-sm sm:text-base">Carregando domínios...</p>
                    </div>
                  ) : customDomains.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      <AnimatePresence>
                        {customDomains.map((domain, index) => (
                          <motion.div
                            key={domain.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-xl transition-all duration-300"
                          >
                            {/* ... conteúdo do domínio ... */}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="text-center py-12 sm:py-16">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                        <ExternalLink className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 dark:text-gray-500" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg font-medium mb-1 sm:mb-2">
                        Nenhum domínio configurado
                      </p>
                      <p className="text-gray-500 dark:text-gray-500 text-xs sm:text-sm">
                        Adicione seu primeiro domínio personalizado
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
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
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-700"
            >
              {/* ... conteúdo do modal ... */}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Modals */}
      <AnimatePresence>
        {showRemoveLogoConfirm && (
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
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteDomainConfirm && (
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
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CustomizationPage;