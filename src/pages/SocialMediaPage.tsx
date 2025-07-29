import React, { useState } from 'react';
import { ArrowLeft, Plus, X, ArrowRight, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface SocialNetwork {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  url?: string;
}

const SocialMediaPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<SocialNetwork | null>(null);
  const [linkInput, setLinkInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [socialNetworks, setSocialNetworks] = useState<SocialNetwork[]>([
    {
      id: 'facebook',
      name: 'Facebook',
      icon: '📘',
      connected: false
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: '📷',
      connected: false
    },
    {
      id: 'tiktok',
      name: 'Tiktok',
      icon: '🎵',
      connected: false
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: '✈️',
      connected: false
    },
    {
      id: 'whatsapp-group',
      name: 'Whatsapp grupo',
      icon: '💬',
      connected: false
    },
    {
      id: 'youtube',
      name: 'Youtube',
      icon: '📺',
      connected: false
    },
    {
      id: 'discord',
      name: 'Discord',
      icon: '🎮',
      connected: false
    }
  ]);

  // Load social media links when component mounts
  React.useEffect(() => {
    const loadSocialMediaLinks = async () => {
      if (!user) return;

      try {
        // Check if social_media_links column exists by trying to query it
        const { data, error } = await supabase
          .from('profiles')
          .select('social_media_links')
          .eq('id', user.id)
          .single();

        if (error) {
          // If column doesn't exist, silently continue with default state
          if (error.code === '42703') {
            console.log('social_media_links column not yet created');
            return;
          }
          console.error('Error loading social media links:', error);
          return;
        }

        if (data?.social_media_links) {
          const links = data.social_media_links;
          setSocialNetworks(prev => 
            prev.map(network => ({
              ...network,
              connected: !!links[network.id],
              url: links[network.id] || undefined
            }))
          );
        }
      } catch (error) {
        console.error('Error loading social media links:', error);
      }
    };

    loadSocialMediaLinks();
  }, [user]);

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  const handleAddSocialNetwork = (network: SocialNetwork) => {
    setSelectedNetwork(network);
    setLinkInput(network.url || '');
    setShowModal(true);
  };

  const handleSaveLink = async () => {
    if (!selectedNetwork || !user) return;

    setLoading(true);
    try {
      // Get current social media links
      const { data: currentData, error: fetchError } = await supabase
        .from('profiles')
        .select('social_media_links')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === '42703') {
          alert('A coluna social_media_links ainda não foi criada no banco de dados. Entre em contato com o suporte.');
          return;
        }
        console.error('Error fetching current links:', fetchError);
        alert('Erro ao carregar dados. Tente novamente.');
        return;
      }

      const currentLinks = currentData?.social_media_links || {};
      const updatedLinks = {
        ...currentLinks,
        [selectedNetwork.id]: linkInput.trim()
      };

      // Update in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ social_media_links: updatedLinks })
        .eq('id', user.id);

      if (updateError) {
        if (updateError.code === '42703') {
          alert('A coluna social_media_links ainda não foi criada no banco de dados. Entre em contato com o suporte.');
          return;
        }
        console.error('Error updating social media links:', updateError);
        alert('Erro ao salvar link. Tente novamente.');
        return;
      }

      // Update local state
      setSocialNetworks(prev => 
        prev.map(network => 
          network.id === selectedNetwork.id 
            ? { ...network, connected: !!linkInput.trim(), url: linkInput.trim() || undefined }
            : network
        )
      );
      
      setShowModal(false);
      setSelectedNetwork(null);
      setLinkInput('');
    } catch (error) {
      console.error('Error saving social media link:', error);
      alert('Erro ao salvar link. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLink = async () => {
    if (!selectedNetwork || !user) return;

    setDeleting(true);
    try {
      // Get current social media links
      const { data: currentData, error: fetchError } = await supabase
        .from('profiles')
        .select('social_media_links')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === '42703') {
          alert('A coluna social_media_links ainda não foi criada no banco de dados. Entre em contato com o suporte.');
          return;
        }
        console.error('Error fetching current links:', fetchError);
        alert('Erro ao carregar dados. Tente novamente.');
        return;
      }

      const currentLinks = currentData?.social_media_links || {};
      const updatedLinks = { ...currentLinks };
      delete updatedLinks[selectedNetwork.id];

      // Update in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ social_media_links: updatedLinks })
        .eq('id', user.id);

      if (updateError) {
        if (updateError.code === '42703') {
          alert('A coluna social_media_links ainda não foi criada no banco de dados. Entre em contato com o suporte.');
          return;
        }
        console.error('Error deleting social media link:', updateError);
        alert('Erro ao excluir link. Tente novamente.');
        return;
      }

      // Update local state
      setSocialNetworks(prev => 
        prev.map(network => 
          network.id === selectedNetwork.id 
            ? { ...network, connected: false, url: undefined }
            : network
        )
      );
      
      setShowModal(false);
      setSelectedNetwork(null);
      setLinkInput('');
    } catch (error) {
      console.error('Error deleting social media link:', error);
      alert('Erro ao excluir link. Tente novamente.');
    } finally {
      setDeleting(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedNetwork(null);
    setLinkInput('');
  };

  const getNetworkIcon = (networkId: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      facebook: (
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-bold">f</span>
        </div>
      ),
      instagram: (
        <div className="w-8 h-8 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-400 rounded-full flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white rounded-full"></div>
        </div>
      ),
      tiktok: (
        <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
          <div className="w-3 h-4 bg-white rounded-sm"></div>
        </div>
      ),
      telegram: (
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <div className="w-4 h-4 bg-white rounded-full transform rotate-45"></div>
        </div>
      ),
      'whatsapp-group': (
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
          <div className="w-4 h-3 bg-white rounded-sm"></div>
        </div>
      ),
      'whatsapp-support': (
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
          <div className="w-4 h-3 bg-white rounded-sm"></div>
        </div>
      ),
      youtube: (
        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
          <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-1"></div>
        </div>
      ),
      discord: (
        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
        </div>
      )
    };
    return icons[networkId] || <div className="w-8 h-8 bg-gray-500 rounded-full"></div>;
  };

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg border border-gray-200 dark:border-gray-800 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center space-x-4 p-6 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={handleGoBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </button>
        <h1 className="text-xl font-medium text-gray-900 dark:text-white">
          Redes sociais
        </h1>
      </div>

      {/* Social Networks Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {socialNetworks.map((network) => (
            <div
              key={network.id}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors duration-200"
            >
              <div className="flex items-center space-x-4">
                {getNetworkIcon(network.id)}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {network.name}
                  </h3>
                  <p className={`text-sm ${
                    network.connected 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {network.connected ? 'Conectado' : 'Não conectado'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleAddSocialNetwork(network)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              >
                <Plus className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedNetwork && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Adicionar {selectedNetwork.name}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Adicione o link da sua rede social
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cole o link aqui
              </label>
              <input
                type="url"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="Cole o link aqui"
                className="w-full bg-white dark:bg-gray-700 border border-purple-500 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
              />
            </div>

            <div className="flex space-x-3">
              {/* Delete Button - only show if network is connected */}
              {selectedNetwork?.connected && (
                <button
                  onClick={handleDeleteLink}
                  disabled={deleting || loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {deleting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Excluir</span>
                    </>
                  )}
                </button>
              )}
              
              {/* Save Button */}
              <button
                onClick={handleSaveLink}
                disabled={!linkInput.trim() || loading || deleting}
                className={`bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 ${
                  selectedNetwork?.connected ? 'flex-1' : 'w-full'
                }`}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <span>Salvar</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialMediaPage;