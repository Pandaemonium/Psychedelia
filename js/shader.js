/* THE BLOOMING DARK — the living background. One fragment shader, seven worlds. */
(function () {
  'use strict';
  const BD = window.BD = window.BD || {};

  const VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';

  const FRAG = `
precision highp float;
uniform vec2  uRes;
uniform float uTime;
uniform float uA, uB, uMix;     // scene cross-fade
uniform float uPulse;           // decaying impulse from every action
uniform float uProg;            // how close the puzzle is to solved
uniform float uFocus;           // dims the centre so the puzzle stays readable
uniform float uBloom;           // the world flowering when a puzzle opens
uniform float uKal;             // kaleidoscope fold amount
uniform float uSeg;             // kaleidoscope segments
uniform float uHue;             // palette drift
uniform float uGentle;          // softer motion
uniform vec2  uMouse;           // -1..1
uniform vec2  uOff;             // focus centre offset

#define TAU 6.28318530718

mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
// exact-integer lattice hash: identical on every GPU, so the noise has no seams
float perm(float x){ return mod((34.0 * x + 1.0) * x, 289.0); }
float hash(vec2 p){ p = mod(floor(p), 289.0); return perm(perm(p.x) + p.y) / 289.0; }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++){ v += a * noise(p); p = m * p + 17.0; a *= 0.5; }
  return v;
}
vec3 pal(float t, vec3 d){ return 0.5 + 0.5 * cos(TAU * (t + d)); }
const vec3 RAINBOW = vec3(0.0, 0.33, 0.67);
vec2 kal(vec2 p, float n){
  float a = atan(p.y, p.x), r = length(p), s = TAU / n;
  a = abs(mod(a + s * 0.5, s) - s * 0.5);
  return r * vec2(cos(a), sin(a));
}

/* 0 - the dark behind the eyelids, flowering: corolla inside corolla */
vec3 scene0(vec2 p, float t){
  float r = length(p), a = atan(p.y, p.x);
  vec2 q = kal(p * rot(t * 0.02), 6.0);
  float mist = fbm(q * 2.0 + vec2(-t * 0.06, 0.0) + 0.7 * fbm(q * 3.0 + t * 0.04));
  vec3 col = pal(mist * 0.8 + r * 0.25 - t * 0.02 + uHue + 0.72, RAINBOW) * pow(mist, 2.4) * 0.9 * exp(-r * 0.55);
  for (int i = 0; i < 7; i++){
    float fi = float(i);
    float n = 6.0 + 2.0 * mod(fi, 3.0);
    float spin = t * 0.035 * (mod(fi, 2.0) * 2.0 - 1.0) + fi * 0.37;
    float open = 0.5 + 0.5 * sin(t * 0.21 + fi * 0.9);
    float w = pow(0.5 + 0.5 * cos((a + spin) * n), 0.5 + 0.7 * open);
    float R = (0.15 + fi * 0.21) * (0.60 + 0.40 * w) * (1.0 + 0.04 * sin(t * 0.4 + fi));
    float d = r - R;
    vec3 c = pal(fi * 0.11 + 0.16 * w - t * 0.03 + uHue + 0.80, RAINBOW);
    col += c * (0.0034 / (abs(d) + 0.0034)) * 0.9;
    float inside = smoothstep(0.0, -0.20, d) * smoothstep(-0.55, -0.05, d);
    col += c * inside * 0.17;
    col += c * inside * 0.22 * pow(abs(sin((a + spin) * n * 2.0)), 24.0);
  }
  col += vec3(1.0, 0.86, 0.72) * 0.6 * exp(-r * 9.0);
  return col * (smoothstep(2.6, 0.3, r) + 0.12);
}

/* 1 - the threshold: an endless throat of turning rings, each with its gaps */
vec3 scene1(vec2 p, float t){
  float r = length(p) + 1e-4, a = atan(p.y, p.x) / TAU;
  float z = -log(r) * 1.9 + t * 0.20;
  float id = floor(z), f = fract(z);
  float h = hash(vec2(id, 7.0)), h2 = hash(vec2(id, 19.0));
  float n = 4.0 + floor(h * 5.0) * 2.0;
  float ang = a + (h2 - 0.5) * t * 0.07 + h;
  float sa = fract(ang * n);
  float gap = smoothstep(0.05, 0.09, sa) * smoothstep(0.95, 0.91, sa);
  vec3 c = pal(id * 0.085 + uHue + 0.55, RAINBOW);
  float px = r / 1.9, wl = 0.0016 + 0.0045 * r;
  float edge = smoothstep(0.0, 0.16, f) * smoothstep(1.0, 0.84, f);
  float rails = wl / (abs(f - 0.30) * px + wl) + wl / (abs(f - 0.70) * px + wl);
  float wave = 0.5 + 0.5 * sin(id * 1.9 - t * 1.3);
  vec3 col = c * rails * gap * edge * (0.55 + 0.6 * wave);
  float body = smoothstep(0.30, 0.34, f) * smoothstep(0.70, 0.66, f) * gap;
  col += c * body * (0.07 + 0.30 * wave * wave) * (0.55 + 0.45 * sin(sa * TAU * 3.0 + t));
  col += c.zxy * body * 0.5 * pow(abs(sin(sa * 3.14159)), 40.0);
  float neb = fbm(vec2(abs(a) * 9.0, z * 0.9));
  col += pal(z * 0.06 + neb * 0.5 + uHue + 0.45, RAINBOW) * neb * neb * 0.30;
  col *= smoothstep(0.0, 0.30, r) * (0.75 + 0.5 * r);
  col += vec3(0.85, 0.75, 1.0) * 0.55 * exp(-r * 9.0);
  return col;
}

/* 2 - the garden: light as a slow, growing liquid */
vec3 scene2(vec2 p, float t){
  vec2 q = p * 1.25;
  vec2 a = vec2(fbm(q + vec2(0.0, t * 0.06)), fbm(q + vec2(5.2, 1.3 - t * 0.05)));
  vec2 b = vec2(fbm(q + 3.2 * a + vec2(1.7, 9.2) + t * 0.04), fbm(q + 3.2 * a + vec2(8.3, 2.8) - t * 0.035));
  float f = fbm(q + 3.0 * b);
  vec3 col = mix(vec3(0.00, 0.06, 0.10), vec3(0.02, 0.72, 0.42), smoothstep(0.20, 0.80, f));
  col = mix(col, vec3(0.90, 0.10, 0.60), smoothstep(0.56, 1.02, length(b)) * 0.72);
  col = mix(col, vec3(1.00, 0.80, 0.20), smoothstep(0.52, 0.85, a.x) * 0.75);
  col = mix(col, vec3(0.12, 0.42, 1.00), smoothstep(0.58, 0.88, b.y) * 0.55);
  float lum = dot(col, vec3(0.3, 0.6, 0.1));
  col = mix(vec3(lum), col, 1.30);
  float vein = pow(abs(sin(f * 22.0 + b.x * 7.0)), 22.0);
  col += pal(f * 2.0 + t * 0.03 + uHue, RAINBOW) * vein * 0.55;
  return max(col, 0.0) * (0.50 + 0.85 * f);
}

/* 3 - the hall of mirrors: space folded on itself, every shard its own tint */
vec3 scene3(vec2 p, float t){
  vec2 q = p; vec3 col = vec3(0.0); float s = 1.0, par = 0.0;
  for (int i = 0; i < 6; i++){
    float fi = float(i);
    par += step(q.x, 0.0) + 2.0 * step(q.y, 0.0);
    q = abs(q) - vec2(0.62, 0.44) + 0.05 * vec2(sin(t * 0.11 + fi), cos(t * 0.13 + fi * 1.7));
    q *= rot(0.785 + 0.14 * sin(t * 0.06 + fi * 1.3));
    q *= 1.30; s *= 1.30;
    float d = min(abs(q.x), abs(q.y)) / s;
    vec3 c = pal(fi * 0.09 + length(q) * 0.05 - t * 0.02 + uHue + 0.52, vec3(0.0, 0.22, 0.45));
    col += c * (0.0030 / (d + 0.0020)) * (0.42 - fi * 0.04);
  }
  vec3 tint = pal(par * 0.173 + uHue + t * 0.012 + 0.5, vec3(0.0, 0.22, 0.45));
  float sheen = 0.5 + 0.5 * sin(q.x * 1.3 + q.y * 0.9 + t * 0.35);
  col += tint * (0.05 + 0.20 * sheen * sheen);
  return col;
}

/* 4 - the shoreless: no ground, no edge */
float stars(vec2 p, float sc, float t){
  vec2 g = p * sc, id = floor(g), f = fract(g) - 0.5;
  float h = hash(id);
  vec2 o = (vec2(hash(id + 37.0), hash(id + 91.0)) - 0.5) * 0.7;
  float tw = 0.6 + 0.4 * sin(t * (0.8 + h * 2.5) + h * 50.0);
  return step(0.62, h) * smoothstep(0.03 + 0.07 * h, 0.0, length(f - o)) * tw;
}
vec3 scene4(vec2 p, float t){
  vec2 q = p * rot(t * 0.006);
  vec2 w = vec2(fbm(q * 1.1 + vec2(t * 0.015, 0.0)), fbm(q * 1.1 + vec2(3.3, -t * 0.012)));
  float n = fbm(q * 1.4 + 2.4 * w);
  float m = pow(smoothstep(0.20, 0.78, n), 1.5);
  vec3 col = pal(n * 0.75 + w.x * 0.35 + uHue + 0.60, vec3(0.0, 0.20, 0.42)) * m * 0.85;
  col += vec3(0.030, 0.014, 0.075);
  float st = stars(q, 13.0, t) + stars(q + 7.3, 29.0, t) * 0.7 + stars(q - 2.9, 61.0, t) * 0.45;
  col += vec3(0.86, 0.90, 1.0) * st * (0.45 + 0.75 * (1.0 - m));
  float r = length(p);
  float rip = smoothstep(0.93, 1.0, sin(log(r + 0.04) * 15.0 - t * 0.45));
  col += pal(r * 0.25 + uHue + 0.68, vec3(0.0, 0.20, 0.42)) * rip * 0.06;
  return col;
}

/* 5 - the thread: ribbons of morning over the flower of life */
vec3 scene5(vec2 p, float t){
  float w0 = fbm(p * 1.3 + vec2(t * 0.03, 0.0));
  float yy = p.y + 0.32 * (w0 - 0.5);
  vec3 col = vec3(0.05, 0.02, 0.17);
  col = mix(col, vec3(0.40, 0.07, 0.44), smoothstep(1.0, 0.05, yy));
  col = mix(col, vec3(0.96, 0.22, 0.36), smoothstep(0.35, -0.55, yy));
  col = mix(col, vec3(1.00, 0.64, 0.18), smoothstep(-0.30, -1.05, yy));
  col += vec3(1.0, 0.86, 0.56) * 0.75 * exp(-length(p - vec2(0.0, -1.2)) * 1.6);
  // every circle passes through the centres of its six neighbours
  vec2 g = p * 2.3 + vec2(0.0, t * 0.02);
  const vec2 S = vec2(1.0, 1.7320508);
  vec2 ha = mod(g, S) - S * 0.5, hb = mod(g - S * 0.5, S) - S * 0.5;
  vec2 hc = dot(ha, ha) < dot(hb, hb) ? ha : hb;
  float ring = 0.0;
  for (int k = 0; k < 6; k++){
    float an = float(k) * 1.0471976;
    ring += smoothstep(0.016, 0.0, abs(length(hc - vec2(cos(an), sin(an))) - 1.0));
  }
  ring += smoothstep(0.016, 0.0, abs(length(hc) - 1.0));
  col += vec3(1.0, 0.88, 0.66) * ring * 0.10 * (0.55 + 0.45 * sin(t * 0.35 + p.x * 1.7 + p.y));
  for (int i = 0; i < 7; i++){
    float fi = float(i);
    float y = p.y - 0.78 + fi * 0.26
            + 0.17 * sin(p.x * (1.1 + fi * 0.33) + t * (0.20 + fi * 0.045) + fi * 2.1)
            + 0.24 * (fbm(vec2(p.x * 1.1 + fi * 3.1, t * 0.07 + fi * 5.0)) - 0.5);
    float w = 0.006 + 0.004 * sin(p.x * 2.6 + fi * 1.9 + t * 0.3);
    col += pal(fi * 0.075 + p.x * 0.06 + t * 0.015 + uHue + 0.02, vec3(0.0, 0.18, 0.42)) * (w / (abs(y) + w)) * 0.75;
  }
  return col * 0.78;
}

/* 6 - the morning before it leaves: a star, from very close */
vec3 scene6(vec2 p, float t){
  float r = length(p);
  vec2 dir = p / (r + 1e-4);
  const float R = 1.06;
  // the surface: slow weather under a fine boil
  vec2 w = vec2(fbm(p * 1.8 + vec2(t * 0.04, 0.0)), fbm(p * 1.8 + vec2(4.1, -t * 0.035)));
  float big = fbm(p * 1.3 + 1.6 * w);
  float g = fbm(p * 6.0 + 3.0 * w - t * 0.09);
  float g2 = noise(p * 17.0 + 6.0 * w + t * 0.15);
  float heat = smoothstep(0.24, 0.76, 0.55 * g + 0.30 * big + 0.15 * g2);
  float disc = smoothstep(R + 0.025, R - 0.025, r);
  float mu = sqrt(max(0.0, 1.0 - (r * r) / (R * R)));
  vec3 hot = mix(vec3(0.60, 0.06, 0.02), vec3(1.00, 0.34, 0.04), smoothstep(0.0, 0.5, heat));
  hot = mix(hot, vec3(1.00, 0.70, 0.14), smoothstep(0.40, 0.85, heat));
  hot = mix(hot, vec3(1.00, 0.95, 0.70), smoothstep(0.84, 1.0, heat));
  vec3 col = hot * (0.34 + 0.76 * mu) * disc;
  // the corona: streamers leaning away into the dark
  float o = max(r - R, 0.0);
  float s1 = fbm(dir * 2.6 + vec2(r * 0.9 - t * 0.10, t * 0.03));
  float s2 = fbm(dir * 6.5 - vec2(t * 0.05, r * 1.7 - t * 0.17));
  col += vec3(1.00, 0.46, 0.12) * (1.0 - disc) * exp(-o * 2.3) * (0.18 + 1.25 * s1 * s1);
  col += vec3(1.00, 0.84, 0.54) * (1.0 - disc) * exp(-o * 6.5) * (0.25 + 1.0 * s2 * s2);
  col += pal(s1 * 0.5 + uHue + 0.90, vec3(0.0, 0.12, 0.34)) * (1.0 - disc) * exp(-o * 1.0) * 0.12;
  col += vec3(1.00, 0.88, 0.60) * (0.010 / (abs(r - R) + 0.010)) * 0.6;
  return col;
}

vec3 scene(float id, vec2 p, float t){
  if (id < 0.5) return scene0(p, t);
  if (id < 1.5) return scene1(p, t);
  if (id < 2.5) return scene2(p, t);
  if (id < 3.5) return scene3(p, t);
  if (id < 4.5) return scene4(p, t);
  if (id < 5.5) return scene5(p, t);
  return scene6(p, t);
}

void main(){
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y) * 2.0;
  float r0 = length(p - uOff);
  float calm = 1.0 - 0.7 * uGentle;
  float t = uTime;

  p += uMouse * 0.035;
  p *= 1.0 + 0.022 * sin(t * 0.42) * calm;                                  // breathing
  p += normalize(p + 1e-5) * sin(length(p) * 13.0 - t * 5.5) * 0.011 * uPulse * calm;   // ripple
  float sw = uBloom * uBloom;
  p *= rot(sw * 1.1 * exp(-length(p) * 1.1) * calm);                       // the swirl of opening
  p *= 1.0 - 0.30 * sw;
  float k = clamp(max(uKal, sw * 0.9), 0.0, 1.0);
  if (k > 0.001) p = mix(p, kal(p * rot(t * 0.04), uSeg), k);

  vec3 col;
  if (uMix <= 0.001) col = scene(uA, p, t);
  else if (uMix >= 0.999) col = scene(uB, p, t);
  else col = mix(scene(uA, p, t), scene(uB, p, t), smoothstep(0.0, 1.0, uMix));

  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(lum), col, 0.78 + 0.42 * uProg);          // colour deepens as you near the answer
  col *= 0.82 + 0.34 * uProg;
  col *= 1.0 - uFocus * 0.74 * smoothstep(1.25, 0.30, r0); // quiet the centre for the puzzle
  col += col * uPulse * 0.55 * calm;
  col += (vec3(1.0, 0.90, 0.78) * exp(-r0 * 1.5) * 0.85 + col * 1.1) * sw * (1.0 - 0.5 * uGentle);

  vec2 v = gl_FragCoord.xy / uRes - 0.5;
  col *= 1.0 - dot(v, v) * 1.15;
  col = 1.0 - exp(-col * 1.6);
  col = mix(vec3(dot(col, vec3(0.299, 0.587, 0.114))), col, 1.22);
  col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + t) * 43758.5453) - 0.5) / 128.0;
  gl_FragColor = vec4(max(col, 0.0), 1.0);
}`;

  BD.Sky = class {
    constructor(canvas) {
      this.canvas = canvas; this.ok = false; this.scale = 0.7;
      const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
      if (!gl) return;
      this.gl = gl;
      const sh = (type, src) => {
        const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
        return s;
      };
      try {
        const pr = gl.createProgram();
        gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG));
        gl.linkProgram(pr);
        if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
        gl.useProgram(pr);
        const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        this.u = {};
        for (const n of ['uRes', 'uTime', 'uA', 'uB', 'uMix', 'uPulse', 'uProg', 'uFocus', 'uBloom', 'uKal', 'uSeg', 'uHue', 'uGentle', 'uMouse', 'uOff'])
          this.u[n] = gl.getUniformLocation(pr, n);
        this.ok = true;
      } catch (e) { this.error = String(e.message || e); if (window.console) console.error('shader:', this.error); }
    }
    resize(w, h, dpr) {
      this.cssW = w; this.cssH = h; this.dpr = dpr;
      const s = Math.min(dpr, 1.5) * this.scale;
      this.canvas.width = Math.max(2, Math.round(w * s)); this.canvas.height = Math.max(2, Math.round(h * s));
      if (this.ok) this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
    // drop resolution when the machine is struggling
    degrade() { if (this.scale > 0.34) { this.scale *= 0.8; this.resize(this.cssW, this.cssH, this.dpr); return true; } return false; }
    render(U) {
      if (!this.ok) return;
      const gl = this.gl, u = this.u;
      gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height);
      gl.uniform1f(u.uTime, U.time); gl.uniform1f(u.uA, U.a); gl.uniform1f(u.uB, U.b); gl.uniform1f(u.uMix, U.mix);
      gl.uniform1f(u.uPulse, U.pulse); gl.uniform1f(u.uProg, U.prog); gl.uniform1f(u.uFocus, U.focus);
      gl.uniform1f(u.uBloom, U.bloom); gl.uniform1f(u.uKal, U.kal); gl.uniform1f(u.uSeg, U.seg);
      gl.uniform1f(u.uHue, U.hue); gl.uniform1f(u.uGentle, U.gentle);
      gl.uniform2f(u.uMouse, U.mx, U.my); gl.uniform2f(u.uOff, U.offx, U.offy);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  };
})();
