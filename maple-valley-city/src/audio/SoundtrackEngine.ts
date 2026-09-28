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
    title: 'Maple Breeze',
    jpTitle: '楓風の詩',
    tempoBpm: 76,
    instrumentLead: 'Guzheng Harp & Bamboo Flute',
  },
  {
    id: 1,
    title: 'Cloud Brush Valley',
    jpTitle: '雲筆の里',
    tempoBpm: 84,
    instrumentLead: 'Felt Piano & Celesta Strings',
  },
  {
    id: 2,
    title: 'Mountain Road Lanterns',
    jpTitle: '山道の灯火',
    tempoBpm: 68,
    instrumentLead: 'Silk Lute & Wind Chimes',
  },
];

// MIDI note to Hz helper
function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Studio-grade Web Audio API polyphonic synthesizer with stereo convolution reverb
 * and 3 selectable full-length East Asian / Ghibli-inspired instrumental songs.
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
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.55;
    this.masterGain.connect(this.ctx.destination);

    this.dryGain = this.ctx.createGain();
    this.dryGain.gain.value = 0.62;
    this.dryGain.connect(this.masterGain);

    this.wetGain = this.ctx.createGain();
    this.wetGain.gain.value = 0.52;
    this.wetGain.connect(this.masterGain);

    this.reverbNode = this.createWarmHallReverb(2.8, 2.4);
    this.reverbNode.connect(this.wetGain);

    this.startGentleMountainBreeze();
  }

  /**
   * Builds a lush stereo acoustic concert hall impulse response for natural reverb decay.
   */
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
        // Warm low-pass damping inside the hall impulse
        lp = lp * 0.78 + white * 0.22;
        data[i] = lp * 0.85;
      }
    }

    const convolver = ctx.createConvolver();
    convolver.buffer = impulse;
    return convolver;
  }

  /**
   * Soft mountain wind ambience layer in the background.
   */
  private startGentleMountainBreeze(): void {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const bufferSize = ctx.sampleRate * 4;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 0.12;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 420;
    filter.Q.value = 1.8;

    this.breezeGain = ctx.createGain();
    this.breezeGain.gain.value = 0.0;

    whiteNoise.connect(filter);
    filter.connect(this.breezeGain);
    this.breezeGain.connect(this.masterGain);
    whiteNoise.start(0);
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
      this.breezeGain.gain.setTargetAtTime(0.08, this.ctx.currentTime, 0.8);
    }
    this.scheduleLoop();
    this.notify();
  }

  public pause(): void {
    if (!this.isPlaying) return;
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

  public toggle(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      void this.start();
    }
  }

  public nextSong(): void {
    this.currentSongIdx = (this.currentSongIdx + 1) % SONGS.length;
    this.stepIndex = 0;
    if (!this.isPlaying) {
      void this.start();
    } else {
      if (this.schedulerTimer !== null) {
        window.clearTimeout(this.schedulerTimer);
      }
      this.scheduleLoop();
      this.notify();
    }
  }

  public selectSong(index: number): void {
    this.currentSongIdx = ((index % SONGS.length) + SONGS.length) % SONGS.length;
    this.stepIndex = 0;
    if (!this.isPlaying) {
      void this.start();
    } else {
      if (this.schedulerTimer !== null) {
        window.clearTimeout(this.schedulerTimer);
      }
      this.scheduleLoop();
      this.notify();
    }
  }

  /**
   * Plucked Guzheng / Koto Harp voice with warm harmonic body and stereo pan.
   */
  private playGuzhengPluck(midi: number, duration: number, volume = 0.16, pan = 0): void {
    if (!this.ctx || !this.dryGain || !this.reverbNode) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const freq = midiToFreq(midi);

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 2, now);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 5.5, now);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.3, now + duration * 0.75);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);

    const panner = ctx.createStereoPanner();
    panner.pan.setValueAtTime(pan, now);

    const harmGain = ctx.createGain();
    harmGain.gain.setValueAtTime(0.28, now);
    harmGain.gain.exponentialRampToValueAtTime(0.01, now + duration * 0.4);

    osc1.connect(filter);
    osc2.connect(harmGain);
    harmGain.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(this.dryGain);
    panner.connect(this.reverbNode);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.05);
    osc2.stop(now + duration + 0.05);
  }

  /**
   * Expressive Bamboo Dizi / Shakuhachi Flute voice with gentle pitch slide and vibrato.
   */
  private playBambooFlute(midi: number, duration: number, volume = 0.14): void {
    if (!this.ctx || !this.dryGain || !this.reverbNode) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const freq = midiToFreq(midi);

    const osc = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    osc.type = 'sine';
    subOsc.type = 'triangle';

    // Gentle grace-note pitch bend up into the target note
    osc.frequency.setValueAtTime(freq * 0.975, now);
    osc.frequency.exponentialRampToValueAtTime(freq, now + 0.09);
    subOsc.frequency.setValueAtTime(freq, now);

    // Expressive vibrato LFO
    const vibOsc = ctx.createOscillator();
    const vibGain = ctx.createGain();
    vibOsc.frequency.setValueAtTime(5.1, now);
    vibGain.gain.setValueAtTime(0.0, now);
    vibGain.gain.linearRampToValueAtTime(freq * 0.011, now + duration * 0.35);
    vibOsc.connect(vibGain);
    vibGain.connect(osc.frequency);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 2.8, now);

    const subGain = ctx.createGain();
    subGain.gain.value = 0.22;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(volume, now + 0.11);
    env.gain.setValueAtTime(volume * 0.88, now + duration * 0.68);
    env.gain.exponentialRampToValueAtTime(0.0008, now + duration);

    osc.connect(filter);
    subOsc.connect(subGain);
    subGain.connect(filter);
    filter.connect(env);

    env.connect(this.dryGain);
    env.connect(this.reverbNode);

    osc.start(now);
    subOsc.start(now);
    vibOsc.start(now);
    osc.stop(now + duration + 0.06);
    subOsc.stop(now + duration + 0.06);
    vibOsc.stop(now + duration + 0.06);
  }

  /**
   * Warm Felt Piano & Celesta voice for Song 2 ("Cloud Brush Valley").
   */
  private playFeltPiano(midi: number, duration: number, volume = 0.16, pan = 0): void {
    if (!this.ctx || !this.dryGain || !this.reverbNode) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const freq = midiToFreq(midi);

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 1.0012, now); // Slight chorus warmth

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 3.6, now);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.1, now + duration * 0.8);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(volume, now + 0.022);
    env.gain.exponentialRampToValueAtTime(volume * 0.32, now + 0.28);
    env.gain.exponentialRampToValueAtTime(0.0008, now + duration);

    const panner = ctx.createStereoPanner();
    panner.pan.setValueAtTime(pan, now);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(env);
    env.connect(panner);
    panner.connect(this.dryGain);
    panner.connect(this.reverbNode);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.05);
    osc2.stop(now + duration + 0.05);
  }

  /**
   * Warm Bowed String / Cello Pad chord voice for harmonic foundation.
   */
  private playWarmStringPad(midis: number[], duration: number, volume = 0.065): void {
    if (!this.ctx || !this.reverbNode || !this.dryGain) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    for (const midi of midis) {
      const freq = midiToFreq(midi);
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 2.1, now);

      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, now);
      env.gain.linearRampToValueAtTime(volume, now + duration * 0.32);
      env.gain.setValueAtTime(volume * 0.85, now + duration * 0.7);
      env.gain.exponentialRampToValueAtTime(0.0008, now + duration);

      osc.connect(filter);
      filter.connect(env);
      env.connect(this.reverbNode);
      env.connect(this.dryGain);

      osc.start(now);
      osc.stop(now + duration + 0.08);
    }
  }

  /**
   * Subtle crystalline wind chime / discovery bell accent.
   */
  public playDiscoveryChime(): void {
    if (!this.ctx || !this.isPlaying) return;
    const notes = [74, 79, 81, 86, 91]; // D major pentatonic sparkle
    notes.forEach((n, idx) => {
      window.setTimeout(() => {
        this.playGuzhengPluck(n, 1.4, 0.09, (idx - 2) * 0.25);
      }, idx * 85);
    });
  }

  private scheduleLoop(): void {
    if (!this.isPlaying) return;

    const song = SONGS[this.currentSongIdx];
    const eighthMs = (60 / song.tempoBpm / 2) * 1000;
    const step = this.stepIndex % 32;

    if (this.currentSongIdx === 0) {
      // =======================================================================
      // SONG 1: "Maple Breeze" (楓風の詩) — D Major Pentatonic (D E F# A B)
      // Guzheng Arpeggios + Expressive Bamboo Flute + Warm String Pad
      // =======================================================================
      const padChords: Record<number, number[]> = {
        0: [50, 57, 62, 66],  // D maj
        8: [47, 54, 59, 66],  // Bm7
        16: [43, 50, 55, 62], // G maj
        24: [45, 52, 57, 64], // A sus
      };
      if (padChords[step]) {
        this.playWarmStringPad(padChords[step], (eighthMs * 8.5) / 1000, 0.045);
      }

      // Guzheng flowing arpeggio pattern
      const arpNotes = [
        62, 66, 69, 74, 76, 74, 69, 66,
        59, 62, 66, 71, 74, 71, 66, 62,
        55, 59, 62, 67, 69, 67, 62, 59,
        57, 62, 64, 69, 74, 69, 64, 62,
      ];
      const pan = Math.sin(step * 0.45) * 0.45;
      this.playGuzhengPluck(arpNotes[step], 1.6, step % 4 === 0 ? 0.15 : 0.10, pan);

      // Expressive Bamboo Flute Melody
      const fluteMelody: Record<number, { note: number; beats: number }> = {
        0: { note: 74, beats: 3 },
        3: { note: 76, beats: 1 },
        4: { note: 78, beats: 4 },
        8: { note: 81, beats: 3 },
        11: { note: 78, beats: 1 },
        12: { note: 74, beats: 4 },
        16: { note: 71, beats: 2 },
        18: { note: 74, beats: 2 },
        20: { note: 76, beats: 3 },
        23: { note: 74, beats: 1 },
        24: { note: 69, beats: 6 },
      };
      if (fluteMelody[step]) {
        const m = fluteMelody[step];
        this.playBambooFlute(m.note, (eighthMs * m.beats) / 1000, 0.13);
      }
    } else if (this.currentSongIdx === 1) {
      // =======================================================================
      // SONG 2: "Cloud Brush Valley" (雲筆の里) — Ghibli / Hisaishi Felt Piano
      // F Maj7 -> G6 -> Em7 -> Am9
      // =======================================================================
      const padChords: Record<number, number[]> = {
        0: [41, 48, 53, 57, 64],  // Fmaj7
        8: [43, 50, 55, 59, 64],  // G6
        16: [40, 47, 52, 55, 62], // Em7
        24: [45, 52, 57, 60, 67], // Am7
      };
      if (padChords[step]) {
        this.playWarmStringPad(padChords[step], (eighthMs * 8.5) / 1000, 0.048);
      }

      // Left-hand gentle felt piano accompaniment
      const lhNotes = [
        53, 60, 64, 67, 69, 67, 64, 60,
        55, 59, 62, 67, 71, 67, 62, 59,
        52, 59, 62, 67, 71, 67, 62, 59,
        57, 60, 64, 69, 72, 69, 64, 60,
      ];
      this.playFeltPiano(lhNotes[step], 1.4, 0.11, -0.25);

      // Right-hand singing piano & celesta melody
      const rhMelody: Record<number, { note: number; beats: number }> = {
        0: { note: 76, beats: 2 },
        2: { note: 79, beats: 2 },
        4: { note: 81, beats: 3 },
        7: { note: 84, beats: 1 },
        8: { note: 83, beats: 3 },
        11: { note: 79, beats: 1 },
        12: { note: 76, beats: 4 },
        16: { note: 74, beats: 2 },
        18: { note: 76, beats: 2 },
        20: { note: 79, beats: 3 },
        23: { note: 76, beats: 1 },
        24: { note: 72, beats: 6 },
      };
      if (rhMelody[step]) {
        const m = rhMelody[step];
        this.playFeltPiano(m.note, (eighthMs * m.beats) / 1000, 0.17, 0.25);
        // Subtle high celesta octave sparkle
        if (step % 4 === 0) {
          this.playGuzhengPluck(m.note + 12, 1.2, 0.05, 0.35);
        }
      }
    } else {
      // =======================================================================
      // SONG 3: "Mountain Road Lanterns" (山道の灯火) — Silk Lute & Chimes
      // Serene C Major / A Minor Pentatonic Evening Stroll
      // =======================================================================
      const padChords: Record<number, number[]> = {
        0: [45, 52, 57, 64],  // Am9
        8: [41, 48, 53, 60],  // Fmaj7
        16: [48, 55, 60, 64], // Cmaj
        24: [43, 50, 55, 62], // G
      };
      if (padChords[step]) {
        this.playWarmStringPad(padChords[step], (eighthMs * 8.5) / 1000, 0.042);
      }

      const luteNotes = [
        57, 64, 69, 72, 76, 72, 69, 64,
        53, 60, 64, 69, 72, 69, 64, 60,
        60, 64, 67, 72, 76, 72, 67, 64,
        55, 62, 67, 71, 74, 71, 67, 62,
      ];
      this.playGuzhengPluck(
        luteNotes[step],
        1.8,
        step % 2 === 0 ? 0.13 : 0.085,
        Math.cos(step * 0.5) * 0.4
      );

      // Gentle flute + chime call-and-response
      const eveningLead: Record<number, { note: number; beats: number }> = {
        0: { note: 81, beats: 4 },
        4: { note: 79, beats: 2 },
        6: { note: 76, beats: 2 },
        8: { note: 72, beats: 4 },
        12: { note: 74, beats: 4 },
        16: { note: 76, beats: 3 },
        19: { note: 79, beats: 1 },
        20: { note: 81, beats: 4 },
        24: { note: 79, beats: 6 },
      };
      if (eveningLead[step]) {
        const m = eveningLead[step];
        this.playBambooFlute(m.note, (eighthMs * m.beats) / 1000, 0.11);
      }
    }

    this.stepIndex++;
    this.schedulerTimer = window.setTimeout(() => this.scheduleLoop(), eighthMs);
  }
}

export const soundtrack = new SoundtrackEngine();
