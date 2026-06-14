/* ===================================================================
   Web Flute – Real Sample Player (PRIMARY engine)
   Plays recorded bansuri notes from /audio/samples/, pitch-shifting
   from the nearest sample to fill in missing notes, looping the
   sustain so held notes ring forever, and gliding on legato.

   Public API mirrors AudioEngine (js/audio-engine.js) so the facade
   in engine.js can swap between them with zero changes elsewhere.

   --- HOW TO ADD SAMPLES (this is your Step 3) -----------------------
   Drop audio files into:  web-flute/audio/samples/
   Name each file by its musical note, e.g.:
       C4.mp3  D4.mp3  E4.mp3  F4.mp3  G4.mp3  A4.mp3  B4.mp3  C5.mp3 ...
   - .mp3, .ogg, or .wav all work.
   - One clean, sustained note per file (a couple of seconds is plenty).
   - More notes = more realistic. But even ONE file (e.g. C4.mp3) works:
     everything else is pitch-shifted from it.
   - Octave numbers are scientific pitch (middle C = C4 = the default "Sa").
   =================================================================== */

const SAMPLE_DIR = 'audio/samples/';
const SAMPLE_EXTS = ['mp3', 'ogg', 'wav'];

/* Candidate notes we *try* to load. Missing files are skipped silently.
   Covers the playable range incl. octave shifts (~C3 to C6). */
const SAMPLE_CANDIDATES = [
  'C3','D3','E3','F3','G3','A3','B3',
  'C4','D4','E4','F4','G4','A4','B4',
  'C5','D5','E5','F5','G5','A5','B5',
  'C6','D6','E6','F6','G6',
];

const NOTE_TO_SEMITONE = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };

