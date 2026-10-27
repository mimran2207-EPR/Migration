import { deep1 } from "./part1";
import { deep2 } from "./part2";
import { deep3 } from "./part3";
import { deep4 } from "./part4";
import type { DeepConcept } from "./types";

export type { DeepConcept };
export const deep: DeepConcept[] = [...deep1, ...deep2, ...deep3, ...deep4];
export const deepByN = new Map(deep.map((d) => [d.n, d]));
