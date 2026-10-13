// three.js and the small helpers every 3D file uses. Low poly, vertex lit: the PS2 look.
import * as THREE from "three";
import { R } from "../core/table";

export { THREE };
export const M = 0.001; // mm to metres
export const FLOOR = -0.76; // floor height below the cloth (m)

type MatOpts = Record<string, unknown>;
export type Col = THREE.Color | string | number;
export const lam = (color: Col, o: MatOpts = {}) => new THREE.MeshLambertMaterial({ color, ...o });
export const basic = (color: Col, o: MatOpts = {}) => new THREE.MeshBasicMaterial({ color, ...o });
export const phong = (color: Col, o: MatOpts = {}) => new THREE.MeshPhongMaterial({ color, ...o });

/** per-face normals: the low-poly look */
export function facet(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const g = geo.index ? geo.toNonIndexed() : geo;
  g.computeVertexNormals();
  return g;
}

export function canvasTex(
  w: number,
  h: number,
  draw: (c: CanvasRenderingContext2D, w: number, h: number) => void,
  o: { repeat?: [number, number]; pixel?: boolean } = {},
): THREE.CanvasTexture {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d")!, w, h);
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

export function add<G extends THREE.BufferGeometry, T extends THREE.Material>(
  parent: THREE.Object3D,
  geo: G,
  mat: T,
  x = 0,
  y = 0,
  z = 0,
): THREE.Mesh<G, T> {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

/** a point on the table (mm) as a world point, `h` metres up */
export const V = (x: number, y: number, h = R * M): THREE.Vector3 => new THREE.Vector3(x * M, h, y * M);

/** a flat plane lying on the floor or a table top */
export function flat<T extends THREE.Material>(
  parent: THREE.Object3D,
  w: number,
  d: number,
  mat: T,
  x = 0,
  y = 0,
  z = 0,
) {
  const m = add(parent, new THREE.PlaneGeometry(w, d), mat, x, y, z);
  m.rotation.x = -Math.PI / 2;
  return m;
}
