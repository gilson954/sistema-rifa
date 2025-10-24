import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://byymchepurnfawqlrcxh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5eW1jaGVwdXJuZmF3cWxyY3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5OTU1MTcsImV4cCI6MjA2NjU3MTUxN30.gkxtqCo-ahheYI_mwu4wW2yuYP-kG0Kuyrfzi46sfeg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCampaignTickets() {
  const campaignId = '49834025-1064-4bd3-b89e-f56bdff3257e';

  console.log('🎯 Fixing tickets for campaign:', campaignId);
  console.log('='.repeat(60) + '\n');

  // Get campaign details
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('id, title, total_tickets')
    .eq('id', campaignId)
    .single();

  if (campaignError) {
    console.error('❌ Error fetching campaign:', campaignError);
    process.exit(1);
  }

  console.log('📋 Campaign Details:');
  console.log('   Title:', campaign.title);
  console.log('   Total Tickets Needed:', campaign.total_tickets.toLocaleString());
  console.log('');

  // Check existing tickets
  const { count: existingCount, error: countError } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId);

  if (countError) {
    console.error('❌ Error counting tickets:', countError);
    process.exit(1);
  }

  console.log('📊 Current Status:');
  console.log('   Existing Tickets:', existingCount);
  console.log('   Missing Tickets:', campaign.total_tickets - existingCount);
  console.log('');

  if (existingCount >= campaign.total_tickets) {
    console.log('✅ Campaign already has all tickets!');
    process.exit(0);
  }

  // Create tickets in batches
  const BATCH_SIZE = 1000;
  let created = 0;
  let errors = 0;

  console.log('🚀 Starting ticket creation...');
  console.log('   Batch size:', BATCH_SIZE);
  console.log('   This may take a few minutes for large campaigns...\n');

  for (let start = existingCount + 1; start <= campaign.total_tickets; start += BATCH_SIZE) {
    const end = Math.min(start + BATCH_SIZE - 1, campaign.total_tickets);
    const batch = [];

    for (let i = start; i <= end; i++) {
      batch.push({
        campaign_id: campaignId,
        quota_number: i,
        status: 'disponível'
      });
    }

    try {
      const { data, error } = await supabase
        .from('tickets')
        .insert(batch);

      if (error) {
        console.error(`❌ Error in batch ${start}-${end}:`, error.message);
        errors++;
      } else {
        created += batch.length;
        const progress = ((created / (campaign.total_tickets - existingCount)) * 100).toFixed(2);
        process.stdout.write(`\r   Progress: ${created.toLocaleString()} / ${(campaign.total_tickets - existingCount).toLocaleString()} (${progress}%)`);
      }
    } catch (err) {
      console.error(`\n❌ Exception in batch ${start}-${end}:`, err.message);
      errors++;
    }
  }

  console.log('\n');
  console.log('='.repeat(60));
  console.log('✅ TICKET CREATION COMPLETE\n');
  console.log('📊 Summary:');
  console.log('   Tickets Created:', created.toLocaleString());
  console.log('   Errors:', errors);
  console.log('='.repeat(60));

  // Verify final count
  const { count: finalCount } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId);

  console.log('\n🔍 Verification:');
  console.log('   Expected:', campaign.total_tickets.toLocaleString());
  console.log('   Actual:', finalCount.toLocaleString());

  if (finalCount === campaign.total_tickets) {
    console.log('   ✅ Perfect match!\n');
  } else {
    console.log('   ⚠️  Mismatch detected. Some tickets may need to be created manually.\n');
  }
}

// Run the fix
fixCampaignTickets().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
