import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { TicketsAPI } from '../lib/api/tickets'

interface PhoneUser {
  id: string
  phone: string
  name: string
  email: string
  isPhoneAuth: boolean
}

interface AuthContextType {
  user: User | null
  session: Session | null
  isAdmin: boolean | null
  loading: boolean
  phoneUser: PhoneUser | null
  isPhoneAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signInWithGoogle: () => Promise<{ error: any }>
  signUp: (email: string, password: string, name: string, redirectTo?: string) => Promise<{ error: any }>
  signInWithPhone: (phone: string, userData?: { name: string; email: string }) => Promise<{ success: boolean; error?: any; user?: PhoneUser }>
  signOut: () => Promise<void>
  updateProfile: (data: { name?: string; avatar_url?: string }) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [phoneUser, setPhoneUser] = useState<PhoneUser | null>(null)
  const [isPhoneAuthenticated, setIsPhoneAuthenticated] = useState(false)

  // Function to check admin status from user metadata
  const checkAdminStatus = (user: User | null) => {
    if (!user) {
      setIsAdmin(null)
      return
    }

    // Check if user has admin flag in metadata
    const adminStatus = user.user_metadata?.is_admin === true || user.user_metadata?.is_admin === 'true'
    setIsAdmin(adminStatus)
  }

