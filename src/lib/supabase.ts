import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      campaigns: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          prize_image_url: string | null
          ticket_price: number
          total_tickets: number
          sold_tickets: number | null
          start_date: string
          end_date: string
          status: string | null
          winner_ticket_number: number | null
          winner_user_id: string | null
          created_at: string | null
          updated_at: string | null
          draw_method: string | null
          phone_number: string | null
          draw_date: string | null
          payment_deadline_hours: number | null
          require_email: boolean | null
          show_ranking: boolean | null
          min_tickets_per_purchase: number | null
          max_tickets_per_purchase: number | null
          initial_filter: string | null
          campaign_model: string | null
          expires_at: string | null
          prize_image_urls: string[] | null
          promotions: any[] | null
          prizes: any | null
          show_percentage: boolean
          public_id: string | null
          reservation_timeout_minutes: number | null
          is_paid: boolean
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          prize_image_url?: string | null
          ticket_price: number
          total_tickets: number
          sold_tickets?: number | null
          start_date: string
          end_date: string
          status?: string | null
          winner_ticket_number?: number | null
          winner_user_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          draw_method?: string | null
          phone_number?: string | null
          draw_date?: string | null
          payment_deadline_hours?: number | null
          require_email?: boolean | null
          show_ranking?: boolean | null
          min_tickets_per_purchase?: number | null
          max_tickets_per_purchase?: number | null
          initial_filter?: string | null
          campaign_model?: string | null
          expires_at?: string | null
          prize_image_urls?: string[] | null
          promotions?: any[] | null
          prizes?: any | null
          show_percentage?: boolean
          public_id?: string | null
          reservation_timeout_minutes?: number | null
          is_paid?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          prize_image_url?: string | null
          ticket_price?: number
          total_tickets?: number
          sold_tickets?: number | null
          start_date?: string
          end_date?: string
          status?: string | null
          winner_ticket_number?: number | null
          winner_user_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          draw_method?: string | null
          phone_number?: string | null
          draw_date?: string | null
          payment_deadline_hours?: number | null
          require_email?: boolean | null
          show_ranking?: boolean | null
          min_tickets_per_purchase?: number | null
          max_tickets_per_purchase?: number | null
          initial_filter?: string | null
          campaign_model?: string | null
          expires_at?: string | null
          prize_image_urls?: string[] | null
          promotions?: any[] | null
          prizes?: any | null
          show_percentage?: boolean
          public_id?: string | null
          reservation_timeout_minutes?: number | null
          is_paid?: boolean
        }
      }
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          avatar_url: string | null
          created_at: string | null
          updated_at: string | null
          is_admin: boolean
          primary_color: string | null
          theme: string | null
          logo_url: string | null
          social_media_links: any | null
          payment_integrations_config: any | null
          cpf: string | null
          phone_number: string | null
        }
        Insert: {
          id: string
          name: string
          email: string
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
          is_admin?: boolean
          primary_color?: string | null
          theme?: string | null
          logo_url?: string | null
          social_media_links?: any | null
          payment_integrations_config?: any | null
          cpf?: string | null
          phone_number?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
          is_admin?: boolean
          primary_color?: string | null
          theme?: string | null
          logo_url?: string | null
          social_media_links?: any | null
          payment_integrations_config?: any | null
          cpf?: string | null
          phone_number?: string | null
        }
      }
      tickets: {
        Row: {
          id: string
          campaign_id: string
          quota_number: number
          user_id: string | null
          status: 'disponível' | 'reservado' | 'comprado'
          reserved_at: string | null
          bought_at: string | null
          created_at: string | null
          updated_at: string | null
          customer_name: string | null
          customer_email: string | null
          customer_phone: string | null
        }
        Insert: {
          id?: string
          campaign_id: string
          quota_number: number
          user_id?: string | null
          status?: 'disponível' | 'reservado' | 'comprado'
          reserved_at?: string | null
          bought_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          customer_name?: string | null
          customer_email?: string | null
          customer_phone?: string | null
        }
        Update: {
          id?: string
          campaign_id?: string
          quota_number?: number
          user_id?: string | null
          status?: 'disponível' | 'reservado' | 'comprado'
          reserved_at?: string | null
          bought_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          customer_name?: string | null
          customer_email?: string | null
          customer_phone?: string | null
        }
      }
      custom_domains: {
        Row: {
          id: string
          domain_name: string
          campaign_id: string | null
          user_id: string
          is_verified: boolean | null
          ssl_status: string | null
          dns_instructions: any | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          domain_name: string
          campaign_id?: string | null
          user_id: string
          is_verified?: boolean | null
          ssl_status?: string | null
          dns_instructions?: any | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          domain_name?: string
          campaign_id?: string | null
          user_id?: string
          is_verified?: boolean | null
          ssl_status?: string | null
          dns_instructions?: any | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      payments: {
        Row: {
          id: string
          campaign_id: string
          stripe_payment_intent_id: string
          payment_method: 'pix' | 'card'
          amount: number
          currency: string
          status: 'pending' | 'succeeded' | 'failed' | 'canceled'
          qr_code_data: string | null
          qr_code_image_url: string | null
          client_secret: string | null
          metadata: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          stripe_payment_intent_id: string
          payment_method: 'pix' | 'card'
          amount: number
          currency?: string
          status?: 'pending' | 'succeeded' | 'failed' | 'canceled'
          qr_code_data?: string | null
          qr_code_image_url?: string | null
          client_secret?: string | null
          metadata?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          stripe_payment_intent_id?: string
          payment_method?: 'pix' | 'card'
          amount?: number
          currency?: string
          status?: 'pending' | 'succeeded' | 'failed' | 'canceled'
          qr_code_data?: string | null
          qr_code_image_url?: string | null
          client_secret?: string | null
          metadata?: any | null
          created_at?: string
          updated_at?: string
        }
      }
      stripe_orders: {
        Row: {
          id: string
          user_id: string
          stripe_session_id: string
          stripe_customer_id: string
          status: string
          amount_total: number
          currency: string
          payment_status: string
          metadata: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_session_id: string
          stripe_customer_id: string
          status: string
          amount_total: number
          currency?: string
          payment_status: string
          metadata?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_session_id?: string
          stripe_customer_id?: string
          status?: string
          amount_total?: number
          currency?: string
          payment_status?: string
          metadata?: any | null
          created_at?: string
          updated_at?: string
        }
      }
      stripe_subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_subscription_id: string
          stripe_customer_id: string
          status: string
          price_id: string
          quantity: number
          current_period_start: string
          current_period_end: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_subscription_id: string
          stripe_customer_id: string
          status: string
          price_id: string
          quantity?: number
          current_period_start: string
          current_period_end: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_subscription_id?: string
          stripe_customer_id?: string
          status?: string
          price_id?: string
          quantity?: number
          current_period_start?: string
          current_period_end?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      reserve_tickets: {
        Args: {
          p_campaign_id: string
          p_quota_numbers: number[]
          p_user_id: string
        }
        Returns: {
          quota_number: number
          status: string
          message: string
        }[]
      }
      finalize_purchase: {
        Args: {
          p_campaign_id: string
          p_quota_numbers: number[]
          p_user_id: string
        }
        Returns: {
          quota_number: number
          status: string
          message: string
        }[]
      }
      release_expired_reservations: {
        Args: {
          p_reservation_timeout_minutes?: number
        }
        Returns: {
          campaign_id: string
          quota_number: number
          old_status: string
          new_status: string
          message: string
        }[]
      }
      get_campaign_tickets_status: {
        Args: {
          p_campaign_id: string
        }
        Returns: {
          quota_number: number
          status: string
          user_id: string | null
          reserved_at: string | null
          bought_at: string | null
        }[]
      }
      get_tickets_by_phone: {
        Args: {
          p_phone_number: string
        }
        Returns: {
          ticket_id: string
          campaign_id: string
          campaign_title: string
          campaign_slug: string | null
          prize_image_urls: string[] | null
          quota_number: number
          status: string
          bought_at: string | null
          customer_name: string | null
          customer_email: string | null
          customer_phone: string | null
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}