import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  isAdmin: boolean | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>
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

  // Function to fetch admin status
  const fetchAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching admin status:', error)
        setIsAdmin(false)
      } else {
        setIsAdmin(data?.is_admin || false)
      }
    } catch (error) {
      console.error('Error fetching admin status:', error)
      setIsAdmin(false)
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        fetchAdminStatus(session.user.id)
      } else {
        setIsAdmin(null)
      }
      
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchAdminStatus(session.user.id)
      } else {
        setIsAdmin(null)
      }
      
      setLoading(false)
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

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
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
          is_admin: false, // Default to false for new users
        }, {
          onConflict: 'id'
        })

      if (profileError) {
        console.error('Error creating profile:', profileError)
      }
    }

    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setIsAdmin(null)
  }

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
    signIn,
    signUp,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}