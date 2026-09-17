import { GoogleGenAI } from '@google/genai';
type VercelRequest = { method?: string; body?: any };
type VercelResponse = { status(code: number): VercelResponse; json(body: unknown): VercelResponse };

function pcmToWavBase64(pcmBase64: string, sampleRate = 24000, channels = 1, bits = 16) {
  const pcm = Buffer.from(pcmBase64, 'base64');
  const blockAlign = channels * bits / 8;
  const byteRate = sampleRate * blockAlign;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bits, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]).toString('base64');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });

  try {
    const { text, voice = 'Kore', persona, style = 'natural live DJ performance' } = req.body ?? {};
    if (!text || typeof text !== 'string') return res.status(400).json({ error: 'Text is required.' });
    if (text.length > 4000) return res.status(400).json({ error: 'Speech is too long.' });

    const ai = new GoogleGenAI({ apiKey });
    const model = process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts';
    const prompt = `Perform this as a polished professional DJ voice. Persona: ${persona || 'club DJ'}. Style: ${style}. Sound confident, warm, expressive and human. Vary pacing naturally, emphasize important words, and use tasteful excitement without shouting every sentence. Text to speak:\n${text}`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
        },
      },
    });

    const data = response.candidates?.[0]?.content?.parts?.find((part: any) => part.inlineData)?.inlineData?.data;
    if (!data) throw new Error('Gemini returned no audio.');

    return res.status(200).json({
      audioBase64: pcmToWavBase64(data),
      mimeType: 'audio/wav',
      model,
    });
  } catch (error) {
    console.error('DJ TTS generation failed', error);
    return res.status(500).json({ error: 'Voice generation failed.' });
  }
}
