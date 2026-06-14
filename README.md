# 🪈 बाँसुरी – Web Flute

A beautiful, playable Indian **Bansuri** in your browser. Real recorded
flute sound, a guided **Learn Mode** for beginners, and a free-play mode
for those who already know how. Built with vanilla JavaScript and the
Web Audio API — no frameworks, no build step.

> **Two ways in:** if you can play, jump into **Free Play**. If you can't,
> **Learn Mode** teaches you a song note-by-note with falling tiles.

## ✨ Features

- 🎵 **Real flute sound** — plays recorded bansuri samples, pitch-shifted
  across the range, with seamless looping on held notes. Falls back to
  built-in synthesis automatically if no samples are present.
- 🎓 **Learn Mode** — Synthesia-style falling notes. **Listen** to a song,
  or **Practice** it: the next key glows and waits for you, with live
  score, combo, and accuracy.
- 🎶 **Free Play** — 8 sargam keys (Sa → Sa′), keyboard + touch, a glowing
  visual flute showing real fingering, and golden sparkle particles.
- 🎻 **Tanpura drone** — a soft Sa–Pa–Sa background hum so everything you
  play instantly sounds musical. Follows your chosen Sa root.
- 🎚️ **Controls** — volume, Sa root (transpose), reverb, and a
  real-sample / synth toggle.

## ▶️ Play it

This project loads audio files, so it must be served over **http://**,
not opened directly as a `file://` page.

```bash
# from this folder:
python -m http.server 8000
#   then open http://localhost:8000/
# or:
npx http-server . -p 8000
```

## 🎹 Keys

| Key | Sargam | | Key | Sargam |
|-----|--------|-|-----|--------|
| **A** | Sa  | | **J** | Pa  |
| **S** | Re  | | **K** | Dha |
| **D** | Ga  | | **L** | Ni  |
| **F** | Ma  | | **;** | Sa′ |

You can also tap/click the keys on screen.

## 🎤 Adding your own flute samples

Drop single-note audio files into [`audio/samples/`](audio/samples/),
named by pitch (scientific notation, middle C = `C4`):

```
C4.mp3   D4.mp3   E4.mp3 …   C5.wav …
```

- `.mp3`, `.ogg`, or `.wav`; one clean sustained note per file.
- Even a single file works — every other note is pitch-shifted from the
  nearest sample. More notes = more realistic.
- The app auto-detects whatever is present on page load.

See [`audio/samples/README.md`](audio/samples/README.md) for details.

## 🗂️ Project structure

```
index.html            App shell: onboarding, mode tabs, keys, controls
css/style.css         Theme + UI styling
js/
  audio-engine.js     Additive-synthesis flute (fallback engine)
  sample-player.js    Real-sample engine (primary)
  engine.js           Facade: picks samples, falls back to synth
  tanpura.js          Synthesized background drone
  visualizer.js       Golden waveform canvas
  songs.js            Learn-Mode song data
  song-player.js      Learn-Mode engine (falling tiles, scoring)
  main.js             Wiring, modes, input, onboarding
audio/samples/        Your flute note files go here
```

## 🛠️ How the sound works

The sargam keys choose the **pitch** (fingering chart shown on the flute).
The sample engine picks the nearest recorded note and shifts it to the
target pitch, looping a zero-crossing-snapped sustain region so held
notes ring without clicks. Legato presses glide/crossfade between notes
for a natural *meend*. Everything runs through a gentle convolver reverb.

## 📦 Browser support

Modern Chrome, Firefox, Safari, and Edge (desktop + mobile). Audio
starts on first interaction, per browser autoplay rules.

## 📄 License

MIT — see [LICENSE](LICENSE).
