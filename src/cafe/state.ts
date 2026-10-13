// What the café keeps between frames.
import type { THREE } from "../render/three";
import type { Figure } from "../people/figure";
import type { Glass, Cigar } from "../people/things";
import type { Color } from "../types";
import type { Prop, Venue } from "../data/venues";

export const WX = 5,
  WZ = 3.8,
  H = 3.1;

export interface Ashtray {
  g: THREE.Group;
  tip: THREE.Mesh;
  lit: boolean;
  litUntil: number;
  next: number;
}
export interface RailProps {
  tray: Ashtray;
  glass: Glass;
  level: number;
  refillAt: number;
}

export const C = {
  /** speech from the barman (main.ts wires it to the bubble) */
  say: (_who: string, _text: string): void => {},
  ashtrays: [] as Ashtray[],
  props: {} as Record<Color, RailProps>,
  patrons: [] as Figure[],
  bartender: null as Figure | null,
  lamps: null as THREE.Group | null,
  overhead: null as THREE.Group | null,
  /** groups the venue switches on and off */
  groups: {} as Partial<Record<Prop, THREE.Group>>,
  venue: null as Venue | null,
  vm: null as null | {
    g: THREE.Group;
    cigar: Cigar;
    glass: Glass;
    chalk: THREE.Mesh;
    anim: null | {
      kind: "cigar" | "glass" | "chalk" | "knock";
      t0: number;
      from: number;
      to: number;
      puffed?: boolean;
    };
  },
};
export const rnd = (a: number, b: number): number => a + Math.random() * (b - a);
