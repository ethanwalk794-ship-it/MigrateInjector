'use client';

import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
// Update the import path to match the actual location of use-auth
// Update the import path to match the actual location of AuthProvider
// Example: import { AuthProvider } from '../lib/providers/auth-provider';
// Please update the path below to the correct one in your project:
import { AuthProvider } from '@/lib/hooks/use-auth';
import { createTheme } from '@mui/material/styles';

const theme = createTheme();

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
        <Toaster
          position='top-right'
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#4ade80',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </ThemeProvider>
    </AuthProvider>
  );
}
