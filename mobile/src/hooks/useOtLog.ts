import { useCallback, useEffect, useState } from 'react';
import {
  apiErrorMessage,
  fetchMyOtRequests,
  fetchProjects,
  submitOtRequests,
} from '../api/client';
import type { OtBlockDraft, OtBlockPayload, OtRequest, Project } from '../types';
import { showError, showSuccess } from '../utils/toast';
import { draftToPayload } from './otValidation';

export function emptyBlock(): OtBlockDraft {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    workDate: new Date(),
    startTime: null,
    endTime: null,
    projectId: null,
    taskLink: '',
    taskStatus: 'DONE',
    hoursToComplete: '',
  };
}

/**
 * Owns the OT logging screen state: projects, draft blocks, validation,
 * submission, and the user's own OT history. UI-only concerns (active tab,
 * header buttons) stay in the screen.
 */
export function useOtLog() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [blocks, setBlocks] = useState<OtBlockDraft[]>([emptyBlock()]);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<OtRequest[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      setHistory(await fetchMyOtRequests());
    } catch (e) {
      showError(apiErrorMessage(e, 'Failed to load history'));
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects().then(setProjects).catch(() => setProjects([]));
    loadHistory();
  }, [loadHistory]);

  const updateBlock = useCallback(
    (key: string, patch: Partial<OtBlockDraft>) =>
      setBlocks((prev) => prev.map((b) => (b.key === key ? { ...b, ...patch } : b))),
    [],
  );
  const addBlock = useCallback(() => setBlocks((prev) => [...prev, emptyBlock()]), []);
  const removeBlock = useCallback(
    (key: string) => setBlocks((prev) => prev.filter((b) => b.key !== key)),
    [],
  );

  const validate = useCallback((): OtBlockPayload[] | null => {
    const out: OtBlockPayload[] = [];
    for (let i = 0; i < blocks.length; i++) {
      const { payload, error } = draftToPayload(blocks[i]);
      if (error || !payload) {
        showError(`Request #${i + 1}: ${error}`);
        return null;
      }
      out.push(payload);
    }
    return out;
  }, [blocks]);

  /** Validates and submits. Returns true on success (screen can switch tabs). */
  const submit = useCallback(async (): Promise<boolean> => {
    const payload = validate();
    if (!payload) return false;
    setSubmitting(true);
    try {
      const created = await submitOtRequests(payload);
      setBlocks([emptyBlock()]);
      showSuccess(`Submitted ${created} OT request(s).`);
      await loadHistory();
      return true;
    } catch (e) {
      showError(apiErrorMessage(e, 'Failed to submit'));
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [validate, loadHistory]);

  return {
    projects,
    blocks,
    submitting,
    history,
    historyLoading,
    loadHistory,
    updateBlock,
    addBlock,
    removeBlock,
    submit,
  };
}
