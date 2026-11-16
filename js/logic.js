/* THE BLOOMING DARK — pure puzzle logic.
   No DOM in here: the same rules run in the browser and in tools/verify.js. */
(function (root) {
  'use strict';
  const BD = root.BD = root.BD || {};

  const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1]; // E, S, W, N  (y grows downward)
  BD.DX = DX; BD.DY = DY;

  /* ------------------------------------------------------------------ *
   * I. RINGS — concentric rings, each with one gate. Turning a ring may
   * drag other rings with it. Bring every gate to the top.
   * ------------------------------------------------------------------ */
  BD.Rings = {
    init(def) {
      const rot = new Array(def.rings).fill(0);
      def.scramble.forEach((k, i) => { for (let j = 0; j < k; j++) this.turn(def, rot, i, 1); });
      return rot;
    },
    affected(def, i) { return [[i, 1]].concat((def.links && def.links[i]) || []); },
    turn(def, rot, i, dir) { for (const [j, s] of this.affected(def, i)) rot[j] += dir * s; },
    aligned(def, rot, i) { const n = def.n; return ((rot[i] % n) + n) % n === 0; },
    count(def, rot) { let c = 0; for (let i = 0; i < def.rings; i++) if (this.aligned(def, rot, i)) c++; return c; },
    solved(def, rot) { return this.count(def, rot) === def.rings; }
  };

  /* ------------------------------------------------------------------ *
   * II. PRISM — white light splits into red / green / blue. Each channel
   * is traced on its own; a flower blooms when it drinks exactly its colour.
   * ------------------------------------------------------------------ */
  const MASK = { R: 1, G: 2, B: 4, Y: 3, M: 5, C: 6, W: 7 };
  const REFL = { 1: [3, 2, 1, 0], 2: [1, 0, 3, 2] }; // 1 = "/", 2 = "\"
  BD.Prism = {
    MASK,
    parse(def) {
      const rows = def.map, h = rows.length, w = rows[0].length;
      const lv = { w, h, cells: [], emitters: [], sockets: [], flowers: [] };
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const ch = rows[y][x]; let c = { t: 'empty', x, y };
        if (ch === '#') c.t = 'stone';
        else if ('>v<^'.includes(ch)) { c.t = 'emit'; c.d = '>v<^'.indexOf(ch); c.mask = 7; lv.emitters.push(c); }
        else if (ch === 'o') { c.t = 'socket'; c.i = lv.sockets.length; lv.sockets.push(c); }
        else if (ch === '/') { c.t = 'mirror'; c.m = 1; }
        else if (ch === '\\') { c.t = 'mirror'; c.m = 2; }
        else if (ch === 'P') c.t = 'prism';
        else if (MASK[ch]) { c.t = 'flower'; c.want = MASK[ch]; c.i = lv.flowers.length; lv.flowers.push(c); }
        else if (MASK[ch.toUpperCase()] && ch !== '.') { c.t = 'filter'; c.mask = MASK[ch.toUpperCase()]; }
        lv.cells.push(c);
      }
      return lv;
    },
    trace(lv, st) {
      const paths = [[], [], []], recv = new Array(lv.flowers.length).fill(0);
      for (const em of lv.emitters) for (let c = 0; c < 3; c++) {
        if (!(em.mask & (1 << c))) continue;
        let x = em.x, y = em.y, d = em.d;
        const pts = [[x, y]], seen = new Set();
        for (let guard = 0; guard < 500; guard++) {
          const nx = x + DX[d], ny = y + DY[d];
          if (nx < 0 || ny < 0 || nx >= lv.w || ny >= lv.h) { pts.push([x + DX[d] * 0.5, y + DY[d] * 0.5]); break; }
          const cell = lv.cells[ny * lv.w + nx], key = (ny * lv.w + nx) * 4 + d;
          if (seen.has(key)) { pts.push([nx, ny]); break; }
          seen.add(key);
          if (cell.t === 'stone' || cell.t === 'emit') { pts.push([x + DX[d] * 0.6, y + DY[d] * 0.6]); break; }
          if (cell.t === 'flower') { pts.push([nx, ny]); recv[cell.i] |= 1 << c; break; }
          if (cell.t === 'filter') {
            if (!(cell.mask & (1 << c))) { pts.push([nx, ny]); break; }
            x = nx; y = ny; continue;
          }
          const m = cell.t === 'mirror' ? cell.m : cell.t === 'socket' ? st[cell.i] : 0;
          if (m) { pts.push([nx, ny]); d = REFL[m][d]; x = nx; y = ny; continue; }
          if (cell.t === 'prism') {
            const nd = c === 0 ? (d + 3) % 4 : c === 2 ? (d + 1) % 4 : d; // red bends left, blue bends right
            if (nd !== d) { pts.push([nx, ny]); d = nd; }
          }
          x = nx; y = ny;
        }
        paths[c].push(pts);
      }
      return { paths, recv };
    },
    count(lv, recv) { let c = 0; lv.flowers.forEach((f, i) => { if (recv[i] === f.want) c++; }); return c; },
    solved(lv, recv) { return this.count(lv, recv) === lv.flowers.length; }
  };

  /* ------------------------------------------------------------------ *
   * III. TWINS — you and your shadow move together. The shadow's
   * directions are mirrored (or wholly inverted). Rest both on their sigils.
   * ------------------------------------------------------------------ */
  BD.Twins = {
    parse(def) {
      const rows = def.map, h = rows.length, w = rows[0].length;
      const lv = { w, h, mode: def.mode || 'mirror', cells: [], A: null, B: null, ga: null, gb: null };
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let ch = rows[y][x];
        if (ch === 'A') { lv.A = { x, y }; ch = '.'; }
        else if (ch === 'B') { lv.B = { x, y }; ch = '.'; }
        else if (ch === 'a') { lv.ga = { x, y }; ch = '.'; }
        else if (ch === 'b') { lv.gb = { x, y }; ch = '.'; }
        else if (ch === 'u') { lv.ga = { x, y }; lv.gb = { x, y }; ch = '.'; }
        lv.cells.push(ch);
      }
      return lv;
    },
    shadowDir(lv, d) {
      if (lv.mode === 'invert') return (d + 2) % 4;
      if (lv.mode === 'turn') return (d + 1) % 4;
      return d % 2 === 0 ? (d + 2) % 4 : d; // mirror: east <-> west
    },
    pass(lv, x, y, who) {
      if (x < 0 || y < 0 || x >= lv.w || y >= lv.h) return false;
      const ch = lv.cells[y * lv.w + x];
      if (ch === '#') return false;
      if (ch === 'g') return who === 0; // gold veil: only the self
      if (ch === 'v') return who === 1; // violet veil: only the shadow
      return true;
    },
    start(lv) { return { ax: lv.A.x, ay: lv.A.y, bx: lv.B.x, by: lv.B.y }; },
    step(lv, s, d) {
      const d2 = this.shadowDir(lv, d);
      const n = { ax: s.ax, ay: s.ay, bx: s.bx, by: s.by, movedA: false, movedB: false, d, d2 };
      if (this.pass(lv, s.ax + DX[d], s.ay + DY[d], 0)) { n.ax += DX[d]; n.ay += DY[d]; n.movedA = true; }
      if (this.pass(lv, s.bx + DX[d2], s.by + DY[d2], 1)) { n.bx += DX[d2]; n.by += DY[d2]; n.movedB = true; }
      return n;
    },
    solved(lv, s) { return s.ax === lv.ga.x && s.ay === lv.ga.y && s.bx === lv.gb.x && s.by === lv.gb.y; }
  };

  /* ------------------------------------------------------------------ *
   * IV. VOID — an image cut into tiles on a torus. Rows and columns slide
   * and wrap around: there is no edge.
   * ------------------------------------------------------------------ */
  BD.Void = {
    init(def) {
      const n = def.n, g = [];
      for (let i = 0; i < n * n; i++) g.push(i);
      for (const [axis, idx, k] of def.scramble) this.shift(g, n, axis, idx, k);
      return g;
    },
    shift(g, n, axis, idx, k) {
      k = ((k % n) + n) % n; if (!k) return;
      const line = [];
      for (let i = 0; i < n; i++) line.push(axis === 'r' ? g[idx * n + i] : g[i * n + idx]);
      for (let i = 0; i < n; i++) {
        const j = (i + k) % n;
        if (axis === 'r') g[idx * n + j] = line[i]; else g[j * n + idx] = line[i];
      }
    },
    count(g) { let c = 0; for (let i = 0; i < g.length; i++) if (g[i] === i) c++; return c; },
    solved(g) { return this.count(g) === g.length; }
  };

  /* ------------------------------------------------------------------ *
   * V. THREAD — draw the whole figure in one unbroken line, never
   * retracing. Wells dye the thread; dyed paths need a matching thread.
   * In mirror figures your shadow draws the reflected line as you go.
   * ------------------------------------------------------------------ */
  BD.Thread = {
    parse(def) {
      const lv = { mirror: !!def.mirror, nodes: [], edges: [], adj: [], sigma: null, esig: null };
      lv.nodes = def.nodes.map(n => ({ x: n[0], y: n[1], well: n[2] || 0 }));
      lv.adj = lv.nodes.map(() => []);
      lv.edges = def.edges.map((e, i) => {
        lv.adj[e[0]].push({ e: i, to: e[1] }); lv.adj[e[1]].push({ e: i, to: e[0] });
        return { a: e[0], b: e[1], color: e[2] || 0 };
      });
      if (lv.mirror) {
        const near = (p, q) => Math.abs(p - q) < 1e-6;
        lv.sigma = lv.nodes.map(n => lv.nodes.findIndex(m => near(m.x, -n.x) && near(m.y, n.y)));
        lv.esig = lv.edges.map(e => {
          const a = lv.sigma[e.a], b = lv.sigma[e.b];
          return lv.edges.findIndex(f => (f.a === a && f.b === b) || (f.a === b && f.b === a));
        });
      }
      return lv;
    },
    start(lv, node) {
      return { at: node, color: lv.nodes[node].well || 0, used: new Array(lv.edges.length).fill(0), hist: [], n: 0 };
    },
    edgeTo(lv, st, to) {
      for (const a of lv.adj[st.at]) if (a.to === to && this.can(lv, st, a.e)) return a.e;
      return -1;
    },
    can(lv, st, e) {
      const ed = lv.edges[e];
      if (st.used[e]) return false;
      if (ed.a !== st.at && ed.b !== st.at) return false;
      if (ed.color && ed.color !== st.color) return false;
      if (lv.mirror) { const m = lv.esig[e]; if (m !== e && st.used[m]) return false; }
      return true;
    },
    // used[e]: 0 = undrawn, else { by: 1 self | 2 shadow | 3 both, color, from }
    move(lv, st, e) {
      const ed = lv.edges[e], to = ed.a === st.at ? ed.b : ed.a;
      const h = { e, from: st.at, color: st.color, m: -1 };
      st.used[e] = { by: 1, color: st.color, from: st.at }; st.n++;
      if (lv.mirror) {
        const m = lv.esig[e];
        if (m === e) st.used[e].by = 3;
        else { st.used[m] = { by: 2, color: st.color, from: lv.sigma[st.at] }; st.n++; h.m = m; }
      }
      st.hist.push(h); st.at = to;
      if (lv.nodes[to].well) st.color = lv.nodes[to].well;
      return to;
    },
    undo(lv, st) {
      const h = st.hist.pop(); if (!h) return false;
      st.used[h.e] = 0; st.n--;
      if (h.m >= 0) { st.used[h.m] = 0; st.n--; }
      st.at = h.from; st.color = h.color; return true;
    },
    moves(lv, st) { return lv.adj[st.at].filter(a => this.can(lv, st, a.e)); },
    solved(lv, st) { return st.n === lv.edges.length; }
  };

})(typeof window !== 'undefined' ? window : globalThis);
