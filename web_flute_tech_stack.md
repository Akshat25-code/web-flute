# Web Flute - Technical Stack Document

---

## 1. Overview

This document outlines the complete technology stack for the Web Flute project, including frontend frameworks, audio processing libraries, build tools, and deployment infrastructure.

**Project Stack Summary:**
```
Frontend: HTML5 / CSS3 / JavaScript (or React/Vue)
├── UI Framework: Vanilla JS or React
├── Audio Engine: Web Audio API + Tone.js (optional)
├── Visualization: HTML5 Canvas API
├── Styling: CSS3 (Flexbox/Grid) + CSS Variables
└── Storage: LocalStorage / IndexedDB

Build & Tooling:
├── Module Bundler: Vite or Webpack (optional)
├── Package Manager: npm or yarn
├── Dev Tools: ESLint, Prettier, DevTools
└── Testing: Jest (optional)

Deployment:
├── Hosting: GitHub Pages / Netlify / Vercel
├── Version Control: Git / GitHub
└── CI/CD: GitHub Actions (auto-deploy)
```

---

## 2. Frontend Technologies

### 2.1 Core Frontend (Required)

#### **HTML5**
**Version:** Latest (HTML5 Living Standard)  
**Purpose:** Semantic structure, audio elements, canvas for visualization

**Key Features Used:**
- `<canvas>` for waveform visualization
- `<audio>` element (optional, for pre-recorded samples)
- Semantic HTML for accessibility (labels, ARIA)
- Data attributes for configuration

**Installation:** Built-in (no installation needed)

**Example Usage:**
```html
<canvas id="visualizer" width="800" height="200"></canvas>
<audio id="audioElement"></audio>
```

---

#### **CSS3**
**Version:** Latest (CSS3 with modern features)  
**Purpose:** Styling, layout, animations, responsive design

**Key Features Used:**
- CSS Grid & Flexbox (responsive layout)
- CSS Variables (theming & consistency)
- CSS Animations & Transitions (UI feedback)
- Media Queries (responsive breakpoints)
- CSS Filters (visual effects on canvas)

**Installation:** Built-in (no installation needed)

**Example Usage:**
```css
:root {
  --primary-color: #2E75B6;
  --secondary-color: #17a2b8;
  --background: #f5f5f5;
  --text-color: #333;
}

.keyboard {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.key {
  transition: all 0.1s ease;
  animation: fadeIn 0.3s ease-in-out;
}

.key:active,
.key.active {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(46, 117, 182, 0.4);
}

@media (max-width: 768px) {
  .keyboard {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

---

#### **JavaScript (Vanilla or Framework)**
**Version:** ES6+ (ECMAScript 2015+)  
**Purpose:** Event handling, audio synthesis, UI interaction, state management

**Two Approach Options:**

**Option A: Vanilla JavaScript (Simpler, Recommended for MVP)**
- No build process required
- Fast to prototype
- Good for learning Web Audio API
- File size: Minimal (~30-50KB gzipped)

**Option B: React (Scalable, for Production)**
- Component-based architecture
- State management (hooks)
- Easier to manage complex UI
- File size: ~40KB (React) + app code

**Installation (Option A - Vanilla):**
```bash
# No installation needed, just create .js files
```

**Installation (Option B - React):**
```bash
npm create vite@latest web-flute -- --template react
cd web-flute
npm install
npm run dev
```

**Example - Vanilla JS (Simple):**
```javascript
class WebFlute {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.oscillator = null;
    this.gainNode = this.audioContext.createGain();
    this.notes = {
      'C': 262, 'D': 294, 'E': 330, 'F': 349,
      'G': 392, 'A': 440, 'B': 494, 'C2': 523
    };
  }

  playNote(frequency) {
    this.oscillator = this.audioContext.createOscillator();
    this.oscillator.type = 'sine';
    this.oscillator.frequency.value = frequency;
    this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.05);
    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);
    this.oscillator.start();
  }

  stopNote() {
    if (this.oscillator) {
      this.gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.3);
      this.oscillator.stop(this.audioContext.currentTime + 0.3);
    }
  }
}
```

**Example - React (Modern):**
```javascript
import React, { useState, useRef, useEffect } from 'react';

