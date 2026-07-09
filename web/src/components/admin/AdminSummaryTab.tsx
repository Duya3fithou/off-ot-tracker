import FileDownloadIcon from '@mui/icons-material/FileDownload';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import { useState } from 'react';
import { useAdminSummary } from '../../hooks/useAdminSummary';
import type { UserSummary } from '../../types';
import { MonthPicker } from './MonthPicker';
import { UserOtDialog } from './UserOtDialog';

export function AdminSummaryTab() {
  const {
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
  } = useAdminSummary();
  const [viewUser, setViewUser] = useState<UserSummary | null>(null);

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        <MonthPicker value={month} onChange={setMonth} />
        <TextField
          select
          label="Project"
          size="small"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">All projects</MenuItem>
          {projects.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              {p.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="User"
          size="small"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">All users</MenuItem>
          {users.map((u) => (
            <MenuItem key={u.id} value={u.id}>
              {u.name} ({u.email})
            </MenuItem>
          ))}
        </TextField>
        <Box sx={{ flexGrow: 1 }} />
        <Stack direction="row" spacing={1} sx={{ alignSelf: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={exportCsv}
            disabled={rows.length === 0}
          >
            Summary CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<FileDownloadIcon />}
            onClick={exportExcel}
            disabled={rows.length === 0 || exportingExcel}
          >
            {exportingExcel ? 'Exporting…' : 'Export Excel'}
          </Button>
        </Stack>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell align="right">Requests</TableCell>
              <TableCell align="right">Approved (h)</TableCell>
              <TableCell align="right">Pending (h)</TableCell>
              <TableCell align="right">Rejected (h)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 2, color: 'text.secondary' }}>
                  No OT logged for this filter.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow
                key={r.userId}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => setViewUser(r)}
              >
                <TableCell>
                  <div style={{ fontWeight: 600 }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{r.email}</div>
                </TableCell>
                <TableCell align="right">{r.totalRequests}</TableCell>
                <TableCell align="right">{r.approvedHours}</TableCell>
                <TableCell align="right">{r.pendingHours}</TableCell>
                <TableCell align="right">{r.rejectedHours}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <UserOtDialog
        open={!!viewUser}
        onClose={() => setViewUser(null)}
        userId={viewUser?.userId ?? null}
        userName={viewUser?.name}
        userEmail={viewUser?.email}
        month={month}
      />
    </Stack>
  );
}
