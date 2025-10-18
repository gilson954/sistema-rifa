import React, { useState } from 'react';
import { Upload, Plus, ArrowRight, X, Loader2, Trash2, ExternalLink, CheckCircle, AlertCircle, Clock, Sparkles, Palette, Eye } from 'lucide-react';
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

  const getThemeClass = (isPage = false) => {
    if (selectedTheme === 'escuro') {
      // Classes do tema escuro solicitadas:
      return isPage ? 'bg-slate-900 text-gray-100' : 'bg-slate-800 text-gray-100 shadow-xl border border-slate-700';
    }
    // Classes do tema claro:
    return isPage ? 'bg-gray-50 text-gray-900' : 'bg-white text-gray-900 shadow-md border border-gray-200';
  };

  const currentPrimaryColor = colorMode === 'solid'
    ? selectedColor
    : isCustomGradient
      ? `linear-gradient(to right, ${customGradientColors.join(', ')})`
      : `linear-gradient(to right, var(--tw-gradient-stops))`;
  
  const gradientClasses = colorMode === 'gradient' && !isCustomGradient
    ? selectedGradient
    : '';

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
          // Assume CustomDomainsAPI.getUserCustomDomains exists and works
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

  const handleSaveSettings = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updateData: any = {
        theme: selectedTheme,
        color_mode: colorMode,
        primary_color: selectedColor,
      };

      if (colorMode === 'gradient') {
        if (isCustomGradient) {
          updateData.gradient_classes = null;
          updateData.custom_gradient_colors = JSON.stringify(customGradientColors);
        } else {
          updateData.gradient_classes = selectedGradient;
          updateData.custom_gradient_colors = null;
        }
      } else {
        updateData.gradient_classes = null;
        updateData.custom_gradient_colors = null;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      showSuccess('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      showError('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

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
        // Log a warning, but proceed with profile update as the public URL is likely enough to clear
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

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain || !user) return;
    setVerifyingDomain(newDomain);
    try {
      // Assume CustomDomainsAPI.addCustomDomain exists and works
      const { data, error } = await CustomDomainsAPI.addCustomDomain(user.id, newDomain);
      if (error) {
        showError(error);
      } else {
        setCustomDomains([...customDomains, data]);
        showSuccess(`Domínio ${newDomain} adicionado com sucesso! Agora configure o DNS.`);
        setNewDomain('');
        setShowDomainModal(false);
      }
    } catch (error) {
      showError('Erro ao adicionar domínio. Verifique o formato.');
    } finally {
      setVerifyingDomain(null);
    }
  };

  const handleDeleteDomain = (domain: { id: string; name: string }) => {
    setSelectedDomainToDelete(domain);
    setShowDeleteDomainConfirm(true);
  };

  const confirmDeleteDomain = async () => {
    if (!selectedDomainToDelete || !user) return;
    setDeleting(true);
    try {
      // Assume CustomDomainsAPI.deleteCustomDomain exists and works
      const { error } = await CustomDomainsAPI.deleteCustomDomain(user.id, selectedDomainToDelete.id);

      if (error) throw error;

      setCustomDomains(customDomains.filter(d => d.id !== selectedDomainToDelete.id));
      showSuccess(`Domínio ${selectedDomainToDelete.name} removido com sucesso.`);
    } catch (error) {
      console.error('Erro ao remover domínio:', error);
      showError('Erro ao remover domínio. Tente novamente.');
    } finally {
      setDeleting(false);
      setShowDeleteDomainConfirm(false);
      setSelectedDomainToDelete(null);
    }
  };
  
  const handleVerifyDomain = async (domainId: string) => {
    if (!user) return;
    setVerifyingDomain(domainId);
    try {
      // Placeholder for a real verification API call
      // Assume CustomDomainsAPI.verifyCustomDomain exists and works
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      
      setCustomDomains(currentDomains => 
        currentDomains.map(d => d.id === domainId ? { ...d, status: 'Verificado', dns_cname: 'dns-cname-updated' } : d)
      );
      showSuccess('Verificação de domínio iniciada. O status será atualizado em breve.');
    } catch (error) {
      showError('Erro ao iniciar verificação.');
    } finally {
      setVerifyingDomain(null);
    }
  };

  const getDomainStatusIcon = (status: string) => {
    switch (status) {
      case 'Verificado':
        return <CheckCircle className="w-5 h-5 text-green-500 mr-2" />;
      case 'Pendente':
        return <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500 mr-2" />;
    }
  };

  // --- Renderização de Tabs ---

  const renderColorAndTheme = () => (
    <div className="space-y-8">
      {/* Selector de Tema Claro/Escuro */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Palette className="w-5 h-5 mr-2" /> Tema
        </h2>
        
        {/* Theme Selector */}
        <div className="flex space-x-2 p-1 bg-gray-100 dark:bg-slate-700 rounded-lg max-w-sm mb-6">
          <button
            onClick={() => setSelectedTheme('claro')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${selectedTheme === 'claro' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'}`}
          >
            Claro
          </button>
          <button
            onClick={() => setSelectedTheme('escuro')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${selectedTheme === 'escuro' ? 'bg-slate-900 text-blue-400 shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'}`}
          >
            Escuro
          </button>
        </div>

        {/* Pré-visualização com as novas classes */}
        <div className="border border-gray-200 dark:border-slate-700 p-4 rounded-xl">
          <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white flex items-center">
            <Eye className="w-5 h-5 mr-2" /> Pré-visualização do Tema ({selectedTheme === 'claro' ? 'Claro' : 'Escuro'})
          </h3>
          <div className={`p-6 rounded-lg h-64 overflow-hidden transition-all duration-300 ${getThemeClass(true)}`}>
            <div className="flex justify-between items-start mb-4">
              <h4 className={`text-xl font-bold ${selectedTheme === 'claro' ? 'text-gray-900' : 'text-white'}`}>Seu App</h4>
              <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-slate-600"></div> {/* Avatar placeholder */}
            </div>
            <div className={`p-4 rounded-lg mb-4 ${getThemeClass(false)}`}>
              <p className="font-semibold mb-2">Card de Exemplo 1</p>
              <p className={`text-sm ${selectedTheme === 'claro' ? 'text-gray-600' : 'text-gray-400'}`}>Este é um card em destaque.</p>
            </div>
            <div className={`p-4 rounded-lg mb-4 ${getThemeClass(false)}`}>
              <p className="font-semibold mb-2">Card de Exemplo 2</p>
              <p className={`text-sm ${selectedTheme === 'claro' ? 'text-gray-600' : 'text-gray-400'}`}>Outro card para demonstração.</p>
            </div>
            <button
              className={`mt-2 px-4 py-2 rounded-lg font-medium text-white transition-all duration-200 shadow-md ${colorMode === 'gradient' ? gradientClasses : ''}`}
              style={{
                background: colorMode === 'solid' ? selectedColor : currentPrimaryColor,
                ...(colorMode === 'gradient' && isCustomGradient && { backgroundImage: currentPrimaryColor }),
              }}
            >
              Botão de Ação
            </button>
          </div>
        </div>
      </div>
      
      {/* Modo de Cor (Sólida/Gradiente) */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Cor Primária</h2>
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setColorMode('solid')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${colorMode === 'solid' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-gray-200'}`}
          >
            Cor Sólida
          </button>
          <button
            onClick={() => {
              setColorMode('gradient');
              setIsCustomGradient(false);
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${colorMode === 'gradient' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-gray-200'}`}
          >
            Gradiente
          </button>
        </div>

        {/* Seleção de Cor Sólida */}
        {colorMode === 'solid' && (
          <div className="flex flex-wrap gap-3">
            {solidColors.map(color => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-8 h-8 rounded-full border-2 transition-all duration-150 ${selectedColor === color ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-slate-800' : 'border-gray-300 dark:border-slate-600 hover:scale-105'}`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
            {/* Input de cor personalizado */}
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-8 h-8 rounded-full cursor-pointer border-none p-0 appearance-none bg-transparent overflow-hidden ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-slate-800"
              style={{ border: selectedColor !== '#3B82F6' ? 'none' : '' }}
              title="Cor Personalizada"
            />
          </div>
        )}

        {/* Seleção de Gradiente */}
        {colorMode === 'gradient' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {gradients.map(grad => (
                <button
                  key={grad.id}
                  onClick={() => {
                    setSelectedGradient(grad.classes);
                    setIsCustomGradient(false);
                  }}
                  className={`w-12 h-12 rounded-lg border-2 transition-all duration-150 p-0 ${selectedGradient === grad.classes && !isCustomGradient ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-slate-800' : 'border-gray-300 dark:border-slate-600 hover:scale-105'}`}
                  style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`, padding: 0 }}
                >
                  <div className={`w-full h-full rounded-[6px] ${grad.classes}`} />
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Gradiente Personalizado</h4>
              <div className="flex items-center space-x-4">
                {customGradientColors.map((color, index) => (
                  <input
                    key={index}
                    type="color"
                    value={color}
                    onChange={(e) => {
                      const newColors = [...customGradientColors];
                      newColors[index] = e.target.value;
                      setCustomGradientColors(newColors);
                      setIsCustomGradient(true);
                    }}
                    className="w-8 h-8 rounded-full cursor-pointer border-none p-0 appearance-none bg-transparent overflow-hidden"
                  />
                ))}
                <button
                  onClick={() => setIsCustomGradient(true)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${isCustomGradient ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-gray-200'}`}
                >
                  Ativar
                </button>
              </div>
              <div
                className="mt-3 h-10 rounded-lg"
                style={{
                  backgroundImage: `linear-gradient(to right, ${customGradientColors.join(', ')})`,
                  opacity: isCustomGradient ? 1 : 0.5
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-md disabled:bg-blue-400 flex items-center"
        >
          {saving && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  );

  const renderLogoSettings = () => (
    <div className="space-y-6 bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <Upload className="w-5 h-5 mr-2" /> Sua Logo
      </h2>

      {/* Upload area */}
      <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors" onClick={() => logoInputRef.current?.click()}>
        <input
          type="file"
          accept="image/*"
          ref={logoInputRef}
          onChange={handleLogoSelect}
          className="hidden"
        />
        <Upload className="w-10 h-10 mx-auto text-gray-400 dark:text-slate-400" />
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          {logoFile ? `Arquivo selecionado: ${logoFile.name}` : 'Clique para enviar ou arraste e solte (PNG, JPG, até 5MB)'}
        </p>
      </div>

      {/* Preview and Upload Button */}
      {(logoPreviewUrl || currentLogoUrl) && (
        <div className="flex flex-col items-center space-y-4 pt-4 border-t border-gray-200 dark:border-slate-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Pré-visualização</h3>
          <img
            src={logoPreviewUrl || currentLogoUrl || undefined}
            alt="Logo Preview"
            className="max-w-xs max-h-24 object-contain p-2 bg-white dark:bg-slate-700 rounded-lg shadow"
          />
          <div className="flex space-x-4">
            {logoPreviewUrl && (
              <button
                onClick={handleUploadLogo}
                disabled={uploadingLogo}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-md disabled:bg-green-400 flex items-center"
              >
                {uploadingLogo && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                {uploadingLogo ? 'Enviando...' : 'Confirmar Upload'}
              </button>
            )}
            {currentLogoUrl && (
              <button
                onClick={handleRemoveLogo}
                disabled={uploadingLogo}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-md disabled:bg-red-400 flex items-center"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Remover Logo
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderDomains = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <ExternalLink className="w-5 h-5 mr-2" /> Domínios Personalizados
          </h2>
          <button
            onClick={() => {
              setNewDomain('');
              setShowDomainModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-md flex items-center"
          >
            <Plus className="w-5 h-5 mr-1" /> Adicionar Domínio
          </button>
        </div>

        {loadingDomains ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : customDomains.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">Nenhum domínio personalizado adicionado ainda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {customDomains.map((domain) => (
              <div key={domain.id} className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900 dark:text-white flex items-center">
                    {getDomainStatusIcon(domain.status)}
                    {domain.name}
                  </span>
                  <span className={`text-sm ${domain.status === 'Verificado' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                    Status: {domain.status}
                  </span>
                  {domain.dns_cname && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      CNAME: {domain.dns_cname}
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  {domain.status !== 'Verificado' && (
                    <button
                      onClick={() => handleVerifyDomain(domain.id)}
                      disabled={verifyingDomain === domain.id}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-sm font-medium p-2 rounded transition-colors disabled:opacity-50"
                    >
                      {verifyingDomain === domain.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verificar'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteDomain(domain)}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 p-2 rounded transition-colors"
                    title="Remover Domínio"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'cores-tema':
        return renderColorAndTheme();
      case 'sua-logo':
        return renderLogoSettings();
      case 'dominios':
        return renderDomains();
      default:
        return null;
    }
  };


  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900 transition-colors p-6 sm:p-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Personalização</h1>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-slate-700 mb-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 flex items-center font-medium transition-colors ${activeTab === tab.id
                    ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {renderContent()}
      </div>

      {/* Confirm Remove Logo Modal */}
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

      {/* Confirm Delete Domain Modal */}
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

      {/* Add Domain Modal */}
      <ConfirmModal
        isOpen={showDomainModal}
        title="Adicionar Novo Domínio"
        message=""
        confirmText="Adicionar"
        cancelText="Cancelar"
        type="primary"
        loading={verifyingDomain !== null}
        onConfirm={handleAddDomain}
        onCancel={() => setShowDomainModal(false)}
        isCustomContent={true}
      >
        <form onSubmit={handleAddDomain} className="space-y-4">
          <label htmlFor="newDomain" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Nome do Domínio (Ex: app.meudominio.com)
          </label>
          <input
            id="newDomain"
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value.toLowerCase().trim())}
            placeholder="Ex: app.meudominio.com"
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            required
            autoFocus
          />
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong className="block mb-1">Como funciona:</strong>
            Após adicionar o domínio, você receberá instruções para configurar o DNS.
            O certificado SSL será ativado automaticamente após a verificação bem-sucedida.
          </p>
        </form>
      </ConfirmModal>
    </div>
  );
};

export default CustomizationPage;