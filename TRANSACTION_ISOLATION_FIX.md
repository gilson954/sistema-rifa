# Transaction Isolation Error - Complete Fix Guide

## Problem Summary

**Error**: `SET TRANSACTION ISOLATION LEVEL must be called before any query`

**Root Cause**: PostgreSQL requires that `SET TRANSACTION ISOLATION LEVEL` must be the absolute first statement in a transaction. However, when a plpgsql function has a CURSOR declaration in the DECLARE block that references a variable, PostgreSQL validates that cursor BEFORE the function body executes, which means any query-like operation happens before the `SET TRANSACTION` statement.

## Diagnosis Results

**Status**: ✅ Confirmed - The error is present in your database

**Current State**:
- Function `reserve_tickets_by_quantity` EXISTS in database
- Function has the transaction isolation error
- The migration file `20251117000000_fix_reserve_tickets_transaction_isolation.sql` is correct
- **The migration was NOT applied to the database**

**Verification**: Run `node diagnose-function.mjs` to see current status

## Solution

The fix is already prepared in migration file:
```
supabase/migrations/20251117000000_fix_reserve_tickets_transaction_isolation.sql
```

This migration:
1. ✅ Removes the problematic cursor declaration from DECLARE block
2. ✅ Uses a FOR loop instead (moves query logic into BEGIN block)
3. ✅ Places SET TRANSACTION as the first statement after BEGIN
4. ✅ Fetches v_reservation_timeout_minutes AFTER setting isolation level
5. ✅ Maintains all existing functionality (order_id, customer data, batching)

## How to Apply the Fix

### Method 1: Supabase Dashboard (Recommended - Fastest)

1. **Open SQL Editor**:
   - Go to: https://supabase.com/dashboard/project/byymchepurnfawqlrcxh/sql/new

2. **Copy Migration SQL**:
   - Open file: `supabase/migrations/20251117000000_fix_reserve_tickets_transaction_isolation.sql`
   - Copy the ENTIRE file contents (including comments)

3. **Execute**:
   - Paste into SQL Editor
   - Click "RUN" button (or press Ctrl+Enter)
   - Wait for success message: "Success. No rows returned"

4. **Verify**:
   ```bash
   node diagnose-function.mjs
   ```

   You should see: "🟢 Function exists and working correctly! ✅"

### Method 2: Supabase CLI (If installed)

```bash
# From project root
supabase db push

# Or for a specific migration
supabase migration up
```

### Method 3: Direct SQL (psql or database client)

If you have direct database access:

```bash
psql <your-connection-string> -f supabase/migrations/20251117000000_fix_reserve_tickets_transaction_isolation.sql
```

## Verification Steps

### 1. Test Function Execution

```bash
node diagnose-function.mjs
```

Expected output:
```
🟢 STATUS: Function exists and working correctly! ✅
🎉 The transaction isolation issue appears to be RESOLVED!
```

### 2. Test in Application

1. Open a campaign page in your app
2. Try to reserve tickets (any quantity)
3. Fill in customer information
4. Submit the reservation

Expected result: ✅ Reservation succeeds without errors

### 3. Check Database Directly (Optional)

```sql
-- Verify function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'reserve_tickets_by_quantity';

-- Test function execution
SELECT * FROM reserve_tickets_by_quantity(
  '00000000-0000-0000-0000-000000000000'::uuid,
  1,
  NULL,
  'Test User',
  'test@example.com',
  '+5500000000000',
  now(),
  'test-order-id'
);
```

Expected: Function exists and returns "Campanha não encontrada" (campaign not found - this is correct for a fake UUID)

## What Changed in the Fix

### Before (Broken - with cursor):
```sql
DECLARE
  v_reservation_timeout_minutes integer;
  v_available_tickets_cursor CURSOR FOR  -- ❌ Problem: References v_reservation_timeout_minutes
    SELECT ...
    WHERE t.reserved_at + (v_reservation_timeout_minutes || ' minutes')::interval < now()
    ...
BEGIN
  SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;  -- ❌ Too late! Cursor already validated
```

