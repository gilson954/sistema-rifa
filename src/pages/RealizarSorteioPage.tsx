import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RealizarSorteioPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Realizar Sorteio</h1>
          <p className="text-gray-600 mt-1">Selecione os ganhadores da campanha</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
      >
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-6">
            <Sparkles className="text-yellow-600" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Sorteio Automático
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            O sistema selecionará automaticamente os ganhadores entre todos os
            participantes com pagamento confirmado.
          </p>
          <button className="bg-yellow-600 text-white px-8 py-4 rounded-xl font-medium text-lg hover:bg-yellow-700 transition-all">
            Iniciar Sorteio
          </button>
        </div>
      </motion.div>
    </div>
  );
}
