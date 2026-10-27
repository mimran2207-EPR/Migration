// A visual example for every concept (code, before/after, or a flow), keyed by concept number.
import { examplesA } from "./examples-a";
import { examplesB } from "./examples-b";
import type { Example } from "./example-types";

export type { Example };
export const examples: Record<number, Example> = { ...examplesA, ...examplesB };
