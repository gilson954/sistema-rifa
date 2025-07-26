import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          avatar_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          name: string
          email: string
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      campaigns: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          prize_image_url: string | null
          ticket_price: number
          total_tickets: number
          sold_tickets: number
          start_date: string
          end_date: string
          status: 'draft' | 'active' | 'completed' | 'cancelled'
          winner_ticket_number: number | null
          winner_user_id: string | null
          created_at: string | null
          updated_at: string | null
          expires_at: string | null
          prize_image_urls: string[] | null
          promotions: any[] | null
          prizes: any[] | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          prize_image_url?: string | null
          ticket_price: number
          total_tickets: number
          sold_tickets?: number
          start_date: string
          end_date: string
          status?: 'draft' | 'active' | 'completed' | 'cancelled'
          winner_ticket_number?: number | null
          winner_user_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          expires_at?: string | null
          prize_image_urls?: string[] | null
          promotions?: any[] | null
          prizes?: any[] | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          prize_image_url?: string | null
          ticket_price?: number
          total_tickets?: number
          sold_tickets?: number
          start_date?: string
          end_date?: string
          status?: 'draft' | 'active' | 'completed' | 'cancelled'
          winner_ticket_number?: number | null
          winner_user_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          expires_at?: string | null
          prize_image_urls?: string[] | null
          promotions?: any[] | null
          prizes?: any[] | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}