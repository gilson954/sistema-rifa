import React from 'react';
import { UserPlus, Settings, Zap } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: UserPlus,
      title: "Crie sua conta",
      description: "Cadastre-se gratuitamente e acesse o painel de controle completo para gerenciar suas rifas."
    },
    {
      icon: Settings,
      title: "Configure sua rifa",
      description: "Defina prêmios, valores, quantidade de bilhetes e personalize sua campanha do seu jeito."
    },
    {
      icon: Zap,
      title: "Publique e venda",
      description: "Ative sua rifa e comece a vender bilhetes com pagamentos automáticos via Pix."
    }
  ];

  return (
    <section id="como-funciona" className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 transition-colors duration-300">
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Como Funciona
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto transition-colors duration-300">
            Em apenas 3 passos simples, você cria e publica sua rifa profissional
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div
                key={index}
                className="text-center group hover:transform hover:scale-105 transition-all duration-300"
              >
                <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg transition-shadow duration-300">
                  <IconComponent className="h-10 w-10 text-white" />
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 h-full transition-colors duration-300">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-sm">{index + 1}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-300">
                    {step.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed transition-colors duration-300">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8 transition-colors duration-300">
            <h3 className="text-2xl font-bold mb-4 transition-colors duration-300">
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Pronto para começar?
              </span>
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto transition-colors duration-300">
              Junte-se a milhares de pessoas que já estão criando rifas profissionais e aumentando sua renda.
            </p>
            <button className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors duration-200 font-semibold">
              Criar Minha Primeira Rifa
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;