// Shorthand for a venue's wall and floor paint, shared by the two bar lists.
import type { Venue } from "./venues";

type Wall = Venue["wall"];
type Floor = Venue["floor"];
export const wall = (
  paper: string,
  print: string,
  panel: string,
  rail: string,
  upper: string,
  kind: Wall["kind"],
): Wall => ({
  paper,
  print,
  panel,
  rail,
  upper,
  kind,
});
export const floor = (a: string, b: string, kind: Floor["kind"]): Floor => ({ a, b, kind });
