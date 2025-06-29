import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Supabase Config Check:');
console.log('  - URL:', supabaseUrl ? '✅ Definida' : '❌ Não definida');
console.log('  - Anon Key:', supabaseAnonKey ? '✅ Definida' : '❌ Não definida');
console.log('  - URL Value:', supabaseUrl);
console.log('  - Key Value (primeiros 20 chars):', supabaseAnonKey?.substring(0, 20) + '...');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERRO CRÍTICO: Variáveis de ambiente do Supabase não encontradas!');
  console.error('Verifique se as seguintes variáveis estão definidas no arquivo .env:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- VITE_SUPABASE_ANON_KEY');
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

// Teste de conexão
supabase.auth.getSession().then(({ data, error }) => {
  console.log('🔌 Teste de conexão Supabase:');
  console.log('  - Conectado:', error ? '❌ Erro' : '✅ Sucesso');
  if (error) {
    console.error('  - Erro:', error);
  } else {
    console.log('  - Sessão atual:', data.session ? 'Existe' : 'Nenhuma');
  }
});

// Tipos TypeScript para o banco de dados
export interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}