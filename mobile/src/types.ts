export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture?: string | null;
  isAdmin: boolean;
}

export interface Project {
  id: string;
  name: string;
  active: boolean;
  createdAt?: string;
  otRequestCount?: number;
}

export type TaskStatus = 'DONE_LOCAL' | 'DONE_STAGING' | 'DONE_PRODUCTION' | 'IN_PROGRESS';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface UserRef {
  id: string;
  name: string;
  email: string;
}

export interface OtRequest {
  id: string;
  userId: string;
  projectId: string;
  workDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  durationHours: number;
  taskLink: string;
  taskStatus: TaskStatus;
  hoursToComplete: number | null;
  approvalStatus: ApprovalStatus;
  reviewedByEmail?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
  createdAt: string;
  // Optimistic-concurrency token; sent back when an admin reviews.
  version: number;
  project?: { id: string; name: string };
  user?: UserRef;
}

export interface OtBlockPayload {
  workDate: string;
  startTime: string;
  endTime: string;
  projectId: string;
  taskLink: string;
  taskStatus: TaskStatus;
  hoursToComplete?: number;
}

export interface UserSummary {
  userId: string;
  name: string;
  email: string;
  totalRequests: number;
  pendingHours: number;
  approvedHours: number;
  rejectedHours: number;
}

/** A single OT block being drafted before submit. */
export interface OtBlockDraft {
  key: string;
  workDate: Date | null;
  startTime: Date | null; // only hours/minutes are used
  endTime: Date | null;
  projectId: string | null;
  taskLink: string;
  taskStatus: TaskStatus;
  hoursToComplete: string;
  /** Teamwork time estimate (hours) — shown as the Duration hint until times are set. Not submitted. */
  estimatedHours?: number | null;
}

/** Teamwork task lookup result (for OT auto-fill from a pasted task link). */
export interface TeamworkTaskInfo {
  task: {
    id: number;
    name: string;
    projectName: string;
    tasklistName: string;
    completed: boolean;
    estimatedMinutes: number;
    url: string;
  };
  /** Our Project id whose name matches the Teamwork project, or null. */
  matchedProjectId: string | null;
}
