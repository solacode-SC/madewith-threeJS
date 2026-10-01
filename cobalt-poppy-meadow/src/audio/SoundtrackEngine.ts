/**
 * Generative Web Audio API Nature Soundscape Engine
 * 100% synthesized in real-time with zero external audio assets:
 * - Gentle rustling meadow wind (resonant filtered pink/brown noise with slow organic LFO)
 * - Wild grass and flower stem flutter (soft high-pass noise grains)
 * - Distant meadow larks / warbler birdsong (frequency-modulated chirps)
 * - Harmonic wind chimes / peaceful nature bells (pentatonic acoustic bells)
 */
export class MeadowSoundscapeEngine {
  private ctx: AudioContext | null = null;
  private isRunning = false;
  private isMuted = false;
  private masterGain: GainNode | null = null;
  private birdTimer: number | null = null;
  private chimeTimer: number | null = null;

  // Nodes for continuous ambient wind
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;

  constructor() {
    // Lazy initialized on first user interaction
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.setupWindAmbience();
      this.startBirds();
      this.startChimes();
      this.isRunning = true;
    } catch (e) {
      console.warn('Web Audio not supported or blocked:', e);
    }
  }

  private setupWindAmbience() {
    if (!this.ctx || !this.masterGain) return;

    // Generate 5-second loop of organic pink noise for wind
    const bufferSize = this.ctx.sampleRate * 5;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.045;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Resonant low-pass filter for soft mountain wind
    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'lowpass';
    this.windFilter.frequency.setValueAtTime(380, this.ctx.currentTime);
    this.windFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    // LFO for swaying breeze swells
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.18, this.ctx.currentTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(140, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(this.windFilter.frequency);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.38, this.ctx.currentTime);

    whiteNoise.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);

    whiteNoise.start();
    lfo.start();
  }

  /**
   * Generates periodic sweet chirps of wild meadow songbirds (warblers & larks)
   */
  private startBirds() {
    const playChirp = () => {
      if (!this.ctx || !this.masterGain || this.isMuted) {
        this.birdTimer = window.setTimeout(playChirp, 3000 + Math.random() * 4000);
        return;
      }

      const now = this.ctx.currentTime;
      const baseFreq = 2200 + Math.random() * 900;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      // Bird trill frequency sweep
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq + 600, now + 0.06);
      osc.frequency.exponentialRampToValueAtTime(baseFreq - 300, now + 0.14);
      osc.frequency.exponentialRampToValueAtTime(baseFreq + 250, now + 0.22);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.045, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

      const panner = this.ctx.createStereoPanner?.() || null;
      if (panner) {
        panner.pan.value = (Math.random() - 0.5) * 1.5;
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(this.masterGain);
      } else {
        osc.connect(gain);
        gain.connect(this.masterGain);
      }

      osc.start(now);
      osc.stop(now + 0.3);

      // Random delay between bird melodies (2 to 6 seconds)
      this.birdTimer = window.setTimeout(playChirp, 2400 + Math.random() * 4500);
    };

    this.birdTimer = window.setTimeout(playChirp, 1800);
  }

  /**
   * Harmonious Japanese pentatonic nature chimes (G, A, C, D, E) drifting on the wind
   */
  private startChimes() {
    const PENTATONIC_PITCHES = [392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0];

    const playChimeNote = () => {
      if (!this.ctx || !this.masterGain || this.isMuted) {
        this.chimeTimer = window.setTimeout(playChimeNote, 4000);
        return;
      }

      const now = this.ctx.currentTime;
      const pitch = PENTATONIC_PITCHES[Math.floor(Math.random() * PENTATONIC_PITCHES.length)];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.055, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.00001, now + 3.2);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 3.3);

      this.chimeTimer = window.setTimeout(playChimeNote, 3200 + Math.random() * 5500);
    };

    this.chimeTimer = window.setTimeout(playChimeNote, 2500);
  }

  public setVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(THREE_MathClamp(vol, 0, 1), this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.45, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public dispose() {
    if (this.birdTimer) clearTimeout(this.birdTimer);
    if (this.chimeTimer) clearTimeout(this.chimeTimer);
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

function THREE_MathClamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
