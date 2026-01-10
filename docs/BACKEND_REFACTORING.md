# Backend Logic Separation - Refactoring Summary

This document summarizes the refactoring work done to separate backend logic from the UI components.

## Overview

Previously, several backend operations were implemented directly in the frontend React components, including:
- Direct OpenAI API calls
- Payment breakdown calculations
- Voice registry management (localStorage only)
- Purchased voices tracking (localStorage only)
- Voice metadata aggregation logic

All of this logic has now been moved to the backend server, providing better security, maintainability, and scalability.

## Changes Made

### Backend Server (`backend/server.js`)

#### New Endpoints Added:

1. **OpenAI TTS Endpoint**
   - `POST /api/openai/speak`
   - Generates speech using OpenAI TTS API
   - Handles voice parameter and text input

2. **Unified TTS Endpoint** ⭐
   - `POST /api/tts/generate`
   - Handles both ElevenLabs and OpenAI voices based on model URI
   - Accepts `modelUri` (e.g., "eleven:voiceId" or "openai:voiceId") and `text`
   - Automatically routes to the correct provider

3. **Payment Breakdown Calculation**
   - `POST /api/payment/breakdown`
   - Calculates platform fee (2.5%), royalty (10%), and creator amount
   - Returns breakdown in both APT and Octas

4. **Voice Registry Management**
   - `GET /api/registry/voices` - Get all registered voices
   - `POST /api/registry/voices` - Register a new voice
   - `GET /api/registry/addresses` - Get all voice addresses

5. **Purchased Voices Tracking**
   - `GET /api/purchased/voices` - Get purchased voices (optionally filtered by wallet)
   - `POST /api/purchased/voices` - Record a purchase
   - `GET /api/purchased/check` - Check if a voice is purchased by a wallet

6. **Voice Metadata Aggregation**
   - `GET /api/voices/metadata` - Get metadata for multiple voices (foundation for blockchain queries)

#### Data Storage:
- Voice registry stored in `backend/data/voice-registry.json`
- Purchased voices stored in `backend/data/purchased-voices.json`
- Files are automatically created on first run

### Frontend Updates

#### API Client (`src/lib/api.ts`)

Added new methods:
- `generateTTS(modelUri, text)` - Unified TTS generation
- `generateOpenAISpeech(voice, text, model)` - Direct OpenAI TTS
- `getPaymentBreakdown(amount)` - Get payment breakdown from backend
- `getRegisteredVoices()` - Get all registered voices
- `registerVoice(address, name, walletAddress)` - Register voice on backend
- `getVoiceAddresses()` - Get voice addresses from backend
- `getPurchasedVoices(walletAddress)` - Get purchased voices
- `addPurchasedVoice(voice)` - Track purchase on backend
- `checkVoicePurchased(voiceId, owner, walletAddress)` - Check purchase status

#### Component Updates

1. **Marketplace.tsx**
   - ✅ Removed direct OpenAI API call (was exposing API key)
   - ✅ Now uses unified TTS endpoint (`generateTTS`)
   - ✅ Voice addresses loaded from backend registry
   - ✅ Purchased voices tracked on backend

2. **Upload.tsx**
   - ✅ TTS generation now uses unified endpoint
   - ✅ Voice cloning still uses ElevenLabs-specific endpoint (for error handling)

3. **VoiceMarketplaceCard.tsx**
   - ✅ Payment breakdown fetched from backend when dialog opens
   - ✅ Falls back to local calculation if backend unavailable

4. **VoiceRegistrationForm.tsx**
   - ✅ Voice registration now also registers on backend
   - ✅ Falls back to localStorage if backend unavailable

## Environment Variables

### Backend (`.env`)
```env
ELEVENLABS_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here  # Now required on backend
PORT=3000
```

### Frontend (`.env` or `.env.local`)
```env
# Remove VITE_OPENAI_API_KEY - no longer needed!
VITE_PROXY_URL=http://localhost:3000
# or
VITE_API_URL=http://localhost:3000
```

## Migration Notes

### Breaking Changes
- **OpenAI API Key**: Must now be set on backend, not frontend
- **Voice Registry**: Now stored on backend (with localStorage fallback)
- **Purchased Voices**: Now tracked on backend (with localStorage fallback)

### Backward Compatibility
- All components have fallback mechanisms to localStorage if backend is unavailable
- Existing localStorage data will continue to work
- Gradual migration is possible

## Benefits

1. **Security**
   - API keys no longer exposed to frontend
   - Sensitive operations centralized

2. **Maintainability**
   - Business logic in one place
   - Easier to update and test

3. **Scalability**
   - Can add caching, rate limiting, authentication
   - Can integrate with databases in the future

4. **Consistency**
   - Unified TTS endpoint handles all voice providers
   - Standardized error handling

## Testing

To test the changes:

1. **Start Backend:**
   ```bash
   npm run server
   ```

2. **Start Frontend:**
   ```bash
   npm run dev
   ```

3. **Test Endpoints:**
   - Unified TTS: Use marketplace to generate speech
   - Payment Breakdown: Open payment dialog in marketplace
   - Voice Registry: Register a voice on Upload page
   - Purchased Voices: Purchase a voice in marketplace

## Next Steps (Future Improvements)

1. Add authentication/authorization for backend endpoints
2. Replace JSON file storage with proper database (PostgreSQL, MongoDB)
3. Add rate limiting for API calls
4. Implement caching for frequently accessed data
5. Add blockchain query endpoint for voice metadata (integrate Aptos SDK on backend)
6. Add WebSocket support for real-time updates
7. Add analytics and logging

## Files Modified

### Backend
- `backend/server.js` - Added all new endpoints and data persistence

### Frontend
- `src/lib/api.ts` - Added new API methods
- `src/pages/Marketplace.tsx` - Updated to use backend endpoints
- `src/pages/Upload.tsx` - Updated to use unified TTS endpoint
- `src/components/voice/VoiceMarketplaceCard.tsx` - Added backend payment breakdown
- `src/components/voice/VoiceRegistrationForm.tsx` - Added backend registration

### Data Files (Auto-created)
- `backend/data/voice-registry.json`
- `backend/data/purchased-voices.json`

---

**Date:** $(date)
**Status:** ✅ Completed

