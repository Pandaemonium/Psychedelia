/* I. THE THRESHOLD, and VI. THE MORNING — a lock of turning rings: an iris, and then the sun. */
(function () {
  'use strict';
  const BD = window.BD, TAU = BD.TAU, L = BD.Rings;
  BD.puzzles = BD.puzzles || {};

  BD.puzzles.rings = class {
    constructor(def, api) {
      this.def = def; this.api = api; this.k = def.rings; this.n = def.n;
      this.rot = L.init(def); this.disp = this.rot.slice();
      this.flash = new Array(this.k).fill(0);
      this.links = [];
      for (const i in (def.links || {})) for (const [j, s] of def.links[i]) this.links.push({ i: +i, j, s });
      this.hover = -1; this.hist = []; this.solved = false; this.win = 0; this.beam = 0;
      this.progress = L.count(def, this.rot) / this.k;
    }
    layout(v) {
      this.cx = v.cx; this.cy = v.cy + v.size * 0.035; this.R = v.size * 0.455;
      this.r0 = this.R * 0.2; this.band = (this.R - this.r0) / this.k;
    }
    radius(i) { return this.r0 + this.band * (i + 0.5); }
    hue(i) { const d = this.def; return (d.hue0 == null ? 192 : d.hue0) + i * ((d.hueSpan == null ? 168 : d.hueSpan) / Math.max(1, this.k - 1)); }
    ringAt(x, y) {
      const d = Math.hypot(x - this.cx, y - this.cy), i = Math.floor((d - this.r0) / this.band);
      return i >= 0 && i < this.k ? i : -1;
    }
    turn(i, dir, quiet) {
      const before = L.aligned(this.def, this.rot, i);
      L.turn(this.def, this.rot, i, dir);
      for (const [j] of L.affected(this.def, i)) this.flash[j] = 1;
      if (!quiet) this.hist.push([i, dir]);
      this.progress = L.count(this.def, this.rot) / this.k;
      this.api.chime(i * 2 + (dir > 0 ? 0 : 1), 0.11); this.api.pulse(0.2);
      if (!before && L.aligned(this.def, this.rot, i)) this.api.chime(i + 7, 0.07, 3);
      if (L.solved(this.def, this.rot) && !this.solved) { this.solved = true; this.api.win(); }
    }
    undo() { const h = this.hist.pop(); if (!h || this.solved) return false; this.turn(h[0], -h[1], true); return true; }
    reset() { if (this.solved) return; this.rot = L.init(this.def); this.hist = []; this.flash.fill(1); this.progress = L.count(this.def, this.rot) / this.k; }
    onDown(x, y, e) {
      if (this.solved) return;
      const i = this.ringAt(x, y); if (i < 0) return;
      this.turn(i, (e.button === 2 || e.shiftKey) ? -1 : 1);
    }
    onMove(x, y) { this.hover = this.ringAt(x, y); }
    onUp() { }
    onLeave() { this.hover = -1; }
    onKey() { return false; }
    update(dt) {
      for (let i = 0; i < this.k; i++) { this.disp[i] = BD.damp(this.disp[i], this.rot[i], 13, dt); this.flash[i] *= Math.exp(-3.2 * dt); }
      if (this.solved) this.win += dt;
      // how far the light reaches: through every consecutive open gate, from the centre outward
      let reach = 0;
      while (reach < this.k && L.aligned(this.def, this.rot, reach) && Math.abs(this.disp[reach] - this.rot[reach]) < 0.06) reach++;
      this.beam = BD.damp(this.beam, reach, 9, dt);
    }

    draw(ctx, t) {
      const { cx, cy, k, n, band } = this, step = TAU / n, top = -Math.PI / 2;
      const w = band * 0.62, winGlow = Math.min(1, this.win * 0.9);
      const moving = this.hover >= 0 && !this.solved ? L.affected(this.def, this.hover) : [];
      const dirOf = j => { for (const [a, s] of moving) if (a === j) return s; return 0; };

      // the seed of light at the centre
      const breathe = 1 + 0.08 * Math.sin(t * 1.5);
      BD.orb(ctx, cx, cy, this.r0 * 2.1 * breathe, BD.GOLD, 0.5 + 0.3 * winGlow);
      BD.orb(ctx, cx, cy, this.r0 * 0.6, '255,255,255', 0.95);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.18); ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(255,232,190,0.55)'; ctx.lineWidth = 1;
      for (let j = 0; j < n; j++) { ctx.rotate(step); ctx.beginPath(); BD.petal(ctx, this.r0 * 0.9, this.r0 * 0.2); ctx.stroke(); }
      ctx.restore();

      for (let i = 0; i < k; i++) {
        const r = this.radius(i), f = this.flash[i], lit = dirOf(i) !== 0 ? 1 : 0;
        const home = L.aligned(this.def, this.rot, i) && Math.abs(this.disp[i] - this.rot[i]) < 0.06;
        const rgb = BD.hsl(this.hue(i), 96, 62 + 12 * f + (home ? 8 : 0));
        const a0 = top + this.disp[i] * step;

        // the band's edges
        ctx.save();
        ctx.strokeStyle = 'rgba(' + rgb + ',' + (0.13 + 0.16 * lit + 0.2 * winGlow) + ')'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, r - w / 2, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, r + w / 2, 0, TAU); ctx.stroke();
        // segments: every position but the gate
        ctx.lineCap = 'butt'; ctx.lineWidth = w * 0.8;
        ctx.strokeStyle = 'rgba(' + rgb + ',' + (0.13 + 0.10 * (home ? 1 : 0) + 0.22 * f + 0.10 * lit + 0.15 * winGlow) + ')';
        for (let s = 1; s < n; s++) { const a = a0 + s * step; ctx.beginPath(); ctx.arc(cx, cy, r, a - step * 0.37, a + step * 0.37); ctx.stroke(); }
        ctx.restore();
        for (let s = 1; s < n; s++) {
          const a = a0 + s * step;
          BD.glowArc(ctx, cx, cy, r, a - step * 0.3, a + step * 0.3, rgb, 1.7, 0.5 + 0.3 * (home ? 1 : 0) + 0.45 * f + 0.25 * lit, 0.25);
        }

        // the gate: two posts and a jewel
        const gate = home ? BD.GOLD : rgb;
        for (const sgn of [-1, 1]) {
          const a = a0 + sgn * step * 0.37, c = Math.cos(a), s2 = Math.sin(a);
          BD.glowLine(ctx, cx + c * (r - w / 2), cy + s2 * (r - w / 2), cx + c * (r + w / 2), cy + s2 * (r + w / 2), gate, 2.2, 0.95, 0.6);
        }
        const gx = cx + Math.cos(a0) * r, gy = cy + Math.sin(a0) * r;
        BD.orb(ctx, gx, gy, w * (0.75 + 0.35 * f), gate, home ? 0.95 : 0.6);
        BD.orb(ctx, gx, gy, w * 0.2, '255,255,255', 0.9);

        // which way this ring will be carried, if the ring under the pointer turns
        const d = dirOf(i);
        if (d) {
          const flow = ((t * 0.55) % 1) * step * d;
          for (let s = 0; s < n; s++) {
            const a = a0 + (s + 0.5) * step + flow, tip = a + d * 0.07, tail = a - d * 0.035;
            BD.glowPath(ctx, '255,255,255', 1.6, 0.8, c => {
              c.moveTo(cx + Math.cos(tail) * (r - w * 0.24), cy + Math.sin(tail) * (r - w * 0.24));
              c.lineTo(cx + Math.cos(tip) * r, cy + Math.sin(tip) * r);
              c.lineTo(cx + Math.cos(tail) * (r + w * 0.24), cy + Math.sin(tail) * (r + w * 0.24));
            }, 0.4);
          }
        }
      }

      // tethers: which ring drags which, and which way (gold = together, blue = against)
      const Ln = this.links.length;
      this.links.forEach((lk, li) => {
        const phi = Math.PI / 2 + (li - (Ln - 1) / 2) * (1.9 / Math.max(3, Ln)), c = Math.cos(phi), s = Math.sin(phi);
        const ri = this.radius(lk.i), rj = this.radius(lk.j), col = lk.s > 0 ? BD.GOLD : '110,215,255';
        const on = this.hover === lk.i ? 1 : 0.42;
        BD.glowLine(ctx, cx + c * ri, cy + s * ri, cx + c * rj, cy + s * rj, col, 1.3, on, 0.2);
        BD.orb(ctx, cx + c * ri, cy + s * ri, 9, col, on);
        // arrowhead on the dragged ring, along its direction of travel
        const px = cx + c * rj, py = cy + s * rj, tx = -s * lk.s, ty = c * lk.s;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(' + col + ',' + on + ')';
        ctx.beginPath(); ctx.moveTo(px + tx * 10, py + ty * 10); ctx.lineTo(px - tx * 5 + c * 6, py - ty * 5 + s * 6); ctx.lineTo(px - tx * 5 - c * 6, py - ty * 5 - s * 6); ctx.closePath(); ctx.fill();
        ctx.restore();
      });

      // the channel the gates must line up along
      ctx.save(); ctx.strokeStyle = 'rgba(255,236,200,0.2)'; ctx.lineWidth = 1; ctx.setLineDash([2, 7]); ctx.lineDashOffset = t * 9;
      ctx.beginPath(); ctx.moveTo(cx, cy - this.r0); ctx.lineTo(cx, cy - this.R - 18); ctx.stroke(); ctx.restore();

      // the light, climbing through the open gates
      const reachR = this.r0 + band * this.beam + (this.beam > k - 0.02 ? 60 * Math.min(1, this.beam - (k - 1)) : 0);
      const by = cy - reachR;
      BD.glowLine(ctx, cx, cy - this.r0 * 0.5, cx, by, '255,240,205', 3 + 3 * winGlow, 0.95, 0.9);
      if (!this.solved) BD.orb(ctx, cx, by, 12 + 5 * Math.sin(t * 9), '255,240,205', 0.8);

      // the sigil waiting above
      const sy = cy - this.R - 34, lit = this.solved ? 1 : 0.3 + 0.08 * Math.sin(t * 2);
      BD.orb(ctx, cx, sy, 16 + 40 * winGlow, BD.GOLD, lit * 0.9);
      ctx.save(); ctx.translate(cx, sy); ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(' + BD.GOLD + ',' + lit + ')'; ctx.lineWidth = 1.4;
      for (let j = -1; j <= 1; j++) { ctx.save(); ctx.rotate(-Math.PI / 2 + j * 0.62); ctx.beginPath(); BD.petal(ctx, 17, 5); ctx.stroke(); ctx.restore(); }
      ctx.beginPath(); ctx.arc(0, 0, 3, 0, TAU); ctx.stroke();
      ctx.restore();

      if (this.solved) BD.orb(ctx, cx, cy, this.R * (0.5 + this.win * 0.7), BD.GOLD, 0.3 * Math.max(0, 1 - this.win * 0.45));
    }
  };
})();
