/**
 * Compute OT duration in hours from two Date objects (only hours/minutes used).
 * If end <= start it is treated as crossing midnight (adds 24h), matching the
 * backend. Returns null if either is missing.
 */
export function computeDurationHours(start: Date | null, end: Date | null): number | null {
  if (!start || !end) return null;
  const startMin = start.getHours() * 60 + start.getMinutes();
  const endMin = end.getHours() * 60 + end.getMinutes();
  let diff = endMin - startMin;
  if (diff <= 0) diff += 24 * 60;
  return Math.round((diff / 60) * 100) / 100;
}

export function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

/** Date -> "HH:MM" */
export function toHHMM(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** Date -> "YYYY-MM-DD" */
export function toYMD(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** "YYYY-MM-DD" -> "DD/MM/YYYY" for display */
export function formatDateDisplay(ymd: string): string {
  const [y, m, d] = ymd.split('-');
  return `${d}/${m}/${y}`;
}

export function formatHours(h: number): string {
  return Number.isInteger(h) ? h.toString() : h.toString();
}
