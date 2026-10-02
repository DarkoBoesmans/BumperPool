// three.js: renderer with the PS2 pass, the table, balls, cue and camera. The café around it lives in cafe.js.
import * as THREE from "../vendor/three.module.min.js";
import {
  R,
  DOP_R,
  HX,
  HY,
  GOAL_X,
  GOAL_R,
  DD_X,
  DD_Y,
  DOPS,
  VL,
  VLIEG,
  QUART,
  KLEIN_TOP,
  START,
  COLORS,
  att,
  home,
  spots,
} from "./game.js";

export { THREE };
export const M = 0.001; // mm to metres
export const FLOOR = -0.76; // floor height below the cloth (m)
export const S = { lines: true };
export const camS = { mode: "intro", az: 0.6, el: 0.5, dist: 3, replay: null };
const reduced =
  typeof matchMedia === "function" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- small helpers, shared with cafe.js ----------
export const lam = (color, o = {}) =>
  new THREE.MeshLambertMaterial({ color, ...o });
export const basic = (color, o = {}) =>
  new THREE.MeshBasicMaterial({ color, ...o });
export const phong = (color, o = {}) =>
  new THREE.MeshPhongMaterial({ color, ...o });
export function facet(geo) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  g.computeVertexNormals();
  return g;
} // per-face normals: the low-poly look
export function canvasTex(w, h, draw, o = {}) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv);
  if (o.repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(o.repeat[0], o.repeat[1]);
  }
  if (o.pixel) {
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
  }
  return t;
}
export function add(parent, geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
export const V = (x, y, h = R * M) => new THREE.Vector3(x * M, h, y * M);

// ---------- renderer and the camera effects ----------
// Pass 1 renders the café into a low-resolution target (the PS2 slider sets how low).
// Pass 2 (only with motion blur) blends it with the previous frame, the way PS2 games faked motion blur.
// Pass 3 adds bloom, lens flares from the lamps, chromatic aberration, grain, vignette and the PS2 dither, each with its own slider.
export const FX_DEFAULTS = {
  ps2: 60,
  bloom: 50,
  flare: 35,
  grain: 25,
  vignette: 55,
  blur: 0,
  chroma: 15,
};
S.fx = { ...FX_DEFAULTS };
S.flares = []; // { pos: Vector3, k: strength, vis: () => bool }, filled by cafe.js
const NLIGHTS = 6;
const POST_VS =
  "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }";
const BLEND_FS =
  "uniform sampler2D cur, prev; uniform float amt; varying vec2 vUv; void main(){ gl_FragColor = vec4(mix(texture2D(cur, vUv).rgb, texture2D(prev, vUv).rgb, amt), 1.); }";
const POST_FS = `
uniform sampler2D t; uniform vec2 res; uniform float time, aspect, ps2, bloom, flare, grain, vig, chroma;
uniform vec3 lights[${NLIGHTS}];
varying vec2 vUv;
float b2(vec2 a){ a = floor(a); return fract(a.x * .5 + a.y * a.y * .75); }
float bayer(vec2 a){ return b2(.5 * a) * .25 + b2(a); }
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec3 tex(vec2 uv){ return texture2D(t, clamp(uv, .001, .999)).rgb; }
void main(){
  vec2 uv = vUv, d = uv - .5;
  vec3 c = tex(uv);
  if (chroma > 0.) { vec2 o = d * chroma * .02; c = vec3(tex(uv + o).r, c.g, tex(uv - o).b); }
  if (bloom > 0.) {
    vec3 g = vec3(0.); vec2 px = vec2(.0085 / aspect, .0085);
    for (int i = -2; i <= 2; i++) for (int j = -2; j <= 2; j++) g += max(tex(uv + vec2(float(i), float(j)) * px) - .68, 0.);
    c += g * .085 * bloom;
  }
  if (flare > 0.) for (int i = 0; i < ${NLIGHTS}; i++) {
    vec3 L = lights[i];
    if (L.z <= 0.) continue;
    float k = L.z * flare * smoothstep(.5, .88, dot(tex(L.xy), vec3(.3, .59, .11)));   // a lamp hidden behind something is dark here: no flare
    if (k <= 0.) continue;
    vec2 q = uv - L.xy; q.x *= aspect;
    float r = length(q);
    c += vec3(1., .82, .55) * k * .016 / (r * r * 40. + .016);                          // halo
    c += vec3(1., .72, .42) * k * .3 * exp(-abs(q.y) * 240.) * exp(-abs(q.x) * 2.4);    // anamorphic streak
    vec2 ax = vec2(.5) - L.xy;
    for (int j = 0; j < 4; j++) {                                                       // ghosts on the line through the centre
      float f = float(j), sz = .02 + .024 * fract(f * .618 + .3);
      vec2 gq = uv - (L.xy + ax * (.7 + f * .5)); gq.x *= aspect;
      c += vec3(.55 + .35 * sin(f * 2.1), .5 + .3 * sin(f * 1.3 + 1.), .45 + .35 * cos(f)) * k * .07 * smoothstep(sz, sz * .55, length(gq));
    }
  }
  c = pow(max(c, 0.), vec3(.94, .98, 1.08)) * vec3(1.04, 1., .93);                     // warm, smoky grade
  if (vig > 0.) c *= mix(1., smoothstep(.95, .28, length(d * vec2(aspect * .75, 1.))), vig * .9);
  if (grain > 0.) c += (hash(floor(uv * res) + fract(time * 7.13) * 91.7) - .5) * grain * .16;
  if (ps2 > 0.) {
    float lv = mix(64., 12., ps2);
    vec3 q = floor(c * lv + .5 + (bayer(gl_FragCoord.xy) - .5) * min(1., ps2 * 1.5)) / lv;   // fewer colours with an ordered dither
    c = mix(c, q, min(1., ps2 * 2.));
    c *= 1. - .12 * ps2 + .12 * ps2 * mod(floor(gl_FragCoord.y), 2.);                     // scanlines
  }
  gl_FragColor = vec4(c, 1.);
}`;

export function initScene(stage) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
  } catch {
    return false;
  }
  S.renderer = renderer;
  renderer.setPixelRatio(1);
  stage.appendChild(renderer.domElement);
  renderer.domElement.setAttribute("aria-label", "Golfbiljart table in a café");
  const scene = (S.scene = new THREE.Scene());
  scene.background = new THREE.Color(0x120a07);
  scene.fog = new THREE.Fog(0x120a07, 4.5, 12);
  S.camera = new THREE.PerspectiveCamera(40, 1, 0.04, 40);
  S.camera.position.set(2.4, 1.4, 1.6);
  S.look = new THREE.Vector3();
  const rt = () =>
    new THREE.WebGLRenderTarget(2, 2, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      stencilBuffer: true,
    }); // stencil gives a 24-bit depth buffer; 16 bits made the wall boards flicker
  S.rt = rt();
  S.acc = [rt(), rt()];
  const quad = (mat) => {
    const sc = new THREE.Scene();
    sc.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
    return sc;
  };
  S.post = new THREE.ShaderMaterial({
    uniforms: {
      t: { value: S.rt.texture },
      res: { value: new THREE.Vector2(2, 2) },
      time: { value: 0 },
      aspect: { value: 1 },
      ps2: { value: 0 },
      bloom: { value: 0 },
      flare: { value: 0 },
      grain: { value: 0 },
      vig: { value: 0 },
      chroma: { value: 0 },
      lights: {
        value: Array.from({ length: NLIGHTS }, () => new THREE.Vector3()),
      },
    },
    vertexShader: POST_VS,
    fragmentShader: POST_FS,
    depthTest: false,
    depthWrite: false,
  });
  S.blend = new THREE.ShaderMaterial({
    uniforms: {
      cur: { value: null },
      prev: { value: null },
      amt: { value: 0 },
    },
    vertexShader: POST_VS,
    fragmentShader: BLEND_FS,
    depthTest: false,
    depthWrite: false,
  });
  S.postScene = quad(S.post);
  S.blendScene = quad(S.blend);
  S.postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  buildTable(scene);
  S.ray = new THREE.Raycaster();
  S.ndc = new THREE.Vector2();
  S.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -R * M);
  new ResizeObserver(resize).observe(stage);
  setFx(S.fx);
  return true;
}

