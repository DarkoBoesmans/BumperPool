// The WebGL renderer and the post-processing passes (post.ts). `S` holds everything 3D that other files reach for.
import { THREE } from "./three";
import { FX_DEFAULTS, NLIGHTS, POST_VS, POST_FS, BLEND_FS, type Fx } from "./post";

export interface Flare {
  pos: THREE.Vector3;
  k: number;
  vis: () => boolean;
}
export interface Stage {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  look: THREE.Vector3;
  rt: THREE.WebGLRenderTarget;
  acc: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget];
  accLive: boolean;
  post: THREE.ShaderMaterial;
  blend: THREE.ShaderMaterial;
  postScene: THREE.Scene;
  blendScene: THREE.Scene;
  postCam: THREE.OrthographicCamera;
  ray: THREE.Raycaster;
  ndc: THREE.Vector2;
  fx: Fx;
  lastPs2: number;
  flares: Flare[];
  drunk: number;
  /** lightning: fades back to 0 */
  flash: number;
  lines: boolean;
  w: number;
  h: number;
  /** render height in pixels: smoke sizes follow it */
  bh: number;
  /** a right or middle drag: where it started (a press that never moves is a click) and the last pointer */
  orbit: { x: number; y: number; sx: number; sy: number; moved?: boolean; intro?: boolean; pan?: boolean } | null;
}
export const S = {
  lines: true,
  flares: [] as Flare[],
  drunk: 0,
  flash: 0,
  fx: { ...FX_DEFAULTS },
  orbit: null,
} as Stage;

export function initScene(stage: HTMLElement): boolean {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
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
  scene.add(S.camera);
  S.look = new THREE.Vector3();
  // stencil gives a 24-bit depth buffer; 16 bits made the wall boards flicker
  const rt = () =>
    new THREE.WebGLRenderTarget(2, 2, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      stencilBuffer: true,
    });
  S.rt = rt();
  S.acc = [rt(), rt()];
  const quad = (mat: THREE.Material) => {
    const sc = new THREE.Scene();
    sc.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
    return sc;
  };
  const u = (value: unknown) => ({ value });
  S.post = new THREE.ShaderMaterial({
    uniforms: {
      t: u(S.rt.texture),
      res: u(new THREE.Vector2(2, 2)),
      time: u(0),
      aspect: u(1),
      ps2: u(0),
      bloom: u(0),
      flare: u(0),
      grain: u(0),
      vig: u(0),
      chroma: u(0),
      drunk: u(0),
      flash: u(0),
      lights: u(Array.from({ length: NLIGHTS }, () => new THREE.Vector3())),
    },
    vertexShader: POST_VS,
    fragmentShader: POST_FS,
    depthTest: false,
    depthWrite: false,
  });
  S.blend = new THREE.ShaderMaterial({
    uniforms: { cur: u(null), prev: u(null), amt: u(0) },
    vertexShader: POST_VS,
    fragmentShader: BLEND_FS,
    depthTest: false,
    depthWrite: false,
  });
  S.postScene = quad(S.post);
  S.blendScene = quad(S.blend);
  S.postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  S.ray = new THREE.Raycaster();
  S.ndc = new THREE.Vector2();
  new ResizeObserver(resize).observe(stage);
  setFx(S.fx);
  return true;
}

function resize(): void {
  const c = S.renderer.domElement,
    w = c.clientWidth || innerWidth,
    h = c.clientHeight || innerHeight;
  if (!w || !h) return;
  S.w = w;
  S.h = h;
  const full = h * Math.min(devicePixelRatio || 1, 1.5),
    i = S.fx.ps2 / 100;
  // full PS2 is 260 lines, stretched by CSS with pixelated scaling
  const bh = Math.round(Math.min(full, full * (1 - i) + 260 * i)),
    bw = Math.round((bh * w) / h);
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

/** fx: 0..100 per effect (see FX_DEFAULTS) */
export function setFx(fx: Partial<Fx>): void {
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
export function render(now = 0): void {
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
  u.drunk.value = S.drunk || 0;
  u.flash.value = S.flash || 0;
  for (let i = 0; i < NLIGHTS; i++) {
    const L = S.flares[i],
      out = u.lights.value[i] as THREE.Vector3;
    out.z = 0;
    if (!L || f.flare <= 0 || !L.vis()) continue;
    lp.copy(L.pos).project(S.camera);
    const edge = Math.max(Math.abs(lp.x), Math.abs(lp.y));
    if (lp.z < 1 && edge < 1.05) out.set((lp.x + 1) / 2, (lp.y + 1) / 2, L.k * Math.min(1, (1.05 - edge) * 6));
  }
  r.setRenderTarget(null);
  r.render(S.postScene, S.postCam);
}

/** a world point in screen pixels (speech bubbles) */
export function toScreen(v: THREE.Vector3): { x: number; y: number; behind: boolean } {
  const p = v.clone().project(S.camera);
  return { x: ((p.x + 1) / 2) * S.w, y: ((1 - p.y) / 2) * S.h, behind: p.z > 1 };
}

/** pointer to a ray from the camera */
export function rayAt(e: { clientX: number; clientY: number }): THREE.Ray {
  const r = S.renderer.domElement.getBoundingClientRect();
  S.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  S.ray.setFromCamera(S.ndc, S.camera);
  return S.ray.ray;
}
