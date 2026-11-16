/* THE BLOOMING DARK — generative sound. Everything is synthesised; there are no audio files. */
(function () {
  'use strict';
  const BD = window.BD = window.BD || {};

  // one tonal world per scene: drone root (Hz), drone chord and melodic scale (semitones)
  const WORLDS = [
    { root: 73.42, chord: [0, 7, 12, 15], scale: [0, 3, 5, 7, 10] },        // the dark — D minor pentatonic
    { root: 73.42, chord: [0, 7, 14, 17], scale: [0, 2, 3, 5, 7, 9, 10] },  // threshold — D dorian
    { root: 87.31, chord: [0, 7, 16, 23], scale: [0, 2, 4, 6, 7, 9, 11] },  // garden — F lydian
    { root: 61.74, chord: [0, 7, 13, 19], scale: [0, 1, 5, 7, 8] },         // mirrors — B, a dark pentatonic
    { root: 55.00, chord: [0, 12, 19, 26], scale: [0, 2, 7, 9, 14] },       // shoreless — hollow fifths on A
    { root: 98.00, chord: [0, 7, 16, 21], scale: [0, 2, 4, 7, 9] },         // thread — G major pentatonic
    { root: 73.42, chord: [0, 7, 16, 23], scale: [0, 2, 4, 7, 9, 11] }      // the sun — D major, wide open
  ];
  const st = n => Math.pow(2, n / 12);

  BD.Audio = class {
    constructor() { this.ctx = null; this.muted = false; this.world = WORLDS[0]; this.intensity = 0; this.voices = []; }

    start() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      let ctx; try { ctx = new AC(); } catch (e) { return; }
      this.ctx = ctx;
      const now = ctx.currentTime;

      this.master = ctx.createGain(); this.master.gain.value = 0.0001;
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 5; comp.attack.value = 0.01; comp.release.value = 0.4;
      this.master.connect(comp); comp.connect(ctx.destination);
      this.master.gain.setTargetAtTime(this.muted ? 0.0001 : 0.9, now, 1.2);

      // reverb: a generated impulse, long and dark
      const conv = ctx.createConvolver(); conv.buffer = this._impulse(4.5, 2.4);
      this.wet = ctx.createGain(); this.wet.gain.value = 0.6; this.wet.connect(conv); conv.connect(this.master);

      // echo
      const dl = ctx.createDelay(2); dl.delayTime.value = 0.44;
      const fb = ctx.createGain(); fb.gain.value = 0.40;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
      this.echo = ctx.createGain(); this.echo.gain.value = 0.45;
      this.echo.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(this.master); lp.connect(this.wet);

      // the drone: four voices, each a slightly detuned pair spread left and right
      this.droneFilter = ctx.createBiquadFilter(); this.droneFilter.type = 'lowpass'; this.droneFilter.frequency.value = 380; this.droneFilter.Q.value = 0.8;
      this.droneGain = ctx.createGain(); this.droneGain.gain.value = 0.0001;
      this.droneGain.gain.setTargetAtTime(0.85, now, 3.0);
      this.droneFilter.connect(this.droneGain); this.droneGain.connect(this.master);
      const dw = ctx.createGain(); dw.gain.value = 0.5; this.droneGain.connect(dw); dw.connect(this.wet);
      const lfo = ctx.createOscillator(), lfoG = ctx.createGain(); lfo.frequency.value = 0.045; lfoG.gain.value = 130;
      lfo.connect(lfoG); lfoG.connect(this.droneFilter.frequency); lfo.start();

      const levels = [0.22, 0.085, 0.060, 0.045];
      for (let i = 0; i < 4; i++) {
        const v = { osc: [], gain: ctx.createGain() };
        v.gain.gain.value = levels[i];
        const trem = ctx.createOscillator(), tg = ctx.createGain();   // slow swell, different for each voice
        trem.frequency.value = 0.05 + i * 0.027; tg.gain.value = levels[i] * 0.45; trem.connect(tg); tg.connect(v.gain.gain); trem.start();
        for (let s = 0; s < 2; s++) {
          const o = ctx.createOscillator(); o.type = i === 0 ? (s ? 'triangle' : 'sine') : 'sawtooth';
          const f = this.world.root * st(this.world.chord[i]) * (s ? 1.0022 : 0.9978);
          o.frequency.value = f; v.side = v.side || []; v.side.push(s ? 1.0022 : 0.9978);
          if (ctx.createStereoPanner) { const pn = ctx.createStereoPanner(); pn.pan.value = s ? 0.7 : -0.7; o.connect(pn); pn.connect(v.gain); }
          else o.connect(v.gain);
          o.start(); v.osc.push(o);
        }
        v.gain.connect(this.droneFilter); this.voices.push(v);
      }

      // noise for breaths and swells
      const nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), nd = nb.getChannelData(0);
      for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
      this.noise = nb;

      this._sparkle();
    }

    _impulse(dur, decay) {
      const ctx = this.ctx, len = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
      return buf;
    }

    setMuted(m) {
      this.muted = m;
      if (this.ctx) this.master.gain.setTargetAtTime(m ? 0.0001 : 0.9, this.ctx.currentTime, 0.25);
    }

    setScene(i) {
      this.world = WORLDS[i] || WORLDS[0];
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      this.voices.forEach((v, k) => v.osc.forEach((o, s) =>
        o.frequency.setTargetAtTime(this.world.root * st(this.world.chord[k]) * v.side[s], now, 1.4)));
    }

    // 0..1 — the drone opens as a puzzle nears its answer
    setIntensity(x) {
      if (Math.abs(x - this.intensity) < 0.01) return;
      this.intensity = x;
      if (this.ctx) this.droneFilter.frequency.setTargetAtTime(360 + 1050 * x * x, this.ctx.currentTime, 0.8);
    }

    freq(degree, octave) {
      const sc = this.world.scale, n = sc.length, d = ((degree % n) + n) % n, o = Math.floor(degree / n);
      return this.world.root * st(sc[d] + 12 * (o + (octave == null ? 2 : octave)));
    }

    _out(node, pan, dry, echo, wet) {
      const ctx = this.ctx; let last = node;
      if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; node.connect(p); last = p; }
      const d = ctx.createGain(); d.gain.value = dry; last.connect(d); d.connect(this.master);
      if (echo) { const e = ctx.createGain(); e.gain.value = echo; last.connect(e); e.connect(this.echo); }
      if (wet) { const w = ctx.createGain(); w.gain.value = wet; last.connect(w); w.connect(this.wet); }
    }

    bell(freq, vel, dur, pan) {
      if (!this.ctx) return;
      const ctx = this.ctx, t = ctx.currentTime; vel = vel || 0.15; dur = dur || 2.4;
      const car = ctx.createOscillator(), mod = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain();
      car.frequency.value = freq; mod.frequency.value = freq * 3.007;
      mg.gain.setValueAtTime(freq * 1.4, t); mg.gain.exponentialRampToValueAtTime(freq * 0.02, t + dur * 0.55);
      mod.connect(mg); mg.connect(car.frequency);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      car.connect(g); this._out(g, pan || 0, 0.8, 0.5, 0.7);
      car.start(t); mod.start(t); car.stop(t + dur + 0.1); mod.stop(t + dur + 0.1);
    }

    // a breath of pad — used for Iris's voice
    sigh(freq, vel, dur) {
      if (!this.ctx) return;
      const ctx = this.ctx, t = ctx.currentTime; vel = vel || 0.08; dur = dur || 2.6;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vel, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq * 3;
      for (const d of [0.996, 1.004, 2.001]) { const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = freq * d; o.connect(f); o.start(t); o.stop(t + dur + 0.1); }
      f.connect(g); this._out(g, 0, 0.5, 0.3, 0.9);
    }

    chime(degree, vel, octave) { this.bell(this.freq(degree, octave), vel || 0.13, 2.2, (Math.random() - 0.5) * 0.8); }
    tick() { if (this.ctx) this.bell(this.freq(4, 4), 0.035, 0.25, 0); }

    thud() {
      if (!this.ctx) return;
      const ctx = this.ctx, t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.16);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
      o.connect(g); this._out(g, 0, 1, 0, 0.25); o.start(t); o.stop(t + 0.3);
    }

    whoosh(dur, vel) {
      if (!this.ctx) return;
      const ctx = this.ctx, t = ctx.currentTime; dur = dur || 1.6;
      const src = ctx.createBufferSource(); src.buffer = this.noise; src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.4;
      f.frequency.setValueAtTime(220, t); f.frequency.exponentialRampToValueAtTime(3200, t + dur * 0.7); f.frequency.exponentialRampToValueAtTime(600, t + dur);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel || 0.12, t + dur * 0.55); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f); f.connect(g); this._out(g, 0, 0.7, 0.2, 0.8); src.start(t); src.stop(t + dur + 0.1);
    }

    // a puzzle opens
    solve() {
      if (!this.ctx) return;
      this.whoosh(2.2, 0.10);
      [0, 2, 4, 5, 7, 9, 12].forEach((d, i) => setTimeout(() => this.bell(this.freq(d, 2), 0.13, 3.2, (i % 2 ? 0.5 : -0.5)), i * 95));
      setTimeout(() => this.sigh(this.freq(0, 1), 0.10, 4.5), 250);
    }
    // a chapter closes
    bloom() {
      if (!this.ctx) return;
      this.whoosh(3.5, 0.14);
      [0, 2, 4].forEach((d, i) => { this.sigh(this.freq(d, 1), 0.09, 6); setTimeout(() => this.bell(this.freq(d + 5, 2), 0.10, 4.5, i - 1), 300 + i * 260); });
    }

    // stray notes drifting through the room; more of them as the puzzle comes together
    _sparkle() {
      const wait = 2200 + Math.random() * 4200 * (1 - 0.6 * this.intensity);
      setTimeout(() => {
        if (this.ctx && !this.muted && this.ctx.state === 'running' && !document.hidden) {
          const deg = Math.floor(Math.random() * 10);
          this.bell(this.freq(deg, 2 + (Math.random() < 0.3 ? 1 : 0)), 0.022 + Math.random() * 0.03, 3.5, Math.random() * 1.6 - 0.8);
        }
        this._sparkle();
      }, wait);
    }
  };
})();
