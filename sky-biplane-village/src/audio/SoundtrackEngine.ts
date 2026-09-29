export interface SongInfo {
  id: number;
  title: string;
  jpTitle: string;
  tempoBpm: number;
  instrumentLead: string;
}

export const SONGS: SongInfo[] = [
  {
    id: 0,
    title: 'Morning Wind Over Pastures',
    jpTitle: '牧場を渡る朝風',
    tempoBpm: 84,
    instrumentLead: 'Acoustic Guitar, Accordion & Flute',
  },
  {
    id: 1,
    title: 'Biplane in the Sunbeams',
    jpTitle: '木漏れ日の複葉機',
    tempoBpm: 92,
    instrumentLead: 'Felt Piano, Pizzicato & Oboe',
  },
  {
    id: 2,
    title: 'Cottage Chimney Waltz',
    jpTitle: '煙突と緑屋根のワルツ',
    tempoBpm: 74,
    instrumentLead: 'Concert Harp, Celesta & Strings',
  },
];

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Studio-grade Web Audio API polyphonic synthesizer with stereo concert hall reverb,
 * gentle sky-breeze & wooden propeller ambience, and 3 Studio Ghibli-inspired pastoral flight songs.
 */
class SoundtrackEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private breezeGain: GainNode | null = null;

  private isPlaying = false;
  private currentSongIdx = 0;
  private stepIndex = 0;
  private schedulerTimer: number | null = null;
  private listeners = new Set<() => void>();

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }

  public getState(): { isPlaying: boolean; song: SongInfo; songIndex: number } {
    return {
      isPlaying: this.isPlaying,
      song: SONGS[this.currentSongIdx],
      songIndex: this.currentSongIdx,
    };
  }

  private initContext(): void {
    if (this.ctx) return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.54;
    this.masterGain.connect(this.ctx.destination);

    this.dryGain = this.ctx.createGain();
    this.dryGain.gain.value = 0.62;
    this.dryGain.connect(this.masterGain);

    this.wetGain = this.ctx.createGain();
    this.wetGain.gain.value = 0.52;
    this.wetGain.connect(this.masterGain);

    this.reverbNode = this.createWarmHallReverb(2.7, 2.3);
    this.reverbNode.connect(this.wetGain);

    this.startSkyBreezeAmbience();
  }

  private createWarmHallReverb(durationSeconds: number, decay: number): ConvolverNode {
    const ctx = this.ctx!;
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * durationSeconds);
    const impulse = ctx.createBuffer(2, length, rate);

    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < length; i++) {
        const t = i / length;
        const env = Math.pow(1 - t, decay);
        const white = (Math.random() * 2 - 1) * env;
        lp = lp * 0.78 + white * 0.22;
        data[i] = lp * 0.85;
      }
    }

    const convolver = ctx.createConvolver();
    convolver.buffer = impulse;
    return convolver;
  }

  private startSkyBreezeAmbience(): void {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const rate = ctx.sampleRate;
    const len = rate * 4;
    const buf = ctx.createBuffer(1, len, rate);
    const data = buf.getChannelData(0);

    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + white * 0.028;
      b1 = 0.985 * b1 + white * 0.042;
      b2 = 0.95 * b2 + white * 0.06;
      data[i] = (b0 + b1 + b2) * 0.14;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 390;
    filter.Q.value = 0.85;

    this.breezeGain = ctx.createGain();
    this.breezeGain.gain.value = 0.0;

    src.connect(filter);
    filter.connect(this.breezeGain);
    this.breezeGain.connect(this.masterGain);
    src.start();
  }

  public async start(): Promise<void> {
    this.initContext();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    if (this.isPlaying) return;
    this.isPlaying = true;

    if (this.breezeGain && this.ctx) {
      this.breezeGain.gain.setTargetAtTime(0.08, this.ctx.currentTime, 0.5);
    }

    this.scheduleLoop();
    this.notify();
  }

  public stop(): void {
    this.isPlaying = false;
    if (this.schedulerTimer !== null) {
      window.clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    if (this.breezeGain && this.ctx) {
      this.breezeGain.gain.setTargetAtTime(0.0, this.ctx.currentTime, 0.3);
    }
    this.notify();
  }

  public async toggle(): Promise<void> {
    if (this.isPlaying) {
      this.stop();
    } else {
      await this.start();
    }
  }

  public async nextSong(): Promise<void> {
    this.currentSongIdx = (this.currentSongIdx + 1) % SONGS.length;
    this.stepIndex = 0;
    if (!this.isPlaying) {
      await this.start();
    } else {
      if (this.schedulerTimer !== null) {
        window.clearTimeout(this.schedulerTimer);
      }
      this.scheduleLoop();
      this.notify();
    }
  }

  /**
   * Plays a gentle wind-chime arpeggio when the biplane flies through a Sky Ring or Barrel Rolls.
   */
  public playWindRingChime(): void {
    if (!this.ctx || !this.isPlaying) return;
    const now = this.ctx.currentTime;
    const notes = [74, 78, 81, 86];
    notes.forEach((midi, idx) => {
      this.playPluckVoice(midiToFreq(midi), now + idx * 0.055, 0.9, 0.14, (idx - 1.5) * 0.25);
    });
  }

  private playPluckVoice(
    freq: number,
    time: number,
    duration: number,
    volume: number,
    pan = 0
  ): void {
    if (!this.ctx || !this.dryGain || !this.reverbNode) return;
    const ctx = this.ctx;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(freq, time);
    osc2.frequency.setValueAtTime(freq * 2, time);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 5.2, time);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.3, time + duration * 0.8);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.linearRampToValueAtTime(volume, time + 0.015);
    env.gain.exponentialRampToValueAtTime(0.0008, time + duration);

    const panner = ctx.createStereoPanner();
    panner.pan.setValueAtTime(pan, time);

    const g2 = ctx.createGain();
    g2.gain.value = 0.24;

    osc1.connect(filter);
    osc2.connect(g2);
    g2.connect(filter);

    filter.connect(env);
    env.connect(panner);
    panner.connect(this.dryGain);
    panner.connect(this.reverbNode);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration + 0.04);
    osc2.stop(time + duration + 0.04);
  }

  private playFluteOrAccordionVoice(
    freq: number,
    time: number,
    duration: number,
    volume: number,
    pan = 0
  ): void {
    if (!this.ctx || !this.dryGain || !this.reverbNode) return;
    const ctx = this.ctx;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    // Gentle expressive vibrato
    const vib = ctx.createOscillator();
    const vibGain = ctx.createGain();
    vib.frequency.value = 5.2;
    vibGain.gain.value = freq * 0.008;
    vib.connect(vibGain);
    vibGain.connect(osc.frequency);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.linearRampToValueAtTime(volume, time + 0.08);
    env.gain.setValueAtTime(volume * 0.85, time + duration * 0.65);
    env.gain.exponentialRampToValueAtTime(0.0008, time + duration);

    const panner = ctx.createStereoPanner();
    panner.pan.setValueAtTime(pan, time);

    osc.connect(env);
    env.connect(panner);
    panner.connect(this.dryGain);
    panner.connect(this.reverbNode);

    osc.start(time);
    vib.start(time);
    osc.stop(time + duration + 0.05);
    vib.stop(time + duration + 0.05);
  }

  private playWarmPadVoice(freq: number, time: number, duration: number, volume: number): void {
    if (!this.ctx || !this.dryGain || !this.reverbNode) return;
    const ctx = this.ctx;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.linearRampToValueAtTime(volume, time + 0.22);
    env.gain.exponentialRampToValueAtTime(0.0008, time + duration);

    osc.connect(env);
    env.connect(this.dryGain);
    env.connect(this.reverbNode);

    osc.start(time);
    osc.stop(time + duration + 0.06);
  }

  private scheduleLoop(): void {
    if (!this.isPlaying || !this.ctx) return;

    const song = SONGS[this.currentSongIdx];
    const stepSec = 60 / song.tempoBpm / 2; // 8th-note steps
    const now = this.ctx.currentTime + 0.03;
    const s = this.stepIndex % 32;

    if (this.currentSongIdx === 0) {
      // Song 0: "Morning Wind Over Pastures" (G Major pastoral Ghibli flight)
      const bass = [55, 0, 62, 0, 59, 0, 64, 0, 52, 0, 59, 0, 55, 0, 62, 0];
      const arp = [67, 71, 74, 79, 66, 69, 74, 78, 64, 67, 71, 76, 62, 67, 71, 74];
      const melody = [
        79, 0, 78, 79, 83, 0, 81, 0, 79, 0, 76, 74, 71, 0, 0, 0,
        74, 0, 76, 79, 81, 0, 79, 76, 74, 0, 71, 69, 67, 0, 0, 0,
      ];

      const bNote = bass[s % bass.length];
      if (bNote > 0 && s % 2 === 0) {
        this.playWarmPadVoice(midiToFreq(bNote), now, stepSec * 3.6, 0.16);
      }
      const aNote = arp[s % arp.length];
      this.playPluckVoice(midiToFreq(aNote), now, stepSec * 1.9, 0.12, ((s % 4) - 1.5) * 0.22);

      const mNote = melody[s];
      if (mNote > 0) {
        this.playFluteOrAccordionVoice(midiToFreq(mNote), now, stepSec * 2.2, 0.14, 0.12);
      }
    } else if (this.currentSongIdx === 1) {
      // Song 1: "Biplane in the Sunbeams" (D Major uplifting flight theme)
      const bass = [50, 0, 57, 0, 47, 0, 54, 0, 43, 0, 50, 0, 45, 0, 52, 0];
      const arp = [62, 66, 69, 74, 59, 62, 66, 71, 55, 59, 62, 67, 57, 61, 64, 69];
      const melody = [
        74, 76, 78, 0, 81, 0, 78, 74, 71, 0, 74, 0, 69, 0, 0, 0,
        67, 69, 71, 74, 76, 0, 73, 69, 74, 0, 78, 0, 74, 0, 0, 0,
      ];

      const bNote = bass[s % bass.length];
      if (bNote > 0 && s % 2 === 0) {
        this.playWarmPadVoice(midiToFreq(bNote), now, stepSec * 3.2, 0.15);
      }
      const aNote = arp[s % arp.length];
      this.playPluckVoice(midiToFreq(aNote), now, stepSec * 1.6, 0.13, ((s % 4) - 1.5) * 0.25);

      const mNote = melody[s];
      if (mNote > 0) {
        this.playFluteOrAccordionVoice(midiToFreq(mNote), now, stepSec * 2.0, 0.13, -0.15);
      }
    } else {
      // Song 2: "Cottage Chimney Waltz" (F Major gentle pastoral waltz feel)
      const bass = [53, 0, 60, 60, 50, 0, 57, 57, 46, 0, 53, 53, 48, 0, 55, 55];
      const arp = [65, 69, 72, 77, 62, 65, 69, 74, 58, 62, 65, 70, 60, 64, 67, 72];
      const melody = [
        77, 0, 76, 74, 72, 0, 69, 0, 70, 0, 72, 74, 69, 0, 0, 0,
        74, 0, 76, 77, 81, 0, 79, 76, 77, 0, 72, 0, 65, 0, 0, 0,
      ];

      const bNote = bass[s % bass.length];
      if (bNote > 0) {
        this.playWarmPadVoice(midiToFreq(bNote), now, stepSec * 2.8, 0.14);
      }
      const aNote = arp[s % arp.length];
      this.playPluckVoice(midiToFreq(aNote), now, stepSec * 2.2, 0.12, ((s % 4) - 1.5) * 0.2);

      const mNote = melody[s];
      if (mNote > 0) {
        this.playFluteOrAccordionVoice(midiToFreq(mNote), now, stepSec * 2.4, 0.13, 0.1);
      }
    }

    this.stepIndex++;
    this.schedulerTimer = window.setTimeout(() => this.scheduleLoop(), stepSec * 1000);
  }
}

export const soundtrackEngine = new SoundtrackEngine();
