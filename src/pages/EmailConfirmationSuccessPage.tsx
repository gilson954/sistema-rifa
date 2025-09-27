// src/pages/EmailConfirmationSuccessPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import AuthHeader from '../components/AuthHeader';

const EmailConfirmationSuccessPage = () => {
  return (
    <>
      <AuthHeader backTo="login" />

      {/* Animated Gradient Background (same pattern as LoginPage) */}
      <div className="relative min-h-screen flex items-center justify-center p-6 pt-20 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="w-full h-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 dark:from-gray-900 dark:via-purple-900 dark:to-black animate-gradient" />
        </div>

        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <img
              src="/logo-chatgpt.png"
              alt="Rifaqui Logo"
              className="w-24 h-24 mx-auto mb-4 drop-shadow-xl"
            />
          </div>

          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-gray-200/50 dark:border-gray-800/50">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
              Sua conta foi confirmada!
            </h1>

            <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
              Parabéns — seu e-mail foi verificado com sucesso. Agora você pode fazer login e começar a criar e gerenciar suas rifas no Rifaqui.
            </p>

            <Link
              to="/login"
              className="inline-block w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-95 text-white py-3 rounded-lg font-semibold transition-shadow duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-purple-500/30"
            >
              <span>Ir para Login</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default EmailConfirmationSuccessPage;
