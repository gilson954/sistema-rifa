import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔧 Applying Critical Database Migrations\n');
console.log('=' .repeat(60));

async function applyMigration(migrationPath, name) {
  try {
    console.log(`\n📄 Applying: ${name}`);
    console.log('-'.repeat(60));

    const sqlContent = readFileSync(migrationPath, 'utf8');

    // Split by semicolon but be careful with function definitions
    // For now, we'll send the entire migration as one statement
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent }).catch(() => ({
      data: null,
      error: { message: 'Direct SQL execution not available via RPC' }
    }));

    if (error) {
      console.log('⚠️  Cannot apply via Supabase client (requires admin access)');
      console.log('   You need to apply this migration manually via Supabase Dashboard\n');
      console.log('   📋 Migration file:', migrationPath);
      console.log('   📝 Instructions:');
      console.log('      1. Go to: https://supabase.com/dashboard/project/byymchepurnfawqlrcxh');
      console.log('      2. Navigate to: SQL Editor');
      console.log('      3. Copy and paste the entire migration file');
      console.log('      4. Click "Run"\n');
      return false;
    }

    console.log('✅ Migration applied successfully');
    return true;
  } catch (err) {
    console.error('❌ Error:', err.message);
    return false;
  }
}

async function main() {
  const migrations = [
    {
      path: join(__dirname, 'supabase/migrations/20251019000000_fix_reserve_tickets_function_conflicts.sql'),
      name: 'Fix reserve_tickets Function Signature Conflicts'
    },
    {
      path: join(__dirname, 'supabase/migrations/20251019010000_fix_campaign_winners_access.sql'),
      name: 'Fix Campaign Winners Table Access'
    }
  ];

  console.log('\n🎯 This script will attempt to apply 2 critical migrations:');
  console.log('   1. Fix reserve_tickets function signature conflicts');
  console.log('   2. Fix campaign_winners table access permissions\n');

  let allApplied = true;
  for (const migration of migrations) {
    const success = await applyMigration(migration.path, migration.name);
    if (!success) allApplied = false;
  }

  console.log('\n' + '='.repeat(60));
  if (allApplied) {
    console.log('✅ All migrations applied successfully!');
    console.log('\n🎉 Your database is now updated and the errors should be fixed.');
    console.log('   Try creating an account and reserving tickets now.\n');
  } else {
    console.log('⚠️  Manual migration required');
    console.log('\n📚 Please follow the instructions in QUICK_FIX_GUIDE.md');
    console.log('   or MIGRATION_INSTRUCTIONS.md for detailed steps.\n');
    console.log('💡 Quick Summary:');
    console.log('   1. Open Supabase Dashboard SQL Editor');
    console.log('   2. Copy contents of migration files from supabase/migrations/');
    console.log('   3. Run each migration in order (20251019000000 first, then 20251019010000)');
    console.log('   4. Verify with the test queries in verify_migrations.sql\n');
  }
}

main().catch(console.error);
