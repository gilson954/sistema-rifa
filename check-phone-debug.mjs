import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPhoneFormats() {
  console.log('🔍 Checking phone number formats in database...\n');
  
  // Check what formats exist
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('customer_phone, customer_name, quota_number, created_at')
    .not('customer_phone', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`📊 Found ${tickets?.length || 0} tickets with phone numbers:\n`);
  
  if (!tickets || tickets.length === 0) {
    console.log('⚠️ No tickets with phone numbers found!');
    return;
  }
  
  tickets.forEach((ticket, i) => {
    const phone = ticket.customer_phone;
    const digitsOnly = phone?.replace(/[^0-9]/g, '') || '';
    console.log(`${i+1}. Phone: "${phone}"`);
    console.log(`   Name: ${ticket.customer_name}`);
    console.log(`   Digits: ${digitsOnly} (${digitsOnly.length} digits)`);
    console.log(`   Quota: ${ticket.quota_number}`);
    console.log('');
  });
  
  // Test the search function
  console.log('\n🔍 Testing phone search with: +5562981127960');
  const { data: searchResult, error: searchError } = await supabase
    .rpc('get_tickets_by_phone', { p_phone_number: '+5562981127960' });
    
  if (searchError) {
    console.error('❌ Search error:', searchError);
  } else {
    console.log(`✅ Search found ${searchResult?.length || 0} tickets`);
    if (searchResult && searchResult.length > 0) {
      searchResult.forEach(t => {
        console.log(`   - Quota ${t.quota_number}: ${t.customer_phone}`);
      });
    }
  }
  
  // Try with just digits
  console.log('\n🔍 Testing phone search with: 62981127960');
  const { data: searchResult2, error: searchError2 } = await supabase
    .rpc('get_tickets_by_phone', { p_phone_number: '62981127960' });
    
  if (searchError2) {
    console.error('❌ Search error:', searchError2);
  } else {
    console.log(`✅ Search found ${searchResult2?.length || 0} tickets`);
    if (searchResult2 && searchResult2.length > 0) {
      searchResult2.forEach(t => {
        console.log(`   - Quota ${t.quota_number}: ${t.customer_phone}`);
      });
    }
  }
}

checkPhoneFormats().catch(console.error);
