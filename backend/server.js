import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import FormData from "form-data";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Get the directory of the current file (backend/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root (one level up from backend/)
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });
const app = express();
app.use(cors());
app.use(express.json({ limit: "200mb" }));

// API Keys
const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!ELEVEN_KEY) console.warn("⚠️ Missing ELEVENLABS_API_KEY");
if (!OPENAI_KEY) console.warn("⚠️ Missing OPENAI_API_KEY");

// ==================== ElevenLabs TTS ====================

// 1️⃣ Get available ElevenLabs voices
app.get("/api/elevenlabs/voices", async (req, res) => {
  try {
    if (!ELEVEN_KEY) {
      return res.status(500).json({ error: "ElevenLabs API key not configured" });
    }

    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      method: "GET",
      headers: { "xi-api-key": ELEVEN_KEY },
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).send(text);
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch voices", message: err.message });
  }
});

// 2️⃣ TTS with ElevenLabs voice
app.post("/api/elevenlabs/speak", async (req, res) => {
  try {
    if (!ELEVEN_KEY) {
      return res.status(500).json({ error: "ElevenLabs API key not configured" });
    }

    const { voiceId, text } = req.body;
    if (!voiceId) return res.status(400).json({ error: "voiceId missing" });
    if (!text) return res.status(400).json({ error: "text missing" });

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: { "xi-api-key": ELEVEN_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.85 }
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).send(text);
    }

    const audio = await response.arrayBuffer();
    res.set("Content-Type", "audio/mpeg");
    res.send(Buffer.from(audio));
  } catch (err) {
    res.status(500).json({ error: "TTS failed", message: err.message });
  }
});

// ==================== ElevenLabs Voice Cloning ====================

// 3️⃣ Clone voice using ElevenLabs
app.post("/api/elevenlabs/clone", async (req, res) => {
  try {
    if (!ELEVEN_KEY) {
      return res.status(500).json({ error: "ElevenLabs API key not configured" });
    }

    const { name, files } = req.body;
    if (!files?.length) return res.status(400).json({ error: "No audio provided" });

    const form = new FormData();
    form.append("name", name);
    files.forEach((f, i) => form.append("files", Buffer.from(f.base64, "base64"), `sample${i}.wav`));

    const cloneRes = await fetch("https://api.elevenlabs.io/v1/voices/add", {
      method: "POST",
      headers: { "xi-api-key": ELEVEN_KEY },
      body: form,
    });

    const text = await cloneRes.text();
    if (!cloneRes.ok) return res.status(cloneRes.status).send(text);

    const data = JSON.parse(text);
    res.json({ voice_id: data.voice_id });
  } catch (err) {
    res.status(500).json({ error: "Clone failed", message: err.message });
  }
});

// ==================== OpenAI TTS ====================

// 4️⃣ Generate TTS using OpenAI
app.post("/api/openai/speak", async (req, res) => {
  try {
    if (!OPENAI_KEY) {
      return res.status(500).json({ error: "OpenAI API key not configured" });
    }

    const { voice, text, model } = req.body;
    if (!voice) return res.status(400).json({ error: "voice parameter missing" });
    if (!text) return res.status(400).json({ error: "text parameter missing" });

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || "tts-1",
        voice: voice,
        input: text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: "TTS generation failed", details: errorText });
    }

    const audio = await response.arrayBuffer();
    res.set("Content-Type", "audio/mpeg");
    res.send(Buffer.from(audio));
  } catch (err) {
    res.status(500).json({ error: "TTS failed", message: err.message });
  }
});

// ==================== Unified TTS Endpoint ====================

// 5️⃣ Unified TTS endpoint that handles different voice providers based on model URI
app.post("/api/tts/generate", async (req, res) => {
  try {
    const { modelUri, text } = req.body;
    
    if (!modelUri) return res.status(400).json({ error: "modelUri parameter missing" });
    if (!text) return res.status(400).json({ error: "text parameter missing" });

    // Parse model URI to determine provider
    if (modelUri.startsWith("eleven:")) {
      // ElevenLabs voice
      const voiceId = modelUri.replace("eleven:", "");
      if (!ELEVEN_KEY) {
        return res.status(500).json({ error: "ElevenLabs API key not configured" });
      }

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: { "xi-api-key": ELEVEN_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.85 }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ error: "ElevenLabs TTS failed", details: errorText });
      }

      const audio = await response.arrayBuffer();
      res.set("Content-Type", "audio/mpeg");
      res.send(Buffer.from(audio));
      
    } else if (modelUri.startsWith("openai:")) {
      // OpenAI voice
      const voiceId = modelUri.replace("openai:", "");
      if (!OPENAI_KEY) {
        return res.status(500).json({ error: "OpenAI API key not configured" });
      }

      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "tts-1",
          voice: voiceId,
          input: text,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ error: "OpenAI TTS failed", details: errorText });
      }

      const audio = await response.arrayBuffer();
      res.set("Content-Type", "audio/mpeg");
      res.send(Buffer.from(audio));
      
    } else {
      return res.status(400).json({ error: "Unsupported model URI format. Use 'eleven:' or 'openai:' prefix" });
    }
  } catch (err) {
    res.status(500).json({ error: "TTS generation failed", message: err.message });
  }
});

// ==================== Payment Breakdown Calculation ====================

// 6️⃣ Calculate payment breakdown (platform fee, royalty, creator amount)
app.post("/api/payment/breakdown", async (req, res) => {
  try {
    const { amount } = req.body; // Amount in APT
    
    if (typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount. Must be a positive number" });
    }

    // Convert APT to Octas (1 APT = 100,000,000 Octas)
    const amountInOctas = Math.floor(amount * 100_000_000);
    
    // Fixed platform fee: 2.5% (250 basis points)
    const platformFee = Math.floor((amountInOctas * 250) / 10_000);
    const remainingAfterPlatform = amountInOctas - platformFee;
    
    // Fixed royalty: 10% (1000 basis points)
    const royaltyAmount = Math.floor((remainingAfterPlatform * 1000) / 10_000);
    const creatorAmount = remainingAfterPlatform - royaltyAmount;

    // Convert back to APT for response
    const PLATFORM_FEE_BPS = 250;
    const ROYALTY_BPS = 1000;

    res.json({
      totalAmount: amount,
      totalAmountOctas: amountInOctas,
      breakdown: {
        platformFee: {
          amount: platformFee / 100_000_000,
          amountOctas: platformFee,
          percentage: 2.5,
          basisPoints: PLATFORM_FEE_BPS,
        },
        royalty: {
          amount: royaltyAmount / 100_000_000,
          amountOctas: royaltyAmount,
          percentage: 10,
          basisPoints: ROYALTY_BPS,
        },
        creator: {
          amount: creatorAmount / 100_000_000,
          amountOctas: creatorAmount,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to calculate payment breakdown", message: err.message });
  }
});

// ==================== Voice Metadata from Blockchain ====================
// Note: Voice registry is stored on Aptos blockchain (contract2)
// This endpoint can query blockchain directly if needed (future enhancement)
// For now, frontend queries blockchain directly using useVoiceMetadata hook

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔥 Voice server running → http://localhost:${PORT}`);
  console.log(`   - ElevenLabs TTS & Voice Cloning: ${ELEVEN_KEY ? '✅' : '❌ (API key missing)'}`);
  console.log(`   - OpenAI TTS: ${OPENAI_KEY ? '✅' : '❌ (API key missing)'}`);
});
