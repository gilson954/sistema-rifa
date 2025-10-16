import { motion } from 'framer-motion';
import { ArrowLeft, Users, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SalesHistoryPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Histórico de Vendas</h1>
            <p className="text-gray-600 mt-1">Participantes e pagamentos</p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-all">
          <Download size={20} />
          Exportar
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
      >
        <div className="flex items-center justify-center gap-3 py-12">
          <Users className="text-gray-400" size={48} />
          <p className="text-gray-500 text-lg">Nenhum participante ainda</p>
        </div>
      </motion.div>
    </div>
  );
}
