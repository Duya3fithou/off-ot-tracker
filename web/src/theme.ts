import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2e7d32' },
    secondary: { main: '#1565c0' },
    background: { default: '#f5f6f8' },
  },
  shape: { borderRadius: 10 },
});
