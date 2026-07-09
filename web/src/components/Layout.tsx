import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function Layout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const navButtonSx = (active: boolean) => ({
    color: 'inherit',
    fontWeight: 600,
    px: 2,
    borderRadius: 2,
    textTransform: 'none' as const,
    bgcolor: active ? 'rgba(255,255,255,0.18)' : 'transparent',
    '&:hover': {
      bgcolor: active ? 'rgba(255,255,255,0.24)' : 'rgba(255,255,255,0.1)',
    },
  });

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: 'linear-gradient(90deg, #1B5E20 0%, #2E7D32 55%, #1565C0 140%)',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              mr: 1.5,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.16)',
            }}
          >
            <AccessTimeIcon />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.3, mr: 3 }}>
            OT Tracker
          </Typography>
          <Button component={RouterLink} to="/" sx={navButtonSx(location.pathname === '/')}>
            My OT
          </Button>
          {user?.isAdmin && (
            <Button
              component={RouterLink}
              to="/admin"
              sx={{ ...navButtonSx(location.pathname === '/admin'), ml: 1 }}
            >
              Admin
            </Button>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Stack
            direction="row"
            spacing={1.25}
            alignItems="center"
            sx={{
              px: 1,
              py: 0.5,
              borderRadius: 999,
              bgcolor: 'rgba(255,255,255,0.12)',
            }}
          >
            {user?.picture && (
              <Avatar
                src={user.picture}
                alt={user.name}
                sx={{ width: 30, height: 30, border: '2px solid rgba(255,255,255,0.6)' }}
              />
            )}
            <Typography variant="body2" sx={{ fontWeight: 600, display: { xs: 'none', sm: 'block' } }}>
              {user?.name}
            </Typography>
            <Button
              color="inherit"
              size="small"
              onClick={signOut}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 999 }}
            >
              Sign out
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  );
}
