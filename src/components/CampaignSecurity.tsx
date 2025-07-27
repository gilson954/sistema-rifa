import React from 'react';
import { Shield, Lock, Eye, CheckCircle } from 'lucide-react';

interface CampaignSecurityProps {
  organizerName: string;
  drawMethod: string;
  isVerified?: boolean;
}

const CampaignSecurity: React.FC<CampaignSecurityProps> = ({
  organizerName,
  drawMethod,
  isVerified = true
}) => {
  const securityFeatures = [
    {
      icon: Shield,
      title: 'Organizador Verificado',
      description: `${organizerName} é um organizador verificado pela plataforma`,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      icon: Lock,
      title: 'Sorteio Transparente',
      description: `Sorteio realizado via ${drawMethod} para garantir transparência`,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      icon: Eye,
      title: 'Processo Público',
      description: 'Todo o processo de sorteio é público e auditável',
      color: 'text-purple-600 dark:text-purple-400'
    },
    {
      icon: CheckCircle,
      title: 'Pagamento Seguro',
      description: 'Pagamentos processados com segurança via PIX',
      color: 'text-orange-600 dark:text-orange-400'
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 transition-colors duration-300">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
        🔒 Segurança e Transparência
      </h2>
      
      <div className="space-y-4">
        {securityFeatures.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-700`}>
                <IconComponent className={`h-5 w-5 ${feature.color}`} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust Badge */}
      <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <div className="flex items-center justify-center space-x-2">
          <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
          <span className="text-green-800 dark:text-green-200 font-medium text-sm">
            Campanha Verificada e Segura
          </span>
        </div>
      </div>
    </div>
  );
};

export default CampaignSecurity;