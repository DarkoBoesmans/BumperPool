// Three green-shaded lamps on a brass bar over the table, with a haze cone under each. Hidden in the top view.
import { THREE, add, lam, basic, facet } from "../render/three";
import { S } from "../render/renderer";
import { TBL } from "../render/table";
import { C } from "./state";

const LAMP = {} as { shade: THREE.MeshLambertMaterial; rim: THREE.MeshBasicMaterial };

export function buildLamps(scene: THREE.Scene): void {
  const g = (C.lamps = new THREE.Group());
  scene.add(g);
  const brass = TBL.brass;
  add(g, new THREE.CylinderGeometry(0.01, 0.01, 1.5, 6), brass, 0, 1.02, 0).rotation.z = Math.PI / 2;
  for (const x of [-0.7, 0.7]) add(g, new THREE.CylinderGeometry(0.004, 0.004, 1.4, 4), brass, x, 1.72, 0);
  const shade = facet(new THREE.CylinderGeometry(0.06, 0.2, 0.18, 10, 1, true));
  LAMP.shade = lam(0x0d7a3e, { emissive: 0x05301a, side: THREE.FrontSide });
  LAMP.rim = basic(0x7dffa6);
  const inner = basic(0xfff1c8, { side: THREE.BackSide });
  const haze = basic(0xffe6b0, {
    transparent: true,
    opacity: 0.022,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  for (const x of [-0.6, 0, 0.6]) {
    add(g, shade, LAMP.shade, x, 0.89, 0);
    add(g, shade, inner, x, 0.89, 0).scale.setScalar(0.98);
    add(g, new THREE.TorusGeometry(0.2, 0.006, 3, 20), LAMP.rim, x, 0.8, 0).rotation.x = Math.PI / 2;
    add(g, new THREE.SphereGeometry(0.035, 6, 4), basic(0xfffbe8), x, 0.86, 0);
    add(g, new THREE.CylinderGeometry(0.008, 0.008, 0.06, 6), brass, x, 1.0, 0);
    add(g, new THREE.ConeGeometry(0.62, 0.8, 12, 1, true), haze, x, 0.4, 0);
    S.flares.push({ pos: new THREE.Vector3(x, 0.86, 0), k: 1, vis: () => g.visible });
  }
}

/** lamp shades in the venue's colour: green in a café, black in the hall, sea blue in the deep */
export function tintLamps(shade: string, rim: string): void {
  LAMP.shade.color.set(shade);
  LAMP.shade.emissive.set(shade).multiplyScalar(0.35);
  LAMP.rim.color.set(rim);
}