function WebFlute() {
  const audioContextRef = useRef(null);
  const [volume, setVolume] = useState(0.5);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
  }, []);

  const playNote = (frequency) => {
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.value = volume;

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1);
  };

  return (
    <div className="flute-container">
      <input
        type="range"
        value={volume}
        onChange={(e) => setVolume(parseFloat(e.target.value))}
      />
    </div>
  );
}

export default WebFlute;
```

---

### 2.2 Web Audio API

**Version:** W3C Standard (Web Audio API Level 1)  
**Purpose:** Audio synthesis, effects processing, real-time audio playback

**Key Nodes:**
- **OscillatorNode** - Generates audio waveforms (sine, square, sawtooth)
- **GainNode** - Controls volume
- **EnvelopeGenerator** - ADSR (Attack, Decay, Sustain, Release)
- **ConvolverNode** - Reverb effects
- **BiquadFilterNode** - EQ and filtering
- **AnalyserNode** - Real-time frequency/waveform data (for visualization)

**Installation:** Built-in (no installation needed)

**Browser Support:**
- Chrome 25+
- Firefox 25+
- Safari 14.1+
- Edge 79+

**Example - Complete Audio Chain:**
```javascript
class AudioEngine {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create nodes
    this.oscillator = null;
    this.gainNode = this.ctx.createGain();
    this.convolver = this.ctx.createConvolver();
    this.analyser = this.ctx.createAnalyser();
    
    // Set up signal chain: Oscillator → Gain → Convolver → Analyser → Output
    this.gainNode.connect(this.convolver);
    this.convolver.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
    
    // Reverb impulse response (simplified)
    this.convolver.buffer = this.createReverbBuffer();
  }

  createReverbBuffer() {
    // Create a simple reverb impulse response
    const rate = this.ctx.sampleRate;
    const length = rate * 2; // 2 seconds
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);
    
    for (let i = 0; i < length; i++) {
      left[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      right[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
    }
    return impulse;
  }

  playNote(frequency, duration = 1) {
    this.oscillator = this.ctx.createOscillator();
    this.oscillator.type = 'sine';
    this.oscillator.frequency.value = frequency;
    
    // ADSR Envelope
    const now = this.ctx.currentTime;
    this.gainNode.gain.setValueAtTime(0, now);
    this.gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05); // Attack
    this.gainNode.gain.linearRampToValueAtTime(0.25, now + 0.25); // Decay
    this.gainNode.gain.linearRampToValueAtTime(0, now + duration); // Release
    
    this.oscillator.connect(this.gainNode);
    this.oscillator.start(now);
    this.oscillator.stop(now + duration);
  }
}
```

---

## 3. Audio Processing Libraries (Optional)

### 3.1 Tone.js (Recommended for Advanced Synth)

**Version:** Latest (v14.8+)  
**Purpose:** High-level audio synthesis, effects, scheduling

**Pros:**
- Simplifies Web Audio API complexity
- Built-in effects (reverb, delay, filter)
- Synth objects with easy note triggering
- MIDI support

**Cons:**
- Adds ~60KB gzipped (larger bundle)
- Learning curve (more abstraction)
- Overkill for simple flute

**Installation:**
```bash
npm install tone
```

**Example Usage:**
```javascript
import * as Tone from 'tone';

// Create a synth with flute-like sound
const synth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: 'sine' },
  envelope: {
    attack: 0.05,
    decay: 0.2,
    sustain: 0.3,
    release: 0.3
  }
}).toDestination();

// Add reverb
const reverb = new Tone.Reverb({
  decay: 2.5
}).connect(synth);

