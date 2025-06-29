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

// Configuração otimizada do cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'rifaqui-web-app'
    }
  }
});

// Teste de conexão melhorado
const testConnection = async () => {
  try {
    console.log('🔌 Testando conexão com Supabase...');
    
    // Teste 1: Verificar se consegue fazer uma query simples
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro na query de teste:', error);
      console.error('❌ Detalhes do erro:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return false;
    }
    
    console.log('✅ Query de teste bem-sucedida:', data);
    
    // Teste 2: Verificar autenticação
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erro ao verificar sessão:', sessionError);
      return false;
    }
    
    console.log('✅ Verificação de sessão bem-sucedida');
    console.log('  - Sessão ativa:', sessionData.session ? 'Sim' : 'Não');
    
    return true;
  } catch (error) {
    console.error('💥 Erro inesperado no teste de conexão:', error);
    return false;
  }
};

// Executar teste de conexão
testConnection().then(success => {
  console.log('🔌 Resultado do teste de conexão:', success ? '✅ Sucesso' : '❌ Falhou');
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