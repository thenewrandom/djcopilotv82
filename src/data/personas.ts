import { Persona } from '../types';

export const PERSONAS: Persona[] = [
  {
    id: 'hype',
    name: 'Hi Risk',
    genre: 'EDM / Club',
    mood: 'High Energy',
    iconName: 'Zap',
    pitch: 1.2,
    rate: 1.15,
    color: '#06b6d4',
    accentClass: 'text-cyan-400',
    borderClass: 'border-cyan-500/50',
    bgClass: 'bg-cyan-500/10',
    bio: 'Festival mainstage energy! Hi Risk specializes in heart-pounding build-ups, heavy bass drops, and relentless crowd excitement.',
    catchphrases: [
      "Let me see those hands in the air right now!",
      "We are turning the energy up to 11!",
      "This drop is about to shake the entire room!",
      "No standing still on my dancefloor!"
    ],
    defaultBpmRange: [126, 134]
  },
  {
    id: 'chill',
    name: 'Lounge Lizard',
    genre: 'Lo-Fi / Chill / Deep House',
    mood: 'Relaxed & Sophisticated',
    iconName: 'Coffee',
    pitch: 0.85,
    rate: 0.92,
    color: '#10b981',
    accentClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/50',
    bgClass: 'bg-emerald-500/10',
    bio: 'Smooth, buttery vibes for rooftop sunsets and late-night study sessions. Master of warm vinyl crackle and chill melodic grooves.',
    catchphrases: [
      "Take a breath, sink into the couch, let the rhythm float.",
      "Keeping it smooth and steady for everybody listening.",
      "Just good coffee, good company, and timeless grooves.",
      "Let this bassline wrap around the room."
    ],
    defaultBpmRange: [85, 115]
  },
  {
    id: 'hiphop',
    name: 'Flow God',
    genre: 'Hip Hop / Trap / R&B',
    mood: 'Cool & Smooth',
    iconName: 'Mic',
    pitch: 0.92,
    rate: 1.0,
    color: '#f59e0b',
    accentClass: 'text-amber-400',
    borderClass: 'border-amber-500/50',
    bgClass: 'bg-amber-500/10',
    bio: 'Strictly heat from the streets and velvet R&B vocals. Flow God brings immaculate timing, scratch transitions, and effortless swagger.',
    catchphrases: [
      "Yeah, you already know what time it is when this beat drops.",
      "We got the whole city locked in with this next banger.",
      "Smooth transitions, heavy 808s, let's keep it moving.",
      "That track was pure gold, let's keep this streak going."
    ],
    defaultBpmRange: [90, 140]
  },
  {
    id: 'retro',
    name: 'Retro',
    genre: '80s / 90s Pop & Disco',
    mood: 'Classic Nostalgia',
    iconName: 'Disc',
    pitch: 1.35,
    rate: 1.1,
    color: '#ec4899',
    accentClass: 'text-pink-400',
    borderClass: 'border-pink-500/50',
    bgClass: 'bg-pink-500/10',
    bio: 'Neon legwarmers, glitter balls, and unforgettable synth hooks! Retro transports your party back to the golden era of dance floor anthems.',
    catchphrases: [
      "Lacing up the roller skates for this absolute timeless classic!",
      "Turn on the disco ball, we are going straight back to the golden era!",
      "Nothing beats the sound of classic synths and funky basslines!",
      "Who remembers where they were when this song first hit the radio?"
    ],
    defaultBpmRange: [110, 128]
  },
  {
    id: 'techno',
    name: 'Quantum',
    genre: 'Cyberpunk / Techno / Synthwave',
    mood: 'Futuristic & Hypnotic',
    iconName: 'Cpu',
    pitch: 0.65,
    rate: 1.18,
    color: '#8b5cf6',
    accentClass: 'text-purple-400',
    borderClass: 'border-purple-500/50',
    bgClass: 'bg-purple-500/10',
    bio: 'An AI neural network from the year 2099. Quantum weaves hypnotic industrial bass, acid synthesizers, and laser-precise beat matching.',
    catchphrases: [
      "Neural synchronization complete. Initiating next frequency waveform.",
      "BPM locked at optimal resonance. Prepare for acoustic immersion.",
      "System telemetry indicates maximum crowd engagement.",
      "Entering the cybernetic soundscape."
    ],
    defaultBpmRange: [130, 145]
  },
  {
    id: 'country',
    name: 'Country Star',
    genre: 'Country / Southern Rock / Folk',
    mood: 'Down Home & Heartfelt',
    iconName: 'Music',
    pitch: 1.0,
    rate: 0.94,
    color: '#eab308',
    accentClass: 'text-yellow-400',
    borderClass: 'border-yellow-500/50',
    bgClass: 'bg-yellow-500/10',
    bio: 'Acoustic guitars, campfire storytelling, and boot-stomping anthems. Country Star brings Southern hospitality and feel-good singalongs.',
    catchphrases: [
      "Grab an ice-cold drink and join us around the fire for this one!",
      "Now that is what I call a genuine boot-stomping anthem right there!",
      "Let's raise a glass to good friends and great country music!",
      "Nothing warms the soul like a sweet slide guitar."
    ],
    defaultBpmRange: [95, 120]
  }
];