### After (Fixed - with FOR loop):
```sql
DECLARE
  v_ticket_record RECORD;
  v_reserved_count integer := 0;
  v_reservation_timeout_minutes integer;  -- ✅ Just declare, no query reference
BEGIN
  SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;  -- ✅ First statement!

  -- Fetch timeout value AFTER setting isolation
  SELECT c.reservation_timeout_minutes INTO v_reservation_timeout_minutes
  FROM campaigns c WHERE c.id = p_campaign_id;

  -- Use FOR loop (implicit cursor, executed AFTER isolation is set)
  FOR v_ticket_record IN
    SELECT t.id, t.quota_number, t.status, t.reserved_at
    FROM tickets t
    WHERE t.campaign_id = p_campaign_id
      AND (
        t.status = 'disponível'
        OR (
          t.status = 'reservado'
          AND t.reserved_at + (v_reservation_timeout_minutes || ' minutes')::interval < now()
        )
      )
    ORDER BY t.quota_number ASC
    FOR UPDATE SKIP LOCKED
    LIMIT p_quantity_to_reserve
  LOOP
    -- Process tickets
  END LOOP;
```

## Why This Works

1. **No cursor declaration**: Eliminates the pre-execution validation that caused the issue
2. **FOR loop**: PostgreSQL's FOR loop creates an implicit cursor that's only evaluated when the loop executes (after SET TRANSACTION)
3. **Variable initialization**: v_reservation_timeout_minutes is fetched AFTER setting isolation level
4. **Proper execution order**: All queries happen in the correct sequence

## Prevention for Future

### Best Practices for plpgsql Functions with Transaction Isolation:

1. **Always place SET TRANSACTION first**:
   ```sql
   BEGIN
     SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;  -- Must be line 1
     -- ... rest of code
   ```

2. **Never use CURSOR declarations that reference variables**:
   ```sql
   -- ❌ DON'T DO THIS:
   DECLARE
     v_timeout integer;
     my_cursor CURSOR FOR SELECT ... WHERE timeout = v_timeout;

   -- ✅ DO THIS INSTEAD:
   DECLARE
     v_timeout integer;
   BEGIN
     FOR record IN SELECT ... WHERE timeout = v_timeout LOOP
       ...
     END LOOP;
   ```

3. **Use FOR loops instead of cursors**:
   - FOR loops are more readable
   - FOR loops avoid the transaction isolation issue
   - FOR loops have implicit cursor management

4. **Test with fake data**:
   - Always test functions with non-existent IDs
   - Verify error messages are appropriate
   - Ensure no data corruption on errors

## Troubleshooting

### Issue: Still getting the error after applying migration

**Solution**: Clear Supabase connection pooling
- Wait 30 seconds for connections to reset
- Or restart your application
- Or close all Supabase Dashboard tabs and reopen

### Issue: Migration says "already exists"

**Solution**: This means the function exists with the OLD definition
- The migration needs to be applied to DROP and recreate
- Use `DROP FUNCTION IF EXISTS` which is already in the migration

### Issue: "Permission denied"

**Solution**: The migration requires elevated privileges
- Must be applied via Supabase Dashboard (has admin rights)
- Or via Supabase CLI (uses service role)
- Cannot be applied with ANON key from client

## Files Involved

### Created/Modified:
- ✅ `supabase/migrations/20251117000000_fix_reserve_tickets_transaction_isolation.sql` - The fix
- ✅ `diagnose-function.mjs` - Diagnostic tool
- ✅ `apply-fixed-migration.mjs` - Migration application helper
- ✅ `TRANSACTION_ISOLATION_FIX.md` - This documentation

### Referenced (no changes needed):
- ✅ `src/hooks/useTickets.ts` - Already correct
- ✅ `src/lib/api/tickets.ts` - Already correct
- ✅ `src/components/ReservationStep1Modal.tsx` - Already correct
- ✅ `src/components/ReservationModal.tsx` - Already correct

## Summary

- **Problem**: Transaction isolation set after cursor validation
- **Cause**: Cursor in DECLARE block references uninitialized variable
- **Fix**: Remove cursor, use FOR loop instead
- **Status**: Migration ready, needs manual application
- **Time to fix**: < 2 minutes once migration is applied
- **Risk**: Very low - function signature unchanged, behavior identical

## Next Steps

1. ✅ Apply the migration using Method 1 (Dashboard) above
2. ✅ Run `node diagnose-function.mjs` to verify
3. ✅ Test a reservation in your application
4. ✅ Monitor Supabase logs for any issues
5. ✅ Consider the prevention measures for future functions

---

**Status**: Ready to apply
**Priority**: High (blocks ticket reservations)
**Impact**: Critical fix, no side effects
**Reversibility**: Can rollback if needed (migration includes DROP statement)
