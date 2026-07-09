import dayjs from 'dayjs';
import type { OtBlockDraft } from '../components/OtBlockCard';
import type { OtBlockPayload, OtRequest } from '../types';

/**
 * Validate a single draft block and convert it to an API payload. Returns
 * either `{ payload }` or `{ error }` (message without a "Request #n" prefix,
 * so callers can prefix as needed). Shared by create and edit flows.
 */
export function draftToPayload(b: OtBlockDraft): { payload?: OtBlockPayload; error?: string } {
  if (!b.workDate?.isValid()) return { error: 'pick a start date' };
  if (!b.startTime?.isValid()) return { error: 'pick a start time' };
  if (!b.endTime?.isValid()) return { error: 'pick an end time' };
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
      workDate: b.workDate.format('YYYY-MM-DD'),
      startTime: b.startTime.format('HH:mm'),
      endTime: b.endTime.format('HH:mm'),
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
  return {
    key: r.id,
    workDate: dayjs(r.workDate),
    startTime: dayjs().hour(sh).minute(sm).second(0),
    endTime: dayjs().hour(eh).minute(em).second(0),
    projectId: r.projectId,
    taskLink: r.taskLink,
    taskStatus: r.taskStatus,
    hoursToComplete: r.hoursToComplete != null ? String(r.hoursToComplete) : '',
  };
}
