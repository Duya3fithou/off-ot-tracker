import { useCallback, useEffect, useState } from 'react';
import {
  apiErrorMessage,
  fetchAdminOtRequests,
  isConflictError,
  reviewOtRequest,
} from '../api/client';
import { currentMonth } from '../components/MonthSelector';
import type { OtRequest } from '../types';
import { showError, showInfo } from '../utils/toast';

/** Admin "Requests" tab: month/status filters, list, approve/reject. */
export function useAdminRequests() {
  const [month, setMonth] = useState(currentMonth());
  const [status, setStatus] = useState('');
  const [requests, setRequests] = useState<OtRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRequests(await fetchAdminOtRequests({ month, status: status || undefined }));
    } catch (e) {
      showError(apiErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [month, status]);

  useEffect(() => {
    load();
  }, [load]);

  const review = useCallback(
    async (request: OtRequest, next: 'APPROVED' | 'REJECTED') => {
      setBusyId(request.id);
      try {
        await reviewOtRequest(request.id, next, request.version);
        await load();
      } catch (e) {
        if (isConflictError(e)) {
          // Changed since loaded — warn and reload so no stale approval sticks.
          showInfo(apiErrorMessage(e, 'This request changed — reloaded the latest.'), 'Reloaded');
          await load();
        } else {
          showError(apiErrorMessage(e, 'Failed to update'));
        }
      } finally {
        setBusyId(null);
      }
    },
    [load],
  );

  return { month, setMonth, status, setStatus, requests, loading, busyId, load, review };
}
