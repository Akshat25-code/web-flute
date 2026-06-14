/* ===================================================================
   Web Flute v6.0 – App Shell
   - Onboarding overlay (first visit)
   - Free Play + Learn modes
   - Engine facade (real samples → synth fallback)
   - Guided song tutorials
   =================================================================== */

/* ─── Sargam note mapping (one octave: Sa Re Ga Ma Pa Dha Ni Sa') ─── */
const SARGAM = [
  { name: 'Sa',  offset: 0,  key: 'A' },
  { name: 'Re',  offset: 2,  key: 'S' },
  { name: 'Ga',  offset: 4,  key: 'D' },
  { name: 'Ma',  offset: 5,  key: 'F' },
  { name: 'Pa',  offset: 7,  key: 'J' },
  { name: 'Dha', offset: 9,  key: 'K' },
  { name: 'Ni',  offset: 11, key: 'L' },
  { name: "Sa'", offset: 12, key: ';' },
];
const SARGAM_NAMES = SARGAM.map(s => s.name);

const CHROMATIC = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const BASE_MIDI = 60; // middle C = Sa by default

/* Bansuri 7-hole fingering chart. index 0 = nearest mouth. true = closed. */
const FINGERS = [
  /* Sa  */ [true,  true,  true,  true,  true,  true,  true],
  /* Re  */ [true,  true,  true,  true,  true,  true,  false],
  /* Ga  */ [true,  true,  true,  true,  true,  false, false],
  /* Ma  */ [true,  true,  true,  true,  false, false, false],
  /* Pa  */ [true,  true,  true,  false, false, false, false],
  /* Dha */ [true,  true,  false, false, false, false, false],
  /* Ni  */ [true,  false, false, false, false, false, false],
  /* Sa' */ [false, false, false, false, false, false, false],
];

/* ─── State ─── */
const audio = new FluteEngine();
const tanpura = new Tanpura();
let saRoot = 0;
let activeIdx = -1;
const pressed = new Set();
let mode = 'free';       // 'free' | 'learn'
let songMode = null;     // 'listen' | 'practice'
let songActive = false;
let songPlayer = null;
let particles;

/* ─── DOM ─── */
const $ = id => document.getElementById(id);

/* ─── Particles ─── */
class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.loop();
  }
  resize() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }
  burst(x, y, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3;
      this.particles.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1,
        life: 1, decay: 0.015 + Math.random() * 0.02,
        size: 2 + Math.random() * 3, hue: 35 + Math.random() * 25,
      });
    }
  }
  ambient() {
    if (Math.random() < 0.06) {
      this.particles.push({
        x: Math.random() * this.canvas.width, y: this.canvas.height + 10,
        vx: (Math.random() - 0.5) * 0.5, vy: -0.3 - Math.random() * 0.7,
        life: 1, decay: 0.003 + Math.random() * 0.005,
        size: 1 + Math.random() * 2, hue: 35 + Math.random() * 30,
      });
    }
  }
  loop() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.ambient();
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.02; p.life -= p.decay;
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = p.life * 0.7;
      ctx.fillStyle = `hsl(${p.hue}, 80%, 65%)`;
      ctx.shadowColor = `hsla(${p.hue}, 90%, 60%, 0.6)`;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    requestAnimationFrame(() => this.loop());
  }
}

/* ─── Helpers ─── */
function midiNote(idx) { return BASE_MIDI + saRoot + SARGAM[idx].offset; }
function westernName(midi) { return CHROMATIC[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1); }

/* ─── Visual flute holes ─── */
function updateFlute(idx) {
  const holes = document.querySelectorAll('.fhole');
  const labels = document.querySelectorAll('.hlabel');
  const svg = $('flute-svg');
  if (idx < 0 || idx >= FINGERS.length) {
    holes.forEach(h => { h.classList.remove('closed', 'open'); h.removeAttribute('filter'); });
    labels.forEach(l => l.classList.remove('active'));
    svg.classList.remove('playing');
    return;
  }
  svg.classList.add('playing');
  const chart = FINGERS[idx];
  holes.forEach((h, i) => {
    h.classList.remove('closed', 'open');
    if (chart[i]) { h.classList.add('closed'); h.removeAttribute('filter'); }
    else { h.classList.add('open'); h.setAttribute('filter', 'url(#glow-red)'); }
  });
  labels.forEach((l, i) => l.classList.toggle('active', i === idx));
}

