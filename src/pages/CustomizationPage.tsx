/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Upload, Plus, ArrowRight, X, Loader2, Trash2, ExternalLink,
  CheckCircle, AlertCircle, Clock, Sparkles, Palette, Eye,
  Copy, Check, ChevronDown, Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { supabase } from '../lib/supabase';
import { CustomDomainsAPI, CustomDomain } from '../lib/api/customDomains';
import ConfirmModal from '../components/ConfirmModal';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

/* ------------------------------------------------- *
 *  Constantes (evita recriação em cada render)      *
 * ------------------------------------------------- */
const SOLID_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E',
  '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#C026D2', '#EC4899', '#F43F5E'
] as const;

const GRADIENTS = [
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
] as const;

const TABS = [
  { id: 'cores-tema' as const, label: 'Cores e tema', icon: Palette },
  { id: 'sua-logo' as const, label: 'Sua logo', icon: Upload },
  { id: 'dominios' as const, label: 'Domínios', icon: ExternalLink }
] as const;

const THEME_PREVIEWS = {
  claro: { bg: 'bg-white', txt: 'text-gray-900', txt2: 'text-gray-600', card: 'bg-gray-50', border: 'border-gray-200' },
  escuro: { bg: 'bg-slate-900', txt: 'text-white', txt2: 'text-slate-300', card: 'bg-slate-800', border: 'border-slate-700' },
  'escuro-preto': { bg: 'bg-black', txt: 'text-white', txt2: 'text-gray-300', card: 'bg-gray-900', border: 'border-gray-700' },
  'escuro-cinza': { bg: 'bg-[#1A1A1A]', txt: 'text-white', txt2: 'text-[#A0A0A0]', card: 'bg-[#2C2C2C]', border: 'border-[#404040]' }
} as const;

/* ------------------------------------------------- *
 *  Componente principal                              *
 * ------------------------------------------------- */
