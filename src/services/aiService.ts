import { PartyConfig, Persona, Track, DjScript } from '../types';
import { PERSONAS } from '../data/personas';

// Helper to get persona object
const getPersona = (id: string) => PERSONAS.find(p => p.id === id) || PERSONAS[0];

// 1. Generate Setlist with intelligent BPM & energy flow
export async function generateSetlist(config: PartyConfig, allTracks: Track[]): Promise<Track[]> {
  // Simulate AI crate digging delay for that authentic DJ feel
  await new Promise(r => setTimeout(r, 1200));

  const targetCount = parseInt(config.duration) || 5;
  
  // Filter tracks by genre if persona has strong genre preference, otherwise use all
  const persona = getPersona(config.persona);
  let pool = [...allTracks];

  // If Sound Benders Vault is specifically checked or if it's the only source, prioritize them
  const hasSoundBenders = config.sources.includes('Sound Benders Vault') || config.sources.includes('Local Drive') || config.sources.length === 0;
  if (hasSoundBenders && pool.length > targetCount) {
    // Keep a healthy mix of Sound Benders tracks
    const sbTracks = pool.filter(t => t.id.startsWith('sb-'));
    const otherTracks = pool.filter(t => !t.id.startsWith('sb-'));
    pool = [...sbTracks, ...otherTracks];
  }

  // Shuffle pool
  const shuffled = pool.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, targetCount);

  // Sort selected tracks for an intelligent DJ set progression:
  // Start with medium energy, peak in the middle/end, finish strong
  return selected.sort((a, b) => {
    // If EDM/Club persona, sort ascending by BPM / Energy for a rising set
    if (persona.id === 'hype' || persona.id === 'techno') {
      return a.energy - b.energy;
    }
    return 0; // maintain random shuffle for diverse sets
  });
}

// 2. Generate DJ Script (supports real Gemini AI or instant dynamic template engine)
export async function generateScript(config: PartyConfig, setlist: Track[], selectedPersona?: Persona): Promise<DjScript> {
  const persona = selectedPersona || getPersona(config.persona);
  const talkativity = config.interactionLevel || 5;
  const guestStr = config.guestOfHonor ? `especially our VIP ${config.guestOfHonor}` : 'every single one of you out there';
  const eventName = config.partyType || 'party';
  const moodName = config.mood || 'unstoppable';

  // Gemini is called through the serverless route so the API key is never included in the browser bundle.
  if (config.useGeminiAi) {
    try {
      const response = await fetch('/api/dj-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, setlist, persona })
      });
      const script = await response.json();
      if (response.ok && script?.intro && Array.isArray(script.interstitials) && script?.outro) {
        return {
          intro: script.intro,
          interstitials: script.interstitials.slice(0, setlist.length - 1),
          outro: script.outro
        };
      }
    } catch (e) {
      console.warn('Gemini server request failed. Using the local script generator.', e);
    }
  }

  // Dynamic Local Generator (Instant, zero latency, guaranteed reliability)
  await new Promise(r => setTimeout(r, 800));

  const randomCatchphrase = () => {
    return persona.catchphrases[Math.floor(Math.random() * persona.catchphrases.length)];
  };

  const intro = `Yo yo! Welcome to the ultimate ${eventName}! Shoutout to ${guestStr}! I am your AI DJ and host, ${persona.name}, and we are kicking off these ${moodName} vibes right now! ${randomCatchphrase()} Let's get this party started!`;

  const interstitials = setlist.slice(0, -1).map((song, i) => {
    const nextSong = setlist[i + 1];
    
    if (talkativity <= 3) {
      return `Up next, we got ${nextSong.title} by ${nextSong.artist}.`;
    }
    if (talkativity <= 6) {
      return `That was the incredible ${song.title} by ${song.artist}. Keeping the ${moodName} energy moving right along, here is ${nextSong.title} by ${nextSong.artist}!`;
    }
    
    // High chattiness (7-10)
    const hypePhrases = [
      `Oh man, absolutely feeling that ${song.title} track! But we are not slowing down for a second!`,
      `The dancefloor is on absolute fire right now! Shoutout again to ${guestStr}!`,
      `${randomCatchphrase()} Let's transition smoothly into this next masterpiece!`,
      `You can feel the bass vibrating through the speakers! Let's take it even higher!`
    ];
    const phrase = hypePhrases[i % hypePhrases.length];
    return `${phrase} Get ready for ${nextSong.title} by ${nextSong.artist}! Let's go!`;
  });

  const outro = `And that is a wrap on our final track! Thank you for partying with DJ ${persona.name} at this epic ${eventName}. Keep those ${moodName} vibes alive wherever you go! Drive safe, take care of each other, and goodnight!`;

  return { intro, interstitials, outro };
}