/* ─── Now-playing display ─── */
function showPlaying(idx) {
  const ring = $('note-ring'), noteBig = $('note-big'), sargamBig = $('sargam-big'), noteWestern = $('note-western');
  if (idx < 0) {
    ring.classList.remove('active');
    noteBig.textContent = '–'; sargamBig.textContent = '–';
    sargamBig.classList.remove('active'); noteWestern.textContent = '';
    return;
  }
  ring.classList.add('active');
  const midi = midiNote(idx);
  noteBig.textContent = westernName(midi);
  sargamBig.textContent = SARGAM[idx].name;
  sargamBig.classList.add('active');
  noteWestern.textContent = westernName(midi);
}

function syncKeys() {
  document.querySelectorAll('.skey').forEach((btn, i) => btn.classList.toggle('active', i === activeIdx));
}

/* ─── Play / Stop ─── */
async function playIdx(idx, legato = false) {
  if (idx < 0 || idx >= SARGAM.length) return;
  activeIdx = idx;
  await audio.startOrUpdateNote(midiNote(idx), legato);
  showPlaying(idx);
  updateFlute(idx);
  syncKeys();
  const btn = document.querySelectorAll('.skey')[idx];
  if (btn && particles) {
    const rect = btn.getBoundingClientRect();
    particles.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 10);
  }
  if (btn) {
    const r = document.createElement('span');
    r.className = 'ripple'; r.style.left = '50%'; r.style.top = '50%';
    btn.appendChild(r);
    setTimeout(() => r.remove(), 600);
  }
}

function stopPlaying() {
  activeIdx = -1;
  audio.stopCurrentNote();
  showPlaying(-1);
  updateFlute(-1);
  syncKeys();
}

/* ─── User input ─── */
const keyToIdx = new Map();
SARGAM.forEach((s, i) => keyToIdx.set(s.key, i));

function handleDown(idx) {
  if (pressed.has(idx)) return;
  pressed.add(idx);
  playIdx(idx, activeIdx >= 0);
  // feed Learn-mode practice scoring
  if (mode === 'learn' && songMode === 'practice' && songPlayer) songPlayer.handleUserNote(idx);
}

function handleUp(idx) {
  if (!pressed.has(idx)) return;
  pressed.delete(idx);
  if (pressed.size === 0) {
    // in listen mode the song controls the voice – don't cut it off
    if (!(mode === 'learn' && songMode === 'listen' && songActive)) stopPlaying();
  } else {
    const remaining = [...pressed];
    playIdx(remaining[remaining.length - 1], true);
  }
}

/* ─── Guide highlight (from SongPlayer) ─── */
function clearGuides() { document.querySelectorAll('.skey.guide').forEach(b => b.classList.remove('guide')); }
function highlightKey(idx, on) {
  clearGuides();
  if (on && idx >= 0) {
    const btn = document.querySelectorAll('.skey')[idx];
    if (btn) btn.classList.add('guide');
    if (songMode === 'practice') { updateFlute(idx); showPlaying(idx); }
  } else if (!on && songMode === 'practice' && !songActive) {
    updateFlute(-1); showPlaying(-1);
  }
}

