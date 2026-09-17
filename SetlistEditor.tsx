import React, { useState } from 'react';
import { VoiceTextInput } from './VoiceTextInput';
import { 
  ListMusic, ArrowLeft, Plus, X, Trash2, Play, Loader, 
  Music, ArrowUp, ArrowDown, Volume2, VolumeX, Sparkles, Shuffle, ShieldAlert
} from 'lucide-react';
import { Track, PartyConfig } from '../types';
import { PERSONAS } from '../data/personas';
import { soundFx } from '../utils/audioEffects';

interface SetlistEditorProps {
  setlist: Track[];
  setSetlist: React.Dispatch<React.SetStateAction<Track[]>>;
  onApprove: () => void;
  isLoading: boolean;
  config: PartyConfig;
  onBack: () => void;
  onAddCustomTrack: (track: Track) => void;
}

export const SetlistEditor: React.FC<SetlistEditorProps> = ({
  setlist,
  setSetlist,
  onApprove,
  isLoading,
  config,
  onBack,
  onAddCustomTrack
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);

  const persona = PERSONAS.find(p => p.id === config.persona) || PERSONAS[0];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle && newUrl) {
      soundFx.playLaser();
      const newTrack: Track = {
        id: `custom-${Date.now()}`,
        title: newTitle,
        artist: newArtist || "Custom Track",
        albumCover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80",
        audioUrl: newUrl,
        bpm: 126,
        key: "8A",
        energy: 8,
        genre: "Custom",
        tags: ["custom"]
      };
      setSetlist([...setlist, newTrack]);
      setNewTitle('');
      setNewArtist('');
      setNewUrl('');
      setIsAdding(false);
    }
  };

  const moveTrack = (index: number, direction: 'up' | 'down') => {
    soundFx.playRewind();
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= setlist.length) return;
    const updated = [...setlist];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;
    setSetlist(updated);
  };

  const removeTrack = (id: string) => {
    soundFx.playScratch();
    setSetlist(setlist.filter(t => t.id !== id));
  };

  const shuffleSetlist = () => {
    soundFx.playLaser();
    const shuffled = [...setlist].sort(() => 0.5 - Math.random());
    setSetlist(shuffled);
  };

  const togglePreview = (track: Track) => {
    if (previewingId === track.id) {
      if (previewAudio) {
        previewAudio.pause();
        setPreviewAudio(null);
      }
      setPreviewingId(null);
      return;
    }

    if (previewAudio) {
      previewAudio.pause();
    }

    // Check if it's a direct audio file or vocaroo
    let playUrl = track.audioUrl;
    const vocaMatch = playUrl.match(/voca\.ro\/([a-zA-Z0-9]+)/);
    if (vocaMatch) {
      playUrl = `https://media.vocaroo.com/mp3/${vocaMatch[1]}`;
    }

    try {
      const audio = new Audio(playUrl);
      audio.volume = 0.5;
      audio.play().catch(e => {
        console.warn("Could not play audio snippet", e);
        soundFx.playHypeSiren(); // Play synth siren if audio link can't autoplay directly
      });
      setPreviewAudio(audio);
      setPreviewingId(track.id);

      audio.onended = () => {
        setPreviewingId(null);
        setPreviewAudio(null);
      };
    } catch (e) {
      console.warn("Preview error", e);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 pb-20 text-slate-100 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-6 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ListMusic className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-cyan-200 to-emerald-400 uppercase">
              Review AI Setlist
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            Curated for <strong className="text-slate-100">{config.partyType}</strong> by AI DJ <strong className={persona.accentClass}>{persona.name}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={onBack}
            className="px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold flex items-center gap-2 transition-all uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            onClick={shuffleSetlist}
            title="Randomize Setlist Order"
            className="px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold flex items-center gap-2 transition-all uppercase tracking-wider"
          >
            <Shuffle className="w-4 h-4 text-fuchsia-400" />
            <span className="hidden sm:inline">Shuffle</span>
          </button>

          <button
            onClick={() => {
              soundFx.playLaser();
              setIsAdding(!isAdding);
            }}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 border border-cyan-400/50 text-xs font-black flex items-center gap-2 shadow-lg transition-all uppercase tracking-wider"
          >
            {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{isAdding ? "Cancel" : "Add Track"}</span>
          </button>
        </div>
      </div>

      {/* Inline Add Form */}
      {isAdding && (
        <form onSubmit={handleAdd} className="bg-slate-900/90 backdrop-blur-md p-5 rounded-2xl mb-6 border border-cyan-500/30 shadow-xl space-y-4 animate-scale-up">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-cyan-300 flex items-center gap-2 uppercase tracking-wider">
              <Plus className="w-4 h-4" /> Add Song To Current Crate
            </h3>
            <button type="button" onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-100">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <VoiceTextInput
              type="text"
              required
              placeholder="Song Title *"
              value={newTitle}
              onValueChange={setNewTitle}
              className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:border-cyan-400 outline-none"
            />
            <VoiceTextInput
              type="text"
              placeholder="Artist Name"
              value={newArtist}
              onValueChange={setNewArtist}
              className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:border-cyan-400 outline-none"
            />
            <VoiceTextInput
              type="text"
              required
              placeholder="Audio URL (.mp3, voca.ro, youtube) *"
              value={newUrl}
              onValueChange={setNewUrl}
              className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:border-cyan-400 outline-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-lg"
            >
              Confirm Track
            </button>
          </div>
        </form>
      )}

      {/* BPM Compatibility / Crate Stats Bar */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-100 uppercase tracking-wide">AI Beat & Key Flow Optimization</div>
            <div className="text-xs text-slate-400">
              {setlist.length} tracks queued • Estimated duration ~{setlist.length * 3.5} mins
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
            BPM HARMONY: 98%
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold">
            TRANSITIONS: READY
          </span>
        </div>
      </div>

      {/* Setlist List */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl overflow-hidden mb-8 border border-emerald-500/30 shadow-2xl">
        {setlist.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <ShieldAlert className="w-10 h-10 mx-auto text-amber-500/50" />
            <p className="text-base font-bold">No songs currently in the crate.</p>
            <button
              onClick={() => setIsAdding(true)}
              className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-black uppercase tracking-wider"
            >
              Add Your First Track
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {setlist.map((song, idx) => {
              const isPreviewing = previewingId === song.id;
              
              return (
                <div
                  key={song.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-slate-800/50 transition-colors group gap-4"
                >
                  {/* Left info */}
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <span className="text-slate-500 w-6 text-right font-mono font-bold text-base sm:text-lg">
                      {idx + 1}
                    </span>

                    {/* Thumbnail & Preview Button */}
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700 group">
                      <img
                        src={song.albumCover}
                        alt={song.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <button
                        onClick={() => togglePreview(song)}
                        title="Preview Track"
                        className={`absolute inset-0 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs transition-opacity ${
                          isPreviewing ? 'opacity-100 bg-cyan-500/80' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {isPreviewing ? <VolumeX className="w-5 h-5 text-slate-100 animate-pulse" /> : <Volume2 className="w-5 h-5 text-slate-100" />}
                      </button>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-base text-slate-100 truncate">{song.title}</h4>
                      <p className="text-xs text-slate-400 truncate">{song.artist}</p>
                    </div>
                  </div>

                  {/* Middle Tags & BPM */}
                  <div className="flex items-center gap-2 sm:gap-3 pl-10 sm:pl-0">
                    <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-950/40 border border-slate-800 text-slate-300">
                      {song.bpm || 125} BPM
                    </span>
                    <span className="text-[11px] font-mono px-2 py-1 rounded bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300">
                      KEY: {song.key || '8A'}
                    </span>
                    <div className="hidden md:flex items-center gap-0.5" title={`Energy: ${song.energy || 7}/10`}>
                      {Array.from({ length: 5 }).map((_, dotIdx) => (
                        <div
                          key={dotIdx}
                          className={`w-1.5 h-3 rounded-sm ${
                            dotIdx < Math.round((song.energy || 7) / 2) ? 'bg-cyan-400' : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                    <button
                      onClick={() => moveTrack(idx, 'up')}
                      disabled={idx === 0}
                      title="Move Up"
                      className="p-2 rounded-lg bg-slate-950/40 hover:bg-slate-800 text-slate-400 hover:text-slate-100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveTrack(idx, 'down')}
                      disabled={idx === setlist.length - 1}
                      title="Move Down"
                      className="p-2 rounded-lg bg-slate-950/40 hover:bg-slate-800 text-slate-400 hover:text-slate-100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeTrack(song.id)}
                      title="Remove Track"
                      className="p-2 rounded-lg bg-slate-950/40 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors ml-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Start Party Main Launch */}
      <button
        onClick={() => {
          if (previewAudio) {
            previewAudio.pause();
            setPreviewAudio(null);
          }
          soundFx.playAirhorn();
          onApprove();
        }}
        disabled={isLoading || setlist.length === 0}
        className="w-full py-5 px-6 rounded-2xl font-black text-xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-fuchsia-500 hover:from-emerald-400 hover:to-fuchsia-400 text-slate-950 uppercase tracking-widest shadow-[0_0_35px_rgba(16,185,129,0.5)] hover:shadow-[0_0_50px_rgba(6,182,212,0.8)] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
      >
        {isLoading ? (
          <>
            <Loader className="w-6 h-6 animate-spin text-slate-950" />
            <span>PREPARING AI DJ SYSTEM...</span>
          </>
        ) : (
          <>
            <Play className="w-6 h-6 fill-slate-950 text-slate-950" />
            <span>START THE PARTY</span>
          </>
        )}
      </button>

    </div>
  );
};
