/**
 * Extract the first Teamwork task URL from free text (the OT "task link" field
 * may hold "Some title: https://acme.teamwork.com/app/tasks/123"). Returns the
 * URL only if it points at a task (`/tasks/<id>`), else null.
 */
export function extractTeamworkTaskUrl(text: string): string | null {
  const m = text.match(/https?:\/\/[^\s]*teamwork\.com[^\s]*/i);
  if (!m) return null;
  const url = m[0].replace(/[.,;)\]]+$/, ''); // trim trailing punctuation
  return /\/tasks\/\d+/.test(url) ? url : null;
}