export function resize() {
  const c = S.renderer.domElement,
    w = c.clientWidth || innerWidth,
    h = c.clientHeight || innerHeight;
  if (!w || !h) return;
  S.w = w;
  S.h = h;
  const full = h * Math.min(devicePixelRatio || 1, 1.5),
    i = S.fx.ps2 / 100;
  const bh = Math.round(Math.min(full, full * (1 - i) + 260 * i)),
    bw = Math.round((bh * w) / h); // full PS2 is 260 lines, stretched by CSS with pixelated scaling
  S.renderer.setSize(bw, bh, false);
  for (const t of [S.rt, ...S.acc]) t.setSize(bw, bh);
  S.post.uniforms.res.value.set(bw, bh);
  S.post.uniforms.aspect.value = w / h;
  S.bh = bh;
  S.accLive = false;
  S.camera.aspect = w / h;
  S.camera.fov = w < h ? 58 : 42;
  S.camera.updateProjectionMatrix();
}
// fx: values 0..100 per effect (see FX_DEFAULTS).
export function setFx(fx) {
  const ps2Changed = fx.ps2 !== S.lastPs2;
  S.fx = { ...FX_DEFAULTS, ...fx };
  S.lastPs2 = S.fx.ps2;
  const u = S.post.uniforms,
    f = S.fx;
  u.ps2.value = f.ps2 / 100;
  u.bloom.value = f.bloom / 100;
  u.flare.value = f.flare / 100;
  u.grain.value = f.grain / 100;
  u.vig.value = f.vignette / 100;
  u.chroma.value = f.chroma / 100;
  S.renderer.domElement.style.imageRendering = f.ps2 > 0 ? "pixelated" : "auto";
  if (ps2Changed) resize();
}

