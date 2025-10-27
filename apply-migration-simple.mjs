import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://byymchepurnfawqlrcxh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5eW1jaGVwdXJuZmF3cWxyY3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5OTU1MTcsImV4cCI6MjA2NjU3MTUxN30.gkxtqCo-ahheYI_mwu4wW2yuYP-kG0Kuyrfzi46sfeg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🔍 Verificando se as colunas já existem...');

  try {
    // Tentar buscar as colunas - se der erro, significa que não existem
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('social_media_links, payment_integrations_config')
      .limit(1);

    if (!testError) {
      console.log('✅ As colunas JÁ EXISTEM no banco de dados!');
      console.log('   - social_media_links: ✓');
      console.log('   - payment_integrations_config: ✓');
      console.log('\n✨ Tudo pronto! As páginas devem funcionar normalmente.');
      return;
    }

    console.log('❌ As colunas NÃO existem. Erro:', testError.message);
    console.log('\n⚠️  IMPORTANTE: Você precisa aplicar a migração manualmente no Supabase SQL Editor:');
    console.log('   1. Acesse: https://supabase.com/dashboard/project/byymchepurnfawqlrcxh/editor/sql');
    console.log('   2. Cole o conteúdo do arquivo: supabase/migrations/20251027040000_add_missing_profiles_columns.sql');
    console.log('   3. Execute o SQL');

  } catch (error) {
    console.error('❌ Erro ao verificar colunas:', error.message);
  }
}

applyMigration();
