/* IV. THE SHORELESS — a self in pieces, on a surface with no edge. */
(function () {
  'use strict';
  const BD = window.BD, TAU = BD.TAU, L = BD.Void;
  BD.puzzles = BD.puzzles || {};

  /* Paint a mandala with an eye at its heart. Hue follows the angle around the centre, so every tile is its own. */
  BD.voidArt = function (kind, S) {
    const cv = document.createElement('canvas'); cv.width = cv.height = S;
    const x = cv.getContext('2d'), m = S / 2, R = BD.rng(1234 + kind * 77), u = S / 600, shift = kind * 55;
    let g = x.createRadialGradient(m, m, 0, m, m, S * 0.75);
    g.addColorStop(0, '#1d0b40'); g.addColorStop(0.6, '#0b0524'); g.addColorStop(1, '#03020a');
    x.fillStyle = g; x.fillRect(0, 0, S, S);
    for (let i = 0; i < 120; i++) {
      const a = i / 120 * TAU;
      x.fillStyle = 'hsla(' + (i * 3 + shift) + ',95%,55%,0.17)';
      x.beginPath(); x.moveTo(m, m); x.arc(m, m, S, a, a + TAU / 120 + 0.01); x.closePath(); x.fill();
    }
    for (let i = 0; i < 170; i++) {
      x.fillStyle = 'rgba(255,255,255,' + (0.2 + R() * 0.7) + ')';
      x.beginPath(); x.arc(R() * S, R() * S, (0.4 + R() * 1.5) * u, 0, TAU); x.fill();
    }
    // corner marks: one, two, three, four pearls
    [[0.07, 0.07], [0.93, 0.07], [0.93, 0.93], [0.07, 0.93]].forEach((c, ci) => {
      for (let j = 0; j <= ci; j++) {
        const a = j / (ci + 1) * TAU + ci, r = ci ? 0.028 : 0;
        x.fillStyle = 'hsla(' + (ci * 90 + shift + 40) + ',90%,75%,0.9)';
        x.beginPath(); x.arc((c[0] + Math.cos(a) * r) * S, (c[1] + Math.sin(a) * r) * S, 5 * u, 0, TAU); x.fill();
      }
    });
    const layers = [
      [{ m: 8, r0: 0.25, r1: 0.485, half: 0.085, off: 0 }, { m: 8, r0: 0.21, r1: 0.39, half: 0.07, off: 0.5 }],
      [{ m: 12, r0: 0.33, r1: 0.49, half: 0.055, off: 0 }, { m: 12, r0: 0.25, r1: 0.41, half: 0.055, off: 0.5 }, { m: 6, r0: 0.13, r1: 0.30, half: 0.07, off: 0 }],
      [{ m: 16, r0: 0.36, r1: 0.495, half: 0.042, off: 0 }, { m: 16, r0: 0.29, r1: 0.43, half: 0.042, off: 0.5 }, { m: 8, r0: 0.19, r1: 0.34, half: 0.062, off: 0 }, { m: 8, r0: 0.14, r1: 0.27, half: 0.05, off: 0.5 }]
    ][kind];
    layers.forEach((ly, li) => {
      for (let j = 0; j < ly.m; j++) {
        const a = (j + ly.off) / ly.m * TAU - Math.PI / 2, h = a * 180 / Math.PI + li * 34 + shift, len = (ly.r1 - ly.r0) * S;
        x.save(); x.translate(m, m); x.rotate(a); x.translate(ly.r0 * S, 0);
        const pg = x.createLinearGradient(0, 0, len, 0);
        pg.addColorStop(0, 'hsla(' + (h + 50) + ',95%,40%,0.25)'); pg.addColorStop(0.55, 'hsla(' + h + ',95%,58%,0.85)'); pg.addColorStop(1, 'hsla(' + (h - 30) + ',100%,78%,0.95)');
        x.fillStyle = pg; x.beginPath(); BD.petal(x, len, ly.half * S); x.fill();
        x.strokeStyle = 'rgba(255,255,255,0.6)'; x.lineWidth = 1.3 * u; x.stroke();
        x.strokeStyle = 'rgba(255,255,255,0.25)'; x.beginPath(); x.moveTo(len * 0.1, 0); x.lineTo(len * 0.85, 0); x.stroke();
        x.restore();
      }
    });
    // beads
    const br = [0.2, 0.245, 0.185][kind], nb = [32, 48, 40][kind];
    for (let j = 0; j < nb; j++) {
      const a = j / nb * TAU;
      x.fillStyle = 'hsla(' + (a * 180 / Math.PI + 180 + shift) + ',100%,78%,0.95)';
      x.beginPath(); x.arc(m + Math.cos(a) * br * S, m + Math.sin(a) * br * S, 2.6 * u, 0, TAU); x.fill();
    }
    // the eye
    const ir = [0.165, 0.105, 0.115][kind] * S;
    if (kind !== 1) {
      x.save(); x.translate(m, m); x.strokeStyle = 'rgba(255,255,255,0.85)'; x.lineWidth = 2 * u; x.fillStyle = 'rgba(8,4,26,0.8)';
      const ew = ir * 1.75, eh = ir * 1.15;
      x.beginPath(); x.moveTo(-ew, 0); x.quadraticCurveTo(0, -eh * 1.7, ew, 0); x.quadraticCurveTo(0, eh * 1.7, -ew, 0); x.fill(); x.stroke(); x.restore();
    }
    g = x.createRadialGradient(m, m, ir * 0.3, m, m, ir);
    g.addColorStop(0, '#fff3c4'); g.addColorStop(0.35, 'hsl(' + (40 + shift) + ',95%,58%)'); g.addColorStop(0.8, 'hsl(' + (190 + shift) + ',90%,45%)'); g.addColorStop(1, '#0a0420');
    x.fillStyle = g; x.beginPath(); x.arc(m, m, ir, 0, TAU); x.fill();
    for (let i = 0; i < 150; i++) {
      const a = i / 150 * TAU + R() * 0.03, r1 = ir * (0.7 + R() * 0.28);
      x.strokeStyle = 'hsla(' + (a * 180 / Math.PI + shift) + ',100%,' + (60 + R() * 25) + '%,0.6)'; x.lineWidth = 1 * u;
      x.beginPath(); x.moveTo(m + Math.cos(a) * ir * 0.4, m + Math.sin(a) * ir * 0.4); x.lineTo(m + Math.cos(a) * r1, m + Math.sin(a) * r1); x.stroke();
    }
    x.fillStyle = '#02010a'; x.beginPath(); x.arc(m, m, ir * 0.4, 0, TAU); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.92)'; x.beginPath(); x.arc(m - ir * 0.14, m - ir * 0.15, ir * 0.09, 0, TAU); x.fill();
    return cv;
  };

  BD.puzzles.void = class {
    constructor(def, api) {
      this.def = def; this.api = api; this.n = def.n;
      this.grid = L.init(def); this.start = L.count(this.grid);
      this.hist = []; this.drag = null; this.snap = null; this.solved = false; this.win = 0; this.join = 0;
      this.art = null; this.artPx = 0; this.score();
    }
    layout(v) {
      this.size = v.size * 0.9; this.cs = this.size / this.n;
      this.ox = v.cx - this.size / 2; this.oy = v.cy - this.size / 2;
      const px = Math.min(1400, Math.round(this.size * Math.min(window.devicePixelRatio || 1, 2) / this.n) * this.n);
      if (px !== this.artPx) { this.art = BD.voidArt(this.def.art || 0, px); this.artPx = px; }
      // the memory of wholeness: beside the board if there is room, otherwise above it
      const pv = Math.max(64, Math.min(132, this.size * 0.24));
      this.pv = (v.w - (this.ox + this.size) > pv + 34) ? { x: this.ox + this.size + 24, y: this.oy, s: pv }
        : { x: this.ox + this.size - Math.min(pv, 72), y: this.oy - Math.min(pv, 72) - 12, s: Math.min(pv, 72) };
    }
    score() { const total = this.n * this.n; this.progress = Math.max(0, (L.count(this.grid) - this.start) / (total - this.start)); }
    inside(x, y) { return x >= this.ox && y >= this.oy && x < this.ox + this.size && y < this.oy + this.size; }
    onDown(x, y) {
      if (this.solved || !this.inside(x, y)) return;
      this.snap = null;
      this.drag = { r: Math.floor((y - this.oy) / this.cs), c: Math.floor((x - this.ox) / this.cs), x0: x, y0: y, axis: null, off: 0, steps: 0 };
    }
    onMove(x, y) {
      const d = this.drag; if (!d) return;
      const dx = x - d.x0, dy = y - d.y0;
      if (!d.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 9) d.axis = Math.abs(dx) > Math.abs(dy) ? 'r' : 'c';
      if (d.axis) {
        d.off = d.axis === 'r' ? dx : dy;
        const st = Math.round(d.off / this.cs);
        if (st !== d.steps) { d.steps = st; this.api.tick(); }
      }
    }
    onUp() {
      const d = this.drag; if (!d) return; this.drag = null;
      if (!d.axis) return;
      const k = Math.round(d.off / this.cs), idx = d.axis === 'r' ? d.r : d.c;
      this.snap = { axis: d.axis, idx, off: d.off - k * this.cs };
      if (((k % this.n) + this.n) % this.n !== 0) {
        this.hist.push(this.grid.slice());
        L.shift(this.grid, this.n, d.axis, idx, k);
        this.api.chime(idx + (d.axis === 'r' ? 0 : 3), 0.11); this.api.pulse(0.2); this.score();
        if (L.solved(this.grid)) { this.solved = true; this.api.win(); }
      }
    }
    onLeave() { this.onUp(); }
    onKey() { return false; }
    undo() { const h = this.hist.pop(); if (!h || this.solved) return false; this.grid = h; this.snap = null; this.score(); return true; }
    reset() { if (this.solved) return; this.grid = L.init(this.def); this.hist = []; this.snap = null; this.score(); }
    update(dt) {
      if (this.snap) { this.snap.off = BD.damp(this.snap.off, 0, 20, dt); if (Math.abs(this.snap.off) < 0.4) this.snap = null; }
      this.join = BD.damp(this.join, this.solved ? 1 : 0, 2.2, dt);
      if (this.solved) this.win += dt;
    }

    draw(ctx, t) {
      const n = this.n, cs = this.cs, size = this.size, join = this.join, ts = this.artPx / n;
      const mv = this.drag && this.drag.axis ? { axis: this.drag.axis, idx: this.drag.axis === 'r' ? this.drag.r : this.drag.c, off: this.drag.off } : this.snap;
      const gap = 3.2 * (1 - join), wrap = v => ((v % size) + size) % size;

      ctx.save();
      BD.roundRect(ctx, this.ox - 12, this.oy - 12, size + 24, size + 24, 18);
      ctx.fillStyle = 'rgba(2,1,8,0.55)'; ctx.fill();
      BD.roundRect(ctx, this.ox, this.oy, size, size, 8 * (1 - join) + 2); ctx.clip();
      // once whole, it is drawn whole: no seams
      if (this.solved && join > 0.97) ctx.drawImage(this.art, this.ox, this.oy, size, size);
      else
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        const id = this.grid[r * n + c], sr = Math.floor(id / n), sc = id % n;
        let bx = c * cs, by = r * cs;
        if (mv && mv.axis === 'r' && mv.idx === r) bx += mv.off;
        if (mv && mv.axis === 'c' && mv.idx === c) by += mv.off;
        bx = wrap(bx); by = wrap(by);
        const fx = Math.sin(t * 0.8 + id * 1.7) * 1.4 * (1 - join), fy = Math.cos(t * 0.65 + id * 2.3) * 1.4 * (1 - join);
        const home = id === r * n + c && !mv;
        // a tile sliding off one edge is drawn again arriving at the other
        const xs = bx + cs > size + 0.5 ? [bx, bx - size] : [bx], ys = by + cs > size + 0.5 ? [by, by - size] : [by];
        for (const X of xs) for (const Y of ys) {
          const dx = this.ox + X + gap / 2 + fx, dy = this.oy + Y + gap / 2 + fy, w = cs - gap;
          ctx.globalAlpha = 0.82 + 0.18 * join + (home ? 0.1 : 0);
          ctx.drawImage(this.art, sc * ts, sr * ts, ts, ts, dx, dy, w, w);
          ctx.globalAlpha = 1;
          if (join < 0.98) {
            ctx.strokeStyle = home ? 'rgba(' + BD.GOLD + ',' + 0.55 * (1 - join) + ')' : 'rgba(215,205,255,' + 0.22 * (1 - join) + ')';
            ctx.lineWidth = 1; ctx.strokeRect(dx + 0.5, dy + 0.5, w - 1, w - 1);
          }
        }
      }
      ctx.restore();

      const rim = this.solved ? BD.GOLD : BD.hsl(275 + 30 * Math.sin(t * 0.4), 85, 70);
      BD.glowPath(ctx, rim, 1.4 + 2 * join, 0.55 + 0.45 * join, c => BD.roundRect(c, this.ox - 3, this.oy - 3, size + 6, size + 6, 10), 0.2);

      // the row or column in your hand
      if (this.drag && this.drag.axis) {
        const d = this.drag;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,255,255,0.07)';
        if (d.axis === 'r') ctx.fillRect(this.ox, this.oy + d.r * cs, size, cs); else ctx.fillRect(this.ox + d.c * cs, this.oy, cs, size);
        ctx.restore();
      }

      // what you were
      if (this.pv && join < 0.99) {
        const p = this.pv;
        ctx.save(); ctx.globalAlpha = 0.9 * (1 - join);
        ctx.drawImage(this.art, p.x, p.y, p.s, p.s);
        ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1; ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.s - 1, p.s - 1);
        ctx.restore();
      }
      if (this.solved) BD.orb(ctx, this.ox + size / 2, this.oy + size / 2, size * (0.3 + this.win * 0.5), '255,240,220', 0.35 * Math.max(0, 1 - this.win * 0.5));
    }
  };
})();