const lp = new THREE.Vector3();
export function render(now = 0) {
  const r = S.renderer,
    f = S.fx,
    u = S.post.uniforms;
  r.setRenderTarget(S.rt);
  r.render(S.scene, S.camera);
  let src = S.rt.texture;
  if (f.blur > 0) {
    const [prev, next] = S.acc;
    S.blend.uniforms.cur.value = S.rt.texture;
    S.blend.uniforms.prev.value = prev.texture;
    S.blend.uniforms.amt.value = S.accLive ? (f.blur / 100) * 0.88 : 0;
    S.accLive = true;
    r.setRenderTarget(next);
    r.render(S.blendScene, S.postCam);
    S.acc = [next, prev];
    src = next.texture;
  } else S.accLive = false;
  u.t.value = src;
  u.time.value = now / 1000;
  for (let i = 0; i < NLIGHTS; i++) {
    const L = S.flares[i],
      out = u.lights.value[i];
    out.z = 0;
    if (!L || f.flare <= 0 || !L.vis()) continue;
    lp.copy(L.pos).project(S.camera);
    const edge = Math.max(Math.abs(lp.x), Math.abs(lp.y));
    if (lp.z < 1 && edge < 1.05)
      out.set(
        (lp.x + 1) / 2,
        (lp.y + 1) / 2,
        L.k * Math.min(1, (1.05 - edge) * 6),
      );
  }
  r.setRenderTarget(null);
  r.render(S.postScene, S.postCam);
}

// Screen point to a point on the table plane (mm), or null.
export function toTable(e) {
  const r = S.renderer.domElement.getBoundingClientRect();
  S.ndc.set(
    ((e.clientX - r.left) / r.width) * 2 - 1,
    -((e.clientY - r.top) / r.height) * 2 + 1,
  );
  S.ray.setFromCamera(S.ndc, S.camera);
  const p = new THREE.Vector3();
  return S.ray.ray.intersectPlane(S.plane, p)
    ? { x: p.x / M, y: p.z / M }
    : null;
}
// World point to screen pixels (for speech bubbles).
export function toScreen(v) {
  const p = v.clone().project(S.camera);
  return {
    x: ((p.x + 1) / 2) * S.w,
    y: ((1 - p.y) / 2) * S.h,
    behind: p.z > 1,
  };
}