  useEffect(() => {
    // Check for phone auth session in localStorage
    const checkPhoneAuth = () => {
      try {
        const phoneAuthData = localStorage.getItem('rifaqui_phone_auth')
        if (phoneAuthData) {
          const parsed = JSON.parse(phoneAuthData)
          const expiresAt = new Date(parsed.expiresAt)
          if (expiresAt > new Date()) {
            setPhoneUser(parsed.user)
            setIsPhoneAuthenticated(true)
          } else {
            localStorage.removeItem('rifaqui_phone_auth')
          }
        }
      } catch (error) {
        console.error('Error checking phone auth:', error)
        localStorage.removeItem('rifaqui_phone_auth')
      }
    }

    checkPhoneAuth()

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      checkAdminStatus(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      checkAdminStatus(session?.user ?? null)
      setLoading(false)

      // Handle password recovery flow
      if (event === 'SIGNED_IN' && session?.user) {
        // Check if this is a password recovery session
        const urlParams = new URLSearchParams(window.location.hash.substring(1))
        const isRecovery = urlParams.get('type') === 'recovery' ||
                          window.location.pathname === '/reset-password'

        if (isRecovery) {
          // Don't redirect to dashboard for password recovery
          return
        }
      }

      // Limpa o histórico de rotas quando o usuário faz logout
      if (event === 'SIGNED_OUT') {
        try {
          localStorage.removeItem('rifaqui_last_route')
          localStorage.removeItem('rifaqui_route_timestamp')
          localStorage.removeItem('rifaqui_phone_auth')
          setPhoneUser(null)
          setIsPhoneAuthenticated(false)
        } catch (error) {
          console.warn('Failed to clear route history on logout:', error)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: {
          prompt: 'select_account',
        },
      },
    })
    return { error }
  }

  const signUp = async (email: string, password: string, name: string, redirectTo?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
        ...(redirectTo ? { emailRedirectTo: redirectTo } : {}),
      },
    })

    if (!error && data.user) {
      // Create or update profile using upsert to handle existing profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          name,
          email,
        }, {
          onConflict: 'id'
        })

      if (profileError) {
        console.error('Error creating profile:', profileError)
      }
    }

    return { error }
  }

  /**
   * Faz login com número de telefone
   * 
   * ✅ CORREÇÃO CRÍTICA APLICADA:
   * - O phone SEMPRE chega JÁ NORMALIZADO dos componentes (ReservationStep1Modal/ReservationModal)
   * - NÃO normaliza novamente para evitar duplicação (+5555)
   * - Apenas usa o número exatamente como recebido
   * 
   * @param phone - Número de telefone JÁ NORMALIZADO (formato: +5562999999999)
   * @param userData - Dados opcionais do usuário (nome e email) se já conhecidos
   */
  const signInWithPhone = async (phone: string, userData?: { name: string; email: string }) => {
    try {
      // ✅ CORREÇÃO: NÃO normaliza - usa o phone exatamente como recebido
      console.log('🔵 AuthContext.signInWithPhone - Input phone:', phone);
      console.log('🟢 AuthContext.signInWithPhone - Has userData:', !!userData);
      console.log('🟡 AuthContext.signInWithPhone - Using phone AS-IS (no normalization):', phone);

      // Se os dados do usuário foram fornecidos (após reserva), usa eles diretamente
      if (userData) {
        const phoneUserData: PhoneUser = {
          id: `phone_${phone.replace(/\D/g, '')}`,
          phone: phone, // ✅ Usa exatamente como recebido
          name: userData.name,
          email: userData.email,
          isPhoneAuth: true
        }

        // Sessão permanente (365 dias)
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 365)

        const authData = {
          user: phoneUserData,
          expiresAt: expiresAt.toISOString()
        }

        localStorage.setItem('rifaqui_phone_auth', JSON.stringify(authData))

        setPhoneUser(phoneUserData)
        setIsPhoneAuthenticated(true)

        console.log('✅ AuthContext - Phone user created:', phoneUserData);

        return { success: true, user: phoneUserData }
      }

      // Busca tickets do cliente usando TicketsAPI (caso de login direto)
      // ✅ phone já vem normalizado, não precisa normalizar novamente
      const { data: tickets, error } = await TicketsAPI.getTicketsByPhoneNumber(phone)

      if (error) {
        console.error('❌ Error fetching tickets by phone:', error)
        return { success: false, error: 'Erro ao buscar dados do cliente' }
      }

      if (!tickets || tickets.length === 0) {
        return { success: false, error: 'Nenhuma cota encontrada com este número de telefone' }
      }

      // Extrai dados do primeiro ticket encontrado
      const firstTicket = tickets[0]

      const phoneUserData: PhoneUser = {
        id: `phone_${phone.replace(/\D/g, '')}`,
        phone: phone,
        name: firstTicket.customer_name ?? '',
        email: firstTicket.customer_email ?? '',
        isPhoneAuth: true
      }

      // Sessão permanente (365 dias)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 365)

      const authData = {
        user: phoneUserData,
        expiresAt: expiresAt.toISOString()
      }

      localStorage.setItem('rifaqui_phone_auth', JSON.stringify(authData))

      setPhoneUser(phoneUserData)
      setIsPhoneAuthenticated(true)

      console.log('✅ AuthContext - Phone user created from tickets:', phoneUserData);

      return { success: true, user: phoneUserData }
    } catch (error) {
      console.error('❌ Error in signInWithPhone:', error)
      return { success: false, error: 'Erro inesperado ao fazer login' }
    }
  }

  const signOut = async () => {
    try {
      // Only attempt to sign out if there's a valid session
      if (session) {
        const { error } = await supabase.auth.signOut()

        if (error) {
          // Check if the error is specifically about session not found or missing
          if (error.message === 'Session from session_id claim in JWT does not exist' ||
              error.message === 'Auth session missing!') {
            console.warn('Session already expired or invalid - proceeding with local logout')
          } else {
            // Log other types of logout errors
            console.error('Logout error:', error)
          }
        }
      }
    } catch (error) {
      // Handle any unexpected errors during logout
      console.warn('Unexpected logout error (handled gracefully):', error)
    } finally {
      // Always clear local state regardless of logout success/failure
      setUser(null)
      setSession(null)
      setIsAdmin(null)
      setPhoneUser(null)
      setIsPhoneAuthenticated(false)

      // Limpa o histórico de rotas no logout
      try {
        localStorage.removeItem('rifaqui_last_route')
        localStorage.removeItem('rifaqui_route_timestamp')
        localStorage.removeItem('rifaqui_phone_auth')
      } catch (error) {
        console.warn('Failed to clear route history on logout:', error)
      }
    }
  }

  useEffect(() => {
    const handler = (e: any) => {
      const reason = e?.reason
      const message = typeof reason === 'string' ? reason : (reason?.message || '')
      if (message && message.includes('Invalid Refresh Token')) {
        e?.preventDefault?.()
        signOut()
      }
    }
    window.addEventListener('unhandledrejection', handler)
    return () => window.removeEventListener('unhandledrejection', handler)
  }, [signOut])

  const updateProfile = async (data: { name?: string; avatar_url?: string }) => {
    if (!user) return { error: new Error('No user logged in') }

    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id)

    return { error }
  }

  const value = {
    user,
    session,
    isAdmin,
    loading,
    phoneUser,
    isPhoneAuthenticated,
    signIn,
    signInWithGoogle,
    signUp,
    signInWithPhone,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export type { PhoneUser }
