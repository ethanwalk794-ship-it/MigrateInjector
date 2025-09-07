'use client';

import { Box, CircularProgress, Typography } from '@mui/material';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: number;
  message?: string;
  fullScreen?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

export function LoadingSpinner({ 
  size = 40, 
  message = 'Loading...', 
  fullScreen = false,
  color = 'primary'
}: LoadingSpinnerProps) {
  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        ...(fullScreen && {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'background.default',
          zIndex: 9999,
        }),
      }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <CircularProgress
          size={size}
          color={color}
          thickness={4}
        />
      </motion.div>
      
      {message && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              textAlign: 'center',
              fontWeight: 500,
            }}
          >
            {message}
          </Typography>
        </motion.div>
      )}
    </Box>
  );

  return content;
}

// Preset loading components
export function PageLoadingSpinner() {
  return (
    <LoadingSpinner
      size={60}
      message="Loading page..."
      fullScreen
    />
  );
}

export function ButtonLoadingSpinner({ size = 20 }: { size?: number }) {
  return (
    <CircularProgress
      size={size}
      color="inherit"
      thickness={4}
    />
  );
}

export function InlineLoadingSpinner({ message }: { message?: string }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        py: 1,
      }}
    >
      <CircularProgress size={16} thickness={4} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );
}

// Loading overlay for forms
export function FormLoadingOverlay({ loading, children }: { 
  loading: boolean; 
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ position: 'relative' }}>
      {children}
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          <LoadingSpinner size={40} message="Processing..." />
        </Box>
      )}
    </Box>
  );
}
