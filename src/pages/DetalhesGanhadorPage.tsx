import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, User, Phone, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DetalhesGanhadorPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Detalhes do Ganhador</h1>
          <p className="text-gray-600 mt-1">Informações completas do vencedor</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
      >
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
            <Trophy className="text-yellow-600" size={40} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Ganhador</h2>
            <p className="text-gray-600">Prêmio: --</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <User className="text-gray-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">Nome</p>
              <p className="font-medium text-gray-900">--</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <Phone className="text-gray-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">Telefone</p>
              <p className="font-medium text-gray-900">--</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <Ticket className="text-gray-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">Número da Cota</p>
              <p className="font-medium text-gray-900">--</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
