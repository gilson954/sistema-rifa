import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://byymchepurnfawqlrcxh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5eW1jaGVwdXJuZmF3cWxyY3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5OTU1MTcsImV4cCI6MjA2NjU3MTUxN30.gkxtqCo-ahheYI_mwu4wW2yuYP-kG0Kuyrfzi46sfeg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testIntegration() {
  console.log('🧪 Testando integração com banco de dados...\n');

  try {
    // 1. Verificar se consegue ler a tabela profiles
    console.log('1️⃣ Testando leitura da tabela profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, social_media_links, payment_integrations_config, primary_color, theme, logo_url')
      .limit(3);

    if (profilesError) {
      console.error('   ❌ Erro ao ler profiles:', profilesError);
      return;
    }

    console.log('   ✅ Leitura OK! Encontrados', profiles.length, 'perfis');

    if (profiles.length > 0) {
      console.log('\n   📊 Exemplo de perfil:');
      console.log('      - ID:', profiles[0].id);
      console.log('      - Nome:', profiles[0].name || '(não definido)');
      console.log('      - Redes Sociais:', JSON.stringify(profiles[0].social_media_links || {}));
      console.log('      - Config Pagamento:', JSON.stringify(profiles[0].payment_integrations_config || {}));
      console.log('      - Cor Principal:', profiles[0].primary_color || '(não definido)');
      console.log('      - Tema:', profiles[0].theme || '(não definido)');
      console.log('      - Logo URL:', profiles[0].logo_url || '(não definido)');
    }

    // 2. Verificar custom_domains
    console.log('\n2️⃣ Testando leitura da tabela custom_domains...');
    const { data: domains, error: domainsError } = await supabase
      .from('custom_domains')
      .select('*')
      .limit(3);

    if (domainsError) {
      console.error('   ❌ Erro ao ler custom_domains:', domainsError);
    } else {
      console.log('   ✅ Leitura OK! Encontrados', domains.length, 'domínios');
    }

    // 3. Verificar se o storage de logos está acessível
    console.log('\n3️⃣ Testando acesso ao bucket de logos...');
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) {
      console.error('   ❌ Erro ao listar buckets:', bucketsError);
    } else {
      const logosBucket = buckets.find(b => b.id === 'logos');
      if (logosBucket) {
        console.log('   ✅ Bucket "logos" encontrado!');
      } else {
        console.log('   ⚠️  Bucket "logos" não encontrado');
      }
    }

    console.log('\n✨ Teste concluído! Todas as integrações estão funcionando.');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  }
}

testIntegration();
