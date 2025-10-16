import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://byymchepurnfawqlrcxh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5eW1jaGVwdXJuZmF3cWxyY3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5OTU1MTcsImV4cCI6MjA2NjU3MTUxN30.gkxtqCo-ahheYI_mwu4wW2yuYP-kG0Kuyrfzi46sfeg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumn() {
  console.log('🔍 Checking if is_featured column exists...');

  // Try to fetch a campaign with is_featured field
  const { data, error } = await supabase
    .from('campaigns')
    .select('id, is_featured')
    .limit(1);

  if (error) {
    if (error.message.includes('is_featured')) {
      console.log('❌ Column is_featured does NOT exist');
      return false;
    } else {
      console.error('Error checking column:', error);
      return null;
    }
  }

  console.log('✅ Column is_featured EXISTS');
  return true;
}

async function main() {
  const exists = await checkColumn();

  if (exists === false) {
    console.log('\n⚠️  The is_featured column needs to be added to the campaigns table.');
    console.log('\nℹ️  To fix this, you need to apply the migration using Supabase CLI or Dashboard:');
    console.log('   1. Go to your Supabase Dashboard: https://supabase.com/dashboard');
    console.log('   2. Navigate to: SQL Editor');
    console.log('   3. Run the migration file: supabase/migrations/20251016160000_add_featured_campaign_support.sql');
    console.log('\n📝 Or use Supabase CLI:');
    console.log('   npx supabase db push');
  } else if (exists === true) {
    console.log('\n✅ Database is ready! The is_featured column exists.');
  }
}

main().catch(console.error);
