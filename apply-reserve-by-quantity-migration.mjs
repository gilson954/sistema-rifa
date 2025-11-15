import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🔧 Reading migration file...');
const sql = readFileSync('./supabase/migrations/20251115000000_create_reserve_tickets_by_quantity.sql', 'utf8');

console.log('📄 Applying migration: create_reserve_tickets_by_quantity');
console.log('   This will create the function to reserve tickets by quantity');

// Split SQL into individual statements (basic approach)
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('/*') && !s.startsWith('--'));

let successCount = 0;
let errorCount = 0;

for (let i = 0; i < statements.length; i++) {
  const statement = statements[i] + ';';

  // Skip comments
  if (statement.trim().startsWith('/*') || statement.trim().startsWith('--')) {
    continue;
  }

  console.log(`\n⏳ Executing statement ${i + 1}/${statements.length}...`);

  const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

  if (error) {
    console.error(`❌ Error in statement ${i + 1}:`, error.message);
    errorCount++;

    // For certain errors, we can continue (like "function does not exist" when dropping)
    if (error.message.includes('does not exist') && statement.includes('DROP')) {
      console.log('   ℹ️ Continuing (expected error for DROP IF EXISTS)');
      continue;
    }
  } else {
    console.log(`✅ Statement ${i + 1} executed successfully`);
    successCount++;
  }
}

console.log('\n' + '='.repeat(60));
console.log(`📊 Migration Summary:`);
console.log(`   ✅ Successful: ${successCount}`);
console.log(`   ❌ Failed: ${errorCount}`);
console.log('='.repeat(60));

if (errorCount > 0) {
  console.log('\n⚠️ Some statements failed. Check errors above.');
  process.exit(1);
} else {
  console.log('\n🎉 Migration completed successfully!');
  console.log('\n📌 Next steps:');
  console.log('   1. Test ticket reservation with automatic quantity selection');
  console.log('   2. Verify batching works for large quantities (> 1000)');
  console.log('   3. Check that customer data is saved correctly');
}
