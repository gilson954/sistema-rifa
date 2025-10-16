import { motion } from 'framer-motion';
import { MessageSquare, Send } from 'lucide-react';

export default function SuggestionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sugestões</h1>
        <p className="text-gray-600 mt-1">Envie suas ideias e feedback</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="text-blue-600" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">
            Enviar Sugestão
          </h2>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título
            </label>
            <input
              type="text"
              placeholder="Título da sua sugestão"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              rows={6}
              placeholder="Descreva sua sugestão ou feedback em detalhes..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria
            </label>
            <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
              <option>Selecione uma categoria</option>
              <option>Nova Funcionalidade</option>
              <option>Melhoria</option>
              <option>Bug Report</option>
              <option>Outro</option>
            </select>
          </div>

          <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
            <Send size={20} />
            Enviar Sugestão
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Suas Sugestões
        </h2>
        <div className="text-center py-8">
          <p className="text-gray-500">Você ainda não enviou sugestões</p>
        </div>
      </motion.div>
    </div>
  );
}
