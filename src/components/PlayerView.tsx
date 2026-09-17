import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Music, Play, Pause, SkipForward, Volume2, VolumeX, 
  Sparkles, Zap, Coffee, Mic, Disc, Cpu, Radio, Flame, 
  MessageSquare, Send, List, Download, Copy, Check, Loader,
  RotateCcw, ShieldAlert, Award
} from 'lucide-react';
import { PartyConfig, Track, DjScript, LiveRequest } from '../types';
import { PERSONAS } from '../data/personas';
import { soundFx } from '../utils/audioEffects';
import { generateScript } from '../services/aiService';
import { djMix } from '../utils/djMixEngine';

interface PlayerViewProps {
  config: PartyConfig;
  setlist: Track[];
  onExit: () => void;
  isMuted: boolean;
  userPersonas: Array<import('../types').Persona>;
}

const ICON_MAP: Record<string, React.FC<{ className?: string; size?: number }>> = {
  Zap: Zap,
  Coffee: Coffee,
  Mic: Mic,
  Disc: Disc,
  Cpu: Cpu,
  Music: Music
};

export const PlayerView: React.FC<PlayerViewProps> = ({
  config,
  setlist,
  onExit,
  isMuted,
  userPersonas
}) => {
  const [status, setStatus] = useState<'generating' | 'intro' | 'playing' | 'speaking' | 'outro' | 'finished'>('generating');
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const [nowPlayingStr, setNowPlayingStr] = useState('');
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentMedia, setCurrentMedia] = useState<{ type: string; url: string }>({ type: 'none', url: '' });
  const [script, setScript] = useState<DjScript | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(true);
  const [hypeLevel, setHypeLevel] = useState(65); // 0 to 100
  const [requests, setRequests] = useState<LiveRequest[]>([
    { id: 'req-1', sender: 'VIP Guest', message: 'Turn the bass up!', timestamp: new Date(), status: 'pending' }
  ]);
  const [newReqSender, setNewReqSender] = useState('');
  const [newReqMsg, setNewReqMsg] = useState('');
  const [showQueue, setShowQueue] = useState(false);
  const [showRecapModal, setShowRecapModal] = useState(false);
  const [copiedRecap, setCopiedRecap] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const advanceRef = useRef<(() => void) | null>(null);
  const hasStarted = useRef(false);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);

  const allPersonas = [...PERSONAS, ...userPersonas.filter(p => !PERSONAS.some(base => base.id === p.id))];
  const persona = allPersonas.find(p => p.id === config.persona) || allPersonas[0];
  const PersonaIcon = ICON_MAP[persona.iconName] || Music;

  // Process audio URL into direct embed or playable media
  const processAudioUrl = (url: string) => {
    if (!url) return { type: 'none', url: '' };
    
    // Vocaroo
    const vocaMatch = url.match(/voca\.ro\/([a-zA-Z0-9]+)/);
    if (vocaMatch) return { type: 'audio', url: `https://media.vocaroo.com/mp3/${vocaMatch[1]}` };
    
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (ytMatch) return { type: 'youtube', url: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1` };

    // Spotify
    const spotMatch = url.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
    if (spotMatch) return { type: 'spotify', url: `https://open.spotify.com/embed/track/${spotMatch[1]}?utm_source=generator` };

    // Apple Music / iTunes
    if (/music\.apple\.com\//i.test(url)) return { type: 'apple', url };
    
    return { type: 'audio', url };
  };

  // Duck audio during speech
  const setAudioVolume = (vol: number) => {
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  const speakText = (text: string): Promise<void> => {
    setSpeechTranscript(text);
    if (config.autoDucking) setAudioVolume(0.25);

    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        if (config.autoDucking) setAudioVolume(0.9);
        resolve();
      };
      advanceRef.current = () => {
        if (audioRef.current) audioRef.current.pause();
        if (voiceAudioRef.current) { voiceAudioRef.current.pause(); voiceAudioRef.current = null; }
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        finish();
      };

      if (isMuted) { finish(); return; }

      if (persona.voiceId) {
        fetch('/api/voice-tts', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voiceId: persona.voiceId, text, speed: persona.rate })
        })
          .then(async response => {
            if (!response.ok) throw new Error(await response.text());
            return response.blob();
          })
          .then(blob => {
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            voiceAudioRef.current = audio;
            audio.onended = () => { URL.revokeObjectURL(url); finish(); };
            audio.onerror = finish;
            audio.play().catch(finish);
          })
          .catch(error => {
            console.warn('Custom voice TTS failed; falling back to browser speech.', error);
            speakBrowser();
          });
        return;
      }

      speakBrowser();

      function speakBrowser() {
        if (!('speechSynthesis' in window)) { setTimeout(finish, 3500); return; }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.pitch = persona.pitch;
        utterance.rate = persona.rate;
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          const isFemale = ['retro', 'chill'].includes(persona.id);
          const voiceMatches = voices.filter(v => v.name.toLowerCase().includes(isFemale ? 'female' : 'male'));
          if (voiceMatches.length > 0) utterance.voice = voiceMatches[0];
        }
        utterance.onend = finish;
        utterance.onerror = finish;
        window.speechSynthesis.speak(utterance);
      }
    });
  };

  const handleSkip = () => {
    soundFx.playScratch();
    if (advanceRef.current) advanceRef.current();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (audioRef.current) audioRef.current.pause();
  };

  // Main party engine loop
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    let isMounted = true;

    const runParty = async () => {
      try {
        setStatus('generating');
        const generatedScript = await generateScript(config, setlist, persona);
        if (!isMounted) return;
        setScript(generatedScript);

        // 1. Play Intro
        setStatus('intro');
        setNowPlayingStr(`${persona.name} is welcoming the crowd...`);
        if (!isMuted) soundFx.playAirhorn();
        await speakText(generatedScript.intro);
        if (!isMounted) return;

        // 2. Loop tracks
        for (let i = 0; i < setlist.length; i++) {
          if (!isMounted) break;
          setCurrentTrackIdx(i);
          setStatus('playing');
          setSpeechTranscript('');
          setNowPlayingStr(`${setlist[i].title} — ${setlist[i].artist}`);
          setHypeLevel(prev => Math.min(100, prev + 8));

          const media = processAudioUrl(setlist[i].audioUrl);
          setCurrentMedia(media);

          // Wait for song to finish or skip
          await new Promise<void>((resolve) => {
            advanceRef.current = () => {
              resolve();
            };

            if (media.type === 'audio') {
              setTimeout(() => {
                if (audioRef.current) {
                  audioRef.current.volume = 0.9;
                  audioRef.current.onended = () => resolve();
                }
              }, 100);
            }
          });

          setCurrentMedia({ type: 'none', url: '' });
          if (!isMounted) break;

          // 3. Transition & Interstitials (if not last track)
          if (i < setlist.length - 1) {
            if (config.transitions.length > 0) {
              setIsTransitioning(true);
              const randomFx = config.transitions[Math.floor(Math.random() * config.transitions.length)];
              setNowPlayingStr(`DJ Transition: ${randomFx}...`);
              if (!isMuted) {
                djMix.applyTransition(randomFx as any, audioRef.current, setlist[i].bpm, setlist[i + 1].bpm);
                if (randomFx.includes('Scratch')) soundFx.playScratch();
                else if (randomFx.includes('Laser')) soundFx.playLaser();
                else if (randomFx.includes('EQ')) soundFx.playRewind();
                else soundFx.playRewind();
              }
              await new Promise(r => setTimeout(r, randomFx.includes('Pitch') ? 1800 : 1400));
              setIsTransitioning(false);
            }

            if (config.interactionLevel > 1) {
              setStatus('speaking');
              setNowPlayingStr(`DJ ${persona.name} on the mic...`);
              await speakText(generatedScript.interstitials[i]);
            }
            if (!isMounted) break;
          }
        }

        // 4. Outro
        if (isMounted) {
          setStatus('outro');
          setNowPlayingStr(`DJ ${persona.name} signing off...`);
          await speakText(generatedScript.outro);
          setStatus('finished');
          setNowPlayingStr("Set Complete!");
          if (!isMuted) soundFx.playHypeSiren();
        }
      } catch (err) {
        console.error("Party execution error", err);
        if (isMounted) onExit();
      }
    };

    runParty();

    return () => {
      isMounted = false;
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  // Keyboard shortcut listener for DJ Sampler pads (1-6)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || isMuted) return;
      if (e.key === '1') { soundFx.playAirhorn(); setHypeLevel(h => Math.min(100, h + 4)); }
      if (e.key === '2') { soundFx.playScratch(); setHypeLevel(h => Math.min(100, h + 4)); }
      if (e.key === '3') { soundFx.playSubBoom(); setHypeLevel(h => Math.min(100, h + 5)); }
      if (e.key === '4') { soundFx.playLaser(); setHypeLevel(h => Math.min(100, h + 3)); }
      if (e.key === '5') { soundFx.playHypeSiren(); setHypeLevel(h => Math.min(100, h + 6)); }
      if (e.key === '6') { soundFx.playRewind(); setHypeLevel(h => Math.min(100, h + 3)); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMuted]);

  const submitLiveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReqMsg) return;
    soundFx.playLaser();

    const senderName = newReqSender || 'VIP Guest';
    const newReq: LiveRequest = {
      id: `req-${Date.now()}`,
      sender: senderName,
      message: newReqMsg,
      timestamp: new Date(),
      status: 'pending'
    };
    setRequests([newReq, ...requests]);
    setNewReqMsg('');
    setHypeLevel(h => Math.min(100, h + 8));

    // If DJ is playing or speaking, immediately trigger a live shoutout on the mic!
    if (status === 'playing') {
      const shoutoutText = `Hold up! Live shoutout on the request line from ${senderName}! They say: "${newReq.message}"! Let's turn up for ${senderName}!`;
      speakText(shoutoutText);
    }
  };

  const currentSong = setlist[currentTrackIdx];
  const isSpinning = status === 'playing' && !isTransitioning && isPlayingAudio;

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 relative text-slate-100 bg-slate-950 overflow-x-hidden">
      
      {/* Background Ambient Lights */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 opacity-40">
        <div className={`absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[140px] transition-colors duration-1000 ${
          status === 'speaking' || status === 'intro' ? 'bg-cyan-600' : 'bg-emerald-500'
        }`} />
        <div className={`absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[140px] transition-colors duration-1000 ${
          status === 'playing' ? 'bg-fuchsia-600' : 'bg-transparent'
        }`} />
      </div>

      {/* Top Header Deck */}
      <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 z-10">
        
        {/* Live Indicator */}
        <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-800 shadow-lg">
          <div className={`w-3 h-3 rounded-full ${status === 'finished' ? 'bg-slate-500' : 'bg-red-500 animate-pulse'}`} />
          <span className="text-xs font-mono font-bold tracking-wider uppercase">
            LIVE STAGE • {config.partyType.toUpperCase()}
          </span>
          <span className="hidden md:inline text-xs text-slate-400">|</span>
          <span className="hidden md:flex items-center gap-1 text-xs text-cyan-400 font-bold uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>HOST: DJ {persona.name.toUpperCase()}</span>
          </span>
        </div>

        {/* Crowd Hype Meter */}
        <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-800 shadow-lg w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Flame className="w-4 h-4 animate-bounce" />
            <span>CROWD HYPE:</span>
          </div>
          <div className="w-28 sm:w-36 h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 transition-all duration-500"
              style={{ width: `${hypeLevel}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-slate-100">{hypeLevel}%</span>
        </div>

        {/* Right Nav Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQueue(!showQueue)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all uppercase tracking-wider ${
              showQueue ? 'bg-cyan-500 border-cyan-400 text-slate-950 font-black' : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Setlist ({currentTrackIdx + 1}/{setlist.length})</span>
          </button>

          <button
            onClick={onExit}
            className="px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-800 hover:border-red-500/40 text-xs font-bold flex items-center gap-2 transition-all uppercase tracking-wider"
          >
            <X className="w-4 h-4" />
            <span>End Set</span>
          </button>
        </div>

      </div>

      {/* Main DJ Booth Area */}
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col lg:flex-row gap-8 items-center justify-center my-4 z-10">
        
        {/* Left/Center Deck: Vinyl Deck & Visualizer */}
        <div className="flex-1 w-full max-w-2xl bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-cyan-500/30 shadow-2xl flex flex-col items-center relative overflow-hidden">
          
          {status === 'generating' ? (
            <div className="py-24 text-center space-y-4">
              <Loader className="w-16 h-16 animate-spin text-cyan-400 mx-auto" />
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">DJ {persona.name} is prepping the stage...</h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Syncing beat transitions, calculating harmonic keys, and writing customized VIP shoutouts.
              </p>
            </div>
          ) : status === 'finished' ? (
            <div className="py-16 text-center space-y-6 w-full animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <Award className="w-10 h-10 animate-bounce" />
              </div>
              <div>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-100 mb-2">Set Complete!</h2>
                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  DJ {persona.name} crushed the {config.partyType} set! Crowd hype peaked at <strong className="text-amber-400 font-bold">{hypeLevel}%</strong>!
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-3 pt-4">
                <button
                  onClick={() => setShowRecapModal(true)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>View & Export DJ Recap</span>
                </button>
                <button
                  onClick={onExit}
                  className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Status Pill */}
              <div className="mb-6 px-3.5 py-1.5 rounded-full bg-slate-950/60 border border-slate-800 text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                {isTransitioning ? 'TRANSITION FX ACTIVE' : status === 'intro' ? 'OPENING HYPE SPEECH' : status === 'outro' ? 'CLOSING SPEECH' : status === 'speaking' ? 'DJ ON MIC • MUSIC DUCKED' : 'NOW PLAYING MUSIC'}
              </div>

              {/* Spinning Vinyl Turntable Display */}
              <div className="relative mb-8 group flex items-center justify-center">
                {/* Turntable Outer Platter */}
                <div className={`w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800 border-4 border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex items-center justify-center relative overflow-hidden transition-all duration-700 ${
                  isSpinning ? 'ring-2 ring-cyan-500/40 shadow-[0_0_60px_rgba(6,182,212,0.3)]' : ''
                }`}>
                  
                  {/* Vinyl Grooves texture */}
                  <div className={`absolute inset-3 rounded-full border border-white/5 pointer-events-none ${isSpinning ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
                  <div className={`absolute inset-8 rounded-full border border-white/5 pointer-events-none ${isSpinning ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
                  <div className={`absolute inset-14 rounded-full border border-white/5 pointer-events-none ${isSpinning ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent rounded-full pointer-events-none opacity-40" />

                  {/* Center Album Art Record Label */}
                  <div className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-slate-950 shadow-inner relative flex items-center justify-center bg-slate-950 ${
                    isSpinning ? 'animate-spin' : ''
                  }`} style={{ animationDuration: '12s', animationTimingFunction: 'linear' }}>
                    {currentSong?.albumCover ? (
                      <img src={currentSong.albumCover} alt="Album" className="w-full h-full object-cover" />
                    ) : (
                      <Music className="w-12 h-12 text-slate-600" />
                    )}
                    {/* Vinyl Center Hole */}
                    <div className="absolute w-5 h-5 rounded-full bg-slate-950 border border-slate-800 shadow-inner" />
                  </div>

                  {/* DJ Icon Overlay when speaking */}
                  {(status === 'speaking' || status === 'intro' || status === 'outro') && (
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center animate-fade-in">
                      <div className="text-center space-y-2">
                        <PersonaIcon size={52} className="text-cyan-400 animate-pulse mx-auto" />
                        <span className="text-xs font-mono font-bold text-cyan-300 block tracking-widest uppercase">DJ {persona.name}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Title & Artist */}
              <div className="text-center mb-6 w-full px-4">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-100 truncate mb-1">
                  {currentSong ? currentSong.title : 'Loading...'}
                </h2>
                <p className="text-base sm:text-lg text-slate-400 font-medium truncate">
                  {currentSong ? currentSong.artist : 'Standby'}
                </p>
                <div className="text-xs font-mono text-slate-500 mt-1">
                  Track {currentTrackIdx + 1} of {setlist.length} • {currentSong?.bpm || 125} BPM
                </div>
              </div>

              {/* Audio Spectrum Visualizer Bar Chart */}
              <div className="w-full max-w-md h-12 flex items-end justify-between gap-1.5 px-4 mb-6">
                {Array.from({ length: 18 }).map((_, barIdx) => {
                  // Calculate dynamic height based on playback state
                  const isActive = status === 'playing' || status === 'speaking' || status === 'intro';
                  const randomHeight = isActive ? Math.floor(Math.random() * 80) + 20 : 8;
                  const barColor = status === 'speaking' ? 'bg-cyan-400' : 'bg-emerald-500';
                  
                  return (
                    <div
                      key={barIdx}
                      className={`flex-1 rounded-t-sm transition-all duration-150 ${barColor}`}
                      style={{
                        height: `${randomHeight}%`,
                        opacity: isActive ? (0.6 + (barIdx % 3) * 0.15) : 0.3
                      }}
                    />
                  );
                })}
              </div>

              {/* Media Player Embed Injection */}
              <div className="w-full max-w-md mx-auto min-h-[3.5rem] flex flex-col justify-center items-center mb-6">
                {status === 'playing' && currentMedia.type === 'audio' && (
                  <audio
                    ref={(el) => {
                      audioRef.current = el;
                      if (el) djMix.connect(el);
                    }}
                    src={currentMedia.url}
                    controls
                    autoPlay
                    className="w-full rounded-xl h-10 outline-none border border-slate-800 bg-slate-950/60 shadow-inner"
                  />
                )}
                {status === 'playing' && currentMedia.type === 'youtube' && (
                  <div className="w-full rounded-xl overflow-hidden shadow-lg border border-slate-800 bg-slate-950">
                    <iframe width="100%" height="80" src={currentMedia.url} title="YouTube" frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen />
                  </div>
                )}
                {status === 'playing' && currentMedia.type === 'spotify' && (
                  <div className="w-full rounded-xl overflow-hidden shadow-lg">
                    <iframe src={currentMedia.url} width="100%" height="80" frameBorder="0" allow="encrypted-media" />
                  </div>
                )}
                {status === 'playing' && currentMedia.type === 'apple' && (
                  <div className="w-full rounded-xl overflow-hidden shadow-lg border border-slate-800 bg-slate-950">
                    <iframe src={currentMedia.url} width="100%" height="100" frameBorder="0" allow="autoplay; encrypted-media" title="Apple Music" />
                  </div>
                )}
              </div>

              {/* Live DJ Speech Transcript Box */}
              {speechTranscript && (status === 'speaking' || status === 'intro' || status === 'outro') && (
                <div className="w-full max-w-lg mb-6 p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-center animate-fade-in shadow-lg">
                  <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold mb-1 flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3 h-3 animate-spin" />
                    <span>DJ {persona.name} Speaking Live</span>
                  </div>
                  <p className="text-sm text-slate-200 font-medium italic leading-relaxed">
                    "{speechTranscript}"
                  </p>
                </div>
              )}

              {/* Skip Forward Button */}
              <button
                onClick={handleSkip}
                className="px-6 py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-800 text-xs font-extrabold tracking-wider uppercase flex items-center gap-2 shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                <span>Skip To Next</span>
                <SkipForward className="w-4 h-4 fill-current" />
              </button>
            </>
          )}

        </div>

        {/* Right Deck: Live Sampler Pad & Request Line */}
        <div className="w-full lg:w-96 space-y-6">
          
          {/* 1. DJ Sampler Pad (Live Sound FX) */}
          <div className="bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-fuchsia-500/30 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 uppercase tracking-wide">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Live DJ Sampler Pad</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono font-bold">KEYS 1-6</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Airhorn', key: '1', color: 'from-amber-600 to-yellow-500', action: () => { soundFx.playAirhorn(); setHypeLevel(h => Math.min(100, h+4)); } },
                { label: 'Scratch', key: '2', color: 'from-purple-600 to-pink-500', action: () => { soundFx.playScratch(); setHypeLevel(h => Math.min(100, h+4)); } },
                { label: 'Sub Boom', key: '3', color: 'from-red-600 to-orange-500', action: () => { soundFx.playSubBoom(); setHypeLevel(h => Math.min(100, h+5)); } },
                { label: 'Laser', key: '4', color: 'from-cyan-600 to-blue-500', action: () => { soundFx.playLaser(); setHypeLevel(h => Math.min(100, h+3)); } },
                { label: 'Hype Siren', key: '5', color: 'from-emerald-600 to-teal-500', action: () => { soundFx.playHypeSiren(); setHypeLevel(h => Math.min(100, h+6)); } },
                { label: 'Rewind', key: '6', color: 'from-indigo-600 to-purple-500', action: () => { soundFx.playRewind(); setHypeLevel(h => Math.min(100, h+3)); } },
              ].map(pad => (
                <button
                  key={pad.label}
                  onClick={pad.action}
                  className={`p-3 rounded-2xl bg-gradient-to-br ${pad.color} text-slate-950 font-bold text-xs shadow-lg flex flex-col items-center justify-center gap-1 transform active:scale-95 transition-all relative group overflow-hidden`}
                >
                  <span className="text-sm font-extrabold text-white">{pad.label}</span>
                  <span className="text-[9px] font-mono opacity-80 uppercase text-white/90">[KEY {pad.key}]</span>
                </button>
              ))}
            </div>
            
            <p className="text-[11px] text-slate-400 mt-3 text-center">
              Trigger live effects during tracks to boost Crowd Hype!
            </p>
          </div>

          {/* 2. Live Request Line & Shoutouts */}
          <div className="bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-cyan-500/30 shadow-xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-4 uppercase tracking-wide">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>Live Request Line & Shoutouts</span>
            </h3>

            {/* Request form */}
            <form onSubmit={submitLiveRequest} className="space-y-3 mb-4">
              <input
                type="text"
                placeholder="Your Name (e.g. VIP Alex)"
                value={newReqSender}
                onChange={(e) => setNewReqSender(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:border-cyan-400 outline-none"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Shoutout or song request..."
                  value={newReqMsg}
                  onChange={(e) => setNewReqMsg(e.target.value)}
                  className="flex-1 bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:border-cyan-400 outline-none"
                />
                <button
                  type="submit"
                  title="Send Request"
                  className="px-3.5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center transition-colors shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            {/* Request feed */}
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {requests.map(req => (
                <div key={req.id} className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between font-bold text-cyan-300 mb-0.5">
                    <span>{req.sender}</span>
                    <span className="text-[10px] font-mono text-slate-500">LIVE</span>
                  </div>
                  <p className="text-slate-200 leading-snug">{req.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Export Recap Button */}
          {status === 'finished' && (
            <button
              onClick={() => setShowRecapModal(true)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-fuchsia-500 hover:from-emerald-400 hover:to-fuchsia-400 text-slate-950 font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all animate-bounce"
            >
              <Award className="w-5 h-5" />
              <span>EXPORT AI DJ PARTY RECAP</span>
            </button>
          )}

        </div>

      </div>

      {/* Setlist Queue Drawer / Modal */}
      {showQueue && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative max-h-[80vh] flex flex-col animate-scale-up">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-lg text-slate-100 flex items-center gap-2 uppercase tracking-wide">
                <List className="w-5 h-5 text-cyan-400" />
                <span>Active Setlist Queue</span>
              </h3>
              <button onClick={() => setShowQueue(false)} className="text-slate-400 hover:text-slate-100 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {setlist.map((song, idx) => (
                <div
                  key={song.id}
                  className={`p-3 rounded-xl flex items-center justify-between text-xs ${
                    idx === currentTrackIdx
                      ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 font-bold'
                      : idx < currentTrackIdx
                      ? 'bg-slate-950/40 text-slate-500 line-through'
                      : 'bg-slate-800/40 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className="font-mono w-5">{idx + 1}.</span>
                    <span className="truncate">{song.title} — {song.artist}</span>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-950/50 text-slate-400 shrink-0">
                    {song.bpm} BPM
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowQueue(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs uppercase tracking-wider"
              >
                Close Queue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recap Modal */}
      {showRecapModal && script && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl relative max-h-[85vh] flex flex-col animate-scale-up">
            <button onClick={() => setShowRecapModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-100">
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-100 uppercase tracking-wide">AI DJ Party Recap & Transcript</h3>
                <p className="text-xs text-slate-400">Hosted by DJ {persona.name} for {config.partyType}</p>
              </div>
            </div>

            <div className="overflow-y-auto space-y-4 flex-1 pr-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed mb-6">
              <div>
                <strong className="text-cyan-400 block mb-1">[INTRO HYPE SPEECH]</strong>
                <p>{script.intro}</p>
              </div>
              {setlist.map((song, idx) => (
                <div key={song.id} className="pt-2 border-t border-slate-800">
                  <strong className="text-cyan-400 block mb-0.5">
                    [TRACK {idx + 1}] {song.title} — {song.artist} ({song.bpm} BPM)
                  </strong>
                  {script.interstitials[idx] && (
                    <p className="text-slate-400 italic mt-1">DJ Transcript: "{script.interstitials[idx]}"</p>
                  )}
                </div>
              ))}
              <div className="pt-2 border-t border-slate-800">
                <strong className="text-emerald-400 block mb-1">[OUTRO SPEECH]</strong>
                <p>{script.outro}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  const text = `=== DJ COPILOT AI RECAP: ${config.partyType.toUpperCase()} ===\nHOST: DJ ${persona.name}\n\nSETLIST:\n` +
                    setlist.map((s, i) => `${i+1}. ${s.title} — ${s.artist}`).join('\n') +
                    `\n\n=== FULL TRANSCRIPT ===\nINTRO: ${script.intro}\n` +
                    script.interstitials.map((inter, i) => `[AFTER TRACK ${i+1}]: ${inter}`).join('\n') +
                    `\nOUTRO: ${script.outro}`;
                  navigator.clipboard.writeText(text);
                  setCopiedRecap(true);
                  setTimeout(() => setCopiedRecap(false), 3000);
                }}
                className="flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                {copiedRecap ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4" />}
                <span>{copiedRecap ? "Copied To Clipboard!" : "Copy Full Transcript"}</span>
              </button>
              <button
                onClick={() => setShowRecapModal(false)}
                className="px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
