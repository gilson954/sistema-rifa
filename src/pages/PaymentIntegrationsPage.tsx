import { motion } from 'framer-motion';
import { CreditCard, DollarSign } from 'lucide-react';

export default function PaymentIntegrationsPage() {
  const integrations = [
    { name: 'Stripe', icon: CreditCard, connected: false },
    { name: 'Mercado Pago', icon: DollarSign, connected: false },
    { name: 'PagSeguro', icon: CreditCard, connected: false },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Integrações de Pagamento</h1>
        <p className="text-gray-600 mt-1">Configure os métodos de pagamento</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration, index) => {
          const Icon = integration.icon;
          return (
            <motion.div
              key={integration.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Icon className="text-blue-600" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {integration.name}
                </h3>
              </div>
              <button
                className={`w-full py-3 rounded-xl font-medium transition-all ${
                  integration.connected
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {integration.connected ? 'Conectado' : 'Conectar'}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
