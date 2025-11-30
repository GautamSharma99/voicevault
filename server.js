import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import FormData from "form-data";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: "200mb" }));

const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY;
if (!ELEVEN_KEY) throw new Error("Missing ELEVENLABS_API_KEY");

// 1️⃣ Clone voice
app.post("/api/elevenlabs/clone", async (req, res) => {
  try {
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

// 2️⃣ TTS with voiceId
app.post("/api/elevenlabs/speak", async (req, res) => {
  try {
    const { voiceId, text } = req.body;
    if (!voiceId) return res.status(400).json({ error: "voiceId missing" });

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: { "xi-api-key": ELEVEN_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.85 }
      }),
    });

    const audio = await response.arrayBuffer();
    res.set("Content-Type", "audio/mpeg");
    res.send(Buffer.from(audio));
  } catch (err) {
    res.status(500).json({ error: "TTS failed", message: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🔥 ElevenLabs server running → http://localhost:${PORT}`));
