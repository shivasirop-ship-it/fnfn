/**
 * Self-contained Web Audio API ambient soundscape engine.
 * - Calm Wind: multi-filtered pink/brown noise modulated by slow LFO swells.
 * - Easy Song: gentle ambient felt-piano / warm pad chord & pentatonic melody loop.
 */

export class CalmAudioEngine {
  private ctx: AudioContext | null = null;
  private windMasterGain: GainNode | null = null;
  private songMasterGain: GainNode | null = null;

  private windSource: AudioBufferSourceNode | null = null;
  private windLfo: OscillatorNode | null = null;
  private windRunning = false;

  private songTimerId: number | null = null;
  private songRunning = false;
  private songStep = 0;

  private windEnabled = false;
  private songEnabled = false;
  private windVolume = 0.45;
  private songVolume = 0.42;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.windMasterGain = this.ctx.createGain();
      this.windMasterGain.gain.value = 0;
      this.windMasterGain.connect(this.ctx.destination);

      this.songMasterGain = this.ctx.createGain();
      this.songMasterGain.gain.value = 0;
      this.songMasterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private startWindNodes() {
    if (this.windRunning) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.windMasterGain) return;

    // 4-second seamless pink/brown filtered noise buffer
    const durationSec = 4;
    const bufferSize = ctx.sampleRate * durationSec;
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + white * 0.099046;
        b1 = 0.963 * b1 + white * 0.2965164;
        b2 = 0.57 * b2 + white * 1.0526913;
        const pink = (b0 + b1 + b2 + white * 0.1848) * 0.11;
        // Blend brown smoothness for soft mountain breeze
        lastOut = (lastOut + 0.025 * pink) / 1.025;
        data[i] = (pink * 0.45 + lastOut * 1.65) * 0.6;
      }
      // Cross-fade buffer boundaries for click-free looping
      const fadeSamples = Math.min(2048, Math.floor(bufferSize / 8));
      for (let i = 0; i < fadeSamples; i++) {
        const t = i / fadeSamples;
        data[i] = data[i] * t + data[bufferSize - fadeSamples + i] * (1 - t);
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const lowPass = ctx.createBiquadFilter();
    lowPass.type = 'lowpass';
    lowPass.frequency.value = 520;
    lowPass.Q.value = 0.7;

    const bandPass = ctx.createBiquadFilter();
    bandPass.type = 'bandpass';
    bandPass.frequency.value = 280;
    bandPass.Q.value = 0.65;

    // Slow LFO breathing breeze modulation
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.11; // ~9-second natural wind swell

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 180;
    lfo.connect(lfoGain);
    lfoGain.connect(lowPass.frequency);

    source.connect(bandPass);
    bandPass.connect(lowPass);
    lowPass.connect(this.windMasterGain);

    source.start();
    lfo.start();

    this.windSource = source;
    this.windLfo = lfo;
    this.windRunning = true;
  }

  private playWarmVoice(
    freq: number,
    durationSec: number,
    peakGain: number,
    type: OscillatorType = 'sine',
    delaySec = 0
  ) {
    const ctx = this.ctx;
    if (!ctx || !this.songMasterGain) return;

    const start = ctx.currentTime + delaySec;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, start);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(peakGain, start + 0.35);
    env.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, peakGain * 0.45),
      start + durationSec * 0.55
    );
    env.gain.exponentialRampToValueAtTime(0.0001, start + durationSec);

    osc.connect(filter);
    filter.connect(env);
    env.connect(this.songMasterGain);

    osc.start(start);
    osc.stop(start + durationSec + 0.08);
  }

  private scheduleSongBar() {
    if (!this.songEnabled || !this.ctx) return;

    // Peaceful 4-bar chord cycle: Fmaj7 -> Em7 -> Dm9 -> Cmaj7
    const chords: number[][] = [
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [164.81, 196.0, 246.94, 293.66], // Em7
      [146.83, 220.0, 261.63, 329.63], // Dm9
      [130.81, 196.0, 246.94, 329.63], // Cmaj7
    ];

    const melodies: number[][] = [
      [523.25, 659.25, 587.33], // C5 E5 D5
      [493.88, 587.33, 523.25], // B4 D5 C5
      [440.0, 523.25, 659.25], // A4 C5 E5
      [392.0, 493.88, 523.25], // G4 B4 C5
    ];

    const barIdx = this.songStep % chords.length;
    const chord = chords[barIdx];
    const melody = melodies[barIdx];

    // Warm sustained pad notes
    chord.forEach((f, idx) => {
      this.playWarmVoice(f, 4.3, idx === 0 ? 0.11 : 0.07, 'sine', idx * 0.08);
    });

    // Gentle pentatonic bell/felt-piano motif
    melody.forEach((f, idx) => {
      this.playWarmVoice(f, 2.2, 0.055, 'triangle', 0.45 + idx * 1.15);
    });

    this.songStep += 1;
  }

  private startSongLoop() {
    if (this.songRunning) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.songRunning = true;
    this.scheduleSongBar();
    this.songTimerId = window.setInterval(() => {
      this.scheduleSongBar();
    }, 4100);
  }

  private stopSongLoop() {
    if (this.songTimerId !== null) {
      window.clearInterval(this.songTimerId);
      this.songTimerId = null;
    }
    this.songRunning = false;
  }

  public setWind(enabled: boolean, volume = this.windVolume) {
    this.windEnabled = enabled;
    this.windVolume = Math.max(0, Math.min(1, volume));
    if (enabled) {
      const ctx = this.ensureContext();
      if (!ctx || !this.windMasterGain) return;
      this.startWindNodes();
      this.windMasterGain.gain.setTargetAtTime(
        this.windVolume * 0.5,
        ctx.currentTime,
        0.35
      );
    } else if (this.ctx && this.windMasterGain) {
      this.windMasterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.35);
    }
  }

  public setSong(enabled: boolean, volume = this.songVolume) {
    this.songEnabled = enabled;
    this.songVolume = Math.max(0, Math.min(1, volume));
    if (enabled) {
      const ctx = this.ensureContext();
      if (!ctx || !this.songMasterGain) return;
      this.songMasterGain.gain.setTargetAtTime(
        this.songVolume * 0.75,
        ctx.currentTime,
        0.35
      );
      this.startSongLoop();
    } else {
      if (this.ctx && this.songMasterGain) {
        this.songMasterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.35);
      }
      this.stopSongLoop();
    }
  }

  public dispose() {
    this.stopSongLoop();
    try {
      this.windSource?.stop();
      this.windLfo?.stop();
    } catch {
      // Ignore already stopped audio nodes
    }
    this.windSource = null;
    this.windLfo = null;
    this.windRunning = false;
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}
