# Contract Integration Summary - Voice Registration

## Contract Analysis

### Voice Identity Contract (`contract2/src/voiceidentity2.move`)
- **Module:** `VoiceVault::voice_identity`
- **Address:** `0x594d426ee5f8d800c7ede249d83a4cbfc4ee0c7dbcefece5ae6e727b7b0cf9db`
- **Network:** Testnet
- **Function:** `register_voice(creator: &signer, name: string::String, model_uri: string::String, rights: string::String, price_per_use: u64)`

#### Contract Features:
- ✅ Auto-initializes `VoiceRegistry` if it doesn't exist
- ✅ Enforces one voice per creator address (ERROR_VOICE_ALREADY_EXISTS = 1)
- ✅ Stores voice metadata on-chain permanently
- ✅ View functions: `get_metadata()`, `get_voice_id()`, `voice_exists()`

#### Contract Limitations (By Design):
- ⚠️ Only ONE voice per wallet address
- ⚠️ No update/delete functions
- ⚠️ No ownership transfer

### Payment Contract (`contract1/src/payment2.move`)
- **Module:** `VoiceVault::payment_contract`
- **Address:** `0xb0fcc55b9a116fec51295eb73b03ac31083a841290405c955fc088c2eeb0bf27`
- **Network:** Testnet

## UI Changes Made

### 1. Contract Address Updates
**File:** `src/lib/contracts.ts`
- ✅ Updated `VOICE_IDENTITY` address to match contract2 deployment
- ✅ Updated `PAYMENT` address to match contract1 deployment

### 2. Voice Registration Form (`src/components/voice/VoiceRegistrationForm.tsx`)

#### Added Features:
- ✅ **Pre-registration Check:** Checks if voice already exists using `useVoiceMetadata` hook
- ✅ **Validation:** All required fields validated according to contract requirements
- ✅ **Model URI Required:** Made modelUri a required field (contract requirement)
- ✅ **Duplicate Prevention:** Shows alert if voice already registered (enforces one voice per wallet)
- ✅ **Transaction Confirmation:** Waits for on-chain confirmation using `aptosClient.waitForTransaction`
- ✅ **Error Handling:** Proper error messages for contract error codes
- ✅ **Transaction Explorer Link:** Provides link to view transaction on Aptos Explorer
- ✅ **Loading States:** Shows checking/registering states clearly

#### Removed:
- ❌ Audio file upload (not needed - file handling is separate, model URI is what's registered)
- ❌ Unused state variables

#### User Flow:
1. User connects wallet
2. Form automatically checks if voice already exists
3. If exists → Shows existing voice details (can't register another)
4. If not exists → Shows registration form
5. User fills required fields (name, modelUri, rights, pricePerUse)
6. On submit → Validates → Calls `registerVoice()` hook
7. Hook → Signs transaction → Waits for confirmation → Shows success
8. Form resets and page refreshes to show new registration

### 3. Registration Hook (`src/hooks/useVoiceRegister.ts`)

#### Improvements:
- ✅ **Transaction Waiting:** Uses `aptosClient.waitForTransaction()` to confirm on-chain
- ✅ **Better Error Handling:** Handles contract error codes:
  - `ERROR_VOICE_ALREADY_EXISTS` → User-friendly message
  - User rejection → Clear message
  - Insufficient balance → Helpful error
- ✅ **Transaction Hash:** Returns hash for explorer links

### 4. Metadata Hook (`src/hooks/useVoiceMetadata.ts`)

#### Added:
- ✅ `checkVoiceExists()` function to check if voice exists without fetching full metadata

### 5. Upload Page Flow (`src/pages/Upload.tsx`)

#### Updated:
- ✅ Step 3 description clarifies blockchain registration
- ✅ Shows auto-filled model URI when voice is cloned
- ✅ Clear workflow: Clone → Generate → Register

## Registration Requirements (Matching Contract)

According to the contract, registration requires:

1. ✅ **Wallet Connected** (creator: &signer)
2. ✅ **Name** (string::String) - Required
3. ✅ **Model URI** (string::String) - Required, format: "eleven:voiceId" or "openai:voiceName" or "ipfs://..."
4. ✅ **Rights** (string::String) - Required, e.g., "commercial", "personal"
5. ✅ **Price Per Use** (u64 in Octas) - Required, must be > 0

## Registration Flow

```
User Action                    UI State                          Blockchain
────────────────────────────────────────────────────────────────────────────
1. Connect Wallet          →   Checks existing voice           →  view voice_exists()
2. Fill Form               
3. Click Register          →   Validates inputs                
                              Shows "Registering..."           
                              Calls registerVoice()            →  signAndSubmitTransaction()
                                                                  Transaction sent
4. Wallet Approval         →   Waiting for confirmation        →  Transaction pending
5. Transaction Confirmed   →   Shows success + TX hash         →  Voice registered on-chain
                              Refreshes page
                              useVoiceMetadata fetches new data →  get_metadata() returns new voice
```

## Error Handling

### Contract Error Codes Handled:
- **ERROR_VOICE_ALREADY_EXISTS (1):** Shows message that only one voice per address is allowed
- **ERROR_VOICE_NOT_FOUND (2):** Handled in metadata fetching (voice doesn't exist yet)

### Frontend Validations:
- ✅ Wallet connected check
- ✅ Required fields validation
- ✅ Price > 0 validation
- ✅ Pre-check for existing voice (prevents unnecessary transaction)

## Testing Checklist

- [ ] Connect wallet with no existing voice → Form should show
- [ ] Connect wallet with existing voice → Should show existing voice alert
- [ ] Submit with missing fields → Should show validation errors
- [ ] Submit with valid data → Should sign transaction in wallet
- [ ] Transaction confirmation → Should show success + TX hash
- [ ] After registration → Should be able to see voice in marketplace
- [ ] Try to register second voice → Should be rejected by contract

## Notes

1. **One Voice Per Wallet:** This is a contract limitation. If users want multiple voices, they need multiple wallet addresses.

2. **Model URI Formats:**
   - `eleven:voiceId` - For ElevenLabs cloned voices
   - `openai:voiceName` - For OpenAI voices (alloy, echo, etc.)
   - `ipfs://...` - For IPFS-hosted models (future)

3. **Auto-fill:** When voice is cloned in Step 2, the model URI is auto-filled as `eleven:voiceId`

4. **Transaction Costs:** Users need APT for gas fees (usually very small on testnet)

---

**Status:** ✅ UI updated to match contract requirements  
**Registration:** ✅ Fully on-chain via Aptos blockchain  
**Validation:** ✅ All contract requirements enforced in UI