// ---------- the cloth: lines, marks and baked lamp light ----------
export function drawTable(c, o = {}) {
  const L = (a, b, d, e) => {
    c.beginPath();
    c.moveTo(a, b);
    c.lineTo(d, e);
    c.stroke();
  };
  const ring = (x, y, r) => {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
  };
  const poly = (pts, fill) => {
    c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    c.fillStyle = fill;
    c.fill();
  };
  const U = (u, v) => [HX - u, v];
  const k = c.getTransform().a,
    lw = Math.max(3, 1.4 / k);
  c.fillStyle = o.felt || "#1d6a63";
  c.fillRect(-HX, -HY, 2 * HX, 2 * HY);
  if (o.noise) c.drawImage(o.noise, -HX, -HY, 2 * HX, 2 * HY);
  if (o.zone === "stootlijn") {
    poly(
      [U(0, -HY), U(HX, -HY), U(KLEIN_TOP, 0), U(HX, HY), U(0, HY)],
      "rgba(208,81,58,.5)",
    );
    poly(
      [
        U(0, -DD_Y),
        U(HX - DD_X, -DD_Y),
        U(KLEIN_TOP, 0),
        U(HX - DD_X, DD_Y),
        U(0, DD_Y),
      ],
      "rgba(139,209,160,.75)",
    );
  }
  if (o.zone === "vlieg") {
    c.fillStyle = "rgba(242,162,92,.55)";
    c.fillRect(-HX, VL, 2 * HX, VLIEG);
    c.fillRect(-HX, -HY, 2 * HX, VLIEG);
  }
  if (o.zone === "triangle")
    poly([U(0, 0), U(QUART, VL), U(QUART, -VL)], "rgba(242,162,92,.5)");
  if (o.lines) {
    c.strokeStyle = "rgba(238,244,238,.6)";
    c.lineWidth = lw;
    c.setLineDash([]);
    for (const y of [-VL, VL, -180, 180]) L(-HX, y, HX, y);
    L(0, -HY, 0, HY);
    c.beginPath();
    c.moveTo(90, 0);
    c.lineTo(0, 90);
    c.lineTo(-90, 0);
    c.lineTo(0, -90);
    c.closePath();
    c.stroke();
    for (const g of [1, -1]) {
      L(g * GOAL_X, 0, g * QUART, VL);
      L(g * GOAL_X, 0, g * QUART, -VL);
      const top = g * (HX - KLEIN_TOP);
      L(g * DD_X, DD_Y, top, 0);
      L(g * DD_X, -DD_Y, top, 0);
      L(0, HY, top, 0);
      L(0, -HY, top, 0);
    }
    c.setLineDash([16, 12]);
    for (const x of [-QUART, QUART]) {
      L(x, 180, x, HY);
      L(x, -180, x, -HY);
    }
    c.setLineDash([]);
    for (const col of COLORS)
      START.slice(0, 4).forEach((p) => {
        const x = home(col) * p.x;
        L(x - 12, p.y, x + 12, p.y);
        L(x, p.y - 12, x, p.y + 12);
      });
  }
  if (!o.three)
    for (const h of [1, -1]) {
      ring(h * GOAL_X, 0, GOAL_R);
      c.fillStyle = "#050505";
      c.fill();
      ring(h * GOAL_X, 0, 37);
      c.lineWidth = o.zone === "goals" ? 12 : 7;
      c.strokeStyle = h === 1 ? "#efe7d4" : "#d9423f";
      c.stroke();
      DOPS.forEach((d) => {
        ring(d.x, d.y, DOP_R);
        c.fillStyle = "#b3392c";
        c.fill();
        ring(d.x, d.y, 10);
        c.fillStyle = "#d7dadd";
        c.fill();
      });
    }
  (o.marks || []).forEach((m) => {
    c.setLineDash(m.dash || []);
    ring(m.x, m.y, m.r);
    c.lineWidth = m.w || 5;
    c.strokeStyle = m.color;
    c.stroke();
    c.setLineDash([]);
  });
  const pens = o.zone === "penalty" ? spots("W") : o.pens || [];
  if (pens.length) {
    c.font = '700 36px "Chakra Petch", monospace';
    c.textAlign = "center";
    c.textBaseline = "middle";
    pens.forEach((p) => {
      ring(p.x, p.y, R);
      c.fillStyle = "rgba(242,162,92,.4)";
      c.fill();
      c.setLineDash([8, 6]);
      c.lineWidth = 5;
      c.strokeStyle = "#ffb347";
      c.stroke();
      c.setLineDash([]);
      c.fillStyle = "#fff";
      c.fillText(p.n, p.x, p.y + 2);
    });
  }
  (o.arrows || []).forEach((a) => {
    c.strokeStyle = a.bad ? "#f2a25c" : a.alt ? "#9fd4ff" : "#f2e9d8";
    c.fillStyle = c.strokeStyle;
    c.lineWidth = 7;
    c.setLineDash(a.bad || a.alt ? [18, 12] : []);
    c.beginPath();
    a.pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();
    c.setLineDash([]);
    const [x1, y1] = a.pts[a.pts.length - 2],
      [x2, y2] = a.pts[a.pts.length - 1],
      ang = Math.atan2(y2 - y1, x2 - x1);
    c.beginPath();
    c.moveTo(x2, y2);
    c.lineTo(x2 - 34 * Math.cos(ang - 0.45), y2 - 34 * Math.sin(ang - 0.45));
    c.lineTo(x2 - 34 * Math.cos(ang + 0.45), y2 - 34 * Math.sin(ang + 0.45));
    c.closePath();
    c.fill();
    if (a.cross) {
      const [cx, cy] = a.cross;
      c.lineWidth = 9;
      L(cx - 26, cy - 26, cx + 26, cy + 26);
      L(cx - 26, cy + 26, cx + 26, cy - 26);
    }
  });
  (o.balls || []).forEach((b) => {
    const g = c.createRadialGradient(b.x - 10, b.y - 10, 3, b.x, b.y, R);
    if (b.c === "W") {
      g.addColorStop(0, "#fff");
      g.addColorStop(1, "#bdb39b");
    } else {
      g.addColorStop(0, "#ff8a7c");
      g.addColorStop(1, "#7d1015");
    }
    ring(b.x, b.y, R);
    c.fillStyle = g;
    c.fill();
  });
  if (o.light) {
    c.globalCompositeOperation = "multiply";
    c.drawImage(o.light, -HX, -HY, 2 * HX, 2 * HY);
    c.globalCompositeOperation = "source-over";
  }
}

export function paintCloth(o) {
  const c = S.clothCtx;
  c.setTransform(S.clothK, 0, 0, S.clothK, HX * S.clothK, HY * S.clothK);
  drawTable(c, {
    felt: "#23897a",
    noise: S.feltNoise,
    light: S.clothLight,
    lines: S.lines,
    three: true,
    ...o,
  });
  S.clothTex.needsUpdate = true;
}

