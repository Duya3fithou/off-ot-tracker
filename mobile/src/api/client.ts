import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { apiRoot } from '../config';
import type {
  AuthUser,
  OtBlockPayload,
  OtRequest,
  Project,
  TeamworkTaskInfo,
  UserRef,
  UserSummary,
} from '../types';

const TOKEN_KEY = 'ot_logger_token';

// In-memory copy so the axios interceptor can read it synchronously.
let authToken: string | null = null;

// `timeout` matters on mobile: without it, an unreachable backend leaves requests
// (and any loading spinner awaiting them) hanging forever instead of failing cleanly.
export const api = axios.create({ baseURL: apiRoot, timeout: 15000 });

api.interceptors.request.use((cfg) => {
  if (authToken) {
    cfg.headers.Authorization = `Bearer ${authToken}`;
  }
  return cfg;
});

/** Load any persisted token into memory (call once on startup). */
export async function loadStoredToken(): Promise<string | null> {
  authToken = await SecureStore.getItemAsync(TOKEN_KEY);
  return authToken;
}

export async function setStoredToken(token: string | null): Promise<void> {
  authToken = token;
  if (token) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}

/** Extract a friendly message from an axios error. */
export function apiErrorMessage(err: unknown, fallback = 'Request failed'): string {
  const anyErr = err as { response?: { data?: { error?: string } }; message?: string };
  return anyErr?.response?.data?.error ?? anyErr?.message ?? fallback;
}

// --- Auth ---
export async function loginWithGoogle(
  idToken: string,
): Promise<{ token: string; user: AuthUser }> {
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

export async function deleteProject(id: string): Promise<number> {
  const { data } = await api.delete(`/projects/${id}`);
  return data.deletedOtRequests ?? 0;
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
export async function fetchAdminUsers(): Promise<UserRef[]> {
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

/** True if an error is the 409 "stale / changed since loaded" concurrency conflict. */
export function isConflictError(err: unknown): boolean {
  return (err as { response?: { status?: number } })?.response?.status === 409;
}
