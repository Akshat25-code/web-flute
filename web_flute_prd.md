# Product Requirements Document (PRD)
## Web Flute - Interactive Web-Based Music Instrument

---

## 1. Executive Summary

**Project Name:** Web Flute  
**Project Type:** Interactive Web Application  
**Target Users:** Music enthusiasts, students, web developers, musicians  
**Primary Goal:** Create a fully functional, interactive web-based flute instrument that allows users to play realistic flute sounds through keyboard, mouse, or touch input.  
**Timeline:** 4-6 weeks (MVP in 2 weeks)  
**Tech Stack:** HTML5, CSS3, JavaScript (vanilla or React), Web Audio API

---

## 2. Project Vision

Web Flute is an interactive music instrument that brings the joy of playing a flute directly to the web browser. Unlike traditional flutes that require physical skill and breath control, Web Flute provides an accessible, intuitive way for anyone to create beautiful flute sounds. The application combines Web Audio API synthesis with an engaging user interface to create a memorable interactive experience—perfect for learning music concepts, casual music making, or as a portfolio showcase.

---

## 3. Problem Statement & Motivation

**Problem:** 
- Learning to play traditional flutes requires expensive instruments and extensive practice
- Creating digital music often requires expensive DAWs or synthesizers
- Web-based music instruments are underutilized in modern web development portfolios

**Solution:**
- Web Flute provides a free, accessible music instrument in the browser
- No installation or setup required—just open and play
- Demonstrates advanced Web Audio API skills and creative front-end development

**Portfolio Value:**
- Showcases mastery of Web Audio API (rare skill)
- Creative + Technical blend (stands out to recruiters & universities)
- Engaging demo for interviews (people will actually interact with it)
- Relevant for master's applications, especially in Japan (unique projects are valued)

---

## 4. Core Features

### 4.1 MVP (Minimum Viable Product) - Week 1-2

**Must-have features:**
1. **Keyboard Input**
   - 8-12 playable notes mapped to keyboard keys (A-Z or numeric keys)
   - Sustain while holding key, stop on key release
   - Visual feedback (keys highlight when pressed)

2. **Flute Sound Synthesis**
   - Warm, realistic flute tone using Web Audio API oscillators
   - Soft attack (gradual volume increase)
   - Natural decay (sound fades gradually)
   - Operating frequency range: 200-2000 Hz

3. **Basic Controls**
   - Volume slider (0-100%)
   - Octave selector (±1 or ±2 octaves)
   - On/Off button

4. **Visual Feedback**
   - Key display showing which note is playing
   - Simple waveform or visual indicator
   - Responsive design (desktop-friendly)

5. **Accessibility**
   - Clear labeling of keys
   - Instructions on how to play
   - Works on modern browsers (Chrome, Firefox, Safari, Edge)

---

### 4.2 Phase 2 Features - Week 3-4

**Enhancement features:**

1. **Advanced Playback Controls**
   - Play/pause functionality
   - Note sustain toggle (hold note after key release)
   - Reverb/echo effect (simulated via Web Audio convolver)
   - Vibrato effect (pitch modulation)

2. **Mouse/Touch Input**
   - Drag vertically to bend pitch (pitch bending)
   - Click to play individual notes
   - Touch support for mobile devices

3. **Recording & Playback**
   - Record sequences of notes
   - Playback with visual score
   - Download recordings as WAV audio file
   - Save simple melodies to localStorage

4. **Enhanced Visuals**
   - Animated waveform display (canvas-based)
   - Note frequency visualization
   - Modern, polished UI with CSS animations
   - Dark/light theme toggle

5. **Mobile Optimization**
   - Touch-responsive interface
   - Responsive grid layout for all screen sizes
   - Optimized for phones, tablets, desktops

---

### 4.3 Stretch Goals - Week 5-6

**Nice-to-have features:**

1. **Sheet Music Display**
   - Show notes in standard notation
   - Synced playback with sheet music visualization

2. **Multiple Instruments**
   - Switch between flute, piano, and simple synth sounds
   - Different sound characteristics for each instrument

3. **Presets**
   - Save custom reverb/vibrato settings
   - Load preset configurations

4. **Performance Enhancements**
   - Optimized audio context for low latency
   - Background audio processing
   - Web Worker support for audio synthesis

5. **Social Features**
   - Share recordings via URL
   - Leaderboard of most-played melodies
   - User submissions for featured compositions

---

## 5. Technical Specifications

### 5.1 Architecture