// ---------- the table ----------
function buildTable(scene) {
  const T = (S.table = new THREE.Group());
  scene.add(T);
  // cloth (unlit: the three lamp pools are baked into the texture)
  const cw = 1024,
    ch = 512;
  S.clothK = cw / 1800;
  const cv = document.createElement("canvas");
  cv.width = cw;
  cv.height = ch;
  S.clothCtx = cv.getContext("2d");
  S.feltNoise = document.createElement("canvas");
  S.feltNoise.width = 256;
  S.feltNoise.height = 128;
  {
    const n = S.feltNoise.getContext("2d"),
      d = n.createImageData(256, 128);
    for (let i = 0; i < d.data.length; i += 4) {
      const v = Math.random() * 255;
      d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
      d.data[i + 3] = 14;
    }
    n.putImageData(d, 0, 0);
  }
  S.clothLight = document.createElement("canvas");
  S.clothLight.width = 360;
  S.clothLight.height = 180;
  {
    const l = S.clothLight.getContext("2d");
    l.fillStyle = "#5c5c5c";
    l.fillRect(0, 0, 360, 180);
    l.globalCompositeOperation = "lighter";
    for (const x of [60, 180, 300]) {
      const g = l.createRadialGradient(x, 90, 4, x, 90, 120);
      g.addColorStop(0, "rgba(170,165,150,1)");
      g.addColorStop(0.55, "rgba(110,105,95,.55)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      l.fillStyle = g;
      l.fillRect(0, 0, 360, 180);
    }
  }
  S.clothTex = new THREE.CanvasTexture(cv);
  S.clothTex.anisotropy = S.renderer.capabilities.getMaxAnisotropy();
  add(
    T,
    new THREE.PlaneGeometry(1.8, 0.9),
    basic(0xffffff, { map: S.clothTex }),
  ).rotation.x = -Math.PI / 2;
  paintCloth({});

  const wood = canvasTex(
    64,
    64,
    (c, w, h) => {
      c.fillStyle = "#5a2414";
      c.fillRect(0, 0, w, h);
      for (let i = 0; i < 26; i++) {
        c.fillStyle = `rgba(${Math.random() < 0.5 ? "25,6,2" : "140,60,30"},${0.12 + Math.random() * 0.18})`;
        c.fillRect(0, Math.random() * h, w, 1 + Math.random() * 2);
      }
    },
    { repeat: [6, 1] },
  );
  S.mahog = lam(0xffffff, { map: wood });
  const mahogDark = lam(0x6b2c18);
  const brass = phong(0xd4a752, {
    specular: 0xfff0c0,
    shininess: 50,
    emissive: 0x2a1a05,
  });
  S.brass = brass;
  const felt2 = lam(0x1d7466);

  // rail with a soft bevel
  const rr = (s, x, y, w, h, r) => {
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
  };
  const rail = new THREE.Shape();
  rr(rail, -1.05, -0.6, 2.1, 1.2, 0.07);
  const hole = new THREE.Path();
  hole.moveTo(-0.93, -0.48);
  hole.lineTo(0.93, -0.48);
  hole.lineTo(0.93, 0.48);
  hole.lineTo(-0.93, 0.48);
  hole.lineTo(-0.93, -0.48);
  rail.holes.push(hole);
  const railGeo = new THREE.ExtrudeGeometry(rail, {
    depth: 0.045,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 1,
    curveSegments: 3,
  });
  railGeo.rotateX(-Math.PI / 2);
  add(T, railGeo, S.mahog, 0, 0.004, 0);
  // brass inlay line on the rail top
  for (const z of [-0.54, 0.54])
    add(T, new THREE.BoxGeometry(1.9, 0.002, 0.006), brass, 0, 0.06, z);
  for (const x of [-0.99, 0.99])
    for (const z of [-0.35, 0.35])
      add(
        T,
        new THREE.CylinderGeometry(0.008, 0.008, 0.003, 6),
        brass,
        x,
        0.06,
        z,
      );
  // cushions: the short ones are cut open at the goal, so the whole hole shows
  const nose = new THREE.Shape();
  nose.moveTo(0, 0);
  nose.lineTo(0.03, 0);
  nose.lineTo(0.03, 0.04);
  nose.lineTo(0.01, 0.04);
  nose.lineTo(0, 0.031);
  nose.lineTo(0, 0);
  const cushion = (len, x, z, ry) => {
    const g = new THREE.ExtrudeGeometry(nose, {
      depth: len,
      bevelEnabled: false,
    });
    g.translate(0, 0, -len / 2);
    const m = add(T, facet(g), felt2, x, 0, z);
    m.rotation.y = ry;
  };
  cushion(1.86, 0, 0.45, -Math.PI / 2);
  cushion(1.86, 0, -0.45, Math.PI / 2);
  const gap = DD_Y - DOP_R,
    half = 0.45 - gap * M;
  for (const s of [1, -1]) {
    cushion(half, 0.9, s * (gap * M + half / 2), 0);
    cushion(half, -0.9, s * (gap * M + half / 2), Math.PI);
  }
  // the goal: felt in the cushion gap, the hole, and a ring in the colour that scores here (white attacks +x)
  const black = basic(0x020202);
  for (const h of [1, -1]) {
    add(
      T,
      new THREE.BoxGeometry(0.03, 0.002, gap * 2 * M),
      basic(0x1a6a5e),
      h * 0.915,
      -0.0005,
      0,
    );
    const disc = add(
      T,
      new THREE.CircleGeometry(GOAL_R * M, 20),
      black,
      h * GOAL_X * M,
      0.0012,
      0,
    );
    disc.rotation.x = -Math.PI / 2;
    add(
      T,
      new THREE.CylinderGeometry(GOAL_R * M, GOAL_R * M, 0.06, 20, 1, true),
      basic(0x0c0806, { side: THREE.BackSide }),
      h * GOAL_X * M,
      -0.029,
      0,
    );
    const ring = add(
      T,
      new THREE.RingGeometry(34 * M, 38.5 * M, 24),
      basic(h === 1 ? 0xefe7d4 : 0xd9423f),
      h * GOAL_X * M,
      0.0014,
      0,
    );
    ring.rotation.x = -Math.PI / 2;
  }
  // body, apron, legs, coin slot
  add(T, new THREE.BoxGeometry(2.04, 0.15, 1.14), S.mahog, 0, -0.078, 0);
  add(T, new THREE.BoxGeometry(2.06, 0.02, 1.16), mahogDark, 0, -0.16, 0);
  add(T, new THREE.BoxGeometry(0.01, 0.07, 0.15), brass, 1.025, -0.075, 0.3);
  add(T, new THREE.BoxGeometry(0.006, 0.035, 0.01), black, 1.031, -0.07, 0.3);
  const legGeo = facet(
    new THREE.LatheGeometry(
      [
        [0, 0],
        [0.055, 0],
        [0.058, 0.03],
        [0.04, 0.08],
        [0.048, 0.17],
        [0.03, 0.35],
        [0.038, 0.5],
        [0.052, 0.55],
        [0.052, 0.6],
        [0, 0.6],
      ].map(([r, y]) => new THREE.Vector2(r, y)),
      8,
    ),
  );
  for (const x of [-0.88, 0.88])
    for (const z of [-0.46, 0.46]) {
      add(T, legGeo, S.mahog, x, FLOOR, z);
      add(
        T,
        new THREE.CylinderGeometry(0.06, 0.06, 0.012, 8),
        brass,
        x,
        FLOOR + 0.006,
        z,
      );
    }
  // ball return tray on the long side: white balls in the back row, red in the front
  const tray = new THREE.Group();
  tray.position.set(0, -0.11, 0.6);
  T.add(tray);
  add(
    tray,
    new THREE.BoxGeometry(0.4, 0.012, 0.15),
    mahogDark,
    0,
    -0.035,
    0.075,
  );
  add(tray, new THREE.BoxGeometry(0.4, 0.05, 0.01), S.mahog, 0, -0.012, 0.15);
  for (const x of [-0.2, 0.2])
    add(
      tray,
      new THREE.BoxGeometry(0.01, 0.05, 0.15),
      S.mahog,
      x,
      -0.012,
      0.075,
    );
  add(tray, new THREE.BoxGeometry(0.41, 0.006, 0.012), brass, 0, 0.014, 0.152);
  add(
    tray,
    new THREE.BoxGeometry(0.39, 0.012, 0.004),
    lam(0x2a120a),
    0,
    -0.022,
    0.075,
  ); // divider
  add(
    tray,
    new THREE.BoxGeometry(0.12, 0.05, 0.02),
    lam(0x0a0604),
    0,
    0.02,
    -0.005,
  ); // the mouth the balls come out of
  S.tray = tray;
  // brass name plaques on the short rails
  S.plaques = {};
  for (const c of COLORS) {
    const tex = canvasTex(512, 128, () => {});
    const m = add(
      T,
      new THREE.PlaneGeometry(0.3, 0.075),
      lam(0xe8e0d0, { map: tex }),
      home(c) * 0.99,
      0.0605,
      0,
    );
    m.rotation.order = "YXZ";
    m.rotation.y = home(c) < 0 ? -Math.PI / 2 : Math.PI / 2;
    m.rotation.x = -Math.PI / 2;
    S.plaques[c] = { tex, name: null };
  }
  // posts: chrome stems with two red rubber rings
  const chrome = lam(0xaeb3ba, { emissive: 0x1a1a1c });
  const rubber = lam(0xb3392c);
  const postGeo = new THREE.LatheGeometry(
    [
      [0, 0],
      [0.0175, 0],
      [0.0175, 0.038],
      [0.014, 0.045],
      [0.008, 0.0475],
      [0, 0.048],
    ].map(([r, y]) => new THREE.Vector2(r, y)),
    10,
  );
  const ringGeo = new THREE.TorusGeometry(0.0172, 0.0036, 5, 10);
  for (const d of DOPS) {
    add(T, postGeo, chrome, d.x * M, 0, d.y * M);
    for (const y of [0.022, 0.034])
      add(T, ringGeo, rubber, d.x * M, y, d.y * M).rotation.x = Math.PI / 2;
  }
  // balls and their blob shadows
  const sphere = new THREE.SphereGeometry(R * M, 16, 12);
  const matW = phong(0xe6dcc4, { specular: 0x8a8a8a, shininess: 45 }),
    matR = phong(0xb8121c, { specular: 0x7a4a40, shininess: 45 });
  const blob = canvasTex(32, 32, (c) => {
    const g = c.createRadialGradient(16, 16, 1, 16, 16, 16);
    g.addColorStop(0, "rgba(0,0,0,.65)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 32, 32);
  });
  const blobMat = basic(0xffffff, {
    map: blob,
    transparent: true,
    depthWrite: false,
  });
  S.blobMat = blobMat;
  S.balls = [];
  S.blobs = [];
  S.anim = {};
  for (let i = 0; i < 10; i++) {
    S.balls.push(add(scene, sphere, i < 5 ? matW : matR));
    const b = add(
      scene,
      new THREE.PlaneGeometry(0.085, 0.085),
      blobMat,
      0,
      0.0016,
      0,
    );
    b.rotation.x = -Math.PI / 2;
    S.blobs.push(b);
  }
  // cue, tip dot, aim line, ghost ball
  const cue = (S.cue = new THREE.Group());
  add(
    cue,
    new THREE.CylinderGeometry(0.0062, 0.0125, 0.9, 8),
    lam(0xe0c48f),
    0,
    -0.45,
    0,
  );
  add(
    cue,
    new THREE.CylinderGeometry(0.0125, 0.0155, 0.5, 8),
    phong(0x1b100a, { shininess: 60 }),
    0,
    -1.15,
    0,
  );
  add(
    cue,
    new THREE.CylinderGeometry(0.0128, 0.0128, 0.02, 8),
    brass,
    0,
    -0.9,
    0,
  );
  add(
    cue,
    new THREE.CylinderGeometry(0.0063, 0.0063, 0.012, 8),
    lam(0x3b73c4),
    0,
    0.006,
    0,
  );
  cue.visible = false;
  scene.add(cue);
  S.tipDot = add(
    scene,
    new THREE.SphereGeometry(0.0055, 6, 4),
    basic(0x3b8bff),
    0,
    0,
    0,
  );
  S.aim = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(),
      new THREE.Vector3(),
    ]),
    new THREE.LineDashedMaterial({
      color: 0xffffff,
      dashSize: 0.015,
      gapSize: 0.01,
      transparent: true,
      opacity: 0.85,
    }),
  );
  S.obj = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(),
      new THREE.Vector3(),
    ]),
    new THREE.LineBasicMaterial({ color: 0xffffff }),
  );
  S.ghost = add(
    scene,
    new THREE.RingGeometry(R * M * 0.84, R * M, 24),
    basic(0xffffff, {
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    }),
    0,
    0,
    0,
  );
  S.ghost.rotation.x = -Math.PI / 2;
  scene.add(S.aim, S.obj);
}

