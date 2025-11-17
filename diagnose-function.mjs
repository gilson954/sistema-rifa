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
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Found:', { supabaseUrl, supabaseKey: supabaseKey ? '***' : undefined });
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Diagnosing reserve_tickets_by_quantity function...\n');
console.log('📡 Connected to:', supabaseUrl);
console.log('');

// Check if function exists
console.log('1️⃣ Checking if function exists and testing execution...');
const { data: functionCheck, error: functionError } = await supabase.rpc('reserve_tickets_by_quantity', {
  p_campaign_id: '00000000-0000-0000-0000-000000000000',
  p_quantity_to_reserve: 1,
  p_user_id: null,
  p_customer_name: 'Test',
  p_customer_email: 'test@test.com',
  p_customer_phone: '+5500000000000',
  p_reservation_timestamp: new Date().toISOString(),
  p_order_id: 'test-order'
});

if (functionError) {
  console.log('   Error received:', functionError.message || JSON.stringify(functionError, null, 2));

  if (functionError.message && functionError.message.includes('does not exist')) {
    console.log('   ❌ Function does NOT exist in database');
  } else if (functionError.message && functionError.message.includes('SET TRANSACTION')) {
    console.log('   ⚠️ Function exists but has TRANSACTION ISOLATION ERROR');
    console.log('   🐛 This confirms the bug is present!');
  } else if (functionError.message && functionError.message.includes('não encontrada')) {
    console.log('   ✅ Function exists and executed (campaign not found is expected)');
  } else {
    console.log('   ⚠️ Unexpected error type');
  }
} else {
  console.log('   ✅ Function exists and executed successfully');
  console.log('   Data:', functionCheck);
}

// Check database connectivity
console.log('\n2️⃣ Checking database connectivity...');
const { data: campaigns, error: campaignsError } = await supabase
  .from('campaigns')
  .select('id, title')
  .limit(1);

if (campaignsError) {
  console.log('   ❌ Database access error:', campaignsError.message);
} else {
  console.log('   ✅ Database connection working');
  if (campaigns && campaigns.length > 0) {
    console.log('   Found', campaigns.length, 'campaign(s)');
  }
}

// Check tickets table
console.log('\n3️⃣ Checking tickets table structure...');
const { data: ticketsSample, error: ticketsError } = await supabase
  .from('tickets')
  .select('id, campaign_id, quota_number, status, order_id')
  .limit(1);

if (ticketsError) {
  console.log('   ❌ Tickets table error:', ticketsError.message);
} else {
  console.log('   ✅ Tickets table accessible');
  if (ticketsSample && ticketsSample.length > 0) {
    console.log('   Sample ticket has order_id column:', 'order_id' in ticketsSample[0] ? 'YES ✅' : 'NO ❌');
  }
}

console.log('\n' + '='.repeat(70));
console.log('📊 DIAGNOSIS SUMMARY');
console.log('='.repeat(70));

if (functionError && functionError.message && functionError.message.includes('SET TRANSACTION')) {
  console.log('🔴 STATUS: Transaction isolation error CONFIRMED');
  console.log('');
  console.log('📝 ISSUE: SET TRANSACTION ISOLATION LEVEL is being called too late');
  console.log('');
  console.log('🎯 ROOT CAUSE:');
  console.log('   The function has a cursor declaration in the DECLARE block that');
  console.log('   references a variable (v_reservation_timeout_minutes). PostgreSQL');
  console.log('   validates this cursor BEFORE the BEGIN block executes, which means');
  console.log('   the SET TRANSACTION statement comes too late.');
  console.log('');
  console.log('💡 SOLUTION:');
  console.log('   Apply a new migration that completely removes the cursor declaration');
  console.log('   and uses a FOR loop instead. This moves all query logic into the');
  console.log('   BEGIN block AFTER the SET TRANSACTION statement.');
  console.log('');
  console.log('⚠️ NOTE: Migration 20251117000000 may not have been applied, or it');
  console.log('   still contains the problematic cursor declaration.');
} else if (functionError && functionError.message && functionError.message.includes('does not exist')) {
  console.log('🔴 STATUS: Function does not exist in database');
  console.log('');
  console.log('💡 SOLUTION: Apply the complete migration stack:');
  console.log('   1. 20251115000000 (creates base function)');
  console.log('   2. 20251116000001 (adds order_id support)');
  console.log('   3. 20251117000000 (fixes transaction isolation)');
} else if (functionError && functionError.message && functionError.message.includes('não encontrada')) {
  console.log('🟢 STATUS: Function exists and working correctly! ✅');
  console.log('');
  console.log('✅ The error message "Campanha não encontrada" is EXPECTED');
  console.log('   (We used a fake campaign ID for testing)');
  console.log('');
  console.log('🎉 The transaction isolation issue appears to be RESOLVED!');
} else if (!functionError) {
  console.log('🟢 STATUS: Function exists and executed without errors! ✅');
  console.log('');
  console.log('🎉 No issues detected!');
} else {
  console.log('🟡 STATUS: Unable to determine exact state');
  console.log('');
  console.log('Error details:', functionError);
  console.log('');
  console.log('💡 RECOMMENDATION: Check Supabase Dashboard SQL Editor');
}

console.log('='.repeat(70) + '\n');

process.exit(0);
