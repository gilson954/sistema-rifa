# Quick Fix: Transaction Isolation Error

## ⚡ 2-Minute Fix

### What's Wrong?
Your database function has a transaction isolation error that prevents ticket reservations.

### The Fix (Choose One):

#### Option A: Supabase Dashboard (Easiest)
1. Open: https://supabase.com/dashboard/project/byymchepurnfawqlrcxh/sql/new
2. Copy ALL text from: `supabase/migrations/20251117000000_fix_reserve_tickets_transaction_isolation.sql`
3. Paste in SQL Editor
4. Click "RUN"
5. ✅ Done!

#### Option B: Command Line (If you have Supabase CLI)
```bash
supabase db push
```

### Verify It Worked
```bash
node diagnose-function.mjs
```

Expected: "🟢 Function exists and working correctly! ✅"

### What If It Still Doesn't Work?
1. Wait 30 seconds (connection pool refresh)
2. Try reserving tickets again
3. Check `TRANSACTION_ISOLATION_FIX.md` for detailed troubleshooting

---

## Technical Details (Optional Reading)

**Problem**: PostgreSQL requires `SET TRANSACTION ISOLATION LEVEL` to be the first statement, but the function had a cursor declaration that executed a query before it.

**Solution**: The migration removes the cursor declaration and uses a FOR loop instead, ensuring all queries execute after the isolation level is set.

**Files**:
- Fix: `supabase/migrations/20251117000000_fix_reserve_tickets_transaction_isolation.sql`
- Docs: `TRANSACTION_ISOLATION_FIX.md`
- Test: `diagnose-function.mjs`

**Safety**: This is a safe fix that doesn't change function behavior, only execution order.
