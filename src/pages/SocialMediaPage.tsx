import React, { useState, useEffect } from "react";
import { Plus, X, ArrowRight, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { socialMediaConfig } from "../components/SocialMediaIcons";

interface SocialNetwork {
  id: string;
  name: string;
  connected: boolean;
  url?: string;
}

const SocialMediaPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<SocialNetwork | null>(null);
  const [linkInput, setLinkInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [socialNetworks, setSocialNetworks] = useState<SocialNetwork[]>(() =>
    Object.entries(socialMediaConfig).map(([id, config]) => ({
      id,
      name: config.name,
      connected: false,
    }))
  );

  // Carregar links já salvos no banco
  useEffect(() => {
    const loadSocialMediaLinks = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("social_media_links")
          .eq("id", user.id)
          .single();

        if (error) {
          if (error.code === "42703") {
            console.log("social_media_links column not yet created");
            return;
          }
          console.error("Error loading social media links:", error);
          return;
        }

        if (data?.social_media_links) {
          const links = data.social_media_links;
          setSocialNetworks((prev) =>
            prev.map((network) => ({
              ...network,
              connected: !!links[network.id],
              url: links[network.id] || undefined,
            }))
          );
        }
      } catch (error) {
        console.error("Error loading social media links:", error);
      }
    };

    loadSocialMediaLinks();
  }, [user]);

  const handleAddSocialNetwork = (network: SocialNetwork) => {
    setSelectedNetwork(network);
    setLinkInput(network.url || "");
    setShowModal(true);
  };

  const handleSaveLink = async () => {
    if (!selectedNetwork || !user) return;

    setLoading(true);
    try {
      const { data: currentData, error: fetchError } = await supabase
        .from("profiles")
        .select("social_media_links")
        .eq("id", user.id)
        .single();

      if (fetchError) {
        alert("Erro ao carregar dados. Tente novamente.");
        return;
      }

      const currentLinks = currentData?.social_media_links || {};
      const updatedLinks = {
        ...currentLinks,
        [selectedNetwork.id]: linkInput.trim(),
      };

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ social_media_links: updatedLinks })
        .eq("id", user.id);

      if (updateError) {
        alert("Erro ao salvar link. Tente novamente.");
        return;
      }

      setSocialNetworks((prev) =>
        prev.map((network) =>
          network.id === selectedNetwork.id
            ? { ...network, connected: !!linkInput.trim(), url: linkInput.trim() || undefined }
            : network
        )
      );

      setShowModal(false);
      setSelectedNetwork(null);
      setLinkInput("");
    } catch (error) {
      console.error("Error saving social media link:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLink = async () => {
    if (!selectedNetwork || !user) return;

    setDeleting(true);
    try {
      const { data: currentData } = await supabase
        .from("profiles")
        .select("social_media_links")
        .eq("id", user.id)
        .single();

      const currentLinks = currentData?.social_media_links || {};
      const updatedLinks = { ...currentLinks };
      delete updatedLinks[selectedNetwork.id];

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ social_media_links: updatedLinks })
        .eq("id", user.id);

      if (updateError) {
        alert("Erro ao excluir link. Tente novamente.");
        return;
      }

      setSocialNetworks((prev) =>
        prev.map((network) =>
          network.id === selectedNetwork.id
            ? { ...network, connected: false, url: undefined }
            : network
        )
      );

      setShowModal(false);
      setSelectedNetwork(null);
      setLinkInput("");
    } catch (error) {
      console.error("Error deleting social media link:", error);
    } finally {
      setDeleting(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedNetwork(null);
    setLinkInput("");
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Título */}
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Conexões com redes sociais
      </h2>

      {/* Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {socialNetworks.map((network) => {
          const config = socialMediaConfig[network.id as keyof typeof socialMediaConfig];
          const IconComponent = config?.icon;

          return (
            <div
              key={network.id}
              className="p-4 sm:p-5 rounded-2xl border border-gray-200/20 dark:border-gray-800/30
                         bg-white/70 dark:bg-gray-900/50 shadow-sm backdrop-blur-sm
                         hover:shadow-md transition-all duration-300 flex items-center justify-between"
            >
              {/* Nome + Status */}
              <div className="flex items-center space-x-3">
                <div
                  className="w-9 h-9 flex items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: config?.color || "#6B7280" }}
                >
                  {IconComponent && <IconComponent size={18} />}
                </div>
                <div>
                  <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                    {network.name}
                  </p>
                  <p
                    className={`text-xs sm:text-sm ${
                      network.connected ? "text-green-500" : "text-gray-400"
                    }`}
                  >
                    {network.connected ? "Conectado" : "Não conectado"}
                  </p>
                </div>
              </div>

              {/* Botão */}
              <button
                onClick={() => handleAddSocialNetwork(network)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
              >
                <Plus className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && selectedNetwork && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedNetwork.connected ? "Gerenciar" : "Adicionar"} {selectedNetwork.name}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Cole o link da sua rede social abaixo
            </p>

            <input
              type="url"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              placeholder="https://..."
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 mb-6 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            <div className="flex space-x-3">
              {selectedNetwork.connected && (
                <button
                  onClick={handleDeleteLink}
                  disabled={deleting || loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
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

              <button
                onClick={handleSaveLink}
                disabled={!linkInput.trim() || loading || deleting}
                className={`bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 ${
                  selectedNetwork.connected ? "flex-1" : "w-full"
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