export function updatePlaques(nameOf) {
  for (const c of COLORS) {
    const p = S.plaques[c],
      name = nameOf(c);
    if (p.name === name) continue;
    p.name = name;
    const cv = p.tex.image,
      x = cv.getContext("2d"),
      w = cv.width,
      h = cv.height;
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#f6dc8e");
    g.addColorStop(0.45, "#d4a246");
    g.addColorStop(0.55, "#b9832c");
    g.addColorStop(1, "#f0cf78");
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
    x.strokeStyle = "#6b4512";
    x.lineWidth = 6;
    x.strokeRect(9, 9, w - 18, h - 18);
    x.strokeStyle = "rgba(255,248,210,.7)";
    x.lineWidth = 2;
    x.strokeRect(15, 15, w - 30, h - 30);
    for (const sx of [26, w - 26]) {
      x.fillStyle = "#7a5216";
      x.beginPath();
      x.arc(sx, h / 2, 7, 0, 7);
      x.fill();
      x.fillStyle = "#ffe7a6";
      x.fillRect(sx - 5, h / 2 - 1, 10, 2);
    }
    let size = 64;
    x.font = `700 ${size}px "Chakra Petch", sans-serif`;
    const text = name.toUpperCase();
    while (x.measureText(text).width > w - 110 && size > 26) {
      size -= 2;
      x.font = `700 ${size}px "Chakra Petch", sans-serif`;
    }
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillStyle = "rgba(255,250,220,.75)";
    x.fillText(text, w / 2 + 2, h / 2 + 4); // engraved: light edge below, dark cut above
    x.fillStyle = "#4a2c08";
    x.fillText(text, w / 2, h / 2 + 1);
    x.fillStyle = c === "W" ? "#f2ead6" : "#c0141f";
    x.strokeStyle = "#4a2c08";
    x.lineWidth = 3;
    x.beginPath();
    x.arc(52, h / 2, 13, 0, 7);
    x.fill();
    x.stroke();
    x.beginPath();
    x.arc(w - 52, h / 2, 13, 0, 7);
    x.fill();
    x.stroke();
    p.tex.needsUpdate = true;
  }
}

