import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { useState } from 'react';
import { useAdminProjects } from '../../hooks/useAdminProjects';
import type { Project } from '../../types';

export function AdminProjectsTab() {
  const { projects, busy, create, rename, toggleActive, remove } = useAdminProjects();
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<Project | null>(null);
  const [editName, setEditName] = useState('');
  const [deleting, setDeleting] = useState<Project | null>(null);

  const add = async () => {
    const name = newName.trim();
    if (!name) return;
    if (await create(name)) setNewName('');
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    setEditName(p.name);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const name = editName.trim();
    if (!name || name === editing.name) {
      setEditing(null);
      return;
    }
    if (await rename(editing.id, name)) setEditing(null);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    if (await remove(deleting)) setDeleting(null);
  };

  return (
    <Stack spacing={2} sx={{ maxWidth: 720 }}>
      <Stack direction="row" spacing={2}>
        <TextField
          label="New project name"
          size="small"
          fullWidth
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <Button variant="contained" onClick={add} disabled={busy || !newName.trim()}>
          Add
        </Button>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Project</TableCell>
              <TableCell align="center">OT requests</TableCell>
              <TableCell align="center">Active (shown in picker)</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 2, color: 'text.secondary' }}>
                  No projects yet.
                </TableCell>
              </TableRow>
            )}
            {projects.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.name}</TableCell>
                <TableCell align="center">
                  <Chip size="small" variant="outlined" label={p.otRequestCount ?? 0} />
                </TableCell>
                <TableCell align="center">
                  <Switch checked={p.active} onChange={() => toggleActive(p)} />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Rename">
                    <IconButton size="small" onClick={() => openEdit(p)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => setDeleting(p)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Rename dialog */}
      <Dialog open={!!editing} onClose={() => setEditing(null)} fullWidth maxWidth="xs">
        <DialogTitle>Rename project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Project name"
            fullWidth
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>Cancel</Button>
          <Button variant="contained" onClick={saveEdit} disabled={busy || !editName.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleting} onClose={() => setDeleting(null)} fullWidth maxWidth="xs">
        <DialogTitle>Delete project?</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            You are about to permanently delete <strong>{deleting?.name}</strong>.
            {deleting && (deleting.otRequestCount ?? 0) > 0 ? (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This will also permanently delete <strong>{deleting.otRequestCount}</strong> OT
                request(s) linked to this project, across all users. This cannot be undone.
              </Alert>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                No OT requests are linked to this project.
              </Alert>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleting(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete} disabled={busy}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
