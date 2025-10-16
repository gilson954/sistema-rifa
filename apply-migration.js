import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('🔄 Reading migration file...');
    const migrationPath = join(__dirname, 'supabase/migrations/20251016160000_add_featured_campaign_support.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('🔄 Applying migration to add is_featured column...');

    // Split the migration into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('/*') && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.includes('DO $$') || statement.includes('CREATE') || statement.includes('DROP') || statement.includes('COMMENT')) {
        const fullStatement = statement + ';';
        console.log('Executing:', fullStatement.substring(0, 100) + '...');

        const { error } = await supabase.rpc('exec_sql', { sql: fullStatement }).single();

        if (error) {
          console.error('❌ Error executing statement:', error);
        } else {
          console.log('✅ Statement executed successfully');
        }
      }
    }

    console.log('✅ Migration applied successfully!');
    console.log('The campaigns table now has the is_featured column.');

  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  }
}

applyMigration();
