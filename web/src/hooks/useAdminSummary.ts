import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useCallback, useEffect, useState } from 'react';
import {
  apiErrorMessage,
  exportMonthlyOtXlsx,
  fetchAdminSummary,
  fetchAdminUsers,
  fetchAllProjects,
} from '../api/client';
import { currentMonth } from '../components/admin/MonthPicker';
import type { AdminUser, Project, UserSummary } from '../types';
import { downloadCsv, toCsv } from '../utils/csv';
import { downloadBlob } from '../utils/download';

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Admin "Monthly summary" tab: month/project/user filters + per-user totals. */
export function useAdminSummary() {
  const { enqueueSnackbar } = useSnackbar();
  const [month, setMonth] = useState(currentMonth());
  const [projectId, setProjectId] = useState('');
  const [userId, setUserId] = useState('');
  const [rows, setRows] = useState<UserSummary[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [exportingExcel, setExportingExcel] = useState(false);

  useEffect(() => {
    fetchAllProjects().then(setProjects).catch(() => {});
    fetchAdminUsers().then(setUsers).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    try {
      setRows(
        await fetchAdminSummary({
          month,
          projectId: projectId || undefined,
          userId: userId || undefined,
        }),
      );
    } catch (err) {
      enqueueSnackbar(apiErrorMessage(err, 'Failed to load summary'), { variant: 'error' });
    }
  }, [month, projectId, userId, enqueueSnackbar]);

  useEffect(() => {
    load();
  }, [load]);

  /** Export the currently displayed summary (respects all filters) as a CSV. */
  const exportCsv = useCallback(() => {
    if (rows.length === 0) {
      enqueueSnackbar('Nothing to export for this filter.', { variant: 'info' });
      return;
    }
    const headers = [
      'Name',
      'Email',
      'Requests',
      'Approved (h)',
      'Pending (h)',
      'Rejected (h)',
      'Total (h)',
    ];
    const data = rows.map((r) => [
      r.name,
      r.email,
      r.totalRequests,
      r.approvedHours,
      r.pendingHours,
      r.rejectedHours,
      round2(r.approvedHours + r.pendingHours + r.rejectedHours),
    ]);
    const project = projectId ? projects.find((p) => p.id === projectId)?.name : undefined;
    const suffix = project ? `-${project.replace(/[^\w-]+/g, '_')}` : '';
    downloadCsv(`ot-summary-${month}${suffix}.csv`, toCsv(headers, data));
    enqueueSnackbar(`Exported ${rows.length} row(s).`, { variant: 'success' });
  }, [rows, month, projectId, projects, enqueueSnackbar]);

  /**
   * Export the month's OT **entries** (one row per request) as a formatted .xlsx
   * matching the "Resource management" layout. Built server-side; respects the
   * project/user filters.
   */
  const exportExcel = useCallback(async () => {
    setExportingExcel(true);
    try {
      const blob = await exportMonthlyOtXlsx({
        month,
        projectId: projectId || undefined,
        userId: userId || undefined,
      });
      downloadBlob(`OT ${dayjs(`${month}-01`).format('MMM YYYY')}.xlsx`, blob);
      enqueueSnackbar('Excel exported.', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(apiErrorMessage(err, 'Failed to export Excel'), { variant: 'error' });
    } finally {
      setExportingExcel(false);
    }
  }, [month, projectId, userId, enqueueSnackbar]);

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
    exportCsv,
    exportExcel,
    exportingExcel,
  };
}
