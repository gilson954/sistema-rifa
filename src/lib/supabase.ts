import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if environment variables are properly set
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not found. Using fallback configuration.')
  console.warn('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file')
}

// Use fallback values if environment variables are not set
const finalUrl = supabaseUrl || 'https://placeholder.supabase.co'
const finalKey = supabaseAnonKey || 'placeholder-key'

export const supabase = createClient(finalUrl, finalKey)

// Log configuration status
if (supabaseUrl && supabaseAnonKey) {
  console.log('Supabase client initialized successfully')
} else {
  console.warn('Supabase client initialized with fallback values - authentication will not work')
}

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
          prize_description: string
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
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          prize_description: string
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
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          prize_description?: string
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