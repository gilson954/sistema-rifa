import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Ticket, TrendingUp, Shield, Zap } from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: Ticket,
      title: 'Gestão Completa',
      description: 'Crie e gerencie suas rifas e campanhas de forma simples'
    },
    {
      icon: TrendingUp,
      title: 'Análise de Dados',
      description: 'Acompanhe suas vendas e performance em tempo real'
    },
    {
      icon: Shield,
      title: 'Segurança',
      description: 'Plataforma segura com autenticação e proteção de dados'
    },
    {
      icon: Zap,
      title: 'Rápido e Fácil',
      description: 'Configure suas campanhas em poucos minutos'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Rifa System</h1>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Entrar
            </Link>
            <Link
              to="/register"
              className="bg-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-700 transition-all"
            >
              Começar Grátis
            </Link>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            A melhor plataforma para
            <br />
            <span className="text-blue-600">suas rifas e campanhas</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Gerencie rifas, sorteios e campanhas de forma profissional.
            Tudo em um só lugar, simples e eficiente.
          </p>
          <Link
            to="/register"
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            Criar Conta Grátis
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="text-blue-600" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
