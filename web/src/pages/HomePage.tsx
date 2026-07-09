import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';
import { useState } from 'react';
import { ApprovalChip } from '../components/ApprovalChip';
import { EditOtDialog } from '../components/EditOtDialog';
import { OtBlockCard } from '../components/OtBlockCard';
import { TaskCell } from '../components/TaskCell';
import { useOtLog } from '../hooks/useOtLog';
import type { OtRequest } from '../types';
import { taskStatusLabel } from '../utils/taskStatus';

export function HomePage() {
  const {
    projects,
    blocks,
    myRequests,
    submitting,
    updateBlock,
    addBlock,
    removeBlock,
    submit,
    reloadHistory,
  } = useOtLog();
  const [editing, setEditing] = useState<OtRequest | null>(null);

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Log overtime
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Add one or more requests, then submit them all at once. Each request is reviewed by an
          admin.
        </Typography>
      </Box>

      <Stack spacing={2}>
        {blocks.map((b, i) => (
          <OtBlockCard
            key={b.key}
            index={i}
            block={b}
            projects={projects}
            canRemove={blocks.length > 1}
            onChange={updateBlock}
            onRemove={removeBlock}
          />
        ))}
      </Stack>

      <Stack direction="row" spacing={2}>
        <Button startIcon={<AddIcon />} variant="outlined" onClick={addBlock}>
          Add another request
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          startIcon={<SendIcon />}
          variant="contained"
          onClick={submit}
          disabled={submitting}
        >
          {submitting ? 'Submitting…' : `Submit ${blocks.length} request(s)`}
        </Button>
      </Stack>

      <Divider />

      <Box>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          My OT history
        </Typography>
        <MyRequestsTable requests={myRequests} onEdit={setEditing} />
      </Box>

      <EditOtDialog
        request={editing}
        projects={projects}
        open={!!editing}
        onClose={() => setEditing(null)}
        onSaved={reloadHistory}
      />
    </Stack>
  );
}

function MyRequestsTable({
  requests,
  onEdit,
}: {
  requests: OtRequest[];
  onEdit: (r: OtRequest) => void;
}) {
  if (requests.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No OT requests yet.
      </Typography>
    );
  }
  return (
    <TableContainer component={Paper} variant="outlined">
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
            <TableCell align="right">Actions</TableCell>
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
              <TableCell sx={{ maxWidth: 320, whiteSpace: 'pre-wrap' }}>
                <TaskCell text={r.taskLink} />
              </TableCell>
              <TableCell>{taskStatusLabel(r.taskStatus, r.hoursToComplete)}</TableCell>
              <TableCell>
                <ApprovalChip status={r.approvalStatus} />
              </TableCell>
              <TableCell align="right">
                {r.approvalStatus === 'PENDING' && (
                  <Button size="small" variant="outlined" onClick={() => onEdit(r)}>
                    Edit
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

