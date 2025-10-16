import { motion } from 'framer-motion';
import { Ticket } from 'lucide-react';

export default function MyTicketsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Minhas Cotas</h1>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex flex-col items-center justify-center py-12">
              <Ticket className="text-gray-400 mb-4" size={64} />
              <p className="text-gray-500 text-lg">Você ainda não possui cotas</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
