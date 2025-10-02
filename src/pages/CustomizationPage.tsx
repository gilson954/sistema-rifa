import React, { useState } from 'react';
import { Upload, Plus, ArrowRight, X, Loader2, Trash2, ExternalLink, CheckCircle, AlertCircle, Clock, Sparkles, Palette, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { CustomDomainsAPI, CustomDomain } from '../lib/api/customDomains';

const CustomizationPage = () => {
  const { user } = useAuth();
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

  // Carregar configurações do usuário
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

  // Carregar domínios personalizados
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
        alert('Por favor, selecione apenas arquivos de imagem.');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB.');
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
      alert('Por favor, selecione uma imagem primeiro.');
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
      
      alert('Logo atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload da logo:', error);
      alert('Erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!currentLogoUrl || !user) return;

    if (!window.confirm('Tem certeza que deseja remover sua logo?')) {
      return;
    }

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
      alert('Logo removida com sucesso!');
    } catch (error) {
      console.error('Erro ao remover logo:', error);
      alert('Erro ao remover logo. Tente novamente.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!user) {
      alert('Você precisa estar logado para salvar as alterações');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          primary_color: selectedColor,
          theme: selectedTheme,
          color_mode: colorMode,
          gradient_classes: isCustomGradient ? 'custom' : selectedGradient,
          custom_gradient_colors: isCustomGradient ? JSON.stringify(customGradientColors) : null
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving settings:', error);
        alert('Erro ao salvar as configurações. Tente novamente.');
      } else {
        alert('Configurações salvas com sucesso!');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Erro ao salvar as configurações. Tente novamente.');
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
          background: 'bg-gray-800',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          cardBg: 'bg-gray-700',
          border: 'border-gray-600'
        };
      case 'escuro-preto':
        return {
          background: 'bg-black',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          cardBg: 'bg-gray-900',
          border: 'border-gray-700'
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
        alert('Erro ao adicionar domínio. Verifique se o formato está correto e tente novamente.');
      } else {
        setCustomDomains(prev => [data!, ...prev]);
        setShowDomainModal(false);
        setNewDomain('');
        alert('Domínio adicionado com sucesso! Siga as instruções DNS para ativá-lo.');
      }
    } catch (error) {
      console.error('Error saving domain:', error);
      alert('Erro ao salvar domínio. Tente novamente.');
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
        alert('Erro ao verificar domínio. Tente novamente.');
      } else if (data?.verified) {
        alert('Domínio verificado com sucesso! SSL será ativado automaticamente.');
        setCustomDomains(prev => 
          prev.map(domain => 
            domain.id === domainId 
              ? { ...domain, is_verified: true, ssl_status: 'active' as const }
              : domain
          )
        );
      } else {
        alert('Domínio ainda não está apontando corretamente. Verifique as configurações DNS e tente novamente em alguns minutos.');
      }
    } catch (error) {
      console.error('Error verifying domain:', error);
      alert('Erro ao verificar domínio. Tente novamente.');
    } finally {
      setVerifyingDomain(null);
    }
  };

  const handleDeleteDomain = async (domainId: string, domainName: string) => {
    if (!window.confirm(`Tem certeza que deseja remover o domínio ${domainName}?`)) {
      return;
    }

    try {
      const { error } = await CustomDomainsAPI.deleteCustomDomain(domainId, user!.id);
      
      if (error) {
        console.error('Error deleting domain:', error);
        alert('Erro ao remover domínio. Tente novamente.');
      } else {
        setCustomDomains(prev => prev.filter(domain => domain.id !== domainId));
        alert('Domínio removido com sucesso.');
      }
    } catch (error) {
      console.error('Error deleting domain:', error);
      alert('Erro ao remover domínio. Tente novamente.');
    }
  };

  const getStatusIcon = (domain: CustomDomain) => {
    if (domain.is_verified && domain.ssl_status === 'active') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (domain.ssl_status === 'failed') {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    } else {
      return <Clock className="h-5 w-5 text-yellow-500" />;
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header com gradiente */}
        <div className="mb-8 relative overflow-hidden rounded-2xl p-8 shadow-xl border border-purple-200/30 dark:border-purple-800/30 bg-gradient-to-br from-purple-50/80 to-blue-50/80 dark:from-purple-900/20 dark:to-blue-900/20 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          
          <div className="relative flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <Sparkles className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Personalização</h1>
              <p className="text-gray-600 dark:text-gray-300">Personalize a aparência das suas campanhas e configure domínios customizados</p>
            </div>
          </div>
        </div>

        {/* Tabs Navigation Modernizada */}
        <div className="mb-6 bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-200/20 dark:border-gray-700/30 p-2 shadow-lg">
          <div className="flex space-x-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 text-white shadow-lg animate-gradient-x bg-[length:200%_200%]'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-200/20 dark:border-gray-700/30 p-8 shadow-lg">
          {/* Cores e tema Tab */}
          {activeTab === 'cores-tema' && (
            <div className="space-y-8">
              {/* Theme Selection */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Palette className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  Tema visual
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Escolha o tema que melhor combina com sua marca
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {/* Light Theme */}
                  <div
                    onClick={() => setSelectedTheme('claro')}
                    className={`cursor-pointer rounded-2xl p-5 transition-all duration-300 hover:scale-105 ${
                      selectedTheme === 'claro'
                        ? 'ring-4 ring-purple-500 shadow-xl'
                        : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600 shadow-md'
                    }`}
                  >
                    <div className={`w-full h-40 ${getThemeClasses('claro').background} rounded-xl p-4 mb-4 ${getThemeClasses('claro').border} border-2 shadow-inner`}>
                      <div className="space-y-2">
                        <div className={`text-sm font-bold ${getThemeClasses('claro').text}`}>
                          Rifa do iPhone 15
                        </div>
                        <div className={`text-xs ${getThemeClasses('claro').textSecondary}`}>
                          R$ 5,00 por bilhete
                        </div>
                        <div className={`${getThemeClasses('claro').cardBg} rounded-lg p-3 space-y-2`}>
                          <div className={`text-xs font-medium ${getThemeClasses('claro').textSecondary}`}>
                            Progresso
                          </div>
                          <div className="bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full w-2/3 ${colorMode === 'gradient' ? (isCustomGradient ? 'animate-gradient-x bg-[length:200%_200%]' : `bg-gradient-to-r ${selectedGradient} animate-gradient-x bg-[length:200%_200%]`) : ''}`}
                              style={colorMode === 'solid' ? { backgroundColor: selectedColor } : (isCustomGradient ? { background: getCustomGradientStyle(), backgroundSize: '200% 200%' } : {})}
                            ></div>
                          </div>
                        </div>
                        <div 
                          className={`text-white text-xs py-2 px-3 rounded-lg text-center font-semibold shadow-md ${colorMode === 'gradient' ? (isCustomGradient ? 'animate-gradient-x bg-[length:200%_200%]' : `bg-gradient-to-r ${selectedGradient} animate-gradient-x bg-[length:200%_200%]`) : ''}`}
                          style={colorMode === 'solid' ? { backgroundColor: selectedColor } : (isCustomGradient ? { background: getCustomGradientStyle(), backgroundSize: '200% 200%' } : {})}
                        >
                          Participar
                        </div>
                      </div>
                    </div>
                    <p className="text-center text-base font-bold text-gray-900 dark:text-white">Escuro Preto</p>
                  </div>
                </div>
              </div>

              {/* Seletor de Modo de Cor */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  Estilo de cor
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Escolha entre cor sólida ou gradiente animado
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <button
                    onClick={() => setColorMode('solid')}
                    className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                      colorMode === 'solid'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">Cor Sólida</span>
                      {colorMode === 'solid' && <CheckCircle className="h-6 w-6 text-purple-600" />}
                    </div>
                    <div className="w-full h-8 rounded-lg shadow-md" style={{ backgroundColor: selectedColor }}></div>
                  </button>

                  <button
                    onClick={() => setColorMode('gradient')}
                    className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                      colorMode === 'gradient'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">Gradiente Animado</span>
                      {colorMode === 'gradient' && <CheckCircle className="h-6 w-6 text-purple-600" />}
                    </div>
                    <div 
                      className={`w-full h-8 rounded-lg shadow-md ${isCustomGradient ? 'animate-gradient-x bg-[length:200%_200%]' : `bg-gradient-to-r ${selectedGradient} animate-gradient-x bg-[length:200%_200%]`}`}
                      style={isCustomGradient ? { background: getCustomGradientStyle(), backgroundSize: '200% 200%' } : {}}
                    ></div>
                  </button>
                </div>
              </div>

              {/* Color Selection - Cores Sólidas */}
              {colorMode === 'solid' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Cor principal
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    A cor selecionada será aplicada aos elementos principais da sua campanha
                  </p>

                  <div className="flex flex-wrap gap-3 mb-6">
                    {solidColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-12 h-12 rounded-xl transition-all duration-300 shadow-md hover:shadow-xl ${
                          selectedColor === color
                            ? 'ring-4 ring-purple-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 scale-110'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    
                    {/* Custom Color Picker */}
                    <div className="relative">
                      <input
                        type="color"
                        value={selectedColor}
                        onChange={(e) => setSelectedColor(e.target.value)}
                        className="w-12 h-12 rounded-xl border-2 border-gray-300 dark:border-gray-600 cursor-pointer opacity-0 absolute inset-0"
                      />
                      <div className="w-12 h-12 rounded-xl border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300 shadow-md">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500"></div>
                      </div>
                    </div>
                  </div>

                  {/* Color Preview */}
                  <div className="mb-6 p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Cor selecionada:</p>
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-16 h-16 rounded-2xl shadow-lg border-4 border-white dark:border-gray-700"
                        style={{ backgroundColor: selectedColor }}
                      ></div>
                      <div>
                        <span className="text-gray-900 dark:text-white font-mono text-lg font-bold">{selectedColor.toUpperCase()}</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Código hexadecimal</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview em Tempo Real */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Eye className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  Pré-visualização
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Veja como sua campanha ficará para os visitantes
                </p>
                <div className={`${getThemeClasses(selectedTheme).background} rounded-2xl p-8 ${getThemeClasses(selectedTheme).border} border-2 transition-all duration-300 shadow-xl`}>
                  <div className="space-y-5">
                    {/* Título da campanha */}
                    <h4 className={`text-2xl font-bold ${getThemeClasses(selectedTheme).text}`}>
                      Rifa do iPhone 15 Pro Max
                    </h4>
                    
                    {/* Informações do organizador */}
                    <div className={`${getThemeClasses(selectedTheme).cardBg} rounded-xl p-4 inline-flex items-center space-x-3 shadow-md`}>
                      <div 
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${colorMode === 'gradient' ? (isCustomGradient ? 'animate-gradient-x bg-[length:200%_200%]' : `bg-gradient-to-r ${selectedGradient} animate-gradient-x bg-[length:200%_200%]`) : ''}`}
                        style={colorMode === 'solid' ? { backgroundColor: selectedColor } : (isCustomGradient ? { background: getCustomGradientStyle(), backgroundSize: '200% 200%' } : {})}
                      >
                        G
                      </div>
                      <div>
                        <div className={`text-xs ${getThemeClasses(selectedTheme).textSecondary}`}>
                          Organizado por:
                        </div>
                        <div className={`font-bold ${getThemeClasses(selectedTheme).text}`}>
                          João Silva
                        </div>
                      </div>
                    </div>
                    
                    {/* Progresso da campanha */}
                    <div className={`${getThemeClasses(selectedTheme).cardBg} rounded-xl p-5 shadow-md`}>
                      <div className={`text-sm font-semibold ${getThemeClasses(selectedTheme).textSecondary} mb-3`}>
                        Progresso da campanha
                      </div>
                      <div className="bg-gray-300 dark:bg-gray-600 rounded-full h-4 mb-3 shadow-inner">
                        <div 
                          className={`h-4 rounded-full w-3/4 transition-all duration-300 shadow-md ${colorMode === 'gradient' ? (isCustomGradient ? 'animate-gradient-x bg-[length:200%_200%]' : `bg-gradient-to-r ${selectedGradient} animate-gradient-x bg-[length:200%_200%]`) : ''}`}
                          style={colorMode === 'solid' ? { backgroundColor: selectedColor } : (isCustomGradient ? { background: getCustomGradientStyle(), backgroundSize: '200% 200%' } : {})}
                        ></div>
                      </div>
                      <div className={`text-base font-bold ${getThemeClasses(selectedTheme).text}`}>
                        750/1000 bilhetes vendidos
                      </div>
                    </div>
                    
                    {/* Botão de participar */}
                    <button 
                      className={`text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl shadow-lg ${colorMode === 'gradient' ? (isCustomGradient ? 'animate-gradient-x bg-[length:200%_200%]' : `bg-gradient-to-r ${selectedGradient} animate-gradient-x bg-[length:200%_200%]`) : ''}`}
                      style={colorMode === 'solid' ? { backgroundColor: selectedColor } : (isCustomGradient ? { background: getCustomGradientStyle(), backgroundSize: '200% 200%' } : {})}
                    >
                      Participar da Rifa
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
                    Esta é uma prévia de como sua campanha aparecerá para os visitantes
                  </p>
                </div>
              </div>

              {/* Dica de Acessibilidade */}
              <div className="mb-6 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl shadow-md">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Sparkles className="text-white h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-blue-900 dark:text-blue-100 text-base font-bold mb-2">
                      Dica de Design
                    </p>
                    <p className="text-blue-800 dark:text-blue-200 text-sm">
                      {colorMode === 'solid' 
                        ? 'Para melhor legibilidade, escolha cores mais escuras como cor principal. Cores muito claras podem dificultar a leitura do texto branco nos botões.'
                        : 'Gradientes animados criam um efeito visual impressionante e moderno. Eles são perfeitos para destacar botões e elementos importantes da sua campanha.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <button 
                onClick={handleSaveChanges}
                disabled={saving}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:scale-105 animate-gradient-x bg-[length:200%_200%]"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <span>Salvar alterações</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          )}

              {/* Gradient Selection - Gradientes Animados */}
              {colorMode === 'gradient' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Gradientes animados
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Escolha um gradiente pré-definido ou crie o seu próprio com até 3 cores
                  </p>

                  {/* Tabs: Predefinidos vs Customizado */}
                  <div className="flex gap-3 mb-6">
                    <button
                      onClick={() => setIsCustomGradient(false)}
                      className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                        !isCustomGradient
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      Predefinidos
                    </button>
                    <button
                      onClick={() => setIsCustomGradient(true)}
                      className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                        isCustomGradient
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      Personalizado
                    </button>
                  </div>

                  {/* Gradientes Predefinidos */}
                  {!isCustomGradient && (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                        {gradients.map((gradient) => (
                          <button
                            key={gradient.id}
                            onClick={() => setSelectedGradient(gradient.classes)}
                            className={`group relative overflow-hidden rounded-2xl transition-all duration-300 ${
                              selectedGradient === gradient.classes && !isCustomGradient
                                ? 'ring-4 ring-purple-500 shadow-2xl scale-105'
                                : 'hover:scale-105 hover:shadow-xl'
                            }`}
                          >
                            <div className={`h-24 bg-gradient-to-r ${gradient.classes} animate-gradient-x bg-[length:200%_200%]`}></div>
                            {selectedGradient === gradient.classes && !isCustomGradient && (
                              <div className="absolute top-2 right-2 bg-white dark:bg-gray-900 rounded-full p-1 shadow-lg">
                                <CheckCircle className="h-5 w-5 text-purple-600" />
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                              <p className="text-white text-xs font-semibold text-center">{gradient.name}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Seletor de Gradiente Customizado */}
                  {isCustomGradient && (
                    <>
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 mb-6">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            Suas cores personalizadas
                          </h3>
                          <button
                            onClick={handleRandomGradient}
                            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg text-white rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 hover:scale-105"
                          >
                            <Sparkles className="h-4 w-4" />
                            Random
                          </button>
                        </div>

                        <div className="space-y-4">
                          {customGradientColors.map((color, index) => (
                            <div key={index} className="flex items-center gap-4">
                              <div className="flex-shrink-0 text-sm font-bold text-gray-700 dark:text-gray-300 w-16">
                                Cor {index + 1}
                              </div>
                              
                              {/* Color Picker */}
                              <div className="relative flex-1">
                                <input
                                  type="color"
                                  value={color}
                                  onChange={(e) => handleUpdateCustomColor(index, e.target.value)}
                                  className="w-full h-12 rounded-xl border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                                  style={{ backgroundColor: color }}
                                />
                              </div>

                              {/* Color Preview & Code */}
                              <div className="flex items-center gap-3 flex-1">
                                <div 
                                  className="w-12 h-12 rounded-xl shadow-lg border-2 border-white dark:border-gray-700"
                                  style={{ backgroundColor: color }}
                                ></div>
                                <input
                                  type="text"
                                  value={color.toUpperCase()}
                                  onChange={(e) => handleUpdateCustomColor(index, e.target.value)}
                                  className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  placeholder="#000000"
                                />
                              </div>

                              {/* Remove Button */}
                              {customGradientColors.length > 2 && (
                                <button
                                  onClick={() => handleRemoveCustomColor(index)}
                                  className="flex-shrink-0 p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all duration-300"
                                  title="Remover cor"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Add Color Button */}
                        {customGradientColors.length < 3 && (
                          <button
                            onClick={handleAddCustomColor}
                            className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-300 flex items-center justify-center gap-2 font-semibold"
                          >
                            <Plus className="h-5 w-5" />
                            Adicionar cor (máx. 3)
                          </button>
                        )}
                      </div>

                      {/* Preview do Gradiente Customizado */}
                      <div className="mb-6 p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Gradiente personalizado:</p>
                        <div 
                          className="w-full h-20 rounded-2xl shadow-xl animate-gradient-x bg-[length:200%_200%]"
                          style={{ 
                            background: getCustomGradientStyle(),
                            backgroundSize: '200% 200%'
                          }}
                        ></div>
                      </div>
                    </>
                  )}

                  {/* Preview do Gradiente Predefinido */}
                  {!isCustomGradient && (
                    <div className="mb-6 p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Gradiente selecionado:</p>
                      <div className={`w-full h-20 rounded-2xl shadow-xl bg-gradient-to-r ${selectedGradient} animate-gradient-x bg-[length:200%_200%]`}></div>
                    </div>
                  )}
                </div>
              )}Gradient ? 'animate-gradient-x bg-[length:200%_200%]' : `bg-gradient-to-r ${selectedGradient} animate-gradient-x bg-[length:200%_200%]`) : ''}`}
                              style={colorMode === 'solid' ? { backgroundColor: selectedColor } : (isCustomGradient ? { background: getCustomGradientStyle(), backgroundSize: '200% 200%' } : {})}
                            ></div>
                          </div>
                        </div>
                        <div 
                          className={`text-white text-xs py-2 px-3 rounded-lg text-center font-semibold shadow-md ${colorMode === 'gradient' ? (isCustomGradient ? 'animate-gradient-x bg-[length:200%_200%]' : `bg-gradient-to-r ${selectedGradient} animate-gradient-x bg-[length:200%_200%]`) : ''}`}
                          style={colorMode === 'solid' ? { backgroundColor: selectedColor } : (isCustomGradient ? { background: getCustomGradientStyle(), backgroundSize: '200% 200%' } : {})}
                        >
                          Participar
                        </div>
                      </div>
                    </div>
                    <p className="text-center text-base font-bold text-gray-900 dark:text-white">Claro</p>
                  </div>

                  {/* Dark Theme */}
                  <div
                    onClick={() => setSelectedTheme('escuro')}
                    className={`cursor-pointer rounded-2xl p-5 transition-all duration-300 hover:scale-105 ${
                      selectedTheme === 'escuro'
                        ? 'ring-4 ring-purple-500 shadow-xl'
                        : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600 shadow-md'
                    }`}
                  >
                    <div className={`w-full h-40 ${getThemeClasses('escuro').background} rounded-xl p-4 mb-4 border-2 ${getThemeClasses('escuro').border} shadow-inner`}>
                      <div className="space-y-2">
                        <div className={`text-sm font-bold ${getThemeClasses('escuro').text}`}>
                          Rifa do iPhone 15
                        </div>
                        <div className={`text-xs ${getThemeClasses('escuro').textSecondary}`}>
                          R$ 5,00 por bilhete
                        </div>
                        <div className={`${getThemeClasses('escuro').cardBg} rounded-lg p-3 space-y-2`}>
                          <div className={`text-xs font-medium ${getThemeClasses('escuro').textSecondary}`}>
                            Progresso
                          </div>
                          <div className="bg-gray-600 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full w-2/3 ${colorMode === 'gradient' ? (isCustomGradient ? 'animate-gradient-x bg-[length:200%_200%]' : `bg-gradient-to-r ${selectedGradient} animate-gradient-x bg-[length:200%_200%]`) : ''}`}
                              style={colorMode === 'solid' ? { backgroundColor: selectedColor } : (isCustomGradient ? { background: getCustomGradientStyle(), backgroundSize: '200% 200%' } : {})}
                            ></div>
                          </div>
                        </div>
                        <div 
                          className={`text-white text-xs py-2 px-3 rounded-lg text-center font-semibold shadow-md ${colorMode === 'gradient' ? (isCustomGradient ? 'animate-gradient-x bg-[length:200%_200%]' : `bg-gradient-to-r ${selectedGradient} animate-gradient-x bg-[length:200%_200%]`) : ''}`}
                          style={colorMode === 'solid' ? { backgroundColor: selectedColor } : (isCustomGradient ? { background: getCustomGradientStyle(), backgroundSize: '200% 200%' } : {})}
                        >
                          Participar
                        </div>
                      </div>
                    </div>
                    <p className="text-center text-base font-bold text-gray-900 dark:text-white">Escuro</p>
                  </div>

                  {/* Dark Black Theme */}
                  <div
                    onClick={() => setSelectedTheme('escuro-preto')}
                    className={`cursor-pointer rounded-2xl p-5 transition-all duration-300 hover:scale-105 ${
                      selectedTheme === 'escuro-preto'
                        ? 'ring-4 ring-purple-500 shadow-xl'
                        : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600 shadow-md'
                    }`}
                  >
                    <div className={`w-full h-40 ${getThemeClasses('escuro-preto').background} rounded-xl p-4 mb-4 border-2 ${getThemeClasses('escuro-preto').border} shadow-inner`}>
                      <div className="space-y-2">
                        <div className={`text-sm font-bold ${getThemeClasses('escuro-preto').text}`}>
                          Rifa do iPhone 15
                        </div>
                        <div className={`text-xs ${getThemeClasses('escuro-preto').textSecondary}`}>
                          R$ 5,00 por bilhete
                        </div>
                        <div className={`${getThemeClasses('escuro-preto').cardBg} rounded-lg p-3 space-y-2`}>
                          <div className={`text-xs font-medium ${getThemeClasses('escuro-preto').textSecondary}`}>
                            Progresso
                          </div>
                          <div className="bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full w-2/3 ${colorMode === 'gradient' ? (isCustom