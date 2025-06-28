import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isInitialAuthCheckDone: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isInitialAuthCheckDone, setIsInitialAuthCheckDone] = useState(false);

  // Buscar ou criar perfil do usuário
  const fetchOrCreateProfile = async (user: User) => {
    console.log('AuthContext: Tentando buscar perfil para userId:', user.id);
    try {
      // Primeiro, tentar buscar o perfil existente
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 é o código para "nenhuma linha encontrada", outros erros são problemas reais
        console.error('AuthContext: Erro ao buscar perfil:', fetchError);
        return null;
      }

      if (existingProfile) {
        console.log('AuthContext: Perfil existente encontrado:', existingProfile);
        return existingProfile;
      }

      // Se não encontrou o perfil, criar um novo
      console.log('AuthContext: Perfil não encontrado, criando novo perfil para usuário:', user.id);
      
      const newProfile: Omit<Profile, 'created_at' | 'updated_at'> = {
        id: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
        email: user.email || '',
        avatar_url: user.user_metadata?.avatar_url || null,
      };

      const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select()
        .single();

      if (createError) {
        console.error('AuthContext: Erro ao criar perfil:', createError);
        return null;
      }

      console.log('AuthContext: Novo perfil criado com sucesso:', createdProfile);
      return createdProfile;
    } catch (error) {
      console.error('AuthContext: Erro inesperado ao buscar/criar perfil:', error);
      return null;
    }
  };

  // Verificar sessão atual e configurar listener
  useEffect(() => {
    console.log('AuthContext: Iniciando useEffect de autenticação...');
    
    // Verificar sessão atual
    const getSession = async () => {
      console.log('AuthContext: Iniciando verificação de sessão inicial...');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthContext: Erro ao obter sessão:', error);
          // Se há erro ao obter sessão (como refresh token inválido), limpar sessão local
          console.log('AuthContext: Limpando sessão local devido ao erro');
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setProfile(null);
        } else {
          console.log('AuthContext: Sessão obtida:', session);
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            console.log('AuthContext: Sessão inicial encontrada, buscando/criando perfil...');
            const userProfile = await fetchOrCreateProfile(session.user);
            setProfile(userProfile);
            console.log('AuthContext: Perfil carregado/criado:', userProfile);
          } else {
            console.log('AuthContext: Nenhuma sessão inicial encontrada.');
          }
        }
      } catch (error) {
        console.error('AuthContext: Erro inesperado ao obter sessão:', error);
        // Em caso de erro inesperado, também limpar a sessão
        console.log('AuthContext: Limpando sessão local devido ao erro inesperado');
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        setIsInitialAuthCheckDone(true);
        console.log('AuthContext: Verificação de autenticação inicial concluída.');
      }
    };

    getSession();

    // Listener para mudanças de autenticação
    console.log('AuthContext: Configurando listener de mudanças de autenticação...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Mudança de estado de autenticação detectada:', event, session);
        
        // Se a sessão se tornou null mas o evento não é SIGNED_OUT, pode ser um token inválido
        if (!session && event !== 'SIGNED_OUT') {
          console.log('AuthContext: Sessão perdida sem logout explícito, limpando dados locais');
          await supabase.auth.signOut();
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('AuthContext: Usuário autenticado, buscando/criando perfil...');
          const userProfile = await fetchOrCreateProfile(session.user);
          setProfile(userProfile);
          console.log('AuthContext: Perfil carregado/criado após mudança de estado:', userProfile);
        } else {
          console.log('AuthContext: Usuário desautenticado.');
          setProfile(null);
        }
        
        setIsInitialAuthCheckDone(true);
        console.log('AuthContext: onAuthStateChange concluído, isInitialAuthCheckDone = true.');
      }
    );

    return () => {
      console.log('AuthContext: Limpando subscription...');
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    console.log('AuthContext: Iniciando login para:', email);
    try {
      setIsAuthLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('AuthContext: Erro no login:', error);
        return { success: false, error: getErrorMessage(error) };
      }

      console.log('AuthContext: Login bem-sucedido:', data);
      return { success: true };
    } catch (error) {
      console.error('AuthContext: Erro inesperado no login:', error);
      return { success: false, error: 'Erro inesperado ao fazer login' };
    } finally {
      setIsAuthLoading(false);
      console.log('AuthContext: Login finalizado.');
    }
  };

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    console.log('AuthContext: Iniciando registro para:', email, 'com nome:', name);
    try {
      setIsAuthLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      });

      if (error) {
        console.error('AuthContext: Erro no registro:', error);
        return { success: false, error: getErrorMessage(error) };
      }

      console.log('AuthContext: Registro realizado:', data);

      // Se o usuário foi criado mas precisa confirmar email
      if (data.user && !data.session) {
        console.log('AuthContext: Usuário criado mas precisa confirmar email');
        return { 
          success: false, 
          error: 'Verifique seu email para confirmar a conta antes de fazer login' 
        };
      }

      console.log('AuthContext: Registro bem-sucedido com sessão ativa');
      return { success: true };
    } catch (error) {
      console.error('AuthContext: Erro inesperado no registro:', error);
      return { success: false, error: 'Erro inesperado ao criar conta' };
    } finally {
      setIsAuthLoading(false);
      console.log('AuthContext: Registro finalizado.');
    }
  };

  const logout = async (): Promise<void> => {
    console.log('AuthContext: Iniciando logout...');
    try {
      setIsAuthLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('AuthContext: Erro no logout:', error);
      } else {
        console.log('AuthContext: Logout bem-sucedido');
      }
    } catch (error) {
      console.error('AuthContext: Erro inesperado no logout:', error);
    } finally {
      setIsAuthLoading(false);
      console.log('AuthContext: Logout finalizado.');
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    console.log('AuthContext: Iniciando reset de senha para:', email);
    try {
      setIsAuthLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('AuthContext: Erro no reset de senha:', error);
        return { success: false, error: getErrorMessage(error) };
      }

      console.log('AuthContext: Reset de senha enviado com sucesso');
      return { success: true };
    } catch (error) {
      console.error('AuthContext: Erro inesperado no reset de senha:', error);
      return { success: false, error: 'Erro inesperado ao enviar email de recuperação' };
    } finally {
      setIsAuthLoading(false);
      console.log('AuthContext: Reset de senha finalizado.');
    }
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<{ success: boolean; error?: string }> => {
    console.log('AuthContext: Iniciando atualização de perfil:', updates);
    try {
      setIsAuthLoading(true);
      if (!user) {
        console.error('AuthContext: Tentativa de atualizar perfil sem usuário autenticado');
        return { success: false, error: 'Usuário não autenticado' };
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        console.error('AuthContext: Erro ao atualizar perfil:', error);
        return { success: false, error: 'Erro ao atualizar perfil' };
      }

      // Atualizar estado local
      if (profile) {
        const updatedProfile = { ...profile, ...updates };
        setProfile(updatedProfile);
        console.log('AuthContext: Perfil atualizado localmente:', updatedProfile);
      }

      console.log('AuthContext: Perfil atualizado com sucesso');
      return { success: true };
    } catch (error) {
      console.error('AuthContext: Erro inesperado ao atualizar perfil:', error);
      return { success: false, error: 'Erro inesperado ao atualizar perfil' };
    } finally {
      setIsAuthLoading(false);
      console.log('AuthContext: Atualização de perfil finalizada.');
    }
  };

  // Função para converter erros do Supabase em mensagens amigáveis
  const getErrorMessage = (error: AuthError): string => {
    console.log('AuthContext: Convertendo erro:', error.message);
    switch (error.message) {
      case 'Invalid login credentials':
        return 'Email ou senha incorretos';
      case 'Email not confirmed':
        return 'Email não confirmado. Verifique sua caixa de entrada';
      case 'User already registered':
        return 'Este email já está cadastrado';
      case 'Password should be at least 6 characters':
        return 'A senha deve ter pelo menos 6 caracteres';
      case 'Unable to validate email address: invalid format':
        return 'Formato de email inválido';
      case 'Signup is disabled':
        return 'Cadastro temporariamente desabilitado';
      default:
        return error.message || 'Erro desconhecido';
    }
  };

  const value = {
    user,
    profile,
    session,
    isAuthenticated: !!user,
    isAuthLoading,
    isInitialAuthCheckDone,
    login,
    register,
    logout,
    resetPassword,
    updateProfile,
  };

  console.log('AuthContext: Estado atual:', {
    user: !!user,
    profile: !!profile,
    session: !!session,
    isAuthenticated: !!user,
    isAuthLoading,
    isInitialAuthCheckDone
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};