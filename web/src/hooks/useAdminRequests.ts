import { useSnackbar } from 'notistack';
import { useCallback, useEffect, useState } from 'react';
import {
  apiErrorMessage,
  fetchAdminOtRequests,
  isConflictError,
  reviewOtRequest,
} from '../api/client';
import { currentMonth } from '../components/admin/MonthPicker';
import type { OtRequest } from '../types';

/** Admin "OT requests" tab: month/status filters, list, and approve/reject. */
export function useAdminRequests() {
  const { enqueueSnackbar } = useSnackbar();
  const [month, setMonth] = useState(currentMonth());
  const [status, setStatus] = useState('');
  const [requests, setRequests] = useState<OtRequest[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRequests(await fetchAdminOtRequests({ month, status: status || undefined }));
    } catch (err) {
      enqueueSnackbar(apiErrorMessage(err, 'Failed to load requests'), { variant: 'error' });
    }
  }, [month, status, enqueueSnackbar]);

  useEffect(() => {
    load();
  }, [load]);

  const review = useCallback(
    async (request: OtRequest, next: 'APPROVED' | 'REJECTED') => {
      setBusyId(request.id);
      try {
        await reviewOtRequest(request.id, next, request.version);
        await load();
      } catch (err) {
        if (isConflictError(err)) {
          // The request changed since it was loaded — warn and reload so the
          // admin never approves a stale version.
          enqueueSnackbar(apiErrorMessage(err, 'This request changed — reloaded the latest.'), {
            variant: 'warning',
          });
          await load();
        } else {
          enqueueSnackbar(apiErrorMessage(err, 'Failed to update request'), { variant: 'error' });
        }
      } finally {
        setBusyId(null);
      }
    },
    [load, enqueueSnackbar],
  );

  return { month, setMonth, status, setStatus, requests, busyId, review };
}
