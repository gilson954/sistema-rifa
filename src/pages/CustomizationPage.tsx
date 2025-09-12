import React, { useState } from 'react';
import { Upload, Plus, ArrowRight, X, Loader2, Trash2, ExternalLink, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { CustomDomainsAPI, CustomDomain } from '../lib/api/customDomains';

const CustomizationPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('cores-tema');
  const [selectedTheme, setSelectedTheme] = useState('claro');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
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

  const colors = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E',
    '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#C026D2', '#EC4899', '#F43F5E'
  ];

  const tabs = [
    { id: 'cores-tema', label: 'Cores e tema' },
    { id: 'sua-logo', label: 'Sua logo' },
    { id: 'dominios', label: 'Domínios' }
  ];

  // Carregar cor principal do usuário ao montar o componente
  React.useEffect(() => {
    const loadUserSettings = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('primary_color, theme, logo_url')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Error loading user settings:', error);
          } else if (data?.primary_color) {
            if (data.primary_color) {
              setSelectedColor(data.primary_color);
            }
            if (data.theme) {
              setSelectedTheme(data.theme);
            }
            if (data.logo_url) {
              setCurrentLogoUrl(data.logo_url);
            }
          }
        } catch (error) {
          console.error('Error loading user settings:', error);
        }
      }
    };

    loadUserSettings();
  }, [user]);

  // Carregar domínios personalizados do usuário
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
  // Função para lidar com a seleção de arquivos de logo
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.');
        return;
      }
      
      // Validar tamanho do arquivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB.');
        return;
      }
      
      setLogoFile(file);
      
      // Criar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
    // Reset input value para permitir selecionar o mesmo arquivo novamente
    e.target.value = '';
  };

  // Função para fazer upload da logo
  const handleUploadLogo = async () => {
    if (!logoFile || !user) {
      alert('Por favor, selecione uma imagem primeiro.');
      return;
    }

    setUploadingLogo(true);
    try {
      // Criar nome único para o arquivo
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload para Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, logoFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      // Atualizar perfil do usuário com a URL da logo
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ logo_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Atualizar estado local
      setCurrentLogoUrl(publicUrl);
      
      // Limpar estado de upload
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

  // Função para remover a logo
  const handleRemoveLogo = async () => {
    if (!currentLogoUrl || !user) return;

    if (!window.confirm('Tem certeza que deseja remover sua logo?')) {
      return;
    }

    setUploadingLogo(true);
    try {
      // Extrair caminho do arquivo da URL
      const urlParts = currentLogoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${user.id}/${fileName}`;

      // Remover arquivo do Storage
      const { error: deleteError } = await supabase.storage
        .from('logos')
        .remove([filePath]);

      if (deleteError) {
        console.warn('Erro ao remover arquivo do storage:', deleteError);
        // Continua mesmo com erro no storage, pois o importante é limpar o perfil
      }

      // Atualizar perfil do usuário
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ logo_url: null })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Limpar estado local
      setCurrentLogoUrl(null);
      
      alert('Logo removida com sucesso!');
    } catch (error) {
      console.error('Erro ao remover logo:', error);
      alert('Erro ao remover logo. Tente novamente.');
    } finally {
      setUploadingLogo(false);
    }
  };

  // Função para salvar as configurações
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
          theme: selectedTheme
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

  // Helper function to get a lighter version of the selected color for the light theme
  const getLighterColor = (color: string) => {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Make it lighter by blending with white
    const lighterR = Math.round(r + (255 - r) * 0.3);
    const lighterG = Math.round(g + (255 - g) * 0.3);
    const lighterB = Math.round(b + (255 - b) * 0.3);
    
    return `rgb(${lighterR}, ${lighterG}, ${lighterB})`;
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
        // Atualiza a lista de domínios
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

  const handleCloseDomainModal = () => {
    setShowDomainModal(false);
    setNewDomain('');
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
        // Atualiza a lista de domínios
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
  // Função para obter classes de tema específico para previews
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
  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg border border-gray-200 dark:border-gray-800 transition-colors duration-300">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="flex space-x-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'text-purple-600 dark:text-purple-400 border-purple-600 dark:border-purple-400'
                  : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Cores e tema Tab */}
        {activeTab === 'cores-tema' && (
          <div className="space-y-8">
            {/* Theme Selection */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Cor de tema
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Selecione um tema para deixar sua rifa ainda mais elegante
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {/* Light Theme */}
                <div
                  onClick={() => setSelectedTheme('claro')}
                  className={`cursor-pointer rounded-lg p-4 transition-all duration-200 ${
                    selectedTheme === 'claro'
                      ? 'ring-2 ring-purple-500'
                      : 'hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600'
                  }`}
                >
                  <div className={`w-40 h-32 ${getThemeClasses('claro').background} rounded-lg p-3 mb-3 ${getThemeClasses('claro').border} border`}>
                    <div className="space-y-2">
                      {/* Título de exemplo */}
                      <div className={`text-xs font-bold ${getThemeClasses('claro').text}`}>
                        Rifa do iPhone
                      </div>
                      {/* Texto de exemplo */}
                      <div className={`text-xs ${getThemeClasses('claro').textSecondary}`}>
                        R$ 5,00 por bilhete
                      </div>
                      {/* Card interno de exemplo */}
                      <div className={`${getThemeClasses('claro').cardBg} rounded p-2 space-y-1`}>
                        <div className={`text-xs ${getThemeClasses('claro').textSecondary}`}>
                          Progresso
                        </div>
                        <div className="bg-gray-200 rounded-full h-1">
                          <div 
                            className="h-1 rounded-full w-2/3"
                            style={{ backgroundColor: selectedColor }}
                          ></div>
                        </div>
                      </div>
                      {/* Botão de exemplo */}
                      <div 
                        className="text-white text-xs py-1 px-2 rounded text-center font-medium"
                        style={{ backgroundColor: selectedColor }}
                      >
                        Participar
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-sm font-medium">Claro</p>
                </div>

                {/* Dark Theme */}
                <div
                  onClick={() => setSelectedTheme('escuro')}
                  className={`cursor-pointer rounded-lg p-4 transition-all duration-200 ${
                    selectedTheme === 'escuro'
                      ? 'ring-2 ring-purple-500'
                      : 'hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600'
                  }`}
                >
                  <div className={`w-40 h-32 ${getThemeClasses('escuro').background} rounded-lg p-3 mb-3`}>
                    <div className="space-y-2">
                      {/* Título de exemplo */}
                      <div className={`text-xs font-bold ${getThemeClasses('escuro').text}`}>
                        Rifa do iPhone
                      </div>
                      {/* Texto de exemplo */}
                      <div className={`text-xs ${getThemeClasses('escuro').textSecondary}`}>
                        R$ 5,00 por bilhete
                      </div>
                      {/* Card interno de exemplo */}
                      <div className={`${getThemeClasses('escuro').cardBg} rounded p-2 space-y-1`}>
                        <div className={`text-xs ${getThemeClasses('escuro').textSecondary}`}>
                          Progresso
                        </div>
                        <div className="bg-gray-600 rounded-full h-1">
                          <div 
                            className="h-1 rounded-full w-2/3"
                            style={{ backgroundColor: selectedColor }}
                          ></div>
                        </div>
                      </div>
                      {/* Botão de exemplo */}
                      <div 
                        className="text-white text-xs py-1 px-2 rounded text-center font-medium"
                        style={{ backgroundColor: selectedColor }}
                      >
                        Participar
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-sm font-medium">Escuro</p>
                </div>

                {/* Dark Black Theme */}
                <div
                  onClick={() => setSelectedTheme('escuro-preto')}
                  className={`cursor-pointer rounded-lg p-4 transition-all duration-200 ${
                    selectedTheme === 'escuro-preto'
                      ? 'ring-2 ring-purple-500'
                      : 'hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600'
                  }`}
                >
                  <div className={`w-40 h-32 ${getThemeClasses('escuro-preto').background} rounded-lg p-3 mb-3`}>
                    <div className="space-y-2">
                      {/* Título de exemplo */}
                      <div className={`text-xs font-bold ${getThemeClasses('escuro-preto').text}`}>
                        Rifa do iPhone
                      </div>
                      {/* Texto de exemplo */}
                      <div className={`text-xs ${getThemeClasses('escuro-preto').textSecondary}`}>
                        R$ 5,00 por bilhete
                      </div>
                      {/* Card interno de exemplo */}
                      <div className={`${getThemeClasses('escuro-preto').cardBg} rounded p-2 space-y-1`}>
                        <div className={`text-xs ${getThemeClasses('escuro-preto').textSecondary}`}>
                          Progresso
                        </div>
                        <div className="bg-gray-700 rounded-full h-1">
                          <div 
                            className="h-1 rounded-full w-2/3"
                            style={{ backgroundColor: selectedColor }}
                          ></div>
                        </div>
                      </div>
                      {/* Botão de exemplo */}
                      <div 
                        className="text-white text-xs py-1 px-2 rounded text-center font-medium"
                        style={{ backgroundColor: selectedColor }}
                      >
                        Participar
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-sm font-medium">Escuro Preto</p>
                </div>
              </div>
            </div>

            {/* Preview em Tempo Real */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Pré-visualização
              </h3>
              <div className={`${getThemeClasses(selectedTheme).background} rounded-lg p-6 ${getThemeClasses(selectedTheme).border} border transition-all duration-300`}>
                <div className="space-y-4">
                  {/* Título da campanha */}
                  <h4 className={`text-xl font-bold ${getThemeClasses(selectedTheme).text}`}>
                    Rifa do iPhone 15 Pro Max
                  </h4>
                  
                  {/* Informações do organizador */}
                  <div className={`${getThemeClasses(selectedTheme).cardBg} rounded-lg p-4 inline-flex items-center space-x-3`}>
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: selectedColor }}
                    >
                      G
                    </div>
                    <div>
                      <div className={`text-sm ${getThemeClasses(selectedTheme).textSecondary}`}>
                        Organizado por:
                      </div>
                      <div className={`font-semibold ${getThemeClasses(selectedTheme).text}`}>
                        João Silva
                      </div>
                    </div>
                  </div>
                  
                  {/* Progresso da campanha */}
                  <div className={`${getThemeClasses(selectedTheme).cardBg} rounded-lg p-4`}>
                    <div className={`text-sm ${getThemeClasses(selectedTheme).textSecondary} mb-2`}>
                      Progresso da campanha
                    </div>
                    <div className="bg-gray-300 dark:bg-gray-600 rounded-full h-3 mb-2">
                      <div 
                        className="h-3 rounded-full w-3/4 transition-all duration-300"
                        style={{ backgroundColor: selectedColor }}
                      ></div>
                    </div>
                    <div className={`text-sm ${getThemeClasses(selectedTheme).text}`}>
                      750/1000 bilhetes vendidos
                    </div>
                  </div>
                  
                  {/* Botão de participar */}
                  <button 
                    className="text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:brightness-90"
                    style={{ backgroundColor: selectedColor }}
                  >
                    Participar da Rifa
                  </button>
                </div>
              </div>
              
              <p className={`text-sm ${getThemeClasses(selectedTheme).textSecondary} mt-2 text-center`}>
                Esta é uma prévia de como sua campanha aparecerá para os visitantes
              </p>
            </div>
            {/* Color Selection */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Cor principal
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                A cor selecionada será aplicada a textos e detalhes da sua rifa
              </p>

              <div className="flex flex-wrap gap-3 mb-8">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-10 h-10 rounded-full transition-all duration-200 ${
                      selectedColor === color
                        ? 'ring-2 ring-gray-900 dark:ring-white ring-offset-2 ring-offset-white dark:ring-offset-gray-900 scale-110'
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
                    className="w-10 h-10 rounded-full border-2 border-gray-300 dark:border-gray-600 cursor-pointer opacity-0 absolute inset-0"
                  />
                  <div className="w-10 h-10 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
                    <div className="w-6 h-6 rounded-full border border-gray-400 dark:border-gray-500 flex items-center justify-center">
                      <div className="w-2 h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Color Preview */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Cor selecionada:</p>
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: selectedColor }}
                  ></div>
                  <span className="text-gray-900 dark:text-white font-mono text-sm">{selectedColor.toUpperCase()}</span>
                </div>
              </div>

              {/* Dica de Contraste */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-sm font-bold">💡</span>
                  </div>
                  <div>
                    <p className="text-blue-800 dark:text-blue-200 text-sm font-medium mb-1">
                      Dica de Acessibilidade
                    </p>
                    <p className="text-blue-700 dark:text-blue-300 text-sm">
                      Para melhor legibilidade, escolha cores mais escuras como cor principal. 
                      Cores muito claras podem dificultar a leitura do texto branco nos botões.
                    </p>
                  </div>
                </div>
              </div>
              {/* Save Button */}
              <button 
                onClick={handleSaveChanges}
                disabled={saving}
                className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-gray-900 dark:text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-white"></div>
                ) : (
                  <>
                    <span>Salvar alterações</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Sua logo Tab */}
        {activeTab === 'sua-logo' && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Sua logo
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Aqui você pode <span className="text-yellow-600 dark:text-yellow-400">adicionar sua logo</span> e deixar suas campanhas ainda mais elegantes
            </p>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Logo
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Recomendamos as dimensões: <span className="text-gray-900 dark:text-white font-medium">largura:100px e altura:50px</span>
              </p>

              {/* Logo Atual */}
              {currentLogoUrl && (
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                    Logo atual
                  </h4>
                  <div className="relative inline-block">
                    <img
                      src={currentLogoUrl}
                      alt="Logo atual"
                      className="max-w-xs max-h-24 object-contain bg-white dark:bg-gray-700 p-2 rounded-lg border border-gray-300 dark:border-gray-600"
                    />
                    <button
                      onClick={handleRemoveLogo}
                      disabled={uploadingLogo}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white p-1 rounded-full transition-colors duration-200"
                      title="Remover logo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Input de arquivo oculto */}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoSelect}
                className="hidden"
              />

              {/* Preview da nova logo */}
              {logoPreviewUrl && (
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                    Pré-visualização
                  </h4>
                  <div className="relative inline-block">
                    <img
                      src={logoPreviewUrl}
                      alt="Preview da nova logo"
                      className="max-w-xs max-h-24 object-contain bg-white dark:bg-gray-700 p-2 rounded-lg border border-gray-300 dark:border-gray-600"
                    />
                    <button
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreviewUrl(null);
                      }}
                      className="absolute -top-2 -right-2 bg-gray-500 hover:bg-gray-600 text-white p-1 rounded-full transition-colors duration-200"
                      title="Cancelar"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Botão para confirmar upload */}
                  <div className="mt-4">
                    <button
                      onClick={handleUploadLogo}
                      disabled={uploadingLogo}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                    >
                      {uploadingLogo ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <>
                          <span>Confirmar Upload</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Area */}
              {!logoPreviewUrl && (
                <div 
                  onClick={() => logoInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center transition-colors duration-200 cursor-pointer hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                >
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Clique aqui para selecionar sua logo
                  </p>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      logoInputRef.current?.click();
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 mx-auto w-fit transition-colors duration-200"
                  >
                    <span>Adicionar</span>
                    <Upload className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Informações sobre formato */}
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Formatos aceitos:</strong> JPG, PNG, WebP<br />
                  <strong>Tamanho máximo:</strong> 5MB<br />
                  <strong>Dimensões recomendadas:</strong> 100x50px (proporção 2:1)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Domínios Tab */}
        {activeTab === 'dominios' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Domínio personalizado
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Use seu próprio domínio para suas campanhas (ex: rifaminhaloja.com)
                </p>
              </div>
              <button 
                onClick={() => setShowDomainModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <span>Criar</span>
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8">
              <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-6">
                Domínios configurados
              </h3>

              {loadingDomains ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-gray-600 dark:text-gray-400 mt-4">Carregando domínios...</p>
                </div>
              ) : customDomains.length > 0 ? (
                <div className="space-y-4">
                  {customDomains.map((domain) => (
                    <div
                      key={domain.id}
                      className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(domain)}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {domain.domain_name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Status: {getStatusText(domain)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {domain.is_verified ? (
                            <a
                              href={`https://${domain.domain_name}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors duration-200"
                              title="Abrir domínio"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          ) : (
                            <button
                              onClick={() => handleVerifyDomain(domain.id)}
                              disabled={verifyingDomain === domain.id}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm rounded transition-colors duration-200"
                            >
                              {verifyingDomain === domain.id ? 'Verificando...' : 'Verificar'}
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDeleteDomain(domain.id, domain.domain_name)}
                            className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors duration-200"
                            title="Remover domínio"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* DNS Instructions */}
                      {!domain.is_verified && domain.dns_instructions && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                            Instruções DNS
                          </h4>
                          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                            <p><strong>Tipo:</strong> CNAME</p>
                            <p><strong>Nome:</strong> {domain.domain_name}</p>
                            <p><strong>Valor:</strong> meuapp.com</p>
                          </div>
                          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                            Após configurar o DNS, clique em "Verificar" para ativar o domínio.
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* Empty State */
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="w-8 h-8 border-2 border-gray-400 dark:border-gray-500 rounded border-dashed"></div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Você ainda não possui domínios configurados
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New Domain Modal */}
      {showDomainModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Novo domínio
              </h3>
              <button
                onClick={handleCloseDomainModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Adicione um novo domínio para suas rifas
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Insira seu domínio
              </label>
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="Exemplo: rifaqui.com.br"
                className="w-full bg-white dark:bg-gray-700 border border-purple-500 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
              />
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              Não use https ou (/) barras, insira somente o domínio
            </p>

            <button
              onClick={handleSaveDomain}
              disabled={!newDomain.trim() || saving}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>Salvar</span>
              )}
            </button>
            
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Importante:</strong> Após adicionar o domínio, você receberá instruções para configurar o DNS. 
                O SSL será ativado automaticamente após a verificação.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomizationPage;