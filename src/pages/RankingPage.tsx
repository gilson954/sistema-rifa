import { motion } from 'framer-motion';
import { Trophy, Medal, Award } from 'lucide-react';

export default function RankingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ranking</h1>
        <p className="text-gray-600 mt-1">Top vendedores e afiliados</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
      >
        <div className="flex flex-col items-center justify-center py-12">
          <div className="flex gap-4 mb-6">
            <Trophy className="text-yellow-500" size={40} />
            <Medal className="text-gray-400" size={40} />
            <Award className="text-orange-500" size={40} />
          </div>
          <p className="text-gray-500 text-lg">Ranking em breve</p>
          <p className="text-gray-400 text-sm mt-2">
            Complete suas primeiras vendas para aparecer no ranking
          </p>
        </div>
      </motion.div>
    </div>
  );
}
