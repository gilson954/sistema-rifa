import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/register');
  };

  return (
    <section className="pt-20 pb-16 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-6 transition-colors duration-300">
              Crie rifas online
              <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent animate-gradient-text">
                {' '}
                do seu jeito
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed transition-colors duration-300">
              Venda bilhetes, automatize pagamentos e sorteios. A plataforma completa para transformar suas rifas em um negócio profissional.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button 
                onClick={handleGetStarted}
                className="bg-purple-600 text-white px-8 py-4 rounded-lg hover:bg-purple-700 transition-all duration-200 font-semibold text-lg flex items-center justify-center group"
              >
                Comece Agora
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform duration-200" size={20} />
              </button>
            </div>
          </div>

          {/* Right Content - Dashboard Mockup */}
          <div className="relative">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 transform rotate-3 hover:rotate-0 transition-all duration-300">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-white font-semibold">Rifa do iPhone 15</div>
                  <div className="bg-white/20 text-white px-2 py-1 rounded text-sm">Ativa</div>
                </div>
                <div className="text-white/90 text-sm mb-2">R$ 50.00 por bilhete</div>
                <div className="bg-white/20 rounded p-2">
                  <div className="text-white text-xs mb-1">Progresso</div>
                  <div className="bg-white/30 rounded-full h-2 mb-1">
                    <div className="bg-white rounded-full h-2 w-3/4"></div>
                  </div>
                  <div className="text-white text-xs">750/1000 bilhetes vendidos</div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 text-center transition-colors duration-300">
                  <div className="text-2xl font-bold text-purple-600">R$ 37.5k</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Arrecadado</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 text-center transition-colors duration-300">
                  <div className="text-2xl font-bold text-blue-600">750</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Vendidos</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 text-center transition-colors duration-300">
                  <div className="text-2xl font-bold text-green-600">250</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Restam</div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-green-500 dark:bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium animate-bounce transition-colors duration-300">
              +R$ 500 agora!
            </div>
            <div className="absolute -bottom-4 -left-4 bg-blue-500 dark:bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium transition-colors duration-300">
              Pix automático
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
