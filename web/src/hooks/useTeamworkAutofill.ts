import { useSnackbar } from 'notistack';
import { useCallback } from 'react';
import { apiErrorMessage, fetchTeamworkTask } from '../api/client';
import type { OtBlockDraft } from '../components/OtBlockCard';
import { useLoading } from '../contexts/LoadingContext';

/**
 * Auto-fill an OT draft from a pasted Teamwork task link. Runs under the global
 * loading overlay and surfaces problems as toasts. Returns the patch to apply
 * (task text + matched project), or null if nothing should change.
 */
export function useTeamworkAutofill() {
  const { withLoading } = useLoading();
  const { enqueueSnackbar } = useSnackbar();

  const autofill = useCallback(
    async (url: string): Promise<Partial<OtBlockDraft> | null> => {
      try {
        const { task, matchedProjectId } = await withLoading(fetchTeamworkTask(url));
        const patch: Partial<OtBlockDraft> = {
          taskLink: task.name ? `${task.name}: ${url}` : url,
        };
        if (task.estimatedMinutes > 0) {
          patch.estimatedHours = Math.round((task.estimatedMinutes / 60) * 100) / 100;
        }
        if (matchedProjectId) {
          patch.projectId = matchedProjectId;
        } else if (task.projectName) {
          enqueueSnackbar(
            `Loaded "${task.name}". Project "${task.projectName}" isn't in the list — pick it manually.`,
            { variant: 'info' },
          );
        }
        return patch;
      } catch (err) {
        // 503 = integration off; don't nag, just skip auto-fill silently.
        if ((err as { response?: { status?: number } })?.response?.status === 503) return null;
        enqueueSnackbar(apiErrorMessage(err, 'Could not load the Teamwork task'), {
          variant: 'error',
        });
        return null;
      }
    },
    [withLoading, enqueueSnackbar],
  );

  return { autofill };
}
