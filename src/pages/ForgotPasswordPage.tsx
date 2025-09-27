// src/pages/ForgotPasswordPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AuthHeader from '../components/AuthHeader';
import { translateAuthError } from '../utils/errorTranslators';
import { motion } from 'framer-motion';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (authError) {
        setError(translateAuthError(authError.message));
        setLoading(false);
      } else {
        setSuccess(true);
        setLoading(false);
      }
    } catch (err: any) {
      setError(translateAuthError(err?.message || 'Erro inesperado. Tente novamente.'));
      setLoading(false);
    }
  };

  // Variantes para animações
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (success) {
    return (
      <>
        <AuthHeader backTo="login" />

        <div className="relative min-h-screen flex items-center justify-center p-6 pt-20 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="w-full h-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 dark:from-gray-900 dark:via-purple-900 dark:to-black animate-gradient" />
          </div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="max-w-md w-full"
          >
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-800 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Email Enviado!</h2>

              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Enviamos um link para redefinir sua senha para <strong>{email}</strong>. Verifique sua caixa de entrada e siga as instruções.
              </p>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Não recebeu o email?</strong> Verifique sua pasta de spam ou lixo eletrônico.
                </p>
              </div>

              <Link
                to="/login"
                className="inline-block w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center shadow-lg shadow-purple-500/30"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Voltar para Login
              </Link>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <AuthHeader backTo="login" />

      <div className="relative min-h-screen flex items-center justify-center p-6 pt-20 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="w-full h-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 dark:from-gray-900 dark:via-purple-900 dark:to-black animate-gradient" />
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="max-w-md w-full"
        >
          <div className="text-center mb-10">
            <motion.img
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              src="/logo-chatgpt.png"
              alt="Rifaqui Logo"
              className="w-24 h-24 mx-auto mb-4 drop-shadow-xl"
            />
            <motion.h1
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight"
            >
              Esqueceu sua senha?
            </motion.h1>
            <motion.p
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-gray-700 dark:text-gray-300 text-lg"
            >
              Digite seu email para receber um link de redefinição
            </motion.p>
          </div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-800"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-4 flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center shadow-lg shadow-purple-500/30"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  'Enviar Link de Redefinição'
                )}
              </button>
            </form>

            <div className="mt-8 mb-6 flex items-center">
              <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
              <span className="px-3 text-gray-500 dark:text-gray-400 text-sm">ou</span>
              <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
            </div>

            <div className="mt-4 text-center">
              <Link
                to="/login"
                className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold transition inline-flex items-center space-x-2 justify-center"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar para Login</span>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;