/* THE BLOOMING DARK — shared drawing helpers. */
(function () {
  'use strict';
  const BD = window.BD = window.BD || {};
  const TAU = Math.PI * 2;
  BD.TAU = TAU;

  BD.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  BD.lerp = (a, b, t) => a + (b - a) * t;
  BD.damp = (cur, target, rate, dt) => cur + (target - cur) * (1 - Math.exp(-rate * dt));
  BD.ease = {
    out: t => 1 - Math.pow(1 - t, 3),
    inOut: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    back: t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
  };
  BD.rng = seed => {
    let a = seed >>> 0;
    return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  };

  // hsl (degrees, 0..100, 0..100) -> "r,g,b" for use inside rgba()
  BD.hsl = (h, s, l) => {
    h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = n => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
    return f(0) + ',' + f(8) + ',' + f(4);
  };

  // light channels and their mixtures, indexed by bitmask (1 red, 2 green, 4 blue)
  BD.CHANNEL = ['255,48,84', '56,255,120', '72,120,255'];
  BD.MIX = { 0: '255,238,205', 1: '255,70,100', 2: '80,255,140', 4: '95,140,255', 3: '255,226,80', 5: '255,90,235', 6: '80,240,255', 7: '255,255,255' };
  BD.GOLD = '255,214,130';
  BD.VIOLET = '178,120,255';
  BD.RUBY = '255,70,112';       // Iris's colour

  /* A stroked path with a soft additive halo. build(ctx) lays down the path. */
  BD.glowPath = function (ctx, rgb, width, alpha, build, core) {
    const a = alpha == null ? 1 : alpha; if (a <= 0.003) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgb(' + rgb + ')';
    ctx.globalAlpha = 0.06 * a; ctx.lineWidth = width * 6 + 4; ctx.beginPath(); build(ctx); ctx.stroke();
    ctx.globalAlpha = 0.14 * a; ctx.lineWidth = width * 3.2 + 2; ctx.beginPath(); build(ctx); ctx.stroke();
    ctx.globalAlpha = 0.30 * a; ctx.lineWidth = width * 1.8 + 1; ctx.beginPath(); build(ctx); ctx.stroke();
    ctx.globalAlpha = a; ctx.lineWidth = width; ctx.beginPath(); build(ctx); ctx.stroke();
    const c = core == null ? 0.5 : core;
    if (c > 0) { ctx.globalAlpha = c * a; ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(0.6, width * 0.36); ctx.beginPath(); build(ctx); ctx.stroke(); }
    ctx.restore();
  };
  BD.glowLine = (ctx, x1, y1, x2, y2, rgb, width, alpha, core) =>
    BD.glowPath(ctx, rgb, width, alpha, c => { c.moveTo(x1, y1); c.lineTo(x2, y2); }, core);
  BD.glowArc = (ctx, x, y, r, a0, a1, rgb, width, alpha, core) =>
    BD.glowPath(ctx, rgb, width, alpha, c => { c.arc(x, y, r, a0, a1); }, core);

  /* A soft additive ball of light. */
  BD.orb = function (ctx, x, y, r, rgb, alpha) {
    if (alpha <= 0.003 || r <= 0) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(' + rgb + ',' + alpha + ')');
    g.addColorStop(0.3, 'rgba(' + rgb + ',' + alpha * 0.42 + ')');
    g.addColorStop(1, 'rgba(' + rgb + ',0)');
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore();
  };

  BD.roundRect = function (ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  };

  /* One petal, pointing along +x from the origin: a pointed leaf of the given length and half-width. */
  BD.petal = function (ctx, len, half) {
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(len * 0.28, -half * 1.25, len * 0.72, -half * 0.95, len, 0);
    ctx.bezierCurveTo(len * 0.72, half * 0.95, len * 0.28, half * 1.25, 0, 0);
  };

  /* Sparks: drawn as short additive streaks so they leave their own trails. */
  BD.Particles = class {
    constructor(max) { this.list = []; this.max = max || 700; }
    spawn(x, y, vx, vy, life, size, rgb, drag) {
      if (this.list.length >= this.max) this.list.shift();
      this.list.push({ x, y, vx, vy, life, age: 0, size, rgb, drag: drag == null ? 1.6 : drag });
    }
    burst(x, y, n, o) {
      o = o || {};
      for (let i = 0; i < n; i++) {
        const ang = o.angle != null ? o.angle + (Math.random() - 0.5) * (o.spread || 0.6) : Math.random() * TAU;
        const sp = (o.speed || 160) * (0.25 + Math.random() * 0.9);
        const rgb = o.rgb || BD.hsl((o.hue || 0) + (Math.random() - 0.5) * (o.hueSpread == null ? 60 : o.hueSpread), 100, 66);
        const r = (o.radius || 0) * Math.random();
        this.spawn(x + Math.cos(ang) * r, y + Math.sin(ang) * r, Math.cos(ang) * sp, Math.sin(ang) * sp,
          (o.life || 1.1) * (0.5 + Math.random() * 0.8), (o.size || 2) * (0.5 + Math.random()), rgb, o.drag);
      }
    }
    update(dt) {
      const L = this.list;
      for (let i = L.length - 1; i >= 0; i--) {
        const p = L[i]; p.age += dt;
        if (p.age >= p.life) { L.splice(i, 1); continue; }
        const d = Math.exp(-p.drag * dt); p.vx *= d; p.vy *= d;
        p.x += p.vx * dt; p.y += p.vy * dt;
      }
    }
    draw(ctx) {
      if (!this.list.length) return;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      for (const p of this.list) {
        const a = 1 - p.age / p.life;
        ctx.strokeStyle = 'rgba(' + p.rgb + ',' + (a * a).toFixed(3) + ')';
        ctx.lineWidth = p.size * (0.5 + 0.5 * a);
        ctx.beginPath(); ctx.moveTo(p.x - p.vx * 0.045, p.y - p.vy * 0.045); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
      ctx.restore();
    }
  };
})();
