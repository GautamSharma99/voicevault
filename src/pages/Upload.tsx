import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { VoiceRegistrationForm } from "@/components/voice/VoiceRegistrationForm";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Download, Loader2, Mic2 } from "lucide-react";
import { useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";

const Upload = () => {
  // ------------------- OpenAI TTS -------------------
  const [openaiText, setOpenaiText] = useState("");
  const [openaiVoice, setOpenaiVoice] = useState("alloy");
  const [openaiLoading, setOpenaiLoading] = useState(false);
  const [openaiAudioUrl, setOpenaiAudioUrl] = useState<string | null>(null);

  // ------------------- ElevenLabs Clone -------------------
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recording, setRecording] = useState(false);
  const [cloneText, setCloneText] = useState("");
  const [cloneLoading, setCloneLoading] = useState(false);
  const [clonedUrl, setClonedUrl] = useState<string | null>(null);
  const [savedVoiceId, setSavedVoiceId] = useState<string | null>(localStorage.getItem("eleven_voice_id"));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const PROXY = import.meta.env.VITE_PROXY_URL || "http://localhost:3001";

  // ------------------- Registration Autofill -------------------
  const [autoName, setAutoName] = useState("");
  const [autoModelUri, setAutoModelUri] = useState("");

  // ------------------- Mic Record -------------------
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const file = new File([blob], "mic.wav", { type: "audio/wav" });
        setSelectedFile(file);
      };

      recorder.start();
      setRecording(true);
      toast.info("Recording started");
    } catch {
      toast.error("Mic permission denied");
    }
  };
  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    toast.info("Recording stopped");
  };

  // ------------------- OpenAI TTS -------------------
  const handleOpenAITTS = async () => {
    if (!openaiText.trim()) return toast.error("Enter text");
    setOpenaiLoading(true);
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      const r = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini-tts",
          voice: openaiVoice,
          input: openaiText,
        }),
      });

      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      setOpenaiAudioUrl(url);
      toast.success("TTS generated");
    } catch {
      toast.error("OpenAI error");
    }
    setOpenaiLoading(false);
  };

  // ------------------- ElevenLabs Clone + TTS + Autofill -------------------
  const handleClone = async () => {
    if (!cloneText.trim()) return toast.error("Enter text");
    if (!selectedFile && !savedVoiceId) return toast.error("Record first");

    setCloneLoading(true);
    try {
      let voiceId = savedVoiceId;

      if (!voiceId) {
        const base64 = await selectedFile!.arrayBuffer().then(buf =>
          btoa(String.fromCharCode(...new Uint8Array(buf)))
        );

        const cloneRes = await fetch(`${PROXY}/api/elevenlabs/clone`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `VoiceVault_${Date.now()}`,
            files: [{ base64 }],
          }),
        });

        const j = await cloneRes.json();
        if (!cloneRes.ok) throw new Error(j.error || "Clone failed");

        voiceId = j.voice_id;
        localStorage.setItem("eleven_voice_id", voiceId);
        setSavedVoiceId(voiceId);
      }

      // Auto-fill Registration ♥
      setAutoName(`VoiceVault ${voiceId.slice(0, 4)}`);
      setAutoModelUri(`eleven:${voiceId}`);

      const tts = await fetch(`${PROXY}/api/elevenlabs/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceId, text: cloneText }),
      });

      const buffer = await tts.arrayBuffer();
      const url = URL.createObjectURL(new Blob([buffer], { type: "audio/mpeg" }));
      setClonedUrl(url);

      toast.success("Cloned & Generated");
    } catch (err: any) {
      toast.error(err.message || "Clone failed");
    }
    setCloneLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>Create Voice - VoiceVault</title></Helmet>
      <Navbar />
      <main className="pt-32 pb-16">
        <div className="container max-w-5xl mx-auto px-4 space-y-16">

          {/* ------------------- OpenAI TTS ------------------- */}
          <Card>
            <CardHeader>
              <CardTitle>Text → Speech</CardTitle>
              <CardDescription>Try synthetic voices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={openaiText}
                onChange={(e) => setOpenaiText(e.target.value)}
                placeholder="Type text here"
              />
              <Button onClick={handleOpenAITTS} disabled={openaiLoading} className="w-full">
                {openaiLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                Generate Speech
              </Button>
              {openaiAudioUrl && (
                <div className="space-y-3">
                  <audio controls src={openaiAudioUrl} className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* ------------------- ElevenLabs Voice Clone ------------------- */}
          <Card>
            <CardHeader>
              <CardTitle>Clone Your Voice </CardTitle>
              <CardDescription>Record once → Generate unlimited speech</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Mic */}
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                {!recording ? (
                  <Button onClick={startRecording} className="w-full">🎤 Start Recording</Button>
                ) : (
                  <Button onClick={stopRecording} className="w-full" variant="destructive">⏹ Stop Recording</Button>
                )}
                {selectedFile && <p className="text-primary mt-2">{selectedFile.name}</p>}
              </div>

              <Label>Text to speak with your cloned voice</Label>
              <Textarea value={cloneText} onChange={(e) => setCloneText(e.target.value)} />

              <Button onClick={handleClone} disabled={cloneLoading} className="w-full">
                {cloneLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mic2 className="h-5 w-5" />}
                Clone & Generate Audio
              </Button>

              {clonedUrl && (
                <div className="space-y-3 bg-muted/40 p-6 rounded-xl">
                  <audio controls src={clonedUrl} className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* ------------------- Registration Form (AUTOFILLS) ------------------- */}
          <Card>
            <CardHeader>
              <CardTitle>Register Your Voice Model</CardTitle>
            </CardHeader>
            <CardContent>
              <VoiceRegistrationForm
                autoName={autoName}
                autoModelUri={autoModelUri}
              />
            </CardContent>
          </Card>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Upload;