// Balls: live positions, a short drop into the goal, then a place in the return tray.
export function updateBalls(balls, now, frame) {
  const potted = { W: [], R: [] };
  balls
    .filter((b) => !b.on && b.potN)
    .sort((a, b) => a.potN - b.potN)
    .forEach((b) => potted[b.c].push(b.id));
  for (const b of balls) {
    const m = S.balls[b.id],
      sh = S.blobs[b.id];
    const on = frame ? frame[b.id * 3 + 2] > 0 : b.on;
    const x = frame ? frame[b.id * 3] : b.x,
      y = frame ? frame[b.id * 3 + 1] : b.y;
    const a = S.anim[b.id] || (S.anim[b.id] = { on, x, y, t: 0 });
    if (a.on && !on) {
      a.t = now;
      a.x = x;
      a.y = y;
      a.h = Math.sign(x) || 1;
    }
    a.on = on;
    if (on) {
      m.visible = sh.visible = true;
      m.position.set(x * M, R * M, y * M);
      sh.position.set(x * M + 0.004, 0.0016, y * M + 0.004);
      sh.scale.setScalar(1);
      if (!frame) {
        a.x = x;
        a.y = y;
      }
      continue;
    }
    sh.visible = false;
    const age = (now - a.t) / 1000;
    if (age < 0.28 && a.t) {
      // falling into the hole
      const k = age / 0.28,
        gx = a.h * GOAL_X;
      m.visible = true;
      m.position.set(
        (a.x + (gx - a.x) * k) * M,
        (R - k * k * 2.4 * R) * M,
        a.y * (1 - k) * M,
      );
    } else if (frame || age < 1.05) m.visible = false;
    else {
      // resting in the tray
      const i = potted[b.c].indexOf(b.id);
      m.visible = i >= 0;
      if (i >= 0) {
        const p = S.tray.localToWorld(
          new THREE.Vector3(
            -0.15 + i * 0.066,
            0.002,
            b.c === "W" ? 0.11 : 0.04,
          ),
        );
        m.position.copy(p);
      }
    }
  }
}

