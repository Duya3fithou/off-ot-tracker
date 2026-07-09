import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { GoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const { signInWithGoogleToken, error } = useAuth();
  const [localError, setLocalError] = useState<string | null>(null);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Paper elevation={3} sx={{ p: 5, maxWidth: 420, width: '100%' }}>
        <Stack spacing={3} alignItems="center">
          <AccessTimeIcon color="primary" sx={{ fontSize: 48 }} />
          <Box textAlign="center">
            <Typography variant="h5" fontWeight={700}>
              OT Tracker
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Sign in with your company Google account
              <br />
              (offspringdigital / artisan-labs)
            </Typography>
          </Box>

          {(error || localError) && (
            <Alert severity="error" sx={{ width: '100%' }}>
              {localError || error}
            </Alert>
          )}

          <GoogleLogin
            onSuccess={async (cred) => {
              setLocalError(null);
              if (!cred.credential) {
                setLocalError('No credential returned from Google');
                return;
              }
              try {
                await signInWithGoogleToken(cred.credential);
              } catch {
                /* error surfaced via context */
              }
            }}
            onError={() => setLocalError('Google sign in failed')}
          />
        </Stack>
      </Paper>
    </Box>
  );
}
