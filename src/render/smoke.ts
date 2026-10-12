// Smoke: soft point sprites that drift up and spread. More cigars, more smoke, all over the room.
// Under the sea the same particles are bubbles: smaller, quicker, straight up.
import { THREE, canvasTex } from "./three";
import { S } from "./renderer";

const MAXP = 320;
interface P {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  age: number;
  life: number;
  s0: number;
  s1: number;
  a: number;
}
const sm = {
  ambient: 0,
  /** room smoke 0..1, set from the cigar buzz */
  level: 0,
  bubbles: false,
  p: [] as P[],
} as {
  geo: THREE.BufferGeometry;
  mat: THREE.ShaderMaterial;
  pos: Float32Array;
  size: Float32Array;
  alpha: Float32Array;
  p: P[];
  ambient: number;
  level: number;
  bubbles: boolean;
};
export const smoke = sm;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export function buildSmoke(scene: THREE.Scene): void {
  const geo = new THREE.BufferGeometry();
  sm.pos = new Float32Array(MAXP * 3);
  sm.size = new Float32Array(MAXP);
  sm.alpha = new Float32Array(MAXP);
  geo.setAttribute("position", new THREE.BufferAttribute(sm.pos, 3));
  geo.setAttribute("aSize", new THREE.BufferAttribute(sm.size, 1));
  geo.setAttribute("aAlpha", new THREE.BufferAttribute(sm.alpha, 1));
  const tex = canvasTex(32, 32, (c) => {
    const g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.5, "rgba(255,255,255,.45)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 32, 32);
  });
  sm.mat = new THREE.ShaderMaterial({
    uniforms: { map: { value: tex }, scale: { value: 400 }, color: { value: new THREE.Color(0xcfc6b8) } },
    vertexShader:
      "attribute float aSize; attribute float aAlpha; varying float vA; uniform float scale; void main(){ vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position, 1.); gl_PointSize = min(aSize * scale / -mv.z, 256.); gl_Position = projectionMatrix * mv; }",
    fragmentShader:
      "uniform sampler2D map; uniform vec3 color; varying float vA; void main(){ float a = texture2D(map, gl_PointCoord).a * vA; if (a < .01) discard; gl_FragColor = vec4(color, a); }",
    transparent: true,
    depthWrite: false,
  });
  sm.geo = geo;
  const pts = new THREE.Points(geo, sm.mat);
  pts.frustumCulled = false;
  scene.add(pts);
}

export function setSmoke(hex: string, bubbles: boolean): void {
  sm.mat.uniforms.color.value.set(hex);
  sm.bubbles = bubbles;
  sm.p.length = 0;
}

export function emit(
  x: number,
  y: number,
  z: number,
  vx: number,
  vy: number,
  vz: number,
  life: number,
  s0: number,
  s1: number,
  a: number,
): void {
  if (sm.p.length >= MAXP) sm.p.shift();
  sm.p.push({ x, y, z, vx, vy, vz, age: 0, life, s0, s1, a });
}
/** a mouthful of smoke from `at`, blown along `dir` */
export function puff(at: THREE.Vector3, dir: THREE.Vector3, n = 18, spread = 0.3, k = 1): void {
  for (let i = 0; i < n; i++)
    emit(
      at.x,
      at.y,
      at.z,
      dir.x * rnd(0.15, 0.45) + rnd(-spread, spread) * 0.3,
      dir.y * 0.3 + rnd(0.02, 0.18),
      dir.z * rnd(0.15, 0.45) + rnd(-spread, spread) * 0.3,
      rnd(2.2, 3.6),
      0.04,
      rnd(0.35, 0.6) * k,
      rnd(0.25, 0.4) * k,
    );
}

export function stepSmoke(dt: number): void {
  const P = sm.p,
    lv = sm.level,
    wide = 0.9 + lv * 2.6;
  sm.ambient -= dt;
  if (sm.ambient < 0) {
    sm.ambient = sm.bubbles ? 0.08 : 0.35 / (1 + 6 * lv);
    if (sm.bubbles) emit(rnd(-4, 4), -0.7, rnd(-3, 3), 0, rnd(0.25, 0.5), 0, 9, 0.02, 0.05, 0.5);
    else
      emit(
        rnd(-wide, wide),
        rnd(0.3, 0.7 + lv),
        rnd(-0.4 - lv * 2, 0.4 + lv * 2),
        rnd(-0.02, 0.02),
        0.01,
        rnd(-0.02, 0.02),
        9,
        0.5,
        1.1 + lv,
        0.06 + lv * 0.06,
      );
  }
  let n = 0;
  for (let i = P.length - 1; i >= 0; i--) {
    const q = P[i];
    q.age += dt;
    if (q.age > q.life) {
      P.splice(i, 1);
      continue;
    }
    q.vx *= 1 - dt * 0.9;
    q.vz *= 1 - dt * 0.9;
    q.vy = q.vy * (1 - dt * 0.5) + dt * 0.02;
    q.x += (q.vx + Math.sin(q.age * 1.7 + i) * 0.015) * dt;
    q.y += q.vy * dt;
    q.z += q.vz * dt;
  }
  for (const q of P) {
    const k = q.age / q.life;
    sm.pos[n * 3] = q.x;
    sm.pos[n * 3 + 1] = q.y;
    sm.pos[n * 3 + 2] = q.z;
    sm.size[n] = q.s0 + (q.s1 - q.s0) * Math.sqrt(k);
    sm.alpha[n] = q.a * Math.min(1, k * 8) * (1 - k);
    n++;
  }
  for (let i = n; i < MAXP; i++) sm.alpha[i] = 0;
  for (const k of ["position", "aSize", "aAlpha"]) (sm.geo.attributes[k] as THREE.BufferAttribute).needsUpdate = true;
  sm.geo.setDrawRange(0, n);
  sm.mat.uniforms.scale.value = S.bh / (2 * Math.tan((S.camera.fov * Math.PI) / 360));
}
