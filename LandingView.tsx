import React from 'react';
import { Headphones, Sparkles, LogIn, Play, Zap, Mic2, Sliders, Music, Shield, ArrowRight } from 'lucide-react';

interface LandingViewProps {
  onLogin: () => void;
  onQuickDemo: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onLogin, onQuickDemo }) => {
  return (
    <div className="min-h-[calc(100vh-65px)] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden text-slate-100 bg-slate-950">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[600px] sm:h-[900px] bg-gradient-to-tr from-emerald-500/15 via-cyan-500/15 to-fuchsia-500/15 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      
      {/* Hero Icon */}
      <div className="relative mb-8 group">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 via-cyan-500 to-fuchsia-500 rounded-full blur-lg opacity-70 group-hover:opacity-100 transition duration-500 animate-pulse" />
        <div className="relative w-28 h-28 sm:w-36 sm:h-36 bg-slate-950/90 rounded-full flex items-center justify-center border border-cyan-500/30 shadow-2xl">
          <Headphones className="w-14 h-14 sm:w-18 sm:h-18 text-cyan-400 group-hover:scale-110 transition-transform duration-300" />
        </div>
      </div>
      
      {/* Hero Headlines */}
      <div className="max-w-3xl mx-auto space-y-4 mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold tracking-wider uppercase mb-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
          Next-Generation Autonomous DJ Hosting
        </div>
        
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-cyan-200 to-emerald-400 uppercase">
          Your Personal AI DJ & Party Co-Host
        </h1>
        
        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed pt-2">
          Connect your favorite music crates, customize your AI persona, and let DJ Copilot host your party with dynamic voice commentary, BPM matching, and live sound FX.
        </p>
      </div>
      
      {/* Call to Action Deck */}
      <div className="bg-slate-900/90 backdrop-blur-xl p-8 rounded-3xl w-full max-w-md border border-emerald-500/30 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative z-10 mb-16">
        <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm uppercase tracking-wider mb-2">
          <Shield className="w-4 h-4" /> VIP Studio Pass Unlocked
        </div>
        
        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
          Access the Sound Benders Vault, sync Spotify & Apple Music, or drop your own local tracks for instant autonomous hosting.
        </p>
        
        <div className="space-y-3.5">
          <button 
            onClick={onLogin}
            className="w-full py-4 px-6 rounded-xl font-bold text-base bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 uppercase tracking-wider shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:shadow-[0_0_35px_rgba(6,182,212,0.7)] transition-all duration-200 flex items-center justify-center gap-3 group"
          >
            <LogIn className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            <span>Enter DJ Dashboard</span>
          </button>
          
          <button 
            onClick={onQuickDemo}
            className="w-full py-3.5 px-6 rounded-xl font-semibold text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-cyan-500/50 uppercase tracking-wide transition-all duration-200 flex items-center justify-center gap-2 group"
          >
            <Play className="w-4 h-4 text-cyan-400 fill-cyan-400" />
            <span>Quick Launch Demo Party</span>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform ml-auto" />
          </button>
        </div>
        
        <p className="text-[11px] text-slate-500 mt-4 font-mono">
          NO API KEYS REQUIRED FOR CORE AI HOSTING
        </p>
      </div>

      {/* Feature Grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 text-left hover:border-emerald-500/40 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
            <Mic2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base mb-1">Dynamic Voice Hosting</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            AI personas speak between tracks, hyping up guests and shouting out VIPs with customized pitch & tone.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 text-left hover:border-cyan-500/40 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-3">
            <Sliders className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base mb-1">Smart Crate Digging</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Intelligent setlist flow matching song BPM, musical keys, and dancefloor energy progression.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 text-left hover:border-fuchsia-500/40 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-fuchsia-500/10 text-fuchsia-400 flex items-center justify-center mb-3">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base mb-1">Tactile FX Sampler</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Trigger stadium airhorns, vinyl scratches, sub booms, and laser sweeps directly on the live stage.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 text-left hover:border-yellow-500/40 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/10 text-yellow-400 flex items-center justify-center mb-3">
            <Music className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base mb-1">Multi-Source Crates</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Sync Spotify, Apple Music, upload local audio files, or pull from the exclusive Sound Benders Vault.
          </p>
        </div>
      </div>
    </div>
  );
};
