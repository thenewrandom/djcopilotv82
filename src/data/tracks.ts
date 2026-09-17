import { Track } from '../types';

export const TRACK_CATALOG: Track[] = [
  // Original Sound Benders Vault (from prototype)
  {
    id: 'sb-1',
    title: "All Eyes On You",
    artist: "The Sound Benders",
    albumCover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80", // High quality fallback cover for stability
    audioUrl: "https://voca.ro/1nlvxxF488cw",
    bpm: 128,
    key: "8A",
    energy: 9,
    genre: "EDM / Club",
    tags: ["club", "hype", "banger", "electronic", "sound benders"]
  },
  {
    id: 'sb-2',
    title: "Club Shadow",
    artist: "The Sound Benders",
    albumCover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80",
    audioUrl: "https://voca.ro/14nmS3NBNvXb",
    bpm: 126,
    key: "11B",
    energy: 8,
    genre: "EDM / Club",
    tags: ["club", "dark", "heavy", "techno", "sound benders"]
  },
  {
    id: 'sb-3',
    title: "First Touch",
    artist: "The Sound Benders",
    albumCover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&auto=format&fit=crop&q=80",
    audioUrl: "https://voca.ro/1lRMQxwTPI82",
    bpm: 120,
    key: "5A",
    energy: 7,
    genre: "EDM / Club",
    tags: ["melodic", "dance", "synth", "sound benders"]
  },
  {
    id: 'sb-4',
    title: "In A Void",
    artist: "The Sound Benders",
    albumCover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80",
    audioUrl: "https://voca.ro/1igRz2UWr2yl",
    bpm: 132,
    key: "4A",
    energy: 9,
    genre: "EDM / Club",
    tags: ["club", "bass", "void", "sound benders"]
  },
  {
    id: 'sb-5',
    title: "Locked In",
    artist: "The Sound Benders",
    albumCover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=80",
    audioUrl: "https://voca.ro/13zz2h3felP0",
    bpm: 130,
    key: "6A",
    energy: 10,
    genre: "EDM / Club",
    tags: ["hype", "locked in", "festival", "sound benders"]
  },
  {
    id: 'sb-6',
    title: "Through the Night",
    artist: "The Sound Benders",
    albumCover: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&auto=format&fit=crop&q=80",
    audioUrl: "https://voca.ro/17w9mOt7VS3c",
    bpm: 124,
    key: "9B",
    energy: 8,
    genre: "EDM / Club",
    tags: ["night", "club", "vibes", "sound benders"]
  },
  {
    id: 'sb-7',
    title: "Mind Games",
    artist: "The Sound Benders",
    albumCover: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=500&auto=format&fit=crop&q=80",
    audioUrl: "https://voca.ro/1eHgT0DzPL0p",
    bpm: 128,
    key: "2A",
    energy: 8,
    genre: "EDM / Club",
    tags: ["club", "mind", "electronic", "sound benders"]
  },
  {
    id: 'sb-8',
    title: "Midnight Harbor",
    artist: "The Sound Benders",
    albumCover: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&auto=format&fit=crop&q=80",
    audioUrl: "https://voca.ro/1aRXnzZXmaMj",
    bpm: 118,
    key: "7A",
    energy: 6,
    genre: "Lo-Fi / Chill",
    tags: ["chill", "midnight", "harbor", "smooth", "sound benders"]
  },
  {
    id: 'sb-9',
    title: "No Filter",
    artist: "The Sound Benders",
    albumCover: "https://images.unsplash.com/photo-1545128485-c400e7702796?w=500&auto=format&fit=crop&q=80",
    audioUrl: "https://voca.ro/1mhD3pyfF8x9",
    bpm: 125,
    key: "3A",
    energy: 9,
    genre: "EDM / Club",
    tags: ["filter", "hype", "club", "sound benders"]
  },
  {
    id: 'sb-10',
    title: "Middle of the Night",
    artist: "The Sound Benders",
    albumCover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=80",
    audioUrl: "https://voca.ro/1496vhd4enq2",
    bpm: 122,
    key: "10A",
    energy: 7,
    genre: "EDM / Club",
    tags: ["night", "dance", "club", "sound benders"]
  },

  // Additional Lo-Fi / Chill / Lounge Crate
  {
    id: 'chill-1',
    title: "Rooftop Rain & Espresso",
    artist: "Koto Beats",
    albumCover: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=500&auto=format&fit=crop&q=80",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    bpm: 88,
    key: "5B",
    energy: 4,
    genre: "Lo-Fi / Chill",
    tags: ["chill", "study", "rain", "coffee", "jazz"]
  },
  {
    id: 'chill-2',
    title: "Tokyo Midnight Transit",
    artist: "Lo-Fi Horizon",
    albumCover: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=500&auto=format&fit=crop&q=80",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    bpm: 92,
    key: "8B",
    energy: 5,
    genre: "Lo-Fi / Chill",
    tags: ["tokyo", "lofi", "chill", "night", "synth"]
  },

  // Hip Hop / Trap / R&B Crate
  {
    id: 'hh-1',
    title: "Velvet 808s",
    artist: "Metro Pulse",
    albumCover: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    bpm: 140,
    key: "1A",
    energy: 8,
    genre: "Hip Hop / Trap",
    tags: ["trap", "bass", "808", "hiphop", "smooth"]
  },
  {
    id: 'hh-2',
    title: "Gold Chain Skyline",
    artist: "Sirius Flow",
    albumCover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    bpm: 96,
    key: "6B",
    energy: 7,
    genre: "Hip Hop / R&B",
    tags: ["rnb", "flow", "skyline", "cool"]
  },

  // 80s/90s Retro Disco Crate
  {
    id: 'ret-1',
    title: "Neon Roller Rink",
    artist: "Synthwave 1984",
    albumCover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=80",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    bpm: 118,
    key: "9A",
    energy: 8,
    genre: "80s/90s Pop",
    tags: ["retro", "disco", "80s", "synth", "dance"]
  },
  {
    id: 'ret-2',
    title: "Starlight Boulevard",
    artist: "The Disco Nauts",
    albumCover: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&auto=format&fit=crop&q=80",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    bpm: 122,
    key: "11A",
    energy: 9,
    genre: "80s/90s Pop",
    tags: ["disco", "funk", "starlight", "nostalgia"]
  },

  // Cyberpunk / Techno Crate
  {
    id: 'tech-1',
    title: "Neural Overdrive 2099",
    artist: "Cybernetic Core",
    albumCover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=80",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    bpm: 136,
    key: "4B",
    energy: 10,
    genre: "Techno",
    tags: ["techno", "cyberpunk", "industrial", "future", "bass"]
  },
  {
    id: 'tech-2',
    title: "Grid runner",
    artist: "Quantum Matrix",
    albumCover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=80",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    bpm: 138,
    key: "2B",
    energy: 9,
    genre: "Techno",
    tags: ["techno", "matrix", "grid", "hypnotic"]
  },

  // Country / Folk Crate
  {
    id: 'cnt-1',
    title: "Southern Campfire Glow",
    artist: "Whiskey Bend",
    albumCover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    bpm: 104,
    key: "7B",
    energy: 6,
    genre: "Country / Rock",
    tags: ["country", "acoustic", "campfire", "guitar", "folk"]
  },
  {
    id: 'cnt-2',
    title: "Open Highway 66",
    artist: "Dakota Ridge",
    albumCover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&auto=format&fit=crop&q=80",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    bpm: 112,
    key: "3B",
    energy: 7,
    genre: "Country / Rock",
    tags: ["country", "rock", "highway", "anthem"]
  }
];
