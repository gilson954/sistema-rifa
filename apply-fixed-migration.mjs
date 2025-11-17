import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env file
const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 Applying Transaction Isolation Fix...\n');
console.log('📡 Connected to:', supabaseUrl);
console.log('');

// Read the migration file
const migrationPath = './supabase/migrations/20251117000000_fix_reserve_tickets_transaction_isolation.sql';
console.log('📄 Reading migration:', migrationPath);

let migrationSQL;
try {
  migrationSQL = readFileSync(migrationPath, 'utf-8');
  console.log('✅ Migration file loaded');
  console.log('   Size:', migrationSQL.length, 'bytes');
  console.log('');
} catch (error) {
  console.error('❌ Failed to read migration file:', error.message);
  process.exit(1);
}

// Extract the SQL commands (skip comments)
const sqlCommands = migrationSQL
  .split('\n')
  .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
  .join('\n');

console.log('🚀 Applying migration to database...');
console.log('');

// For Supabase, we need to use their management API or apply via dashboard
// Since we can't execute raw SQL directly via the JS client for DDL operations,
// we'll provide instructions

console.log('⚠️ IMPORTANT: Direct SQL execution from Node.js is limited.');
console.log('');
console.log('📋 MANUAL STEPS TO APPLY THIS MIGRATION:');
console.log('');
console.log('1. Open Supabase Dashboard:');
console.log('   https://supabase.com/dashboard/project/byymchepurnfawqlrcxh/sql/new');
console.log('');
console.log('2. Copy the ENTIRE contents of this file:');
console.log('   supabase/migrations/20251117000000_fix_reserve_tickets_transaction_isolation.sql');
console.log('');
console.log('3. Paste into the SQL Editor');
console.log('');
console.log('4. Click "Run" (or press Ctrl+Enter)');
console.log('');
console.log('5. Verify you see "Success. No rows returned"');
console.log('');
console.log('=' .repeat(70));
console.log('');

// Alternatively, let's try to apply using a workaround with edge functions
console.log('🔄 Attempting automated application via RPC...');
console.log('');

// We'll try to execute the DROP and CREATE statements separately
const statements = [
  // Drop existing function
  `DROP FUNCTION IF EXISTS public.reserve_tickets_by_quantity(uuid, integer, uuid, text, text, text, timestamptz, text);`,

  // Create new function - this needs to be the full CREATE statement
  sqlCommands.split('DROP FUNCTION')[1]?.trim() || sqlCommands
];

console.log('⚠️ Note: Automated SQL execution may not work with ANON key.');
console.log('   If this fails, please use the manual steps above.');
console.log('');

// Since we can't execute DDL with anon key, let's just verify and provide clear instructions
console.log('✨ ALTERNATIVE: Use the Supabase CLI');
console.log('');
console.log('If you have Supabase CLI installed, run:');
console.log('');
console.log('   supabase db push');
console.log('');
console.log('Or apply this specific migration:');
console.log('');
console.log('   supabase migration up --db-url "<your-db-url>"');
console.log('');
console.log('=' .repeat(70));
console.log('');

// Test if the function works after (assuming it was applied manually)
console.log('📝 After applying the migration, run this to verify:');
console.log('');
console.log('   node diagnose-function.mjs');
console.log('');
console.log('You should see: "Function exists and working correctly! ✅"');
console.log('');

console.log('=' .repeat(70));
console.log('📄 MIGRATION SQL TO COPY (for manual application):');
console.log('=' .repeat(70));
console.log('');
console.log(migrationSQL);
console.log('');
console.log('=' .repeat(70));

process.exit(0);
