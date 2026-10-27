export type Example =
  | { kind: "code"; lang: string; caption: string; code: string }
  | { kind: "compare"; caption: string; before: { title: string; lines: string[] }; after: { title: string; lines: string[] } }
  | { kind: "flow"; caption: string; steps: { label: string; sub?: string }[] };
