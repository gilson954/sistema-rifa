import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Palette, 
  TrendingUp, 
  ArrowUpDown, 
  Gift, 
  CreditCard, 
  Globe, 
  Tag,
  DollarSign
} from 'lucide-react';
import { motion } from 'framer-motion';

const Features = () => {
  const navigate = useNavigate();

  const handleCreateCampaign = () => {
    navigate('/register');
  };

  const features = [
    {
      icon: Users,
      title: 'Afiliados',
      description: 'Adicione afiliados para ajudar a vender suas rifas e aumentar seu alcance com facilidade.'
    },
    {
      icon: Palette,
      title: 'Aparência Personalizada',
      description: 'Personalize suas campanhas com logotipo, imagem do prêmio, cores e muito mais.'
    },
    {
      icon: TrendingUp,
      title: 'Maiores Compradores',
      description: 'Veja quem são os participantes que mais compram bilhetes em sua rifa, com visualização por tempo ou diária.'
    },
    {
      icon: ArrowUpDown,
      title: 'Maior / Menor Bilhete',
      description: 'Ofereça prêmios extras para quem comprar o bilhete com o maior ou menor número.'
    },
    {
      icon: Gift,
      title: 'Bilhetes Premiados',
      description: 'Marque bilhetes como premiados e acompanhe o status dos ganhadores em tempo real.'
    },
    {
      icon: CreditCard,
      title: 'Pagamentos Automáticos',
      description: 'Receba por Pix, cartão de crédito e mais de 10 métodos de pagamento, tudo automatizado.'
    },
    {
      icon: Globe,
      title: 'Domínio Próprio',
      description: 'Use seu próprio domínio para deixar suas campanhas mais profissionais e confiáveis.'
    },
    {
      icon: Tag,
      title: 'Promoções, Cupons e Upsell',
      description: 'Crie cupons de desconto, promoções relâmpago e ofertas complementares para alavancar suas vendas.'
    }
  ];

  return (
    <section id="funcionalidades" className="py-20 bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              Funcionalidades
            </span>
          </motion.h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto transition-colors duration-300">
            Conheça o que o nosso sistema de rifas pode fazer por você
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div 
                key={index} 
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 hover:shadow-xl dark:hover:shadow-none transition-all duration-300 group cursor-pointer"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="mb-4">
                  <motion.div
                    className="w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-xl flex items-center justify-center"
                    whileHover={{ scale: 1.2 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    <IconComponent className="text-purple-600 dark:text-purple-400" size={24} />
                  </motion.div>
                </div>
                
                <motion.h3
                  className="text-lg font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 1 }}
                >
                  {feature.title}
                </motion.h3>
                
                <motion.p
                  className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed transition-colors duration-300"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 1 }}
                >
                  {feature.description}
                </motion.p>
              </motion.div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg">
              <DollarSign className="text-white" size={40} />
            </div>
            
            <h3 className="text-2xl font-bold mb-4 text-white">
              O dinheiro vai direto pra você
            </h3>
            <p className="text-purple-100 dark:text-purple-200 mb-6 max-w-2xl mx-auto transition-colors duration-300">
              Tudo o que você arrecadar com sua rifa cai direto na sua conta — sem intermediários e sem complicação.
            </p>
            <button 
              onClick={handleCreateCampaign}
              className="bg-white text-purple-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 font-semibold"
            >
              Criar minha campanha
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
