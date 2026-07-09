import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import { GoogleOAuthProvider } from '@react-oauth/google';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { SnackbarProvider } from 'notistack';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './auth/AuthContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { theme } from './theme';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <SnackbarProvider
            maxSnack={3}
            autoHideDuration={4000}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <LoadingProvider>
              <AuthProvider>
                <BrowserRouter>
                  <App />
                </BrowserRouter>
              </AuthProvider>
            </LoadingProvider>
          </SnackbarProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
