import { useCallback, useEffect, useState } from 'react';
import {
  apiErrorMessage,
  createProject,
  deleteProject,
  fetchAllProjects,
  updateProject,
} from '../api/client';
import type { Project } from '../types';
import { showError, showSuccess } from '../utils/toast';

/**
 * Admin "Projects" tab data + mutations. UI-only state (dialogs, text inputs)
 * stays in the screen; this hook owns data and API calls.
 */
export function useAdminProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProjects(await fetchAllProjects());
    } catch (e) {
      showError(apiErrorMessage(e, 'Failed to load projects'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Run a mutation, then reload; surfaces errors as a toast. Returns success. */
  const run = useCallback(
    async (fn: () => Promise<unknown>): Promise<boolean> => {
      setBusy(true);
      try {
        await fn();
        await load();
        return true;
      } catch (e) {
        showError(apiErrorMessage(e));
        return false;
      } finally {
        setBusy(false);
      }
    },
    [load],
  );

  const create = useCallback((name: string) => run(() => createProject(name)), [run]);
  const rename = useCallback(
    (id: string, name: string) =>
      run(async () => {
        await updateProject(id, { name });
        showSuccess('Project renamed.');
      }),
    [run],
  );
  const toggleActive = useCallback(
    (p: Project) => run(() => updateProject(p.id, { active: !p.active })),
    [run],
  );
  const remove = useCallback(
    (p: Project) =>
      run(async () => {
        const deleted = await deleteProject(p.id);
        showSuccess(
          `Deleted "${p.name}"` +
            (deleted > 0 ? ` and ${deleted} related OT request(s).` : '.'),
        );
      }),
    [run],
  );

  return { projects, loading, busy, load, create, rename, toggleActive, remove };
}
