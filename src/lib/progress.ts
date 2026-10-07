const KEY = "migration-training-progress-v1";

export type Progress = { done: string[]; last?: string };

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { done: [] };
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data) || !Array.isArray(data.done)) {
      return { done: [] };
    }
    const done = (data.done as unknown[]).filter((x): x is string => typeof x === "string");
    const result: Progress = { done };
    if (typeof data.last === "string") result.last = data.last;
    return result;
  } catch {
    return { done: [] };
  }
}

function save(p: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // storage unavailable; ignore
  }
}

export function markDone(id: string): void {
  const p = loadProgress();
  if (!p.done.includes(id)) p.done.push(id);
  save(p);
}

export function setLast(id: string): void {
  const p = loadProgress();
  p.last = id;
  save(p);
}

export function resetProgress(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
