/* ===================================================================
   Web Flute – Realistic Bansuri Audio Engine v4.0
   Multi-harmonic flute synthesis tuned to sound like a real Indian
   bamboo Bansuri. Uses weighted harmonics, formant-style filtering,
   shaped breath noise, gentle natural vibrato, and soft ADSR.
   =================================================================== */

class AudioEngine {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.analyser = null;
    this.reverbNode = null;
    this.reverbWet = null;
    this.noiseBuffer = null;

    this.powerOn = true;
    this.volume = 0.65;
    this.octaveShift = 0;
    this.reverbEnabled = true;  // reverb on by default for realism
    this.pitchBendSemitones = 0;

    this.voice = null;
    this.isRecording = false;
  }

  /* ─── Init ─── */

  async init() {
    if (this.context) {
      if (this.context.state === 'suspended') await this.context.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    this.context = new AC();

    /* master gain */
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = this.volume;

    /* analyser */
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.82;

    /* reverb – warm room */
    this.reverbNode = this.context.createConvolver();
    this.reverbNode.buffer = this._makeImpulse(1.8, 2.2);
    this.reverbWet = this.context.createGain();
    this.reverbWet.gain.value = 0.2;

    /* noise buffer for breath */
    this.noiseBuffer = this._makeNoise(2);

    /* routing */
    this.masterGain.connect(this.analyser);
    this.reverbNode.connect(this.reverbWet);
    this.reverbWet.connect(this.analyser);
    this.analyser.connect(this.context.destination);
  }

  /* ─── Impulse for reverb ─── */

  _makeImpulse(secs, decay) {
    const sr = this.context.sampleRate;
    const len = Math.floor(sr * secs);
    const buf = this.context.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  _makeNoise(secs) {
    const sr = this.context.sampleRate;
    const len = Math.floor(sr * secs);
    const buf = this.context.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  /* ─── Setters ─── */

  setPower(on) {
    this.powerOn = on;
    if (!on) this.stopCurrentNote();
  }

  setVolume(pct) {
    this.volume = Math.max(0, Math.min(1, pct / 100));
    if (this.masterGain && this.context)
      this.masterGain.gain.setTargetAtTime(this.volume, this.context.currentTime, 0.02);
  }

  setOctaveShift(s) { this.octaveShift = Math.max(-2, Math.min(2, s)); }

  setReverbEnabled(on) {
    this.reverbEnabled = on;
    if (this.voice && this.context) {
      const now = this.context.currentTime;
      this.voice.reverbSend.gain.setTargetAtTime(on ? 0.35 : 0, now, 0.05);
    }
  }

  setPitchBendSemitones(st) {
    this.pitchBendSemitones = Math.max(-4, Math.min(4, st));
    if (this.voice && this.context) this._applyBend(this.voice, 0.025);
  }

  midiToFreq(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

  /* ─────────────────────────────────────────────────────────
     REALISTIC BANSURI VOICE
     A real Bansuri produces sound through air blown across a
     hole. Key traits:
     1. Strong fundamental (sine)
     2. Second harmonic ~30-40% (gives warmth)
     3. Third harmonic ~10-15% (slight brightness)
     4. Fourth harmonic ~5% (upper sheen)
     5. Breathy noise filtered around the fundamental
     6. Gentle natural vibrato (4-5Hz, very subtle)
     7. Slow attack (~120ms), warm sustain, gentle release
     8. Low-pass filter to tame harshness
     ───────────────────────────────────────────────────────── */

  async startOrUpdateNote(midiNote, useLegato = false) {
    if (!this.powerOn) return;
    await this.init();

    const shifted = midiNote + this.octaveShift * 12;
    const freq = this.midiToFreq(shifted);
    const now = this.context.currentTime;

    if (!this.voice) {
      this.voice = this._createBansuriVoice(freq, now);
      return;
    }

    /* Legato glide to new note */
    const glide = useLegato ? 0.06 : 0.015;
    const v = this.voice;
    v.osc1.frequency.cancelScheduledValues(now);
    v.osc2.frequency.cancelScheduledValues(now);
    v.osc3.frequency.cancelScheduledValues(now);
    v.osc4.frequency.cancelScheduledValues(now);
    v.osc1.frequency.linearRampToValueAtTime(freq, now + glide);
    v.osc2.frequency.linearRampToValueAtTime(freq * 2, now + glide);
    v.osc3.frequency.linearRampToValueAtTime(freq * 3, now + glide);
    v.osc4.frequency.linearRampToValueAtTime(freq * 4, now + glide);

    /* Move breath filter center with note */
    v.breathBP.frequency.linearRampToValueAtTime(freq * 1.5, now + glide);

    this._applyBend(v, glide);
  }

  _createBansuriVoice(freq, now) {
    const ctx = this.context;

    /* ── 4 harmonic oscillators ── */
    const osc1 = ctx.createOscillator(); // fundamental
    const osc2 = ctx.createOscillator(); // 2nd harmonic
    const osc3 = ctx.createOscillator(); // 3rd harmonic
    const osc4 = ctx.createOscillator(); // 4th harmonic

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc3.type = 'sine';
    osc4.type = 'sine';

    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 2, now);
    osc3.frequency.setValueAtTime(freq * 3, now);
    osc4.frequency.setValueAtTime(freq * 4, now);

    /* Harmonic mix gains – tuned for Bansuri warmth */
    const g1 = ctx.createGain(); g1.gain.setValueAtTime(1.0, now);    // fundamental 100%
    const g2 = ctx.createGain(); g2.gain.setValueAtTime(0.32, now);   // 2nd ~32%
    const g3 = ctx.createGain(); g3.gain.setValueAtTime(0.12, now);   // 3rd ~12%
    const g4 = ctx.createGain(); g4.gain.setValueAtTime(0.05, now);   // 4th ~5%

    /* ── Breath noise layer ── */
    const breathSrc = ctx.createBufferSource();
    breathSrc.buffer = this.noiseBuffer;
    breathSrc.loop = true;

    const breathBP = ctx.createBiquadFilter();
    breathBP.type = 'bandpass';
    breathBP.frequency.setValueAtTime(freq * 1.5, now);
    breathBP.Q.setValueAtTime(1.2, now);

    const breathGain = ctx.createGain();
    breathGain.gain.setValueAtTime(0.0, now);
    breathGain.gain.linearRampToValueAtTime(0.022, now + 0.08);  // subtle
    breathGain.gain.linearRampToValueAtTime(0.016, now + 0.3);   // settle

    /* ── Tone shaping – low-pass to soften ── */
    const toneLP = ctx.createBiquadFilter();
    toneLP.type = 'lowpass';
    /* Higher notes need lower cutoff to stay mellow */
    const cutoff = Math.min(4000, freq * 5);
    toneLP.frequency.setValueAtTime(cutoff, now);
    toneLP.Q.setValueAtTime(0.5, now);

    /* ── Master voice gain – ADSR ── */
    const voiceGain = ctx.createGain();
    // Attack: slow, breathy build-up (like blowing into a flute)
    voiceGain.gain.setValueAtTime(0.0001, now);
    voiceGain.gain.exponentialRampToValueAtTime(0.38, now + 0.12);   // attack
    voiceGain.gain.linearRampToValueAtTime(0.30, now + 0.35);       // settle to sustain

    /* ── Natural vibrato (very subtle, like a real player) ── */
    const vibLfo = ctx.createOscillator();
    const vibDepth1 = ctx.createGain();
    const vibDepth2 = ctx.createGain();
    vibLfo.type = 'sine';
    vibLfo.frequency.setValueAtTime(4.8, now);  // natural vibrato rate
    // Very subtle: ~3 cents on fundamental, ~5 on harmonic
    vibDepth1.gain.setValueAtTime(2.5, now);
    vibDepth2.gain.setValueAtTime(4.0, now);

    /* ── Reverb send ── */
    const dryGain = ctx.createGain();
    dryGain.gain.setValueAtTime(1, now);
    const reverbSend = ctx.createGain();
    reverbSend.gain.setValueAtTime(this.reverbEnabled ? 0.35 : 0, now);

    /* ── Wire everything ── */
    osc1.connect(g1);
    osc2.connect(g2);
    osc3.connect(g3);
    osc4.connect(g4);

    g1.connect(toneLP);
    g2.connect(toneLP);
    g3.connect(toneLP);
    g4.connect(toneLP);

    breathSrc.connect(breathBP);
    breathBP.connect(breathGain);
    breathGain.connect(toneLP);

    toneLP.connect(voiceGain);
    voiceGain.connect(dryGain);
    voiceGain.connect(reverbSend);
    dryGain.connect(this.masterGain);
    reverbSend.connect(this.reverbNode);

    /* vibrato routing */
    vibLfo.connect(vibDepth1);
    vibLfo.connect(vibDepth2);
    vibDepth1.connect(osc1.frequency);
    vibDepth2.connect(osc2.frequency);

    /* Start */
    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    osc4.start(now);
    breathSrc.start(now);
    vibLfo.start(now);

    const voice = {
      osc1, osc2, osc3, osc4,
      g1, g2, g3, g4,
      breathSrc, breathBP, breathGain,
      toneLP, voiceGain, dryGain, reverbSend,
      vibLfo, vibDepth1, vibDepth2,
      released: false,
    };

    this._applyBend(voice, 0.01);
    return voice;
  }

  /* ─── Pitch bend (meend) ─── */

  _applyBend(v, glide = 0.01) {
    const now = this.context.currentTime;
    const cents = this.pitchBendSemitones * 100;
    for (const osc of [v.osc1, v.osc2, v.osc3, v.osc4]) {
      osc.detune.cancelScheduledValues(now);
      osc.detune.linearRampToValueAtTime(cents, now + glide);
    }
  }

  /* ─── Release / Stop ─── */

  stopCurrentNote() {
    if (!this.context || !this.voice || this.voice.released) return;
    const now = this.context.currentTime;
    const v = this.voice;
    v.released = true;

    /* Gentle release – like lifting mouth from the flute */
    v.voiceGain.gain.cancelScheduledValues(now);
    v.voiceGain.gain.setValueAtTime(Math.max(v.voiceGain.gain.value, 0.001), now);
    v.voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

    /* Breath fades slightly faster */
    v.breathGain.gain.cancelScheduledValues(now);
    v.breathGain.gain.linearRampToValueAtTime(0.0001, now + 0.25);

    /* Let reverb tail ring */
    if (this.reverbEnabled) {
      v.reverbSend.gain.cancelScheduledValues(now);
      v.reverbSend.gain.linearRampToValueAtTime(0.5, now + 0.15);
      v.reverbSend.gain.linearRampToValueAtTime(0, now + 0.35);
    }

    const stopAt = now + 0.35;
    v.osc1.stop(stopAt); v.osc2.stop(stopAt);
    v.osc3.stop(stopAt); v.osc4.stop(stopAt);
    v.breathSrc.stop(stopAt); v.vibLfo.stop(stopAt);

    const released = v;
    released.osc1.onended = () => {
      if (this.voice === released) this.voice = null;
    };
  }

  stopAllNotes() { this.stopCurrentNote(); }
  getAnalyser() { return this.analyser; }
}
