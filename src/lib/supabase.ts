import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { ArrowLeft, Palette, Image as ImageIcon, Link2, Save, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

type ColorMode = 'solid' | 'gradient-preset' | 'gradient-custom'

interface GradientColor {
  color: string
  position: number
}

export default function CustomizationPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Estados para personalização
  const [primaryColor, setPrimaryColor] = useState('#3B82F6')
  const [logoUrl, setLogoUrl] = useState('')
  const [colorMode, setColorMode] = useState<ColorMode>('solid')
  const [selectedGradient, setSelectedGradient] = useState('blue-purple')
  const [customGradientColors, setCustomGradientColors] = useState<GradientColor[]>([
    { color: '#3B82F6', position: 0 },
    { color: '#8B5CF6', position: 100 }
  ])

  // Gradientes predefinidos
  const gradientPresets = [
    { id: 'blue-purple', name: 'Azul → Roxo', classes: 'from-blue-500 to-purple-600' },
    { id: 'purple-pink', name: 'Roxo → Rosa', classes: 'from-purple-500 to-pink-600' },
    { id: 'green-blue', name: 'Verde → Azul', classes: 'from-green-500 to-blue-600' },
    { id: 'orange-red', name: 'Laranja → Vermelho', classes: 'from-orange-500 to-red-600' },
    { id: 'cyan-blue', name: 'Ciano → Azul', classes: 'from-cyan-400 to-blue-600' },
    { id: 'pink-orange', name: 'Rosa → Laranja', classes: 'from-pink-500 to-orange-500' }
  ]

  useEffect(() => {
    loadUserProfile()
  }, [user])

  const loadUserProfile = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('primary_color, logo_url, color_mode, gradient_classes, custom_gradient_colors')
        .eq('id', user.id)
        .single()

      if (error) throw error

      if (data) {
        if (data.primary_color) setPrimaryColor(data.primary_color)
        if (data.logo_url) setLogoUrl(data.logo_url)
        if (data.color_mode) setColorMode(data.color_mode as ColorMode)
        if (data.gradient_classes) {
          const preset = gradientPresets.find(g => g.classes === data.gradient_classes)
          if (preset) setSelectedGradient(preset.id)
        }
        if (data.custom_gradient_colors) {
          setCustomGradientColors(data.custom_gradient_colors)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
      toast.error('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    try {
      setSaving(true)

      const gradientClasses = colorMode === 'gradient-preset' 
        ? gradientPresets.find(g => g.id === selectedGradient)?.classes 
        : null

      const { error } = await supabase
        .from('profiles')
        .update({
          primary_color: primaryColor,
          logo_url: logoUrl,
          color_mode: colorMode,
          gradient_classes: gradientClasses,
          custom_gradient_colors: colorMode === 'gradient-custom' ? customGradientColors : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      toast.success('Configurações salvas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'escuro-cinza') => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          theme: newTheme,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      setTheme(newTheme)
      toast.success('Tema alterado com sucesso!')
    } catch (error) {
      console.error('Erro ao alterar tema:', error)
      toast.error('Erro ao alterar tema')
    }
  }

  const addGradientColor = () => {
    if (customGradientColors.length >= 5) {
      toast.error('Máximo de 5 cores permitidas')
      return
    }
    const newColors = [...customGradientColors, { color: '#000000', position: 50 }]
    setCustomGradientColors(newColors.sort((a, b) => a.position - b.position))
  }

  const removeGradientColor = (index: number) => {
    if (customGradientColors.length <= 2) {
      toast.error('Mínimo de 2 cores necessárias')
      return
    }
    setCustomGradientColors(customGradientColors.filter((_, i) => i !== index))
  }

  const updateGradientColor = (index: number, field: 'color' | 'position', value: string | number) => {
    const newColors = [...customGradientColors]
    newColors[index] = { ...newColors[index], [field]: value }
    setCustomGradientColors(newColors.sort((a, b) => a.position - b.position))
  }

  const getCustomGradientStyle = () => {
    const gradient = customGradientColors
      .map(c => `${c.color} ${c.position}%`)
      .join(', ')
    return `linear-gradient(135deg, ${gradient})`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/organizer')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Personalização
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Personalize a aparência das suas campanhas
                </p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configurações */}
          <div className="space-y-6">
            {/* Tema Visual */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Tema visual
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Escolha o tema da interface
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Tema Claro */}
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    theme === 'light'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="aspect-video bg-white rounded-md mb-3 border border-gray-200 flex items-center justify-center">
                    <div className="w-2/3 h-2/3 bg-gray-100 rounded"></div>
                  </div>
                  <p className="text-sm font-medium text-gray-900 text-center">Claro</p>
                </button>

                {/* Tema Escuro */}
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    theme === 'dark'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="aspect-video bg-gray-800 rounded-md mb-3 border border-gray-700 flex items-center justify-center">
                    <div className="w-2/3 h-2/3 bg-gray-700 rounded"></div>
                  </div>
                  <p className="text-sm font-medium text-gray-900 text-center">Escuro</p>
                </button>

                {/* Tema Escuro Cinza */}
                <button
                  onClick={() => handleThemeChange('escuro-cinza')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    theme === 'escuro-cinza'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="aspect-video bg-[#1A1A1A] rounded-md mb-3 border border-[#404040] flex items-center justify-center relative overflow-hidden">
                    <div className="w-2/3 h-2/3 bg-[#2C2C2C] rounded"></div>
                    {/* Acento roxo */}
                    <div className="absolute top-1 right-1 w-2 h-2 bg-[#8B5CF6] rounded-full"></div>
                    {/* Acento laranja */}
                    <div className="absolute bottom-1 left-1 w-3 h-1 bg-[#FF8C00] rounded-full"></div>
                  </div>
                  <p className="text-sm font-medium text-gray-900 text-center">Escuro Cinza</p>
                </button>
              </div>
            </div>

            {/* Modo de Cor */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                Modo de cor
              </h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="colorMode"
                    checked={colorMode === 'solid'}
                    onChange={() => setColorMode('solid')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Cor sólida</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="colorMode"
                    checked={colorMode === 'gradient-preset'}
                    onChange={() => setColorMode('gradient-preset')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Gradiente predefinido</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="colorMode"
                    checked={colorMode === 'gradient-custom'}
                    onChange={() => setColorMode('gradient-custom')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Gradiente personalizado</span>
                </label>
              </div>
            </div>

            {/* Cor Primária (Sólida) */}
            {colorMode === 'solid' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                  Cor primária
                </h3>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-20 h-20 rounded-lg cursor-pointer border-2 border-gray-200 dark:border-gray-700"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white uppercase"
                      placeholder="#3B82F6"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Esta cor será usada nos botões e elementos principais
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Gradientes Predefinidos */}
            {colorMode === 'gradient-preset' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                  Escolha um gradiente
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {gradientPresets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setSelectedGradient(preset.id)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedGradient === preset.id
                          ? 'border-blue-600'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className={`h-16 rounded-lg bg-gradient-to-r ${preset.classes} mb-2`}></div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white text-center">
                        {preset.name}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Gradiente Personalizado */}
            {colorMode === 'gradient-custom' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Gradiente personalizado
                  </h3>
                  <button
                    onClick={addGradientColor}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Adicionar cor
                  </button>
                </div>

                {/* Preview do gradiente */}
                <div
                  className="h-20 rounded-lg mb-4"
                  style={{ background: getCustomGradientStyle() }}
                ></div>

                {/* Lista de cores */}
                <div className="space-y-3">
                  {customGradientColors.map((gradColor, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <input
                        type="color"
                        value={gradColor.color}
                        onChange={(e) => updateGradientColor(index, 'color', e.target.value)}
                        className="w-12 h-12 rounded cursor-pointer border border-gray-200 dark:border-gray-700"
                      />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={gradColor.position}
                        onChange={(e) => updateGradientColor(index, 'position', parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-12">
                        {gradColor.position}%
                      </span>
                      {customGradientColors.length > 2 && (
                        <button
                          onClick={() => removeGradientColor(index)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Logo */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <ImageIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Logo
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    URL da imagem do seu logo
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Link2 className="w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://exemplo.com/logo.png"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {logoUrl && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Preview:</p>
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="h-12 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Preview
              </h3>
              
              <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {/* Header Preview */}
                <div
                  className="p-6 text-white"
                  style={
                    colorMode === 'solid'
                      ? { backgroundColor: primaryColor }
                      : colorMode === 'gradient-preset'
                      ? {}
                      : { background: getCustomGradientStyle() }
                  }
                  {...(colorMode === 'gradient-preset' && {
                    className: `p-6 text-white bg-gradient-to-r ${
                      gradientPresets.find(g => g.id === selectedGradient)?.classes
                    }`
                  })}
                >
                  {logoUrl && (
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="h-8 mb-4 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                  <h4 className="text-xl font-bold mb-2">Nome da Campanha</h4>
                  <p className="text-sm opacity-90">Descrição da campanha</p>
                </div>

                {/* Content Preview */}
                <div className="p-6 bg-gray-50 dark:bg-gray-900">
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <div
                        key={n}
                        className="aspect-square bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 flex items-center justify-center text-sm text-gray-600 dark:text-gray-400"
                      >
                        {n}
                      </div>
                    ))}
                  </div>

                  <button
                    className="w-full py-3 rounded-lg text-white font-medium"
                    style={
                      colorMode === 'solid'
                        ? { backgroundColor: primaryColor }
                        : colorMode === 'gradient-preset'
                        ? {}
                        : { background: getCustomGradientStyle() }
                    }
                    {...(colorMode === 'gradient-preset' && {
                      className: `w-full py-3 rounded-lg text-white font-medium bg-gradient-to-r ${
                        gradientPresets.find(g => g.id === selectedGradient)?.classes
                      }`
                    })}
                  >
                    Reservar Cotas
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}