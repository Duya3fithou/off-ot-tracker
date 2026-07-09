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
  createdAt: string;
  // Present on the admin listing (/projects/all): number of OT requests using it.
  otRequestCount?: number;
}

export type TaskStatus = 'DONE' | 'IN_PROGRESS';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface OtRequest {
  id: string;
  userId: string;
  projectId: string;
  workDate: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  taskLink: string;
  taskStatus: TaskStatus;
  hoursToComplete: number | null;
  approvalStatus: ApprovalStatus;
  reviewedByEmail: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
  // Optimistic-concurrency token; sent back when an admin reviews.
  version: number;
  project?: { id: string; name: string };
  user?: { id: string; name: string; email: string };
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

export interface AdminUser {
  id: string;
  name: string;
  email: string;
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

/** Admin-configurable app settings (Admin → Settings tab). */
export interface AppSettings {
  /** When on, admins get an email each time an employee submits OT. */
  emailOnOtSubmit: boolean;
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
