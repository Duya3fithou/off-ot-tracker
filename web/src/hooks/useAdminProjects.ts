import { useSnackbar } from 'notistack';
import { useCallback, useEffect, useState } from 'react';
import {
  apiErrorMessage,
  createProject,
  deleteProject,
  fetchAllProjects,
  updateProject,
} from '../api/client';
import type { Project } from '../types';

/**
 * Admin "Projects" tab data + mutations. UI-only state (dialog visibility,
 * text inputs) stays in the component; this hook owns data and API calls.
 */
export function useAdminProjects() {
  const { enqueueSnackbar } = useSnackbar();
  const [projects, setProjects] = useState<Project[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setProjects(await fetchAllProjects());
    } catch (err) {
      enqueueSnackbar(apiErrorMessage(err, 'Failed to load projects'), { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    load();
  }, [load]);

  /** Run a mutation, then reload; surfaces errors as a toast. Returns success. */
  const run = useCallback(
    async (fn: () => Promise<unknown>, okMessage?: string): Promise<boolean> => {
      setBusy(true);
      try {
        await fn();
        await load();
        if (okMessage) enqueueSnackbar(okMessage, { variant: 'success' });
        return true;
      } catch (err) {
        enqueueSnackbar(apiErrorMessage(err), { variant: 'error' });
        return false;
      } finally {
        setBusy(false);
      }
    },
    [load, enqueueSnackbar],
  );

  const create = useCallback((name: string) => run(() => createProject(name)), [run]);
  const rename = useCallback(
    (id: string, name: string) => run(() => updateProject(id, { name }), 'Project renamed.'),
    [run],
  );
  const toggleActive = useCallback(
    (p: Project) => run(() => updateProject(p.id, { active: !p.active })),
    [run],
  );
  const remove = useCallback(
    (p: Project) =>
      run(async () => {
        const { deletedOtRequests } = await deleteProject(p.id);
        enqueueSnackbar(
          `Deleted "${p.name}"` +
            (deletedOtRequests > 0
              ? ` and ${deletedOtRequests} related OT request(s).`
              : '.'),
          { variant: 'success' },
        );
      }),
    [run, enqueueSnackbar],
  );

  return { projects, busy, create, rename, toggleActive, remove };
}
