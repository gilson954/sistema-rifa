// src/pages/EmailConfirmationSuccessPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import AuthHeader from '../components/AuthHeader';

const EmailConfirmationSuccessPage = () => {
  return (
    <>
      <AuthHeader backTo="login" />
      <div className="min-h-screen bg-animated-gradient dark:bg-animated-gradient-dark animate-gradient flex items-center justify-center p-4 pt-20">
        <div className="max-w-md w-full text-center">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gray-200/50 dark:border-gray-800/50">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Sua conta foi confirmada!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Parabéns! Seu e-mail foi verificado com sucesso. Agora você pode fazer login para começar a criar e gerenciar suas rifas no Rifaqui.
            </p>

            <Link
              to="/login"
              className="inline-block w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
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
