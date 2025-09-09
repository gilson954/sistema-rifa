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

  // ... seu restante do código aqui (sem alterações até o trecho dos temas)

  return (
    <div>
      {/* Seletor de tema corrigido */}
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
          {/* ... conteúdo do card */}
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
          {/* ... conteúdo do card */}
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
          {/* ... conteúdo do card */}
        </div>
      </div>

      {/* resto do código continua igual */}
    </div>
  );
};

export default CustomizationPage;
