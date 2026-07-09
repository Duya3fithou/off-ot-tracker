import type { TaskStatus } from '../types';

/** Options for the task-status picker (order shown to the user). */
export const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'DONE_LOCAL', label: 'Done Local' },
  { value: 'DONE_STAGING', label: 'Done Staging' },
  { value: 'DONE_PRODUCTION', label: 'Done Production' },
  { value: 'IN_PROGRESS', label: 'In progress — need X hours' },
];

/** Short human label for a task status; appends hours-left when in progress. */
export function taskStatusLabel(
  status: TaskStatus,
  hoursToComplete?: number | null,
): string {
  switch (status) {
    case 'DONE_LOCAL':
      return 'Done Local';
    case 'DONE_STAGING':
      return 'Done Staging';
    case 'DONE_PRODUCTION':
      return 'Done Production';
    case 'IN_PROGRESS':
      return `In progress — ${hoursToComplete ?? '?'}h left`;
    default:
      return status;
  }
}
