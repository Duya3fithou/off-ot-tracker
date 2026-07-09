import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { useAdminSettings } from '../../hooks/useAdminSettings';

export function AdminSettingsTab() {
  const { settings, loading, saving, update } = useAdminSettings();

  if (loading) {
    return <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />;
  }
  if (!settings) return null;

  return (
    <Stack spacing={2} sx={{ maxWidth: 640 }}>
      <Typography variant="h6" fontWeight={700}>
        Notifications
      </Typography>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.emailOnOtSubmit}
              disabled={saving}
              onChange={(e) => update({ emailOnOtSubmit: e.target.checked })}
            />
          }
          label={
            <span>
              <Typography component="span" fontWeight={600}>
                Email admins on new OT submissions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                When on, every admin gets an email each time an employee submits an OT request.
              </Typography>
            </span>
          }
        />
      </Paper>
    </Stack>
  );
}
