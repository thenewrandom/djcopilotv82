import React, { useState } from 'react';
import { PartyConfig, Persona, Track } from './types';
import { TRACK_CATALOG } from './data/tracks';
import { PERSONAS } from './data/personas';
import { generateSetlist } from './services/aiService';
import { soundFx } from './utils/audioEffects';

import { Navbar } from './components/Navbar';
import { LandingView } from './components/LandingView';
import { DashboardView } from './components/DashboardView';
import { SetlistEditor } from './components/SetlistEditor';
import { PlayerView } from './components/PlayerView';

export default function App() {
  const [view, setView] = useState<'landing' | 'dashboard' | 'setlist' | 'player'>('landing');
  const [isLoading, setIsLoading] = useState(false);
  const [allTracks, setAllTracks] = useState<Track[]>(TRACK_CATALOG);
  const [setlist, setSetlist] = useState<Track[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [userPersonas, setUserPersonas] = useState<Persona[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('djcopilot_user_personas') || '[]');
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  });

  const [config, setConfig] = useState<PartyConfig>({
    sources: ['Sound Benders Vault'],
    persona: 'hype',
    interactionLevel: 6,
    transitions: ['Pitch/Tempo Sync', 'Scratching', 'EQ Blending'],
    partyType: '',
    guestOfHonor: '',
    mood: 'Unstoppable High Energy',
    duration: '5',
    autoDucking: true,
    useGeminiAi: true
  });

  const personas = [...PERSONAS, ...userPersonas.filter(p => !PERSONAS.some(base => base.id === p.id))];
  const activePersona = personas.find(p => p.id === config.persona) || PERSONAS[0];

  const handleLogin = () => {
    soundFx.playLaser();
    setView('dashboard');
  };

  const handleQuickDemo = async () => {
    soundFx.playAirhorn();
    setIsLoading(true);
    const demoConfig: PartyConfig = {
      ...config,
      sources: ['Sound Benders Vault'],
      persona: 'hype',
      partyType: 'VIP Demo Festival',
      guestOfHonor: 'AI Studio VIPs',
      mood: 'Festival Mainstage Peak',
      duration: '3'
    };
    setConfig(demoConfig);

    try {
      const tracks = await generateSetlist(demoConfig, allTracks);
      setSetlist(tracks);
      setIsLoading(false);
      setView('player');
    } catch (err) {
      console.error("Demo launch error", err);
      setIsLoading(false);
      setView('dashboard');
    }
  };

  const handleGenerate = async () => {
    soundFx.playRewind();
    setIsLoading(true);
    try {
      const tracks = await generateSetlist(config, allTracks);
      setSetlist(tracks);
      setView('setlist');
    } catch (err) {
      console.error("Failed to generate setlist", err);
    } finally {
      setIsLoading(false);
    }
  };

  const startParty = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setView('player');
    }, 800);
  };

  const handleAddCustomTrack = (newTrack: Track) => {
    setAllTracks(prev => [newTrack, ...prev]);
  };

  const handleAddTracks = (tracks: Track[]) => {
    setAllTracks(prev => {
      const existingIds = new Set(prev.map(track => track.id));
      return [...tracks.filter(track => !existingIds.has(track.id)), ...prev];
    });
  };

  const handleToggleMute = () => {
    setIsMuted(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-cyan-500/30 overflow-x-hidden flex flex-col">
      <Navbar
        currentView={view}
        activePersona={activePersona}
        connectedSourcesCount={config.sources.length}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onNavigateHome={() => {
          soundFx.playScratch();
          setView('landing');
        }}
      />

      <main className="flex-1">
        {view === 'landing' && (
          <LandingView
            onLogin={handleLogin}
            onQuickDemo={handleQuickDemo}
          />
        )}

        {view === 'dashboard' && (
          <DashboardView
            config={config}
            setConfig={setConfig}
            onGenerate={handleGenerate}
            isLoading={isLoading}
            onAddCustomTrack={handleAddCustomTrack}
            onAddTracks={handleAddTracks}
            userPersonas={userPersonas}
            setUserPersonas={setUserPersonas}
          />
        )}

        {view === 'setlist' && (
          <SetlistEditor
            setlist={setlist}
            setSetlist={setSetlist}
            onApprove={startParty}
            isLoading={isLoading}
            config={config}
            onBack={() => {
              soundFx.playRewind();
              setView('dashboard');
            }}
            onAddCustomTrack={handleAddCustomTrack}
          />
        )}

        {view === 'player' && (
          <PlayerView
            config={config}
            setlist={setlist}
            onExit={() => {
              soundFx.playScratch();
              setView('dashboard');
            }}
            isMuted={isMuted}
            userPersonas={userPersonas}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4 px-6 text-center text-xs text-slate-400 font-mono bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            DJ COPILOT (AI) • THE SOUND BENDERS NETWORK VAULT ENABLED
          </div>
          <div className="flex items-center gap-4">
            <span>WEB SPEECH API</span>
            <span>•</span>
            <span>GEMINI AI INTEL</span>
            <span>•</span>
            <span>WEB AUDIO FX</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
