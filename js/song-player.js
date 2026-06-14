/* ===================================================================
   Web Flute – Learn Mode engine (guided songs)
   Synthesia-style falling tiles aligned over the sargam keys.

   Two modes:
     • listen   – auto-plays the song so the learner hears it.
     • practice – waits (forgivingly) for the correct key in order,
                  scores hits / wrong presses, freezes at the hit line
                  until the right note is played.

   Talks to the rest of the app only through callbacks, so it has no
   direct dependency on the audio engine or the DOM layout.
   =================================================================== */

const LEAD_TIME = 2.2; // seconds a tile takes to fall to the hit line

class SongPlayer {
  constructor(opts) {
    this.lane = opts.lane;                 // container element for tiles
    this.keyEls = opts.keyEls;             // array of the 8 key buttons (for x-alignment)
    this.sargamNames = opts.sargamNames;   // ['Sa','Re','Ga','Ma','Pa','Dha','Ni',"Sa'"]
    this.onPlay = opts.onPlay || (() => {});
    this.onStop = opts.onStop || (() => {});
    this.onHighlightKey = opts.onHighlightKey || (() => {});
    this.onProgress = opts.onProgress || (() => {});
    this.onFinish = opts.onFinish || (() => {});

    this.song = null;
    this.timeline = [];     // [{idx,key,sargam,start,dur,rest,tile}]
    this.mode = 'listen';
    this.tempoScale = 1;    // 1 = normal, 0.5 = half speed
    this.playing = false;

    this.clock = 0;
    this._lastTs = 0;
    this._raf = null;

    this.curExpected = 0;   // index into playable (non-rest) notes for practice
    this.lastAutoIdx = -1;  // currently auto-played note (listen)
    this.frozen = false;

    this.hits = 0; this.misses = 0; this.combo = 0; this.maxCombo = 0;

    window.addEventListener('resize', () => this._layout());
  }

  /* ─── Build timeline + tiles from a song ─── */
  load(song) {
    this.stop();
    this.song = song;
    this.lane.innerHTML = '';
    this.timeline = [];

    const spb = 60 / song.tempo; // base seconds-per-beat
    let t = 0;
    song.notes.forEach((n, i) => {
      const dur = n.beats * spb;
      if (n.rest) { t += dur; return; }
      const key = this.sargamNames.indexOf(n.sargam);
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.textContent = n.sargam;
      tile.dataset.key = key;
      this.lane.appendChild(tile);
      this.timeline.push({ idx: this.timeline.length, key, sargam: n.sargam, start: t, dur, tile, done: false });
      t += dur;
    });
    this.totalTime = t;
    this.playableCount = this.timeline.length;
    this._layout();
    this.reset();
    this._renderStatic();
  }

  reset() {
    this.clock = -LEAD_TIME;     // start with lead-in so first tile falls from top
    this.curExpected = 0;
    this.lastAutoIdx = -1;
    this.frozen = false;
    this.hits = 0; this.misses = 0; this.combo = 0; this.maxCombo = 0;
    this.timeline.forEach(n => { n.done = false; n.tile.classList.remove('done', 'expected', 'wrong'); });
    this._emitProgress();
  }

  setTempoScale(x) { this.tempoScale = x; }

  /* effective seconds-per-beat scaling: slower tempoScale → stretch time */
  _scaled(sec) { return sec / this.tempoScale; }

  _layout() {
    if (!this.lane) return;
    const laneRect = this.lane.getBoundingClientRect();
    this.laneH = laneRect.height;
    this.hitY = this.laneH - 6;
    this.pxPerSec = this.hitY / LEAD_TIME;
    // horizontal alignment: center each tile over its key column
    if (this.keyEls && this.keyEls.length) {
      this._cols = this.keyEls.map(el => {
        const r = el.getBoundingClientRect();
        return { left: r.left - laneRect.left, width: r.width };
      });
    }
    this._positionTilesX();
  }

  _positionTilesX() {
    if (!this._cols) return;
    this.timeline.forEach(n => {
      const c = this._cols[n.key];
      if (!c) return;
      n.tile.style.left = c.left + 'px';
      n.tile.style.width = c.width + 'px';
    });
  }

