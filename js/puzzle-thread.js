/* V. THE THREAD — the whole figure, in one unbroken line. */
(function () {
  'use strict';
  const BD = window.BD, TAU = BD.TAU, L = BD.Thread;
  BD.puzzles = BD.puzzles || {};

  BD.puzzles.thread = class {
    constructor(def, api) {
      this.def = def; this.api = api; this.lv = L.parse(def);
      this.st = null; this.p = new Array(this.lv.edges.length).fill(0);
      this.hover = -1; this.down = false; this.lastTried = -1;
      this.solved = false; this.win = 0; this.stuck = false; this.progress = 0;
    }
    layout(v) {
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (const n of this.lv.nodes) { x0 = Math.min(x0, n.x); x1 = Math.max(x1, n.x); y0 = Math.min(y0, n.y); y1 = Math.max(y1, n.y); }
      this.sc = Math.min(v.size * 0.84 / (x1 - x0), v.size * 0.84 / (y1 - y0));
      this.cx = v.cx - (x0 + x1) / 2 * this.sc; this.cy = v.cy - (y0 + y1) / 2 * this.sc;
      this.hit = Math.max(24, this.sc * 0.13); this.axisY = [v.cy - (y1 - y0) / 2 * this.sc - 26, v.cy + (y1 - y0) / 2 * this.sc + 26];
    }
    pos(i) { const n = this.lv.nodes[i]; return [this.cx + n.x * this.sc, this.cy + n.y * this.sc]; }
    nodeAt(x, y) {
      let best = -1, bd = this.hit;
      for (let i = 0; i < this.lv.nodes.length; i++) { const [px, py] = this.pos(i), d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; best = i; } }
      return best;
    }
    colour() { return this.st && this.st.color ? BD.MIX[this.st.color] : BD.GOLD; }
    tryNode(i, soft) {
      if (this.solved || i < 0) return;
      const lv = this.lv;
      if (!this.st) {
        this.st = L.start(lv, i); this.stuck = false;
        this.api.chime(0, 0.12); this.api.pulse(0.15);
        const [x, y] = this.pos(i); this.api.burst(x, y, { n: 14, rgb: this.colour(), speed: 110 });
        return;
      }
      if (i === this.st.at) return;
      const e = L.edgeTo(lv, this.st, i);
      if (e >= 0) {
        L.move(lv, this.st, e); this.p[e] = 0; if (lv.mirror) this.p[lv.esig[e]] = 0;
        this.progress = this.st.n / lv.edges.length;
        this.api.chime(this.st.hist.length, 0.11); this.api.pulse(0.13);
        const [x, y] = this.pos(i); this.api.burst(x, y, { n: 10, rgb: this.colour(), speed: 90 });
        if (L.solved(lv, this.st)) { this.solved = true; this.api.win(); }
        else if (!L.moves(lv, this.st).length) { this.stuck = true; this.api.thud(); this.api.say('The thread has nowhere left to go. Step back (Z) or begin again (R).'); }
        return;
      }
      // touching the lantern you just came from takes the last line back
      const last = this.st.hist[this.st.hist.length - 1];
      if (!soft && last && last.from === i) { this.undo(); return; }
      if (!soft) this.api.thud();
    }
    onDown(x, y) { this.down = true; const i = this.nodeAt(x, y); this.lastTried = i; this.tryNode(i, false); }
    onMove(x, y) {
      this.hover = this.nodeAt(x, y);
      if (this.down && this.hover >= 0 && this.hover !== this.lastTried) { this.lastTried = this.hover; this.tryNode(this.hover, true); }
    }
    onUp() { this.down = false; this.lastTried = -1; }
    onLeave() { this.hover = -1; this.onUp(); }
    onKey() { return false; }
    undo() {
      if (!this.st || this.solved) return false;
      if (!this.st.hist.length) this.st = null; else L.undo(this.lv, this.st);
      this.stuck = false; this.progress = this.st ? this.st.n / this.lv.edges.length : 0; this.api.tick(); return true;
    }
    reset() { if (this.solved) return; this.st = null; this.stuck = false; this.progress = 0; }
    update(dt) {
      for (let i = 0; i < this.p.length; i++) if (this.st && this.st.used[i]) this.p[i] = Math.min(1, this.p[i] + dt * 5);
      if (this.solved) this.win += dt;
    }

    draw(ctx, t) {
      const lv = this.lv, st = this.st, glow = Math.min(1, this.win);

      if (lv.mirror) {              // the glass, edge on: you draw on one side of it, Iris (in ruby) on the other
        ctx.save(); ctx.strokeStyle = 'rgba(200,190,255,0.22)'; ctx.lineWidth = 1; ctx.setLineDash([3, 9]); ctx.lineDashOffset = t * 8;
        ctx.beginPath(); ctx.moveTo(this.cx, this.axisY[0]); ctx.lineTo(this.cx, this.axisY[1]); ctx.stroke(); ctx.restore();
      }

      // lines not yet drawn
      lv.edges.forEach((ed, e) => {
        if (st && st.used[e]) return;
        const [x1, y1] = this.pos(ed.a), [x2, y2] = this.pos(ed.b);
        const can = st && L.can(lv, st, e), rgb = ed.color ? BD.MIX[ed.color] : '205,210,255';
        ctx.save(); ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(' + rgb + ',' + ((ed.color ? 0.62 : 0.3) + (can ? 0.25 : 0)) + ')';
        ctx.lineWidth = ed.color ? 2.4 : 1.4;
        if (ed.color) ctx.setLineDash([7, 6]);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
      });
      // lines drawn
      if (st) lv.edges.forEach((ed, e) => {
        const u = st.used[e]; if (!u) return;
        const from = u.from, to = ed.a === from ? ed.b : ed.a, [x1, y1] = this.pos(from), [x2, y2] = this.pos(to);
        const k = BD.ease.out(this.p[e]);
        const rgb = u.by === 3 ? '255,255,255' : u.by === 2 ? BD.RUBY : (u.color ? BD.MIX[u.color] : BD.GOLD);
        const ex = x1 + (x2 - x1) * k, ey = y1 + (y2 - y1) * k;
        BD.glowLine(ctx, x1, y1, ex, ey, rgb, 3.2 + 1.5 * glow, 0.95, 0.5);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
        ctx.setLineDash([2, 22]); ctx.lineDashOffset = -t * 40; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(ex, ey); ctx.stroke(); ctx.restore();
      });

      // lanterns
      const nexts = st ? L.moves(lv, st).map(m => m.to) : [];
      lv.nodes.forEach((n, i) => {
        const [x, y] = this.pos(i), hov = this.hover === i ? 1 : 0;
        if (n.well) {
          const rgb = BD.MIX[n.well];
          BD.orb(ctx, x, y, 30 + 3 * Math.sin(t * 2 + i), rgb, 0.75);
          ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.5); ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = 'rgba(' + rgb + ',0.95)'; ctx.lineWidth = 1.6; ctx.setLineDash([4, 5]);
          ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.stroke(); ctx.restore();
          ctx.save(); ctx.fillStyle = 'rgb(' + rgb + ')'; ctx.beginPath(); ctx.arc(x, y, 6.5, 0, TAU); ctx.fill(); ctx.restore();
        } else {
          const invite = !st ? 0.5 + 0.5 * Math.sin(t * 2.2 + i * 0.7) : nexts.includes(i) ? 0.6 + 0.4 * Math.sin(t * 5) : 0;
          BD.orb(ctx, x, y, 15 + 7 * invite + 6 * hov, '235,238,255', 0.4 + 0.35 * invite + 0.2 * hov);
          ctx.save(); ctx.fillStyle = 'rgba(245,246,255,0.95)'; ctx.beginPath(); ctx.arc(x, y, 3.6, 0, TAU); ctx.fill(); ctx.restore();
        }
      });

      if (st) {
        const [x, y] = this.pos(st.at), rgb = this.stuck ? '255,90,110' : this.colour(), r = 15 + 2.5 * Math.sin(t * 6);
        BD.orb(ctx, x, y, 34, rgb, 0.8); BD.glowArc(ctx, x, y, r, 0, TAU, rgb, 2, 1, 0.5);
        if (lv.mirror && lv.sigma[st.at] !== st.at) {
          const [sx, sy] = this.pos(lv.sigma[st.at]);
          BD.orb(ctx, sx, sy, 34, BD.RUBY, 0.8); BD.glowArc(ctx, sx, sy, r, 0, TAU, BD.RUBY, 2, 1, 0.5);
        }
      }
      if (this.solved) BD.orb(ctx, this.cx, this.cy, this.sc * (0.6 + this.win * 0.8), BD.GOLD, 0.28 * Math.max(0, 1 - this.win * 0.45));
    }
  };
})();
