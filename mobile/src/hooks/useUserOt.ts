import { useEffect, useState } from 'react';
import { apiErrorMessage, fetchAdminOtRequests } from '../api/client';
import type { OtRequest } from '../types';

/** Loads one user's OT requests (optionally scoped to a month) for the detail screen. */
export function useUserOt(userId: string, month?: string) {
  const [requests, setRequests] = useState<OtRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAdminOtRequests({ userId, month })
      .then((r) => !cancelled && setRequests(r))
      .catch((e) => !cancelled && setError(apiErrorMessage(e, 'Failed to load')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [userId, month]);

  const total = Math.round(requests.reduce((s, r) => s + r.durationHours, 0) * 100) / 100;

  return { requests, loading, error, total };
}
