import React, { useState } from 'react';
import { 
  Palette, 
  Upload, 
  Type, 
  Layout, 
  Eye,
  Save,
  RotateCcw
} from 'lucide-react';

const CustomizePage = () => {
  const [activeTab, setActiveTab] = useState('colors');
  const [primaryColor, setPrimaryColor] = useState('#8B5CF6');
  const [secondaryColor, setSecondaryColor] = useState('#3B82F6');
  const [fontFamily, setFontFamily] = useState('Inter');

  const colorPresets = [
    { name: 'Roxo & Azul', primary: '#8B5CF6', secondary: '#3B82F6' },
    { name: 'Verde & Azul', primary: '#10B981', secondary: '#06B6D4' },
    { name: 'Rosa & Laranja', primary: '#EC4899', secondary: '#F59E0B' },
    { name: 'Vermelho & Rosa', primary: '#EF4444', secondary: '#EC4899' },
    { name: 'Azul & Índigo', primary: '#3B82F6', secondary: '#6366F1' },
    { name: 'Verde & Lima', primary: '#059669', secondary: '#65A30D' }
  ];

  const fonts = [
    { name: 'Inter', value: 'Inter' },
    { name: 'Roboto', value: 'Roboto' },
    { name: 'Open Sans', value: 'Open Sans' },
    { name: 'Poppins', value: 'Poppins' },
    { name: 'Montserrat', value: 'Montserrat' },
    { name: 'Nunito', value: 'Nunito' }
  ];

  const layouts = [
    { name: 'Clássico', preview: 'layout-classic.jpg' },
    { name: 'Moderno', preview: 'layout-modern.jpg' },
    { name: 'Minimalista', preview: 'layout-minimal.jpg' },
    { name: 'Elegante', preview: 'layout-elegant.jpg' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Personalizar Rifas</h1>
          <p className="text-gray-600 dark:text-gray-400">Customize a aparência das suas páginas de rifa</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200">
            <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="text-gray-700 dark:text-gray-300">Visualizar</span>
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center space-x-2 transition-colors duration-200">
            <Save className="h-4 w-4" />
            <span>Salvar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customization Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'colors', label: 'Cores', icon: Palette },
                { id: 'typography', label: 'Tipografia', icon: Type },
                { id: 'layout', label: 'Layout', icon: Layout },
                { id: 'media', label: 'Mídia', icon: Upload }
              ].map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Colors Tab */}
          {activeTab === 'colors' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Paleta de Cores</h3>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cor Primária
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-12 h-12 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors duration-300"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cor Secundária
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-12 h-12 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors duration-300"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Presets de Cores</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {colorPresets.map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setPrimaryColor(preset.primary);
                          setSecondaryColor(preset.secondary);
                        }}
                        className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors duration-200"
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: preset.primary }}
                          ></div>
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: preset.secondary }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{preset.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Typography Tab */}
          {activeTab === 'typography' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tipografia</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Família da Fonte
                    </label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors duration-300"
                    >
                      {fonts.map((font) => (
                        <option key={font.value} value={font.value}>
                          {font.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tamanho do Título
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors duration-300">
                        <option>24px</option>
                        <option>28px</option>
                        <option>32px</option>
                        <option>36px</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tamanho do Texto
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors duration-300">
                        <option>14px</option>
                        <option>16px</option>
                        <option>18px</option>
                        <option>20px</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Layout Tab */}
          {activeTab === 'layout' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Layouts</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {layouts.map((layout, index) => (
                    <button
                      key={index}
                      className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors duration-200"
                    >
                      <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded mb-3 flex items-center justify-center">
                        <Layout className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{layout.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Media Tab */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Logo e Imagens</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Logo da Empresa
                    </label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400 mb-2">Clique para fazer upload ou arraste aqui</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">PNG, JPG até 2MB</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Imagem de Fundo
                    </label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400 mb-2">Clique para fazer upload ou arraste aqui</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">PNG, JPG até 5MB</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 sticky top-6 transition-colors duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Preview</h3>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200">
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
            
            {/* Mock Preview */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div 
                className="h-32 flex items-center justify-center text-white font-bold text-lg"
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  fontFamily: fontFamily
                }}
              >
                Rifa do iPhone 15
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Progresso</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">75%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full"
                    style={{ backgroundColor: primaryColor, width: '75%' }}
                  ></div>
                </div>
                <button 
                  className="w-full py-2 rounded-lg text-white font-semibold"
                  style={{ backgroundColor: primaryColor }}
                >
                  Comprar Bilhete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizePage;