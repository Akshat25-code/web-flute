/* ===================================================================
   Web Flute – Engine Facade
   Chooses the best available sound engine and exposes ONE stable API
   to the rest of the app. Order of preference:
     1. SamplePlayer  – real recorded bansuri (if sample files exist)
     2. AudioEngine   – additive synthesis fallback (always works)

   main.js only ever talks to this facade, so dropping sample files
   into audio/samples/ automatically upgrades the sound with no other
   code change. A manual A/B toggle is also supported.
   =================================================================== */

class FluteEngine {
  constructor() {
    this.synth = new AudioEngine();        // js/audio-engine.js
    this.sampler = new SamplePlayer();     // js/sample-player.js
    this.active = this.synth;              // safe default until detection
    this.usingSamples = false;
    this.samplesAvailable = false;

    /* mirrored state so a toggle keeps settings in sync */
    this._volume = 65;
    this._octaveShift = 0;
    this.reverbEnabled = true;
  }

  /* Decide which engine to use. Call once at startup (no user gesture
     needed – detection only does HEAD requests, no AudioContext). */
  async detect() {
    let count = 0;
    try { count = await this.sampler.detect(); } catch (_) { count = 0; }
    this.samplesAvailable = count > 0;
    if (this.samplesAvailable) { this.active = this.sampler; this.usingSamples = true; }
    return { samplesAvailable: this.samplesAvailable, count };
  }

  /* Manual switch (the Sample/Synth toggle button). */
  async useEngine(which) {
    const next = which === 'samples' ? this.sampler : this.synth;
    if (next === this.sampler && !this.samplesAvailable) return false;
    if (next === this.active) return true;
    this.active.stopAllNotes();
    this.active = next;
    this.usingSamples = next === this.sampler;
    /* re-apply state to the newly active engine */
    this.active.setVolume(this._volume);
    this.active.setOctaveShift(this._octaveShift);
    this.active.setReverbEnabled(this.reverbEnabled);
    return true;
  }

  /* ─── Delegated API (identical signatures on both engines) ─── */
  async init() { return this.active.init(); }
  setPower(on) { return this.active.setPower(on); }
  setVolume(pct) { this._volume = pct; this.synth.setVolume(pct); this.sampler.setVolume(pct); }
  setOctaveShift(s) { this._octaveShift = s; this.synth.setOctaveShift(s); this.sampler.setOctaveShift(s); }
  setReverbEnabled(on) { this.reverbEnabled = on; this.synth.setReverbEnabled(on); this.sampler.setReverbEnabled(on); }
  setPitchBendSemitones(st) { return this.active.setPitchBendSemitones(st); }
  midiToFreq(m) { return this.active.midiToFreq(m); }
  async startOrUpdateNote(midi, legato) { return this.active.startOrUpdateNote(midi, legato); }
  stopCurrentNote() { return this.active.stopCurrentNote(); }
  stopAllNotes() { return this.active.stopAllNotes(); }
  getAnalyser() { return this.active.getAnalyser(); }
}
