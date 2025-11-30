# PAT Rewards Integration 🎁

## Overview

The PAT (Photon Attention Token) rewards system is now fully integrated with the payment flow!

## Features Implemented

### 1. Automatic PAT Rewards
- ✅ **+1 PAT per voice purchase**
- ✅ Awarded immediately after successful payment
- ✅ Tracked in RewardsContext

### 2. Scratch Card Modal
- ✅ Appears after every successful payment
- ✅ Interactive scratch animation
- ✅ Shows reward amount (+1 PAT)
- ✅ Displays new balance and discount tier
- ✅ Smooth transition to TTS dialog

### 3. Discount Tiers
Based on PAT balance:
- **0-99 PAT**: 5% discount
- **100-499 PAT**: 10% discount
- **500+ PAT**: 20% discount

### 4. Navbar Display
- ✅ Shows current PAT balance
- ✅ Shows current discount percentage
- ✅ Animated badge with pulse effect
- ✅ Only visible when wallet connected

## User Flow

```
1. User clicks "Use Voice" on marketplace
         ↓
2. Payment dialog opens
         ↓
3. User confirms 3 transactions
         ↓
4. Payment successful
         ↓
5. +1 PAT awarded automatically
         ↓
6. Scratch card modal appears
         ↓
7. User scratches to reveal reward
         ↓
8. Shows new PAT balance & discount
         ↓
9. User clicks "Continue to Generate Voice"
         ↓
10. TTS dialog opens
```

## Components Updated

### Marketplace.tsx
- Added `useRewards()` hook
- Integrated `logEvent()` for tracking purchases
- Added scratch card modal
- Awards PAT on successful payment

### ScratchCardModal.tsx
- Redesigned for payment rewards
- Shows reward amount
- Displays PAT balance progression
- Shows discount tier information
- Smooth animations

### Navbar.tsx
- Added PAT balance display
- Shows discount percentage
- Animated badge with pulse
- Only shows when connected

## Event Tracking

Events logged to Photon:
- `VOICE_PURCHASED` - When user buys a voice
  - Metadata: voiceName, price, txHash

## Discount Application

Discounts are calculated but not yet applied to payments. To apply:

```typescript
// In payment flow
const { discountPercentage } = useRewards();
const discountedAmount = amount * (1 - discountPercentage / 100);

// Show in UI
<p>Original: {amount} APT</p>
<p>Discount: -{discountPercentage}%</p>
<p>Final: {discountedAmount} APT</p>
```

## Testing

### Test PAT Accumulation

1. Connect wallet
2. Go to Marketplace
3. Purchase a voice (e.g., Marcus Deep - 0.08 APT)
4. Scratch card appears
5. Reveal +1 PAT reward
6. Check navbar - should show "1 PAT | 5% OFF"
7. Purchase another voice
8. Check navbar - should show "2 PAT | 5% OFF"
9. Continue until you reach 100 PAT for 10% discount

### Test Discount Tiers

```javascript
// In browser console
localStorage.setItem('photon_pat_balance', '100');
location.reload();
// Should show "100 PAT | 10% OFF"

localStorage.setItem('photon_pat_balance', '500');
location.reload();
// Should show "500 PAT | 20% OFF"
```

## Visual Design

### Scratch Card
- Gradient background (purple to blue)
- Yellow/orange accents
- Sparkle animations
- Smooth reveal transition

### Navbar Badge
- Gradient background (yellow to orange)
- Pulsing dot indicator
- Smooth fade-in animation
- Responsive design

## Future Enhancements

### Short Term
1. **Apply discounts to payments** - Reduce actual payment amount
2. **Show discount in payment dialog** - Before user confirms
3. **PAT history** - Track all earned PAT
4. **Leaderboard** - Show top PAT earners

### Long Term
1. **Multiple reward types** - Not just +1 PAT
2. **Bonus multipliers** - 2x PAT on weekends
3. **Achievement system** - Unlock badges
4. **PAT marketplace** - Trade PAT for perks
5. **Referral rewards** - Earn PAT for invites

## Code Examples

### Award PAT on Custom Event

```typescript
import { useRewards } from "@/contexts/RewardsContext";

const { logEvent } = useRewards();

// Award PAT for any action
await logEvent("CUSTOM_EVENT", {
  customData: "value"
});
```

### Check Discount Before Payment

```typescript
const { discountPercentage, patBalance } = useRewards();

console.log(`User has ${patBalance} PAT`);
console.log(`Eligible for ${discountPercentage}% discount`);

const finalPrice = originalPrice * (1 - discountPercentage / 100);
```

### Show PAT Balance Anywhere

```typescript
import { useRewards } from "@/contexts/RewardsContext";

function MyComponent() {
  const { patBalance, discountPercentage } = useRewards();
  
  return (
    <div>
      <p>Balance: {patBalance} PAT</p>
      <p>Discount: {discountPercentage}%</p>
    </div>
  );
}
```

## Troubleshooting

### PAT not increasing

**Check:**
1. Wallet connected?
2. Payment successful?
3. Check browser console for errors
4. Check localStorage: `photon_pat_balance`

### Scratch card not appearing

**Check:**
1. Payment completed successfully?
2. Check `showScratchCard` state
3. Check browser console for errors

### Discount not showing

**Check:**
1. Wallet connected?
2. PAT balance > 0?
3. Check navbar visibility
4. Refresh page

## Storage

PAT balance is stored in:
- **localStorage**: `photon_pat_balance`
- **RewardsContext**: In-memory state
- **Photon API**: Server-side (if configured)

## API Integration

Currently using mock Photon service. To integrate real API:

1. Update `src/services/photon.ts`
2. Add real API endpoints
3. Handle authentication
4. Sync with server

---

**Last Updated**: 2025-11-30
**Status**: ✅ Fully Integrated
