import { config } from '../config';

/**
 * Teamwork integration: given a task URL, fetch the task from the Teamwork REST
 * API so the client can auto-fill an OT request. Uses the v1 endpoint
 * `GET https://<domain>/tasks/<id>.json` (Basic auth, API token as the username).
 */

export interface TeamworkTask {
  id: number;
  name: string;
  projectName: string;
  tasklistName: string;
  completed: boolean;
  /** Teamwork task time estimate, in minutes (0 if none). */
  estimatedMinutes: number;
  url: string;
}

export function isTeamworkConfigured(): boolean {
  return Boolean(config.teamwork.domain && config.teamwork.apiToken);
}

/** Extract the numeric task id from any Teamwork task URL, or null if not one. */
export function parseTaskId(url: string): number | null {
  // Handles /tasks/123, /app/tasks/123, /#/tasks/123, /tasklists/.../tasks/123, etc.
  const m = /\/tasks\/(\d+)/.exec(url);
  return m ? Number(m[1]) : null;
}

/** Fetch + normalize a Teamwork task by id. Throws on network / API errors. */
export async function fetchTeamworkTask(taskId: number, url: string): Promise<TeamworkTask> {
  const auth = Buffer.from(`${config.teamwork.apiToken}:x`).toString('base64');
  const res = await fetch(`https://${config.teamwork.domain}/tasks/${taskId}.json`, {
    headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' },
  });
  if (res.status === 404) {
    throw Object.assign(new Error('Task not found on Teamwork'), { status: 404 });
  }
  if (!res.ok) {
    throw Object.assign(new Error(`Teamwork API error (${res.status})`), { status: 502 });
  }
  const data = (await res.json()) as { 'todo-item'?: Record<string, unknown> };
  const item = data['todo-item'];
  if (!item) {
    throw Object.assign(new Error('Unexpected Teamwork response'), { status: 502 });
  }
  return {
    id: taskId,
    name: String(item['content'] ?? ''),
    projectName: String(item['project-name'] ?? ''),
    tasklistName: String(item['todo-list-name'] ?? ''),
    completed: item['completed'] === true || item['completed'] === 'true',
    estimatedMinutes: Math.max(0, Number(item['estimated-minutes'] ?? 0) || 0),
    url,
  };
}
