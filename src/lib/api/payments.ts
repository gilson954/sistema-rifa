import { supabase } from '../supabase';

export interface StripePayment {
  id: string;
  campaign_id: string;
  stripe_payment_intent_id: string;
  payment_method: 'pix' | 'card';
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  qr_code_data?: string;
  qr_code_image_url?: string;
  client_secret?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface CreateStripePaymentRequest {
  campaign_id: string;
  amount: number;
  payment_method_type: 'pix' | 'card';
}

export interface StripeCheckoutResponse {
  success: boolean;
  client_secret?: string;
  qr_code_data?: string;
  qr_code_image_url?: string;
  payment_id: string;
  error?: string;
}

export interface PaymentIntegrationConfig {
  mercado_pago?: {
    client_id: string;
    client_secret: string;
    access_token?: string;
    webhook_url: string;
    configured_at: string;
  };
  fluxsis?: {
    api_key: string;
    secret_key: string;
    webhook_url: string;
    configured_at: string;
  };
  pay2m?: {
    api_key: string;
    secret_key: string;
    webhook_url: string;
    configured_at: string;
  };
  paggue?: {
    api_key: string;
    secret_key: string;
    webhook_url: string;
    configured_at: string;
  };
  efi_bank?: {
    client_id: string;
    client_secret: string;
    webhook_url: string;
    configured_at: string;
  };
  // Future integrations can be added here
  // pay2m?: { ... };
  // paggue?: { ... };
}

export interface CreatePaymentRequest {
  campaign_id: string;
  quota_numbers: number[];
  user_id: string;
  payer_email: string;
  payment_method: 'pix' | 'credit_card';
  total_amount: number;
}

export interface PaymentResponse {
  payment_id: string;
  status: 'pending' | 'approved' | 'rejected';
  payment_url?: string;
  qr_code?: string;
  qr_code_base64?: string;
  external_reference: string;
}

export class PaymentsAPI {
  /**
   * Create Stripe checkout for publication fee
   */
  static async createStripeCheckout(
    request: CreateStripePaymentRequest
  ): Promise<{ data: StripeCheckoutResponse | null; error: any }> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      const result = await response.json();

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
   * Get payment status by campaign ID
   */
  static async getPaymentByCampaign(campaignId: string): Promise<{ data: StripePayment | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error fetching payment:', error);
      return { data: null, error };
    }
  }

  /**
   * Get user's payment integration configuration
   */
  static async getPaymentConfig(userId: string): Promise<{ data: PaymentIntegrationConfig | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('payment_integrations_config')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        return { data: null, error };
      }

