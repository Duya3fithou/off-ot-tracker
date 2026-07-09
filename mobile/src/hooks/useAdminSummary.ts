import { useCallback, useEffect, useState } from 'react';
import {
  apiErrorMessage,
  fetchAdminSummary,
  fetchAdminUsers,
  fetchAllProjects,
} from '../api/client';
import { currentMonth } from '../components/MonthSelector';
import type { Project, UserRef, UserSummary } from '../types';
import { showError } from '../utils/toast';

/** Admin "Summary" tab: month/project/user filters + per-user totals. */
export function useAdminSummary() {
  const [month, setMonth] = useState(currentMonth());
  const [projectId, setProjectId] = useState('');
  const [userId, setUserId] = useState('');
  const [rows, setRows] = useState<UserSummary[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserRef[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAllProjects().then(setProjects).catch(() => {});
    fetchAdminUsers().then(setUsers).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(
        await fetchAdminSummary({
          month,
          projectId: projectId || undefined,
          userId: userId || undefined,
        }),
      );
    } catch (e) {
      showError(apiErrorMessage(e, 'Failed to load summary'));
    } finally {
      setLoading(false);
    }
  }, [month, projectId, userId]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    month,
    setMonth,
    projectId,
    setProjectId,
    userId,
    setUserId,
    rows,
    projects,
    users,
    loading,
    load,
  };
}
