import React, { useState } from 'react';
import { Upload, Plus, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const CustomizationPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('cores-tema');
  const [selectedTheme, setSelectedTheme] = useState('claro');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [saving, setSaving] = useState(false);
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [newDomain, setNewDomain] = useState('');

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
            .select('primary_color, theme')
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
          }
        } catch (error) {
          console.error('Error loading user settings:', error);
        }
      }
    };

    loadUserSettings();
  }, [user]);

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

  const handleSaveDomain = () => {
    if (newDomain.trim()) {
      // Handle saving the domain
      console.log('Saving domain:', newDomain);
      setShowDomainModal(false);
      setNewDomain('');
    }
  };

  const handleCloseDomainModal = () => {
    setShowDomainModal(false);
    setNewDomain('');
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

              <div className="flex space-x-4 mb-8">
                {/* Light Theme */}
                <div
                  onClick={() => setSelectedTheme('claro')}
                  className={`cursor-pointer rounded-lg p-4 transition-all duration-200 ${
                    selectedTheme === 'claro'
                      ? 'ring-2 ring-purple-500'
                      : 'hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600'
                  }`}
                >
                  <div className="w-32 h-24 bg-white rounded-lg p-3 mb-3 border border-gray-200">
                    <div className="space-y-2">
                      <div 
                        className="h-2 rounded w-3/4"
                        style={{ backgroundColor: selectedColor }}
                      ></div>
                      <div className="flex space-x-1">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: selectedColor }}
                        ></div>
                        <div 
                          className="h-2 rounded flex-1"
                          style={{ backgroundColor: getLighterColor(selectedColor) }}
                        ></div>
                      </div>
                      <div className="flex space-x-1">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: selectedColor }}
                        ></div>
                        <div 
                          className="h-2 rounded flex-1"
                          style={{ backgroundColor: getLighterColor(selectedColor) }}
                        ></div>
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
                  <div className="w-32 h-24 bg-gray-800 rounded-lg p-3 mb-3">
                    <div className="space-y-2">
                      <div 
                        className="h-2 rounded w-3/4"
                        style={{ backgroundColor: selectedColor }}
                      ></div>
                      <div className="flex space-x-1">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: selectedColor }}
                        ></div>
                        <div 
                          className="h-2 rounded flex-1"
                          style={{ backgroundColor: getLighterColor(selectedColor) }}
                        ></div>
                      </div>
                      <div className="flex space-x-1">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: selectedColor }}
                        ></div>
                        <div 
                          className="h-2 rounded flex-1"
                          style={{ backgroundColor: getLighterColor(selectedColor) }}
                        ></div>
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
                  <div className="w-32 h-24 bg-black rounded-lg p-3 mb-3">
                    <div className="space-y-2">
                      <div 
                        className="h-2 rounded w-3/4"
                        style={{ backgroundColor: selectedColor }}
                      ></div>
                      <div className="flex space-x-1">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: selectedColor }}
                        ></div>
                        <div 
                          className="h-2 rounded flex-1"
                          style={{ backgroundColor: getLighterColor(selectedColor) }}
                        ></div>
                      </div>
                      <div className="flex space-x-1">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: selectedColor }}
                        ></div>
                        <div 
                          className="h-2 rounded flex-1"
                          style={{ backgroundColor: getLighterColor(selectedColor) }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-sm font-medium">Escuro Preto</p>
                </div>
              </div>
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

              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors duration-200">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Arraste e solte sua logo aqui ou clique para selecionar
                </p>
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 mx-auto">
                  <span>Adicionar</span>
                  <Upload className="h-4 w-4" />
                </button>
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
                  Você pode adicionar até 3 domínios personalizados para suas rifas
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

              {/* Empty State */}
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 border-2 border-gray-400 dark:border-gray-500 rounded border-dashed"></div>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Você ainda não possui domínios configurados
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Domain Modal */}
      {showDomainModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Novo domínio
              </h2>
              <button
                onClick={handleCloseDomainModal}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-400" />
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
              disabled={!newDomain.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200"
            >
              Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomizationPage;