import React, { useEffect, useRef, useState } from 'react';
import { 
  Settings, Music, Folder, Mic2, Sliders, Check, FileText, 
  Loader, Sparkles, Zap, Coffee, Mic, Disc, Cpu, Volume2,
  Database, Plus, Link as LinkIcon, X, HelpCircle, ShieldAlert
} from 'lucide-react';
import { PartyConfig, MusicSource, Track } from '../types';
import { PERSONAS } from '../data/personas';
import { soundFx } from '../utils/audioEffects';
import { VoiceTextInput } from './VoiceTextInput';
import { authorizeAppleMusic, fetchAppleMusicLibrary, fetchSpotifyCrate, getSpotifyProfile } from '../services/musicSourceService';

interface DashboardViewProps {
  config: PartyConfig;
  setConfig: React.Dispatch<React.SetStateAction<PartyConfig>>;
  onGenerate: () => void;
  isLoading: boolean;
  onAddCustomTrack: (track: Track) => void;
  onAddTracks: (tracks: Track[]) => void;
  userPersonas: Array<import('../types').Persona>;
  setUserPersonas: React.Dispatch<React.SetStateAction<Array<import('../types').Persona>>>;
}

const ICON_MAP: Record<string, React.FC<{ className?: string; size?: number }>> = {
  Zap: Zap,
  Coffee: Coffee,
  Mic: Mic,
  Disc: Disc,
  Cpu: Cpu,
  Music: Music
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  config,
  setConfig,
  onGenerate,
  isLoading,
  onAddCustomTrack,
  onAddTracks,
  userPersonas,
  setUserPersonas
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customArtist, setCustomArtist] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customBpm, setCustomBpm] = useState('125');
  const [authNotification, setAuthNotification] = useState<string | null>(null);
  const [authProvider, setAuthProvider] = useState<MusicSource | null>(null);
  const [connectedAccount, setConnectedAccount] = useState<Record<string, string>>(() => { try { return JSON.parse(localStorage.getItem('djcopilot_connected_accounts') || '{}'); } catch { return {}; } });
  const [isConnectingMusic, setIsConnectingMusic] = useState(false);
  const [showVoiceClone, setShowVoiceClone] = useState(false);
  const [voiceName, setVoiceName] = useState('');
  const [voiceDescription, setVoiceDescription] = useState('My personal DJ voice');
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isCloningVoice, setIsCloningVoice] = useState(false);
  const [voiceCloneError, setVoiceCloneError] = useState<string | null>(null);
  const [voiceConsent, setVoiceConsent] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data?.type !== 'djcopilot:spotify-auth') return;
      if (event.data.ok) {
        const token = localStorage.getItem('spotify_access_token');
        setIsConnectingMusic(true);
        Promise.all([token ? fetchSpotifyCrate(token, 100) : Promise.resolve({ tracks: [], playlists: [] }), token ? getSpotifyProfile(token) : Promise.resolve(null)])
          .then(([crate, profile]) => {
            onAddTracks(crate.tracks.map(t => ({ ...t, source: 'Spotify' as MusicSource, externalUrl: t.audioUrl })));
            if (!config.sources.includes('Spotify')) toggleSource('Spotify');
            const name = profile?.display_name || profile?.id || 'Spotify account';
            const next = { ...connectedAccount, Spotify: name };
            setConnectedAccount(next);
            localStorage.setItem('djcopilot_connected_accounts', JSON.stringify(next));
            setAuthProvider(null);
            setAuthNotification(`Spotify connected — ${crate.tracks.length} songs imported from your library/playlists.`);
          })
          .catch(err => setAuthNotification(`Spotify connected, but songs could not be imported: ${err instanceof Error ? err.message : 'Unknown error'}`))
          .finally(() => setIsConnectingMusic(false));
      } else {
        setAuthNotification(`Spotify authorization failed: ${event.data.error || 'Unknown error'}`);
      }
      setTimeout(() => setAuthNotification(null), 4000);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [config.sources]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');
    if (!code && !error) return;
    const verifier = localStorage.getItem('spotify_code_verifier');
    const opener = window.opener;
    if (!opener) return;
    if (error || !verifier) {
      opener.postMessage({ type: 'djcopilot:spotify-auth', ok: false, error: error || 'Missing PKCE verifier' }, window.location.origin);
      window.close();
      return;
    }
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string | undefined;
    const redirectUri = `${window.location.origin}/auth/spotify/callback`;
    fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: clientId || '', grant_type: 'authorization_code', code, redirect_uri: redirectUri, code_verifier: verifier })
    }).then(r => r.json()).then(data => {
      if (data.access_token) {
        localStorage.setItem('spotify_access_token', data.access_token);
        if (data.refresh_token) localStorage.setItem('spotify_refresh_token', data.refresh_token);
        opener.postMessage({ type: 'djcopilot:spotify-auth', ok: true }, window.location.origin);
      } else {
        opener.postMessage({ type: 'djcopilot:spotify-auth', ok: false, error: data.error_description || data.error || 'Token exchange failed' }, window.location.origin);
      }
      window.close();
    }).catch(err => {
      opener.postMessage({ type: 'djcopilot:spotify-auth', ok: false, error: err instanceof Error ? err.message : 'Token exchange failed' }, window.location.origin);
      window.close();
    });
  }, []);

  const toggleSource = (src: MusicSource) => {
    setConfig(prev => ({
      ...prev,
      sources: prev.sources.includes(src) 
        ? prev.sources.filter(s => s !== src) 
        : [...prev.sources, src]
    }));
  };

  const handleSourceClick = (src: MusicSource) => {
    soundFx.playLaser();
    if (config.sources.includes(src)) {
      toggleSource(src);
      return;
    }

    if (src === 'Spotify' || src === 'Apple Music' || src === 'iTunes' || src === 'Local Drive') {
      setAuthProvider(src);
      return;
    }

    toggleSource(src);
  };

  const startSpotifyLogin = () => {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string | undefined;
    if (!clientId) {
      setAuthNotification('Spotify Client ID is not configured yet. Add VITE_SPOTIFY_CLIENT_ID in Vercel Environment Variables.');
      return;
    }
    const redirectUri = `${window.location.origin}/auth/spotify/callback`;
    const verifier = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)).then(hash => {
      const bytes = new Uint8Array(hash);
      let binary = ''; bytes.forEach(b => binary += String.fromCharCode(b));
      const challenge = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      localStorage.setItem('spotify_code_verifier', verifier);
      const params = new URLSearchParams({ response_type: 'code', client_id: clientId, redirect_uri: redirectUri, code_challenge_method: 'S256', code_challenge: challenge, scope: 'user-read-private user-read-email user-library-read playlist-read-private streaming' });
      const popup = window.open(`https://accounts.spotify.com/authorize?${params.toString()}`, 'djcopilot-spotify-login', 'width=520,height=760,resizable=yes,scrollbars=yes');
      if (!popup) setAuthNotification('Your browser blocked the Spotify login popup. Please allow popups for DJ Copilot.');
    });
  };

  const finishProviderConnection = async () => {
    if (!authProvider) return;
    if (authProvider === 'Local Drive') {
      fileInputRef.current?.click();
      setAuthProvider(null);
      return;
    }
    if (authProvider === 'Spotify') {
      startSpotifyLogin();
      return;
    }
    setIsConnectingMusic(true);
    try {
      // Apple Music and legacy iTunes access use the same Apple Music/MusicKit authorization.
      // Open Apple's music site in a separate browser window as requested, then authorize this app.
      window.open('https://music.apple.com/', 'djcopilot-apple-music', 'width=520,height=760,resizable=yes,scrollbars=yes');
      const { musicKit, musicUserToken } = await authorizeAppleMusic();
      localStorage.setItem('apple_music_user_token', musicUserToken);
      const tracks = await fetchAppleMusicLibrary(musicKit, 100);
      const provider = authProvider;
      onAddTracks(tracks.map(t => ({ ...t, source: provider, externalUrl: t.audioUrl })));
      if (!config.sources.includes(provider)) toggleSource(provider);
      const next = { ...connectedAccount, [provider]: 'Apple Music account' };
      setConnectedAccount(next);
      localStorage.setItem('djcopilot_connected_accounts', JSON.stringify(next));
      setAuthProvider(null);
      setAuthNotification(`${provider} connected — ${tracks.length} songs imported into your crate.`);
    } catch (error) {
      setAuthNotification(`${authProvider} connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsConnectingMusic(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (!config.sources.includes('Local Drive')) {
        toggleSource('Local Drive');
      }
      Array.from(e.target.files).forEach((file: File, idx: number) => {
        const url = URL.createObjectURL(file);
        onAddCustomTrack({
          id: `local-${Date.now()}-${idx}`,
          title: file.name.replace(/\.[^/.]+$/, ""),
          artist: "Local Upload",
          albumCover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80",
          audioUrl: url,
          bpm: 124,
          key: "8A",
          energy: 7,
          genre: "Local File",
          tags: ["local", "custom"]
        });
      });
      setAuthNotification("Local audio files added to crate pool!");
      setTimeout(() => setAuthNotification(null), 3000);
    }
  };

  const handleAddCustomTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle || !customUrl) return;

    soundFx.playRewind();
    onAddCustomTrack({
      id: `custom-${Date.now()}`,
      title: customTitle,
      artist: customArtist || "Unknown Artist",
      albumCover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80",
      audioUrl: customUrl,
      bpm: parseInt(customBpm) || 125,
      key: "8B",
      energy: 8,
      genre: "Custom Track",
      tags: ["custom", "added"]
    });

    setCustomTitle('');
    setCustomArtist('');
    setCustomUrl('');
    setShowAddModal(false);
    setAuthNotification(`Added "${customTitle}" to the crate!`);
    setTimeout(() => setAuthNotification(null), 3000);
  };

  const toggleTransition = (fx: string) => {
    setConfig(prev => ({
      ...prev,
      transitions: prev.transitions.includes(fx) 
        ? prev.transitions.filter(f => f !== fx) 
        : [...prev.transitions, fx]
    }));
  };

  const allPersonas = [...PERSONAS, ...userPersonas.filter(p => !PERSONAS.some(base => base.id === p.id))];

  const previewVoice = (e: React.MouseEvent, personaId: string) => {
    e.stopPropagation();
    const p = allPersonas.find(x => x.id === personaId);
    if (!p) return;

    const sample = `Yo! This is DJ ${p.name}. Let's turn up the ${p.mood} vibes!`;
    if (p.voiceId) {
      fetch('/api/voice-tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ voiceId: p.voiceId, text: sample, speed: p.rate }) })
        .then(r => r.ok ? r.blob() : Promise.reject(new Error('Voice preview failed')))
        .then(blob => { const audio = new Audio(URL.createObjectURL(blob)); audio.play().catch(() => soundFx.playHypeSiren()); })
        .catch(() => soundFx.playHypeSiren());
      return;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(sample);
      utterance.pitch = p.pitch;
      utterance.rate = p.rate;
      window.speechSynthesis.speak(utterance);
    } else { soundFx.playHypeSiren(); }
  };

  const startVoiceRecording = async () => {
    setVoiceCloneError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setVoiceCloneError('Voice recording is not supported by this browser. Use Upload Audio instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(t => MediaRecorder.isTypeSupported(t)) || '';
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recordChunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) recordChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(recordChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        setVoiceFile(new File([blob], `dj-voice-${Date.now()}.webm`, { type: blob.type }));
        stream.getTracks().forEach(t => t.stop());
      };
      recorderRef.current = recorder;
      recorder.start(250);
      setIsRecording(true);
    } catch (error) {
      setVoiceCloneError(error instanceof Error ? error.message : 'Microphone permission was denied or is unavailable.');
    }
  };

  const stopVoiceRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
    setIsRecording(false);
  };

  const cloneMyVoice = async () => {
    if (!voiceName.trim() || !voiceFile || !voiceConsent) {
      setVoiceCloneError('Enter a voice name, add a clear recording/audio file, and confirm that it is your own voice.');
      return;
    }
    setIsCloningVoice(true);
    setVoiceCloneError(null);
    try {
      const form = new FormData();
      form.append('name', voiceName.trim());
      form.append('description', voiceDescription.trim() || 'My personal DJ voice');
      form.append('consent', 'true');
      form.append('file', voiceFile);
      const response = await fetch('/api/clone-voice', { method: 'POST', body: form });
      const data = await response.json();
      if (!response.ok || !data.voiceId) throw new Error(data.error || 'Voice cloning failed.');

      const id = `custom-voice-${Date.now()}`;
      const customPersona = {
        id, name: voiceName.trim(), genre: 'Custom Voice', mood: 'Your Voice', iconName: 'Mic',
        pitch: 1, rate: 1, color: '#22d3ee', accentClass: 'text-cyan-400', borderClass: 'border-cyan-500/50',
        bgClass: 'bg-cyan-500/10', bio: voiceDescription.trim() || 'Your personal cloned DJ voice.',
        catchphrases: ['Your custom DJ voice is ready.'], defaultBpmRange: [80, 150] as [number, number],
        voiceId: data.voiceId, voiceProvider: 'elevenlabs' as const, isUserVoice: true
      };
      const next = [...userPersonas, customPersona];
      setUserPersonas(next);
      localStorage.setItem('djcopilot_user_personas', JSON.stringify(next));
      setConfig(prev => ({ ...prev, persona: id }));
      setVoiceName(''); setVoiceFile(null); setVoiceConsent(false); setShowVoiceClone(false);
      setAuthNotification(`Your voice clone “${customPersona.name}” is ready and selected as the active AI DJ Persona.`);
      setTimeout(() => setAuthNotification(null), 5000);
    } catch (error) {
      setVoiceCloneError(error instanceof Error ? error.message : 'Voice cloning failed.');
    } finally {
      setIsCloningVoice(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 pb-20 text-slate-100 animate-fade-in">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-6 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-cyan-200 to-emerald-400 uppercase">
              Set Up Your Party
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            Configure your AI DJ persona, connect your audio crates, and customize the mixing behavior.
          </p>
        </div>

        {authNotification && (
          <div className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 text-xs font-bold flex items-center gap-2 animate-bounce">
            <Sparkles className="w-4 h-4" />
            <span>{authNotification}</span>
          </div>
        )}
      </div>

      {authProvider && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setAuthProvider(null)}>
          <div className="w-full max-w-md bg-slate-950 border border-cyan-500/40 rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-xl font-extrabold text-slate-100">Connect {authProvider}</h3>
                <p className="text-xs text-slate-400 mt-1">Sign in in the provider's own window. DJ Copilot never asks for your music-service password.</p>
              </div>
              <button onClick={() => setAuthProvider(null)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            {authProvider === 'Local Drive' ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">Choose MP3/WAV/AAC files from your computer. They are loaded directly into your local crate.</div>
                <button onClick={finishProviderConnection} className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold">Choose Local Audio Files</button>
              </div>
            ) : (
              <div className="space-y-3">
                <button onClick={finishProviderConnection} disabled={isConnectingMusic} className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-extrabold disabled:opacity-60 flex items-center justify-center gap-2">{isConnectingMusic ? <><Loader className="w-4 h-4 animate-spin" /> Connecting &amp; Importing…</> : <> <LinkIcon className="w-4 h-4" /> Log In / Authorize {authProvider}</>}</button>
                <p className="text-[11px] text-slate-500 leading-relaxed">Spotify uses OAuth 2.0 + PKCE and imports saved tracks/playlists. Apple Music and iTunes use Apple's MusicKit authorization and import your Apple Music library. Local Drive uses your browser file picker.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showVoiceClone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => !isCloningVoice && setShowVoiceClone(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-cyan-500/40 bg-slate-900 shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 mb-5">
              <div><h3 className="text-xl font-extrabold flex items-center gap-2"><Mic className="w-5 h-5 text-cyan-400" /> Clone My Own Voice</h3><p className="text-xs text-slate-400 mt-1">Record or upload a clean voice sample. Your clone will become a selectable AI DJ Persona.</p></div>
              <button onClick={() => setShowVoiceClone(false)} className="p-2 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <input value={voiceName} onChange={e => setVoiceName(e.target.value)} placeholder="Voice persona name (e.g. DJ Robert)" className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-sm outline-none focus:border-cyan-400" />
              <input value={voiceDescription} onChange={e => setVoiceDescription(e.target.value)} placeholder="Short description" className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-sm outline-none focus:border-cyan-400" />
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={isRecording ? stopVoiceRecording : startVoiceRecording} className={`py-3 rounded-xl font-bold border ${isRecording ? 'bg-red-500/20 border-red-400 text-red-300' : 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'}`}>{isRecording ? 'Stop Recording' : 'Record My Voice'}</button>
                <label className="py-3 rounded-xl font-bold border border-slate-700 bg-slate-950 text-slate-200 text-center cursor-pointer hover:border-cyan-500/40">{voiceFile ? 'Replace Audio' : 'Upload Audio'}<input type="file" accept="audio/*" className="hidden" onChange={e => setVoiceFile(e.target.files?.[0] || null)} /></label>
              </div>
              {voiceFile && <div className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">Selected: {voiceFile.name} • {(voiceFile.size / 1024 / 1024).toFixed(2)} MB</div>}
              <div className="text-[11px] leading-relaxed text-slate-400 bg-slate-950/60 rounded-xl border border-slate-800 p-3">For the cleanest clone, use about 1–2 minutes of one-speaker audio with minimal room noise, reverb, music, or long silence.</div>
              <label className="flex gap-2 items-start text-xs text-slate-300"><input type="checkbox" checked={voiceConsent} onChange={e => setVoiceConsent(e.target.checked)} className="mt-0.5 accent-cyan-400" /> I confirm this is my voice (or I have permission to clone it), and I authorize DJ Copilot to create this voice persona.</label>
              {voiceCloneError && <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-3">{voiceCloneError}</div>}
              <button disabled={isCloningVoice || isRecording} onClick={cloneMyVoice} className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-extrabold disabled:opacity-50 flex items-center justify-center gap-2">{isCloningVoice ? <><Loader className="w-4 h-4 animate-spin" /> Creating Voice Persona…</> : 'Create & Save Voice Persona'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column - Crate Sources & Persona */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. Connect Sources Deck */}
          <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-emerald-500/30 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2.5">
                <Music className="w-5 h-5 text-cyan-400" />
                <span>Connect Music Crates</span>
              </h3>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 hover:border-cyan-400/50 transition-all uppercase tracking-wider"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom URL / Upload</span>
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Select one or more crates to populate your party playlist. The <strong className="text-slate-100">Sound Benders Vault</strong> contains exclusive royalty-free master tracks ready for seamless mixing.
            </p>

            <div className="flex flex-wrap gap-2.5">
              {(['Sound Benders Vault', 'Spotify', 'Apple Music', 'iTunes', 'Local Drive'] as MusicSource[]).map(src => {
                const isConnected = config.sources.includes(src);
                return (
                  <button
                    key={src}
                    onClick={() => handleSourceClick(src)}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2.5 uppercase ${
                      isConnected
                        ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 border-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-cyan-500/50 hover:text-slate-100'
                    }`}
                  >
                    {src === 'Sound Benders Vault' && <Database className="w-4 h-4 text-amber-400" />}
                    {src === 'Local Drive' && <Folder className="w-4 h-4 text-emerald-400" />}
                    {(src === 'Spotify' || src === 'Apple Music' || src === 'iTunes') && <Music className="w-4 h-4 text-pink-400" />}
                    <span>{src}</span>
                    {isConnected && <Check className="w-3.5 h-3.5 text-slate-950 font-black ml-1" />}
                  </button>
                );
              })}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="audio/*"
              className="hidden"
            />
          </div>

          {/* 2. AI DJ Persona Selector */}
          <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-cyan-500/30 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2.5">
                <Mic2 className="w-5 h-5 text-cyan-400" />
                <span>Select AI DJ Persona</span>
              </h3>
              <button
                onClick={() => { setVoiceCloneError(null); setShowVoiceClone(true); }}
                className="text-xs font-bold text-cyan-300 hover:text-cyan-200 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 hover:border-cyan-400/50 transition-all"
              >
                <Mic className="w-3.5 h-3.5" /> Clone My Voice
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {allPersonas.map(p => {
                const isSelected = config.persona === p.id;
                const IconComponent = ICON_MAP[p.iconName] || Music;
                
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      soundFx.playLaser();
                      setConfig({ ...config, persona: p.id });
                    }}
                    className={`p-4 rounded-2xl cursor-pointer border transition-all flex flex-col items-center text-center relative group overflow-hidden ${
                      isSelected
                        ? `bg-slate-800/90 ${p.borderClass} shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/30`
                        : 'bg-slate-950/40 border-slate-800 hover:border-cyan-500/30 hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Top Right Preview Voice Button */}
                    <button
                      onClick={(e) => previewVoice(e, p.id)}
                      title="Test Voice Sample"
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-950/60 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>

                    <div className={`p-3 rounded-2xl mb-2.5 transition-transform group-hover:scale-110 ${
                      isSelected ? p.bgClass + ' ' + p.accentClass : 'bg-slate-800/80 text-slate-400'
                    }`}>
                      <IconComponent size={22} />
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-100 mb-0.5">{p.name}</h4>
                    <span className="text-[11px] font-medium text-slate-400 line-clamp-1 mb-1">{p.genre}</span>
                    <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-cyan-400/20 text-cyan-300 font-bold' : 'bg-slate-900 text-slate-500'
                    }`}>
                      {p.mood}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Selected Persona Bio */}
            {(() => {
              const active = allPersonas.find(p => p.id === config.persona);
              if (!active) return null;
              return (
                <div className="mt-4 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-100 font-bold">{active.name}:</strong> {active.bio}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 3. Mixing & Behavior Controls */}
          <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-fuchsia-500/30 shadow-xl">
            <h3 className="text-lg font-bold mb-5 flex items-center gap-2.5">
              <Sliders className="w-5 h-5 text-fuchsia-400" />
              <span>Mixing & Hosting Behavior</span>
            </h3>

            {/* Chattiness Slider */}
            <div className="mb-6 p-4 rounded-xl bg-slate-950/40 border border-slate-800">
              <div className="flex text-xs font-bold text-slate-300 mb-2 justify-between items-center">
                <span>DJ Chattiness & Banter Frequency</span>
                <span className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 font-mono text-sm border border-cyan-500/30">
                  {config.interactionLevel} / 10
                </span>
              </div>
              
              <input
                type="range"
                min="1"
                max="10"
                value={config.interactionLevel}
                onChange={(e) => setConfig({ ...config, interactionLevel: parseInt(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              
              <div className="flex justify-between text-[11px] text-slate-500 font-mono mt-2">
                <span>1: Strictly Music</span>
                <span>5: Balanced Host</span>
                <span>10: Non-Stop Hypeman</span>
              </div>
            </div>

            {/* Transition FX Checkboxes */}
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Active Transition Effects
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {['Pitch/Tempo Sync', 'Scratching', 'EQ Blending', 'Laser Sweeps'].map(fx => {
                  const checked = config.transitions.includes(fx);
                  return (
                    <label
                      key={fx}
                      onClick={() => toggleTransition(fx)}
                      className={`flex items-center gap-2.5 cursor-pointer p-3 rounded-xl border text-xs font-semibold transition-all ${
                        checked
                          ? 'bg-cyan-500/20 border-cyan-400 text-slate-100 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                        checked ? 'bg-cyan-500 border-cyan-400 text-slate-950 font-black' : 'border-slate-700 bg-slate-950'
                      }`}>
                        {checked && <Check className="w-3 h-3" />}
                      </div>
                      <span className="truncate">{fx}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Advanced Toggle Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              
              {/* Auto Ducking */}
              <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 cursor-pointer hover:border-cyan-500/30 transition-colors">
                <div>
                  <div className="text-xs font-bold text-slate-100 mb-0.5">Auto-Duck Track Volume</div>
                  <div className="text-[11px] text-slate-400">Lower music volume to 30% when DJ speaks</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.autoDucking}
                  onChange={(e) => setConfig({ ...config, autoDucking: e.target.checked })}
                  className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                />
              </label>

              {/* Gemini AI Banter */}
              <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 cursor-pointer hover:border-cyan-500/30 transition-colors">
                <div>
                  <div className="text-xs font-bold text-slate-100 mb-0.5 flex items-center gap-1.5">
                    <span>Gemini AI Speech Mode</span>
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                  </div>
                  <div className="text-[11px] text-slate-400">Use live LLM prompts for banter (or instant fallback)</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.useGeminiAi}
                  onChange={(e) => setConfig({ ...config, useGeminiAi: e.target.checked })}
                  className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                />
              </label>

            </div>
          </div>
        </div>

        {/* Right Column - Party Details & Launch */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-emerald-500/30 shadow-xl">
            <h3 className="text-lg font-bold mb-5 flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-emerald-400" />
              <span>Party Vibe & Details</span>
            </h3>

            <div className="space-y-4">
              
              {/* Event Type */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Type of Event
                </label>
                <VoiceTextInput
                  type="text"
                  placeholder="e.g. Birthday Bash, Pool Party, NYE Celebration..."
                  value={config.partyType}
                  onValueChange={(value) => setConfig({ ...config, partyType: value })}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-all placeholder:text-slate-600"
                />
                {/* Quick suggestions */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['Birthday Bash', 'Pool Party', 'Weekend Chill', 'Rooftop Sunset', 'Late Night Gym'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setConfig({ ...config, partyType: tag })}
                      className="text-[10px] px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 font-medium transition-colors"
                    >
                      +{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shoutouts */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Guest of Honor / VIP Shoutouts
                </label>
                <VoiceTextInput
                  type="text"
                  placeholder="e.g. Sarah's 30th, The Marketing Team, Alex..."
                  value={config.guestOfHonor}
                  onValueChange={(value) => setConfig({ ...config, guestOfHonor: value })}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-all placeholder:text-slate-600"
                />
              </div>

              {/* Musical Vibe */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Target Musical Vibe
                </label>
                <VoiceTextInput
                  type="text"
                  placeholder="e.g. Unstoppable Energy, Nostalgic & Funky..."
                  value={config.mood}
                  onValueChange={(value) => setConfig({ ...config, mood: value })}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-all placeholder:text-slate-600"
                />
              </div>

              {/* Setlist Size */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Setlist Size (Track Count)
                </label>
                <select
                  value={config.duration}
                  onChange={(e) => setConfig({ ...config, duration: e.target.value })}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 focus:border-cyan-400 outline-none transition-all cursor-pointer"
                >
                  <option value="3">Mini Demo (3 tracks)</option>
                  <option value="5">Short Set (5 tracks)</option>
                  <option value="10">Standard Set (10 tracks)</option>
                  <option value="15">Extended Club Set (15 tracks)</option>
                </select>
              </div>

            </div>
          </div>

          {/* Action Launch Button */}
          <div className="space-y-3">
            <button
              onClick={() => {
                soundFx.playAirhorn();
                onGenerate();
              }}
              disabled={isLoading || config.sources.length === 0 || !config.partyType}
              className="w-full py-5 px-6 rounded-2xl font-black text-lg bg-gradient-to-r from-emerald-500 via-cyan-500 to-fuchsia-500 hover:from-emerald-400 hover:to-fuchsia-400 text-slate-950 uppercase tracking-widest shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:shadow-[0_0_45px_rgba(6,182,212,0.8)] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed group transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {isLoading ? (
                <>
                  <Loader className="w-6 h-6 animate-spin text-slate-950" />
                  <span>Digging in the Crates...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6 text-slate-950 group-hover:rotate-12 transition-transform" />
                  <span>GENERATE AI SETLIST</span>
                </>
              )}
            </button>

            {config.sources.length === 0 ? (
              <p className="text-red-400 text-xs text-center font-semibold flex items-center justify-center gap-1.5 bg-red-500/10 py-2.5 rounded-xl border border-red-500/20">
                <ShieldAlert className="w-4 h-4" /> Please connect at least one music crate above.
              </p>
            ) : !config.partyType ? (
              <p className="text-amber-400 text-xs text-center font-semibold bg-amber-500/10 py-2.5 rounded-xl border border-amber-500/20">
                Please enter a Type of Event (e.g. Birthday Bash) to continue.
              </p>
            ) : (
              <p className="text-slate-400 text-[11px] text-center font-mono">
                AI CO-HOST READY • INTEL-SYNC ACTIVE
              </p>
            )}
          </div>

        </div>
      </div>

      {/* Add Custom Track Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-100 p-1"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <LinkIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-100">Add Custom Track / Stream</h3>
                <p className="text-xs text-slate-400">Support for direct MP3s, YouTube embeds, Spotify embeds, and Vocaroo.</p>
              </div>
            </div>

            <form onSubmit={handleAddCustomTrackSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Song Title *</label>
                <VoiceTextInput
                  type="text"
                  required
                  placeholder="e.g. Neon Horizon"
                  value={customTitle}
                  onValueChange={setCustomTitle}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:border-cyan-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Artist Name</label>
                <VoiceTextInput
                  type="text"
                  placeholder="e.g. Synthwave King"
                  value={customArtist}
                  onValueChange={setCustomArtist}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:border-cyan-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Audio URL or Embed Link *</label>
                <VoiceTextInput
                  type="text"
                  required
                  placeholder="https://voca.ro/... or youtube.com/... or .mp3 link"
                  value={customUrl}
                  onValueChange={setCustomUrl}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:border-cyan-400 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Estimated BPM</label>
                  <input
                    type="number"
                    value={customBpm}
                    onChange={(e) => setCustomBpm(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:border-cyan-400 outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-100 border border-slate-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Folder className="w-4 h-4" />
                    <span>Upload File</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 uppercase font-black tracking-wider shadow-lg"
                >
                  Add To Crate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
