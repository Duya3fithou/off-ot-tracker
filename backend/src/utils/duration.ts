/**
 * Compute OT duration in hours from a work date and start/end times.
 *
 * Times are "HH:MM" in 24h format. If the end time is less than or equal to the
 * start time it is treated as crossing midnight into the next day
 * (e.g. 20:00 -> 00:00 = 4 hours), matching the spreadsheet the app replaces.
 *
 * Returns hours rounded to 2 decimals (e.g. 3.5).
 */
export function computeDurationHours(startTime: string, endTime: string): number {
  const start = parseHHMM(startTime);
  const end = parseHHMM(endTime);

  let minutes = end - start;
  if (minutes <= 0) {
    // crosses midnight
    minutes += 24 * 60;
  }
  return Math.round((minutes / 60) * 100) / 100;
}

function parseHHMM(value: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) {
    throw new Error(`Invalid time format (expected HH:MM): ${value}`);
  }
  const hours = Number(match[1]);
  const mins = Number(match[2]);
  if (hours < 0 || hours > 23 || mins < 0 || mins > 59) {
    throw new Error(`Invalid time value: ${value}`);
  }
  return hours * 60 + mins;
}
