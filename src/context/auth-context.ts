import { createContext } from 'react';
import type { User, Session } from '@supabase/supabase-js';

export interface PhoneUser {
  id: string;
  phone: string;
  name: string;
  email: string;
  isPhoneAuth: boolean;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean | null;
  loading: boolean;
  phoneUser: PhoneUser | null;
  isPhoneAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: unknown }>;
  signInWithGoogle: () => Promise<{ error: unknown }>;
  signUp: (email: string, password: string, name: string, redirectTo?: string) => Promise<{ error: unknown }>;
  signInWithPhone: (phone: string, userData?: { name: string; email: string }) => Promise<{ success: boolean; error?: unknown; user?: PhoneUser }>;
  signOut: () => Promise<void>;
  updateProfile: (data: { name?: string; avatar_url?: string }) => Promise<{ error: unknown }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
