// Backend API Configuration
const getBackendUrl = () => {
  const envUrl = import.meta.env.VITE_PROXY_URL || import.meta.env.VITE_API_URL;
  const defaultUrl = 'http://localhost:3000';
  const url = envUrl || defaultUrl;
  console.log('[API Config] Backend URL:', url, { envUrl, defaultUrl });
  return url;
};

export const BACKEND_CONFIG = {
  get BASE_URL() {
    return getBackendUrl();
  },
  ENDPOINTS: {
    // ElevenLabs TTS & Voice Cloning
    ELEVENLABS_VOICES: '/api/elevenlabs/voices',
    ELEVENLABS_SPEAK: '/api/elevenlabs/speak',
    ELEVENLABS_CLONE: '/api/elevenlabs/clone',
    // OpenAI TTS
    OPENAI_SPEAK: '/api/openai/speak',
    // Unified TTS (handles both ElevenLabs and OpenAI)
    UNIFIED_TTS: '/api/tts/generate',
    // Payment
    PAYMENT_BREAKDOWN: '/api/payment/breakdown',
    // Voice Registry
    REGISTRY_VOICES: '/api/registry/voices',
    REGISTRY_REGISTER: '/api/registry/voices',
    REGISTRY_ADDRESSES: '/api/registry/addresses',
    // Purchased Voices
    PURCHASED_VOICES: '/api/purchased/voices',
    PURCHASED_ADD: '/api/purchased/voices',
    PURCHASED_CHECK: '/api/purchased/check',
    // Voice Metadata
    VOICES_METADATA: '/api/voices/metadata',
  },
};

/**
 * Convert File to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
}

/**
 * Backend API client for voice operations (ElevenLabs TTS & Voice Cloning)
 */
