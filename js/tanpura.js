/* ===================================================================
   Web Flute – Tanpura Drone
   A soft, continuous background hum (the tonal reference behind all
   Indian classical music). Synthesized — needs no sample files.

   Plucks four "strings" in a slow repeating cycle:
       Pa(low) · Sa · Sa · Sa(lower octave)
   each with a bright buzzy attack (jawari) and a long decay, so the
   notes overlap into a continuous shimmering drone.

   Owns its own AudioContext so it's fully independent of the flute
   engine and its own volume control.
   =================================================================== */

class Tanpura {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.playing = false;
    this.volume = 0.3;
    this.saMidi = 60;             // tonic (Sa); follows the Sa-Root selector
    this.stringOffsets = [-5, 0, 0, -12]; // Pa(low), Sa, Sa, Sa(8vb)
    this.pluckGap = 1.05;         // seconds between plucks
    this._stringIdx = 0;
    this._nextTime = 0;
    this._timer = null;
  }

  midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  setSaMidi(m) { this.saMidi = m; }

  setVolume(pct) {
    this.volume = Math.max(0, Math.min(1, pct / 100));
    if (this.master && this.ctx)
      this.master.gain.setTargetAtTime(this.volume * 0.5, this.ctx.currentTime, 0.05);
  }

  async start() {
    if (this.playing) return;
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume * 0.5;

      // gentle warmth + a touch of room
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 3200;
      this.master.connect(lp);
      lp.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume();

    this.playing = true;
    this._stringIdx = 0;
    this._nextTime = this.ctx.currentTime + 0.15;
    this._timer = setInterval(() => this._scheduler(), 25);
  }

  stop() {
    this.playing = false;
    if (this._timer) clearInterval(this._timer);
    this._timer = null;
    // let any ringing plucks fade naturally; just stop scheduling new ones
  }

  /* lookahead scheduler: queue plucks ~0.2s ahead of the clock */
  _scheduler() {
    if (!this.playing) return;
    const ahead = this.ctx.currentTime + 0.2;
    while (this._nextTime < ahead) {
      const offset = this.stringOffsets[this._stringIdx % this.stringOffsets.length];
      this._pluck(this.midiToFreq(this.saMidi + offset), this._nextTime);
      this._stringIdx++;
      this._nextTime += this.pluckGap;
    }
  }

  _pluck(freq, time) {
    const ctx = this.ctx;

    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, time);
    out.gain.exponentialRampToValueAtTime(0.9, time + 0.012); // sharp pluck attack
    out.gain.exponentialRampToValueAtTime(0.0008, time + 2.6); // long decay
    out.connect(this.master);

    // a closing low-pass gives the buzzy → mellow jawari sweep
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 2;
    lp.frequency.setValueAtTime(Math.min(9000, freq * 8), time);
    lp.frequency.exponentialRampToValueAtTime(Math.max(400, freq * 3), time + 2.0);
    lp.connect(out);

    // two slightly detuned saws = rich, shimmering string body
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sawtooth'; osc2.type = 'sawtooth';
    osc1.frequency.value = freq; osc2.frequency.value = freq;
    osc2.detune.value = 7;
    osc1.connect(lp); osc2.connect(lp);

    const stop = time + 2.9;
    osc1.start(time); osc2.start(time);
    osc1.stop(stop); osc2.stop(stop);
  }
}
