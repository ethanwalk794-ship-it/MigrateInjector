'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Alert,
  Stack,
  Chip,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Avatar,
  ListItemAvatar,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Palette as PaletteIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/hooks/use-auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'react-hot-toast';

interface UserSettings {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    company: string;
    jobTitle: string;
    phone: string;
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    dateFormat: string;
    notifications: {
      email: boolean;
      push: boolean;
      processing: boolean;
      errors: boolean;
    };
  };
  processing: {
    defaultFormat: 'docx' | 'pdf' | 'html';
    autoProcess: boolean;
    maxFileSize: number;
    concurrentJobs: number;
    retryAttempts: number;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
    signature: string;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
    passwordExpiry: number;
    loginNotifications: boolean;
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [settings, setSettings] = useState<UserSettings>({
    profile: {
      firstName: '',
      lastName: '',
      email: '',
      company: '',
      jobTitle: '',
      phone: '',
    },
    preferences: {
      theme: 'auto',
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      notifications: {
        email: true,
        push: true,
        processing: true,
        errors: true,
      },
    },
    processing: {
      defaultFormat: 'docx',
      autoProcess: false,
      maxFileSize: 10,
      concurrentJobs: 3,
      retryAttempts: 3,
    },
    email: {
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: '',
      fromName: '',
      signature: '',
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: 30,
      passwordExpiry: 90,
      loginNotifications: true,
    },
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // In a real app, this would fetch from an API
      if (user) {
        setSettings(prev => ({
          ...prev,
          profile: {
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            company: user.company || '',
            jobTitle: user.jobTitle || '',
            phone: user.phone || '',
          },
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Update profile
      if (
        settings.profile.firstName !== user?.firstName ||
        settings.profile.lastName !== user?.lastName
      ) {
        await updateProfile({
          firstName: settings.profile.firstName,
          lastName: settings.profile.lastName,
          company: settings.profile.company,
          jobTitle: settings.profile.jobTitle,
          phone: settings.profile.phone,
        });
      }

      // Save other settings (in a real app, this would be separate API calls)
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return <LoadingSpinner message='Loading settings...' />;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth='lg'>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant='h4'
            component='h1'
            gutterBottom
            sx={{ fontWeight: 700 }}
          >
            Settings
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Manage your account preferences and application settings
          </Typography>
        </Box>

        <Paper sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label='settings tabs'
            >
              <Tab icon={<PersonIcon />} label='Profile' />
              <Tab icon={<PaletteIcon />} label='Preferences' />
              <Tab icon={<SpeedIcon />} label='Processing' />
              <Tab icon={<EmailIcon />} label='Email' />
              <Tab icon={<SecurityIcon />} label='Security' />
            </Tabs>
          </Box>

          {/* Profile Tab */}
          <TabPanel value={tabValue} index={0}>
            <Typography variant='h6' gutterBottom sx={{ fontWeight: 600 }}>
              Profile Information
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='First Name'
                  value={settings.profile.firstName}
                  onChange={e =>
                    setSettings(prev => ({
                      ...prev,
                      profile: { ...prev.profile, firstName: e.target.value },
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Last Name'
                  value={settings.profile.lastName}
                  onChange={e =>
                    setSettings(prev => ({
                      ...prev,
                      profile: { ...prev.profile, lastName: e.target.value },
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Email'
                  type='email'
                  value={settings.profile.email}
                  disabled
                  helperText='Email cannot be changed'
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Phone'
                  value={settings.profile.phone}
                  onChange={e =>
                    setSettings(prev => ({
                      ...prev,
                      profile: { ...prev.profile, phone: e.target.value },
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Company'
                  value={settings.profile.company}
                  onChange={e =>
                    setSettings(prev => ({
                      ...prev,
                      profile: { ...prev.profile, company: e.target.value },
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Job Title'
                  value={settings.profile.jobTitle}
                  onChange={e =>
                    setSettings(prev => ({
                      ...prev,
                      profile: { ...prev.profile, jobTitle: e.target.value },
                    }))
                  }
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Preferences Tab */}
          <TabPanel value={tabValue} index={1}>
            <Typography variant='h6' gutterBottom sx={{ fontWeight: 600 }}>
              Application Preferences
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Theme</InputLabel>
                  <Select
                    value={settings.preferences.theme}
                    onChange={e =>
                      setSettings(prev => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          theme: e.target.value as 'light' | 'dark' | 'auto',
                        },
                      }))
                    }
                  >
                    <MenuItem value='light'>Light</MenuItem>
                    <MenuItem value='dark'>Dark</MenuItem>
                    <MenuItem value='auto'>Auto</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={settings.preferences.language}
                    onChange={e =>
                      setSettings(prev => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          language: e.target.value,
                        },
                      }))
                    }
                  >
                    <MenuItem value='en'>English</MenuItem>
                    <MenuItem value='es'>Spanish</MenuItem>
                    <MenuItem value='fr'>French</MenuItem>
                    <MenuItem value='de'>German</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Timezone</InputLabel>
                  <Select
                    value={settings.preferences.timezone}
                    onChange={e =>
                      setSettings(prev => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          timezone: e.target.value,
                        },
                      }))
                    }
                  >
                    <MenuItem value='UTC'>UTC</MenuItem>
                    <MenuItem value='America/New_York'>Eastern Time</MenuItem>
                    <MenuItem value='America/Chicago'>Central Time</MenuItem>
                    <MenuItem value='America/Denver'>Mountain Time</MenuItem>
                    <MenuItem value='America/Los_Angeles'>
                      Pacific Time
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Date Format</InputLabel>
                  <Select
                    value={settings.preferences.dateFormat}
                    onChange={e =>
                      setSettings(prev => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          dateFormat: e.target.value,
                        },
                      }))
                    }
                  >
                    <MenuItem value='MM/DD/YYYY'>MM/DD/YYYY</MenuItem>
                    <MenuItem value='DD/MM/YYYY'>DD/MM/YYYY</MenuItem>
                    <MenuItem value='YYYY-MM-DD'>YYYY-MM-DD</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant='h6' gutterBottom sx={{ fontWeight: 600 }}>
              Notifications
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.preferences.notifications.email}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          preferences: {
                            ...prev.preferences,
                            notifications: {
                              ...prev.preferences.notifications,
                              email: e.target.checked,
                            },
                          },
                        }))
                      }
                    />
                  }
                  label='Email Notifications'
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.preferences.notifications.push}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          preferences: {
                            ...prev.preferences,
                            notifications: {
                              ...prev.preferences.notifications,
                              push: e.target.checked,
                            },
                          },
                        }))
                      }
                    />
                  }
                  label='Push Notifications'
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.preferences.notifications.processing}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          preferences: {
                            ...prev.preferences,
                            notifications: {
                              ...prev.preferences.notifications,
                              processing: e.target.checked,
                            },
                          },
                        }))
                      }
                    />
                  }
                  label='Processing Updates'
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.preferences.notifications.errors}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          preferences: {
                            ...prev.preferences,
                            notifications: {
                              ...prev.preferences.notifications,
                              errors: e.target.checked,
                            },
                          },
                        }))
                      }
                    />
                  }
                  label='Error Alerts'
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Processing Tab */}
          <TabPanel value={tabValue} index={2}>
            <Typography variant='h6' gutterBottom sx={{ fontWeight: 600 }}>
              Processing Settings
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Default Output Format</InputLabel>
                  <Select
                    value={settings.processing.defaultFormat}
                    onChange={e =>
                      setSettings(prev => ({
                        ...prev,
                        processing: {
                          ...prev.processing,
                          defaultFormat: e.target.value as
                            | 'docx'
                            | 'pdf'
                            | 'html',
                        },
                      }))
                    }
                  >
                    <MenuItem value='docx'>DOCX</MenuItem>
                    <MenuItem value='pdf'>PDF</MenuItem>
                    <MenuItem value='html'>HTML</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.processing.autoProcess}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          processing: {
                            ...prev.processing,
                            autoProcess: e.target.checked,
                          },
                        }))
                      }
                    />
                  }
                  label='Auto-process after upload'
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Max File Size (MB)'
                  type='number'
                  value={settings.processing.maxFileSize}
                  onChange={e =>
                    setSettings(prev => ({
                      ...prev,
                      processing: {
                        ...prev.processing,
                        maxFileSize: parseInt(e.target.value) || 10,
                      },
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Concurrent Jobs'
                  type='number'
                  value={settings.processing.concurrentJobs}
                  onChange={e =>
                    setSettings(prev => ({
                      ...prev,
                      processing: {
                        ...prev.processing,
                        concurrentJobs: parseInt(e.target.value) || 3,
                      },
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Retry Attempts'
                  type='number'
                  value={settings.processing.retryAttempts}
                  onChange={e =>
                    setSettings(prev => ({
                      ...prev,
                      processing: {
                        ...prev.processing,
                        retryAttempts: parseInt(e.target.value) || 3,
                      },
                    }))
                  }
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Email Tab */}
          <TabPanel value={tabValue} index={3}>
            <Typography variant='h6' gutterBottom sx={{ fontWeight: 600 }}>
              Email Configuration
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='SMTP Host'
                  value={settings.email.smtpHost}
                  onChange={e =>
                    setSettings(prev => ({
                      ...prev,
                      email: { ...prev.email, smtpHost: e.target.value },
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='SMTP Port'
                  type='number'
                  value={settings.email.smtpPort}
                  onChange={e =>
                    setSettings(prev => ({
                      ...prev,
                      email: {
                        ...prev.email,
                        smtpPort: parseInt(e.target.value) || 587,
                      },
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='SMTP Username'
                  value={settings.email.smtpUser}
                  onChange={e =>
                    setSettings(prev => ({
                      ...prev,
                      email: { ...prev.email, smtpUser: e.target.value },
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='SMTP Password'
                  type='password'
                  value={settings.email.smtpPassword}
                  onChange={e =>
                    setSettings(prev => ({
                      ...prev,
                      email: { ...prev.email, smtpPassword: e.target.value },
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='From Email'
                  type='email'
                  value={settings.email.fromEmail}
                  onChange={e =>
                    setSettings(prev => ({
                      ...prev,
                      email: { ...prev.email, fromEmail: e.target.value },
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='From Name'
                  value={settings.email.fromName}
                  onChange={e =>
                    setSettings(prev => ({
                      ...prev,
                      email: { ...prev.email, fromName: e.target.value },
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Email Signature'
                  multiline
                  rows={4}
                  value={settings.email.signature}
                  onChange={e =>
                    setSettings(prev => ({
                      ...prev,
                      email: { ...prev.email, signature: e.target.value },
                    }))
                  }
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Security Tab */}
          <TabPanel value={tabValue} index={4}>
            <Typography variant='h6' gutterBottom sx={{ fontWeight: 600 }}>
              Security Settings
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.security.twoFactorEnabled}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          security: {
                            ...prev.security,
                            twoFactorEnabled: e.target.checked,
                          },
                        }))
                      }
                    />
                  }
                  label='Two-Factor Authentication'
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.security.loginNotifications}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          security: {
                            ...prev.security,
                            loginNotifications: e.target.checked,
                          },
                        }))
                      }
                    />
                  }
                  label='Login Notifications'
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Session Timeout (minutes)'
                  type='number'
                  value={settings.security.sessionTimeout}
                  onChange={e =>
                    setSettings(prev => ({
                      ...prev,
                      security: {
                        ...prev.security,
                        sessionTimeout: parseInt(e.target.value) || 30,
                      },
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Password Expiry (days)'
                  type='number'
                  value={settings.security.passwordExpiry}
                  onChange={e =>
                    setSettings(prev => ({
                      ...prev,
                      security: {
                        ...prev.security,
                        passwordExpiry: parseInt(e.target.value) || 90,
                      },
                    }))
                  }
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant='h6' gutterBottom sx={{ fontWeight: 600 }}>
              Account Actions
            </Typography>

            <Stack spacing={2}>
              <Button variant='outlined' color='primary'>
                Change Password
              </Button>
              <Button variant='outlined' color='warning'>
                Export Data
              </Button>
              <Button variant='outlined' color='error'>
                Delete Account
              </Button>
            </Stack>
          </TabPanel>

          {/* Save Button */}
          <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
            <Stack direction='row' spacing={2} justifyContent='flex-end'>
              <Button
                variant='outlined'
                startIcon={<RefreshIcon />}
                onClick={loadSettings}
              >
                Reset
              </Button>
              <Button
                variant='contained'
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
