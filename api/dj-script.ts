import { GoogleGenAI } from '@google/genai';
type VercelRequest = { method?: string; body?: any };
type VercelResponse = { status(code: number): VercelResponse; json(body: unknown): VercelResponse };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });

  try {
    const { config, setlist, persona } = req.body ?? {};
    if (!Array.isArray(setlist) || !persona) return res.status(400).json({ error: 'Invalid DJ request.' });

    const ai = new GoogleGenAI({ apiKey });
    const model = process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-pro';
    const guest = config?.guestOfHonor ? `VIP ${config.guestOfHonor}` : 'the crowd';
    const prompt = `
You are DJ ${persona.name}, a professional live club/festival DJ and radio host.
Persona: ${persona.bio}
Genre: ${persona.genre}
Mood: ${persona.mood}
Event: ${config?.partyType || 'live party'}
Overall vibe: ${config?.mood || 'high energy'}
Interaction level: ${config?.interactionLevel ?? 6}/10
VIP/shoutout: ${guest}

Write an authentic, natural-sounding DJ performance script. It should feel spontaneous, confident and human when spoken aloud, not like an AI assistant. Use short sentences, contractions, tasteful ad-libs, rhythmic phrasing and occasional stage directions in parentheses only when useful. Never claim you can see a crowd unless the user supplied that information.

SETLIST:
${setlist.map((t: any, i: number) => `${i + 1}. ${t.title} — ${t.artist} | ${t.genre} | ${t.bpm} BPM | key ${t.key} | energy ${t.energy}/10`).join('\n')}

Return JSON only with exactly:
{
  "intro": "...",
  "interstitials": ["..."],
  "outro": "..."
}
There must be exactly ${Math.max(0, setlist.length - 1)} interstitials. Keep each interstitial under 45 words.
`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: 'application/json', temperature: 0.9 },
    });

    const text = response.text?.trim();
    if (!text) throw new Error('Gemini returned no script.');
    const parsed = JSON.parse(text);
    if (!parsed.intro || !Array.isArray(parsed.interstitials) || !parsed.outro) throw new Error('Invalid script format.');

    return res.status(200).json({
      intro: parsed.intro,
      interstitials: parsed.interstitials.slice(0, Math.max(0, setlist.length - 1)),
      outro: parsed.outro,
      model,
    });
  } catch (error) {
    console.error('DJ script generation failed', error);
    return res.status(500).json({ error: 'DJ AI generation failed.' });
  }
}
