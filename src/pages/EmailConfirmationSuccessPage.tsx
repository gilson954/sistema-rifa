// src/pages/EmailConfirmationSuccessPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import AuthHeader from '../components/AuthHeader';

const EmailConfirmationSuccessPage = () => {
  // Variantes para animações
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <>
      <AuthHeader backTo="login" />

      {/* Fundo com gradiente animado */}
      <div className="relative min-h-screen flex items-center justify-center p-6 pt-20 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="w-full h-full bg-animated-gradient" />
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="max-w-md w-full"
        >
          <div className="text-center mb-8">
            <motion.img
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              src="/logo-chatgpt.png"
              alt="Rifaqui Logo"
              className="w-24 h-24 mx-auto mb-4 drop-shadow-xl"
            />
          </div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-gray-200/50 dark:border-gray-800/50 text-center"
          >
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Sua conta foi confirmada!
            </h1>

            <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
              Parabéns — seu e-mail foi verificado com sucesso. Agora você pode fazer login e começar a criar e gerenciar suas rifas no Rifaqui.
            </p>

            <Link
              to="/login"
              className="w-full animate-gradient-button text-white py-3 rounded-lg font-semibold transition-shadow duration-200 flex items-center justify-center space-x-2 shadow-lg"
            >
              <span>Ir para Login</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};

export default EmailConfirmationSuccessPage;
