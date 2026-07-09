import type { OtBlockDraft, OtBlockPayload, OtRequest } from '../types';
import { toHHMM, toYMD } from '../utils/duration';

/**
 * Validate a single draft block and convert it to an API payload. Returns
 * `{ payload }` or `{ error }` (message without a "Request #n" prefix).
 * Shared by the create and edit flows.
 */
export function draftToPayload(b: OtBlockDraft): { payload?: OtBlockPayload; error?: string } {
  if (!b.workDate) return { error: 'pick a start date' };
  if (!b.startTime) return { error: 'pick a start time' };
  if (!b.endTime) return { error: 'pick an end time' };
  if (!b.projectId) return { error: 'choose a project' };
  if (!b.taskLink.trim()) return { error: 'enter a task link or title' };
  let hoursToComplete: number | undefined;
  if (b.taskStatus === 'IN_PROGRESS') {
    hoursToComplete = Number(b.hoursToComplete);
    if (!Number.isInteger(hoursToComplete) || hoursToComplete <= 0) {
      return { error: 'enter the hours needed to finish' };
    }
  }
  return {
    payload: {
      workDate: toYMD(b.workDate),
      startTime: toHHMM(b.startTime),
      endTime: toHHMM(b.endTime),
      projectId: b.projectId,
      taskLink: b.taskLink.trim(),
      taskStatus: b.taskStatus,
      hoursToComplete,
    },
  };
}

/** Build an editable draft from an existing OT request. */
export function requestToDraft(r: OtRequest): OtBlockDraft {
  const [sh, sm] = r.startTime.split(':').map(Number);
  const [eh, em] = r.endTime.split(':').map(Number);
  const start = new Date();
  start.setHours(sh, sm, 0, 0);
  const end = new Date();
  end.setHours(eh, em, 0, 0);
  return {
    key: r.id,
    workDate: new Date(`${r.workDate}T00:00:00`),
    startTime: start,
    endTime: end,
    projectId: r.projectId,
    taskLink: r.taskLink,
    taskStatus: r.taskStatus,
    hoursToComplete: r.hoursToComplete != null ? String(r.hoursToComplete) : '',
  };
}
