import type { Dayjs } from 'dayjs';

/**
 * Compute duration in hours from two dayjs time values.
 * If end <= start, it is treated as crossing midnight (adds 24h),
 * matching the backend calculation.
 */
export function computeDurationHours(start: Dayjs | null, end: Dayjs | null): number | null {
  if (!start || !end || !start.isValid() || !end.isValid()) return null;
  const startMin = start.hour() * 60 + start.minute();
  const endMin = end.hour() * 60 + end.minute();
  let diff = endMin - startMin;
  if (diff <= 0) diff += 24 * 60;
  return Math.round((diff / 60) * 100) / 100;
}

export function formatHours(hours: number): string {
  return `${hours}h`;
}
