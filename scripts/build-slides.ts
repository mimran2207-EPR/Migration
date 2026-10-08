// Renders every step's slide (slides/slides.ts) to public/screens/<id>.jpg (1600×900) with the
// installed Chrome, and writes the highlighted item's box to src/content/highlights.ts.
//   npm run slides            all steps
//   npm run slides -- 2.3 5.1 only these
import { copyFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { ARCH_BOXES, ARCH_SIZE } from "../slides/architecture-boxes";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright-core";
import { modules } from "../src/content/lessons";
import { SLIDES, type Item, type Slide } from "../slides/slides";

const W = 1600;
const H = 900;
const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
].find((p) => existsSync(p));

// Escapes HTML and keeps number ranges ("7–8", "11821–11837") in reading order inside RTL text.
const esc = (s = "") =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/(\d[\d,]*)–(\d[\d,]*)/g, '<bdi dir="ltr">$1–$2</bdi>');
const hl = (i: number, h?: number) => (i === h ? " hl" : "");

function card(it: Item, cls: string) {
  return `<div class="card${cls}">
    ${it.icon ? `<div class="icon">${it.icon}</div>` : ""}
    ${it.tag ? `<div class="tag">${esc(it.tag)}</div>` : ""}
    <div class="ct">${esc(it.title)}</div>
    ${it.text ? `<div class="cx">${esc(it.text)}</div>` : ""}
  </div>`;
}

