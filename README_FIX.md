# 🔧 CRITICAL FIX: Account Creation & Ticket Reservation

## ⚡ Quick Fix (3 Steps - Takes 2 Minutes)

Your account creation is failing because of database function conflicts. Follow these steps to fix it:

### Step 1: Open Supabase Dashboard
Click here: **https://supabase.com/dashboard/project/byymchepurnfawqlrcxh/sql/new**

### Step 2: Apply First Migration
1. Copy **ALL** content from: `supabase/migrations/20251019000000_fix_reserve_tickets_function_conflicts.sql`
2. Paste into SQL Editor
3. Click **RUN** button (bottom right)
4. Wait for green "Success" message

### Step 3: Apply Second Migration
1. Click **New query** to start fresh
2. Copy **ALL** content from: `supabase/migrations/20251019010000_fix_campaign_winners_access.sql`
3. Paste into SQL Editor
4. Click **RUN** button
5. Wait for green "Success" message

## ✅ Done!

Now test:
- Create a new account ✓
- Reserve tickets ✓
- View campaign pages ✓

---

## 🐛 What Was Wrong?

Three critical bugs were causing failures:

1. **Function Signature Mismatch**
   - Error: `column reference "quota_number" is ambiguous`
   - Cause: Multiple versions of `reserve_tickets` function existed
   - Frontend sent 6 parameters, database had 3-parameter version

2. **Campaign Winners 404 Error**
   - Error: `Failed to load resource: 404`
   - Cause: Missing RLS policies for anonymous users
   - Winners table wasn't accessible on public campaign pages

3. **Column Ambiguity**
   - Error: `quota_number is ambiguous`
   - Cause: SQL queries didn't qualify column names with table names
   - PostgreSQL couldn't determine which table the column belonged to

## 🛠️ What The Fix Does

### Migration 1: Fix reserve_tickets Function
✅ Drops all conflicting versions of the function
✅ Creates single definitive 6-parameter version
✅ Adds customer data support (name, email, phone)
✅ Fixes column ambiguity with proper table aliases
✅ Works for both logged-in and anonymous users

### Migration 2: Fix Campaign Winners Access
✅ Ensures campaign_winners table exists
✅ Grants public read access (no more 404s)
✅ Campaign pages can display winners
✅ Maintains security for owner operations

## 📋 Verification

After applying migrations, verify they worked:

### Test 1: Check Function Exists
```sql
SELECT routine_name, argument_data_types
FROM information_schema.routines
WHERE routine_name = 'reserve_tickets';
```
**Expected:** Should show 6 parameters (uuid, integer[], uuid, text, text, text)

### Test 2: Check Winners Access
```sql
SELECT * FROM campaign_winners LIMIT 1;
```
**Expected:** Should NOT return 404 error

### Test 3: Try Account Creation
1. Go to your app
2. Click "Create Account"
3. Fill in details and reserve tickets
4. Should complete without errors

## 📚 Additional Documentation

- **QUICK_FIX_GUIDE.md** - Simple step-by-step guide
- **MIGRATION_INSTRUCTIONS.md** - Detailed instructions with multiple options
- **FIXES_APPLIED.md** - Technical deep dive of all changes
- **verify_migrations.sql** - SQL queries to verify migrations worked

## 🔄 If You Need to Rollback

**Not recommended**, but if needed:

```sql
-- Restore 3-parameter version (will break frontend)
DROP FUNCTION IF EXISTS public.reserve_tickets(uuid, integer[], uuid, text, text, text);
CREATE OR REPLACE FUNCTION public.reserve_tickets(
  p_campaign_id uuid,
  p_quota_numbers integer[],
  p_user_id uuid
) RETURNS TABLE(...) AS $$ ... $$;

-- Restrict winners access (will cause 404s again)
DROP POLICY IF EXISTS "Public can read all campaign winners" ON campaign_winners;
```

## 💡 Why Manual Application?

The Supabase client (used by frontend) doesn't have permissions to execute DDL statements (CREATE, DROP, ALTER). These operations require admin access, which is only available through:

1. **Supabase Dashboard SQL Editor** ✅ Recommended
2. **Supabase CLI** (if installed locally)
3. **Direct database connection** (requires password)

The dashboard method is easiest and safest.

## ✨ After Fix Benefits

✅ Account creation works smoothly
✅ Tickets can be reserved with customer info
✅ Both anonymous and logged-in users supported
✅ Campaign pages load winners correctly
✅ Better error messages for debugging
✅ No more ambiguous column errors

## 🆘 Need Help?

If migrations fail:
1. Check the error message in SQL Editor
2. Ensure you copied the ENTIRE migration file
3. Make sure you're running them in order (000000 then 010000)
4. Try refreshing the dashboard and running again

## 📞 Support

Issues? Check browser console for error details and compare with the original error logs to verify the fix.
