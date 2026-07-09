import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useCallback, useEffect, useState } from 'react';
import {
  apiErrorMessage,
  fetchMyOtRequests,
  fetchProjects,
  submitOtRequests,
} from '../api/client';
import type { OtBlockDraft } from '../components/OtBlockCard';
import type { OtBlockPayload, OtRequest, Project } from '../types';
import { draftToPayload } from './otValidation';

export function emptyBlock(): OtBlockDraft {
  return {
    key: crypto.randomUUID(),
    workDate: dayjs(),
    startTime: null,
    endTime: null,
    projectId: '',
    taskLink: '',
    taskStatus: 'DONE_LOCAL',
    hoursToComplete: '',
  };
}

/**
 * Owns the OT logging screen state: project picker data, draft blocks,
 * validation, submission, and the user's own OT history.
 */
export function useOtLog() {
  const { enqueueSnackbar } = useSnackbar();
  const [projects, setProjects] = useState<Project[]>([]);
  const [blocks, setBlocks] = useState<OtBlockDraft[]>([emptyBlock()]);
  const [myRequests, setMyRequests] = useState<OtRequest[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadMine = useCallback(async () => {
    setMyRequests(await fetchMyOtRequests());
  }, []);

  useEffect(() => {
    fetchProjects().then(setProjects).catch(() => setProjects([]));
    loadMine().catch(() => {});
  }, [loadMine]);

  const updateBlock = useCallback((key: string, patch: Partial<OtBlockDraft>) => {
    setBlocks((prev) => prev.map((b) => (b.key === key ? { ...b, ...patch } : b)));
  }, []);
  const addBlock = useCallback(() => setBlocks((prev) => [...prev, emptyBlock()]), []);
  const removeBlock = useCallback(
    (key: string) => setBlocks((prev) => prev.filter((b) => b.key !== key)),
    [],
  );

  const validate = useCallback((): OtBlockPayload[] | null => {
    const payload: OtBlockPayload[] = [];
    for (let i = 0; i < blocks.length; i++) {
      const { payload: p, error } = draftToPayload(blocks[i]);
      if (error || !p) {
        enqueueSnackbar(`Request #${i + 1}: ${error}`, { variant: 'error' });
        return null;
      }
      payload.push(p);
    }
    return payload;
  }, [blocks, enqueueSnackbar]);

  const submit = useCallback(async () => {
    const payload = validate();
    if (!payload) return;
    setSubmitting(true);
    try {
      const created = await submitOtRequests(payload);
      enqueueSnackbar(`Submitted ${created} OT request(s).`, { variant: 'success' });
      setBlocks([emptyBlock()]);
      await loadMine();
    } catch (err) {
      enqueueSnackbar(apiErrorMessage(err, 'Failed to submit'), { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  }, [validate, enqueueSnackbar, loadMine]);

  return {
    projects,
    blocks,
    myRequests,
    submitting,
    updateBlock,
    addBlock,
    removeBlock,
    submit,
    reloadHistory: loadMine,
  };
}
