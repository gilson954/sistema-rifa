import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://byymchepurnfawqlrcxh.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5eW1jaGVwdXJuZmF3cWxyY3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5OTU1MTcsImV4cCI6MjA2NjU3MTUxN30.gkxtqCo-ahheYI_mwu4wW2yuYP-kG0Kuyrfzi46sfeg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🚀 Starting migration to backfill missing tickets...\n');

  try {
    // Read the migration file
    const migrationPath = join(__dirname, 'supabase/migrations/20251026000000_backfill_missing_tickets.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded successfully');
    console.log('📊 Migration size:', (migrationSQL.length / 1024).toFixed(2), 'KB\n');

    // Split the SQL into individual statements
    // Remove comments and split by semicolons
    const statements = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
      .join('\n')
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('/*'));

    console.log('Found', statements.length, 'SQL statements to execute\n');

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      if (statement.length < 10) continue; // Skip very short statements

      console.log(`\n[${ i + 1}/${statements.length}] Executing statement...`);
      console.log('Preview:', statement.substring(0, 100) + (statement.length > 100 ? '...' : ''));

      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

        if (error) {
          // Try using the Supabase REST API directly as a fallback
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({ sql: statement + ';' })
          });

          if (!response.ok) {
            console.log('⚠️  Warning: Could not execute via RPC. This is expected if exec_sql is not available.');
            console.log('    The migration needs to be applied via Supabase dashboard or CLI.');
          } else {
            const result = await response.json();
            console.log('✅ Statement executed successfully via REST API');
            successCount++;
          }
        } else {
          console.log('✅ Statement executed successfully');
          successCount++;
        }
      } catch (err) {
        console.error('❌ Error executing statement:', err.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary:');
    console.log('   Total statements:', statements.length);
    console.log('   Successful:', successCount);
    console.log('   Errors:', errorCount);
    console.log('='.repeat(50) + '\n');

    // Now let's try to call the backfill function directly
    console.log('🔧 Attempting to call backfill function directly...\n');

    const { data: backfillData, error: backfillError } = await supabase
      .rpc('backfill_all_campaigns_tickets');

    if (backfillError) {
      console.error('❌ Error calling backfill function:', backfillError.message);
      console.log('\n⚠️  MANUAL ACTION REQUIRED:');
      console.log('    Please apply this migration via the Supabase Dashboard:');
      console.log('    1. Go to SQL Editor in Supabase Dashboard');
      console.log('    2. Copy the contents of: supabase/migrations/20251026000000_backfill_missing_tickets.sql');
      console.log('    3. Paste and execute the SQL');
      console.log('    4. The backfill will run automatically\n');
    } else {
      console.log('✅ Backfill function executed successfully!');
      console.log('📊 Results:', backfillData);
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    console.log('\n⚠️  MANUAL ACTION REQUIRED:');
    console.log('    Please apply the migration manually via Supabase Dashboard');
    process.exit(1);
  }
}

applyMigration();
