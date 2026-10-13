// Hair, hats and accessories in a handful of polygons each, smooth shaded. The head is about 0.21 m wide, facing +z.
import { THREE, add, lam, basic, phong, facet } from "../render/three";
import { shade } from "./face";
import type { Look } from "../types";

const half = (r: number, w = 14, h = 6) => new THREE.SphereGeometry(r, w, h, 0, Math.PI * 2, 0, Math.PI / 2);
const gold = () => phong(0xf2c84a, { specular: 0xfff0c0, shininess: 60, emissive: 0x2a1a05 });

export function hairMesh(L: Look, head: THREE.Object3D): void {
  const st = L.hairStyle;
  if (st === "bald") return;
  const m = lam(st === "buzz" ? shade(L.hair, 0.55, L.skin) : L.hair);
  if (st === "perm" || st === "curly") {
    add(head, new THREE.IcosahedronGeometry(st === "perm" ? 0.13 : 0.124, 1), m, 0, 0.06, -0.035).scale.set(
      1.05,
      0.85,
      0.95,
    );
    return;
  }
  if (st === "mohawk") {
    add(head, new THREE.BoxGeometry(0.035, 0.08, 0.2), m, 0, 0.11, -0.01);
    return;
  }
  // the cap tilts back: it covers the crown and the back of the head, and stops above the brows at the front
  add(head, half(st === "buzz" ? 0.111 : 0.115), m, 0, 0.012, -0.008).rotation.x = -0.55;
  switch (st) {
    case "quiff":
      add(head, new THREE.BoxGeometry(0.1, 0.05, 0.08), m, 0, 0.11, 0.06).rotation.x = -0.3;
      break;
    case "side":
      add(head, new THREE.BoxGeometry(0.07, 0.022, 0.1), m, 0.045, 0.11, 0.02).rotation.z = -0.3;
      break;
    case "bob": {
      const g = new THREE.CylinderGeometry(0.124, 0.13, 0.13, 9, 1, true, 0.95, Math.PI * 2 - 1.9);
      add(head, facet(g), lam(L.hair, { side: THREE.DoubleSide }), 0, -0.03, -0.004);
      break;
    }
    case "long":
      add(head, new THREE.BoxGeometry(0.21, 0.32, 0.05), m, 0, -0.11, -0.085);
      for (const s of [-1, 1]) add(head, new THREE.BoxGeometry(0.035, 0.22, 0.07), m, s * 0.1, -0.08, -0.02);
      break;
    case "bun":
      add(head, facet(new THREE.IcosahedronGeometry(0.055, 0)), m, 0, 0.1, -0.08);
      break;
    case "pony":
      add(head, facet(new THREE.CylinderGeometry(0.032, 0.012, 0.2, 5)), m, 0, -0.04, -0.13).rotation.x = 0.45;
      break;
    case "pigtails":
      for (const s of [-1, 1]) {
        const t = add(head, facet(new THREE.CylinderGeometry(0.03, 0.012, 0.17, 5)), m, s * 0.12, -0.04, -0.03);
        t.rotation.z = s * 0.45;
      }
      break;
  }
}