// Play a note
synth.triggerAttackRelease('C4', '4n'); // Quarter note
```

**When to Use:**
- Phase 2-3 (after MVP is working)
- For advanced effects and polyphony
- If you want to avoid complex Web Audio boilerplate

---

### 3.2 ToneUI / ui.Tone.js (Optional, for GUI)

**Purpose:** Pre-built UI components for Tone.js

**Installation:**
```bash
npm install ui-tone
```

---

## 4. Visualization & Graphics

### 4.1 HTML5 Canvas API

**Version:** Standard HTML5 Canvas  
**Purpose:** Real-time waveform and frequency visualization

**Installation:** Built-in (no installation needed)

**Example - Real-time Waveform Visualization:**
```javascript
class WaveformVisualizer {
  constructor(canvasId, analyser) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.analyser = analyser;
    this.dataArray = new Uint8Array(analyser.frequencyBinCount);
  }

  draw() {
    this.analyser.getByteFrequencyData(this.dataArray);
    
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Clear canvas
    this.ctx.fillStyle = '#f5f5f5';
    this.ctx.fillRect(0, 0, width, height);
    
    // Draw frequency bars
    this.ctx.fillStyle = '#2E75B6';
    const barWidth = (width / this.dataArray.length) * 2.5;
    
    for (let i = 0; i < this.dataArray.length; i++) {
      const barHeight = (this.dataArray[i] / 255) * height;
      this.ctx.fillRect(
        i * barWidth,
        height - barHeight,
        barWidth - 1,
        barHeight
      );
    }
    
    requestAnimationFrame(() => this.draw());
  }
}
```

---

### 4.2 D3.js / Chart.js (Optional, for Advanced Viz)

Not necessary for MVP, but useful for:
- Complex audio visualizations
- Frequency spectrum analysis
- Data-driven music visualizations

---

## 5. Build Tools & Development Environment

### 5.1 Option A: Vanilla JS (No Build Tool)

**Pros:**
- Fastest to get started
- No build process complexity
- Direct browser execution
- Perfect for learning

**Cons:**
- No module bundling
- Hard to manage dependencies
- No tree-shaking or minification

**Project Structure:**
```
web-flute/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js
│   ├── audio-engine.js
│   └── visualizer.js
└── assets/
    └── (images, icons, etc.)
```

**index.html:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="css/style.css">
  <title>Web Flute</title>
</head>
<body>
  <div id="app"></div>
  
  <script src="js/audio-engine.js"></script>
  <script src="js/visualizer.js"></script>
  <script src="js/main.js"></script>
</body>
</html>
```

---

### 5.2 Option B: Vite (Lightweight Bundler)

**Version:** Latest (v4.0+)  
**Purpose:** Fast build tool, dev server, ES6 module support

**Pros:**
- Lightning-fast dev server (HMR)
- Minimal config
- Great for modern JavaScript
- Optimized production builds

**Cons:**
- Requires Node.js
- Build step in deployment

**Installation:**
```bash
npm create vite@latest web-flute -- --template vanilla
cd web-flute
npm install
npm run dev
```

**vite.config.js:**
```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'esnext',
    minify: 'terser'
  },
  server: {
    port: 3000,
    open: true
  }
});
```

---

### 5.3 Option C: React with Vite

**Installation:**
```bash
npm create vite@latest web-flute -- --template react
cd web-flute
npm install
npm run dev
```

**package.json:**
```json
{
  "name": "web-flute",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^3.1.0",
    "vite": "^4.3.0"
  }
}
```

---

### 5.4 Package Manager

**npm (Recommended)**
```bash
# Initialize project
npm init -y

# Install dependencies
npm install tone

# Run dev server
npm run dev

# Build for production
npm run build
```

**Or Yarn:**
```bash
yarn init
yarn add tone
yarn dev
yarn build
```

---

## 6. Code Quality & Development Tools

### 6.1 ESLint (Code Linting)

**Purpose:** Catch bugs and enforce coding standards

**Installation:**
```bash
npm install --save-dev eslint
npx eslint --init
```

