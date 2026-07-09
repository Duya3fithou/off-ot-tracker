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
import dayjs from 'dayjs';
import { useState } from 'react';
import { useAdminRequests } from '../../hooks/useAdminRequests';
import { taskStatusLabel } from '../../utils/taskStatus';
import { ApprovalChip } from '../ApprovalChip';
import { TaskCell } from '../TaskCell';
import { MonthPicker } from './MonthPicker';
import { UserOtDialog } from './UserOtDialog';

export function AdminRequestsTab() {
  const { month, setMonth, status, setStatus, requests, busyId, review } = useAdminRequests();
  const [viewUser, setViewUser] = useState<{ id: string; name: string; email: string } | null>(
    null,
  );

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} alignItems="center">
        <MonthPicker value={month} onChange={setMonth} />
        <TextField
          select
          label="Status"
          size="small"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="PENDING">Pending</MenuItem>
          <MenuItem value="APPROVED">Approved</MenuItem>
          <MenuItem value="REJECTED">Rejected</MenuItem>
        </TextField>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Time</TableCell>
              <TableCell align="right">Hours</TableCell>
              <TableCell>Project</TableCell>
              <TableCell>Task</TableCell>
              <TableCell>Task status</TableCell>
              <TableCell>Approval</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.length === 0 && (
              <TableRow>
                <TableCell colSpan={9}>
                  <Box sx={{ py: 2, textAlign: 'center', color: 'text.secondary' }}>
                    No requests for this filter.
                  </Box>
                </TableCell>
              </TableRow>
            )}
            {requests.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <Box
                    onClick={() =>
                      r.user &&
                      setViewUser({ id: r.user.id, name: r.user.name, email: r.user.email })
                    }
                    sx={{
                      cursor: 'pointer',
                      '&:hover .user-name': { textDecoration: 'underline' },
                    }}
                  >
                    <Box className="user-name" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {r.user?.name}
                    </Box>
                    <Box sx={{ fontSize: 12, color: 'text.secondary' }}>{r.user?.email}</Box>
                  </Box>
                </TableCell>
                <TableCell>{dayjs(r.workDate).format('DD/MM/YYYY')}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  {r.startTime}–{r.endTime}
                </TableCell>
                <TableCell align="right">{r.durationHours}</TableCell>
                <TableCell>{r.project?.name}</TableCell>
                <TableCell sx={{ maxWidth: 280, whiteSpace: 'pre-wrap' }}>
                  <TaskCell text={r.taskLink} />
                </TableCell>
                <TableCell>{taskStatusLabel(r.taskStatus, r.hoursToComplete)}</TableCell>
                <TableCell>
                  <ApprovalChip status={r.approvalStatus} />
                </TableCell>
                <TableCell align="right">
                  <Stack spacing={0.75} alignItems="stretch" sx={{ minWidth: 96 }}>
                    <Button
                      size="small"
                      color="success"
                      variant="outlined"
                      disabled={busyId === r.id || r.approvalStatus === 'APPROVED'}
                      onClick={() => review(r, 'APPROVED')}
                    >
                      Approve
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      disabled={busyId === r.id || r.approvalStatus === 'REJECTED'}
                      onClick={() => review(r, 'REJECTED')}
                    >
                      Reject
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <UserOtDialog
        open={!!viewUser}
        onClose={() => setViewUser(null)}
        userId={viewUser?.id ?? null}
        userName={viewUser?.name}
        userEmail={viewUser?.email}
        month={month}
      />
    </Stack>
  );
}
