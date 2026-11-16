// Proves every level in js/story.js can be solved.   Run:  node tools/verify.js
const path = require('path');
require(path.join(__dirname, '..', 'js', 'logic.js'));
require(path.join(__dirname, '..', 'js', 'story.js'));

let failed = 0;
const report = (ok, label, detail) => { if (!ok) failed++; console.log(`${ok ? '  ok ' : ' FAIL'}  ${label.padEnd(34)} ${detail}`); };

function rings(def) {
  const R = BD.Rings, n = def.n, k = def.rings, start = R.init(def).map(v => ((v % n) + n) % n);
  const key = s => s.join(','), seen = new Map([[key(start), null]]);
  let q = [start], depth = 0;
  const alignedAtStart = start.filter(v => v === 0).length;
  while (q.length) {
    const nq = [];
    for (const s of q) {
      if (s.every(v => v === 0)) {
        // also the "clockwise only" recipe used by the last hint
        const cw = []; let best = null;
        (function rec(i) {
          if (best) return;
          if (i === k) { const t = start.slice(); cw.forEach((c, j) => { for (let m = 0; m < c; m++) R.turn(def, t, j, 1); }); if (t.every(v => v % n === 0)) best = cw.slice(); return; }
          for (let c = 0; c < n; c++) { cw[i] = c; rec(i + 1); }
        })(0);
        return { ok: alignedAtStart < k, detail: `start [${start}]  shortest ${depth} turns  clockwise recipe [${best}]` };
      }
      for (let i = 0; i < k; i++) for (const d of [1, -1]) {
        const t = s.slice(); R.turn(def, t, i, d); for (let j = 0; j < k; j++) t[j] = ((t[j] % n) + n) % n;
        if (!seen.has(key(t))) { seen.set(key(t), 1); nq.push(t); }
      }
    }
    q = nq; depth++;
  }
  return { ok: false, detail: 'unsolvable' };
}

function prism(def) {
  const P = BD.Prism, lv = P.parse(def), k = lv.sockets.length, st = new Array(k).fill(0), sols = [];
  for (let i = 0, total = Math.pow(3, k); i < total; i++) {
    let v = i; for (let j = 0; j < k; j++) { st[j] = v % 3; v = (v / 3) | 0; }
    if (P.solved(lv, P.trace(lv, st).recv)) sols.push(st.join(''));
  }
  const lit = P.count(lv, P.trace(lv, new Array(k).fill(0)).recv);
  return { ok: sols.length > 0 && lit < lv.flowers.length, detail: `${k} sockets  ${sols.length} solution(s) ${sols.slice(0, 3).join(' ')}  lit at start ${lit}/${lv.flowers.length}` };
}

function twins(def) {
  const T = BD.Twins, lv = T.parse(def), s0 = T.start(lv);
  const key = s => ((s.ax * 16 + s.ay) * 16 + s.bx) * 16 + s.by, seen = new Map([[key(s0), null]]);
  let q = [s0], depth = 0;
  while (q.length) {
    const nq = [];
    for (const s of q) {
      if (T.solved(lv, s)) { let p = '', k = key(s); while (seen.get(k)) { const e = seen.get(k); p = '→↓←↑'[e.d] + ' ' + p; k = e.k; } return { ok: depth > 0, detail: `shortest ${depth} moves   ${p}` }; }
      for (let d = 0; d < 4; d++) { const n = T.step(lv, s, d), k = key(n); if (!seen.has(k)) { seen.set(k, { d, k: key(s) }); nq.push(n); } }
    }
    q = nq; depth++;
  }
  return { ok: false, detail: 'unsolvable' };
}

function voidp(def) {
  const V = BD.Void, g = V.init(def), n = def.n, start = V.count(g);
  for (const [axis, idx, k] of def.scramble.slice().reverse()) V.shift(g, n, axis, idx, -k);
  return { ok: V.solved(g) && start < n * n, detail: `${n}×${n}  ${def.scramble.length} movements  ${start}/${n * n} pieces home at start` };
}

function thread(def) {
  const T = BD.Thread, lv = T.parse(def); let total = 0, first = null; const starts = [];
  if (lv.mirror && (lv.sigma.includes(-1) || lv.esig.includes(-1))) return { ok: false, detail: 'figure is not mirror-symmetric' };
  for (let s = 0; s < lv.nodes.length && total < 5000; s++) {
    const st = T.start(lv, s), seq = [s]; let c = 0;
    (function dfs() {
      if (total + c >= 5000) return;
      if (T.solved(lv, st)) { c++; if (!first) first = seq.slice(); return; }
      for (const m of T.moves(lv, st)) { seq.push(T.move(lv, st, m.e)); dfs(); seq.pop(); T.undo(lv, st); }
    })();
    if (c) starts.push(s); total += c;
  }
  return { ok: total > 0, detail: `${lv.edges.length} lines  ${total >= 5000 ? '5000+' : total} ways  begin at [${starts}]  e.g. ${first ? first.join('›') : '-'}` };
}

const solvers = { rings, prism, twins, void: voidp, thread };
BD.CHAPTERS.forEach(ch => {
  console.log(`\n${ch.numeral}. ${ch.title}`);
  ch.levels.forEach(lv => { const r = solvers[lv.type](lv); report(r.ok, lv.name, r.detail); });
});
console.log(failed ? `\n${failed} level(s) FAILED` : '\nAll levels solvable.');
process.exit(failed ? 1 : 0);
