/* ===================================================================
   Web Flute v5.0 – Golden Divine Visualizer
   Warm golden waveform with ambient sparkle dots.
   =================================================================== */

class Visualizer {
  constructor(canvas, analyserProvider) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.analyserProvider = analyserProvider;
    this.waveData = null;
    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.W = rect.width;
    this.H = rect.height;
  }

  start() {
    const loop = () => { this._draw(); requestAnimationFrame(loop); };
    loop();
  }

  _draw() {
    const { W, H, ctx } = this;
    const analyser = this.analyserProvider();

    ctx.clearRect(0, 0, W, H);

    if (!analyser) {
      this._idle();
      return;
    }

    const N = analyser.fftSize;
    if (!this.waveData || this.waveData.length !== N)
      this.waveData = new Uint8Array(N);

    analyser.getByteTimeDomainData(this.waveData);

    // Golden gradient waveform
    ctx.save();
    ctx.shadowColor = 'rgba(232, 180, 77, 0.5)';
    ctx.shadowBlur = 10;

    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, 'rgba(232, 180, 77, 0.7)');
    grad.addColorStop(0.4, 'rgba(245, 213, 144, 0.9)');
    grad.addColorStop(0.7, 'rgba(240, 147, 58, 0.8)');
    grad.addColorStop(1, 'rgba(232, 180, 77, 0.6)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();

    const step = W / this.waveData.length;
    for (let i = 0; i < this.waveData.length; i++) {
      const v = this.waveData[i] / 128.0 - 1;
      const y = H / 2 + v * H * 0.4;
      if (i === 0) ctx.moveTo(0, y); else ctx.lineTo(i * step, y);
    }
    ctx.stroke();
    ctx.restore();

    // Thin mirror line
    ctx.strokeStyle = 'rgba(232, 180, 77, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.stroke();
  }

  _idle() {
    const { W, H, ctx } = this;
    const t = performance.now() / 1000;
    const pulse = 0.5 + 0.5 * Math.sin(t * 0.7);

    ctx.save();
    ctx.strokeStyle = `rgba(232, 180, 77, ${0.1 + pulse * 0.1})`;
    ctx.shadowColor = `rgba(232, 180, 77, ${0.1 + pulse * 0.08})`;
    ctx.shadowBlur = 8;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let x = 0; x < W; x += 2) {
      const y = H / 2 + Math.sin(x * 0.015 + t * 1.2) * (3 + pulse * 3);
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }
}
