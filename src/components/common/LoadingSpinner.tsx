import { Box, CircularProgress, Typography } from '@mui/material';
import { memo } from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
  fullScreen?: boolean;
}

const LoadingSpinner = memo(({ 
  message = 'Loading...', 
  size = 48, 
  fullScreen = false 
}: LoadingSpinnerProps) => {
  const containerStyles = fullScreen 
    ? {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        zIndex: 9999,
      }
    : {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 3,
        gap: 2,
      };

  return (
    <Box sx={containerStyles}>
      <CircularProgress size={size} />
      {message && (
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ mt: fullScreen ? 2 : 0 }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