function body(s: Slide): string {
  switch (s.kind) {
    case "arch":
    case "golden":
      return "";
    case "cards":
      return `<div class="grid" style="grid-template-columns:repeat(${s.cols ?? 3},1fr)">${s.items.map((it, i) => card(it, hl(i, s.hl))).join("")}</div>`;
    case "flow":
      return `<div class="flow">${s.items
        .map((it, i) => (i ? `<div class="arrow">←</div>` : "") + card(it, " step" + hl(i, s.hl)))
        .join("")}</div>`;
    case "stats":
      return `<div class="grid" style="grid-template-columns:repeat(${s.items.length},1fr)">${s.items
        .map((it, i) => `<div class="card stat${hl(i, s.hl)}"><div class="num">${esc(it.value)}</div><div class="ct">${esc(it.label)}</div></div>`)
        .join("")}</div>`;
    case "table":
      return `<table><thead><tr>${s.head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${s.rows
        .map((r, i) => `<tr class="${hl(i, s.hl)}">${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`)
        .join("")}</tbody></table>`;
    case "compare": {
      const col = (c: { title: string; items: string[] }, i: number) =>
        `<div class="card col${hl(i, s.hl)}"><div class="ct">${esc(c.title)}</div><ul>${c.items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`;
      return `<div class="compare">${col(s.left, 0)}<div class="vs">←</div>${col(s.right, 1)}</div>`;
    }
  }
}

function page(moduleTitle: string, icon: string, stepId: string, title: string, s: Slide): string {
  return `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;800&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0}
  body{width:${W}px;height:${H}px;font-family:Heebo,Arial,sans-serif;color:#1e293b;
    background:radial-gradient(1200px 600px at 85% -10%,#e0e7ff 0,transparent 60%),radial-gradient(900px 500px at 0% 110%,#cffafe 0,transparent 55%),#f8fafc;
    display:flex;flex-direction:column;padding:48px 72px 32px}
  header{display:flex;align-items:center;gap:20px;margin-bottom:44px}
  .chip{background:linear-gradient(90deg,#4338ca,#06b6d4);color:#fff;border-radius:999px;padding:8px 22px;font-weight:600;font-size:24px}
  h1{font-size:56px;font-weight:800;color:#1e1b4b}
  main{flex:1;display:flex;flex-direction:column;justify-content:center}
  .grid{display:grid;gap:28px}
  .card{background:#fff;border-radius:24px;padding:30px 32px;box-shadow:0 8px 30px rgba(30,27,75,.08);border:2px solid #e2e8f0;position:relative}
  .card.hl{border-color:#4338ca;box-shadow:0 12px 40px rgba(67,56,202,.22)}
  .icon{font-size:52px;margin-bottom:12px}
  .tag{position:absolute;top:22px;left:24px;background:#eef2ff;color:#4338ca;font-weight:800;border-radius:12px;padding:4px 14px;font-size:24px}
  .ct{font-size:34px;font-weight:800;color:#1e1b4b}
  .cx{font-size:26px;color:#475569;margin-top:8px;line-height:1.35}
  .flow{display:flex;align-items:stretch;gap:14px}
  .flow .card{flex:1;text-align:center;display:flex;flex-direction:column;justify-content:center}
  .flow .step .tag{position:static;display:inline-block;margin:0 auto 10px;font-size:30px}
  .arrow{align-self:center;font-size:48px;color:#06b6d4;font-weight:800}
  .stat{text-align:center}
  .num{font-size:96px;font-weight:800;background:linear-gradient(90deg,#4338ca,#06b6d4);-webkit-background-clip:text;color:transparent;line-height:1.1}
  table{width:100%;border-collapse:separate;border-spacing:0 14px;font-size:30px}
  th{text-align:right;color:#4338ca;font-size:26px;padding:0 28px}
  td{background:#fff;padding:22px 28px;border-top:2px solid #e2e8f0;border-bottom:2px solid #e2e8f0}
  td:first-child{border-right:2px solid #e2e8f0;border-radius:0 18px 18px 0;font-weight:800;color:#1e1b4b;width:34%}
  td:last-child{border-left:2px solid #e2e8f0;border-radius:18px 0 0 18px;color:#475569}
  tr.hl td{border-color:#4338ca}
  .compare{display:flex;gap:28px;align-items:stretch}
  .compare .col{flex:1}
  .compare ul{margin-top:18px;padding-right:30px;font-size:30px;line-height:1.7;color:#334155}
  .vs{align-self:center;font-size:56px;color:#06b6d4;font-weight:800}
  .note{margin-top:34px;text-align:center;font-size:28px;color:#4338ca;font-weight:600;background:#eef2ff;border-radius:16px;padding:14px 24px}
  footer{display:flex;justify-content:space-between;color:#94a3b8;font-size:20px;margin-top:24px}
</style></head><body>
<main>${body(s)}${s.note ? `<div class="note">${esc(s.note)}</div>` : ""}</main>
<footer><span>EPR מערכות · מעבר מאקסס ל־WEB</span><span>שלב ${stepId}</span></footer>
</body></html>`;
}

async function main() {
  if (!CHROME) throw new Error("Chrome / Edge not found");
  const only = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: CHROME });
  const tab = await browser.newPage({ viewport: { width: W, height: H } });
  const boxes: Record<string, { x: number; y: number; w: number; h: number }> = {};
  // golden-kind slides render one of the HTML diagrams in docs/golden-slide/, screenshotted once each
  const GOLDEN_DOCS = { slide: "golden-slide", layers: "golden-layers" } as const;
  const goldenPages: Record<string, import("playwright-core").Page> = {};
  for (const m of modules) {
    for (const st of m.steps) {
      const s = SLIDES[st.id];
      if (!s) throw new Error(`no slide for ${st.id}`);
      if (s.kind === "golden") {
        // the diagram itself (docs/golden-slide/<doc>.html); highlight = union of its elements
        const name = GOLDEN_DOCS[s.doc ?? "slide"];
        let golden = goldenPages[name];
        if (!golden) {
          golden = goldenPages[name] = await browser.newPage({ viewport: { width: W, height: H } });
          await golden.goto(pathToFileURL(resolve(`docs/golden-slide/${name}.html`)).href, { waitUntil: "networkidle" });
          await golden.evaluate(() => document.fonts.ready);
          await golden.screenshot({ path: `slides/${name}.jpg`, type: "jpeg", quality: 90 });
        }
        const r = await golden.evaluate((ids: string[]) => {
          const rs = ids.map((id) => document.getElementById(id)!.getBoundingClientRect());
          const l = Math.min(...rs.map((b) => b.left)), t = Math.min(...rs.map((b) => b.top));
          return { l, t, r: Math.max(...rs.map((b) => b.right)), b: Math.max(...rs.map((b) => b.bottom)) };
        }, s.targets);
        const p = (v: number, d: number) => Math.round((v / d) * 1000) / 10;
        const [a, b] = [Math.max(0, r.l - 8), Math.max(0, r.t - 8)];
        const [c, d] = [Math.min(W, r.r + 8), Math.min(H, r.b + 8)];
        boxes[st.id] = { x: p(a, W), y: p(b, H), w: p(c - a, W), h: p(d - b, H) };
        if (!only.length || only.includes(st.id)) copyFileSync(`slides/${name}.jpg`, `public/screens/${st.id}.jpg`);
        continue;
      }
      if (s.kind === "arch") {
        // the architecture diagram itself, with the component's region as the highlight
        const [x1, y1, x2, y2] = ARCH_BOXES[s.box];
        const p = (v: number, d: number) => Math.round((v / d) * 1000) / 10;
        const { w, h } = ARCH_SIZE;
        const [a, b] = [Math.max(0, x1 - 6), Math.max(0, y1 - 6)];
        const [c, d] = [Math.min(w, x2 + 6), Math.min(h, y2 + 6)];
        boxes[st.id] = { x: p(a, w), y: p(b, h), w: p(c - a, w), h: p(d - b, h) };
        if (!only.length || only.includes(st.id)) copyFileSync("slides/architecture.jpg", `public/screens/${st.id}.jpg`);
        continue;
      }
      await tab.setContent(page(m.title, m.icon, st.id, st.title, s), { waitUntil: "networkidle" });
      await tab.evaluate(() => document.fonts.ready);
      const r = await tab.evaluate(() => {
        const e = document.querySelector(".hl");
        if (!e) return null;
        const b = e.getBoundingClientRect();
        return { left: b.left, top: b.top, width: b.width, height: b.height };
      });
      if (r) {
        const p = (v: number, d: number) => Math.round((v / d) * 1000) / 10;
        const m8 = 10;
        boxes[st.id] = { x: p(r.left - m8, W), y: p(r.top - m8, H), w: p(r.width + 2 * m8, W), h: p(r.height + 2 * m8, H) };
      }
      if (!only.length || only.includes(st.id)) {
        await tab.screenshot({ path: `public/screens/${st.id}.jpg`, type: "jpeg", quality: 82 });
        console.log("slide", st.id);
      }
    }
  }
  // Downloadable PDFs of the diagrams (without the presenter): the golden slide as vector, the
  // architecture diagram once, and every other slide from its image.
  const downloads: Record<string, string> = {};
  const pdfPage = await browser.newPage();
  const imgPdf = async (img: string, w: number, h: number, out: string) => {
    const src = pathToFileURL(resolve(img)).href;
    await pdfPage.setContent(`<html><body style="margin:0"><img src="${src}" style="display:block;width:${w}px;height:${h}px"></body></html>`, { waitUntil: "load" });
    await pdfPage.pdf({ path: out, width: `${w}px`, height: `${h}px`, printBackground: true, pageRanges: "1" });
  };
  mkdirSync("public/pdf", { recursive: true });
  let archDone = false;
  const goldenDone = new Set<string>();
  for (const m of modules) {
    for (const st of m.steps) {
      const s = SLIDES[st.id];
      if (s.kind === "golden") {
        const name = GOLDEN_DOCS[s.doc ?? "slide"];
        if (!goldenDone.has(name)) {
          await pdfPage.goto(pathToFileURL(resolve(`docs/golden-slide/${name}.html`)).href, { waitUntil: "networkidle" });
          await pdfPage.evaluate(() => document.fonts.ready);
          await pdfPage.pdf({ path: `public/pdf/${name}.pdf`, width: "1600px", height: "900px", printBackground: true, pageRanges: "1" });
          goldenDone.add(name);
        }
        downloads[st.id] = name;
      } else if (s.kind === "arch") {
        if (!archDone) await imgPdf("slides/architecture.jpg", ARCH_SIZE.w, ARCH_SIZE.h, "public/pdf/architecture.pdf");
        archDone = true;
        downloads[st.id] = "architecture";
      } else {
        if (!only.length || only.includes(st.id)) await imgPdf(`public/screens/${st.id}.jpg`, W, H, `public/pdf/${st.id}.pdf`);
        downloads[st.id] = st.id;
      }
    }
  }
  await browser.close();
  writeFileSync(
    "src/content/downloads.ts",
    `// Generated by scripts/build-slides.ts — PDF of each step's diagram (public/pdf/<name>.pdf).
` +
      `export const DOWNLOADS: Record<string, string> = ${JSON.stringify(downloads, null, 2)};
`,
  );
  writeFileSync(
    "src/content/highlights.ts",
    `// Generated by scripts/build-slides.ts — the highlighted item of each slide, in % of the image.\n` +
      `import type { Highlight } from "./types";\n\n` +
      `export const HIGHLIGHTS: Record<string, Highlight> = ${JSON.stringify(boxes, null, 2)};\n`,
  );
  console.log(`highlights: ${Object.keys(boxes).length}`);
}

void main();