/* ─── Mode switching ─── */
function setMode(next) {
  mode = next;
  document.querySelectorAll('.mtab').forEach(t => {
    const isActive = t.dataset.mode === next;
    t.classList.toggle('active', isActive);
    t.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
  const learn = next === 'learn';
  $('flute-container').hidden = learn;
  $('learn-bar').hidden = !learn;
  $('lane-wrap').hidden = !learn;
  if (learn) {
    stopPlaying();
    loadSelectedSong();
  } else {
    stopSong();
    showPlaying(-1); updateFlute(-1); clearGuides();
  }
}

/* ─── Learn mode wiring ─── */
function buildSongSelect() {
  const sel = $('song-select');
  sel.innerHTML = SONGS.map(s => `<option value="${s.id}">${s.title} — ${s.level}</option>`).join('');
}

function loadSelectedSong() {
  const id = $('song-select').value;
  const song = SONGS.find(s => s.id === id) || SONGS[0];
  songPlayer.setTempoScale(Number($('tempo').value) / 100);
  songPlayer.load(song);
  resetScoreUI();
}

function startSong(m) {
  songMode = m;
  songActive = true;
  $('btn-listen').classList.toggle('on', m === 'listen');
  $('btn-practice').classList.toggle('on', m === 'practice');
  songPlayer.setTempoScale(Number($('tempo').value) / 100);
  songPlayer.play(m);
}

function stopSong() {
  songActive = false;
  songMode = null;
  if (songPlayer) songPlayer.stop();
  $('btn-listen').classList.remove('on');
  clearGuides();
  stopPlaying();
}

function resetScoreUI() {
  $('score-val').textContent = '0';
  $('combo-val').textContent = '0';
  $('acc-val').textContent = '100%';
}

function showToast(html) {
  const t = $('finish-toast');
  t.innerHTML = html;
  t.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { t.hidden = true; }, 4500);
}

/* ─── Engine toggle button ─── */
function updateEngineBtn() {
  const btn = $('engine-btn');
  if (audio.usingSamples) {
    btn.textContent = '🎵 Real'; btn.classList.add('on');
    btn.setAttribute('aria-label', 'Sound: real samples (click to switch to synthesis)');
    btn.setAttribute('aria-pressed', 'true');
  } else {
    btn.textContent = '🎛️ Synth'; btn.classList.remove('on');
    btn.setAttribute('aria-label', audio.samplesAvailable ? 'Sound: synthesis (click to switch to real samples)' : 'Sound: synthesis (no samples found)');
    btn.setAttribute('aria-pressed', 'false');
  }
}

/* ─── Init ─── */
async function init() {
  particles = new ParticleSystem($('particles'));

  // Detect samples (no AudioContext needed) → choose engine
  try {
    const r = await audio.detect();
    if (r.samplesAvailable) console.log(`Web Flute: ${r.count} real samples found – using real sound.`);
    else console.log('Web Flute: no samples in audio/samples/ – using synthesis fallback.');
  } catch (_) {}
  updateEngineBtn();

  // Sa root
  saRoot = Number($('sa-root').value);
  tanpura.setSaMidi(BASE_MIDI + saRoot);
  $('sa-root').addEventListener('change', () => {
    saRoot = Number($('sa-root').value);
    tanpura.setSaMidi(BASE_MIDI + saRoot);
  });

  // Volume
  $('volume').addEventListener('input', () => {
    const v = Number($('volume').value);
    $('vol-val').textContent = v + '%';
    audio.setVolume(v);
  });
  audio.setVolume(Number($('volume').value));

  // Reverb
  $('reverb-btn').addEventListener('click', () => {
    const on = !audio.reverbEnabled;
    audio.setReverbEnabled(on);
    $('reverb-btn').classList.toggle('on', on);
    $('reverb-btn').textContent = on ? '🔊 Reverb' : '🔇 Reverb';
    $('reverb-btn').setAttribute('aria-pressed', on ? 'true' : 'false');
  });

  // Tanpura drone
  $('tanpura-btn').addEventListener('click', async () => {
    if (tanpura.playing) {
      tanpura.stop();
      $('tanpura-btn').classList.remove('on');
      $('tanpura-btn').setAttribute('aria-pressed', 'false');
      $('tanpura-ctrl').hidden = true;
    } else {
      tanpura.setSaMidi(BASE_MIDI + saRoot);
      await tanpura.start();
      $('tanpura-btn').classList.add('on');
      $('tanpura-btn').setAttribute('aria-pressed', 'true');
      $('tanpura-ctrl').hidden = false;
    }
  });
  $('tanpura-vol').addEventListener('input', () => {
    const v = Number($('tanpura-vol').value);
    $('tanpura-vol-val').textContent = v + '%';
    tanpura.setVolume(v);
  });
  tanpura.setVolume(Number($('tanpura-vol').value));

  // Engine toggle
  $('engine-btn').addEventListener('click', async () => {
    if (!audio.samplesAvailable) {
      showToast('No samples yet. Drop note files into <b>audio/samples/</b> (see the README there) to unlock real flute sound.');
      return;
    }
    await audio.useEngine(audio.usingSamples ? 'synth' : 'samples');
    updateEngineBtn();
  });

  // Sargam keys (touch/click)
  const keyEls = [...document.querySelectorAll('.skey')];
  keyEls.forEach((btn, i) => {
    btn.addEventListener('pointerdown', e => { e.preventDefault(); handleDown(i); });
    btn.addEventListener('pointerup', () => handleUp(i));
    btn.addEventListener('pointerleave', () => handleUp(i));
    btn.addEventListener('pointercancel', () => handleUp(i));
  });

  // Keyboard
  window.addEventListener('keydown', e => {
    if (e.repeat) return;
    if (e.key === ';') { handleDown(7); return; }
    const k = e.key.toUpperCase();
    if (keyToIdx.has(k)) { e.preventDefault(); handleDown(keyToIdx.get(k)); }
  });
  window.addEventListener('keyup', e => {
    if (e.key === ';') { handleUp(7); return; }
    const k = e.key.toUpperCase();
    if (keyToIdx.has(k)) handleUp(keyToIdx.get(k));
  });
  window.addEventListener('blur', () => { pressed.clear(); stopPlaying(); });

  // Visualizer
  const viz = new Visualizer($('visualizer'), () => audio.getAnalyser());
  viz.start();

  // Mode tabs
  document.querySelectorAll('.mtab').forEach(t =>
    t.addEventListener('click', () => setMode(t.dataset.mode)));


  // Learn mode
  buildSongSelect();
  songPlayer = new SongPlayer({
    lane: $('note-lane'),
    keyEls,
    sargamNames: SARGAM_NAMES,
    onPlay: (idx, legato) => playIdx(idx, legato),
    onStop: () => { if (pressed.size === 0) stopPlaying(); },
    onHighlightKey: highlightKey,
    onProgress: p => {
      $('score-val').textContent = p.score;
      $('combo-val').textContent = p.combo;
      $('acc-val').textContent = p.accuracy + '%';
    },
    onFinish: r => {
      songActive = false;
      clearGuides();
      if (r.mode === 'practice')
        showToast(`🎉 Done! Score <b>${r.score}</b> · Accuracy <b>${r.accuracy}%</b> · ${r.hits}/${r.total} notes`);
      else
        showToast('✅ Finished listening. Switch to <b>Practice</b> to play it yourself!');
    },
  });

  $('song-select').addEventListener('change', () => { stopSong(); loadSelectedSong(); });
  $('tempo').addEventListener('input', () => {
    $('tempo-val').textContent = $('tempo').value + '%';
    if (songPlayer) songPlayer.setTempoScale(Number($('tempo').value) / 100);
  });
  $('btn-listen').addEventListener('click', () => { stopSong(); startSong('listen'); });
  $('btn-practice').addEventListener('click', () => { stopSong(); startSong('practice'); });
  $('btn-stop-song').addEventListener('click', () => stopSong());

  // Onboarding overlay
  setupOnboarding();
}

function setupOnboarding() {
  const overlay = $('onboarding');
  const seen = localStorage.getItem('webflute_seen');
  if (seen) { overlay.classList.add('hidden'); }
  const dismiss = (gotoMode) => {
    overlay.classList.add('hidden');
    localStorage.setItem('webflute_seen', '1');
    if (gotoMode) setMode(gotoMode);
  };
  overlay.querySelectorAll('.choice').forEach(c =>
    c.addEventListener('click', () => dismiss(c.dataset.goto)));
  $('overlay-skip').addEventListener('click', () => dismiss(null));
}

init();
