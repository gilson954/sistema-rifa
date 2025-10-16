import { motion } from 'framer-motion';
import { Plus, TrendingUp, Users, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const stats = [
    { label: 'Campanhas Ativas', value: '0', icon: TrendingUp, color: 'blue' },
    { label: 'Total Participantes', value: '0', icon: Users, color: 'green' },
    { label: 'Receita Total', value: 'R$ 0,00', icon: DollarSign, color: 'purple' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Gerencie suas campanhas e rifas</p>
        </div>
        <Link
          to="/dashboard/create-campaign"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-all"
        >
          <Plus size={20} />
          Nova Campanha
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-${stat.color}-100 rounded-xl`}>
                  <Icon className={`text-${stat.color}-600`} size={24} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-gray-600">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Campanhas Recentes
        </h2>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Nenhuma campanha criada ainda</p>
          <Link
            to="/dashboard/create-campaign"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Criar minha primeira campanha
          </Link>
        </div>
      </div>
    </div>
  );
}