**.eslintrc.json:**
```json
{
  "env": {
    "browser": true,
    "es2021": true
  },
  "extends": "eslint:recommended",
  "rules": {
    "no-unused-vars": "warn",
    "no-console": "warn"
  }
}
```

---

### 6.2 Prettier (Code Formatter)

**Purpose:** Auto-format code for consistency

**Installation:**
```bash
npm install --save-dev prettier
```

**.prettierrc:**
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

---

### 6.3 Browser DevTools

**Built-in (No Installation):**
- Chrome DevTools (F12 / Cmd+Option+I)
- Firefox Developer Tools (F12)
- Safari Web Inspector

**Key Features for Audio Development:**
- Console (debugging)
- Sources (breakpoints)
- Network (file size analysis)
- Performance profiler (audio latency)

---

## 7. Testing (Optional, for Production)

### 7.1 Jest (Unit Testing)

**Installation:**
```bash
npm install --save-dev jest @babel/preset-env
```

**Example Test:**
```javascript
// audio-engine.test.js
import AudioEngine from './audio-engine';

test('should initialize audio context', () => {
  const engine = new AudioEngine();
  expect(engine.ctx).toBeDefined();
});

test('should play note with correct frequency', () => {
  const engine = new AudioEngine();
  engine.playNote(440); // A4
  expect(engine.oscillator.frequency.value).toBe(440);
});
```

---

## 8. Deployment & Hosting

### 8.1 GitHub Pages (Recommended for MVP)

**Setup (5 minutes):**

1. Create GitHub repo: `web-flute`
2. Push code to main branch
3. Go to Settings → Pages
4. Source: `Deploy from a branch`
5. Branch: `main` / Folder: `/ (root)`
6. Click Save

**URL:** `https://yourusername.github.io/web-flute`

**Deployment:**
```bash
git add .
git commit -m "Release v1.0"
git push origin main
```

**Pros:**
- Free hosting
- No backend needed
- Simple setup
- Good for portfolios

**Cons:**
- Public visibility required
- No custom domain (without paid GitHub Pro)

---

### 8.2 Netlify (Recommended for Production)

**Setup (2 minutes):**

1. Go to Netlify.com
2. Click "New site from Git"
3. Connect GitHub repo
4. Build command: `npm run build` (if using Vite)
5. Publish directory: `dist`
6. Click Deploy

**Automatic deploys on git push!**

**URL:** `https://web-flute.netlify.app`

**Pros:**
- Free HTTPS
- Auto-deploys from Git
- Custom domain support
- Better performance than GitHub Pages

**Cons:**
- Requires Netlify account
- Build process required

---

### 8.3 Vercel

**Setup:**
```bash
npm install -g vercel
vercel
```

**Pros:**
- Optimized for React apps
- Edge Functions support
- Serverless backend (if needed later)

---

## 9. Performance Optimization

### 9.1 File Size Optimization

**Minification (Vite auto-minifies):**
```bash
npm run build
# Outputs optimized files to /dist
```

**Target Sizes:**
- HTML: < 50KB
- CSS: < 20KB
- JavaScript: < 80KB (without Tone.js) or < 150KB (with Tone.js)
- Total bundle: < 200KB gzipped

---

### 9.2 Audio Performance

**Web Audio Best Practices:**
- Use `AudioContext.resume()` on user interaction
- Minimize oscillator creation (reuse nodes)
- Use `OfflineAudioContext` for pre-rendering
- Avoid allocating in audio callback (audioprocess event)

---

### 9.3 Browser DevTools Performance Profiling

```javascript
// Measure audio latency
const startTime = performance.now();
this.playNote(440);
const endTime = performance.now();
console.log(`Latency: ${endTime - startTime}ms`);
```

---

## 10. Dependencies Summary

### 10.1 For Vanilla JS + Web Audio (MVP)

```json
{
  "devDependencies": {
    "vite": "^4.3.0"
  },
  "dependencies": {}
}
```
**Total Size:** ~2-5KB gzipped (just your code)

