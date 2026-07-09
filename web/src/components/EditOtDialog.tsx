import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { apiErrorMessage, isConflictError, updateOtRequest } from '../api/client';
import { draftToPayload, requestToDraft } from '../hooks/otValidation';
import type { OtRequest, Project } from '../types';
import { OtBlockCard, type OtBlockDraft } from './OtBlockCard';

interface Props {
  request: OtRequest | null;
  projects: Project[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

/** Edit a PENDING OT request the user owns. */
export function EditOtDialog({ request, projects, open, onClose, onSaved }: Props) {
  const { enqueueSnackbar } = useSnackbar();
  const [draft, setDraft] = useState<OtBlockDraft | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(request ? requestToDraft(request) : null);
  }, [request]);

  const updateDraft = (_key: string, patch: Partial<OtBlockDraft>) =>
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));

  const save = async () => {
    if (!request || !draft) return;
    const { payload, error } = draftToPayload(draft);
    if (error || !payload) {
      enqueueSnackbar(error ?? 'Invalid input', { variant: 'error' });
      return;
    }
    setSaving(true);
    try {
      await updateOtRequest(request.id, payload);
      enqueueSnackbar('Request updated.', { variant: 'success' });
      onSaved();
      onClose();
    } catch (err) {
      // 409 = no longer pending / changed; reload so the list reflects reality.
      enqueueSnackbar(apiErrorMessage(err, 'Failed to update request'), {
        variant: isConflictError(err) ? 'warning' : 'error',
      });
      if (isConflictError(err)) {
        onSaved();
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Edit OT request</DialogTitle>
      <DialogContent>
        {draft && (
          <OtBlockCard
            index={0}
            label="Edit request"
            block={draft}
            projects={projects}
            canRemove={false}
            onChange={updateDraft}
            onRemove={() => {}}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
