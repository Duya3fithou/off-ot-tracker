import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { fetchAdminOtRequests } from '../../api/client';
import type { OtRequest } from '../../types';
import { ApprovalChip } from '../ApprovalChip';
import { TaskCell } from '../TaskCell';

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string | null;
  userName?: string;
  userEmail?: string;
  month?: string; // YYYY-MM; if omitted, shows all time
}

/** Read-only dialog listing one user's OT requests (optionally scoped to a month). */
export function UserOtDialog({ open, onClose, userId, userName, userEmail, month }: Props) {
  const [requests, setRequests] = useState<OtRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;
    setLoading(true);
    fetchAdminOtRequests({ userId, month })
      .then((r) => !cancelled && setRequests(r))
      .catch(() => !cancelled && setRequests([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, userId, month]);

  const totalHours =
    Math.round(requests.reduce((sum, r) => sum + r.durationHours, 0) * 100) / 100;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ pr: 6 }}>
        <Stack direction="row" spacing={1} alignItems="baseline">
          <span>OT of {userName ?? 'user'}</span>
          {userEmail && (
            <Typography variant="body2" color="text.secondary">
              ({userEmail})
            </Typography>
          )}
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {month ? `Month ${month}` : 'All time'} · {requests.length} request(s) · {totalHours}h
          total
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : requests.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            No OT requests for this filter.
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Start</TableCell>
                <TableCell>End</TableCell>
                <TableCell align="right">Hours</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Task</TableCell>
                <TableCell>Task status</TableCell>
                <TableCell>Approval</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{dayjs(r.workDate).format('DD/MM/YYYY')}</TableCell>
                  <TableCell>{r.startTime}</TableCell>
                  <TableCell>{r.endTime}</TableCell>
                  <TableCell align="right">{r.durationHours}</TableCell>
                  <TableCell>{r.project?.name}</TableCell>
                  <TableCell sx={{ maxWidth: 280, whiteSpace: 'pre-wrap' }}>
                    <TaskCell text={r.taskLink} />
                  </TableCell>
                  <TableCell>
                    {r.taskStatus === 'DONE'
                      ? 'Done'
                      : `In progress — ${r.hoursToComplete ?? '?'}h left`}
                  </TableCell>
                  <TableCell>
                    <ApprovalChip status={r.approvalStatus} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