```
┌─────────────────────────────────────────┐
│         Web Flute Application           │
├─────────────────────────────────────────┤
│  Frontend Layer (HTML/CSS/JavaScript)   │
│  - UI Components (keyboard, controls)   │
│  - Event Handlers (keyboard, mouse)     │
│  - Canvas Visualization                 │
├─────────────────────────────────────────┤
│  Audio Processing Layer                 │
│  - Web Audio API Context                │
│  - Oscillators (sine wave synthesis)    │
│  - ADSR Envelope Generator              │
│  - Effects (reverb, vibrato)            │
├─────────────────────────────────────────┤
│  Data Management                        │
│  - LocalStorage (saving recordings)     │
│  - State Management (current note, etc) │
└─────────────────────────────────────────┘
```

### 5.2 Technology Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Frontend Framework** | Vanilla JS or React | Vanilla JS for simplicity; React for scalability |
| **Audio API** | Web Audio API | Standard, supported across all modern browsers |
| **Visualization** | HTML5 Canvas API | Real-time waveform rendering |
| **Styling** | CSS3 (Flexbox/Grid) | Modern, responsive layout |
| **Storage** | LocalStorage / IndexedDB | Client-side data persistence (recordings) |
| **Deployment** | GitHub Pages / Netlify | Free, easy deployment |

### 5.3 Browser Support

- Chrome 50+
- Firefox 50+
- Safari 12+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome Mobile)

### 5.4 Audio Implementation

**Oscillator Settings:**
- Type: Sine wave (warm, flute-like tone)
- Base frequency: A4 (440 Hz)
- Octave range: -2 to +2 (27.5 Hz to 3520 Hz)

**ADSR Envelope:**
- Attack: 50-100ms (soft start)
- Decay: 200ms
- Sustain: Full volume while key held
- Release: 200-300ms (natural fade)

**Effects Chain:**
- Master volume control
- Optional reverb (via ConvolverNode)
- Optional vibrato (pitch modulation at 4-6 Hz)

**Performance Requirements:**
- Latency: < 50ms between key press and sound
- CPU Usage: < 10% on mid-range devices
- Memory: < 50MB (including audio context)

---

## 6. User Interface Design

### 6.1 Layout Structure

```
┌─────────────────────────────────────┐
│      WEB FLUTE - Header             │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │  KEYBOARD / NOTE DISPLAY    │   │
│  │  C D E F G A B C D E F G A  │   │
│  │  (visual + interactive)     │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  CONTROLS PANEL             │   │
│  │  Volume: [======●====]      │   │
│  │  Octave: [- 0 +]            │   │
│  │  Effects: [Reverb] [Vibrato]│   │
│  │  [Play] [Stop] [Record]     │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  VISUALIZATION              │   │
│  │  (Waveform / Frequency)     │   │
│  │  [████░░░░░░░░░░░░░░]       │   │
│  └─────────────────────────────┘   │
│                                     │
│  Instructions & Tips                │
│                                     │
└─────────────────────────────────────┘
```

### 6.2 Component Breakdown

| Component | Purpose | Interaction |
|-----------|---------|-------------|
| **Keyboard Display** | Show 12 playable notes | Click or press key |
| **Volume Slider** | Control output volume | Drag slider |
| **Octave Selector** | Change pitch range | +/- buttons |
| **Effect Toggles** | Enable/disable reverb & vibrato | Click button |
| **Play/Stop Buttons** | Control playback | Click to toggle |
| **Waveform Visualizer** | Show real-time audio | Canvas animation |
| **Instructions** | Guide users | Static text |

### 6.3 Color Scheme & Style

**Aesthetic:** Modern, minimalist, music-inspired

