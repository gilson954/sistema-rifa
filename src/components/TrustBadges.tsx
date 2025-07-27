import React from 'react';
import { Shield, Lock, Award, CheckCircle, Users, Star } from 'lucide-react';

const TrustBadges: React.FC = () => {
  const badges = [
    {
      icon: Shield,
      title: 'Segurança Garantida',
      description: 'Plataforma 100% segura e confiável',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    },
    {
      icon: Lock,
      title: 'Dados Protegidos',
      description: 'Suas informações estão protegidas',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      icon: Award,
      title: 'Sorteios Transparentes',
      description: 'Todos os sorteios são auditáveis',
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30'
    },
    {
      icon: CheckCircle,
      title: 'Pagamentos Seguros',
      description: 'Transações protegidas e verificadas',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30'
    }
  ];

  const testimonials = [
    {
      name: 'Maria Silva',
      text: 'Ganhei um iPhone 15! Plataforma confiável e pagamento rápido.',
      rating: 5,
      avatar: 'MS'
    },
    {
      name: 'João Santos',
      text: 'Excelente experiência. Sorteio transparente e prêmio entregue.',
      rating: 5,
      avatar: 'JS'
    },
    {
      name: 'Ana Costa',
      text: 'Recomendo! Já participei de várias rifas aqui.',
      rating: 5,
      avatar: 'AC'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Trust Badges */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          🛡️ Por que confiar na Rifaqui?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {badges.map((badge, index) => {
            const IconComponent = badge.icon;
            return (
              <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200">
                <div className={`w-10 h-10 ${badge.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <IconComponent className={`h-5 w-5 ${badge.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {badge.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {badge.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Statistics */}
        <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">50K+</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Participantes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">1.2K+</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Ganhadores</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">99.9%</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Satisfação</div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          💬 O que nossos ganhadores dizem
        </h2>
        
        <div className="space-y-4">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {testimonial.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {testimonial.name}
                    </h4>
                    <div className="flex space-x-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-3 w-3 text-yellow-500 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    "{testimonial.text}"
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrustBadges;