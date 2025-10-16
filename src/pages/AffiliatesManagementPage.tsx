import { motion } from 'framer-motion';
import { ArrowLeft, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AffiliatesManagementPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard/affiliations')}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Afiliados</h1>
          <p className="text-gray-600 mt-1">Configure comissões e links</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
      >
        <div className="flex flex-col items-center justify-center py-12">
          <Users className="text-gray-400 mb-4" size={64} />
          <p className="text-gray-500 text-lg">Nenhum afiliado cadastrado</p>
        </div>
      </motion.div>
    </div>
  );
}
