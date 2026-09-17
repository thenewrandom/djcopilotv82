// DJ Copilot Sound FX engine.
// If a custom MP3 exists in /audio/fx, it is used. Otherwise we fall back to the
// original Web Audio synth so the app remains functional before custom assets arrive.

class SoundEffectsEngine {
  private ctx: AudioContext | null = null;
  private customCache = new Map<string, HTMLAudioElement>();

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private playCustom(name: string): boolean {
    try {
      let audio = this.customCache.get(name);
      if (!audio) {
        audio = new Audio(`/audio/fx/${name}.mp3`);
        audio.preload = 'auto';
        this.customCache.set(name, audio);
      }
      audio.currentTime = 0;
      audio.volume = 1;
      const result = audio.play();
      result.catch(() => this.customCache.delete(name));
      return true;
    } catch {
      return false;
    }
  }

  playAirhorn() {
    if (this.playCustom('airhorn')) return;
    try {
      const ctx = this.getContext(), now = ctx.currentTime;
      const blast = (time: number, duration: number) => {
        const oscs = [466.16, 466.16 * 1.26, 466.16 * 1.5].map(freq => {
          const osc = ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.setValueAtTime(freq, time); return osc;
        });
        const gain = ctx.createGain(); gain.gain.setValueAtTime(0.3, time); gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
        oscs.forEach(o => o.connect(gain)); gain.connect(ctx.destination); oscs.forEach(o => { o.start(time); o.stop(time + duration); });
      };
      blast(now, .12); blast(now + .14, .12); blast(now + .28, .45);
    } catch (e) { console.warn('AudioContext error playing airhorn', e); }
  }

  playScratch() {
    if (this.playCustom('scratch')) return;
    try {
      const ctx = this.getContext(), now = ctx.currentTime, osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(40, now + .25); osc.frequency.linearRampToValueAtTime(800, now + .35); osc.frequency.exponentialRampToValueAtTime(20, now + .5);
      gain.gain.setValueAtTime(.4, now); gain.gain.exponentialRampToValueAtTime(.01, now + .5); osc.connect(gain); gain.connect(ctx.destination); osc.start(now); osc.stop(now + .5);
    } catch (e) { console.warn('AudioContext error playing scratch', e); }
  }

  playSubBoom() {
    if (this.playCustom('sub-boom')) return;
    try {
      const ctx = this.getContext(), now = ctx.currentTime, osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(120, now); osc.frequency.exponentialRampToValueAtTime(28, now + 1.2); gain.gain.setValueAtTime(.7, now); gain.gain.exponentialRampToValueAtTime(.001, now + 1.2); osc.connect(gain); gain.connect(ctx.destination); osc.start(now); osc.stop(now + 1.2);
    } catch (e) { console.warn('AudioContext error playing sub boom', e); }
  }

  playLaser() {
    if (this.playCustom('laser')) return;
    try {
      const ctx = this.getContext(), now = ctx.currentTime;
      const shoot = (start: number) => { const osc = ctx.createOscillator(), gain = ctx.createGain(); osc.type = 'square'; osc.frequency.setValueAtTime(1400, start); osc.frequency.exponentialRampToValueAtTime(100, start + .18); gain.gain.setValueAtTime(.25, start); gain.gain.exponentialRampToValueAtTime(.01, start + .18); osc.connect(gain); gain.connect(ctx.destination); osc.start(start); osc.stop(start + .18); };
      shoot(now); shoot(now + .1);
    } catch (e) { console.warn('AudioContext error playing laser', e); }
  }

  playHypeSiren() {
    if (this.playCustom('hype-siren')) return;
    try {
      const ctx = this.getContext(), now = ctx.currentTime, osc = ctx.createOscillator(), gain = ctx.createGain(); osc.type = 'sawtooth';
      for (let i = 0; i < 4; i++) { const t = now + i * .25; osc.frequency.setValueAtTime(400, t); osc.frequency.linearRampToValueAtTime(880, t + .12); osc.frequency.linearRampToValueAtTime(400, t + .25); }
      gain.gain.setValueAtTime(.25, now); gain.gain.exponentialRampToValueAtTime(.01, now + 1); osc.connect(gain); gain.connect(ctx.destination); osc.start(now); osc.stop(now + 1);
    } catch (e) { console.warn('AudioContext error playing hype siren', e); }
  }

  playRewind() {
    if (this.playCustom('rewind')) return;
    try {
      const ctx = this.getContext(), now = ctx.currentTime, osc = ctx.createOscillator(), gain = ctx.createGain(); osc.type = 'triangle'; osc.frequency.setValueAtTime(50, now); osc.frequency.exponentialRampToValueAtTime(2000, now + .35); gain.gain.setValueAtTime(.3, now); gain.gain.exponentialRampToValueAtTime(.01, now + .35); osc.connect(gain); gain.connect(ctx.destination); osc.start(now); osc.stop(now + .35);
    } catch (e) { console.warn('AudioContext error playing rewind', e); }
  }
}

export const soundFx = new SoundEffectsEngine();
