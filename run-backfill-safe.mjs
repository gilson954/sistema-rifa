#!/usr/bin/env node

/**
 * Safe Backfill Script for Supabase Tickets
 *
 * This script connects directly to Supabase and runs the optimized backfill
 * function to create missing tickets for campaigns. It bypasses Dashboard
 * timeout limits by connecting directly to the database.
 *
 * Usage:
 *   node run-backfill-safe.mjs [campaign_id] [batch_size]
 *
 * Examples:
 *   node run-backfill-safe.mjs                           # Backfill all campaigns
 *   node run-backfill-safe.mjs abc-123-def               # Backfill specific campaign
 *   node run-backfill-safe.mjs abc-123-def 10000        # Custom batch size
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing Supabase credentials in .env file');
  console.error('   Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Parse command line arguments
const args = process.argv.slice(2);
const campaignId = args[0];
const batchSize = parseInt(args[1]) || 5000;

async function runBackfillForCampaign(campaignId, batchSize) {
  console.log(`\n🎯 Running backfill for campaign: ${campaignId}`);
  console.log(`📦 Batch size: ${batchSize}\n`);

  try {
    const { data, error } = await supabase.rpc('backfill_campaign_tickets', {
      p_campaign_id: campaignId,
      p_batch_size: batchSize
    });

    if (error) {
      console.error('❌ Error:', error.message);
      throw error;
    }

    if (data && data.length > 0) {
      const result = data[0];
      console.log('\n✅ Backfill completed successfully!');
      console.log('─'.repeat(60));
      console.log(`Campaign: ${result.campaign_title}`);
      console.log(`Total tickets needed: ${result.total_tickets_needed}`);
      console.log(`Existing tickets: ${result.existing_tickets}`);
      console.log(`Tickets created: ${result.tickets_created}`);
      console.log('─'.repeat(60));
    }

    return data;
  } catch (error) {
    console.error('❌ Failed to run backfill:', error);
    throw error;
  }
}

async function runBackfillForAllCampaigns(batchSize) {
  console.log('\n🚀 Running backfill for ALL campaigns');
  console.log(`📦 Batch size: ${batchSize}\n`);

  // First, check statistics
  console.log('📊 Checking statistics...\n');

  try {
    const { data: stats, error: statsError } = await supabase.rpc('get_backfill_statistics');

    if (statsError) {
      console.error('⚠️  Warning: Could not fetch statistics:', statsError.message);
    } else if (stats && stats.length > 0) {
      const stat = stats[0];
      console.log('Statistics:');
      console.log('─'.repeat(60));
      console.log(`Total campaigns: ${stat.total_campaigns}`);
      console.log(`Campaigns needing backfill: ${stat.campaigns_needing_backfill}`);
      console.log(`Total missing tickets: ${stat.total_missing_tickets}`);
      console.log(`Largest campaign missing: ${stat.largest_missing_count} tickets`);
      console.log('─'.repeat(60));
      console.log('');

      if (stat.campaigns_needing_backfill === 0) {
        console.log('✅ All campaigns are up to date! No backfill needed.');
        return [];
      }
    }

    // Get list of campaigns needing backfill
    const { data: campaigns, error: campaignsError } = await supabase.rpc('get_campaigns_needing_backfill');

    if (campaignsError) {
      console.error('❌ Error fetching campaigns:', campaignsError.message);
      throw campaignsError;
    }

    if (!campaigns || campaigns.length === 0) {
      console.log('✅ All campaigns are up to date! No backfill needed.');
      return [];
    }

    console.log(`📋 Found ${campaigns.length} campaigns needing backfill:\n`);

    campaigns.forEach((camp, idx) => {
      console.log(`${idx + 1}. ${camp.campaign_title}`);
      console.log(`   Missing: ${camp.missing_tickets} / ${camp.total_tickets} tickets`);
      console.log(`   Status: ${camp.status}`);
      console.log('');
    });

    // Ask for confirmation
    console.log('⚠️  This will create tickets for all campaigns listed above.');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Run backfill
    console.log('🔄 Starting backfill process...\n');

    const { data, error } = await supabase.rpc('backfill_all_campaigns_tickets', {
      p_batch_size: batchSize
    });

    if (error) {
      console.error('❌ Error:', error.message);
      throw error;
    }

    // Display results
    if (data && data.length > 0) {
      console.log('\n✅ Backfill completed successfully!\n');
      console.log('Results:');
      console.log('═'.repeat(80));

      let totalCreated = 0;
      data.forEach((result, idx) => {
        console.log(`\n${idx + 1}. ${result.campaign_title}`);
        console.log(`   Campaign ID: ${result.campaign_id}`);
        console.log(`   Total tickets: ${result.total_tickets_needed}`);
        console.log(`   Existing: ${result.existing_tickets}`);
        console.log(`   Created: ${result.tickets_created}`);
        totalCreated += result.tickets_created;
      });

      console.log('\n═'.repeat(80));
      console.log(`\n📊 Summary: Created ${totalCreated} tickets across ${data.length} campaigns\n`);
    } else {
      console.log('\n✅ No tickets needed to be created.\n');
    }

    return data;
  } catch (error) {
    console.error('❌ Failed to run backfill:', error);
    throw error;
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║          Supabase Tickets Backfill - Safe Execution          ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');

  try {
    if (campaignId) {
      await runBackfillForCampaign(campaignId, batchSize);
    } else {
      await runBackfillForAllCampaigns(batchSize);
    }

    console.log('✨ Done!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

main();