export const backendApi = {
  /**
   * Get available ElevenLabs voices
   * @returns List of available voices
   */
  async getElevenLabsVoices(): Promise<{ voices: Array<{ voice_id: string; name: string }> }> {
    const response = await fetch(`${BACKEND_CONFIG.BASE_URL}${BACKEND_CONFIG.ENDPOINTS.ELEVENLABS_VOICES}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || 'Failed to fetch voices' };
      }
      throw new Error(errorData.error || errorData.message || 'Failed to fetch voices');
    }

    return response.json();
  },

  /**
   * Generate speech using ElevenLabs TTS
   * @param voiceId ElevenLabs voice ID
   * @param text Text to convert to speech
   * @returns Audio blob (MP3)
   */
  async generateElevenLabsSpeech(voiceId: string, text: string): Promise<Blob> {
    const url = `${BACKEND_CONFIG.BASE_URL}${BACKEND_CONFIG.ENDPOINTS.ELEVENLABS_SPEAK}`;
    console.log('[API] Generating ElevenLabs speech:', { url, voiceId, textLength: text.length });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voiceId, text }),
    });

    console.log('[API] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Error response:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || `TTS generation failed (${response.status})` };
      }
      throw new Error(errorData.detail?.message || errorData.error || errorData.message || `TTS generation failed: ${response.status} ${response.statusText}`);
    }

    return response.blob();
  },

  /**
   * Clone a voice using ElevenLabs API via backend
   * @param name Voice name
   * @param files Array of audio files to clone from
   * @returns Voice ID from ElevenLabs
   */
  async cloneVoice(name: string, files: File[]): Promise<{ voice_id: string }> {
    const url = `${BACKEND_CONFIG.BASE_URL}${BACKEND_CONFIG.ENDPOINTS.ELEVENLABS_CLONE}`;
    console.log('[API] Cloning voice:', { url, name, fileCount: files.length });
    
    const base64Files = await Promise.all(files.map(file => fileToBase64(file)));

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        files: base64Files.map(base64 => ({ base64 })),
      }),
    });

    console.log('[API] Clone response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Clone error response:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || 'Clone failed' };
      }
      throw new Error(errorData.error || errorData.message || errorData.detail?.message || 'Voice cloning failed');
    }

    const result = await response.json();
    console.log('[API] Voice cloned successfully:', result.voice_id);
    return result;
  },

  /**
   * Generate speech using unified TTS endpoint (handles both ElevenLabs and OpenAI)
   * @param modelUri Model URI (e.g., "eleven:voiceId" or "openai:voiceId")
   * @param text Text to convert to speech
   * @returns Audio blob
   */
  async generateTTS(modelUri: string, text: string): Promise<Blob> {
    const url = `${BACKEND_CONFIG.BASE_URL}${BACKEND_CONFIG.ENDPOINTS.UNIFIED_TTS}`;
    console.log('[API] Generating TTS with unified endpoint:', { url, modelUri, textLength: text.length });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelUri, text }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Unified TTS error:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || 'TTS generation failed' };
      }
      throw new Error(errorData.error || errorData.message || 'TTS generation failed');
    }

    return response.blob();
  },

  /**
   * Generate speech using OpenAI TTS
   * @param voice OpenAI voice ID (alloy, echo, fable, onyx, nova, shimmer)
   * @param text Text to convert to speech
   * @param model Model to use (default: tts-1)
   * @returns Audio blob
   */
  async generateOpenAISpeech(voice: string, text: string, model: string = 'tts-1'): Promise<Blob> {
    const url = `${BACKEND_CONFIG.BASE_URL}${BACKEND_CONFIG.ENDPOINTS.OPENAI_SPEAK}`;
    console.log('[API] Generating OpenAI speech:', { url, voice, textLength: text.length });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voice, text, model }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] OpenAI TTS error:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || 'OpenAI TTS generation failed' };
      }
      throw new Error(errorData.error || errorData.message || 'OpenAI TTS generation failed');
    }

    return response.blob();
  },

  /**
   * Calculate payment breakdown
   * @param amount Amount in APT
   * @returns Payment breakdown with fees
   */
  async getPaymentBreakdown(amount: number) {
    const url = `${BACKEND_CONFIG.BASE_URL}${BACKEND_CONFIG.ENDPOINTS.PAYMENT_BREAKDOWN}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to calculate payment breakdown');
    }

    return response.json();
  },

  /**
   * Get all registered voices from registry
   */
  async getRegisteredVoices() {
    const url = `${BACKEND_CONFIG.BASE_URL}${BACKEND_CONFIG.ENDPOINTS.REGISTRY_VOICES}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch registered voices');
    }

    return response.json();
  },

  /**
   * Register a voice in the registry
   */
  async registerVoice(address: string, name: string, walletAddress?: string) {
    const url = `${BACKEND_CONFIG.BASE_URL}${BACKEND_CONFIG.ENDPOINTS.REGISTRY_REGISTER}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, name, walletAddress }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      throw new Error(errorData.error || 'Failed to register voice');
    }

    return response.json();
  },

  /**
   * Get voice addresses from registry
   */
  async getVoiceAddresses() {
    const url = `${BACKEND_CONFIG.BASE_URL}${BACKEND_CONFIG.ENDPOINTS.REGISTRY_ADDRESSES}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch voice addresses');
    }

    const data = await response.json();
    return data.addresses || [];
  },

  /**
   * Get purchased voices for a wallet
   */
  async getPurchasedVoices(walletAddress?: string) {
    const url = `${BACKEND_CONFIG.BASE_URL}${BACKEND_CONFIG.ENDPOINTS.PURCHASED_VOICES}${walletAddress ? `?walletAddress=${walletAddress}` : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch purchased voices');
    }

    return response.json();
  },

  /**
   * Add a purchased voice
   */
  async addPurchasedVoice(voice: {
    voiceId: string;
    name: string;
    modelUri: string;
    owner: string;
    price: number;
    txHash: string;
    walletAddress: string;
  }) {
    const url = `${BACKEND_CONFIG.BASE_URL}${BACKEND_CONFIG.ENDPOINTS.PURCHASED_ADD}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(voice),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      throw new Error(errorData.error || 'Failed to record purchase');
    }

    return response.json();
  },

  /**
   * Check if a voice is purchased by a wallet
   */
  async checkVoicePurchased(voiceId: string, owner: string, walletAddress: string) {
    const url = `${BACKEND_CONFIG.BASE_URL}${BACKEND_CONFIG.ENDPOINTS.PURCHASED_CHECK}?voiceId=${voiceId}&owner=${owner}&walletAddress=${walletAddress}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to check purchase status');
    }

    return response.json();
  },
};
