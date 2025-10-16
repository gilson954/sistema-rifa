import { motion } from 'framer-motion';
import { Users, Ticket, DollarSign, TrendingUp } from 'lucide-react';

export default function AdminDashboardPage() {
  const stats = [
    { label: 'Total de Usuários', value: '0', icon: Users, color: 'blue' },
    { label: 'Campanhas Ativas', value: '0', icon: Ticket, color: 'green' },
    { label: 'Receita Total', value: 'R$ 0,00', icon: DollarSign, color: 'purple' },
    { label: 'Taxa de Conversão', value: '0%', icon: TrendingUp, color: 'orange' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Visão geral da plataforma</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <div className={`w-12 h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`text-${stat.color}-600`} size={24} />
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-gray-600">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Atividade Recente
          </h2>
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhuma atividade recente</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
