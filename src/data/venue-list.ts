// The bars, one per regular, grouped by grade: the town in venues-street.ts, the big rooms in venues-grand.ts.
import type { Venue } from "./venues";
import { STREET } from "./venues-street";
import { GRAND } from "./venues-grand";

export const VENUES: Venue[] = [...STREET, ...GRAND];
export const venueById = (id: string): Venue => VENUES.find((v) => v.id === id) || VENUES[4];
