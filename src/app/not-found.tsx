import { Box, Container, Typography, Button, Paper } from '@mui/material';
import { Home as HomeIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import Link from 'next/link';

export default function NotFound() {
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
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: '6rem',
              fontWeight: 700,
              color: 'primary.main',
              mb: 2
            }}
          >
            404
          </Typography>
          
          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            sx={{ fontWeight: 600, mb: 2 }}
          >
            Page Not Found
          </Typography>
          
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4 }}
          >
            The page you're looking for doesn't exist or has been moved.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<HomeIcon />}
              component={Link}
              href="/"
            >
              Go Home
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
