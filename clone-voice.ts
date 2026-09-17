type VercelRequest = AsyncIterable<Uint8Array> & {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
};
type VercelResponse = {
  status(code: number): VercelResponse;
  json(body: unknown): VercelResponse;
  setHeader(name: string, value: string): void;
  send(body: Buffer): VercelResponse;
};
export const config = { api: { bodyParser: false } };

type Part = { name: string; filename?: string; contentType?: string; data: Buffer };

async function readBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function parseMultipart(body: Buffer, contentType: string): Part[] {
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!match) throw new Error('Invalid multipart boundary.');
  const boundary = Buffer.from(`--${match[1] || match[2]}`);
  const parts: Part[] = [];
  let cursor = 0;

  while (cursor < body.length) {
    const start = body.indexOf(boundary, cursor);
    if (start < 0) break;
    const partStart = start + boundary.length;
    if (body.slice(partStart, partStart + 2).toString() === '--') break;
    const headerStart = partStart + 2;
    const headerEnd = body.indexOf(Buffer.from('\r\n\r\n'), headerStart);
    if (headerEnd < 0) break;
    const headers = body.slice(headerStart, headerEnd).toString('utf8');
    const nextBoundary = body.indexOf(boundary, headerEnd + 4);
    if (nextBoundary < 0) break;
    const dataEnd = nextBoundary - 2;
    const disposition = headers.match(/content-disposition:\s*form-data;\s*([^\r\n]+)/i)?.[1] || '';
    const name = disposition.match(/name="([^"]+)"/i)?.[1];
    if (!name) { cursor = nextBoundary; continue; }
    const filename = disposition.match(/filename="([^"]*)"/i)?.[1];
    const contentTypeMatch = headers.match(/content-type:\s*([^\r\n]+)/i);
    parts.push({ name, filename, contentType: contentTypeMatch?.[1]?.trim(), data: body.slice(headerEnd + 4, dataEnd) });
    cursor = nextBoundary;
  }
  return parts;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'ELEVENLABS_API_KEY is not configured on the server.' });

  try {
    const body = await readBody(req);
    const contentType = String(req.headers['content-type'] || '');
    const parts = parseMultipart(body, contentType);
    const value = (name: string) => parts.find(p => p.name === name)?.data.toString('utf8') || '';
    const name = value('name').trim();
    const description = value('description') || 'Personal DJ voice clone';
    const consent = value('consent') === 'true';
    const file = parts.find(p => p.name === 'file' && p.filename);

    if (!consent) return res.status(400).json({ error: 'You must confirm that this is your own voice and that you have permission to clone it.' });
    if (!name) return res.status(400).json({ error: 'Voice name is required.' });
    if (!file) return res.status(400).json({ error: 'A voice recording or audio file is required.' });
    if (file.data.length > 25 * 1024 * 1024) return res.status(413).json({ error: 'Please use an audio sample under 25 MB.' });

    const upstream = new FormData();
    upstream.append('name', name);
    upstream.append('description', description.slice(0, 1000));
    upstream.append('files[]', new Blob([file.data], { type: file.contentType || 'audio/webm' }), file.filename || 'voice-sample.webm');

    const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: { 'xi-api-key': apiKey },
      body: upstream
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.voice_id) {
      return res.status(response.status || 502).json({ error: data.detail?.message || data.detail || data.error || 'Voice cloning failed.' });
    }
    return res.status(200).json({ voiceId: data.voice_id, name, provider: 'elevenlabs' });
  } catch (error) {
    console.error('clone-voice error', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Voice cloning failed.' });
  }
}
