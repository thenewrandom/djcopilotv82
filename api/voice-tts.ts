export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'ELEVENLABS_API_KEY is not configured on the server.' });

  try {
    const { voiceId, text, stability = 0.45, similarityBoost = 0.8, style = 0.25, speed = 1 } = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    if (!voiceId || !text) return res.status(400).json({ error: 'voiceId and text are required.' });

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text: String(text).slice(0, 5000), model_id: 'eleven_flash_v2_5', voice_settings: { stability, similarity_boost: similarityBoost, style, speed } })
    });
    if (!response.ok) {
      const detail = await response.text();
      return res.status(response.status).json({ error: detail || 'Voice synthesis failed.' });
    }
    const audio = Buffer.from(await response.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(audio);
  } catch (error) {
    console.error('voice-tts error', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Voice synthesis failed.' });
  }
}