export function hatMesh(L: Look, head: THREE.Object3D): void {
  const m = lam(L.hatColor || L.hair),
    y = 0.08;
  switch (L.hat) {
    case "cap":
      add(head, half(0.12), m, 0, 0.018, -0.008).rotation.x = -0.5;
      add(head, new THREE.BoxGeometry(0.15, 0.012, 0.12), m, 0, -0.02, -0.15).rotation.x = -0.35; // worn backwards
      break;
    case "flatcap":
      add(
        head,
        facet(new THREE.SphereGeometry(0.124, 7, 3, 0, Math.PI * 2, 0, Math.PI / 2.6)),
        m,
        0,
        0.03,
        0.01,
      ).scale.set(1, 0.6, 1.1);
      add(head, new THREE.BoxGeometry(0.15, 0.012, 0.07), m, 0, 0.045, 0.12);
      break;
    case "fedora":
      add(head, facet(new THREE.CylinderGeometry(0.09, 0.105, 0.11, 7)), m, 0, y + 0.04, 0);
      add(head, facet(new THREE.CylinderGeometry(0.19, 0.19, 0.012, 9)), m, 0, y - 0.01, 0);
      add(head, new THREE.CylinderGeometry(0.106, 0.106, 0.025, 7), lam(0x5a1a1a), 0, y, 0);
      break;
    case "tophat":
      add(head, facet(new THREE.CylinderGeometry(0.088, 0.088, 0.19, 8)), m, 0, y + 0.08, 0);
      add(head, facet(new THREE.CylinderGeometry(0.16, 0.16, 0.012, 10)), m, 0, y - 0.01, 0);
      add(head, new THREE.CylinderGeometry(0.09, 0.09, 0.03, 8), lam(0x7a1a1a), 0, y + 0.01, 0);
      break;
    case "beret":
      add(
        head,
        facet(new THREE.SphereGeometry(0.13, 7, 3, 0, Math.PI * 2, 0, Math.PI / 2.4)),
        m,
        0.02,
        0.04,
        0,
      ).scale.set(1.1, 0.45, 1.1);
      break;
    case "beanie":
      add(head, half(0.124), m, 0, 0.02, 0).scale.y = 1.25;
      add(
        head,
        new THREE.CylinderGeometry(0.126, 0.126, 0.04, 8),
        lam(new THREE.Color(L.hatColor || L.hair).multiplyScalar(1.35)),
        0,
        0.03,
        0,
      );
      break;
    case "headband":
      add(
        head,
        new THREE.CylinderGeometry(0.119, 0.119, 0.03, 9, 1, true),
        lam(L.hatColor || "#e8e0d0", { side: THREE.DoubleSide }),
        0,
        0.045,
        0,
      );
      break;
    case "bandana":
      add(head, half(0.121), m, 0, 0.018, -0.004);
      add(head, facet(new THREE.TetrahedronGeometry(0.035)), m, 0, 0.0, -0.12);
      break;
    case "cowboy": {
      add(head, facet(new THREE.CylinderGeometry(0.075, 0.1, 0.11, 7)), m, 0, y + 0.05, 0).scale.z = 0.85;
      add(head, new THREE.CylinderGeometry(0.101, 0.101, 0.022, 7), lam(0x3a2414), 0, y + 0.005, 0).scale.z = 0.86;
      add(head, facet(new THREE.CylinderGeometry(0.23, 0.21, 0.012, 10)), m, 0, y - 0.012, 0).scale.z = 0.85;
      for (const s of [-1, 1])
        add(head, new THREE.BoxGeometry(0.07, 0.012, 0.26), m, s * 0.2, y + 0.012, 0).rotation.z = s * 0.6; // curled sides
      break;
    }
    case "crown": {
      const g = gold();
      g.side = THREE.DoubleSide;
      add(head, facet(new THREE.CylinderGeometry(0.1, 0.095, 0.05, 8, 1, true)), g, 0, y + 0.02, 0);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        add(head, new THREE.ConeGeometry(0.016, 0.05, 4), g, Math.sin(a) * 0.097, y + 0.07, Math.cos(a) * 0.097);
      }
      add(head, new THREE.OctahedronGeometry(0.014), basic(0xd23a4a), 0, y + 0.025, 0.1);
      break;
    }
    case "viking":
      add(head, half(0.122, 8), m, 0, 0.02, 0);
      add(head, new THREE.CylinderGeometry(0.124, 0.124, 0.025, 8), lam(0x6a5a3a), 0, 0.025, 0);
      for (const s of [-1, 1])
        add(head, facet(new THREE.ConeGeometry(0.025, 0.14, 5)), lam(0xefe6cf), s * 0.15, 0.1, 0).rotation.z =
          -s * 0.75;
      break;
    case "snakes":
      for (let i = 0; i < 9; i++) {
        const a = (i / 9 - 0.5) * Math.PI * 1.6 + Math.PI,
          snake = add(
            head,
            facet(new THREE.CylinderGeometry(0.008, 0.016, 0.13, 5)),
            m,
            Math.sin(a) * 0.1,
            0.06,
            Math.cos(a) * 0.1,
          );
        snake.rotation.set(Math.cos(a) * 0.9, 0, -Math.sin(a) * 0.9);
      }
      break;
  }
}

/** glasses, earrings, necklace, bow tie */
export function extrasMesh(L: Look, head: THREE.Object3D, torso: THREE.Object3D, b: number): void {
  if (L.glasses === "shades")
    add(
      head,
      new THREE.BoxGeometry(0.17, 0.035, 0.02),
      phong(0x08080a, { shininess: 90, specular: 0x888888 }),
      0,
      0.02,
      0.105,
    );
  if (L.earrings === "studs")
    for (const s of [-1, 1]) add(head, new THREE.SphereGeometry(0.009, 5, 3), gold(), s * 0.106, -0.03, 0);
  if (L.earrings === "hoops")
    for (const s of [-1, 1])
      add(head, new THREE.TorusGeometry(0.018, 0.003, 4, 10), gold(), s * 0.108, -0.055, 0).rotation.y = Math.PI / 2;
  if (L.necklace === "pearls")
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 1.2 - Math.PI * 0.1;
      add(
        torso,
        new THREE.SphereGeometry(0.011, 5, 3),
        lam(0xf6f2ea, { emissive: 0x2a2a28 }),
        Math.cos(a) * 0.075,
        0.6 - Math.sin(a) * 0.035,
        Math.sin(a) * 0.07 * b + 0.02,
      );
    }
  if (L.necklace === "chain")
    add(torso, new THREE.TorusGeometry(0.075, 0.006, 4, 14), gold(), 0, 0.59, 0.03).rotation.x = Math.PI / 2 - 0.5;
  if (L.bowtie)
    for (const s of [-1, 1]) {
      const c = add(
        torso,
        new THREE.ConeGeometry(0.025, 0.045, 4),
        lam(L.pattern === "tux" ? 0x0a0a0a : 0xa3261d),
        s * 0.022,
        0.585,
        0.112 * b,
      );
      c.rotation.z = (s * Math.PI) / 2;
    }
}
