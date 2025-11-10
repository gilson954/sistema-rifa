import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // 👈 Framer Motion Importado
import { Upload, Plus, ArrowRight, X, Loader2, Trash2, ExternalLink, CheckCircle, AlertCircle, Clock, Sparkles, Palette, Eye, Lightbulb, Info } from 'lucide-react'; // 👈 Adicionando Lightbulb e Info
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { supabase } from '../lib/supabase';
import { CustomDomainsAPI, CustomDomain } from '../lib/api/customDomains';
import ConfirmModal from '../components/ConfirmModal';

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
      <motion.main // 👈 motion.main para animação de entrada da página
        className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <motion.div // 👈 motion.div para animação do cabeçalho
          className="mb-6 sm:mb-8 relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-xl border border-purple-200/30 dark:border-purple-800/30 bg-gradient-to-br from-purple-50/80 to-blue-50/80 dark:from-purple-900/20 dark:to-blue-900/20 backdrop-blur-sm"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
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
        <motion.div // 👈 motion.div para animação da barra de abas
          className="mb-4 sm:mb-6 bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-200/20 dark:border-gray-700/30 p-1.5 sm:p-2 shadow-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="flex space-x-1.5 sm:space-x-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <motion.button // 👈 motion.button para interações suaves
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ scale: 1.05 }}
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
        <motion.div // 👈 motion.div com layout para redimensionamento suave ao trocar de aba
          className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-200/20 dark:border-gray-700/30 p-4 sm:p-8 shadow-lg"
          layout
        >
          <AnimatePresence mode="wait"> {/* 👈 AnimatePresence para transição de entrada/saída entre as abas */}
            {/* Cores e tema Tab */}
            {activeTab === 'cores-tema' && (
              <motion.div
                key="cores-tema"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
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
                    {/* Theme Cards (Usando motion.div para hover/tap) */}
                    {['claro', 'escuro', 'escuro-preto', 'escuro-cinza'].map((themeId) => (
                      <motion.div
                        key={themeId}
                        onClick={() => setSelectedTheme(themeId)}
                        whileHover={{ scale: 1.03, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className={`cursor-pointer rounded-xl sm:rounded-2xl p-3 sm:p-5 transition-all duration-300 ${
                          selectedTheme === themeId
                            ? 'ring-2 sm:ring-4 ring-purple-500 shadow-xl'
                            : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600 shadow-md'
                        }`}
                      >
                        <div className={`w-full h-36 sm:h-40 ${getThemeClasses(themeId).background} rounded-lg sm:rounded-xl p-2.5 sm:p-4 mb-3 sm:mb-4 ${getThemeClasses(themeId).border} border-2 shadow-inner`}>
                          <div className="space-y-1 sm:space-y-2">
                            <div className={`text-[10px] sm:text-sm font-bold ${getThemeClasses(themeId).text} leading-tight`}>
                              Rifa do iPhone 15
                            </div>
                            <div className={`text-[9px] sm:text-xs ${getThemeClasses(themeId).textSecondary} leading-tight`}>
                              R$ 5,00 por bilhete
                            </div>
                            <div className={`${getThemeClasses(themeId).cardBg} rounded-md sm:rounded-lg p-1.5 sm:p-3 space-y-1 sm:space-y-2`}>
                              <div className={`text-[9px] sm:text-xs font-medium ${getThemeClasses(themeId).textSecondary} leading-tight`}>
                                Progresso
                              </div>
                              <div className={`${themeId === 'claro' ? 'bg-gray-200' : themeId === 'escuro' ? 'bg-gray-600' : themeId === 'escuro-preto' ? 'bg-gray-700' : 'bg-[#404040]'} rounded-full h-1.5 sm:h-2`}>
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
                        <p className="text-center text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                          {themeId === 'claro' ? 'Claro' : themeId === 'escuro' ? 'Escuro' : themeId === 'escuro-preto' ? 'Escuro Preto' : 'Escuro Cinza'}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Color Mode Selection */}
                <motion.div layout> {/* 👈 motion.div com layout para expansão suave */}
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                    Estilo de cor
                  </h2>
                  <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                    Escolha entre cor sólida ou gradiente animado
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <motion.button // 👈 motion.button com layout
                      onClick={() => setColorMode('solid')}
                      layout
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
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
                    <motion.button // 👈 motion.button com layout
                      onClick={() => setColorMode('gradient')}
                      layout
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
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
                      <div className={`w-full h-6 sm:h-8 rounded-lg shadow-md ${isCustomGradient ? 'animate-gradient-x bg-[length:200%_200%]' : `bg-gradient-to-r ${selectedGradient} animate-gradient-x bg-[length:200%_200%]`}`} 
                        style={isCustomGradient ? { background: getCustomGradientStyle(), backgroundSize: '200% 200%' } : {}}
                      ></div>
                    </motion.button>
                  </div>
                </motion.div>

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
                      {colorMode === 'gradient' ? 'As cores sólidas estão desabilitadas porque o Gradiente Animado está ativo' : 'A cor selecionada será aplicada aos elementos principais da sua campanha' }
                    </p>
                    <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
                      {solidColors.map((color) => (
                        <motion.button // 👈 motion.button para interações suaves
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          whileTap={{ scale: 0.9 }}
                          transition={{ type: "spring", stiffness: 500, damping: 20 }}
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all duration-200 shadow-md ${selectedColor === color ? 'ring-2 ring-offset-2 ring-purple-500 ring-offset-white dark:ring-offset-gray-900' : ''}`}
                          style={{ backgroundColor: color }}
                          aria-label={`Selecionar cor ${color}`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-4 sm:gap-6 bg-gray-50 dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-inner">
                      <div className="flex-shrink-0">
                        <input
                          type="color"
                          value={selectedColor}
                          onChange={(e) => setSelectedColor(e.target.value)}
                          className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={selectedColor.toUpperCase()}
                          onChange={(e) => setSelectedColor(e.target.value)}
                          className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md sm:rounded-lg px-3 py-2 sm:py-3 text-sm sm:text-base font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="#3B82F6"
                        />
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl shadow-lg border-4 border-white dark:border-gray-700" style={{ backgroundColor: selectedColor }} ></div>
                        <div>
                          <span className="text-gray-900 dark:text-white font-mono text-base sm:text-lg font-bold">{selectedColor.toUpperCase()}</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Código hexadecimal</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gradients */}
                <motion.div // 👈 motion.div com layout para redimensionamento
                  layout
                  className={colorMode === 'solid' ? 'opacity-40 pointer-events-none' : ''}
                >
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
                      <motion.button // 👈 motion.button com layout
                        onClick={() => colorMode === 'gradient' && setIsCustomGradient(false)}
                        disabled={colorMode === 'solid'}
                        layout
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex-1 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm rounded-lg sm:rounded-xl font-semibold transition-all duration-300 ${
                          !isCustomGradient && colorMode === 'gradient' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        } ${colorMode === 'solid' ? 'cursor-not-allowed' : ''}`}
                      >
                        Predefinidos
                      </motion.button>
                      <motion.button // 👈 motion.button com layout
                        onClick={() => colorMode === 'gradient' && setIsCustomGradient(true)}
                        disabled={colorMode === 'solid'}
                        layout
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex-1 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm rounded-lg sm:rounded-xl font-semibold transition-all duration-300 ${
                          isCustomGradient && colorMode === 'gradient' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        } ${colorMode === 'solid' ? 'cursor-not-allowed' : ''}`}
                      >
                        Personalizado
                      </motion.button>
                    </div>

                    <AnimatePresence mode="wait">
                      {!isCustomGradient && colorMode === 'gradient' ? (
                        <motion.div
                          key="gradients-predefined"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                            {gradients.map((gradient) => (
                              <motion.div
                                key={gradient.id}
                                onClick={() => setSelectedGradient(gradient.classes)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`cursor-pointer p-1 sm:p-2 rounded-xl sm:rounded-2xl transition-all duration-300 ${
                                  selectedGradient === gradient.classes && !isCustomGradient
                                    ? 'ring-2 ring-purple-500 shadow-lg'
                                    : 'hover:ring-1 hover:ring-gray-400 dark:hover:ring-gray-600'
                                }`}
                              >
                                <div className={`w-full h-12 sm:h-16 rounded-lg mb-2 bg-gradient-to-r ${gradient.classes} shadow-md`}></div>
                                <p className="text-center text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">{gradient.name}</p>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      ) : (
                        isCustomGradient && colorMode === 'gradient' && (
                          <motion.div // 👈 motion.div para animação de expansão do customizador
                            key="gradients-custom"
                            layout
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-6 sm:mt-8 bg-gray-50 dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-gray-200/50 dark:border-gray-700/50 mb-4 sm:mb-6"
                          >
                            <div className="flex items-center justify-between mb-4 sm:mb-6">
                              <h3 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white"> Suas cores personalizadas </h3>
                              <motion.button
                                onClick={colorMode === 'gradient' ? handleRandomGradient : undefined}
                                disabled={colorMode === 'solid'}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 sm:gap-2 ${
                                  colorMode === 'solid' ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" /> Random
                              </motion.button>
                            </div>
                            <div className="space-y-3 sm:space-y-4">
                              <AnimatePresence initial={false}> {/* AnimatePresence para cores personalizadas */}
                                {customGradientColors.map((color, index) => (
                                  <motion.div
                                    key={index}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex items-center gap-2 sm:gap-4"
                                  >
                                    <div className="flex-shrink-0 text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 w-12 sm:w-16"> Cor {index + 1} </div>
                                    <div className="relative flex-1">
                                      <input type="color" value={color} onChange={(e) => handleUpdateCustomColor(index, e.target.value)} className="w-full h-10 sm:h-12 rounded-lg sm:rounded-xl border-2 border-gray-300 dark:border-gray-600 cursor-pointer" style={{ backgroundColor: color }} />
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-3 flex-1">
                                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl shadow-lg border-2 border-white dark:border-gray-700" style={{ backgroundColor: color }} ></div>
                                      <input type="text" value={color.toUpperCase()} onChange={(e) => handleUpdateCustomColor(index, e.target.value)} className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md sm:rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="#000000" />
                                    </div>
                                    {customGradientColors.length > 2 && (
                                      <motion.button
                                        onClick={() => handleRemoveCustomColor(index)}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="text-red-500 hover:text-red-700 transition-colors duration-200"
                                      >
                                        <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                      </motion.button>
                                    )}
                                  </motion.div>
                                ))}
                              </AnimatePresence>
                              <div className="flex justify-between items-center pt-2 sm:pt-4">
                                <motion.button
                                  onClick={handleAddCustomColor}
                                  disabled={customGradientColors.length >= 3}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                                    customGradientColors.length < 3
                                      ? 'bg-purple-500 hover:bg-purple-600 text-white shadow-md'
                                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                  }`}
                                >
                                  <Plus className="h-4 w-4" /> Adicionar Cor
                                </motion.button>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Máximo de 3 cores</p>
                              </div>
                            </div>
                          </motion.div>
                        )
                      )}
                    </AnimatePresence>

                    <div className="mt-8 sm:mt-10">
                      <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 flex items-center gap-2">
                        <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" /> Pré-visualização
                      </h3>
                      <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6"> Veja como sua campanha ficará para os visitantes </p>
                      <motion.div // 👈 motion.div com layout para redimensionamento
                        layout
                        className={`${getThemeClasses(selectedTheme).background} rounded-xl sm:rounded-2xl p-4 sm:p-8 ${getThemeClasses(selectedTheme).border} border-2 transition-all duration-300 shadow-xl`}
                      >
                        <div className="space-y-3 sm:space-y-5">
                          <h4 className={`text-lg sm:text-2xl font-bold ${getThemeClasses(selectedTheme).text}`}> Rifa do iPhone 15 Pro Max </h4>
                          <div className={`${getThemeClasses(selectedTheme).cardBg} rounded-lg sm:rounded-xl p-3 sm:p-4 inline-flex items-center space-x-2 sm:space-x-3 shadow-md`}>
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg ${colorMode === 'gradient' ? (isCustomGradient ? 'animate-gradient-x bg-[length:200%_200%]' : `bg-gradient-to-r ${selectedGradient} animate-gradient-x bg-[length:200%_200%]`) : ''}`} 
                              style={colorMode === 'solid' ? { backgroundColor: selectedColor } : (isCustomGradient ? { background: getCustomGradientStyle(), backgroundSize: '200% 200%' } : {})}
                            > G </div>
                            <div>
                              <div className={`text-xs ${getThemeClasses(selectedTheme).textSecondary}`}> Organizado por: </div>
                              <div className={`text-sm sm:text-base font-bold ${getThemeClasses(selectedTheme).text}`}> João Silva </div>
                            </div>
                          </div>
                          <div className={`${getThemeClasses(selectedTheme).cardBg} rounded-lg sm:rounded-xl p-3 sm:p-5 shadow-md`}>
                            <div className={`text-xs sm:text-sm font-semibold ${getThemeClasses(selectedTheme).textSecondary} mb-2 sm:mb-3`}> Progresso da campanha </div>
                            <div className="bg-gray-300 dark:bg-gray-600 rounded-full h-3 sm:h-4 mb-2 sm:mb-3 shadow-inner">
                              <motion.div // 👈 motion.div para animação de progresso suave
                                initial={{ width: 0 }}
                                animate={{ width: "75%" }}
                                transition={{ duration: 1, type: 'spring', stiffness: 50 }}
                                className={`h-3 sm:h-4 rounded-full transition-all duration-500 ${colorMode === 'gradient' ? (isCustomGradient ? 'animate-gradient-x bg-[length:200%_200%]' : `bg-gradient-to-r ${selectedGradient} animate-gradient-x bg-[length:200%_200%]`) : ''}`}
                                style={{ width: '75%', backgroundColor: colorMode === 'solid' ? selectedColor : undefined, background: colorMode === 'gradient' && isCustomGradient ? getCustomGradientStyle() : undefined }}
                              ></motion.div>
                            </div>
                            <motion.button // 👈 motion.button para interações suaves
                              whileHover={{ scale: 1.01, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)" }}
                              whileTap={{ scale: 0.99 }}
                              className={`w-full py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-lg font-bold text-white shadow-lg transition-all duration-300 ${colorMode === 'gradient' ? (isCustomGradient ? 'animate-gradient-x bg-[length:200%_200%]' : `bg-gradient-to-r ${selectedGradient} animate-gradient-x bg-[length:200%_200%]`) : ''}`}
                              style={colorMode === 'solid' ? { backgroundColor: selectedColor } : (isCustomGradient ? { background: getCustomGradientStyle(), backgroundSize: '200% 200%' } : {})}
                            >
                              Comprar Bilhetes
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Design Tip */}
                    <div className="mt-8 sm:mt-10 bg-blue-100 dark:bg-blue-900/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-200 dark:border-blue-800 flex items-start space-x-3 sm:space-x-4">
                      <div className="flex-shrink-0 mt-0.5">
                        <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-blue-900 dark:text-blue-100 text-sm sm:text-base font-bold mb-1 sm:mb-2"> Dica de Design </p>
                        <p className="text-blue-800 dark:text-blue-200 text-xs sm:text-sm">
                          {colorMode === 'solid' ? 'Para melhor legibilidade, escolha cores mais escuras como cor principal. Cores muito claras podem dificultar a leitura do texto branco nos botões.' : 'Gradientes animados criam um efeito visual impressionante e moderno. Eles são perfeitos para destacar botões e elementos importantes da sua campanha.' }
                        </p>
                      </div>
                    </div>

                    {/* Save Button */}
                    <motion.button // 👈 motion.button para interações e feedback de loading
                      onClick={handleSaveChanges}
                      disabled={saving}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full sm:w-auto bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg transition-all duration-300 flex items-center justify-center space-x-2 sm:space-x-3 shadow-lg animate-gradient-x bg-[length:200%_200%] mt-8 sm:mt-10"
                    >
                      <AnimatePresence mode="wait">
                        {saving ? (
                          <motion.div key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center space-x-2">
                            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                            <span>Salvando...</span>
                          </motion.div>
                        ) : (
                          <motion.div key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center space-x-2">
                            <span>Salvar alterações</span>
                            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Logo Tab */}
            {activeTab === 'sua-logo' && (
              <motion.div
                key="sua-logo"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
                  <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400" /> Sua logo
                </h2>
                <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400 mb-6 sm:mb-8"> Adicione sua logo e deixe suas campanhas com a identidade da sua marca </p>
                
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                  <input type="file" ref={logoInputRef} onChange={handleLogoSelect} className="hidden" accept="image/*" />

                  {(logoPreviewUrl || currentLogoUrl) ? (
                    <div className="flex flex-col items-center">
                      <h3 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                        {logoPreviewUrl ? 'Nova Logo em Pré-visualização' : 'Logo Atual'}
                      </h3>
                      <div className="relative p-2 sm:p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl sm:rounded-2xl max-w-sm w-full bg-white dark:bg-gray-900 shadow-xl">
                        <img 
                          src={logoPreviewUrl || currentLogoUrl!} 
                          alt="Logo Preview" 
                          className="max-w-full max-h-40 sm:max-h-48 h-auto mx-auto object-contain" 
                        />
                        <div className="absolute inset-0 bg-black/10 rounded-xl sm:rounded-2xl pointer-events-none"></div>
                        
                        <AnimatePresence>
                          {logoPreviewUrl && (
                            <motion.button
                              onClick={() => { setLogoFile(null); setLogoPreviewUrl(null); }}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              whileHover={{ scale: 1.1 }}
                              transition={{ duration: 0.2 }}
                              className="absolute -top-2 sm:-top-3 -right-2 sm:-right-3 bg-gray-500 hover:bg-gray-600 text-white p-1.5 sm:p-2 rounded-full transition-all duration-300 shadow-lg" 
                              title="Cancelar"
                            >
                              <X className="h-4 w-4 sm:h-5 sm:w-5" />
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
                        {logoPreviewUrl && (
                          <motion.button // 👈 motion.button para interações suaves
                            onClick={handleUploadLogo}
                            disabled={uploadingLogo}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base transition-all duration-300 flex items-center space-x-2 sm:space-x-3 shadow-lg"
                          >
                            <AnimatePresence mode="wait">
                              {uploadingLogo ? (
                                <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center space-x-2">
                                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                                  <span>Enviando...</span>
                                </motion.div>
                              ) : (
                                <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center space-x-2">
                                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                  <span>Confirmar Upload</span>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.button>
                        )}
                        
                        {currentLogoUrl && !logoPreviewUrl && (
                          <motion.button // 👈 motion.button para interações suaves
                            onClick={handleRemoveLogo}
                            disabled={uploadingLogo}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-gradient-to-r from-red-600 to-pink-600 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base transition-all duration-300 flex items-center space-x-2 sm:space-x-3 shadow-lg"
                          >
                            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span>Remover Logo</span>
                          </motion.button>
                        )}
                        
                        {!logoPreviewUrl && (
                          <motion.button // 👈 motion.button para interações suaves
                            onClick={() => logoInputRef.current?.click()}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base transition-all duration-300 flex items-center space-x-2 sm:space-x-3 shadow-md"
                          >
                            <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span>Alterar Imagem</span>
                          </motion.button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div onClick={() => logoInputRef.current?.click()} className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center transition-all duration-300 cursor-pointer hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 group">
                      <motion.div // 👈 motion.div para animação de hover
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                        className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg"
                      >
                        <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600 dark:text-purple-400" />
                      </motion.div>
                      <p className="text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 text-sm sm:text-lg"> Clique aqui para selecionar sua logo </p>
                      <button type="button" onClick={(e) => { e.stopPropagation(); logoInputRef.current?.click(); }} className="bg-purple-600 hover:bg-purple-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base transition-all duration-300 shadow-md">
                        Selecionar Arquivo
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Domínios Tab */}
            {activeTab === 'dominios' && (
              <motion.div
                key="dominios"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                  <h2 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3">
                    <ExternalLink className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400" /> Domínios personalizados
                  </h2>
                  <motion.button // 👈 motion.button para interações suaves
                    onClick={() => setShowDomainModal(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-2xl text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base transition-all duration-300 flex items-center justify-center space-x-1.5 sm:space-x-2 shadow-lg whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Adicionar Domínio</span>
                  </motion.button>
                </div>
                
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                  <h3 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6"> Domínios configurados </h3>
                  {loadingDomains ? (
                    <div className="text-center py-12 sm:py-16">
                      <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-4 border-purple-600 mx-auto mb-3 sm:mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-400 font-medium text-sm sm:text-base">Carregando domínios...</p>
                    </div>
                  ) : customDomains.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      <AnimatePresence initial={false}> {/* 👈 AnimatePresence para transição de entrada/saída dos itens da lista */}
                        {customDomains.map((domain) => (
                          <motion.div
                            key={domain.id}
                            layout // 👈 layout para transição suave ao adicionar/remover
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-xl transition-all duration-300"
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
                                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                    Status: <span className="font-semibold">{getStatusText(domain)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1.5 sm:space-x-2">
                                <motion.button // 👈 motion.button para interações suaves
                                  onClick={() => window.open(`https://${domain.domain_name}`, '_blank')}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  title="Abrir Domínio"
                                  className="p-1.5 sm:p-2 text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 rounded-full"
                                >
                                  <ExternalLink className="h-5 w-5 sm:h-6 sm:w-6" />
                                </motion.button>
                                {!domain.is_verified && (
                                  <motion.button // 👈 motion.button para interações suaves
                                    onClick={() => handleVerifyDomain(domain.id)}
                                    disabled={verifyingDomain === domain.id}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    title="Verificar DNS"
                                    className={`p-1.5 sm:p-2 ${verifyingDomain === domain.id ? 'text-purple-400' : 'text-purple-600 hover:text-purple-800 dark:text-purple-500 dark:hover:text-purple-300'} transition-colors duration-200 rounded-full`}
                                  >
                                    {verifyingDomain === domain.id ? (
                                      <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                                    ) : (
                                      <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                                    )}
                                  </motion.button>
                                )}
                                <motion.button // 👈 motion.button para interações suaves
                                  onClick={() => handleDeleteDomain(domain.id, domain.domain_name)}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  title="Remover Domínio"
                                  className="p-1.5 sm:p-2 text-red-500 hover:text-red-700 transition-colors duration-200 rounded-full"
                                >
                                  <Trash2 className="h-5 w-5 sm:h-6 sm:w-6" />
                                </motion.button>
                              </div>
                            </div>
                            
                            {/* DNS Instructions (Conditional Rendering) */}
                            {!domain.is_verified && (
                              <motion.div // 👈 motion.div para expansão suave das instruções DNS
                                layout
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mt-4 sm:mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"
                              >
                                <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-2">Instruções DNS:</h4>
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">Aponte o registro **CNAME** para:</p>
                                <div className="bg-gray-100 dark:bg-gray-800 p-3 sm:p-4 rounded-lg font-mono text-sm sm:text-base overflow-x-auto">
                                  {domain.cname_target}
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-3">Subdomínio (Host): **{domain.cname_host}** (geralmente `www` ou `@`)</p>
                              </motion.div>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="text-center py-12 sm:py-16">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 dark:bg-gray-700 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
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
      </motion.main>

      {/* Domain Modal */}
      <AnimatePresence>
        {showDomainModal && (
          <motion.div // 👈 motion.div para o backdrop (opacidade)
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div // 👈 motion.div para o corpo do modal (entrada/saída com y)
              className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-700"
              initial={{ y: -50, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3">
                  <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" /> Novo domínio
                </h3>
                <motion.button // 👈 motion.button para interações suaves
                  onClick={() => { setShowDomainModal(false); setNewDomain(''); }}
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-all duration-200 p-1"
                >
                  <X className="h-6 w-6 sm:h-7 sm:w-7" />
                </motion.button>
              </div>
              
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label htmlFor="newDomain" className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">Seu Domínio (ex: www.meusite.com)</label>
                  <input
                    type="text"
                    id="newDomain"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="ex: rifa.meudominio.com"
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-base text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <motion.button // 👈 motion.button para interações suaves
                  onClick={handleSaveDomain}
                  disabled={saving || !newDomain.trim()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-bold text-base transition-all duration-300 flex items-center justify-center space-x-2 shadow-md"
                >
                  <AnimatePresence mode="wait">
                    {saving ? (
                      <motion.div key="modal-saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Adicionando...</span>
                      </motion.div>
                    ) : (
                      <motion.div key="modal-add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center space-x-2">
                        <span>Adicionar Domínio</span>
                        <ArrowRight className="h-4 w-4" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>

                <div className="mt-6 bg-blue-50 dark:bg-blue-900/50 p-3 sm:p-4 rounded-lg border border-blue-200 dark:border-blue-800 flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <Info className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">
                      <strong className="block mb-1">Como funciona:</strong>
                      Após adicionar o domínio, você receberá instruções para configurar o DNS. 
                      O certificado SSL será ativado automaticamente após a verificação bem-sucedida.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Modals - Implementados com AnimatePresence para saída suave */}
      <AnimatePresence>
        {showRemoveLogoConfirm && (
          <motion.div
            key="remove-logo-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <ConfirmModal
              isOpen={true} // Forçamos true aqui, pois a visibilidade é controlada pelo 'if' do AnimatePresence
              title="Remover Logo"
              message="Tem certeza que deseja remover sua logo? Esta ação não pode ser desfeita."
              confirmText="Remover"
              cancelText="Cancelar"
              type="danger"
              loading={uploadingLogo}
              onConfirm={confirmRemoveLogo}
              onCancel={() => setShowRemoveLogoConfirm(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteDomainConfirm && (
          <motion.div
            key="delete-domain-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <ConfirmModal
              isOpen={true} // Forçamos true aqui, pois a visibilidade é controlada pelo 'if' do AnimatePresence
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
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomizationPage;