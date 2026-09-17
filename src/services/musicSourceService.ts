import { Track } from '../types';

const SPOTIFY_API = 'https://api.spotify.com/v1';

function spotifyHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function spotifyGet(path: string, token: string) {
  const response = await fetch(`${SPOTIFY_API}${path}`, { headers: spotifyHeaders(token) });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.error?.message || `Spotify request failed (${response.status})`);
  }
  return response.json();
}

function spotifyTrackToTrack(item: any, index: number): Track | null {
  const t = item?.track || item;
  if (!t?.id || !t?.name) return null;
  return {
    id: `spotify-${t.id}-${index}`,
    title: t.name,
    artist: Array.isArray(t.artists) ? t.artists.map((a: any) => a?.name).filter(Boolean).join(', ') : 'Spotify Artist',
    albumCover: t.album?.images?.[0]?.url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
    audioUrl: `https://open.spotify.com/track/${t.id}`,
    bpm: 124,
    key: '8A',
    energy: 7,
    genre: 'Spotify',
    tags: ['spotify', 'connected', 'metadata']
  };
}

export async function fetchSpotifyCrate(token: string, maxTracks = 100): Promise<{ tracks: Track[]; playlists: string[] }> {
  const playlistsResponse = await spotifyGet('/me/playlists?limit=50', token);
  const playlists = (playlistsResponse.items || []).map((p: any) => p?.name).filter(Boolean).slice(0, 50);
  const tracks: Track[] = [];

  // Pull the user's saved library first.
  const saved = await spotifyGet('/me/tracks?limit=50', token);
  (saved.items || []).forEach((item: any, index: number) => {
    const mapped = spotifyTrackToTrack(item, index);
    if (mapped) tracks.push(mapped);
  });

  // Then add tracks from the first few user playlists without making an excessive number of calls.
  for (const playlist of (playlistsResponse.items || []).slice(0, 5)) {
    if (tracks.length >= maxTracks) break;
    if (!playlist?.id) continue;
    try {
      const page = await spotifyGet(`/playlists/${encodeURIComponent(playlist.id)}/items?limit=50`, token);
      (page.items || []).forEach((item: any, index: number) => {
        if (tracks.length >= maxTracks) return;
        const mapped = spotifyTrackToTrack(item, index);
        if (mapped && !tracks.some(existing => existing.id === mapped.id)) tracks.push(mapped);
      });
    } catch (error) {
      console.warn('Could not read Spotify playlist', playlist?.name, error);
    }
  }

  return { tracks: tracks.slice(0, maxTracks), playlists };
}

export async function getSpotifyProfile(token: string) {
  return spotifyGet('/me', token);
}

let musicKitPromise: Promise<any> | null = null;

function loadMusicKit(): Promise<any> {
  if ((window as any).MusicKit) return Promise.resolve((window as any).MusicKit);
  if (musicKitPromise) return musicKitPromise;
  musicKitPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-djcopilot-musickit]') as HTMLScriptElement | null;
    const script = existing || document.createElement('script');
    if (!existing) {
      script.src = 'https://js-cdn.music.apple.com/musickit/v3/musickit.js';
      script.async = true;
      script.dataset.djcopilotMusickit = 'true';
      document.head.appendChild(script);
    }
    script.addEventListener('load', () => resolve((window as any).MusicKit), { once: true });
    script.addEventListener('error', () => reject(new Error('Apple MusicKit could not be loaded.')), { once: true });
  });
  return musicKitPromise;
}

export async function authorizeAppleMusic(): Promise<{ musicKit: any; musicUserToken: string }> {
  const developerToken = (import.meta.env.VITE_APPLE_MUSIC_DEVELOPER_TOKEN || import.meta.env.APPLE_MUSIC_DEVELOPER_TOKEN) as string | undefined;
  if (!developerToken) {
    throw new Error('Apple Music developer token is not configured. Add VITE_APPLE_MUSIC_DEVELOPER_TOKEN in Vercel.');
  }
  const MusicKit = await loadMusicKit();
  MusicKit.configure({ developerToken, app: { name: 'DJ Copilot AI Pro', build: '1.0.0' } });
  const music = MusicKit.getInstance();
  const token = await music.authorize();
  if (!token) throw new Error('Apple Music authorization did not return a user token.');
  return { musicKit: music, musicUserToken: token };
}

export async function fetchAppleMusicLibrary(musicKit: any, maxTracks = 100): Promise<Track[]> {
  // MusicKit JS exposes the personalized library through the Music API.
  const response = await musicKit.api.library.songs({ limit: Math.min(maxTracks, 100) });
  const items = response?.data || response?.results?.data || [];
  return items.slice(0, maxTracks).map((song: any, index: number): Track => ({
    id: `apple-${song.id || index}`,
    title: song.attributes?.name || 'Apple Music Track',
    artist: song.attributes?.artistName || 'Apple Music Artist',
    albumCover: song.attributes?.artwork?.url?.replace('{w}', '500').replace('{h}', '500') || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&auto=format&fit=crop&q=80',
    audioUrl: song.attributes?.url || `https://music.apple.com/us/song/${song.id}`,
    bpm: 124,
    key: '8A',
    energy: 7,
    genre: song.attributes?.genreNames?.[0] || 'Apple Music',
    tags: ['apple-music', 'connected', 'metadata']
  }));
}