const CustomizationPage: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useNotification();

  /* ---------- Estado ---------- */
  const [activeTab, setActiveTab] = useState<typeof TABS[number]['id']>('cores-tema');
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof THEME_PREVIEWS>('claro');
  const [colorMode, setColorMode] = useState<'solid' | 'gradient'>('solid');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [selectedGradient, setSelectedGradient] = useState(GRADIENTS[0].classes);
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
  const [showRemoveLogoConfirm, setShowRemoveLogoConfirm] = useState(false);
  const [showDeleteDomainConfirm, setShowDeleteDomainConfirm] = useState(false);
  const [selectedDomainToDelete, setSelectedDomainToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copiedDNS, setCopiedDNS] = useState<string | null>(null);
  const [showDNSDetails, setShowDNSDetails] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);

  /* ---------- Helpers (memoizados) ---------- */
  const themeClasses = useMemo(() => {
    return THEME_PREVIEWS[selectedTheme];
  }, [selectedTheme]);

  const customGradientStyle = useMemo(() => {
    if (customGradientColors.length === 2) return `linear-gradient(90deg, ${customGradientColors[0]}, ${customGradientColors[1]})`;
    if (customGradientColors.length === 3) return `linear-gradient(90deg, ${customGradientColors[0]}, ${customGradientColors[1]}, ${customGradientColors[2]})`;
    return `linear-gradient(90deg, ${customGradientColors[0]}, ${customGradientColors[1]})`;
  }, [customGradientColors]);

  const gradientBtnClasses = useMemo(() => {
    const base = 'animate-gradient-x bg-[length:200%_200%]';
    if (colorMode !== 'gradient') return '';
    return isCustomGradient ? base : `bg-gradient-to-r ${selectedGradient} ${base}`;
  }, [colorMode, isCustomGradient, selectedGradient]);

  const solidBtnStyle = useMemo(() => (colorMode === 'solid' ? { backgroundColor: selectedColor } : {}), [colorMode, selectedColor]);

  const gradientStyle = useMemo(() => (isCustomGradient ? { background: customGradientStyle, backgroundSize: '200% 200%' } : {}), [isCustomGradient, customGradientStyle]);

  /* ---------- Carregamento inicial ---------- */
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('primary_color, theme, logo_url, color_mode, gradient_classes, custom_gradient_colors')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Erro ao carregar perfil:', error);
      } else if (data) {
        if (data.theme) setSelectedTheme(data.theme as keyof typeof THEME_PREVIEWS);
        if (data.primary_color) setSelectedColor(data.primary_color);
        if (data.logo_url) setCurrentLogoUrl(data.logo_url);
        if (data.color_mode) setColorMode(data.color_mode);
        if (data.gradient_classes) setSelectedGradient(data.gradient_classes);
        if (data.custom_gradient_colors) {
          try {
            setCustomGradientColors(JSON.parse(data.custom_gradient_colors));
            setIsCustomGradient(true);
          } catch (e) {
            console.error('Erro ao parsear cores customizadas:', e);
          }
        }
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    if (!user || activeTab !== 'dominios') return;
    const load = async () => {
      setLoadingDomains(true);
      try {
        const { data, error } = await CustomDomainsAPI.getUserCustomDomains(user.id);
        if (error) throw error;
        setCustomDomains(data ?? []);
      } catch (err) {
        console.error('Erro ao carregar domínios:', err);
        showError('Falha ao carregar domínios.');
      } finally {
        setLoadingDomains(false);
      }
    };
    load();
  }, [user, activeTab, showError]);

  /* ---------- Handlers (memoizados) ---------- */
  const handleLogoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Apenas imagens são permitidas (PNG, JPG, SVG, etc.).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showError('A imagem deve ter no máximo 5 MB.');
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setLogoPreviewUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [showError]);

  const uploadLogo = useCallback(async () => {
    if (!logoFile || !user) {
      showWarning('Selecione uma imagem primeiro.');
      return;
    }

    setUploadingLogo(true);
    try {
      const ext = logoFile.name.split('.').pop() || 'png';
      const fileName = `${user.id}-${Date.now()}.${ext}`;
      const path = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(path, logoFile, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(path);

      const { error: dbError } = await supabase
        .from('profiles')
        .update({ logo_url: publicUrl })
        .eq('id', user.id);

      if (dbError) throw dbError;

      setCurrentLogoUrl(publicUrl);
      setLogoFile(null);
      setLogoPreviewUrl(null);
      showSuccess('Logo atualizada com sucesso!');
    } catch (err: any) {
      console.error('Erro no upload:', err);
      showError(err.message || 'Falha ao fazer upload da logo.');
    } finally {
      setUploadingLogo(false);
    }
  }, [logoFile, user, showWarning, showSuccess, showError]);

  const removeLogo = useCallback(() => {
    if (!currentLogoUrl || !user) return;
    setShowRemoveLogoConfirm(true);
  }, [currentLogoUrl, user]);

  const confirmRemoveLogo = useCallback(async () => {
    if (!currentLogoUrl || !user) return;
    setUploadingLogo(true);
    try {
      const fileName = currentLogoUrl.split('/').pop()!;
      const path = `${user.id}/${fileName}`;
      await supabase.storage.from('logos').remove([path]);

      const { error } = await supabase
        .from('profiles')
        .update({ logo_url: null })
        .eq('id', user.id);

      if (error) throw error;

      setCurrentLogoUrl(null);
      showSuccess('Logo removida com sucesso!');
    } catch (err: any) {
      console.error('Erro ao remover logo:', err);
      showError(err.message || 'Falha ao remover logo.');
    } finally {
      setUploadingLogo(false);
      setShowRemoveLogoConfirm(false);
    }
  }, [currentLogoUrl, user, showSuccess, showError]);

  const saveChanges = useCallback(async () => {
    if (!user) {
      showWarning('Faça login para salvar as alterações.');
      return;
    }
    setSaving(true);
    try {
      const payload: any = { theme: selectedTheme, color_mode: colorMode };

      if (colorMode === 'gradient') {
        payload.gradient_classes = isCustomGradient ? 'custom' : selectedGradient;
        payload.custom_gradient_colors = isCustomGradient ? JSON.stringify(customGradientColors) : null;
        payload.primary_color = null;
      } else {
        payload.primary_color = selectedColor;
        payload.gradient_classes = null;
        payload.custom_gradient_colors = null;
      }

      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', user.id);

      if (error) throw error;
      showSuccess('Configurações salvas com sucesso!');
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      showError(err.message || 'Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  }, [
    user, selectedTheme, colorMode, isCustomGradient, selectedGradient,
    customGradientColors, selectedColor, showWarning, showError, showSuccess
  ]);

  const addDomain = useCallback(async () => {
    const domain = newDomain.trim().toLowerCase();
    if (!domain || !user) return;

    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(domain)) {
      showError('Domínio inválido. Use formato: exemplo.com');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await CustomDomainsAPI.createCustomDomain({ domain_name: domain }, user.id);
      if (error) throw error;

      setCustomDomains(prev => [data!, ...prev]);
      setShowDomainModal(false);
      setNewDomain('');
      showSuccess('Domínio adicionado! Configure o DNS conforme as instruções.');
    } catch (err: any) {
      console.error('Erro ao adicionar domínio:', err);
      showError(err.message || 'Erro ao adicionar domínio.');
    } finally {
      setSaving(false);
    }
  }, [newDomain, user, showSuccess, showError]);

  const verifyDomain = useCallback(async (id: string) => {
    setVerifyingDomain(id);
    try {
      const { data, error } = await CustomDomainsAPI.verifyDNS(id);
      if (error) throw error;

      if (data?.verified) {
        showSuccess('Domínio verificado com sucesso! SSL será ativado em breve.');
        setCustomDomains(prev => prev.map(d => d.id === id ? { ...d, is_verified: true, ssl_status: 'active' as const } : d));
      } else {
        showWarning('DNS ainda não propagado. Tente novamente em alguns minutos.');
      }
    } catch (err: any) {
      console.error('Erro na verificação:', err);
      showError(err.message || 'Falha ao verificar domínio.');
    } finally {
      setVerifyingDomain(null);
    }
  }, [showSuccess, showWarning, showError]);

  const deleteDomain = useCallback((id: string, name: string) => {
    setSelectedDomainToDelete({ id, name });
    setShowDeleteDomainConfirm(true);
  }, []);

  const confirmDeleteDomain = useCallback(async () => {
    if (!selectedDomainToDelete || !user) return;
    const { id } = selectedDomainToDelete;
    setDeleting(true);
    try {
      const { error } = await CustomDomainsAPI.deleteCustomDomain(id, user.id);
      if (error) throw error;

      setCustomDomains(prev => prev.filter(d => d.id !== id));
      showSuccess('Domínio removido com sucesso.');
    } catch (err: any) {
      console.error('Erro ao remover domínio:', err);
      showError(err.message || 'Falha ao remover domínio.');
    } finally {
      setDeleting(false);
      setShowDeleteDomainConfirm(false);
      setSelectedDomainToDelete(null);
    }
  }, [selectedDomainToDelete, user, showSuccess, showError]);

  const copyToClipboard = useCallback(async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedDNS(type);
      setTimeout(() => setCopiedDNS(null), 2000);
      showSuccess('Copiado para área de transferência!');
    } catch {
      showError('Falha ao copiar.');
    }
  }, [showSuccess, showError]);

  const statusInfo = useCallback((d: CustomDomain) => {
    if (d.is_verified && d.ssl_status === 'active') {
      return { icon: <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />, text: 'Ativo', color: 'text-green-500' };
    }
    if (d.ssl_status === 'failed') {
      return { icon: <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />, text: 'Erro SSL', color: 'text-red-500' };
    }
    if (d.is_verified) {
      return { icon: <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />, text: 'SSL em ativação', color: 'text-yellow-500' };
    }
    return { icon: <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />, text: 'Aguardando DNS', color: 'text-yellow-500' };
  }, []);

  /* ---------- Gradiente customizado ---------- */
  const addCustomColor = useCallback(() => {
    if (customGradientColors.length < 3) {
      setCustomGradientColors(prev => [...prev, '#3B82F6']);
    }
  }, [customGradientColors.length]);

  const removeCustomColor = useCallback((index: number) => {
    if (customGradientColors.length > 2) {
      setCustomGradientColors(prev => prev.filter((_, i) => i !== index));
    }
  }, [customGradientColors.length]);

  const updateCustomColor = useCallback((index: number, color: string) => {
    setCustomGradientColors(prev => {
      const next = [...prev];
      next[index] = color;
      return next;
    });
  }, []);

  const randomGradient = useCallback(() => {
    const randomColor = () => `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
    const length = Math.floor(Math.random() * 2) + 2;
    setCustomGradientColors(Array.from({ length }, randomColor));
    setIsCustomGradient(true);
  }, []);

  /* ------------------------------------------------- *
   *  Renderização completa (mantém 100% da UI)        *
   * ------------------------------------------------- */
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-blue-900/20 text-gray-900 dark:text-white transition-all duration-500"
    >
      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          animation: gradient-x 6s ease infinite;
        }
        @media (max-width: 640px) {
          ::-webkit-scrollbar { width: 8px; }
          ::-webkit-scrollbar-track { background: linear-gradient(to bottom, rgba(139,92,246,.05), rgba(219,39,119,.05)); border-radius: 10px; }
          ::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, #a855f7, #ec4899, #3b82f6); border-radius: 10px; }
          ::-webkit-scrollbar-thumb:hover { background: linear-gradient(to bottom, #c084fc, #f472b6); }
        }
        @media (min-width: 641px) {
          ::-webkit-scrollbar { width: 12px; }
          ::-webkit-scrollbar-track { background: linear-gradient(to bottom, rgba(139,92,246,.05), rgba(219,39,119,.05)); border-radius: 10px; }
          ::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, #a855f7, #ec4899, #3b82f6); border-radius: 10px; box-shadow: 0 0 10px rgba(168,85,247,.5); }
          ::-webkit-scrollbar-thumb:hover { background: linear-gradient(to bottom, #c084fc, #f472b6); box-shadow: 0 0 15px rgba(192,132,252,.6); }
        }
      `}</style>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6 sm:mb-8 relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-2xl border border-purple-200/30 dark:border-purple-800/30 bg-gradient-to-br from-purple-50/80 via-pink-50/80 to-blue-50/80 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-blue-900/20 backdrop-blur-sm"
        >
          <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-tr from-blue-400/20 to-purple-400/20 rounded-full blur-3xl" />
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
          transition={{ delay: 0.2 }}
          className="mb-4 sm:mb-6 bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-200/20 dark:border-gray-700/30 p-1.5 sm:p-2 shadow-lg"
        >
          <div className="flex space-x-1.5 sm:space-x-2">
            {TABS.map(tab => {
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
            className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-200/20 dark:border-gray-700/30 p-4 sm:p-8 shadow-lg"
          >

            {/* ========== CORES & TEMA ========== */}
            {activeTab === 'cores-tema' && (
              <div className="space-y-6 sm:space-y-8">

                {/* Tema Visual */}
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
                    {Object.entries(THEME_PREVIEWS).map(([key, classes], i) => {
                      const isActive = selectedTheme === key;
                      return (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => setSelectedTheme(key as keyof typeof THEME_PREVIEWS)}
                          className={`cursor-pointer rounded-xl sm:rounded-2xl p-3 sm:p-5 transition-all duration-300 hover:scale-105 ${
                            isActive ? 'ring-2 sm:ring-4 ring-purple-500 shadow-xl' : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600 shadow-md'
                          }`}
                        >
                          <div className={`w-full h-36 sm:h-40 ${classes.bg} rounded-lg sm:rounded-xl p-2.5 sm:p-4 mb-3 sm:mb-4 ${classes.border} border-2 shadow-inner`}>
                            <div className="flex justify-between items-start mb-2">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg" />
                              <div className="text-xs font-medium text-gray-500">Logo</div>
                            </div>
                            <div className={`${classes.txt} font-bold text-sm sm:text-base mb-1`}>Título da Campanha</div>
                            <div className={`${classes.txt2} text-xs sm:text-sm mb-3`}>Descrição breve da oferta especial</div>
                            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold text-center">
                              Ação Principal
                            </div>
                          </div>
                          <p className="text-center text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                            {key === 'claro' ? 'Claro' : key === 'escuro' ? 'Escuro' : key === 'escuro-preto' ? 'Escuro Preto' : 'Escuro Cinza'}
                          </p>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Modo de Cor */}
                <div>
                  <motion.h2
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 }}
                    className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 flex items-center gap-2"
                  >
                    <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                    Estilo de cor
                  </motion.h2>
                  <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                    Cor sólida ou gradiente animado
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    {(['solid', 'gradient'] as const).map((mode, i) => (
                      <motion.button
                        key={mode}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.05 }}
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
                          className={`w-full h-6 sm:h-8 rounded-lg shadow-md ${mode === 'gradient' ? gradientBtnClasses : ''}`}
                          style={mode === 'solid' ? solidBtnStyle : gradientStyle}
                        />
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Cores Sólidas */}
                <AnimatePresence>
                  {colorMode === 'solid' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                        Cor principal
                      </h2>
                      <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                        Aplicada aos botões e destaques
                      </p>

                      <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
                        {SOLID_COLORS.map(color => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl transition-all duration-300 shadow-md hover:shadow-xl ${
                              selectedColor === color
                                ? 'ring-2 sm:ring-4 ring-purple-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 scale-110'
                                : 'hover:scale-105'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        <div className="relative">
                          <input
                            type="color"
                            value={selectedColor}
                            onChange={e => setSelectedColor(e.target.value)}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl border-2 border-gray-300 dark:border-gray-600 opacity-0 absolute inset-0 cursor-pointer"
                          />
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300 shadow-md">
                            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500" />
                          </div>
                        </div>
                      </div>

                      <div className="p-3 sm:p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-xl sm:rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
                        <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                          Cor selecionada:
                        </p>
                        <div className="flex items-center space-x-3 sm:space-x-4">
                          <div
                            className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl shadow-lg border-4 border-white dark:border-gray-700"
                            style={{ backgroundColor: selectedColor }}
                          />
                          <div>
                            <span className="text-gray-900 dark:text-white font-mono text-base sm:text-lg font-bold">
                              {selectedColor.toUpperCase()}
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Código hexadecimal</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Gradientes */}
                <AnimatePresence>
                  {colorMode === 'gradient' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                        Gradientes animados
                      </h2>
                      <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                        Escolha um pré-definido ou crie o seu próprio
                      </p>

                      <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6">
                        <button
                          onClick={() => setIsCustomGradient(false)}
                          className={`flex-1 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm rounded-lg sm:rounded-xl font-semibold transition-all duration-300 ${
                            !isCustomGradient
                              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          Predefinidos
                        </button>
                        <button
                          onClick={() => setIsCustomGradient(true)}
                          className={`flex-1 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm rounded-lg sm:rounded-xl font-semibold transition-all duration-300 ${
                            isCustomGradient
                              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          Personalizado
                        </button>
                      </div>

                      {!isCustomGradient && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                          {GRADIENTS.map(gradient => (
                            <button
                              key={gradient.id}
                              onClick={() => setSelectedGradient(gradient.classes)}
                              className={`group relative overflow-hidden rounded-xl sm:rounded-2xl transition-all duration-300 ${
                                selectedGradient === gradient.classes
                                  ? 'ring-2 sm:ring-4 ring-purple-500 shadow-2xl scale-105'
                                  : 'hover:scale-105 hover:shadow-xl'
                              }`}
                            >
                              <div
                                className={`h-20 sm:h-24 bg-gradient-to-r ${gradient.classes} animate-gradient-x bg-[length:200%_200%]`}
                              />
                              {selectedGradient === gradient.classes && (
                                <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 bg-white dark:bg-gray-900 rounded-full p-1 shadow-lg">
                                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                                </div>
                              )}
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 sm:p-3">
                                <p className="text-white text-xs font-semibold text-center">{gradient.name}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {isCustomGradient && (
                        <div>
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-gray-200/50 dark:border-gray-700/50 mb-4 sm:mb-6">
                            <div className="flex items-center justify-between mb-4 sm:mb-6">
                              <h3 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">
                                Suas cores
                              </h3>
                              <button
                                onClick={randomGradient}
                                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 sm:gap-2"
                              >
                                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                                Random
                              </button>
                            </div>

                            <div className="space-y-3 sm:space-y-4">
                              {customGradientColors.map((color, index) => (
                                <div key={index} className="flex items-center gap-2 sm:gap-4">
                                  <div className="flex-shrink-0 text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 w-12 sm:w-16">
                                    Cor {index + 1}
                                  </div>
                                  <div className="relative flex-1">
                                    <input
                                      type="color"
                                      value={color}
                                      onChange={e => updateCustomColor(index, e.target.value)}
                                      className="w-full h-10 sm:h-12 rounded-lg sm:rounded-xl border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                                      style={{ backgroundColor: color }}
                                    />
                                  </div>
                                  <div className="flex items-center gap-2 sm:gap-3 flex-1">
                                    <div
                                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl shadow-lg border-2 border-white dark:border-gray-700"
                                      style={{ backgroundColor: color }}
                                    />
                                    <input
                                      type="text"
                                      value={color.toUpperCase()}
                                      onChange={e => updateCustomColor(index, e.target.value)}
                                      className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md sm:rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                      placeholder="#000000"
                                    />
                                  </div>
                                  {customGradientColors.length > 2 && (
                                    <button
                                      onClick={() => removeCustomColor(index)}
                                      className="p-1.5 sm:p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg sm:rounded-xl transition-all duration-300"
                                    >
                                      <X className="h-4 w-4 sm:h-5 sm:w-5" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>

                            {customGradientColors.length < 3 && (
                              <button
                                onClick={addCustomColor}
                                className="mt-3 sm:mt-4 w-full py-2 sm:py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 font-semibold"
                              >
                                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                                Adicionar cor (máx. 3)
                              </button>
                            )}
                          </div>

                          <div className="p-3 sm:p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-xl sm:rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
                            <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                              Gradiente personalizado:
                            </p>
                            <div
                              className="w-full h-16 sm:h-20 rounded-xl sm:rounded-2xl shadow-xl animate-gradient-x bg-[length:200%_200%]"
                              style={{ background: customGradientStyle, backgroundSize: '200% 200%' }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Preview do gradiente selecionado (pré-definido) */}
                      {!isCustomGradient && (
                        <div className="p-3 sm:p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-xl sm:rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
                          <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                            Gradiente selecionado:
                          </p>
                          <div
                            className={`w-full h-16 sm:h-20 rounded-xl sm:rounded-2xl shadow-xl bg-gradient-to-r ${selectedGradient} animate-gradient-x bg-[length:200%_200%]`}
                          />
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Pré-visualização da campanha */}
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 flex items-center gap-2">
                    <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                    Pré-visualização
                  </h2>
                  <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                    Como sua campanha aparecerá para os visitantes
                  </p>
                  <div className={`${themeClasses.bg} rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 ${themeClasses.border} shadow-inner`}>
                    <div className="flex justify-between items-start mb-4">
                      {currentLogoUrl ? (
                        <img src={currentLogoUrl} alt="Logo" className="h-10 sm:h-12 object-contain" />
                      ) : (
                        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg w-10 h-10 sm:w-12 sm:h-12" />
                      )}
                      <div className="text-xs text-gray-500">Pré-visualização</div>
                    </div>
                    <h3 className={`${themeClasses.txt} text-lg sm:text-xl font-bold mb-2`}>
                      Título da Sua Campanha
                    </h3>
                    <p className={`${themeClasses.txt2} text-sm sm:text-base mb-4`}>
                      Descrição breve e atraente da sua oferta especial com destaque visual.
                    </p>
                    <button
                      className={`w-full py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-white transition-all duration-300 shadow-lg ${
                        colorMode === 'gradient'
                          ? `bg-gradient-to-r ${isCustomGradient ? '' : selectedGradient} animate-gradient-x bg-[length:200%_200%]`
                          : ''
                      }`}
                      style={colorMode === 'solid' ? { backgroundColor: selectedColor } : isCustomGradient ? { background: customGradientStyle, backgroundSize: '200% 200%' } : {}}
                    >
                      Ação Principal
                    </button>
                  </div>
                </div>

                {/* Dica */}
                <div className="mb-4 sm:mb-6 p-3 sm:p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl sm:rounded-2xl shadow-md">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Info className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm sm:text-base font-semibold text-blue-900 dark:text-blue-100 mb-1">
                        Dica de design
                      </p>
                      <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                        Use cores contrastantes para melhor conversão. Gradientes animados chamam mais atenção em dispositivos móveis.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Salvar */}
                <motion.button
                  onClick={saveChanges}
                  disabled={saving}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
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

            {/* ========== SUA LOGO ========== */}
            {activeTab === 'sua-logo' && (
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 flex items-center gap-2">
                    <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                    Upload da sua logo
                  </h2>
                  <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                    Adicione sua logo para personalizar ainda mais suas campanhas
                  </p>
                </div>

                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoSelect}
                  className="hidden"
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  <div>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center cursor-pointer hover:border-purple-500 dark:hover:border-purple-400 transition-all duration-300"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 rounded-xl sm:rounded-2xl flex items-center justify-center">
                        <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600 dark:text-purple-400" />
                      </div>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1">
                        Clique para fazer upload
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG, SVG até 5MB
                      </p>
                    </div>
                  </div>

                  <div>
                    {logoPreviewUrl ? (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-gray-200 dark:border-gray-700">
                        <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Pré-visualização:
                        </p>
                        <img src={logoPreviewUrl} alt="Preview" className="w-full h-32 sm:h-40 object-contain rounded-lg" />
                        <button
                          onClick={uploadLogo}
                          disabled={uploadingLogo}
                          className="mt-4 w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base transition-all duration-300 flex items-center justify-center space-x-2 sm:space-x-3 shadow-lg"
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
                        </button>
                      </div>
                    ) : currentLogoUrl ? (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-gray-200 dark:border-gray-700">
                        <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Logo atual:
                        </p>
                        <img src={currentLogoUrl} alt="Logo atual" className="w-full h-32 sm:h-40 object-contain rounded-lg" />
                        <button
                          onClick={removeLogo}
                          className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base transition-all duration-300 flex items-center justify-center space-x-2 sm:space-x-3 shadow-lg"
                        >
                          <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span>Remover Logo</span>
                        </button>
                      </div>
                    ) : (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 text-center">
                        <div className="w-16 h-16 mx-auto mb-3 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          Nenhuma logo enviada ainda
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl sm:rounded-2xl border border-purple-200 dark:border-purple-800">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Info className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm sm:text-base font-semibold text-purple-900 dark:text-purple-100 mb-1">
                        Recomendações para logo
                      </p>
                      <ul className="text-xs sm:text-sm text-purple-700 dark:text-purple-300 space-y-1">
                        <li>• Use fundo transparente (PNG)</li>
                        <li>• Proporção ideal: 3:1 ou 4:1</li>
                        <li>• Altura mínima: 60px</li>
                        <li>• Evite texto muito pequeno</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========== DOMÍNIOS ========== */}
            {activeTab === 'dominios' && (
              <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-3 sm:gap-4">
                  <div>
                    <h2 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
                      <ExternalLink className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400" />
                      Domínio personalizado
                    </h2>
                    <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400">
                      Use seu próprio domínio para maior credibilidade
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDomainModal(true)}
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-2xl text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base transition-all duration-300 flex items-center justify-center space-x-1.5 sm:space-x-2 shadow-lg hover:scale-105 whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Adicionar Domínio</span>
                  </button>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                  {loadingDomains ? (
                    <div className="text-center py-12 sm:py-16">
                      <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-4 border-purple-600 mx-auto mb-3 sm:mb-4" />
                      <p className="text-gray-600 dark:text-gray-400 font-medium text-sm sm:text-base">
                        Carregando domínios...
                      </p>
                    </div>
                  ) : customDomains.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      {customDomains.map(domain => {
                        const { icon, text, color } = statusInfo(domain);
                        const isOpen = showDNSDetails === domain.id;
                        return (
                          <div
                            key={domain.id}
                            className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-xl transition-all duration-300"
                          >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                              <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                                {icon}
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-base sm:text-lg text-gray-900 dark:text-white truncate">
                                    {domain.domain_name}
                                  </div>
                                  <div className={`text-xs sm:text-sm ${color}`}>
                                    Status: <span className="font-semibold">{text}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1.5 sm:space-x-2">
                                {domain.is_verified ? (
                                  <a
                                    href={`https://${domain.domain_name}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 sm:p-3 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-110"
                                  >
                                    <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5" />
                                  </a>
                                ) : (
                                  <button
                                    onClick={() => verifyDomain(domain.id)}
                                    disabled={verifyingDomain === domain.id}
                                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-105 shadow-md"
                                  >
                                    {verifyingDomain === domain.id ? 'Verificando...' : 'Verificar'}
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteDomain(domain.id, domain.domain_name)}
                                  className="p-2 sm:p-3 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-110"
                                >
                                  <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                </button>
                              </div>
                            </div>

                            {!domain.is_verified && (
                              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                  onClick={() => setShowDNSDetails(isOpen ? null : domain.id)}
                                  className="flex items-center gap-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                                >
                                  <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                  Instruções de DNS
                                </button>
                                {isOpen && (
                                  <div className="mt-3 space-y-3">
                                    <div>
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Tipo:</span>
                                        <code className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">CNAME</code>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Nome/Host:</span>
                                        <div className="flex items-center gap-2">
                                          <code className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">@</code>
                                          <button
                                            onClick={() => copyToClipboard('@', 'host')}
                                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                          >
                                            {copiedDNS === 'host' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Valor/Destino:</span>
                                        <code className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">custom.yourapp.com</code>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Cópia:</span>
                                        <button
                                          onClick={() => copyToClipboard('custom.yourapp.com', 'target')}
                                          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                        >
                                          {copiedDNS === 'target' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                        </button>
                                      </div>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                      Adicione este registro CNAME no painel do seu provedor de domínio. A propagação pode levar até 48h.
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 sm:py-16">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 rounded-xl sm:rounded-2xl flex items-center justify-center">
                        <ExternalLink className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600 dark:text-purple-400" />
                      </div>
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium mb-2">
                        Nenhum domínio personalizado
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Adicione seu primeiro domínio para começar
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ========== MODAIS ========== */}
      {showDomainModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
              Adicionar Domínio
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
              Digite seu domínio completo (ex: meudominio.com)
            </p>
            <input
              type="text"
              value={newDomain}
              onChange={e => setNewDomain(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addDomain()}
              placeholder="exemplo.com"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDomainModal(false);
                  setNewDomain('');
                }}
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={addDomain}
                disabled={!newDomain.trim() || saving}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold transition-all duration-300 flex items-center justify-center space-x-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Salvar Domínio</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

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