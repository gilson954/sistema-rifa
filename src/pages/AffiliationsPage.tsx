import { motion } from 'framer-motion';
import { Users, Link as LinkIcon, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AffiliationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Programa de Afiliados</h1>
        <p className="text-gray-600 mt-1">Compartilhe e ganhe comissões</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
            <LinkIcon className="text-blue-600" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Links de Afiliado
          </h3>
          <p className="text-gray-600 mb-4">
            Gere links personalizados para suas campanhas
          </p>
          <Link
            to="/dashboard/affiliations/manage"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Gerenciar →
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
        >
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
            <Users className="text-green-600" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Meus Afiliados
          </h3>
          <p className="text-gray-600 mb-4">
            Veja quem está promovendo suas campanhas
          </p>
          <Link
            to="/dashboard/affiliations/area"
            className="text-green-600 hover:text-green-700 font-medium"
          >
            Ver área →
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
            <TrendingUp className="text-purple-600" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Comissões
          </h3>
          <p className="text-gray-600 mb-4">
            Acompanhe seus ganhos com afiliados
          </p>
          <span className="text-2xl font-bold text-gray-900">R$ 0,00</span>
        </motion.div>
      </div>
    </div>
  );
}
