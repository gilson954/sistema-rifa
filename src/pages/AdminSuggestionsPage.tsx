import { motion } from 'framer-motion';
import { MessageSquare, Filter } from 'lucide-react';

export default function AdminSuggestionsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Sugestões dos Usuários</h1>
            <p className="text-gray-600 mt-2">Gerencie feedback e ideias</p>
          </div>
          <button className="flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 transition-all">
            <Filter size={20} />
            Filtrar
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
        >
          <div className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="text-gray-400 mb-4" size={64} />
            <p className="text-gray-500 text-lg">Nenhuma sugestão enviada ainda</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
