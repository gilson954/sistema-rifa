import { motion } from 'framer-motion';
import { Ticket, Clock, Trophy } from 'lucide-react';

export default function CampaignPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Trophy className="text-white" size={80} />
          </div>

          <div className="p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Campanha de Exemplo
            </h1>
            <p className="text-gray-600 mb-8">
              Esta é uma página de exemplo para visualização de campanhas públicas.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Ticket className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tickets Disponíveis</p>
                  <p className="text-xl font-bold text-gray-900">0</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Clock className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tempo Restante</p>
                  <p className="text-xl font-bold text-gray-900">--</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Trophy className="text-purple-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Prêmio</p>
                  <p className="text-xl font-bold text-gray-900">--</p>
                </div>
              </div>
            </div>

            <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-medium text-lg hover:bg-blue-700 transition-all">
              Participar da Campanha
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
