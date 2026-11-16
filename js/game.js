/* THE BLOOMING DARK — the director: story flow, screens, input, the frame loop. */
(function () {
  'use strict';
  const BD = window.BD, $ = s => document.querySelector(s);
  const Q = new URLSearchParams(location.search);
  const AUTO = Q.has('auto') ? (+Q.get('auto') || 700) : 0;       // dev: story advances by itself
  const COARSE = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  const WORLDS = 7;

  /* ------------------------------------------------------------ save */
  const KEY = 'blooming-dark.v1';
  const save = (() => {
    const d = { c: 0, l: 0, max: -1, done: false, muted: false,
      gentle: !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) };
    try { Object.assign(d, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* storage unavailable: play without saving */ }
    return d;
  })();
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* ignore */ } };

  /* ------------------------------------------------------------ stage */
  const el = {
    bg: $('#bg'), fx: $('#fx'), bloom: $('#bloom'), veil: $('#veil'),
    title: $('#title'), card: $('#card'), story: $('#story'), line: $('#line'),
    hud: $('#hud'), chap: $('#hud-chap'), level: $('#hud-level'), pips: $('#hud-pips'), help: $('#help'),
    menu: $('#menu'), end: $('#end'), tip: $('#wander-tip')
  };
  const sky = new BD.Sky(el.bg), audio = new BD.Audio(), sparks = new BD.Particles(800);
  const ctx = el.fx.getContext('2d'), bctx = el.bloom.getContext('2d');
  if (!sky.ok) document.body.classList.add('no-gl');
  audio.muted = save.muted;

  // what the shader sees, and where those values are heading
  const U = { time: Q.has('t') ? +Q.get('t') : 0, a: 0, b: 0, mix: 0, pulse: 0, prog: 0.3, focus: 0.3, bloom: 0, kal: 0, seg: 8, hue: 0, gentle: save.gentle ? 1 : 0, mx: 0, my: 0, offx: 0, offy: 0 };
  const T = { prog: 0.3, focus: 0.3, bloom: 0, kal: 0, mixDur: 3.5 };
  let W = 0, H = 0, DPR = 1, view = { w: 0, h: 0, cx: 0, cy: 0, size: 0 };
  let puzzle = null, current = null, alpha = 0, alphaT = 0, mode = 'title', menuOpen = false;

  function resize() {
    W = window.innerWidth; H = window.innerHeight; DPR = Math.min(window.devicePixelRatio || 1, 2);
    el.fx.width = Math.round(W * DPR); el.fx.height = Math.round(H * DPR); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    el.bloom.width = Math.ceil(W / 3); el.bloom.height = Math.ceil(H / 3);
    sky.resize(W, H, DPR);
    const top = H < 560 ? 58 : 78, bottom = H < 560 ? 70 : 104;
    view = { w: W, h: H, cx: W / 2, cy: top + (H - top - bottom) / 2, size: Math.max(180, Math.min(W - 32, H - top - bottom)) };
    U.offy = (H / 2 - view.cy) / Math.min(W, H) * 2;
    if (puzzle) puzzle.layout(view);
  }
  window.addEventListener('resize', resize);

  function setScene(i, dur) {
    const shown = U.mix >= 0.5 ? U.b : U.a;
    if (U.mix > 0 && U.b === i) return;
    if (U.mix === 0 && U.a === i) return;
    U.a = shown; U.b = i; U.mix = 0.0001; T.mixDur = dur || 3.5; audio.setScene(i);
  }

  /* The rose window. The story puts it on screen (prologue, epilogue); every chapter card carries a small one,
     lit as far inward as the night has gone. */
  const rose = { a: 0, aT: 0, lit: [0, 0, 0, 0, 0], litT: [0, 0, 0, 0, 0], sun: 0, sunT: 0, glazed: 0, glazedT: 0 };
  let emblem = null;
  function stage(w) {
    if (!w) { rose.aT = 0; el.story.classList.remove('low'); return; }
    const lit = i => (i < (w.lit || 0) ? 1 : 0);
    if (rose.a < 0.02) { for (let i = 0; i < 5; i++) rose.lit[i] = lit(i); rose.sun = w.sun || 0; rose.glazed = w.glazed || 0; }   // arrive as it should be
    for (let i = 0; i < 5; i++) rose.litT[i] = lit(i);
    rose.sunT = w.sun || 0; rose.glazedT = w.glazed || 0; rose.aT = 1; el.story.classList.add('low');
  }

  /* ------------------------------------------------------------ run control */
  let runId = 0, advance = null, skipping = false;
  class Cancel extends Error { }
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const alive = id => { if (id !== runId) throw new Cancel(); };

  function hideAll() {
    advance = null; skipping = false; emblem = null;
    for (const k of ['title', 'card', 'story', 'end', 'menu']) el[k].classList.remove('on');
    el.hud.classList.remove('on', 'quiet'); el.tip.classList.remove('on');
    stage(false);
    menuOpen = false; alphaT = 0; puzzle = null; current = null; T.bloom = 0; T.kal = 0;
  }

  /* ------------------------------------------------------------ story */
  function waitClick(minMs, revealMs) {
    return new Promise(res => {
      const t0 = performance.now(); let shown = false;
      const done = () => { if (advance === mine) advance = null; res(); };
      const mine = force => {
        if (force === true) return done();
        const dt = performance.now() - t0;
        if (dt < minMs) return;
        if (!shown && dt < revealMs) { shown = true; el.line.classList.add('instant'); return; }   // first press finishes the reveal
        done();
      };
      advance = mine;
      if (AUTO) setTimeout(() => { if (advance === mine) done(); }, AUTO);
    });
  }

  // a stage direction between two lines of story
  function direct(d) {
    if (d.win !== undefined) stage(d.win);
    if (d.scene != null) { setScene(d.scene, d.dur || 2.4); if (!skipping) U.pulse = Math.max(U.pulse, 0.9); }
    if (d.kal != null) T.kal = d.kal;
    if (d.sound && !skipping && audio[d.sound]) audio[d.sound]();
    return d.pause && !skipping ? sleep(d.pause) : null;
  }

  const VOICES = { '~': 'iris', '@': 'you', '%': 'void', '=': 'pencil' };
  async function tell(lines, id) {
    if (!lines || !lines.length) return;
    T.focus = 0.5; skipping = false; el.line.textContent = ''; el.story.classList.add('on');
    for (const raw of lines) {
      alive(id);
      if (typeof raw !== 'string') { await direct(raw); continue; }
      if (skipping) continue;
      let who = 'narr', text = raw, fx = false;
      if (text[0] === '!') { fx = true; text = text.slice(1); }
      if (VOICES[text[0]]) { who = VOICES[text[0]]; text = text.slice(1); }
      el.line.className = who; el.line.textContent = '';
      const words = text.split(' ');
      words.forEach((w, i) => {
        const s = document.createElement('span'); s.textContent = w; s.style.animationDelay = (i * 58) + 'ms';
        el.line.appendChild(s); el.line.appendChild(document.createTextNode(' '));
      });
      if (who === 'iris') audio.sigh(audio.freq(Math.floor(Math.random() * 5), 2), 0.05, 2.6);
      else if (who === 'void') audio.sigh(audio.freq(Math.floor(Math.random() * 3), 1), 0.045, 3.4);
      else if (who === 'pencil') { audio.tick(); audio.chime(4, 0.05, 2); }
      else audio.chime(Math.floor(Math.random() * 3), 0.035, 1);
      if (fx) { el.veil.classList.remove('flash'); void el.veil.offsetWidth; el.veil.classList.add('flash'); audio.bloom(); }
      await waitClick(350, words.length * 58 + 650);
      alive(id);
      el.line.classList.add('out'); await sleep(skipping ? 200 : 360);
    }
    alive(id);
    skipping = false;
    el.story.classList.remove('on');
    await sleep(350);
  }

  async function card(ch, id) {
    el.card.innerHTML = '';
    const cv = document.createElement('canvas'), px = Math.round(150 * DPR);
    cv.className = 'rose'; cv.width = cv.height = px; el.card.appendChild(cv);
    emblem = { ctx: cv.getContext('2d'), px, lit: BD.CHAPTERS.indexOf(ch) };
    for (const [cls, txt] of [['num', ch.numeral], ['ttl', ch.title], ['epi' + (ch.struck ? ' struck' : ''), ch.epigraph], ['src', ch.source]]) {
      if (!txt) continue;
      const d = document.createElement('div'); d.className = cls; d.textContent = txt; el.card.appendChild(d);
    }
    T.focus = 0.55; el.card.classList.add('on'); audio.bloom(); U.pulse = 0.8;
    const click = waitClick(900, 0), mine = advance;
    await Promise.race([sleep(AUTO ? AUTO : 7500), click]);
    alive(id); if (advance === mine) advance = null;
    el.card.classList.remove('on'); await sleep(1000); alive(id);
    emblem = null;
  }

  /* ------------------------------------------------------------ puzzle */
  let helpText = '', whisperTimer = 0, hintIdx = 0;
  function setHelp(t, iris) {
    el.help.classList.add('swap');
    setTimeout(() => { el.help.textContent = t; el.help.classList.toggle('iris', !!iris); el.help.classList.remove('swap'); }, 230);
  }
  function whisper(t, ms) {
    setHelp(t, true); clearTimeout(whisperTimer);
    whisperTimer = setTimeout(() => setHelp(helpText, false), ms || 13000);
  }
  function fmtHelp(t) {
    t = t.replace('{Click}', COARSE ? 'Tap' : 'Click').replace('{click}', COARSE ? 'tap' : 'click');
    if (COARSE) t = t.replace(' · right-click turns it back', '').replace('Rest the pointer on a ring', 'Follow the tethers at the bottom').replace('Arrow keys or swipe', 'Swipe, or tap beside yourself');
    return t;
  }
  const levelIndex = (c, l) => c * 3 + l;       // every chapter but the last has three
  function setHud(c, l) {
    const ch = BD.CHAPTERS[c];
    el.chap.textContent = ch.numeral + ' · ' + ch.title; el.level.textContent = ch.levels[l].name;
    el.pips.innerHTML = '';
    ch.levels.forEach((_, i) => { const p = document.createElement('i'); p.className = i < l ? 'done' : i === l ? 'now' : ''; el.pips.appendChild(p); });
  }

  async function playLevel(c, l, id) {
    const ch = BD.CHAPTERS[c], def = ch.levels[l];
    save.c = c; save.l = l; save.max = Math.max(save.max, levelIndex(c, l)); persist();
    setHud(c, l); hintIdx = 0; clearTimeout(whisperTimer);
    helpText = fmtHelp(def.help || ''); el.help.textContent = helpText; el.help.classList.remove('iris');
    let won; const winP = new Promise(r => { won = r; });
    const api = {
      pulse: v => { U.pulse = Math.min(1.3, U.pulse + v); },
      chime: (d, v, o) => audio.chime(d, v, o), tick: () => audio.tick(), thud: () => audio.thud(),
      burst: (x, y, o) => sparks.burst(x, y, o.n || 20, o), say: t => whisper(t, 9000), win: () => won()
    };
    puzzle = new BD.puzzles[def.type](def, api); puzzle.layout(view);
    current = { c, l, def, win: won };
    T.focus = 1; alphaT = 1; el.hud.classList.remove('quiet'); el.hud.classList.add('on');
    await winP; alive(id);

    // it opens
    el.hud.classList.add('quiet'); audio.solve(); T.bloom = 1; U.pulse = 1.2;
    sparks.burst(view.cx, view.cy, 110, { hue: ch.hue, hueSpread: 140, speed: 420, life: 2, size: 2.6, radius: view.size * 0.2, drag: 1.1 });
    await sleep(1700); alive(id);
    T.bloom = 0; await sleep(800); alive(id);
    alphaT = 0; T.focus = 0.35; el.hud.classList.remove('on');
    await sleep(950); alive(id);
    puzzle = null; current = null;
  }

  async function run(c0, l0, fresh) {
    const id = ++runId;
    hideAll(); mode = 'play';
    try {
      await sleep(700); alive(id);
      if (fresh) { setScene(0); await tell(BD.PROLOGUE, id); }
      for (let c = c0; c < BD.CHAPTERS.length; c++) {
        const ch = BD.CHAPTERS[c], from = c === c0 ? l0 : 0;
        setScene(ch.scene); T.kal = 0;
        if (from === 0) { await card(ch, id); await tell(ch.intro, id); }
        for (let l = from; l < ch.levels.length; l++) {
          await playLevel(c, l, id);
          await tell(ch.levels[l].after, id);
        }
        if (ch.outro && ch.outro.length) {
          audio.bloom(); T.kal = 0.75; U.pulse = 1;        // the chapter's world folds into a flower
          await tell(ch.outro, id);
        }
      }
      save.done = true; save.c = 0; save.l = 0; save.max = Math.max(save.max, BD.CHAPTERS.length * 3 - 1); persist();
      T.kal = 0; setScene(5);
      await tell(BD.EPILOGUE, id);
      mode = 'end'; T.focus = 0.4; el.end.classList.add('on');
    } catch (e) { if (!(e instanceof Cancel)) throw e; }
  }

  function toTitle() {
    ++runId; hideAll(); mode = 'title'; setScene(0); T.focus = 0.3; T.prog = 0.3;
    $('#btn-continue').hidden = !(save.max >= 0 && !(save.c === 0 && save.l === 0));
    $('#btn-chapters').hidden = save.max < 0;
    el.title.classList.add('on');
  }

  function wander() {
    ++runId; hideAll(); mode = 'wander'; T.focus = 0; T.kal = 1; T.prog = 0.8; el.tip.classList.add('on');
  }

  /* ------------------------------------------------------------ menu */
  function buildMenu() {
    const box = $('#menu-chapters'); box.innerHTML = '';
    BD.CHAPTERS.forEach((ch, c) => {
      const row = document.createElement('div'); row.className = 'row';
      const reached = save.max >= levelIndex(c, 0);
      const h = document.createElement('div'); h.className = 'name';
      const n = document.createElement('b'); n.textContent = ch.numeral; h.appendChild(n);
      h.appendChild(document.createTextNode(reached ? ch.title : '· · ·')); row.appendChild(h);
      const lv = document.createElement('div'); lv.className = 'lv';
      ch.levels.forEach((d, l) => {
        const b = document.createElement('button'), open = save.max >= levelIndex(c, l);
        b.textContent = open ? d.name : '—'; b.disabled = !open;
        if (current && current.c === c && current.l === l) b.className = 'now';
        b.addEventListener('click', () => { audio.start(); closeMenu(); run(c, l, false); });
        lv.appendChild(b);
      });
      row.appendChild(lv); box.appendChild(row);
    });
    $('#m-wander').hidden = !save.done;
  }
  function openMenu() { if (save.max < 0 && mode === 'title') return; buildMenu(); syncOpts(); menuOpen = true; el.menu.classList.add('on'); }
  function closeMenu() { menuOpen = false; el.menu.classList.remove('on'); }

  function syncOpts() {
    document.querySelectorAll('.opt-gentle').forEach(i => { i.checked = save.gentle; });
    document.querySelectorAll('.opt-sound').forEach(i => { i.checked = !save.muted; });
    $('#b-sound').classList.toggle('off', save.muted);
    U.gentle = save.gentle ? 1 : 0; document.body.classList.toggle('gentle', save.gentle);
  }
  function setSound(on) { save.muted = !on; audio.setMuted(save.muted); persist(); syncOpts(); }
  function setGentle(on) { save.gentle = on; persist(); syncOpts(); }
  document.querySelectorAll('.opt-gentle').forEach(i => i.addEventListener('change', () => setGentle(i.checked)));
  document.querySelectorAll('.opt-sound').forEach(i => i.addEventListener('change', () => { audio.start(); setSound(i.checked); }));

  /* ------------------------------------------------------------ actions */
  const canPlay = () => puzzle && !puzzle.solved && !menuOpen && alpha > 0.6 && mode === 'play';
  function doHint() {
    if (!canPlay()) return;
    const hs = current.def.hints || []; if (!hs.length) return;
    whisper(hs[Math.min(hintIdx, hs.length - 1)], 16000); hintIdx++;
    audio.sigh(audio.freq(2 + hintIdx, 2), 0.06, 2.4);
  }
  function doUndo() { if (canPlay() && puzzle.undo()) { audio.tick(); U.pulse += 0.1; } }
  function doReset() { if (canPlay()) { puzzle.reset(); audio.thud(); U.pulse += 0.25; } }
  function fullscreen() {
    const d = document;
    if (d.fullscreenElement) d.exitFullscreen(); else if (d.documentElement.requestFullscreen) d.documentElement.requestFullscreen().catch(() => { });
  }

  const on = (sel, fn) => $(sel).addEventListener('click', e => { e.stopPropagation(); fn(e); });
  on('#btn-begin', () => { audio.start(); save.c = 0; save.l = 0; persist(); run(0, 0, true); });
  on('#btn-continue', () => { audio.start(); run(save.c, save.l, false); });
  on('#btn-chapters', openMenu);
  on('#b-hint', doHint); on('#b-undo', doUndo); on('#b-reset', doReset);
  on('#b-sound', () => { audio.start(); setSound(save.muted); });
  on('#b-menu', () => menuOpen ? closeMenu() : openMenu());
  on('#m-resume', closeMenu);
  on('#m-title', () => { closeMenu(); toTitle(); });
  on('#m-full', fullscreen);
  on('#m-wander', () => { closeMenu(); wander(); });
  on('#e-wander', wander);
  on('#e-again', () => run(0, 0, true));
  on('#skip', () => { skipping = true; if (advance) advance(true); });
  $('#skip').addEventListener('pointerdown', e => e.stopPropagation());
  el.menu.addEventListener('click', e => { if (e.target === el.menu) closeMenu(); });
  el.story.addEventListener('pointerdown', () => { audio.start(); if (advance) advance(); });
  el.card.addEventListener('pointerdown', () => { if (advance) advance(); });

  /* ------------------------------------------------------------ pointer & keys */
  const at = e => { const r = el.fx.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  el.fx.addEventListener('pointerdown', e => {
    audio.start();
    if (mode === 'wander') { U.pulse = 1.2; setScene((Math.round(U.mix > 0 ? U.b : U.a) + 1) % WORLDS, 2.5); return; }
    if (!canPlay()) return;
    try { el.fx.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointers cannot be captured */ }
    const [x, y] = at(e); puzzle.onDown(x, y, e); e.preventDefault();
  });
  el.fx.addEventListener('pointermove', e => { if (canPlay()) { const [x, y] = at(e); puzzle.onMove(x, y, e); } });
  const up = e => { if (puzzle && !menuOpen) { const [x, y] = at(e); puzzle.onUp(x, y, e); } };
  el.fx.addEventListener('pointerup', up); el.fx.addEventListener('pointercancel', up);
  el.fx.addEventListener('pointerleave', () => { if (puzzle) puzzle.onLeave(); });
  el.fx.addEventListener('contextmenu', e => e.preventDefault());
  window.addEventListener('pointermove', e => { U.mx = (e.clientX / W) * 2 - 1; U.my = 1 - (e.clientY / H) * 2; });

  window.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.code;
    if (menuOpen) { if (k === 'Escape') closeMenu(); return; }
    if (mode === 'wander') {
      if (k === 'Escape') toTitle();
      else if (/^Digit[1-7]$/.test(k)) setScene(+k.slice(5) - 1, 2.5);
      else if (k === 'KeyK') T.kal = T.kal > 0.5 ? 0 : 1;
      else if (k === 'Space') { U.pulse = 1.2; e.preventDefault(); }
      return;
    }
    if (advance && (k === 'Space' || k === 'Enter' || k === 'ArrowRight')) { advance(); e.preventDefault(); return; }
    if (canPlay()) {
      if (puzzle.onKey(e)) { e.preventDefault(); return; }
      if (k === 'KeyR') return doReset();
      if (k === 'KeyZ' || k === 'KeyU' || k === 'Backspace') return doUndo();
      if (k === 'KeyH') return doHint();
    }
    if (k === 'KeyM') { audio.start(); setSound(save.muted); }
    else if (k === 'KeyF') fullscreen();
    else if (k === 'Escape') openMenu();
  });

  /* ------------------------------------------------------------ frame */
  let last = performance.now() / 1000, slow = 0, frames = 0, lastShow = -1;
  function frame(nowMs) {
    const now = nowMs / 1000, dt = Math.min(0.05, Math.max(0.001, now - last)); last = now;
    U.time += dt * (save.gentle ? 0.55 : 1);
    U.pulse *= Math.exp(-3 * dt);
    if (U.mix > 0) { U.mix += dt / T.mixDur; if (U.mix >= 1) { U.a = U.b; U.mix = 0; } }
    if (puzzle) { T.prog = puzzle.progress; }
    else if (mode === 'play') T.prog = 0.35;
    else if (mode === 'end') T.prog = 0.75;
    U.prog = BD.damp(U.prog, T.prog, 2.2, dt);
    U.focus = BD.damp(U.focus, T.focus, 2, dt);
    U.bloom = BD.damp(U.bloom, T.bloom, T.bloom > U.bloom ? 2.4 : 1.3, dt);
    U.kal = BD.damp(U.kal, T.kal, 0.9, dt);
    if (mode === 'wander') { U.seg = 3 + Math.round((U.mx + 1) * 4.5); U.hue = U.my * 0.25 + U.time * 0.01; }
    else { U.seg = 8; U.hue = 0.03 * Math.sin(U.time * 0.07) + 0.06 * U.prog; }
    sky.render(U);

    rose.a = BD.damp(rose.a, rose.aT, rose.aT ? 1.1 : 2.4, dt);
    rose.sun = BD.damp(rose.sun, rose.sunT, 1.1, dt); rose.glazed = BD.damp(rose.glazed, rose.glazedT, 1.6, dt);
    for (let i = 0; i < 5; i++) rose.lit[i] = BD.damp(rose.lit[i], rose.litT[i], 1.1, dt);

    ctx.clearRect(0, 0, W, H);
    if (puzzle) { puzzle.update(dt); puzzle.draw(ctx, now); audio.setIntensity(puzzle.progress); }
    else if (rose.a > 0.01) BD.rose(ctx, W / 2, H * 0.37, Math.min(W * 0.43, H * 0.30), { lit: rose.lit, sun: rose.sun, glazed: rose.glazed, t: now });
    sparks.update(dt); sparks.draw(ctx);
    alpha = BD.damp(alpha, alphaT, 4.5, dt);
    const show = Math.max(alpha, puzzle ? 0 : rose.a);
    if (Math.abs(show - lastShow) > 0.004) { lastShow = show; el.fx.style.opacity = show.toFixed(3); el.bloom.style.opacity = (show * 0.9).toFixed(3); }
    if (show > 0.01) { bctx.clearRect(0, 0, el.bloom.width, el.bloom.height); bctx.drawImage(el.fx, 0, 0, el.bloom.width, el.bloom.height); }

    if (emblem) {                // the little window on the chapter card
      const e = emblem, lit = [0, 1, 2, 3, 4].map(i => (i < e.lit ? 1 : 0));
      e.ctx.clearRect(0, 0, e.px, e.px);
      BD.rose(e.ctx, e.px / 2, e.px / 2, e.px * 0.38, { lit, sun: 0, t: now });
    }

    // if the machine is struggling, quietly lower the background resolution
    frames++; if (dt > 0.03) slow++;
    if (frames >= 90) { if (slow > 45 && now > 4) sky.degrade(); frames = 0; slow = 0; }
    requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------ begin */
  (function logo() {
    const h = $('#logo'); let k = 0;
    BD.TITLE.split(' ').forEach(word => {
      const w = document.createElement('span'); w.className = 'w';
      for (const chr of word) {
        const s = document.createElement('span'); s.textContent = chr;
        s.style.animationDelay = (-k * 0.42) + 's, ' + (-k * 0.31) + 's'; k++; w.appendChild(s);
      }
      h.appendChild(w); h.appendChild(document.createTextNode(' '));
    });
  })();
  $('#end .sub').textContent = BD.SIGNOFF;
  resize(); syncOpts();

  // dev shortcuts: ?scene=3  ·  ?go=2.1 (chapter.level; ?go=7 is the epilogue)  ·  &solve=ms  ·  &auto=ms  ·  &rose=lit.sun.glazed
  BD.dev = { U, T, rose, get puzzle() { return puzzle; }, get mode() { return mode; }, run, wander, stage, win: () => { if (current && puzzle && !puzzle.solved) { puzzle.solved = true; current.win(); } } };
  if (Q.has('scene')) {
    ++runId; hideAll(); mode = 'scene'; U.a = U.b = +Q.get('scene'); T.focus = +Q.get('focus') || 0; if (Q.has('kal')) T.kal = U.kal = +Q.get('kal');
    if (Q.has('rose')) { const [lit, sun, glazed] = Q.get('rose').split('.').map(Number); stage({ lit, sun, glazed }); }
  }
  else if (Q.has('go')) {
    const [c, l] = Q.get('go').split('.').map(n => Math.max(0, (+n || 1) - 1)), ch = BD.CHAPTERS[c];
    U.a = U.b = ch ? ch.scene : 5; run(ch ? c : BD.CHAPTERS.length, ch ? Math.min(l, ch.levels.length - 1) : 0, false);
    if (Q.has('solve')) setTimeout(() => BD.dev.win(), +Q.get('solve'));
  }
  else toTitle();
  requestAnimationFrame(frame);
})();
