/* II. THE GARDEN OF LIGHT — mirrors, a prism, and flowers hungry for colour. */
(function () {
  'use strict';
  const BD = window.BD, TAU = BD.TAU, L = BD.Prism;
  BD.puzzles = BD.puzzles || {};

  BD.puzzles.prism = class {
    constructor(def, api) {
      this.def = def; this.api = api; this.lv = L.parse(def);
      const S = this.lv.sockets.length;
      this.st = new Array(S).fill(0); this.ang = new Array(S).fill(-Math.PI / 4); this.amt = new Array(S).fill(0);
      this.open = this.lv.flowers.map(() => 0); this.sat = this.lv.flowers.map(() => false);
      this.hist = []; this.hover = -1; this.solved = false; this.win = 0; this.flare = 0; this.progress = 0;
      this.stones = {};
      this.retrace(true);
    }
    layout(v) {
      const lv = this.lv;
      this.cs = Math.min(Math.min(v.w * 0.94, v.size * 1.55) / lv.w, v.size / lv.h);
      this.ox = v.cx - this.cs * lv.w / 2; this.oy = v.cy - this.cs * lv.h / 2;
    }
    px(x) { return this.ox + (x + 0.5) * this.cs; }
    py(y) { return this.oy + (y + 0.5) * this.cs; }
    retrace(quiet) {
      const tr = L.trace(this.lv, this.st); this.paths = tr.paths; this.recv = tr.recv;
      let c = 0;
      this.lv.flowers.forEach((f, i) => {
        const ok = tr.recv[i] === f.want; if (ok) c++;
        if (ok && !this.sat[i] && !quiet) {
          this.api.chime(3 + i * 2, 0.14, 3);
          this.api.burst(this.px(f.x), this.py(f.y), { n: 30, rgb: BD.MIX[f.want], speed: 190, life: 1.3, size: 2.4 });
        }
        this.sat[i] = ok;
      });
      this.progress = c / this.lv.flowers.length;
      if (c === this.lv.flowers.length && !this.solved && !quiet) { this.solved = true; this.api.win(); }
    }
    socketAt(x, y) {
      const gx = Math.floor((x - this.ox) / this.cs), gy = Math.floor((y - this.oy) / this.cs);
      if (gx < 0 || gy < 0 || gx >= this.lv.w || gy >= this.lv.h) return -1;
      const c = this.lv.cells[gy * this.lv.w + gx]; return c.t === 'socket' ? c.i : -1;
    }
    onDown(x, y, e) {
      if (this.solved) return;
      const i = this.socketAt(x, y); if (i < 0) return;
      this.hist.push(this.st.slice());
      this.st[i] = (this.st[i] + ((e.button === 2 || e.shiftKey) ? 2 : 1)) % 3;
      this.api.chime(this.st[i] === 0 ? 0 : this.st[i] + 1, 0.09); this.api.pulse(0.16); this.flare = 1;
      this.retrace();
    }
    onMove(x, y) { this.hover = this.socketAt(x, y); }
    onUp() { }
    onLeave() { this.hover = -1; }
    onKey() { return false; }
    undo() { const h = this.hist.pop(); if (!h || this.solved) return false; this.st = h; this.flare = 1; this.retrace(); return true; }
    reset() { if (this.solved) return; this.st.fill(0); this.hist = []; this.flare = 1; this.retrace(true); }
    update(dt) {
      for (let i = 0; i < this.st.length; i++) {
        this.amt[i] = BD.damp(this.amt[i], this.st[i] ? 1 : 0, 14, dt);
        if (this.st[i]) this.ang[i] = BD.damp(this.ang[i], this.st[i] === 2 ? Math.PI / 4 : -Math.PI / 4, 16, dt);
      }
      for (let i = 0; i < this.open.length; i++) this.open[i] = BD.damp(this.open[i], this.sat[i] ? 1 : 0, 3.2, dt);
      this.flare *= Math.exp(-5 * dt);
      if (this.solved) this.win += dt;
    }

    flower(ctx, x, y, size, rgb, open, t, wrong) {
      ctx.save();
      ctx.translate(x + (wrong ? Math.sin(t * 38) * 1.3 : 0), y);
      BD.orb(ctx, 0, 0, size * (0.9 + 1.3 * open), rgb, 0.16 + 0.5 * open);
      ctx.globalCompositeOperation = 'lighter';
      const petals = 6;
      for (let layer = 0; layer < 2; layer++) {
        const len = size * (0.34 + 0.62 * open) * (layer ? 0.66 : 1), half = size * (0.11 + 0.17 * open) * (layer ? 0.8 : 1);
        const off = layer * Math.PI / petals + t * 0.14 * open * (layer ? -1 : 1) + (1 - open) * 0.5;
        for (let j = 0; j < petals; j++) {
          ctx.save(); ctx.rotate(j * TAU / petals + off);
          const g = ctx.createLinearGradient(0, 0, len, 0);
          g.addColorStop(0, 'rgba(255,255,255,' + (0.08 + 0.7 * open) + ')');
          g.addColorStop(0.45, 'rgba(' + rgb + ',' + (0.12 + 0.5 * open) + ')');
          g.addColorStop(1, 'rgba(' + rgb + ',0.04)');
          ctx.fillStyle = g; ctx.beginPath(); BD.petal(ctx, len, half); ctx.fill();
          ctx.strokeStyle = 'rgba(' + rgb + ',' + (0.6 + 0.4 * open) + ')'; ctx.lineWidth = 1.2; ctx.stroke();
          ctx.restore();
        }
      }
      // a closed bud wears a dashed ring in the colour it is waiting for
      if (open < 0.97) {
        ctx.strokeStyle = 'rgba(' + rgb + ',' + 0.8 * (1 - open) + ')'; ctx.lineWidth = 1.6; ctx.setLineDash([3, 5]); ctx.lineDashOffset = -t * 6;
        ctx.beginPath(); ctx.arc(0, 0, size * 0.62, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.restore();
      BD.orb(ctx, x, y, size * 0.26, '255,255,255', 0.35 + 0.6 * open);
    }

    stone(ctx, x, y, cs, key) {
      let pts = this.stones[key];
      if (!pts) {
        const R = BD.rng(key * 977 + 13), n = 6 + Math.floor(R() * 2); pts = [];
        for (let i = 0; i < n; i++) { const a = i / n * TAU + R() * 0.5, r = 0.33 + R() * 0.1; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
        this.stones[key] = pts;
      }
      ctx.save(); ctx.translate(x, y);
      ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0] * cs, p[1] * cs) : ctx.moveTo(p[0] * cs, p[1] * cs)); ctx.closePath();
      ctx.fillStyle = 'rgba(7,6,22,0.86)'; ctx.fill();
      ctx.strokeStyle = 'rgba(175,150,255,0.5)'; ctx.lineWidth = 1.3; ctx.stroke();
      ctx.strokeStyle = 'rgba(175,150,255,0.16)'; ctx.lineWidth = 1;
      ctx.beginPath(); for (let i = 0; i < pts.length; i += 2) { ctx.moveTo(0, 0); ctx.lineTo(pts[i][0] * cs, pts[i][1] * cs); } ctx.stroke();
      ctx.restore();
    }

    draw(ctx, t) {
      const lv = this.lv, cs = this.cs, glow = Math.min(1, this.win);

      // the bed the garden grows in
      ctx.save();
      BD.roundRect(ctx, this.ox - 10, this.oy - 10, cs * lv.w + 20, cs * lv.h + 20, 22);
      ctx.fillStyle = 'rgba(3,6,14,0.34)'; ctx.fill();
      ctx.fillStyle = 'rgba(210,255,230,0.16)';
      for (let y = 0; y <= lv.h; y++) for (let x = 0; x <= lv.w; x++) ctx.fillRect(this.ox + x * cs - 1, this.oy + y * cs - 1, 2, 2);
      ctx.restore();

      // light
      for (let c = 0; c < 3; c++) for (const pts of this.paths[c]) {
        const build = k => pts.forEach((p, i) => i ? k.lineTo(this.px(p[0]), this.py(p[1])) : k.moveTo(this.px(p[0]), this.py(p[1])));
        BD.glowPath(ctx, BD.CHANNEL[c], cs * 0.05, 0.85 + 0.15 * this.flare, build, 0.1);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(' + BD.CHANNEL[c] + ',0.9)'; ctx.lineWidth = cs * 0.04;
        ctx.setLineDash([cs * 0.05, cs * 0.37]); ctx.lineDashOffset = -t * cs * 1.5 - c * cs * 0.14;
        ctx.beginPath(); build(ctx); ctx.stroke(); ctx.restore();
      }

      for (const c of lv.cells) {
        const x = this.px(c.x), y = this.py(c.y);
        if (c.t === 'stone') this.stone(ctx, x, y, cs, c.y * lv.w + c.x);
        else if (c.t === 'emit') {
          BD.orb(ctx, x, y, cs * 0.62, '255,255,255', 0.75);
          ctx.save(); ctx.translate(x, y); ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.2; ctx.rotate(t * 0.4);
          for (let j = 0; j < 12; j++) { ctx.rotate(TAU / 12); ctx.beginPath(); ctx.moveTo(cs * 0.2, 0); ctx.lineTo(cs * (j % 2 ? 0.3 : 0.37), 0); ctx.stroke(); }
          ctx.restore();
          ctx.save(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, cs * 0.13, 0, TAU); ctx.fill(); ctx.restore();
        }
        else if (c.t === 'prism') {
          BD.orb(ctx, x, y, cs * 0.6, '255,255,255', 0.22 + 0.1 * Math.sin(t * 2));
          const r = cs * 0.34, a = t * 0.3, P = [0, 1, 2].map(j => [x + Math.cos(a + j * TAU / 3) * r, y + Math.sin(a + j * TAU / 3) * r]);
          ctx.save(); ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]); ctx.lineTo(P[1][0], P[1][1]); ctx.lineTo(P[2][0], P[2][1]); ctx.closePath();
          ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fill(); ctx.restore();
          for (let j = 0; j < 3; j++) BD.glowLine(ctx, P[j][0], P[j][1], P[(j + 1) % 3][0], P[(j + 1) % 3][1], BD.CHANNEL[j], 1.8, 0.95, 0.5);
        }
        else if (c.t === 'filter') {
          const r = cs * 0.3, rgb = BD.MIX[c.mask];
          ctx.save(); ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath();
          ctx.fillStyle = 'rgba(' + rgb + ',0.3)'; ctx.fill(); ctx.strokeStyle = 'rgba(' + rgb + ',0.9)'; ctx.lineWidth = 1.4; ctx.stroke(); ctx.restore();
        }
        else if (c.t === 'mirror') {
          const a = c.m === 2 ? Math.PI / 4 : -Math.PI / 4, k = cs * 0.4;
          BD.glowLine(ctx, x - Math.cos(a) * k, y - Math.sin(a) * k, x + Math.cos(a) * k, y + Math.sin(a) * k, '150,175,230', 3, 0.85, 0.5);
        }
        else if (c.t === 'socket') {
          const hov = this.hover === c.i ? 1 : 0, amt = this.amt[c.i];
          ctx.save(); ctx.strokeStyle = 'rgba(225,240,255,' + (0.26 + 0.4 * hov) + ')'; ctx.lineWidth = 1.3;
          ctx.beginPath(); ctx.arc(x, y, cs * 0.33, 0, TAU); ctx.stroke();
          if (hov) { ctx.fillStyle = 'rgba(225,240,255,0.07)'; ctx.fill(); }
          ctx.fillStyle = 'rgba(225,240,255,' + 0.45 * (1 - amt) + ')'; ctx.beginPath(); ctx.arc(x, y, 1.8, 0, TAU); ctx.fill();
          ctx.restore();
          if (amt > 0.02) {
            const a = this.ang[c.i], k = cs * 0.41 * amt;
            BD.glowLine(ctx, x - Math.cos(a) * k, y - Math.sin(a) * k, x + Math.cos(a) * k, y + Math.sin(a) * k, '215,232,255', 3.2, amt, 0.85);
          }
        }
      }

      // flowers last, so they sit on top of the light they drink
      lv.flowers.forEach((f, i) => {
        const wrong = this.recv[i] !== 0 && !this.sat[i];
        if (wrong) BD.orb(ctx, this.px(f.x), this.py(f.y), cs * 0.5, BD.MIX[this.recv[i]], 0.25 + 0.15 * Math.sin(t * 14));
        this.flower(ctx, this.px(f.x), this.py(f.y), cs * (0.46 + 0.06 * glow * Math.sin(t * 3 + i)), BD.MIX[f.want], this.open[i], t + i * 1.7, wrong);
      });
    }
  };
})();
