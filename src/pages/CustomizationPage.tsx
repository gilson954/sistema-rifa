import { motion } from 'framer-motion';
import { Palette, Image } from 'lucide-react';

export default function CustomizationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Personalização</h1>
        <p className="text-gray-600 mt-1">Customize a aparência das suas campanhas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Palette className="text-blue-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">Cores</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cor Primária
              </label>
              <div className="flex gap-3">
                <input
                  type="color"
                  defaultValue="#3B82F6"
                  className="w-16 h-12 rounded-xl border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  defaultValue="#3B82F6"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cor Secundária
              </label>
              <div className="flex gap-3">
                <input
                  type="color"
                  defaultValue="#10B981"
                  className="w-16 h-12 rounded-xl border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  defaultValue="#10B981"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Image className="text-purple-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">Logo</h2>
          </div>

          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              <Image className="mx-auto text-gray-400 mb-2" size={40} />
              <p className="text-gray-600 mb-2">Adicione seu logo</p>
              <input type="file" accept="image/*" className="hidden" id="logo-upload" />
              <label
                htmlFor="logo-upload"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-700 transition-all cursor-pointer"
              >
                Selecionar Arquivo
              </label>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex justify-end">
        <button className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition-all">
          Salvar Personalizações
        </button>
      </div>
    </div>
  );
}
