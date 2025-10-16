import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

export default function EmailConfirmationSuccessPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/dashboard');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6"
        >
          <CheckCircle className="text-green-600" size={48} />
        </motion.div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          E-mail Confirmado!
        </h1>
        <p className="text-gray-600 mb-8">
          Sua conta foi verificada com sucesso.
          <br />
          Redirecionando para o dashboard...
        </p>

        <div className="flex gap-2 justify-center">
          <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce delay-100" />
          <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce delay-200" />
        </div>
      </motion.div>
    </div>
  );
}