- **Primary Color:** Deep blue (#2E75B6)
- **Secondary Color:** Teal (#17a2b8)
- **Background:** Light gray (#f5f5f5) or dark (#1a1a1a)
- **Accent:** Gold (#FFD700) for highlights
- **Text:** Dark gray (#333) on light bg / light gray on dark bg
- **Font:** Inter, Roboto, or system fonts

---

## 7. User Journey & Scenarios

### 7.1 Primary User Flow

**Scenario 1: First-Time Player**
1. Opens Web Flute in browser
2. Reads brief instructions ("Press A-G keys to play")
3. Tries pressing different keys
4. Adjusts volume slider to comfortable level
5. Changes octave to explore range
6. Plays a simple melody (e.g., "Mary Had a Little Lamb")

**Scenario 2: Music Student**
1. Opens Web Flute for learning intervals
2. Plays two notes and compares frequencies
3. Records a scale (C major)
4. Saves recording to review later
5. Shares link with music teacher

**Scenario 3: Portfolio Showcase**
1. Developer shows Web Flute in interview
2. Interviewer plays a few notes
3. Developer explains Web Audio API implementation
4. Discussion of audio synthesis and UI design

---

## 8. Success Metrics & KPIs

### 8.1 Technical Metrics

| Metric | Target | Threshold |
|--------|--------|-----------|
| **Page Load Time** | < 2 seconds | < 5 seconds |
| **Audio Latency** | < 50ms | < 100ms |
| **CPU Usage** | < 10% idle | < 20% playing |
| **Memory Footprint** | < 50MB | < 100MB |
| **Browser Support** | 4+ major browsers | 2+ browsers |

### 8.2 User Experience Metrics

| Metric | Target |
|--------|--------|
| **Time to First Note** | < 5 seconds |
| **Intuitiveness** (no tutorial needed) | 80%+ users can play |
| **Mobile Responsiveness** | Works on all screen sizes |
| **Accessibility** | WCAG AA compliant |

### 8.3 Portfolio Metrics

| Metric | Target |
|--------|--------|
| **GitHub Stars** | 50+ (if public) |
| **Interview Impact** | Positive mentions in feedback |
| **Uniqueness** | Stand out vs. typical portfolio projects |

---

## 9. Project Timeline & Milestones

### 9.1 Phase Breakdown

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1: Foundation** | Week 1 | - Project setup<br>- Web Audio API basics<br>- Keyboard input handling<br>- Basic flute tone synthesis |
| **Phase 2: MVP Core** | Week 2 | - All 12 notes working<br>- Volume & octave controls<br>- Visual feedback (keyboard display)<br>- Tested on 2+ browsers |
| **Phase 3: Enhancement** | Week 3-4 | - Reverb & vibrato effects<br>- Mouse/touch pitch bending<br>- Recording functionality<br>- Mobile optimization |
| **Phase 4: Polish** | Week 5 | - Waveform visualization<br>- UI refinement<br>- Performance optimization<br>- Documentation |
| **Phase 5: Deployment** | Week 6 | - Deploy to GitHub Pages/Netlify<br>- Create portfolio page<br>- Final testing & QA |

### 9.2 Weekly Milestones

**Week 1:**
- [ ] Project repo created (GitHub)
- [ ] Basic HTML/CSS structure
- [ ] Web Audio Context initialized
- [ ] First note plays with keyboard input

**Week 2:**
- [ ] All 12 notes mapped to keyboard
- [ ] Volume slider functional
- [ ] Octave selector working
- [ ] Keyboard display visual feedback
- [ ] MVP ready for testing

**Week 3:**
- [ ] Reverb effect implemented
- [ ] Vibrato effect implemented
- [ ] Recording functionality added
- [ ] Mobile touch support

**Week 4:**
- [ ] Waveform visualizer working
- [ ] UI polish & animations
- [ ] Performance optimization
- [ ] Cross-browser testing

**Week 5-6:**
- [ ] Deploy to production
- [ ] Create documentation
- [ ] Portfolio blog post
- [ ] Share on GitHub/Twitter

---

## 10. Technical Debt & Risks

### 10.1 Potential Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Audio latency issues | Poor user experience | Test on low-end devices early |
| Browser audio context restrictions | Sound won't play | Request user interaction before audio |
| Mobile performance | App unusable on phones | Optimize audio processing |
| Cross-browser audio differences | Inconsistent sound quality | Test on all major browsers |
| Recording file size | Storage/performance issues | Compress WAV or use lossy format |

### 10.2 Technical Debt

- Audio synthesis could be abstracted into separate modules
- Visualization code could be separated from main logic
- Effect implementations (reverb, vibrato) could use external library (Tone.js)
- State management could use Redux (if scaling)

---

## 11. Success Criteria (Definition of Done)

### 11.1 MVP Success Criteria

- ✅ User can play 12 distinct notes using keyboard
- ✅ Sound is recognizable as "flute-like" (soft, warm tone)
- ✅ Audio latency < 100ms
- ✅ Volume and octave controls work smoothly
- ✅ Responsive design (works on desktop and tablet)
- ✅ Works on Chrome, Firefox, Safari, and Edge
- ✅ Code is documented and hosted on GitHub
- ✅ User can play a complete melody without issues

### 11.2 Full Project Success Criteria

- ✅ All MVP + Phase 2 features implemented
- ✅ Recording and playback functional
- ✅ Effects (reverb, vibrato) add musical value
- ✅ Mobile-optimized (touch input, responsive)
- ✅ Waveform visualization engaging and smooth
- ✅ Performance: < 10% CPU usage, < 100MB memory
- ✅ Documented with README, demo video, usage guide
- ✅ Deployed to public URL (GitHub Pages/Netlify)
- ✅ Portfolio blog post published

---

## 12. Deployment & Hosting

### 12.1 Hosting Options

**Option A: GitHub Pages (Recommended)**
- **Pros:** Free, simple, integrated with GitHub
- **Cons:** Static hosting only (no backend)
- **Setup:** Push to `gh-pages` branch or `/docs` folder
- **URL:** `https://yourusername.github.io/web-flute`

**Option B: Netlify**
- **Pros:** Free, fast, built-in CI/CD
- **Cons:** Minor limitations on free tier
- **Setup:** Connect GitHub repo, auto-deploy on push
- **URL:** `https://web-flute.netlify.app`

**Option C: Vercel**
- **Pros:** Optimized for React apps
- **Cons:** Overkill for static app
- **Setup:** Import GitHub repo, auto-deploy
- **URL:** `https://web-flute.vercel.app`

**Recommendation:** Start with GitHub Pages for simplicity.

### 12.2 Pre-Deployment Checklist

- [ ] All features tested on target browsers
- [ ] Performance metrics met (latency, CPU, memory)
- [ ] Mobile responsiveness confirmed
- [ ] Audio context handles multiple browsers
- [ ] Error handling for unsupported browsers
- [ ] README.md with instructions
- [ ] License file (MIT recommended)
- [ ] .gitignore properly configured
- [ ] No console errors or warnings
- [ ] Lighthouse score > 90

---

## 13. Documentation Requirements

### 13.1 README Content

- Project overview & demo link
- Features list with screenshots
- Installation & setup instructions
- Keyboard controls reference
- Browser compatibility table
- Performance metrics
- Contributing guidelines
- License information

### 13.2 Code Documentation

- JSDoc comments for all functions
- Inline comments for complex audio logic
- Audio synthesis algorithm explanation
- File structure overview
- Dependencies list and versions

### 13.3 User Guide

- Quick start (first 5 minutes)
- Keyboard controls cheat sheet
- How to use effects
- Tips for playing melodies
- Troubleshooting section

---

## 14. Future Roadmap (Post-Launch)

**Phase 6 (Quarter 2):**
- Integrate Tone.js for more sophisticated synthesis
- Add drum machine / percussion sounds
- Implement MIDI controller support
- Create preset compositions

**Phase 7 (Quarter 3):**
- Web Audio Worklets for advanced synthesis
- Multi-instrument support (flute, piano, synth)
- Full music sequencer with patterns
- Export to MIDI or MusicXML

**Phase 8 (Quarter 4+):**
- Collaborative play (WebSockets)
- Cloud save/sync
- Mobile app (React Native)
- AI melody generator

---

## 15. Glossary

| Term | Definition |
|------|-----------|
| **Web Audio API** | JavaScript API for processing and synthesizing audio in web browsers |
| **Oscillator** | Audio source that generates repeating waveforms at a specified frequency |
| **ADSR** | Envelope shape: Attack, Decay, Sustain, Release (for sound dynamics) |
| **Latency** | Delay between user input (key press) and audio output |
| **Convolver** | Audio node that applies reverb by convolving input with impulse response |
| **Vibrato** | Variation in pitch (musical effect) |
| **Synthesizer** | Electronic instrument that generates sound from oscillators |
| **Waveform** | Visual representation of audio signal amplitude over time |

---

## 16. Appendix

### A. Reference Projects

1. **Web Harmonium** - https://www.webharmonium.in (inspiration)
2. **Tone.js** - https://tonejs.org (audio library reference)
3. **Chrome Music Lab** - https://musiclab.chromeexperiments.com (interface inspiration)
4. **Theremin** - https://madebyevan.com/theremin (pitch bending reference)

### B. Useful Resources

**Web Audio API:**
- MDN Web Audio API docs
- Web Audio API specification
- Chris Wilson's audio tutorials

**Design Inspiration:**
- Dribbble (music app designs)
- Behance (UI/UX portfolios)
- Apple Music app (modern UI patterns)

**Learning:**
- Tones.js documentation
- Web Audio API examples
- Canvas animation tutorials

---

**Document Version:** 1.0  
**Last Updated:** March 31, 2026  
**Author:** Akshat (with Claude)  
**Status:** Ready for Development