---

### 10.2 For React + Tone.js (Full-Featured)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tone": "^14.8.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^3.1.0",
    "vite": "^4.3.0",
    "eslint": "^8.0.0",
    "prettier": "^2.8.0"
  }
}
```
**Total Size:** ~120-150KB gzipped

---

## 11. Development Workflow

### 11.1 Local Development Setup

**Vanilla JS Workflow:**
```bash
# Create project
mkdir web-flute
cd web-flute
git init

# Create structure
mkdir {css,js,assets}
touch index.html css/style.css js/main.js

# Open in browser
open index.html

# Or use simple HTTP server
npx http-server
```

**React/Vite Workflow:**
```bash
# Create project
npm create vite@latest web-flute -- --template react
cd web-flute
npm install

# Start dev server (hot reload)
npm run dev

# Build for production
npm run build

# Preview build
npm run preview
```

---

### 11.2 Git Workflow

```bash
# Clone or create repo
git clone <repo-url>
cd web-flute

# Create feature branch
git checkout -b feature/reverb-effect

# Make changes
# ... edit files ...

# Commit
git add .
git commit -m "Add reverb effect"

# Push to GitHub
git push origin feature/reverb-effect

# Create Pull Request on GitHub
# Merge when ready
```

---

## 12. Quick Start Checklist

### For MVP (Vanilla JS + Web Audio API)

- [ ] Create GitHub repo
- [ ] Initialize project structure
- [ ] Write HTML (keyboard layout, controls, canvas)
- [ ] Write CSS (styling, animations, responsive)
- [ ] Write JS (audio engine, event handlers)
- [ ] Test on Chrome, Firefox, Safari
- [ ] Deploy to GitHub Pages
- [ ] Share on portfolio!

**Time: 2 weeks**

---

### For Production (React + Tone.js)

- [ ] All MVP features done
- [ ] `npm create vite` React project
- [ ] Convert to React components
- [ ] Add Tone.js for advanced synth
- [ ] Implement recording/playback
- [ ] Optimize performance
- [ ] Deploy to Netlify
- [ ] Create documentation

**Time: 4-6 weeks**

---

## 13. Recommended Learning Path

1. **Week 1:**
   - Learn Web Audio API basics
   - Set up project structure
   - Create first oscillator

2. **Week 2:**
   - Add all 12 notes
   - Implement keyboard events
   - Add volume control

3. **Week 3:**
   - Learn Canvas for visualization
   - Add waveform display
   - Implement effects

4. **Week 4+:**
   - Add React (if scaling)
   - Integrate Tone.js
   - Optimize and polish

---

## 14. Troubleshooting

### Audio not playing?
```javascript
// Must resume AudioContext on user interaction
document.addEventListener('click', () => {
  audioContext.resume();
});
```

### Latency issues?
- Use `AudioContext` (not `webkitAudioContext`)
- Avoid nested callbacks in audio processing
- Profile with DevTools Performance tab

### Browser compatibility?
- Use vendor prefixes: `window.webkitAudioContext`
- Test on multiple browsers early

### Bundle too large?
- Don't import Tone.js if not using advanced features
- Use Vite tree-shaking: `npm run build`

---

## 15. Resources & Links

**Web Audio API:**
- MDN: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- Official Spec: https://www.w3.org/TR/webaudio/
- Interactive Examples: https://github.com/mdn/webaudio-examples

**Tone.js:**
- Documentation: https://tonejs.org
- GitHub: https://github.com/Tonejs/Tone.js
- Examples: https://tonejs.org/examples

**Vite:**
- Official: https://vitejs.dev
- Docs: https://vitejs.dev/guide/

**Deployment:**
- GitHub Pages: https://pages.github.com
- Netlify: https://netlify.com
- Vercel: https://vercel.com

---

**Document Version:** 1.0  
**Last Updated:** March 31, 2026  
**Status:** Production Ready  
**Maintainer:** Akshat
