import { motion } from 'framer-motion';
import { CheckCircle, Upload } from 'lucide-react';

export default function PaymentConfirmationPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Confirmação de Pagamento
            </h1>
            <p className="text-gray-600">
              Envie o comprovante para confirmar sua participação
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comprovante de Pagamento
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                <Upload className="mx-auto text-gray-400 mb-2" size={40} />
                <p className="text-gray-600">Clique ou arraste o arquivo aqui</p>
                <p className="text-sm text-gray-400 mt-1">PNG, JPG ou PDF até 5MB</p>
              </div>
            </div>

            <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-all">
              Enviar Comprovante
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
