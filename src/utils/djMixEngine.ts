// Browser-native DJ DSP engine. These are real Web Audio processing nodes rather than UI-only animations.
export type TransitionName = 'Pitch/Tempo Sync' | 'Scratching' | 'EQ Blending' | 'Laser Sweeps';

class DJMixEngine {
  private ctx: AudioContext | null = null;
  private nodes = new WeakMap<HTMLAudioElement, { source: MediaElementAudioSourceNode; gain: GainNode; low: BiquadFilterNode; mid: BiquadFilterNode; high: BiquadFilterNode; dry: GainNode }>();
  private scratchTimers = new Map<HTMLAudioElement, number>();

  private context() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new Ctx();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  connect(audio: HTMLAudioElement) {
    if (this.nodes.has(audio)) return this.nodes.get(audio)!;
    try {
      const ctx = this.context();
      audio.crossOrigin = 'anonymous';
      const source = ctx.createMediaElementSource(audio);
      const low = ctx.createBiquadFilter(); low.type = 'lowshelf'; low.frequency.value = 180;
      const mid = ctx.createBiquadFilter(); mid.type = 'peaking'; mid.frequency.value = 1000; mid.Q.value = 0.8;
      const high = ctx.createBiquadFilter(); high.type = 'highshelf'; high.frequency.value = 5000;
      const gain = ctx.createGain(); const dry = ctx.createGain();
      source.connect(low).connect(mid).connect(high).connect(gain).connect(ctx.destination);
      source.connect(dry).connect(ctx.destination);
      const entry = { source, gain, low, mid, high, dry };
      this.nodes.set(audio, entry);
      return entry;
    } catch (e) {
      console.warn('DJ DSP connection unavailable; using native media controls.', e);
      return null;
    }
  }

  setEQ(audio: HTMLAudioElement, lowDb: number, midDb: number, highDb: number) {
    const n = this.connect(audio); if (!n) return;
    n.low.gain.value = Math.max(-18, Math.min(18, lowDb));
    n.mid.gain.value = Math.max(-18, Math.min(18, midDb));
    n.high.gain.value = Math.max(-18, Math.min(18, highDb));
  }

  crossfade(audio: HTMLAudioElement, from: number, to: number, ms = 1200) {
    const n = this.connect(audio); if (!n) { audio.volume = to; return; }
    const now = this.context().currentTime;
    n.gain.gain.cancelScheduledValues(now);
    n.gain.gain.setValueAtTime(from, now);
    n.gain.gain.linearRampToValueAtTime(to, now + ms / 1000);
  }

  pitchTempoSync(audio: HTMLAudioElement, fromBpm: number, toBpm: number, durationMs = 1800) {
    const targetRate = Math.max(0.5, Math.min(2, toBpm / Math.max(1, fromBpm)));
    const start = performance.now();
    const initial = audio.playbackRate;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = p * p * (3 - 2 * p);
      audio.playbackRate = initial + (targetRate - initial) * eased;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  scratch(audio: HTMLAudioElement, durationMs = 650) {
    this.stopScratch(audio);
    const start = performance.now();
    const original = audio.playbackRate;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const envelope = Math.sin(p * Math.PI);
      const rate = p < 0.5 ? 0.12 + envelope * 0.95 : 1.05 - envelope * 0.93;
      audio.playbackRate = Math.max(0.05, rate);
      if (p < 1) this.scratchTimers.set(audio, requestAnimationFrame(tick));
      else { audio.playbackRate = original; this.scratchTimers.delete(audio); }
    };
    this.scratchTimers.set(audio, requestAnimationFrame(tick));
  }

  stopScratch(audio: HTMLAudioElement) {
    const id = this.scratchTimers.get(audio); if (id !== undefined) cancelAnimationFrame(id);
    this.scratchTimers.delete(audio);
  }

  laserSweep(durationMs = 700) {
    try {
      const ctx = this.context(); const now = ctx.currentTime;
      const osc = ctx.createOscillator(); const gain = ctx.createGain(); const filter = ctx.createBiquadFilter();
      osc.type = 'sawtooth'; filter.type = 'bandpass'; filter.Q.value = 7;
      osc.frequency.setValueAtTime(160, now); osc.frequency.exponentialRampToValueAtTime(6200, now + durationMs / 1000);
      filter.frequency.setValueAtTime(500, now); filter.frequency.exponentialRampToValueAtTime(5000, now + durationMs / 1000);
      gain.gain.setValueAtTime(0.0001, now); gain.gain.exponentialRampToValueAtTime(0.22, now + 0.03); gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
      osc.connect(filter).connect(gain).connect(ctx.destination); osc.start(now); osc.stop(now + durationMs / 1000 + 0.05);
    } catch (e) { console.warn('Laser DSP unavailable', e); }
  }

  applyTransition(name: TransitionName, current: HTMLAudioElement | null, fromBpm: number, toBpm: number) {
    if (name === 'Pitch/Tempo Sync' && current) this.pitchTempoSync(current, fromBpm, toBpm);
    if (name === 'Scratching' && current) this.scratch(current);
    if (name === 'EQ Blending' && current) {
      this.setEQ(current, -12, 2, 1);
      window.setTimeout(() => this.setEQ(current, -3, 1, 0), 550);
      window.setTimeout(() => this.setEQ(current, 0, 0, 0), 1200);
    }
    if (name === 'Laser Sweeps') this.laserSweep();
  }
}

export const djMix = new DJMixEngine();
