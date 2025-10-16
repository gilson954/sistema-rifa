import React from 'react';
import { Crown, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useStripe } from '../hooks/useStripe';
import { formatPrice } from '../stripe-config';

interface SubscriptionStatusProps {
  className?: string;
  showDetails?: boolean;
}

const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({ 
  className = '', 
  showDetails = true 
}) => {
  const { subscriptions, loading, getActiveSubscription, getSubscriptionProduct } = useStripe();

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
        <span className="text-sm text-gray-600 dark:text-gray-400">Carregando...</span>
      </div>
    );
  }

  const activeSubscription = getActiveSubscription();
  const product = activeSubscription ? getSubscriptionProduct(activeSubscription) : null;

  if (!activeSubscription) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'trialing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'past_due':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'canceled':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'trialing':
        return 'Período de Teste';
      case 'past_due':
        return 'Pagamento Pendente';
      case 'canceled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 dark:text-green-400';
      case 'trialing':
        return 'text-blue-600 dark:text-blue-400';
      case 'past_due':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'canceled':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {getStatusIcon(activeSubscription.status)}
        <span className={`text-sm font-medium ${getStatusColor(activeSubscription.status)}`}>
          {product?.name || 'Plano Ativo'}
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700/50 rounded-lg p-4 ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
          <Crown className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {product?.name || 'Plano Ativo'}
            </h3>
            {getStatusIcon(activeSubscription.status)}
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <span className={getStatusColor(activeSubscription.status)}>
              {getStatusText(activeSubscription.status)}
            </span>
            {product && (
              <span className="text-gray-600 dark:text-gray-400">
                {formatPrice(product.price, product.currency)}
              </span>
            )}
          </div>
          {activeSubscription.current_period_end && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Renovação: {new Date(activeSubscription.current_period_end).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionStatus;