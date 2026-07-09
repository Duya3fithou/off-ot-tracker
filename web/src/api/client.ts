import axios from 'axios';
import type {
  AdminUser,
  AppSettings,
  AuthUser,
  OtBlockPayload,
  OtRequest,
  Project,
  TeamworkTaskInfo,
  UserSummary,
} from '../types';

const TOKEN_KEY = 'ot_logger_token';

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'}/api`,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

/** Extract a friendly message from an axios error. */
export function apiErrorMessage(err: unknown, fallback = 'Request failed'): string {
  const anyErr = err as { response?: { data?: { error?: string } }; message?: string };
  return anyErr?.response?.data?.error ?? anyErr?.message ?? fallback;
}

/** True if an error is the 409 "stale / changed since loaded" concurrency conflict. */
export function isConflictError(err: unknown): boolean {
  return (err as { response?: { status?: number } })?.response?.status === 409;
}

// --- Auth ---
export async function loginWithGoogle(idToken: string): Promise<{ token: string; user: AuthUser }> {
  const { data } = await api.post('/auth/google', { idToken });
  return data;
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await api.get('/auth/me');
  return data.user;
}

// --- Projects ---
export async function fetchProjects(): Promise<Project[]> {
  const { data } = await api.get('/projects');
  return data.projects;
}

export async function fetchAllProjects(): Promise<Project[]> {
  const { data } = await api.get('/projects/all');
  return data.projects;
}

export async function createProject(name: string): Promise<Project> {
  const { data } = await api.post('/projects', { name });
  return data.project;
}

export async function updateProject(
  id: string,
  patch: { name?: string; active?: boolean },
): Promise<Project> {
  const { data } = await api.patch(`/projects/${id}`, patch);
  return data.project;
}

export async function deleteProject(id: string): Promise<{ deletedOtRequests: number }> {
  const { data } = await api.delete(`/projects/${id}`);
  return data;
}

// --- Teamwork ---
/** Look up a Teamwork task by its URL (for OT auto-fill). */
export async function fetchTeamworkTask(url: string): Promise<TeamworkTaskInfo> {
  const { data } = await api.get('/teamwork/task', { params: { url } });
  return data;
}

// --- OT requests (user) ---
export async function submitOtRequests(requests: OtBlockPayload[]): Promise<number> {
  const { data } = await api.post('/ot-requests', { requests });
  return data.created;
}

export async function fetchMyOtRequests(month?: string): Promise<OtRequest[]> {
  const { data } = await api.get('/ot-requests/mine', { params: month ? { month } : {} });
  return data.requests;
}

/** Edit one of the caller's own OT requests (only allowed while PENDING). */
export async function updateOtRequest(
  id: string,
  payload: OtBlockPayload,
): Promise<OtRequest> {
  const { data } = await api.patch(`/ot-requests/${id}`, payload);
  return data.request;
}

// --- Admin ---
export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const { data } = await api.get('/admin/users');
  return data.users;
}

export async function fetchAdminOtRequests(params: {
  month?: string;
  status?: string;
  userId?: string;
  projectId?: string;
}): Promise<OtRequest[]> {
  const { data } = await api.get('/admin/ot-requests', { params });
  return data.requests;
}

export async function fetchAdminSummary(params: {
  month?: string;
  projectId?: string;
  userId?: string;
}): Promise<UserSummary[]> {
  const { data } = await api.get('/admin/summary', { params });
  return data.summary;
}

export async function reviewOtRequest(
  id: string,
  status: 'APPROVED' | 'REJECTED',
  expectedVersion: number,
  note?: string,
): Promise<OtRequest> {
  const { data } = await api.patch(`/admin/ot-requests/${id}/review`, {
    status,
    expectedVersion,
    note,
  });
  return data.request;
}

/** Download the filtered month's OT entries as an .xlsx (Resource-management layout). */
export async function exportMonthlyOtXlsx(params: {
  month?: string;
  projectId?: string;
  userId?: string;
}): Promise<Blob> {
  const { data } = await api.get('/admin/ot-requests/export.xlsx', {
    params,
    responseType: 'blob',
  });
  return data;
}

// --- Admin settings ---
export async function fetchAdminSettings(): Promise<AppSettings> {
  const { data } = await api.get('/admin/settings');
  return data.settings;
}

export async function updateAdminSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const { data } = await api.patch('/admin/settings', patch);
  return data.settings;
}
