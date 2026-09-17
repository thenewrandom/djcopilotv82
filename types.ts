export interface Persona {
  voiceId?: string;
  voiceProvider?: 'elevenlabs';
  isUserVoice?: boolean;
  id: string;
  name: string;
  genre: string;
  mood: string;
  iconName: string;
  pitch: number;
  rate: number;
  color: string;
  accentClass: string;
  borderClass: string;
  bgClass: string;
  bio: string;
  catchphrases: string[];
  defaultBpmRange: [number, number];
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  albumCover: string;
  audioUrl: string;
  bpm: number;
  key: string;
  energy: number; // 1-10
  genre: string;
  tags: string[];
  source?: MusicSource;
  externalUrl?: string;
}

export type MusicSource = 'Spotify' | 'Apple Music' | 'iTunes' | 'Local Drive' | 'Sound Benders Vault';

export interface PartyConfig {
  sources: MusicSource[];
  persona: string;
  interactionLevel: number; // 1-10
  transitions: string[];
  partyType: string;
  guestOfHonor: string;
  mood: string;
  duration: string; // number of tracks as string
  autoDucking: boolean;
  useGeminiAi: boolean;
}

export interface DjScript {
  intro: string;
  interstitials: string[];
  outro: string;
}

export interface LiveRequest {
  id: string;
  sender: string;
  message: string;
  songTitle?: string;
  artist?: string;
  timestamp: Date;
  status: 'pending' | 'shoutout_given' | 'queued';
}

export interface SoundFxItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  trigger: () => void;
}
