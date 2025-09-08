'use client';

import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Button,
  TextField,
  Grid,
  Divider,
  Alert,
} from '@mui/material';
import { useAuth } from '@/lib/hooks/use-auth';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Navigation from '@/components/layout/Navigation';

export default function Settings() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute>
      <Navigation />
      <Box sx={{ bgcolor: 'background.default', py: 4 }}>
        <Container maxWidth="md">
          <Typography variant="h4" gutterBottom fontWeight="600">
            Account Settings
          </Typography>

          <Grid container spacing={3}>
            {/* Profile Information */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Profile Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="First Name"
                        value={user?.firstName || ''}
                        disabled
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Last Name"
                        value={user?.lastName || ''}
                        disabled
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Email"
                        value={user?.email || ''}
                        disabled
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Company"
                        value={user?.company || ''}
                        disabled
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Job Title"
                        value={user?.jobTitle || ''}
                        disabled
                        fullWidth
                      />
                    </Grid>
                  </Grid>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Profile editing is currently disabled. Contact support to update your information.
                  </Alert>
                </CardContent>
              </Card>
            </Grid>

            {/* Account Actions */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Account Actions
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button 
                      variant="outlined" 
                      color="error" 
                      onClick={logout}
                    >
                      Logout
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Usage Statistics */}
            {user?.usage && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Usage Statistics
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Box textAlign="center" p={2}>
                          <Typography variant="h4" color="primary.main" fontWeight="bold">
                            {user.usage.resumesProcessed}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Resumes Processed
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box textAlign="center" p={2}>
                          <Typography variant="h4" color="secondary.main" fontWeight="bold">
                            {user.usage.emailsSent}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Emails Sent
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box textAlign="center" p={2}>
                          <Typography variant="h4" color="success.main" fontWeight="bold">
                            {Math.round((user.usage.storageUsed || 0) / (1024 * 1024))} MB
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Storage Used
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Container>
      </Box>
    </ProtectedRoute>
  );
}
