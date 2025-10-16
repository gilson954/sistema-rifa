import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowLeft } from 'lucide-react';

export default function CreateCampaignStep3Page() {
  const navigate = useNavigate();

  const handleFinish = () => {
    navigate('/dashboard');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Nova Campanha - Passo 3
        </h1>
        <p className="text-gray-600 mb-8">Configure tickets e preços</p>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantidade Total de Tickets
              </label>
              <input
                type="number"
                min="1"
                placeholder="Ex: 1000"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preço por Ticket
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Ex: 10.00"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tickets Mínimos por Compra
            </label>
            <input
              type="number"
              min="1"
              defaultValue="1"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tickets Máximos por Compra
            </label>
            <input
              type="number"
              min="1"
              defaultValue="10"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex justify-between pt-6">
            <button
              onClick={() => navigate('/dashboard/create-campaign/step-2')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              <ArrowLeft size={20} />
              Voltar
            </button>
            <button
              onClick={handleFinish}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition-all"
            >
              <Check size={20} />
              Finalizar Campanha
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