  /* ─── Playback ─── */
  play(mode) {
    if (!this.song) return;
    this.mode = mode;
    this.reset();
    this.playing = true;
    this._lastTs = performance.now();
    this.lane.classList.toggle('practice', mode === 'practice');
    if (mode === 'practice') this._markExpected();
    const loop = (ts) => {
      if (!this.playing) return;
      const dt = Math.min(0.05, (ts - this._lastTs) / 1000);
      this._lastTs = ts;
      this._tick(dt);
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  }

  stop() {
    this.playing = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
    this.onStop();
    this.onHighlightKey(-1, false);
    if (this.lane) this.lane.classList.remove('practice');
  }

  _tick(dt) {
    // advance clock (frozen in practice when waiting for the learner)
    if (!this.frozen) this.clock += dt / this.tempoScale;

    this._renderFalling();

    if (this.mode === 'listen') this._autoPlay();
    else this._practiceCheck();

    // finished?
    if (this.clock > this.totalTime + 0.4 && !this.frozen) this._finish();
  }

  _renderFalling() {
    const { hitY, pxPerSec, laneH } = this;
    for (const n of this.timeline) {
      const top = hitY - (n.start + n.dur - this.clock) * pxPerSec;
      const h = Math.max(18, n.dur * pxPerSec);
      n.tile.style.transform = `translateY(${top - h}px)`;
      n.tile.style.height = h + 'px';
      const visible = top > -4 && (top - h) < laneH;
      n.tile.style.opacity = visible ? '' : '0';
    }
  }

  _renderStatic() {
    // initial paint before pressing play
    this._renderFalling && this._renderFalling();
  }

  /* listen: play whichever note is active at the clock (legato auto-update) */
  _autoPlay() {
    let active = -1;
    for (const n of this.timeline) {
      if (this.clock >= n.start && this.clock < n.start + n.dur) { active = n.idx; break; }
    }
    if (active !== this.lastAutoIdx) {
      if (active === -1) { this.onStop(); this.onHighlightKey(-1, false); }
      else {
        const n = this.timeline[active];
        this.onPlay(n.key, this.lastAutoIdx !== -1);
        this.onHighlightKey(n.key, true);
      }
      this.lastAutoIdx = active;
    }
  }

  /* practice: freeze at the hit line until the learner plays the right note */
  _practiceCheck() {
    if (this.curExpected >= this.timeline.length) return;
    const n = this.timeline[this.curExpected];
    // when the note reaches the hit line and isn't played yet → wait
    if (this.clock >= n.start && !n.done) {
      if (!this.frozen) { this.frozen = true; this._markExpected(); }
    }
  }

  _markExpected() {
    this.timeline.forEach(t => t.tile.classList.remove('expected'));
    const n = this.timeline[this.curExpected];
    if (n) { n.tile.classList.add('expected'); this.onHighlightKey(n.key, true); }
  }

  /* called by main.js when the user presses a key (practice mode) */
  handleUserNote(keyIdx) {
    if (this.mode !== 'practice' || !this.playing) return;
    const n = this.timeline[this.curExpected];
    if (!n) return;
    if (keyIdx === n.key) {
      n.done = true;
      n.tile.classList.remove('expected', 'wrong');
      n.tile.classList.add('done');
      this.hits++; this.combo++; this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.curExpected++;
      this.frozen = false;
      this.onHighlightKey(-1, false);
      if (this.curExpected < this.timeline.length) {
        // keep clock from lagging behind a fast player
        const next = this.timeline[this.curExpected];
        if (this.clock < next.start - LEAD_TIME) this.clock = next.start - LEAD_TIME;
        this._markExpected();
      }
      this._emitProgress();
      if (this.curExpected >= this.timeline.length) this._finish();
    } else {
      this.misses++; this.combo = 0;
      n.tile.classList.add('wrong');
      setTimeout(() => n.tile.classList.remove('wrong'), 250);
      this._emitProgress();
    }
  }

  _accuracy() {
    const total = this.hits + this.misses;
    return total ? Math.round((this.hits / total) * 100) : 100;
  }

  _emitProgress() {
    this.onProgress({
      index: this.curExpected,
      total: this.timeline.length,
      score: this.hits * 10 + this.maxCombo * 5,
      combo: this.combo,
      accuracy: this._accuracy(),
    });
  }

  _finish() {
    this.stop();
    this.onFinish({
      score: this.hits * 10 + this.maxCombo * 5,
      accuracy: this._accuracy(),
      hits: this.hits,
      misses: this.misses,
      total: this.timeline.length,
      mode: this.mode,
    });
  }
}
