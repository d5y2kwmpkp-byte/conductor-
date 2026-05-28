export class AudioEngine {
  constructor() {
    this.ctx       = null;
    this.master    = null;
    this.channels  = {};
    this.patterns  = {};
    this.playing   = false;
    this.bpm       = 90;
    this.swing     = 0.58;
    this.tick      = 0;
    this.nextTime  = 0;
    this.timerId   = null;
    this.onStep    = null;
  }

  boot() {
    if (this.ctx) return;
    try {
      this.ctx    = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.85;
      this.master.connect(this.ctx.destination);
    } catch (e) {
      console.warn("AudioContext failed:", e);
    }
  }

  wake() {
    if (this.ctx?.state === "suspended") this.ctx.resume();
  }

  getChannel(padId) {
    if (!this.ctx || this.channels[padId]) return this.channels[padId];
    const gain = this.ctx.createGain();
    gain.gain.value = 0.8;
    const hi  = this.ctx.createBiquadFilter(); hi.type  = "highshelf"; hi.frequency.value  = 8000;
    const mid = this.ctx.createBiquadFilter(); mid.type = "peaking";   mid.frequency.value = 1000;
    const lo  = this.ctx.createBiquadFilter(); lo.type  = "lowshelf";  lo.frequency.value  = 200;
    gain.connect(lo); lo.connect(mid); mid.connect(hi); hi.connect(this.master);
    this.channels[padId] = { gain, hi, mid, lo };
    return this.channels[padId];
  }

  setVol(padId, v)        { const c = this.channels[padId]; if (c) c.gain.gain.value = v; }
  setEQ(padId, band, v)   { const c = this.channels[padId]; if (c) c[band].gain.value = v * 14; }

  // ── SYNTH VOICES ──
  tone(roleId, padId, time) {
    if (!this.ctx) return;
    this.getChannel(padId);
    const dst = this.channels[padId]?.hi || this.master;
    const t   = time || this.ctx.currentTime;

    const env = (g, atk, sus, dec, vol) => {
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + atk);
      g.gain.setValueAtTime(vol * sus, t + atk + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + dec);
    };

    if (roleId === "drummer" || roleId === "percussion") {
      // Kick
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.frequency.setValueAtTime(85, t);
      o.frequency.exponentialRampToValueAtTime(0.01, t + 0.28);
      env(g, 0.002, 1, 0.28, 0.75);
      o.connect(g); g.connect(dst); o.start(t); o.stop(t + 0.32);
      // Snare noise
      const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.07, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const s = this.ctx.createBufferSource(), ng = this.ctx.createGain(), f = this.ctx.createBiquadFilter();
      f.type = "bandpass"; f.frequency.value = 1100; s.buffer = buf;
      ng.gain.setValueAtTime(0.3, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
      s.connect(f); f.connect(ng); ng.connect(dst); s.start(t); s.stop(t + 0.09);
    } else if (roleId === "bass") {
      const freqs = [55, 65, 73, 82];
      const freq  = freqs[Math.floor(Math.random() * freqs.length)];
      const o = this.ctx.createOscillator(), g = this.ctx.createGain(), f = this.ctx.createBiquadFilter();
      o.type = "sawtooth"; o.frequency.value = freq; f.type = "lowpass"; f.frequency.value = 360;
      env(g, 0.005, 0.6, 0.42, 0.55);
      o.connect(f); f.connect(g); g.connect(dst); o.start(t); o.stop(t + 0.46);
    } else if (["trumpet", "sax", "trombone", "flute", "harmonica"].includes(roleId)) {
      const fm = { trumpet: 523, sax: 349, trombone: 233, flute: 698, harmonica: 440 };
      const o = this.ctx.createOscillator(), g = this.ctx.createGain(), f = this.ctx.createBiquadFilter();
      o.type = "sawtooth";
      o.frequency.value = (fm[roleId] || 440) * (0.97 + Math.random() * 0.06);
      f.type = "bandpass"; f.frequency.value = (fm[roleId] || 440) * 2; f.Q.value = 1.5;
      env(g, 0.02, 0.85, 0.35, 0.38);
      o.connect(f); f.connect(g); g.connect(dst); o.start(t); o.stop(t + 0.4);
    } else if (["keys", "organ", "synth", "marimba", "harp", "accordion"].includes(roleId)) {
      const dec = roleId === "harp" ? 1.4 : roleId === "organ" ? 0.9 : 0.55;
      [261, 329, 392].forEach((freq, i) => {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = roleId === "organ" ? "square" : "sine"; o.frequency.value = freq;
        env(g, 0.01, 0.7, dec, 0.28 / (i + 1));
        o.connect(g); g.connect(dst); o.start(t); o.stop(t + dec + 0.1);
      });
    } else if (["violin", "cello"].includes(roleId)) {
      const base = roleId === "cello" ? 110 : 220;
      [base, base * 1.5].forEach((freq, i) => {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = "sawtooth"; o.frequency.value = freq;
        env(g, 0.05, 0.8, 0.52, 0.2 / (i + 1));
        o.connect(g); g.connect(dst); o.start(t); o.stop(t + 0.58);
      });
    } else {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.frequency.value = 440;
      env(g, 0.01, 0.7, 0.3, 0.28);
      o.connect(g); g.connect(dst); o.start(t); o.stop(t + 0.35);
    }
  }

  stepDur() { return (60 / this.bpm) / 4; }

  schedule() {
    if (!this.playing) return;
    const now = this.ctx?.currentTime || 0;
    while (this.nextTime < now + 0.12) {
      const step = this.tick % 16;
      const sw   = step % 2 === 1 ? this.stepDur() * (this.swing - 0.5) * 0.8 : 0;
      const t    = this.nextTime + sw;
      Object.entries(this.patterns).forEach(([padId, pat]) => {
        if (!pat.muted && pat.steps?.[step]) {
          this.tone(pat.roleId, padId, t);
        }
      });
      if (this.onStep) this.onStep(step);
      this.nextTime += this.stepDur();
      this.tick++;
    }
    this.timerId = setTimeout(() => this.schedule(), 25);
  }

  start() {
    this.boot(); this.wake();
    this.playing  = true;
    this.tick     = 0;
    this.nextTime = (this.ctx?.currentTime || 0) + 0.05;
    this.schedule();
  }

  stop() {
    this.playing = false;
    clearTimeout(this.timerId);
    if (this.onStep) this.onStep(-1);
  }

  // Record mic input and return tap timestamps
  async startMicRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr     = new MediaRecorder(stream);
      const chunks = [];
      mr.ondataavailable = e => chunks.push(e.data);
      mr.start();
      return { mr, stream, chunks };
    } catch (e) {
      console.warn("Mic access denied:", e);
      return null;
    }
  }

  stopMicRecording(session) {
    if (!session) return;
    session.mr.stop();
    session.stream.getTracks().forEach(t => t.stop());
  }

  // Convert tap timestamps to 16-step grid
  tapsToSteps(taps, bpm) {
    if (!taps.length) return new Array(16).fill(0);
    const stepMs = (60000 / bpm) / 4;
    const barMs  = stepMs * 16;
    const steps  = new Array(16).fill(0);
    taps.forEach(({ time }) => {
      const step = Math.round((time % barMs) / stepMs) % 16;
      steps[step] = 1;
    });
    return steps;
  }

  // Detect BPM from tap intervals
  detectBPM(taps) {
    if (taps.length < 3) return this.bpm;
    const intervals = [];
    for (let i = 1; i < taps.length; i++) {
      intervals.push(taps[i].time - taps[i - 1].time);
    }
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const detected = Math.round(60000 / avg);
    return Math.max(60, Math.min(220, detected));
  }
}

export const engine = new AudioEngine();
