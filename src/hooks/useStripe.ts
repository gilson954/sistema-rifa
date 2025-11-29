import { useState, useEffect, useCallback } from 'react';
import { StripeAPI, StripeSubscription, StripeOrder } from '../lib/api/stripe';
import { useAuth } from '../hooks/useAuth';
import { STRIPE_PRODUCTS, getProductByPriceId } from '../stripe-config';

export const useStripe = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<StripeSubscription[]>([]);
  const [orders, setOrders] = useState<StripeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [subscriptionsResult, ordersResult] = await Promise.all([
        StripeAPI.getUserSubscriptions(user.id),
        StripeAPI.getUserOrders(user.id)
      ]);

      if (subscriptionsResult.error) {
        console.error('Error fetching subscriptions:', subscriptionsResult.error);
      } else {
        setSubscriptions(subscriptionsResult.data || []);
      }

      if (ordersResult.error) {
        console.error('Error fetching orders:', ordersResult.error);
      } else {
        setOrders(ordersResult.data || []);
      }
    } catch (error) {
      console.error('Error fetching Stripe data:', error);
      setError('Erro ao carregar dados de pagamento');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const createCheckout = async (priceId: string, campaignId?: string) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const product = getProductByPriceId(priceId);
    if (!product) {
      throw new Error('Produto não encontrado');
    }

    const { data, error } = await StripeAPI.createCheckoutSession({
      priceId,
      campaignId,
      successUrl: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/payment-cancelled`
    });

    if (error) {
      throw error;
    }

    if (data?.checkout_url) {
      window.location.href = data.checkout_url;
    }

    return data;
  };

  const getActiveSubscription = () => {
    return subscriptions.find(sub => sub.status === 'active');
  };

  const getSubscriptionProduct = (subscription: StripeSubscription) => {
    return getProductByPriceId(subscription.price_id);
  };

  const hasActiveSubscription = () => {
    return subscriptions.some(sub => sub.status === 'active');
  };

  const getCompletedOrders = () => {
    return orders.filter(order => order.payment_status === 'paid');
  };

  return {
    subscriptions,
    orders,
    loading,
    error,
    createCheckout,
    getActiveSubscription,
    getSubscriptionProduct,
    hasActiveSubscription,
    getCompletedOrders,
    refetch: fetchUserData,
    products: STRIPE_PRODUCTS
  };
};
