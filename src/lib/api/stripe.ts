import { supabase } from '../supabase';
import { STRIPE_PRODUCTS, getProductByPriceId } from '../../stripe-config';

interface StripeCheckoutRequest {
  priceId: string;
  campaignId?: string;
  successUrl?: string;
  cancelUrl?: string;
}

interface StripeCheckoutResponse {
  success: boolean;
  checkout_url?: string;
  session_id?: string;
  error?: string;
}

interface StripeCustomer {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface StripeSubscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: string;
  price_id: string;
  quantity: number;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

export interface StripeOrder {
  id: string;
  user_id: string;
  stripe_session_id: string;
  stripe_customer_id: string;
  status: string;
  amount_total: number;
  currency: string;
  payment_status: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export class StripeAPI {
  /**
   * Create Stripe checkout session
   */
  static async createCheckoutSession(
    request: StripeCheckoutRequest
  ): Promise<{ data: StripeCheckoutResponse | null; error: any }> {
    try {
      const product = getProductByPriceId(request.priceId);
      if (!product) {
        throw new Error('Product not found');
      }

      console.log('🛒 Creating Stripe checkout session:', {
        priceId: request.priceId,
        campaignId: request.campaignId,
        productName: product.name
      });
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: request.priceId,
          campaignId: request.campaignId,
          successUrl: request.successUrl || `${window.location.origin}/payment-success`,
          cancelUrl: request.cancelUrl || `${window.location.origin}/payment-cancelled`
        })
      });

      const result = await response.json();

      console.log('📨 Stripe checkout response:', {
        success: result.success,
        hasCheckoutUrl: !!result.checkout_url,
        sessionId: result.session_id
      });
      if (!response.ok) {
        throw new Error(result.error || 'Checkout creation failed');
      }

      return { data: result, error: null };
    } catch (error) {
      console.error('Error creating Stripe checkout:', error);
      return { data: null, error };
    }
  }

  /**
   * Get user's Stripe customer record
   */
  static async getStripeCustomer(userId: string): Promise<{ data: StripeCustomer | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('stripe_customers')
        .select('*')
        .eq('user_id', userId)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error fetching Stripe customer:', error);
      return { data: null, error };
    }
  }

  /**
   * Get user's active subscriptions
   */
  static async getUserSubscriptions(userId: string): Promise<{ data: StripeSubscription[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('stripe_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      console.error('Error fetching user subscriptions:', error);
      return { data: null, error };
    }
  }

  /**
   * Get user's orders
   */
  static async getUserOrders(userId: string): Promise<{ data: StripeOrder[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('stripe_orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      console.error('Error fetching user orders:', error);
      return { data: null, error };
    }
  }

  /**
   * Get order by session ID
   */
  static async getOrderBySessionId(sessionId: string): Promise<{ data: StripeOrder | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('stripe_orders')
        .select('*')
        .eq('stripe_session_id', sessionId)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error fetching order by session ID:', error);
      return { data: null, error };
    }
  }
}