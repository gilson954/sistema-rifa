import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6"
        >
          <CheckCircle className="text-green-600" size={48} />
        </motion.div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Pagamento Confirmado!
        </h1>
        <p className="text-gray-600 mb-8 text-lg">
          Sua participação foi registrada com sucesso.
        </p>

        <Link
          to="/my-tickets"
          className="inline-block bg-green-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-green-700 transition-all"
        >
          Ver Minhas Cotas
        </Link>
      </motion.div>
    </div>
  );
}
