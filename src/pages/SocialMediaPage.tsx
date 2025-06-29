import React, { useState } from 'react';
import { 
  Instagram, 
  Facebook, 
  Twitter, 
  Youtube, 
  MessageCircle,
  Link,
  Copy,
  ExternalLink,
  Plus,
  Settings
} from 'lucide-react';

const SocialMediaPage = () => {
  const [activeTab, setActiveTab] = useState('accounts');

  const socialAccounts = [
    {
      platform: 'Instagram',
      icon: Instagram,
      username: '@rifaqui_oficial',
      followers: '12.5K',
      connected: true,
      color: 'from-pink-500 to-purple-600'
    },
    {
      platform: 'Facebook',
      icon: Facebook,
      username: 'Rifaqui Oficial',
      followers: '8.2K',
      connected: true,
      color: 'from-blue-600 to-blue-700'
    },
    {
      platform: 'WhatsApp',
      icon: MessageCircle,
      username: '+55 11 99999-9999',
      followers: 'Business',
      connected: false,
      color: 'from-green-500 to-green-600'
    },
    {
      platform: 'YouTube',
      icon: Youtube,
      username: 'Rifaqui Tutoriais',
      followers: '3.1K',
      connected: false,
      color: 'from-red-500 to-red-600'
    }
  ];

  const campaignLinks = [
    {
      campaign: 'iPhone 15 Pro Max',
      shortLink: 'rifaqui.com/iphone15',
      fullLink: 'https://rifaqui.com/campanha/iphone-15-pro-max-2024',
      clicks: 1247,
      conversions: 156
    },
    {
      campaign: 'Notebook Gamer',
      shortLink: 'rifaqui.com/notebook',
      fullLink: 'https://rifaqui.com/campanha/notebook-gamer-rtx4060',
      clicks: 523,
      conversions: 42
    }
  ];

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Redes Sociais</h1>
        <p className="text-gray-600 dark:text-gray-400">Conecte suas redes sociais e gerencie links das suas campanhas</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('accounts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'accounts'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Contas Conectadas
          </button>
          <button
            onClick={() => setActiveTab('links')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'links'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Links de Campanhas
          </button>
        </nav>
      </div>

      {/* Accounts Tab */}
      {activeTab === 'accounts' && (
        <div className="space-y-6">
          {/* Social Accounts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {socialAccounts.map((account, index) => {
              const IconComponent = account.icon;
              return (
                <div key={index} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 bg-gradient-to-r ${account.color} rounded-lg flex items-center justify-center`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{account.platform}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{account.username}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      account.connected
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                    }`}>
                      {account.connected ? 'Conectado' : 'Desconectado'}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Seguidores</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{account.followers}</p>
                    </div>
                    <button className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                      account.connected
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}>
                      {account.connected ? 'Configurar' : 'Conectar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Auto-posting Settings */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Publicação Automática</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Configure quando e onde suas campanhas serão publicadas automaticamente</p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Instagram className="h-5 w-5 text-pink-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Instagram Stories</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Publicar automaticamente nos stories</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Facebook className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Facebook Posts</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Publicar no feed do Facebook</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Links Tab */}
      {activeTab === 'links' && (
        <div className="space-y-6">
          {/* Create Link Button */}
          <div className="flex justify-end">
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors duration-200">
              <Plus className="h-5 w-5" />
              <span>Criar Link Personalizado</span>
            </button>
          </div>

          {/* Links List */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors duration-300">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-white">Campanha</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-white">Link Curto</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-white">Cliques</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-white">Conversões</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {campaignLinks.map((link, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 dark:text-white">{link.campaign}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm text-purple-600 dark:text-purple-400">
                            {link.shortLink}
                          </code>
                          <button
                            onClick={() => handleCopyLink(link.shortLink)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 dark:text-white">{link.clicks.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900 dark:text-white">{link.conversions}</p>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            ({((link.conversions / link.clicks) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
                            <ExternalLink className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200">
                            <Settings className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Link Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total de Cliques</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">1.770</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Link className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Conversões</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">198</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Settings className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Taxa de Conversão</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">11.2%</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <ExternalLink className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialMediaPage;