import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Home, Receipt, Loader2, Calendar, CreditCard, DollarSign, Sparkles } from 'lucide-react';
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="rounded-2xl p-8 border transition-all duration-200 bg-white/60 dark:bg-gray-900/40 border-gray-200/20 dark:border-gray-700/20 shadow-xl text-center max-w-md">
          <Loader2 className="h-16 w-16 text-purple-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Processando Pagamento
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Aguarde enquanto confirmamos sua transação
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
        <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200/20 dark:border-gray-800/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center h-16">
              <div className="flex items-center gap-2">
                <img 
                  src="/logo-chatgpt.png" 
                  alt="Rifaqui Logo" 
                  className="w-8 h-8 object-contain"
                />
                <span className="text-xl font-bold text-gray-900 dark:text-white">Rifaqui</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">
          <div className="rounded-2xl p-8 border transition-all duration-200 bg-white/60 dark:bg-gray-900/40 border-gray-200/20 dark:border-gray-700/20 shadow-xl text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Receipt className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Erro ao Carregar Pagamento
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error}
            </p>
            <button
              onClick={handleGoHome}
              className="animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-purple-600 via-blue-500 to-indigo-600 hover:shadow-lg text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 inline-flex items-center gap-2"
            >
              <Home className="h-5 w-5" />
              <span>Voltar ao Início</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const product = getProductInfo();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200/20 dark:border-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={handleGoHome}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Home className="h-5 w-5" />
              <span className="hidden sm:inline">Página Inicial</span>
            </button>
            
            <div className="flex items-center gap-2">
              <img 
                src="/logo-chatgpt.png" 
                alt="Rifaqui Logo" 
                className="w-10 h-10 object-contain"
              />
              <span className="text-xl font-bold text-gray-900 dark:text-white">Rifaqui</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        {/* Success Banner */}
        <div className="mb-8 rounded-2xl p-8 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 border border-green-200/50 dark:border-green-800/30 text-center shadow-xl">
          <div className="inline-flex w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full items-center justify-center mx-auto mb-6 shadow-2xl">
            <CheckCircle className="h-12 w-12 text-white" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Pagamento Confirmado!
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            Seu pagamento foi processado com sucesso. Obrigado pela sua compra!
          </p>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-full px-4 py-2">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-green-800 dark:text-green-200">
              Transação concluída
            </span>
          </div>
        </div>

        {/* Payment Details Card */}
        {order && (
          <div className="rounded-2xl p-6 border transition-all duration-200 bg-white/60 dark:bg-gray-900/40 border-gray-200/20 dark:border-gray-700/20 shadow-lg mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-purple-600" />
              Detalhes do Pagamento
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Produto</div>
                  <div className="font-medium text-gray-900 dark:text-white truncate">
                    {product?.name || 'Rifaqui'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Valor Pago</div>
                  <div className="font-semibold text-gray-900 dark:text-white text-lg">
                    {formatPrice(order.amount_total / 100, order.currency)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Status</div>
                  <div className="font-medium text-green-600 dark:text-green-400">
                    Pagamento Aprovado
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Data</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {new Date(order.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Next Steps Card */}
        <div className="rounded-2xl p-6 border transition-all duration-200 bg-white/60 dark:bg-gray-900/40 border-gray-200/20 dark:border-gray-700/20 shadow-lg mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-600" />
            Próximos Passos
          </h2>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-800/30 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-800 dark:text-green-200 mb-1">
                  {campaign?.is_paid && campaign?.status === 'active' 
                    ? 'Campanha Ativa!' 
                    : 'Ativação em Andamento'
                  }
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  {campaign?.is_paid && campaign?.status === 'active' 
                    ? 'Sua campanha foi ativada com sucesso! Você já pode começar a receber participantes.'
                    : 'Sua campanha será ativada automaticamente em alguns instantes. Você receberá uma confirmação por email.'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-sm mb-6">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-600 rounded-full mt-1.5 flex-shrink-0"></div>
              <span className="text-gray-600 dark:text-gray-400">
                Acesse seu dashboard para gerenciar a campanha
              </span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-600 rounded-full mt-1.5 flex-shrink-0"></div>
              <span className="text-gray-600 dark:text-gray-400">
                Compartilhe o link da campanha com seus clientes
              </span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-600 rounded-full mt-1.5 flex-shrink-0"></div>
              <span className="text-gray-600 dark:text-gray-400">
                Acompanhe as vendas em tempo real
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleGoToDashboard}
              className="w-full animate-gradient-x bg-[length:200%_200%] bg-gradient-to-r from-purple-600 via-blue-500 to-indigo-600 hover:shadow-xl text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg transform hover:-translate-y-0.5"
            >
              <span>Ir para Dashboard</span>
              <ArrowRight className="h-5 w-5" />
            </button>
            
            <button
              onClick={handleGoHome}
              className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
            >
              <Home className="h-5 w-5" />
              <span>Voltar ao Início</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200/20 dark:border-gray-800/30 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-gray-600 dark:text-gray-400">
            <a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 font-medium">
              Termos de Uso
            </a>
            <span className="hidden sm:block text-gray-400">•</span>
            <a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 font-medium">
              Política de Privacidade
            </a>
            <span className="hidden sm:block text-gray-400">•</span>
            <span className="font-medium">Sistema desenvolvido por Rifaqui</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PaymentSuccessPage;