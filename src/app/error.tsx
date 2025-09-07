'use client';

import { useEffect } from 'react';
import { Box, Container, Typography, Button, Paper } from '@mui/material';
import { Error as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 2
          }}
        >
          <ErrorIcon
            sx={{
              fontSize: 64,
              color: 'error.main',
              mb: 2
            }}
          />
          
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{ fontWeight: 600 }}
          >
            Something went wrong!
          </Typography>
          
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            We encountered an unexpected error. Please try again or contact support if the problem persists.
          </Typography>
          
          {process.env.NODE_ENV === 'development' && (
            <Box
              sx={{
                bgcolor: 'grey.100',
                p: 2,
                borderRadius: 1,
                mb: 3,
                textAlign: 'left'
              }}
            >
              <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace' }}>
                {error.message}
              </Typography>
            </Box>
          )}
          
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={reset}
            sx={{ mr: 2 }}
          >
            Try again
          </Button>
          
          <Button
            variant="outlined"
            onClick={() => window.location.href = '/'}
          >
            Go home
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