      return { data: data?.payment_integrations_config || {}, error: null };
    } catch (error) {
      console.error('Error fetching payment config:', error);
      return { data: null, error };
    }
  }

  /**
   * Update user's payment integration configuration
   */
  static async updatePaymentConfig(
    userId: string, 
    config: PaymentIntegrationConfig
  ): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ payment_integrations_config: config })
        .eq('id', userId);

      return { error };
    } catch (error) {
      console.error('Error updating payment config:', error);
      return { error };
    }
  }

  /**
   * Create a payment with Mercado Pago
   * Note: This would typically call Mercado Pago's API
   */
  static async createMercadoPagoPayment(
    request: CreatePaymentRequest
  ): Promise<{ data: PaymentResponse | null; error: any }> {
    try {
      // Generate external reference for tracking
      const externalReference = `campaign_${request.campaign_id}_tickets_${request.quota_numbers.join(',')}`;

      // In production, this would make an API call to Mercado Pago
      // For now, we'll return a mock response
      const mockResponse: PaymentResponse = {
        payment_id: `mp_${Date.now()}`,
        status: 'pending',
        payment_url: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=mock_preference_id',
        qr_code: 'mock_qr_code_data',
        external_reference: externalReference
      };

      return { data: mockResponse, error: null };
    } catch (error) {
      console.error('Error creating Mercado Pago payment:', error);
      return { data: null, error };
    }
  }

  /**
   * Check if user has any payment integration configured
   */
  static async hasPaymentIntegration(userId: string): Promise<boolean> {
    try {
      const { data } = await this.getPaymentConfig(userId);
      
      if (!data) return false;

      // Check if any payment method is configured
      return !!(
        data.mercado_pago?.client_id || 
        data.mercado_pago?.access_token ||
        data.fluxsis?.api_key ||
        data.pay2m?.api_key ||
        data.paggue?.api_key ||
        data.efi_bank?.client_id
        // Add other payment methods here as they are implemented
      );
    } catch (error) {
      console.error('Error checking payment integration:', error);
      return false;
    }
  }

  /**
   * Create a payment with Fluxsis
   * Note: This would typically call Fluxsis's API
   */
  static async createFluxsisPayment(
    request: CreatePaymentRequest
  ): Promise<{ data: PaymentResponse | null; error: any }> {
    try {
      // Generate external reference for tracking
      const externalReference = `campaign_${request.campaign_id}_tickets_${request.quota_numbers.join(',')}`;

      // In production, this would make an API call to Fluxsis
      // For now, we'll return a mock response
      const mockResponse: PaymentResponse = {
        payment_id: `flx_${Date.now()}`,
        status: 'pending',
        payment_url: 'https://checkout.fluxsis.com.br/payment/mock_payment_id',
        qr_code: 'mock_qr_code_data_fluxsis',
        external_reference: externalReference
      };

      return { data: mockResponse, error: null };
    } catch (error) {
      console.error('Error creating Fluxsis payment:', error);
      return { data: null, error };
    }
  }

  /**
   * Create a payment with Pay2m
   * Note: This would typically call Pay2m's API
   */
  static async createPay2mPayment(
    request: CreatePaymentRequest
  ): Promise<{ data: PaymentResponse | null; error: any }> {
    try {
      // Generate external reference for tracking
      const externalReference = `campaign_${request.campaign_id}_tickets_${request.quota_numbers.join(',')}`;

      // In production, this would make an API call to Pay2m
      // For now, we'll return a mock response
      const mockResponse: PaymentResponse = {
        payment_id: `p2m_${Date.now()}`,
        status: 'pending',
        payment_url: 'https://checkout.pay2m.com.br/payment/mock_payment_id',
        qr_code: 'mock_qr_code_data_pay2m',
        external_reference: externalReference
      };

      return { data: mockResponse, error: null };
    } catch (error) {
      console.error('Error creating Pay2m payment:', error);
      return { data: null, error };
    }
  }

  /**
   * Create a payment with Paggue
   * Note: This would typically call Paggue's API
   */
  static async createPagguePayment(
    request: CreatePaymentRequest
  ): Promise<{ data: PaymentResponse | null; error: any }> {
    try {
      // Generate external reference for tracking
      const externalReference = `campaign_${request.campaign_id}_tickets_${request.quota_numbers.join(',')}`;

      // In production, this would make an API call to Paggue
      // For now, we'll return a mock response
      const mockResponse: PaymentResponse = {
        payment_id: `pag_${Date.now()}`,
        status: 'pending',
        payment_url: 'https://checkout.paggue.io/payment/mock_payment_id',
        qr_code: 'mock_qr_code_data_paggue',
        external_reference: externalReference
      };

      return { data: mockResponse, error: null };
    } catch (error) {
      console.error('Error creating Paggue payment:', error);
      return { data: null, error };
    }
  }

  /**
   * Create a payment with Efi Bank
   * Note: This would typically call Efi Bank's API
   */
  static async createEfiBankPayment(
    request: CreatePaymentRequest
  ): Promise<{ data: PaymentResponse | null; error: any }> {
    try {
      // Generate external reference for tracking
      const externalReference = `campaign_${request.campaign_id}_tickets_${request.quota_numbers.join(',')}`;

      // In production, this would make an API call to Efi Bank
      // For now, we'll return a mock response
      const mockResponse: PaymentResponse = {
        payment_id: `efi_${Date.now()}`,
        status: 'pending',
        payment_url: 'https://checkout.efibank.com.br/payment/mock_payment_id',
        qr_code: 'mock_qr_code_data_efi',
        external_reference: externalReference
      };

      return { data: mockResponse, error: null };
    } catch (error) {
      console.error('Error creating Efi Bank payment:', error);
      return { data: null, error };
    }
  }
}