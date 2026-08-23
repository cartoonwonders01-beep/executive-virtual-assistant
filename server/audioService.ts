import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export async function transcribeAudioFile(
  filePath: string, 
  originalName?: string,
  customGroqKey?: string
): Promise<string> {
  const apiKey = customGroqKey || process.env.GROQ_API_KEY;

  // If Groq API Key is present, execute high-speed Groq Whisper transcription (whisper-large-v3-turbo)
  if (apiKey && fs.existsSync(filePath)) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const ext = path.extname(filePath) || '.webm';
      const filename = originalName || `voice_recording${ext}`;
      
      const blob = new Blob([fileBuffer], { type: ext === '.mp4' ? 'audio/mp4' : 'audio/webm' });
      const formData = new FormData();
      formData.append('file', blob, filename);
      formData.append('model', 'whisper-large-v3-turbo');
      formData.append('response_format', 'json');
      formData.append('temperature', '0.0');

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json() as { text: string };
        if (data.text && data.text.trim().length > 0) {
          console.log(`⚡ [Groq Whisper] Transcribed: "${data.text.trim()}"`);
          return data.text.trim();
        }
      } else {
        const errText = await response.text();
        console.warn(`Groq Whisper returned status ${response.status}: ${errText}`);
      }
    } catch (err) {
      console.error('Groq Whisper API call failed:', err);
    }
  }

  // If Gemini API Key is present in environment, try Gemini multimodal transcription
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && fs.existsSync(filePath)) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const base64Audio = fileBuffer.toString('base64');
      const ext = path.extname(filePath) || '.webm';
      const mimeType = ext === '.mp4' ? 'audio/mp4' : 'audio/webm';

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const gemResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "Accurately transcribe every spoken word in this audio. Return ONLY the raw transcript text with no extra commentary." },
              { inline_data: { mime_type: mimeType, data: base64Audio } }
            ]
          }]
        })
      });

      if (gemResponse.ok) {
        const gemData = await gemResponse.json();
        const transcript = gemData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (transcript) {
          console.log(`🧠 [Gemini Audio] Transcribed: "${transcript}"`);
          return transcript;
        }
      }
    } catch (gErr) {
      console.error('Gemini audio transcription error:', gErr);
    }
  }

  // Return empty string if no cloud transcriber configured (client will rely on browser Web Speech API)
  return "";
}