function noteNameToMidi(name) {
  // e.g. "C4" -> 60, "F#4" -> 66
  const m = name.match(/^([A-G])(#|b)?(-?\d)$/);
  if (!m) return null;
  let semi = NOTE_TO_SEMITONE[m[1]];
  if (m[2] === '#') semi += 1;
  if (m[2] === 'b') semi -= 1;
  const octave = parseInt(m[3], 10);
  return semi + (octave + 1) * 12; // MIDI: C4 = 60
}

class SamplePlayer {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.analyser = null;
    this.reverbNode = null;
    this.reverbWet = null;

    this.powerOn = true;
    this.volume = 0.65;
    this.octaveShift = 0;
    this.reverbEnabled = true;
    this.pitchBendSemitones = 0;

    /* Map<midi, {buffer, freq, dur}> of loaded real samples. */
    this.samples = new Map();
    this.loaded = false;

    this.voice = null;
  }

  midiToFreq(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

  /* ─── Detect available samples WITHOUT creating an AudioContext ───
     Returns the count of files that exist. Lets engine.js decide
     whether to use this engine before any user gesture. */
  async detect() {
    let found = 0;
    await Promise.all(SAMPLE_CANDIDATES.map(async (note) => {
      for (const ext of SAMPLE_EXTS) {
        const url = `${SAMPLE_DIR}${note}.${ext}`;
        try {
          const res = await fetch(url, { method: 'HEAD' });
          if (res.ok) { this._pending = this._pending || {}; this._pending[note] = url; found++; break; }
        } catch (_) { /* network/file error – skip */ }
      }
    }));
    return found;
  }

  /* ─── Init audio graph + decode detected samples ─── */
  async init() {
    if (this.context) {
      if (this.context.state === 'suspended') await this.context.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    this.context = new AC();

    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = this.volume;

    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.82;

    this.reverbNode = this.context.createConvolver();
    this.reverbNode.buffer = this._makeImpulse(1.8, 2.2);
    this.reverbWet = this.context.createGain();
    this.reverbWet.gain.value = 0.22;

    this.masterGain.connect(this.analyser);
    this.reverbNode.connect(this.reverbWet);
    this.reverbWet.connect(this.analyser);
    this.analyser.connect(this.context.destination);

    if (!this.loaded) await this._loadSamples();
  }

  async _loadSamples() {
    const pending = this._pending || {};
    await Promise.all(Object.entries(pending).map(async ([note, url]) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const arr = await res.arrayBuffer();
        const buffer = await this.context.decodeAudioData(arr);
        const midi = noteNameToMidi(note);
        if (midi == null) return;
        const loop = this._computeLoop(buffer);
        this.samples.set(midi, { buffer, freq: this.midiToFreq(midi), dur: buffer.duration, loop });
      } catch (_) { /* decode failed – skip this note */ }
    }));
    this.loaded = true;
  }

  hasSamples() { return this.samples.size > 0; }

  /* ─── Find a seamless loop region (zero-crossing snapped) ─── */
  _computeLoop(buffer) {
    if (buffer.duration <= 0.6) return null;
    const data = buffer.getChannelData(0);
    const sr = buffer.sampleRate;
    const n = data.length;
    const ls = this._zeroCrossAsc(data, Math.floor(n * 0.35));
    const le = this._zeroCrossAsc(data, Math.floor(n * 0.85));
    if (le <= ls + sr * 0.02) return null; // too short to be useful
    return { loopStart: ls / sr, loopEnd: le / sr };
  }

  /* nearest rising zero-crossing (neg→pos) to keep the loop seam click-free */
  _zeroCrossAsc(data, idx) {
    const N = data.length, win = 2048;
    for (let i = idx; i < Math.min(N - 1, idx + win); i++)
      if (data[i] <= 0 && data[i + 1] > 0) return i + 1;
    for (let i = idx; i > Math.max(1, idx - win); i--)
      if (data[i - 1] <= 0 && data[i] > 0) return i;
    return idx;
  }

  _makeImpulse(secs, decay) {
    const sr = this.context.sampleRate;
    const len = Math.floor(sr * secs);
    const buf = this.context.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  /* ─── Setters (API parity with AudioEngine) ─── */
  setPower(on) { this.powerOn = on; if (!on) this.stopCurrentNote(); }

  setVolume(pct) {
    this.volume = Math.max(0, Math.min(1, pct / 100));
    if (this.masterGain && this.context)
      this.masterGain.gain.setTargetAtTime(this.volume, this.context.currentTime, 0.02);
  }

  setOctaveShift(s) { this.octaveShift = Math.max(-2, Math.min(2, s)); }

  setReverbEnabled(on) {
    this.reverbEnabled = on;
    if (this.voice && this.context)
      this.voice.reverbSend.gain.setTargetAtTime(on ? 0.3 : 0, this.context.currentTime, 0.05);
  }

  setPitchBendSemitones(st) {
    this.pitchBendSemitones = Math.max(-4, Math.min(4, st));
    if (this.voice && this.context) {
      const now = this.context.currentTime;
      this.voice.source.detune.cancelScheduledValues(now);
      this.voice.source.detune.linearRampToValueAtTime(this.pitchBendSemitones * 100, now + 0.025);
    }
  }

  /* ─── Pick the nearest loaded sample to a target midi ─── */
  _nearest(midi) {
    let best = null, bestDist = Infinity;
    for (const [m, s] of this.samples) {
      const d = Math.abs(m - midi);
      if (d < bestDist) { bestDist = d; best = { midi: m, ...s }; }
    }
    return best;
  }

  /* ─── Play / update ─── */
  async startOrUpdateNote(midiNote, useLegato = false) {
    if (!this.powerOn) return;
    await this.init();
    if (!this.hasSamples()) return; // facade should have routed to synth

    const target = midiNote + this.octaveShift * 12;
    const freq = this.midiToFreq(target);
    const now = this.context.currentTime;

    if (!this.voice) { this.voice = this._createVoice(target, freq, now); return; }

    const v = this.voice;
    const sample = this._nearest(target);

    if (sample.midi === v.sampleMidi) {
      /* Same source buffer → glide playbackRate (natural meend). */
      const rate = freq / sample.freq;
      const glide = useLegato ? 0.07 : 0.02;
      v.source.playbackRate.cancelScheduledValues(now);
      v.source.playbackRate.linearRampToValueAtTime(rate, now + glide);
    } else {
      /* Different source → quick crossfade to the new sample. */
      this._crossfadeTo(target, freq, now, useLegato ? 0.08 : 0.03);
    }
  }

  _createVoice(midi, freq, now) {
    const ctx = this.context;
    const sample = this._nearest(midi);

    const source = ctx.createBufferSource();
    source.buffer = sample.buffer;
    source.playbackRate.value = freq / sample.freq;
    source.detune.value = this.pitchBendSemitones * 100;

    /* Loop the sustain portion so held notes ring continuously.
       Loop points are pre-snapped to zero-crossings for a click-free seam. */
    if (sample.loop) {
      source.loop = true;
      source.loopStart = sample.loop.loopStart;
      source.loopEnd = sample.loop.loopEnd;
    }

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.9, now + 0.025); // soft attack, avoids click

    const reverbSend = ctx.createGain();
    reverbSend.gain.setValueAtTime(this.reverbEnabled ? 0.3 : 0, now);

    source.connect(gain);
    gain.connect(this.masterGain);
    gain.connect(reverbSend);
    reverbSend.connect(this.reverbNode);

    source.start(now);

    return { source, gain, reverbSend, sampleMidi: sample.midi, released: false };
  }

  _crossfadeTo(midi, freq, now, fade) {
    const old = this.voice;
    /* fade old out + stop */
    old.gain.gain.cancelScheduledValues(now);
    old.gain.gain.setValueAtTime(old.gain.gain.value, now);
    old.gain.gain.linearRampToValueAtTime(0.0001, now + fade);
    try { old.source.stop(now + fade + 0.02); } catch (_) {}

    /* new voice fades in */
    const v = this._createVoice(midi, freq, now);
    v.gain.gain.cancelScheduledValues(now);
    v.gain.gain.setValueAtTime(0.0001, now);
    v.gain.gain.linearRampToValueAtTime(0.9, now + fade);
    this.voice = v;
  }

  stopCurrentNote() {
    if (!this.context || !this.voice || this.voice.released) return;
    const now = this.context.currentTime;
    const v = this.voice;
    v.released = true;

    v.gain.gain.cancelScheduledValues(now);
    v.gain.gain.setValueAtTime(Math.max(v.gain.gain.value, 0.0001), now);
    v.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28); // gentle release

    if (this.reverbEnabled) {
      v.reverbSend.gain.cancelScheduledValues(now);
      v.reverbSend.gain.linearRampToValueAtTime(0.45, now + 0.12);
      v.reverbSend.gain.linearRampToValueAtTime(0, now + 0.4);
    }

    const stopAt = now + 0.35;
    try { v.source.stop(stopAt); } catch (_) {}
    const released = v;
    released.source.onended = () => { if (this.voice === released) this.voice = null; };
  }

  stopAllNotes() { this.stopCurrentNote(); }
  getAnalyser() { return this.analyser; }
}
