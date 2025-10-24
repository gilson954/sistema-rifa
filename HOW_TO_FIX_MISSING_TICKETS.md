# How to Fix Missing Tickets for Campaign

## Problem
The campaign "Teste 20000" was created with `total_tickets: 100,000` but the database trigger failed to create the tickets. Now the tickets table has 0 records for this campaign.

## Root Cause
The `populate_tickets_for_campaign()` trigger didn't fire or failed when the campaign was created.

## Solution

You need to apply the migration via Supabase Dashboard, which will:
1. Create functions to backfill missing tickets
2. Automatically run the backfill for ALL campaigns with missing tickets
3. Fix the current campaign and prevent future issues

### Steps to Fix:

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Navigate to your project: `byymchepurnfawqlrcxh`

2. **Open SQL Editor**
   - In the left sidebar, click on "SQL Editor"
   - Click "New query"

3. **Copy and Paste the Migration**
   - Open the file: `supabase/migrations/20251026000000_backfill_missing_tickets.sql`
   - Copy ALL the contents
   - Paste into the SQL Editor

4. **Execute the Migration**
   - Click "Run" button (or press Ctrl+Enter)
   - Wait for it to complete (may take a few minutes for large campaigns)

5. **Verify Success**
   - You should see output messages like:
     ```
     📋 Processing campaign: Teste 20000 (ID: 49834025-1064-4bd3-b89e-f56bdff3257e)
     Campaign: Teste 20000 - Total needed: 100000, Existing: 0
     Progress: 10000 tickets created...
     Progress: 20000 tickets created...
     ...
     ✅ Created 100000 tickets for campaign Teste 20000
     ✅ BACKFILL COMPLETE
     Total campaigns processed: 1
     Total tickets created: 100000
     ```

6. **Test the Fix**
   - Go back to the campaign page in your app
   - Try to reserve tickets again
   - Should work now!

## Alternative: Quick SQL Fix (Simpler)

If the full migration seems complex, you can run this simpler SQL directly:

```sql
-- Create tickets for the specific campaign
DO $$
DECLARE
  v_campaign_id uuid := '49834025-1064-4bd3-b89e-f56bdff3257e';
  v_total_tickets integer := 100000;
  v_batch_size integer := 1000;
  v_start integer;
  v_end integer;
  i integer;
BEGIN
  RAISE NOTICE 'Creating % tickets for campaign %', v_total_tickets, v_campaign_id;

  -- Create tickets in batches
  FOR v_start IN 1..v_total_tickets BY v_batch_size LOOP
    v_end := LEAST(v_start + v_batch_size - 1, v_total_tickets);

    -- Insert batch
    FOR i IN v_start..v_end LOOP
      INSERT INTO tickets (campaign_id, quota_number, status)
      VALUES (v_campaign_id, i, 'disponível')
      ON CONFLICT (campaign_id, quota_number) DO NOTHING;
    END LOOP;

    -- Progress update
    IF v_start % 10000 = 1 THEN
      RAISE NOTICE 'Progress: % tickets created', v_start + v_batch_size - 1;
    END IF;
  END LOOP;

  RAISE NOTICE '✅ Complete! Created % tickets', v_total_tickets;
END $$;
```

## Why This Happened

The trigger `populate_tickets_for_campaign()` should automatically create tickets when a campaign is inserted. Possible reasons it didn't work:
1. Database error during campaign creation
2. Transaction was rolled back
3. Trigger was temporarily disabled
4. Large campaigns (100k+) may have timed out

## Prevention

The migration file also includes a function `backfill_all_campaigns_tickets()` that you can call manually anytime to fix campaigns with missing tickets:

```sql
SELECT * FROM backfill_all_campaigns_tickets();
```

This will find and fix ALL campaigns with missing tickets automatically.

## Need Help?

If you encounter any issues:
1. Check the PostgreSQL logs in Supabase Dashboard
2. Verify the trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'trg_populate_tickets_for_campaign';`
3. Check RLS policies on the tickets table
