import React from 'react';
import { Headphones, Sparkles, Volume2, VolumeX, Radio, ShieldCheck } from 'lucide-react';
import { Persona } from '../types';

interface NavbarProps {
  currentView: string;
  activePersona?: Persona;
  connectedSourcesCount: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onNavigateHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  activePersona,
  connectedSourcesCount,
  isMuted,
  onToggleMute,
  onNavigateHome
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <button 
          onClick={onNavigateHome}
          className="flex items-center gap-3 text-left group focus:outline-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 via-cyan-500 to-fuchsia-500 p-0.5 shadow-[0_0_20px_rgba(16,185,129,0.4)] group-hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] transition-all">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Headphones className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-cyan-200 to-emerald-400 uppercase">
                DJ COPILOT
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-cyan-400/10 text-cyan-400 border border-cyan-500/30">
                AI PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 -mt-0.5 hidden sm:block font-mono">
              REAL-TIME VOICE HOSTING & MIXING
            </p>
          </div>
        </button>

        {/* Right Status Indicators & Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Active Persona Badge (When not in landing) */}
          {currentView !== 'landing' && activePersona && (
            <div 
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold"
              style={{ 
                backgroundColor: `${activePersona.color}15`, 
                borderColor: `${activePersona.color}40`,
                color: activePersona.color 
              }}
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>DJ: {activePersona.name}</span>
            </div>
          )}

          {/* Connected Sources Counter */}
          {currentView !== 'landing' && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-300 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{connectedSourcesCount} Source{connectedSourcesCount !== 1 ? 's' : ''} Ready</span>
            </div>
          )}

          {/* Trial / VIP Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">VIP ACCESS</span>
            <span className="sm:hidden">VIP</span>
          </div>

          {/* Global Sound FX Mute Toggle */}
          <button
            onClick={onToggleMute}
            title={isMuted ? "Unmute Sound FX" : "Mute Sound FX"}
            className={`p-2 rounded-lg border transition-all ${
              isMuted 
                ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20' 
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-slate-100'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
