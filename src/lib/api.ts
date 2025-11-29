// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  ENDPOINTS: {
    TTS: '/tts',
    CLONE: '/clone',
  },
};

// API Helper functions
export const apiClient = {
  async tts(text: string, speaker: string): Promise<Blob> {
    const formData = new FormData();
    formData.append('text', text);
    formData.append('speaker', speaker);

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TTS}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'TTS generation failed' }));
      throw new Error(error.error || 'TTS generation failed');
    }

    return response.blob();
  },

  async cloneVoice(file: File): Promise<{ message: string; id: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CLONE}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Voice cloning failed');
    }

    return response.json();
  },
};
