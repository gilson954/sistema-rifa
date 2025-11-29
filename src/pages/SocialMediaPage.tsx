import React, { useState, useEffect } from "react";
import { Plus, X, ArrowRight, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
 
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { supabase } from "../lib/supabase";
import { socialMediaConfig } from "../components/SocialMediaIcons";

interface SocialNetwork {
  id: string;
  name: string;
  connected: boolean;
  url?: string;
}

const SocialMediaPage = () => {
  
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
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
        showError("Erro ao carregar dados. Tente novamente.");
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
        showError("Erro ao salvar link. Tente novamente.");
        return;
      }

      setSocialNetworks((prev) =>
        prev.map((network) =>
          network.id === selectedNetwork.id
            ? { ...network, connected: !!linkInput.trim(), url: linkInput.trim() || undefined }
            : network
        )
      );

      showSuccess(`Link do ${selectedNetwork.name} salvo com sucesso!`);
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
        showError("Erro ao excluir link. Tente novamente.");
        return;
      }

      setSocialNetworks((prev) =>
        prev.map((network) =>
          network.id === selectedNetwork.id
            ? { ...network, connected: false, url: undefined }
            : network
        )
      );

      showSuccess(`Link do ${selectedNetwork.name} removido com sucesso!`);
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

  // Variantes de animação para os cards
  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.05,
        duration: 0.4,
        ease: "easeOut"
      }
    }),
    hover: {
      scale: 1.03,
      y: -4,
      transition: { duration: 0.2, ease: "easeInOut" }
    },
    tap: { scale: 0.98 }
  };

  // Variantes para o modal
  const modalOverlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.2 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  const modalContentVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.9,
      y: 20
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: { 
        duration: 0.3,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0,
      scale: 0.9,
      y: 20,
      transition: { 
        duration: 0.2,
        ease: "easeIn"
      }
    }
  };

  // Variantes para o título
  const titleVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  // Variantes para os botões
  const buttonVariants = {
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95 }
  };

  return (
    <div className="bg-transparent min-h-screen">
      <style>
        {`
          @media (max-width: 640px) {
            ::-webkit-scrollbar {
              width: 8px;
            }
            ::-webkit-scrollbar-track {
              background: linear-gradient(to bottom, rgba(139, 92, 246, 0.05), rgba(219, 39, 119, 0.05));
              border-radius: 10px;
            }
            ::-webkit-scrollbar-thumb {
              background: linear-gradient(to bottom, #a855f7, #ec4899, #3b82f6);
              border-radius: 10px;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(to bottom, #c084fc, #f472b6);
            }
            ::-webkit-scrollbar-thumb:active {
              background: linear-gradient(to bottom, #7c3aed, #db2777);
            }
          }
          
          @media (min-width: 641px) {
            ::-webkit-scrollbar {
              width: 12px;
            }
            ::-webkit-scrollbar-track {
              background: linear-gradient(to bottom, rgba(139, 92, 246, 0.05), rgba(219, 39, 119, 0.05));
              border-radius: 10px;
            }
            ::-webkit-scrollbar-thumb {
              background: linear-gradient(to bottom, #a855f7, #ec4899, #3b82f6);
              border-radius: 10px;
              box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
            }
            ::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(to bottom, #c084fc, #f472b6);
              box-shadow: 0 0 15px rgba(192, 132, 252, 0.6);
            }
          }
        `}
      </style>
      <div className="p-3 sm:p-6">
        <motion.h2 
          className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6"
          variants={titleVariants}
          initial="hidden"
          animate="visible"
        >
          Conexões com redes sociais
        </motion.h2>

        <div className="grid gap-3 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {socialNetworks.map((network, index) => {
            const config = socialMediaConfig[network.id as keyof typeof socialMediaConfig];
            const IconComponent = config?.icon;

            return (
              <motion.div
                key={network.id}
                custom={index}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                whileTap="tap"
                className="p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-gray-200/20 dark:border-gray-800/30
                           bg-white/70 dark:bg-gray-900/50 shadow-sm backdrop-blur-sm
                           transition-shadow duration-300 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <motion.div
                    className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-white flex-shrink-0"
                    style={{ backgroundColor: config?.color || "#6B7280" }}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    {IconComponent && <IconComponent size={16} className="sm:w-[18px] sm:h-[18px]" />}
                  </motion.div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-base font-medium text-gray-900 dark:text-white truncate">
                      {network.name}
                    </p>
                    <motion.p
                      className={`text-xs sm:text-sm ${
                        network.connected ? "text-green-500" : "text-gray-400"
                      }`}
                      animate={{ 
                        opacity: network.connected ? [0.7, 1, 0.7] : 1 
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: network.connected ? Infinity : 0 
                      }}
                    >
                      {network.connected ? "Conectado" : "Não conectado"}
                    </motion.p>
                  </div>
                </div>

                <motion.button
                  onClick={() => handleAddSocialNetwork(network)}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 flex-shrink-0"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" />
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {showModal && selectedNetwork && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4"
            variants={modalOverlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleCloseModal}
          >
            <motion.div 
              className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-md shadow-lg"
              variants={modalContentVariants}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <motion.h2 
                  className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {selectedNetwork.connected ? "Gerenciar" : "Adicionar"} {selectedNetwork.name}
                </motion.h2>
                <motion.button
                  onClick={handleCloseModal}
                  className="p-1 sm:p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors duration-200"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                </motion.button>
              </div>

              <motion.p 
                className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                Cole o link da sua rede social abaixo
              </motion.p>

              <motion.input
                type="url"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="https://..."
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 mb-4 sm:mb-6 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileFocus={{ scale: 1.02 }}
              />

              <motion.div 
                className="flex gap-2 sm:gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                {selectedNetwork.connected && (
                  <motion.button
                    onClick={handleDeleteLink}
                    disabled={deleting || loading}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors duration-200 flex items-center justify-center gap-1.5 sm:gap-2"
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {deleting ? (
                      <motion.div 
                        className="animate-spin rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 border-b-2 border-white"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    ) : (
                      <>
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span>Excluir</span>
                      </>
                    )}
                  </motion.button>
                )}

                <motion.button
                  onClick={handleSaveLink}
                  disabled={!linkInput.trim() || loading || deleting}
                  className={`bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors duration-200 flex items-center justify-center gap-1.5 sm:gap-2 ${
                    selectedNetwork.connected ? "flex-1" : "w-full"
                  }`}
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: selectedNetwork.connected ? 0.3 : 0.25 }}
                >
                  {loading ? (
                    <motion.div 
                      className="animate-spin rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 border-b-2 border-white"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (
                    <>
                      <span>Salvar</span>
                      <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </>
                  )}
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SocialMediaPage;
