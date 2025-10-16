import { motion } from 'framer-motion';
import { BarChart3, Activity } from 'lucide-react';

export default function PixelsAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pixels & Analytics</h1>
        <p className="text-gray-600 mt-1">Configure ferramentas de rastreamento</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="text-blue-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">
              Google Analytics
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID de Acompanhamento
              </label>
              <input
                type="text"
                placeholder="UA-XXXXXXXXX-X"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-all">
              Conectar Google Analytics
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Activity className="text-purple-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">
              Facebook Pixel
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pixel ID
              </label>
              <input
                type="text"
                placeholder="XXXXXXXXXXXXXXX"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
            <button className="w-full bg-purple-600 text-white py-3 rounded-xl font-medium hover:bg-purple-700 transition-all">
              Conectar Facebook Pixel
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