// Aim line, ghost ball, cue and the dot where the tip will hit.
export function updateAim(b, s, cast) {
  S.cue.visible =
    S.aim.visible =
    S.obj.visible =
    S.ghost.visible =
    S.tipDot.visible =
      false;
  if (!b || !s) return;
  const r = cast(b.x, b.y, s.dx, s.dy, b.id),
    cx = b.x + s.dx * r.t,
    cy = b.y + s.dy * r.t;
  const line = (l, a, z) => {
    l.geometry.setFromPoints([a, z]);
    l.computeLineDistances();
    l.visible = true;
  };
  line(S.aim, V(b.x, b.y, 0.003), V(cx, cy, 0.003));
  S.ghost.position.copy(V(cx, cy, 0.003));
  S.ghost.visible = true;
  if (r.hit && r.hit.type === "ball") {
    const q = r.hit.b,
      nx = q.x - cx,
      ny = q.y - cy,
      nl = Math.hypot(nx, ny) || 1;
    S.obj.material.color.set(q.c === b.c ? 0xf2a25c : 0xffffff);
    line(
      S.obj,
      V(q.x, q.y, 0.003),
      V(q.x + (nx / nl) * 160, q.y + (ny / nl) * 160, 0.003),
    );
  }
  // where the tip meets the ball: right of centre is (-dy, dx) on this table, up is up
  const sx = (s.sx || 0) * 0.5,
    sy = (s.sy || 0) * 0.5,
    back = Math.sqrt(Math.max(0, 1 - sx * sx - sy * sy));
  const hx = b.x + (-s.dx * back - s.dy * sx) * R,
    hy = b.y + (-s.dy * back + s.dx * sx) * R,
    hz = R + sy * R;
  S.tipDot.position.set(hx * M, hz * M, hy * M);
  S.tipDot.visible = true;
  const pull = 12 + s.p * 110;
  S.cue.position.set(
    (hx - s.dx * pull) * M,
    (hz + 0.2 * pull) * M,
    (hy - s.dy * pull) * M,
  );
  S.cue.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(s.dx, -0.2, s.dy).normalize(),
  );
  S.cue.visible = true;
}

// ---------- camera ----------
// Player view sits behind your own short end, low enough to see the far wall.
export function updateCamera(dt, vc, portrait) {
  const cam = S.camera,
    asp = S.w / S.h,
    tv = Math.tan((cam.fov * Math.PI) / 360),
    th = tv * asp;
  const orbit = (az, el, d) =>
    new THREE.Vector3(
      d * Math.cos(el) * Math.cos(az),
      d * Math.sin(el),
      d * Math.cos(el) * Math.sin(az),
    );
  let pos,
    look = new THREE.Vector3(),
    up = new THREE.Vector3(0, 1, 0),
    k = 1 - Math.pow(0.03, dt);
  const m = camS.mode;
  if (m === "replay" && camS.replay) {
    pos = camS.replay.pos;
    look = camS.replay.look;
    k = camS.replay.cut ? 1 : 1 - Math.pow(0.002, dt);
    camS.replay.cut = false;
  } else if (m === "intro") {
    if (!reduced) camS.az += dt * 0.05;
    pos = orbit(camS.az, 0.36, portrait ? 4.4 : 3.4);
    look.set(portrait ? 0 : -0.45, 0.1, 0);
  } else if (m === "free") {
    pos = orbit(camS.az, camS.el, camS.dist);
    pos.set(
      Math.max(-4.7, Math.min(4.7, pos.x)),
      Math.min(2.1, pos.y),
      Math.max(-3.5, Math.min(3.5, pos.z)),
    );
    k = 1 - Math.pow(1e-6, dt);
  } // stay inside the café
  else if (m === "top") {
    const ext = portrait ? [1.2, 2.14] : [2.14, 1.2];
    pos = new THREE.Vector3(
      0,
      1.12 * Math.max(ext[1] / 2 / tv, ext[0] / 2 / th),
      0.0001,
    );
    up = portrait
      ? new THREE.Vector3(att(vc), 0, 0)
      : new THREE.Vector3(0, 0, -1);
  } else {
    const h = home(vc),
      d = Math.max(1.35, 0.7 / th),
      el = (23 * Math.PI) / 180;
    pos = new THREE.Vector3(
      h * (1.0 + d * Math.cos(el)),
      d * Math.sin(el) + 0.12,
      0,
    );
    look.set(-h * 0.25, 0.02, 0);
  }
  cam.position.lerp(pos, k);
  S.look.lerp(look, k);
  cam.up.lerp(up, k).normalize();
  cam.lookAt(S.look);
}
export function toFree() {
  if (camS.mode === "free") return;
  const p = S.camera.position;
  camS.dist = p.length();
  camS.el = Math.asin(p.y / camS.dist);
  camS.az = Math.atan2(p.z, p.x);
  camS.mode = "free";
}
