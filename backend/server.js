import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: "200mb" }));

// API Keys
const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!ELEVEN_KEY) console.warn("⚠️ Missing ELEVENLABS_API_KEY - ElevenLabs will not work");
if (!OPENAI_KEY) console.warn("⚠️ Missing OPENAI_API_KEY - OpenAI TTS will not work");

// Data storage paths
const DATA_DIR = path.join(__dirname, "data");
const VOICE_REGISTRY_FILE = path.join(DATA_DIR, "voice-registry.json");
const PURCHASED_VOICES_FILE = path.join(DATA_DIR, "purchased-voices.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize data files if they don't exist
const initDataFile = (filePath, defaultValue = []) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
  }
};

initDataFile(VOICE_REGISTRY_FILE);
initDataFile(PURCHASED_VOICES_FILE);

// Helper functions for data persistence
const readJsonFile = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
};

const writeJsonFile = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
};

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

// ==================== Voice Registry Management ====================

// 7️⃣ Get all registered voices
app.get("/api/registry/voices", async (req, res) => {
  try {
    const registry = readJsonFile(VOICE_REGISTRY_FILE);
    res.json({ voices: registry });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch voice registry", message: err.message });
  }
});

// 8️⃣ Register a new voice
app.post("/api/registry/voices", async (req, res) => {
  try {
    const { address, name, walletAddress } = req.body;
    
    if (!address) return res.status(400).json({ error: "address parameter missing" });
    if (!name) return res.status(400).json({ error: "name parameter missing" });

    const registry = readJsonFile(VOICE_REGISTRY_FILE);
    
    // Check if already exists
    const exists = registry.some((entry) => entry.address === address);
    if (exists) {
      return res.status(409).json({ error: "Voice already registered", voice: registry.find(e => e.address === address) });
    }

    const newEntry = {
      address,
      name,
      walletAddress: walletAddress || null,
      registeredAt: Date.now(),
    };

    registry.push(newEntry);
    writeJsonFile(VOICE_REGISTRY_FILE, registry);

    res.json({ success: true, voice: newEntry });
  } catch (err) {
    res.status(500).json({ error: "Failed to register voice", message: err.message });
  }
});

// 9️⃣ Get voice addresses for marketplace
app.get("/api/registry/addresses", async (req, res) => {
  try {
    const registry = readJsonFile(VOICE_REGISTRY_FILE);
    const addresses = registry.map((entry) => entry.address);
    res.json({ addresses });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch voice addresses", message: err.message });
  }
});

// ==================== Purchased Voices Tracking ====================

// 🔟 Get purchased voices for a wallet
app.get("/api/purchased/voices", async (req, res) => {
  try {
    const { walletAddress } = req.query;
    const purchases = readJsonFile(PURCHASED_VOICES_FILE);
    
    // Filter by wallet if provided
    if (walletAddress) {
      const filtered = purchases.filter((p) => p.walletAddress === walletAddress);
      return res.json({ voices: filtered });
    }

    res.json({ voices: purchases });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch purchased voices", message: err.message });
  }
});

// 1️⃣1️⃣ Add purchased voice
app.post("/api/purchased/voices", async (req, res) => {
  try {
    const { voiceId, name, modelUri, owner, price, txHash, walletAddress } = req.body;
    
    if (!voiceId || !owner || !txHash || !walletAddress) {
      return res.status(400).json({ error: "Missing required fields: voiceId, owner, txHash, walletAddress" });
    }

    const purchases = readJsonFile(PURCHASED_VOICES_FILE);
    
    // Check if already purchased by this wallet
    const alreadyPurchased = purchases.some(
      (p) => p.voiceId === voiceId && p.owner === owner && p.walletAddress === walletAddress
    );

    if (alreadyPurchased) {
      return res.status(409).json({ error: "Voice already purchased by this wallet" });
    }

    const newPurchase = {
      voiceId,
      name: name || `Voice ${voiceId}`,
      modelUri: modelUri || "",
      owner,
      price: price || 0,
      purchasedAt: Date.now(),
      txHash,
      walletAddress,
    };

    purchases.push(newPurchase);
    writeJsonFile(PURCHASED_VOICES_FILE, purchases);

    res.json({ success: true, purchase: newPurchase });
  } catch (err) {
    res.status(500).json({ error: "Failed to record purchase", message: err.message });
  }
});

// 1️⃣2️⃣ Check if voice is purchased
app.get("/api/purchased/check", async (req, res) => {
  try {
    const { voiceId, owner, walletAddress } = req.query;
    
    if (!voiceId || !owner || !walletAddress) {
      return res.status(400).json({ error: "Missing required query parameters: voiceId, owner, walletAddress" });
    }

    const purchases = readJsonFile(PURCHASED_VOICES_FILE);
    const isPurchased = purchases.some(
      (p) => p.voiceId === voiceId && p.owner === owner && p.walletAddress === walletAddress
    );

    res.json({ isPurchased });
  } catch (err) {
    res.status(500).json({ error: "Failed to check purchase status", message: err.message });
  }
});

// ==================== Voice Metadata Aggregation ====================

// 1️⃣3️⃣ Get voice metadata from blockchain (requires Aptos node URL)
// This endpoint can be extended to fetch from blockchain, but for now returns metadata based on registry
app.get("/api/voices/metadata", async (req, res) => {
  try {
    const { addresses } = req.query;
    
    if (!addresses) {
      return res.status(400).json({ error: "addresses query parameter required (comma-separated)" });
    }

    const addressList = typeof addresses === "string" ? addresses.split(",") : addresses;
    
    // For now, return metadata from registry
    // In production, this should query the Aptos blockchain
    const registry = readJsonFile(VOICE_REGISTRY_FILE);
    const metadata = addressList.map((address) => {
      const entry = registry.find((e) => e.address === address);
      return entry ? {
        owner: entry.address,
        name: entry.name,
        registeredAt: entry.registeredAt,
        // Additional metadata would come from blockchain query
      } : null;
    }).filter(Boolean);

    res.json({ voices: metadata });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch voice metadata", message: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔥 Voice server running → http://localhost:${PORT}`);
  console.log(`   - ElevenLabs TTS & Voice Cloning: ${ELEVEN_KEY ? '✅' : '❌ (API key missing)'}`);
  console.log(`   - OpenAI TTS: ${OPENAI_KEY ? '✅' : '❌ (API key missing)'}`);
  console.log(`   - Voice Registry: ✅ (local storage)`);
  console.log(`   - Purchased Voices: ✅ (local storage)`);
});
