/* III. THE HALL OF MIRRORS — you, and the one on the water who moves when you move. */
(function () {
  'use strict';
  const BD = window.BD, TAU = BD.TAU, L = BD.Twins, DX = BD.DX, DY = BD.DY;
  BD.puzzles = BD.puzzles || {};
  const KEYS = { ArrowRight: 0, KeyD: 0, ArrowDown: 1, KeyS: 1, ArrowLeft: 2, KeyA: 2, ArrowUp: 3, KeyW: 3 };

  BD.puzzles.twins = class {
    constructor(def, api) {
      this.def = def; this.api = api; this.lv = L.parse(def);
      this.s = L.start(this.lv);
      this.a = { x: this.s.ax, y: this.s.ay }; this.b = { x: this.s.bx, y: this.s.by };
      this.bump = [null, null]; this.arrow = null; this.trail = [[], []];
      this.hist = []; this.solved = false; this.win = 0; this.down = null; this.progress = 0;
      this.union = this.lv.ga.x === this.lv.gb.x && this.lv.ga.y === this.lv.gb.y;
      // the other one is violet while it passes for a reflection, and ruby once it is Iris
      const ruby = def.tint === 'ruby';
      this.other = ruby ? BD.RUBY : BD.VIOLET; this.rim = ruby ? '255,198,208' : '150,205,255';
    }
    layout(v) {
      const lv = this.lv; this.cs = Math.min(v.size / lv.w, v.size / lv.h);
      this.ox = v.cx - this.cs * lv.w / 2; this.oy = v.cy - this.cs * lv.h / 2;
    }
    px(x) { return this.ox + (x + 0.5) * this.cs; }
    py(y) { return this.oy + (y + 0.5) * this.cs; }
    score() {
      const s = this.s, lv = this.lv;
      this.progress = ((s.ax === lv.ga.x && s.ay === lv.ga.y) ? 0.5 : 0) + ((s.bx === lv.gb.x && s.by === lv.gb.y) ? 0.5 : 0);
    }
    move(d) {
      if (this.solved) return;
      const n = L.step(this.lv, this.s, d);
      this.arrow = { d, d2: n.d2, t: 0, a: n.movedA, b: n.movedB };
      if (!n.movedA) this.bump[0] = { d, t: 0 };
      if (!n.movedB) this.bump[1] = { d: n.d2, t: 0 };
      if (!n.movedA && !n.movedB) { this.api.thud(); return; }
      this.hist.push(this.s);
      this.s = { ax: n.ax, ay: n.ay, bx: n.bx, by: n.by };
      if (n.movedA) this.api.chime(2 + (n.ay % 3), 0.09, 2);
      if (n.movedB) this.api.chime(n.by % 3, 0.07, 1);
      if (n.movedA !== n.movedB) this.api.tick();
      this.api.pulse(0.14); this.score();
      if (L.solved(this.lv, this.s)) { this.solved = true; this.api.win(); }
    }
    undo() { const h = this.hist.pop(); if (!h || this.solved) return false; this.s = h; this.score(); return true; }
    reset() { if (this.solved) return; this.s = L.start(this.lv); this.hist = []; this.score(); }
    onKey(e) { const d = KEYS[e.code]; if (d == null) return false; this.move(d); return true; }
    onDown(x, y) { this.down = { x, y }; }
    onMove() { }
    onLeave() { }
    onUp(x, y) {
      if (!this.down) return;
      let dx = x - this.down.x, dy = y - this.down.y; this.down = null;
      if (Math.hypot(dx, dy) < 24) {          // a tap: step toward it, measured from yourself
        dx = x - this.px(this.a.x); dy = y - this.py(this.a.y);
        if (Math.hypot(dx, dy) < this.cs * 0.35) return;
      }
      this.move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3));
    }
    update(dt) {
      const s = this.s;
      this.a.x = BD.damp(this.a.x, s.ax, 17, dt); this.a.y = BD.damp(this.a.y, s.ay, 17, dt);
      this.b.x = BD.damp(this.b.x, s.bx, 17, dt); this.b.y = BD.damp(this.b.y, s.by, 17, dt);
      for (let i = 0; i < 2; i++) { const b = this.bump[i]; if (b) { b.t += dt * 5; if (b.t >= 1) this.bump[i] = null; } }
      if (this.arrow) { this.arrow.t += dt * 1.6; if (this.arrow.t >= 1) this.arrow = null; }
      [this.a, this.b].forEach((p, i) => {
        const tr = this.trail[i], last = tr[tr.length - 1];
        if (!last || Math.hypot(last.x - p.x, last.y - p.y) > 0.04) tr.push({ x: p.x, y: p.y, a: 1 });
        for (const q of tr) q.a -= dt * 2.2;
        while (tr.length && tr[0].a <= 0) tr.shift();
      });
      if (this.solved) this.win += dt;
    }

    sigil(ctx, x, y, r, kind, lit, t) {
      ctx.save(); ctx.translate(x, y); ctx.globalCompositeOperation = 'lighter';
      const a = 0.7 + 0.3 * lit;
      if (kind !== 'moon') {         // the sun: a ring with rays
        ctx.strokeStyle = 'rgba(' + BD.GOLD + ',' + a + ')'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(0, 0, r * 0.5, 0, TAU); ctx.stroke();
        ctx.save(); ctx.rotate(t * 0.3);
        for (let j = 0; j < 8; j++) { ctx.rotate(TAU / 8); ctx.beginPath(); ctx.moveTo(r * 0.68, 0); ctx.lineTo(r * (j % 2 ? 0.86 : 1), 0); ctx.stroke(); }
        ctx.restore();
      }
      if (kind !== 'sun') {          // the moon: a crescent
        ctx.strokeStyle = 'rgba(' + this.other + ',' + a + ')'; ctx.fillStyle = 'rgba(' + this.other + ',' + 0.28 * a + ')'; ctx.lineWidth = 1.6;
        const rr = kind === 'both' ? r * 0.34 : r * 0.62;
        ctx.beginPath(); ctx.arc(0, 0, rr, 0.55, TAU - 0.55);
        ctx.arc(rr * 0.52, 0, rr * 0.72, TAU - 0.95, 0.95, true); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      ctx.restore();
      BD.orb(ctx, x, y, r * (1.5 + 0.6 * lit + 0.12 * Math.sin(t * 2.2)), kind === 'moon' ? this.other : BD.GOLD, 0.3 + 0.4 * lit);
    }

    draw(ctx, t) {
      const lv = this.lv, cs = this.cs, s = this.s, g = cs * 0.045;

      ctx.save();
      BD.roundRect(ctx, this.ox - 10, this.oy - 10, cs * lv.w + 20, cs * lv.h + 20, 20);
      ctx.fillStyle = 'rgba(2,4,12,0.42)'; ctx.fill(); ctx.restore();

      for (let y = 0; y < lv.h; y++) for (let x = 0; x < lv.w; x++) {
        const ch = lv.cells[y * lv.w + x], X = this.ox + x * cs, Y = this.oy + y * cs;
        if (ch === '#') {
          ctx.save(); BD.roundRect(ctx, X + g, Y + g, cs - 2 * g, cs - 2 * g, cs * 0.14);
          ctx.fillStyle = 'rgba(8,12,34,0.92)'; ctx.fill(); ctx.restore();
          const h = 185 + 50 * Math.sin(x * 0.9 + y * 1.3 + t * 0.3);
          BD.glowPath(ctx, BD.hsl(h, 90, 66), 1.2, 0.5, c => BD.roundRect(c, X + g, Y + g, cs - 2 * g, cs - 2 * g, cs * 0.14), 0.15);
          ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.13)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(X + cs * 0.22, Y + cs * 0.5); ctx.lineTo(X + cs * 0.5, Y + cs * 0.22); ctx.moveTo(X + cs * 0.3, Y + cs * 0.7); ctx.lineTo(X + cs * 0.7, Y + cs * 0.3); ctx.stroke(); ctx.restore();
        } else {
          ctx.save(); BD.roundRect(ctx, X + g, Y + g, cs - 2 * g, cs - 2 * g, cs * 0.14);
          ctx.fillStyle = 'rgba(190,215,255,0.028)'; ctx.fill(); ctx.strokeStyle = 'rgba(190,215,255,0.13)'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
          if (ch === 'g' || ch === 'v') {                       // a veil: threads of light only one of you can part
            const rgb = ch === 'g' ? BD.GOLD : this.other;
            for (let j = 0; j < 5; j++) {
              const vx = X + cs * (0.2 + j * 0.15), ph = t * 1.6 + j * 1.1 + x + y;
              BD.glowPath(ctx, rgb, 1.3, 0.5 + 0.25 * Math.sin(ph), c => {
                c.moveTo(vx, Y + cs * 0.12);
                c.bezierCurveTo(vx + Math.sin(ph) * cs * 0.09, Y + cs * 0.38, vx - Math.sin(ph) * cs * 0.09, Y + cs * 0.62, vx, Y + cs * 0.88);
              }, 0.2);
            }
          }
        }
      }

      // where each of you belongs
      const onA = s.ax === lv.ga.x && s.ay === lv.ga.y ? 1 : 0, onB = s.bx === lv.gb.x && s.by === lv.gb.y ? 1 : 0;
      if (this.union) this.sigil(ctx, this.px(lv.ga.x), this.py(lv.ga.y), cs * 0.4, 'both', (onA + onB) / 2, t);
      else { this.sigil(ctx, this.px(lv.ga.x), this.py(lv.ga.y), cs * 0.38, 'sun', onA, t); this.sigil(ctx, this.px(lv.gb.x), this.py(lv.gb.y), cs * 0.38, 'moon', onB, t); }

      const off = (i, p) => {
        const b = this.bump[i]; let ox = 0, oy = 0;
        if (b) { const k = Math.sin(b.t * Math.PI) * cs * 0.16; ox = DX[b.d] * k; oy = DY[b.d] * k; }
        return [this.px(p.x) + ox, this.py(p.y) + oy];
      };
      const [ax, ay] = off(0, this.a), [bx, by] = off(1, this.b);

      // the bond between you
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const lg = ctx.createLinearGradient(ax, ay, bx, by);
      lg.addColorStop(0, 'rgba(' + BD.GOLD + ',0.45)'); lg.addColorStop(1, 'rgba(' + this.other + ',0.45)');
      ctx.strokeStyle = lg; ctx.lineWidth = 1.2; ctx.setLineDash([2, 7]); ctx.lineDashOffset = -t * 14;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); ctx.restore();

      // afterimages
      this.trail.forEach((tr, i) => { for (const q of tr) BD.orb(ctx, this.px(q.x), this.py(q.y), cs * 0.3, i ? this.other : BD.GOLD, 0.2 * Math.max(0, q.a)); });

      // the shadow: a dark body with a bright edge
      const pulse = 1 + 0.07 * Math.sin(t * 2.4);
      BD.orb(ctx, bx, by, cs * 0.66 * pulse, this.other, 0.6);
      ctx.save(); ctx.fillStyle = 'rgba(4,2,14,0.96)'; ctx.beginPath(); ctx.arc(bx, by, cs * 0.21, 0, TAU); ctx.fill(); ctx.restore();
      BD.glowArc(ctx, bx, by, cs * 0.21, 0, TAU, this.rim, 1.8, 0.95, 0.5);

      // you: a bright body
      BD.orb(ctx, ax, ay, cs * 0.7 * pulse, BD.GOLD, 0.75);
      ctx.save(); ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.arc(ax, ay, cs * 0.17, 0, TAU); ctx.fill(); ctx.restore();
      BD.glowArc(ctx, ax, ay, cs * 0.21, 0, TAU, BD.GOLD, 1.5, 0.9, 0.4);

      // a brief arrow over each of you, showing the step that was just taken
      if (this.arrow) {
        const al = 1 - this.arrow.t, draw = (x, y, d, rgb, moved) => {
          const ux = DX[d], uy = DY[d], cx = x + ux * cs * 0.42, cy = y + uy * cs * 0.42, k = cs * 0.12;
          BD.glowPath(ctx, rgb, 2, al * (moved ? 1 : 0.4), c => {
            c.moveTo(cx - ux * k - uy * k, cy - uy * k + ux * k); c.lineTo(cx + ux * k, cy + uy * k); c.lineTo(cx - ux * k + uy * k, cy - uy * k - ux * k);
          }, 0.4);
        };
        draw(ax, ay, this.arrow.d, BD.GOLD, this.arrow.a); draw(bx, by, this.arrow.d2, this.other, this.arrow.b);
      }

      if (this.solved) {
        const k = Math.max(0, 1 - this.win * 0.5);
        BD.orb(ctx, ax, ay, cs * (1 + this.win * 2.5), BD.GOLD, 0.5 * k); BD.orb(ctx, bx, by, cs * (1 + this.win * 2.5), this.other, 0.5 * k);
      }
    }
  };
})();
