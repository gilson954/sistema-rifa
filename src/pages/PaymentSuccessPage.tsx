import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Home, Receipt, Loader2 } from 'lucide-react';
import { StripeAPI } from '../lib/api/stripe';
import { getProductByPriceId, formatPrice } from '../stripe-config';
import { useAuth } from '../context/AuthContext';
import { useCampaignWithRefetch } from '../hooks/useCampaigns';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [campaignRefreshed, setCampaignRefreshed] = useState(false);

  const sessionId = searchParams.get('session_id');
  const campaignId = searchParams.get('campaign_id');
  
  // Add campaign refetch hook
  const { campaign, refetch: refetchCampaign } = useCampaignWithRefetch(campaignId || '');

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!sessionId) {
        setError('ID da sessão não encontrado');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await StripeAPI.getOrderBySessionId(sessionId);
        
        if (fetchError) {
          setError('Erro ao carregar detalhes do pedido');
          console.error('Error fetching order:', fetchError);
        } else {
          setOrder(data);
          
          // If we have a campaign ID and haven't refreshed yet, refetch campaign data
          if (campaignId && !campaignRefreshed) {
            console.log('🔄 Refreshing campaign data after payment success...');
            await refetchCampaign();
            setCampaignRefreshed(true);
          }
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
        setError('Erro inesperado ao carregar pedido');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [sessionId, campaignId, refetchCampaign, campaignRefreshed]);

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const getProductInfo = () => {
    if (!order?.metadata?.price_id) return null;
    return getProductByPriceId(order.metadata.price_id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-800 text-center">
          <Loader2 className="h-12 w-12 text-purple-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Carregando detalhes do pagamento...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Aguarde enquanto confirmamos seu pagamento
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-800 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Receipt className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Erro ao carregar pagamento
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <button
            onClick={handleGoHome}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2 mx-auto"
          >
            <Home className="h-5 w-5" />
            <span>Voltar ao Início</span>
          </button>
        </div>
      </div>
    );
  }

  const product = getProductInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-800 text-center max-w-md">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Pagamento Confirmado!
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Seu pagamento foi processado com sucesso. Sua campanha será ativada em breve.
        </p>

        {/* Order Details */}
        {order && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-8 text-left">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Detalhes do Pagamento
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Produto:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {product?.name || 'Rifaqui'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Valor:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatPrice(order.amount_total / 100, order.currency)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  Pago
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Data:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Date(order.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
          <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
            Próximos Passos
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {campaign?.is_paid && campaign?.status === 'active' 
              ? 'Sua campanha foi ativada com sucesso! Você já pode começar a receber participantes.'
              : 'Sua campanha será ativada automaticamente em alguns instantes. Você receberá uma confirmação por email.'
            }
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleGoToDashboard}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <span>Ir para Dashboard</span>
            <ArrowRight className="h-5 w-5" />
          </button>
          
          <button
            onClick={handleGoHome}
            className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <Home className="h-5 w-5" />
            <span>Início</span>
          </button>
        </div>

        {/* Support Link */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Dúvidas sobre seu pagamento?{' '}
            <a href="#" className="text-purple-600 dark:text-purple-400 hover:underline">
              Entre em contato
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;