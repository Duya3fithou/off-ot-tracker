import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid2';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import type { Dayjs } from 'dayjs';
import { useRef } from 'react';
import { useTeamworkAutofill } from '../hooks/useTeamworkAutofill';
import type { Project, TaskStatus } from '../types';
import { computeDurationHours } from '../utils/duration';
import { extractTeamworkTaskUrl } from '../utils/teamwork';

export interface OtBlockDraft {
  key: string;
  workDate: Dayjs | null;
  startTime: Dayjs | null;
  endTime: Dayjs | null;
  projectId: string;
  taskLink: string;
  taskStatus: TaskStatus;
  hoursToComplete: string; // kept as string for the input
  /** Teamwork time estimate (hours) — shown as the Duration hint until times are set. Not submitted. */
  estimatedHours?: number | null;
}

interface Props {
  index: number;
  block: OtBlockDraft;
  projects: Project[];
  canRemove: boolean;
  onChange: (key: string, patch: Partial<OtBlockDraft>) => void;
  onRemove: (key: string) => void;
  /** Overrides the default "OT request #n" heading (e.g. in the edit dialog). */
  label?: string;
}

export function OtBlockCard({
  index,
  block,
  projects,
  canRemove,
  onChange,
  onRemove,
  label,
}: Props) {
  const computed = computeDurationHours(block.startTime, block.endTime);
  // Show the computed duration once times are entered; until then, show the
  // Teamwork estimate (if any) as a hint. Start/end are left empty for the user.
  const isEstimate = computed == null && block.estimatedHours != null;
  const duration = computed ?? block.estimatedHours ?? null;
  const { autofill } = useTeamworkAutofill();
  const lastFetched = useRef<string | null>(null);

  // When the task field holds a Teamwork task link, fetch + auto-fill on blur.
  // We fill task text + project + the duration estimate, but NOT start/end times.
  const handleTaskLinkBlur = async () => {
    const url = extractTeamworkTaskUrl(block.taskLink);
    if (!url || url === lastFetched.current) return;
    lastFetched.current = url;
    const patch = await autofill(url);
    if (patch) onChange(block.key, patch);
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {label ?? `OT request #${index + 1}`}
          </Typography>
          {canRemove && (
            <Tooltip title="Remove this request">
              <IconButton color="error" size="small" onClick={() => onRemove(block.key)}>
                <DeleteOutlineIcon />
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        <Grid container spacing={2}>
          <Grid size={12}>
            <TextField
              label="Task link or title"
              fullWidth
              size="small"
              multiline
              minRows={1}
              placeholder="Paste a Teamwork task link to auto-fill, or type a title"
              helperText="Paste a Teamwork task link → project & task are filled in automatically."
              value={block.taskLink}
              onChange={(e) => onChange(block.key, { taskLink: e.target.value })}
              onBlur={handleTaskLinkBlur}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <DatePicker
              label="Start date"
              format="DD/MM/YYYY"
              value={block.workDate}
              onChange={(v) => onChange(block.key, { workDate: v })}
              slotProps={{ textField: { fullWidth: true, size: 'small' } }}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <TimePicker
              label="Start time"
              value={block.startTime}
              onChange={(v) => onChange(block.key, { startTime: v })}
              slotProps={{ textField: { fullWidth: true, size: 'small' } }}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <TimePicker
              label="End time"
              value={block.endTime}
              onChange={(v) => onChange(block.key, { endTime: v })}
              slotProps={{ textField: { fullWidth: true, size: 'small' } }}
            />
          </Grid>
          <Grid
            size={{ xs: 12, sm: 3, md: 2 }}
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <Chip
              color={isEstimate ? 'info' : duration != null ? 'primary' : 'default'}
              variant="outlined"
              label={
                duration != null
                  ? `Duration: ${duration}h${isEstimate ? ' (est.)' : ''}`
                  : 'Duration: —'
              }
              sx={{ width: '100%' }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              label="Project"
              fullWidth
              size="small"
              value={block.projectId}
              onChange={(e) => onChange(block.key, { projectId: e.target.value })}
            >
              {projects.length === 0 && (
                <MenuItem value="" disabled>
                  No projects configured
                </MenuItem>
              )}
              {projects.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              label="Task's status"
              fullWidth
              size="small"
              value={block.taskStatus}
              onChange={(e) =>
                onChange(block.key, { taskStatus: e.target.value as TaskStatus })
              }
            >
              <MenuItem value="DONE">Done</MenuItem>
              <MenuItem value="IN_PROGRESS">In progress — need X hours to done</MenuItem>
            </TextField>
          </Grid>

          {block.taskStatus === 'IN_PROGRESS' && (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="Hours needed to finish"
                type="number"
                fullWidth
                size="small"
                inputProps={{ min: 1 }}
                value={block.hoursToComplete}
                onChange={(e) => onChange(block.key, { hoursToComplete: e.target.value })}
              />
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
}
