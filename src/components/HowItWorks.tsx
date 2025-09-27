// src/pages/HowItWorks.tsx
import React from 'react';
import { UserPlus, Settings, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';

const HowItWorks = () => {
  const steps = [
    {
      number: 1,
      icon: UserPlus,
      title: 'Crie sua conta',
      subtitle: 'Cadastre-se gratuitamente',
      description: 'Basta seu nome, e-mail e senha para começar. Leva menos de 1 minuto e não exige aprovação.'
    },
    {
      number: 2,
      icon: Settings,
      title: 'Monte sua campanha',
      subtitle: 'Configure do seu jeito',
      description: 'Escolha o prêmio, defina os bilhetes, valores, formas de pagamento e personalize o visual da sua página.'
    },
    {
      number: 3,
      icon: Share2,
      title: 'Publique e comece a vender',
      subtitle: 'Compartilhe e receba',
      description: 'Publique sua campanha com uma pequena taxa, compartilhe o link e comece a vender — os pagamentos vão direto para sua conta.'
    }
  ];

  // Variantes para animações
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section id="como-funciona" className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-300 animated-gradient"
          >
            Como Funciona
          </motion.h2>
          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto transition-colors duration-300"
          >
            Entenda em 3 passos simples como começar a vender suas rifas com nossa plataforma
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <motion.div
                key={index}
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.2 }}
                className="relative bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 hover:bg-white dark:hover:bg-gray-800 hover:shadow-xl transition-all duration-300"
              >
                {/* Step Number - Animação de Gradiente */}
                <div className="absolute -top-4 left-8">
                  <motion.div
                    className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
                    animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  >
                    {step.number}
                  </motion.div>
                </div>

                {/* Icon - versão antiga */}
                <div className="mt-8 mb-6">
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center transition-colors duration-300">
                    <IconComponent className="text-purple-600 dark:text-purple-400" size={32} />
                  </div>
                </div>

                {/* Content */}
                <motion.h3
                  initial="hidden"
                  animate="visible"
                  variants={fadeInUp}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300"
                >
                  {step.title}
                </motion.h3>
                <motion.p
                  initial="hidden"
                  animate="visible"
                  variants={fadeInUp}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="text-purple-600 dark:text-purple-400 font-semibold mb-4 transition-colors duration-300"
                >
                  {step.subtitle}
                </motion.p>
                <motion.p
                  initial="hidden"
                  animate="visible"
                  variants={fadeInUp}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="text-gray-600 dark:text-gray-300 leading-relaxed transition-colors duration-300"
                >
                  {step.description}
                </motion.p>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 -right-4 w-8 h-0.5 bg-gradient-to-r from-purple-300 to-blue-300 dark:from-purple-600 dark:to-blue-600"></div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Tips Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-16 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8 transition-colors duration-300"
        >
          <div className="flex items-start">
            <div className="text-2xl mr-4">💡</div>
            <div>
              <motion.h4
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="text-lg font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300 animated-gradient"
              >
                Dica Profissional
              </motion.h4>
              <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
                Use imagens de alta qualidade do seu prêmio e crie uma descrição detalhada para aumentar a confiança dos compradores e melhorar suas vendas.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
