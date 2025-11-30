# Local Rewards Mode 🎁

## Overview

The rewards system now works in **Local Mode** - it doesn't require the Photon API to function. All PAT rewards are tracked locally in your browser.

## What Changed

### Before (API-Dependent)
- ❌ Required Photon API to be available
- ❌ Failed if API returned 400 error
- ❌ Couldn't earn rewards without API

### After (Local Mode)
- ✅ Works completely offline
- ✅ Stores PAT balance in localStorage
- ✅ Awards +1 PAT per purchase automatically
- ✅ Optionally syncs with Photon API if available

## How It Works

### 1. Wallet Connection
```
Connect Wallet
     ↓
Initialize local rewards
     ↓
Set PAT balance to 0
     ↓
Try to connect to Photon API (optional)
     ↓
If API fails: Continue with local mode
If API succeeds: Sync with server
```

### 2. Earning PAT
```
Purchase Voice
     ↓
logEvent() called
     ↓
+1 PAT awarded locally
     ↓
Save to localStorage
     ↓
Try to log to Photon API (optional)
     ↓
Update navbar display
```

### 3. Discount Calculation
```
PAT Balance → Discount Tier
0-99 PAT → 5% OFF
100-499 PAT → 10% OFF
500+ PAT → 20% OFF
```

## Storage

All data stored in localStorage:
- `photon_user_id` - Local user ID
- `photon_wallet_address` - Connected wallet
- `photon_pat_balance` - Current PAT balance
- `photon_access_token` - API token (if connected)

## Testing

### Test Local Rewards

1. **Connect wallet**
   ```
   Navbar shows: "0 PAT | 0% OFF"
   ```

2. **Purchase a voice**
   ```
   Payment completes → +1 PAT awarded
   Navbar updates: "1 PAT | 5% OFF"
   ```

3. **Check console**
   ```
   [Rewards] Event: VOICE_PURCHASED
   [Rewards] PAT Balance: 0 → 1 (+1)
   [Rewards] Photon API unavailable, using local rewards only
   ```

4. **Purchase more voices**
   ```
   Each purchase: +1 PAT
   Watch balance grow: 2, 3, 4, 5...
   ```

### Test Discount Tiers

```javascript
// In browser console

// Test 5% discount
localStorage.setItem('photon_pat_balance', '50');
location.reload();
// Should show: "50 PAT | 5% OFF"

// Test 10% discount
localStorage.setItem('photon_pat_balance', '100');
location.reload();
// Should show: "100 PAT | 10% OFF"

// Test 20% discount
localStorage.setItem('photon_pat_balance', '500');
location.reload();
// Should show: "500 PAT | 20% OFF"
```

### Reset PAT Balance

```javascript
// In browser console
localStorage.setItem('photon_pat_balance', '0');
location.reload();
```

## Error Handling

### Photon API Unavailable
- ✅ System continues in local mode
- ✅ Shows: "Rewards Active (Local Mode)"
- ✅ All features work normally

### localStorage Full
- ⚠️ Rare edge case
- ⚠️ PAT balance won't persist
- ⚠️ Still works during session

### Browser Clears Data
- ⚠️ PAT balance resets to 0
- ⚠️ User needs to earn again
- ✅ Can manually restore from backup

## Advantages

### For Users
- ✅ Works immediately
- ✅ No API dependencies
- ✅ Fast and responsive
- ✅ Privacy-friendly (local storage)

### For Developers
- ✅ Easy to test
- ✅ No backend required
- ✅ Simple implementation
- ✅ Can add API later

## Future Enhancements

### Short Term
1. **Export/Import PAT** - Backup balance
2. **Sync across devices** - Cloud storage
3. **PAT history** - Track all earnings

### Long Term
1. **Real Photon API** - Full integration
2. **Blockchain PAT** - Store on Aptos
3. **NFT rewards** - Convert PAT to NFTs
4. **Marketplace** - Trade PAT tokens

## API Integration (Optional)

If you want to integrate with real Photon API:

1. **Update `src/services/photon.ts`**
   - Add real API endpoints
   - Handle authentication
   - Implement error recovery

2. **Update RewardsContext**
   - Sync local → server on connect
   - Sync server → local on refresh
   - Handle conflicts

3. **Test thoroughly**
   - Online mode
   - Offline mode
   - Sync conflicts

## Console Logs

Watch for these logs:

```
✅ Success:
[Rewards] Event: VOICE_PURCHASED
[Rewards] PAT Balance: 0 → 1 (+1)
[Rewards] Refreshing balance: 1 PAT

⚠️ API Unavailable:
[Rewards] Photon API unavailable, using local rewards only

❌ Errors:
Failed to log event: [error details]
```

## Troubleshooting

### PAT not increasing

**Check:**
1. Open browser console (F12)
2. Look for `[Rewards]` logs
3. Check localStorage: `photon_pat_balance`
4. Verify payment completed successfully

**Fix:**
```javascript
// Manually add PAT
const current = parseInt(localStorage.getItem('photon_pat_balance') || '0');
localStorage.setItem('photon_pat_balance', (current + 1).toString());
location.reload();
```

### Navbar not updating

**Check:**
1. Wait 2 seconds (auto-refresh interval)
2. Check console for refresh logs
3. Manually refresh page

**Fix:**
```javascript
// Force refresh
location.reload();
```

### Discount not applying

**Note:** Discounts are calculated but not yet applied to payments.

**To apply discounts:**
```typescript
// In payment flow
const { discountPercentage } = useRewards();
const finalAmount = originalAmount * (1 - discountPercentage / 100);
```

## Code Examples

### Award PAT Manually

```typescript
import { useRewards } from "@/contexts/RewardsContext";

const { setPatBalance, patBalance } = useRewards();

// Add 5 PAT
setPatBalance(patBalance + 5);
localStorage.setItem('photon_pat_balance', (patBalance + 5).toString());
```

### Check Balance

```typescript
const { patBalance, discountPercentage } = useRewards();

console.log(`Balance: ${patBalance} PAT`);
console.log(`Discount: ${discountPercentage}%`);
```

### Log Custom Event

```typescript
const { logEvent } = useRewards();

await logEvent("CUSTOM_ACTION", {
  action: "something",
  value: 123
});
// Awards +1 PAT automatically
```

---

**Last Updated**: 2025-11-30
**Status**: ✅ Fully Functional (Local Mode)
