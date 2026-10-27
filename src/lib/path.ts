// The learning path: where the learner stopped and how they listen.
const LAST_KEY = "migration-path-last-v1";
const PREFS_KEY = "migration-path-prefs-v1";

export interface PathPrefs {
  /** Keep playing the next concept when one ends (listening on the road). */
  auto: boolean;
  rate: number;
}

export const RATES = [1, 1.15, 1.3, 1.5];

export function loadLast(): number | null {
  try {
    const n = Number(window.localStorage.getItem(LAST_KEY));
    return Number.isInteger(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export function saveLast(n: number): void {
  try {
    window.localStorage.setItem(LAST_KEY, String(n));
  } catch {
    /* ignore */
  }
}

export function loadPrefs(): PathPrefs {
  try {
    const p = JSON.parse(
      window.localStorage.getItem(PREFS_KEY) ?? "{}",
    ) as Partial<PathPrefs>;
    return {
      auto: p.auto ?? true,
      rate: RATES.includes(p.rate ?? 1) ? (p.rate ?? 1) : 1,
    };
  } catch {
    return { auto: true, rate: 1 };
  }
}

export function savePrefs(prefs: PathPrefs): void {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

export const audioUrl = (n: number) => `/narration/concepts/${n}.mp3`;

/** "#/c/12" → 12 */
export function conceptFromHash(hash: string): number | null {
  const m = /^#\/c\/(\d+)$/.exec(hash);
  return m ? Number(m[1]) : null;
}
