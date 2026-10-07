import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { modules } from "../src/content/lessons";
import { renderHeygenMarkdown } from "./heygen";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "docs", "heygen-scripts.md");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, renderHeygenMarkdown(modules), "utf8");
console.log(`wrote ${out}`);
