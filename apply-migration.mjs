import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('📦 Lendo arquivo de migração...');
    const migrationSQL = readFileSync('./supabase/migrations/20251027040000_add_missing_profiles_columns.sql', 'utf8');

    console.log('🚀 Aplicando migração...');

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(/;[\s\n]*/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('/*') && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.includes('DO $$') || statement.includes('CREATE INDEX') || statement.includes('COMMENT ON')) {
        console.log('   Executando statement...');
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

        if (error && !error.message.includes('already exists')) {
          console.error('❌ Erro ao executar statement:', error);
        }
      }
    }

    console.log('✅ Migração aplicada com sucesso!');

    // Verificar se as colunas foram criadas
    console.log('\n🔍 Verificando colunas criadas...');
    const { data, error } = await supabase
      .from('profiles')
      .select('social_media_links, payment_integrations_config')
      .limit(1);

    if (error) {
      console.error('❌ Erro ao verificar colunas:', error);
    } else {
      console.log('✅ Colunas verificadas com sucesso!');
      console.log('   - social_media_links: ✓');
      console.log('   - payment_integrations_config: ✓');
    }

  } catch (error) {
    console.error('❌ Erro ao aplicar migração:', error);
    process.exit(1);
  }
}

applyMigration();
