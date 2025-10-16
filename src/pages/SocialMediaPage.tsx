import { motion } from 'framer-motion';
import { Facebook, Instagram, Twitter, Share2 } from 'lucide-react';

export default function SocialMediaPage() {
  const platforms = [
    { name: 'Facebook', icon: Facebook, color: 'blue' },
    { name: 'Instagram', icon: Instagram, color: 'pink' },
    { name: 'Twitter', icon: Twitter, color: 'sky' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Redes Sociais</h1>
        <p className="text-gray-600 mt-1">Configure suas redes sociais</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {platforms.map((platform, index) => {
          const Icon = platform.icon;
          return (
            <motion.div
              key={platform.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
            >
              <div className={`w-12 h-12 bg-${platform.color}-100 rounded-xl flex items-center justify-center mb-4`}>
                <Icon className={`text-${platform.color}-600`} size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {platform.name}
              </h3>
              <input
                type="text"
                placeholder={`@seu${platform.name.toLowerCase()}`}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <Share2 className="text-green-600" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">
            Botões de Compartilhamento
          </h2>
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded" />
          <span className="text-gray-700">
            Exibir botões de compartilhamento nas campanhas
          </span>
        </label>
      </motion.div>

      <div className="flex justify-end">
        <button className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition-all">
          Salvar Configurações
        </button>
      </div>
    </div>
  );
}
