/* THE BLOOMING DARK — the rose window.
   Her last work, and the map of the night: five rings of glass around a middle with nothing in it.
   The rings light from the rim inward, one for each chapter. The middle is kept for the morning. */
(function () {
  'use strict';
  const BD = window.BD, TAU = BD.TAU;

  // outermost first: the order the night goes in.   glass = [hue, saturation, lightness] with the sun behind it
  const RINGS = [
    { r0: 0.850, r1: 0.962, n: 24, kind: 'pane', glass: [[268, 72, 44], [238, 74, 40]] },                                                   // I    the threshold: visual purple
    { r0: 0.640, r1: 0.836, n: 12, kind: 'weed', glass: [[350, 90, 46], [42, 96, 56]], bed: [[162, 80, 25], [148, 72, 28]], leaf: [96, 66, 44] },  // II   the garden: her weeds
    { r0: 0.476, r1: 0.626, n: 24, kind: 'pane', glass: [[188, 64, 47], [209, 76, 42]] },                                                   // III  the water
    { r0: 0.312, r1: 0.476, n: 12, kind: 'star', glass: [[226, 88, 36], [254, 72, 32]] },                                                   // IV   the dark between
    { r0: 0.170, r1: 0.312, n: 12, kind: 'ray', glass: [[46, 98, 60], [32, 96, 54]], bed: [[352, 88, 38], [343, 86, 33]] }                 // V    the thread: gold on ruby
  ];
  const BEADS = [[0.843, 60], [0.633, 48]];      // strings of pearls on the heavy leads
  const HOLE = 0.170;
  const jit = (() => { const R = BD.rng(4711), a = []; for (let i = 0; i < 200; i++) a.push(R()); return a; })();

  function sector(ctx, r0, r1, a0, a1) { ctx.beginPath(); ctx.arc(0, 0, r1, a0, a1); ctx.arc(0, 0, r0, a1, a0, true); ctx.closePath(); }
  // a pointed blade of glass growing from (x, y) along the angle a; returns its tip
  function blade(ctx, x, y, a, len, half) {
    const c = Math.cos(a), s = Math.sin(a), P = (u, v) => [x + c * u - s * v, y + s * u + c * v];
    const p1 = P(len, 0), a1 = P(len * 0.24, -half * 1.5), a2 = P(len * 0.7, -half), b1 = P(len * 0.7, half), b2 = P(len * 0.24, half * 1.5);
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.bezierCurveTo(a1[0], a1[1], a2[0], a2[1], p1[0], p1[1]);
    ctx.bezierCurveTo(b1[0], b1[1], b2[0], b2[1], x, y);
    return p1;
  }

  /* o: { lit: [five values 0..1, rim first], sun: 0..1, glazed: 0..1, t, alpha } */
  BD.rose = function (ctx, cx, cy, R, o) {
    const A = o.alpha == null ? 1 : o.alpha; if (A <= 0.004) return;
    const t = o.t || 0, sun = o.sun || 0, glazed = o.glazed || 0;
    const lw = Math.max(0.8, R * 0.0095), hr = HOLE * R, fine = R > 90;
    const lead = 'rgba(5,3,10,' + 0.97 * A + ')';
    let k = 0;

    ctx.save(); ctx.translate(cx, cy); ctx.lineJoin = 'round'; ctx.lineCap = 'round';

    // the shadow of the wall round it, and the frame
    const back = ctx.createRadialGradient(0, 0, R * 0.9, 0, 0, R * 1.3);
    back.addColorStop(0, 'rgba(3,2,9,' + 0.8 * A + ')'); back.addColorStop(1, 'rgba(3,2,9,0)');
    ctx.fillStyle = back; ctx.beginPath(); ctx.arc(0, 0, R * 1.3, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(4,3,10,' + 0.97 * A + ')'; ctx.beginPath(); ctx.arc(0, 0, R * 1.045, 0, TAU); ctx.fill();
    const fr = ctx.createRadialGradient(0, 0, R * 0.96, 0, 0, R * 1.045);
    fr.addColorStop(0, 'rgba(62,54,90,' + 0.95 * A + ')'); fr.addColorStop(0.5, 'rgba(28,24,46,' + A + ')'); fr.addColorStop(1, 'rgba(74,66,104,' + 0.9 * A + ')');
    ctx.strokeStyle = fr; ctx.lineWidth = R * 0.075; ctx.beginPath(); ctx.arc(0, 0, R * 1.0035, 0, TAU); ctx.stroke();

    // glass: unlit it is pewter with only a memory of its colour; lit, it is itself. Each ring is shaded like a pillow, bright along its middle.
    const glassOf = (g, spec, L) => {
      const h = spec[0], S = BD.lerp(10, spec[1], L), lm = BD.lerp(15 + spec[2] * 0.16, spec[2] + 6 * sun, L), le = lm * BD.lerp(0.62, 0.40, L);
      const c = ll => 'hsla(' + h + ',' + S.toFixed(1) + '%,' + ll.toFixed(1) + '%,' + A + ')';
      const gr = ctx.createRadialGradient(0, 0, g.r0 * R, 0, 0, g.r1 * R);
      gr.addColorStop(0, c(le)); gr.addColorStop(0.5, c(lm)); gr.addColorStop(1, c(le * 1.1));
      return { fill: gr, glow: 'hsla(' + h + ',100%,' + (spec[2] + 6) + '%,' + (0.09 + 0.12 * sun) * L * A + ')' };
    };
    const paint = (gl, L, heavy) => {
      const j = jit[k++ % jit.length], sh = 0.5 + 0.5 * Math.sin(t * 0.55 + j * 40);
      ctx.fillStyle = gl.fill; ctx.fill();
      ctx.fillStyle = j > 0.5 ? 'rgba(255,255,255,' + (j - 0.5) * (0.10 + 0.14 * L) * A + ')' : 'rgba(0,0,0,' + (0.5 - j) * 0.44 * A + ')'; ctx.fill();   // no two pieces from the same sheet
      if (L > 0.01) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.6 + 0.4 * sh; ctx.fillStyle = gl.glow; ctx.fill(); ctx.restore(); }
      if (fine) { ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(0,0,0,' + 0.30 * A + ')'; ctx.lineWidth = lw * 5; ctx.stroke(); ctx.restore(); }          // matting: paint shaded in from the leads
      ctx.strokeStyle = lead; ctx.lineWidth = lw * (heavy ? 1.25 : 1); ctx.stroke();
      ctx.strokeStyle = 'rgba(198,206,232,' + (0.26 * (1 - L) + 0.04) * A + ')'; ctx.lineWidth = Math.max(0.45, lw * 0.26); ctx.stroke();                 // moonlight on the lead
    };
    const vein = (x0, y0, p1) => {
      ctx.strokeStyle = 'rgba(5,3,10,' + 0.5 * A + ')'; ctx.lineWidth = Math.max(0.5, lw * 0.5);
      ctx.beginPath(); ctx.moveTo(x0 + (p1[0] - x0) * 0.1, y0 + (p1[1] - y0) * 0.1); ctx.lineTo(x0 + (p1[0] - x0) * 0.8, y0 + (p1[1] - y0) * 0.8); ctx.stroke();
    };

    RINGS.forEach((g, gi) => {
      const L = BD.clamp(o.lit ? o.lit[gi] || 0 : 0, 0, 1), step = TAU / g.n, r0 = g.r0 * R, r1 = g.r1 * R, d = r1 - r0;
      const G = g.glass.map(s => glassOf(g, s, L)), B = g.bed ? g.bed.map(s => glassOf(g, s, L)) : null, LF = g.leaf ? glassOf(g, g.leaf, L) : null;
      for (let i = 0; i < g.n; i++) {
        const a0 = -Math.PI / 2 + (i - 0.5) * step, mid = a0 + step / 2, c = Math.cos(mid), s = Math.sin(mid);
        if (g.kind === 'weed') {                // a sprig in every piece of the garden: two leaves, and a head of ruby or of gold
          sector(ctx, r0, r1, a0, a0 + step); paint(B[i % 2], L, true);
          ctx.strokeStyle = lead; ctx.lineWidth = lw * 1.1; ctx.beginPath(); ctx.moveTo(c * (r0 + d * 0.02), s * (r0 + d * 0.02)); ctx.lineTo(c * (r0 + d * 0.36), s * (r0 + d * 0.36)); ctx.stroke();
          for (const sg of [-1, 1]) {
            const bx = c * (r0 + d * 0.13), by = s * (r0 + d * 0.13), tip = blade(ctx, bx, by, mid + sg * 0.98, d * 0.56, d * 0.125); paint(LF, L); vein(bx, by, tip);
          }
          const hx = c * (r0 + d * 0.33), hy = s * (r0 + d * 0.33), tip = blade(ctx, hx, hy, mid, d * 0.61, d * 0.19); paint(G[i % 2], L); vein(hx, hy, tip);
          const rr = r0 + d * 0.80, x = Math.cos(a0) * rr, y = Math.sin(a0) * rr;       // and a berry on every seam
          ctx.beginPath(); ctx.arc(x, y, d * 0.10, 0, TAU); paint(G[(i + 1) % 2], L);
        } else if (g.kind === 'ray') {
          sector(ctx, r0, r1, a0, a0 + step); paint(B[i % 2], L, true);
          const bx = c * (r0 + d * 0.05), by = s * (r0 + d * 0.05), tip = blade(ctx, bx, by, mid, d * 0.89, (r0 + r1) * 0.5 * step * 0.26); paint(G[i % 2], L); vein(bx, by, tip);
        } else {
          sector(ctx, r0, r1, a0, a0 + step); paint(G[i % 2], L, g.kind === 'star');
          if (g.kind === 'star') {              // one small roundel of white in every piece of the dark
            const rr = (r0 + r1) / 2, x = c * rr, y = s * rr, sz = d * 0.13;
            ctx.beginPath(); ctx.arc(x, y, sz, 0, TAU);
            ctx.fillStyle = 'hsla(225,' + (10 + 30 * L) + '%,' + (38 + 54 * L) + '%,' + A + ')'; ctx.fill();
            ctx.strokeStyle = lead; ctx.lineWidth = lw * 0.8; ctx.stroke();
            if (L > 0.2) BD.orb(ctx, x, y, sz * 3.4, '225,232,255', 0.5 * L * A * (0.65 + 0.35 * Math.sin(t * 1.3 + i * 2.1)));
          }
        }
      }
      ctx.strokeStyle = lead; ctx.lineWidth = lw * 1.5; ctx.beginPath(); ctx.arc(0, 0, r1, 0, TAU); ctx.stroke();
    });

    // the heavy leads, strung with pearls
    BEADS.forEach(([r, n], bi) => {
      const L = BD.clamp(o.lit ? o.lit[bi] || 0 : 0, 0, 1);
      ctx.strokeStyle = lead; ctx.lineWidth = R * 0.021; ctx.beginPath(); ctx.arc(0, 0, r * R, 0, TAU); ctx.stroke();
      if (!fine) return;
      ctx.fillStyle = 'hsla(44,' + (8 + 82 * L) + '%,' + (40 + 38 * L) + '%,' + A + ')';
      ctx.beginPath();
      for (let i = 0; i < n; i++) { const a = i / n * TAU, x = Math.cos(a) * r * R, y = Math.sin(a) * r * R; ctx.moveTo(x + R * 0.0058, y); ctx.arc(x, y, R * 0.0058, 0, TAU); }
      ctx.fill();
    });

    // the middle
    ctx.beginPath(); ctx.arc(0, 0, hr, 0, TAU);
    ctx.fillStyle = 'rgba(2,1,7,' + 0.94 * (1 - sun) * A + ')'; ctx.fill();
    // a slant of moonlight across the unlit glass
    const lit = o.lit ? (o.lit[0] + o.lit[1] + o.lit[2] + o.lit[3] + o.lit[4]) / 5 : 0;
    if (lit < 0.98) {
      const mg = ctx.createLinearGradient(-R, -R, R, R);
      mg.addColorStop(0.18, 'rgba(190,205,255,0)'); mg.addColorStop(0.36, 'rgba(190,205,255,' + 0.10 * (1 - lit) * A + ')'); mg.addColorStop(0.5, 'rgba(190,205,255,0)');
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(0, 0, R * 0.96, 0, TAU); ctx.arc(0, 0, hr, 0, TAU, true); ctx.fill(); ctx.restore();
    }
    ctx.restore();

    if (sun > 0.01) {
      const br = 1 + 0.035 * Math.sin(t * 0.9), a = sun * A;
      BD.orb(ctx, cx, cy, R * 2.4 * br, '255,200,130', 0.16 * a);
      BD.orb(ctx, cx, cy, R * 0.52 * br, '255,236,200', 0.42 * a);
      ctx.save(); ctx.translate(cx, cy); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 16; i++) {            // shafts, leaning out across the glass and past it
        const an = i / 16 * TAU + t * 0.018 + jit[i] * 0.2, len = R * (0.8 + 1.3 * jit[i + 20]) * (0.94 + 0.06 * Math.sin(t * 0.6 + i * 1.7)), wd = 0.016 + 0.045 * jit[i + 40];
        const g = ctx.createLinearGradient(0, 0, Math.cos(an) * len, Math.sin(an) * len);
        g.addColorStop(0, 'rgba(255,246,220,' + 0.30 * a + ')'); g.addColorStop(0.3, 'rgba(255,226,170,' + 0.10 * a + ')'); g.addColorStop(1, 'rgba(255,214,150,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(Math.cos(an) * hr * 0.6, Math.sin(an) * hr * 0.6);
        ctx.lineTo(Math.cos(an - wd) * len, Math.sin(an - wd) * len); ctx.lineTo(Math.cos(an + wd) * len, Math.sin(an + wd) * len); ctx.closePath(); ctx.fill();
      }
      // the long flat flare of something too bright to look at
      ctx.save(); ctx.scale(1, 0.03);
      const fl = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 2.8);
      fl.addColorStop(0, 'rgba(255,250,235,' + 0.6 * a + ')'); fl.addColorStop(0.3, 'rgba(255,225,170,' + 0.2 * a + ')'); fl.addColorStop(1, 'rgba(255,220,160,0)');
      ctx.fillStyle = fl; ctx.beginPath(); ctx.arc(0, 0, R * 2.8, 0, TAU); ctx.fill(); ctx.restore();
      ctx.globalCompositeOperation = 'source-over';
      const d = ctx.createRadialGradient(0, 0, 0, 0, 0, hr);
      d.addColorStop(0, 'rgba(255,255,255,' + a + ')'); d.addColorStop(0.7, 'rgba(255,252,238,' + a + ')'); d.addColorStop(1, 'rgba(255,230,176,' + 0.9 * a + ')');
      ctx.fillStyle = d; ctx.beginPath(); ctx.arc(0, 0, hr, 0, TAU); ctx.fill();
      ctx.restore();
      BD.orb(ctx, cx, cy, hr * 2.2 * br, '255,250,235', 0.8 * a);
    }

    ctx.save(); ctx.translate(cx, cy); ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(5,3,10,' + (1 - 0.6 * sun) * A + ')'; ctx.lineWidth = lw * 1.7;
    ctx.beginPath(); ctx.arc(0, 0, hr, 0, TAU); ctx.stroke();
    if (sun < 0.6) {
      ctx.strokeStyle = 'rgba(198,206,232,' + 0.36 * (1 - sun) * A + ')'; ctx.lineWidth = Math.max(0.6, lw * 0.4);
      ctx.beginPath(); ctx.arc(0, 0, hr + lw, 0, TAU); ctx.stroke();
    }
    if (glazed > 0.01) {                        // one piece of plain glass: nothing to see of it but the shine, and the new lead round it
      ctx.strokeStyle = 'rgba(40,30,22,' + 0.9 * glazed * A + ')'; ctx.lineWidth = lw * 2.2;
      ctx.beginPath(); ctx.arc(0, 0, hr, 0, TAU); ctx.stroke();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(' + BD.GOLD + ',' + 0.8 * glazed * A + ')'; ctx.lineWidth = Math.max(0.8, lw * 0.7);
      ctx.beginPath(); ctx.arc(0, 0, hr + lw * 1.3, 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,' + 0.9 * glazed * A + ')'; ctx.lineWidth = Math.max(1, hr * 0.07);
      ctx.beginPath(); ctx.arc(0, 0, hr * 0.72, Math.PI * 1.10, Math.PI * 1.40); ctx.stroke();
      ctx.lineWidth = Math.max(0.8, hr * 0.04);
      ctx.beginPath(); ctx.arc(0, 0, hr * 0.72, Math.PI * 0.16, Math.PI * 0.30); ctx.stroke();
    }
    ctx.restore();
  };
})();
