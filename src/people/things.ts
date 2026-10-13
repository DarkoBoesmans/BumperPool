// Things people hold: a cigar and a tumbler of whisky.
import { THREE, add, lam, basic, facet } from "../render/three";

export type Cigar = THREE.Group & { tip: THREE.Mesh };
export type Glass = THREE.Group & { liquid: THREE.Mesh };

export function cigar(): Cigar {
  const g = new THREE.Group() as Cigar;
  add(g, new THREE.CylinderGeometry(0.008, 0.008, 0.12, 6), lam(0x6b4423), 0, 0.06, 0);
  g.tip = add(g, new THREE.CylinderGeometry(0.0082, 0.0082, 0.006, 6), basic(0xff5a10), 0, 0.122, 0);
  return g;
}

export function glass(): Glass {
  const g = new THREE.Group() as Glass;
  add(
    g,
    facet(new THREE.CylinderGeometry(0.036, 0.031, 0.085, 7)),
    lam(0xf4fbff, { emissive: 0x202628, transparent: true, opacity: 0.4, depthWrite: false }),
    0,
    0.0425,
    0,
  );
  add(
    g,
    new THREE.CylinderGeometry(0.031, 0.031, 0.006, 7),
    lam(0xf4fbff, { transparent: true, opacity: 0.6 }),
    0,
    0.003,
    0,
  );
  g.liquid = add(
    g,
    new THREE.CylinderGeometry(0.032, 0.029, 0.05, 7),
    basic(0xd9852a, { transparent: true, opacity: 0.9 }),
    0,
    0.027,
    0,
  );
  add(
    g,
    new THREE.BoxGeometry(0.025, 0.025, 0.025),
    lam(0xeef6ff, { transparent: true, opacity: 0.5 }),
    0.005,
    0.045,
    0,
  );
  return g;
}
/** how full a glass is, 0..1 */
export function setLiquid(g: Glass, level: number): void {
  const l = Math.max(0.02, level);
  g.liquid.scale.y = l;
  g.liquid.position.y = 0.002 + 0.025 * l;
  g.liquid.visible = level > 0.01;
}
