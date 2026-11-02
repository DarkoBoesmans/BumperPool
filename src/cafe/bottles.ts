// The bottles behind the bar, merged into two meshes (the glass you see through, and the rest), so a full back bar
// costs two draws instead of four hundred. Five shapes from a Belgian back bar: wine, a stubby beer, a stone jenever
// jug, a square gin and a round liqueur flask, each with its label and a foil, a cap or a cork.
import { THREE, lam, facet } from "../render/three";
import { BufferGeometryUtils } from "three/examples/jsm/utils/BufferGeometryUtils";
import { rnd } from "./state";

export type BottleKind = "wine" | "beer" | "jug" | "square" | "flask";
const KINDS: BottleKind[] = ["wine", "wine", "beer", "beer", "jug", "square", "flask"];
const pick = <T>(a: T[]): T => a[(Math.random() * a.length) | 0];
const GLASS = {
  wine: [0x1f3a22, 0x3a1a0a, 0x141a14, 0x5a2a12],
  beer: [0x4a220a, 0x5a2a0c, 0x2a3a1a],
  square: [0xb8661a, 0x7a3a10, 0xd8e2d8],
  flask: [0x8a1a1a, 0x1f4a2a, 0xc89a3a, 0xb8661a],
};
const LABEL = [0xefe2c0, 0xd8c38a, 0xf4f0e6, 0x1a1410, 0xc9302c];
const TOP = [0x8a1a1a, 0xc89a3a, 0x111111, 0xd8c38a, 0x2a4a8a];

/** a piece in place, painted one colour (the colour rides on the vertices, so all pieces share a material) */
function piece(geo: THREE.BufferGeometry, color: number, x: number, y: number, z: number): THREE.BufferGeometry {
  const g = facet(geo);
  g.deleteAttribute("uv");
  g.translate(x, y, z);
  const c = new THREE.Color(color),
    n = g.attributes.position.count,
    a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3);
  g.setAttribute("color", new THREE.BufferAttribute(a, 3));
  return g;
}
const cyl = (r1: number, r2: number, h: number, n = 8) => new THREE.CylinderGeometry(r1, r2, h, n);

/** collect bottles, then `into(parent)` adds the two merged meshes */
export function bottles() {
  const solid: THREE.BufferGeometry[] = [],
    clear: THREE.BufferGeometry[] = [];
  /** the neck and what closes it, from height `y` up */
  const neck = (to: THREE.BufferGeometry[], x: number, y: number, z: number, r: number, h: number, glass: number) => {
    to.push(piece(cyl(r, r, h, 6), glass, x, y + h / 2, z));
    solid.push(piece(cyl(r * 1.15, r * 1.15, 0.03, 6), pick(TOP), x, y + h - 0.012, z)); // foil, cap or cork
  };
  /** on the front, just proud of the glass (a round bottle's front is an edge, not a face) */
  const label = (x: number, y: number, z: number, w: number, h: number) =>
    solid.push(piece(new THREE.BoxGeometry(w, h, 0.004), pick(LABEL), x, y, z));
  function add(kind: BottleKind, x: number, y: number, z: number): void {
    if (kind === "wine") {
      const gl = pick(GLASS.wine);
      solid.push(piece(cyl(0.036, 0.036, 0.19), gl, x, y + 0.095, z));
      solid.push(piece(cyl(0.013, 0.036, 0.045), gl, x, y + 0.212, z));
      neck(solid, x, y + 0.234, z, 0.013, 0.075, gl);
      label(x, y + 0.09, z + 0.037, 0.05, 0.07);
    } else if (kind === "beer") {
      const gl = pick(GLASS.beer);
      solid.push(piece(cyl(0.03, 0.03, 0.12), gl, x, y + 0.06, z));
      solid.push(piece(cyl(0.012, 0.03, 0.045), gl, x, y + 0.142, z));
      neck(solid, x, y + 0.164, z, 0.012, 0.05, gl);
      label(x, y + 0.065, z + 0.031, 0.042, 0.05);
    } else if (kind === "jug") {
      // a stone jenever jug: salt-glazed grey below, brown glaze at the shoulder, a cork and a small ear of a handle
      solid.push(piece(cyl(0.045, 0.042, 0.17), 0xc9b48a, x, y + 0.085, z));
      solid.push(piece(cyl(0.016, 0.045, 0.045), 0x6a3a1a, x, y + 0.192, z));
      neck(solid, x, y + 0.214, z, 0.012, 0.03, 0x6a3a1a);
      const ear = new THREE.TorusGeometry(0.028, 0.007, 3, 6, Math.PI);
      ear.rotateZ(-Math.PI / 2);
      solid.push(piece(ear, 0xc9b48a, x + 0.042, y + 0.16, z));
      label(x, y + 0.1, z + 0.046, 0.04, 0.04);
    } else if (kind === "square") {
      const gl = pick(GLASS.square),
        to = gl === 0xd8e2d8 ? clear : solid;
      to.push(piece(new THREE.BoxGeometry(0.062, 0.17, 0.062), gl, x, y + 0.085, z));
      const sh = cyl(0.014, 0.044, 0.035, 4);
      sh.rotateY(Math.PI / 4);
      to.push(piece(sh, gl, x, y + 0.187, z));
      neck(to, x, y + 0.205, z, 0.013, 0.045, gl);
      label(x, y + 0.08, z + 0.033, 0.054, 0.08);
    } else {
      const gl = pick(GLASS.flask),
        body = new THREE.SphereGeometry(0.05, 7, 5);
      body.scale(1, 0.95, 0.6);
      solid.push(piece(body, gl, x, y + 0.05, z));
      neck(solid, x, y + 0.09, z, 0.011, 0.06, gl);
      label(x, y + 0.05, z + 0.032, 0.045, 0.035);
    }
  }
  return {
    add,
    /** a shelf from x0 to x1 at height y, the fronts at z */
    shelf(x0: number, x1: number, y: number, z: number): void {
      for (let x = x0; x <= x1; x += rnd(0.12, 0.2)) add(pick(KINDS), x, y, z);
    },
    into(parent: THREE.Object3D): void {
      const merge = (gs: THREE.BufferGeometry[], m: THREE.Material) => {
        if (!gs.length) return;
        parent.add(new THREE.Mesh(BufferGeometryUtils.mergeBufferGeometries(gs), m));
        for (const g of gs) g.dispose();
      };
      merge(solid, lam(0xffffff, { vertexColors: true, emissive: 0x24170c }));
      merge(clear, lam(0xffffff, { vertexColors: true, emissive: 0x24170c, transparent: true, opacity: 0.55 }));
    },
  };
}
