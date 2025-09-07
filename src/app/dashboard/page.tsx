'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent,
  CardActions,
  Button,
  Chip,
  Stack,
  Paper,
  LinearProgress,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Upload as UploadIcon,
  Send as SendIcon,
  MoreVert as MoreVertIcon,
  Description as ResumeIcon,
  Email as EmailIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/hooks/use-auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'react-hot-toast';

interface Resume {
  _id: string;
  title: string;
  filename: string;
  size: number;
  status: 'draft' | 'processing' | 'ready' | 'failed' | 'archived';
  projects: number;
  techStacks: number;
  createdAt: string;
  updatedAt: string;
}

interface Job {
  _id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: {
    percentage: number;
    currentStep: string;
  };
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedResume, setSelectedResume] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resumesRes, jobsRes] = await Promise.all([
        fetch('/api/resumes/upload'),
        fetch('/api/resumes/process')
      ]);

      if (resumesRes.ok) {
        const resumesData = await resumesRes.json();
        setResumes(resumesData.data.resumes || []);
      }

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(jobsData.data.jobs || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', selectedFile.name.replace(/\.[^/.]+$/, ''));

      const response = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Resume uploaded successfully!');
        setUploadDialogOpen(false);
        setSelectedFile(null);
        fetchData();
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, resumeId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedResume(resumeId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedResume(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'success';
      case 'processing': return 'warning';
      case 'failed': return 'error';
      case 'draft': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return <CheckCircleIcon />;
      case 'processing': return <ScheduleIcon />;
      case 'failed': return <ErrorIcon />;
      default: return <ResumeIcon />;
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Welcome back, {user?.firstName}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your resumes and track processing jobs
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <ResumeIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                      {resumes.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Resumes
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                      {resumes.filter(r => r.status === 'ready').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ready
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <SpeedIcon color="warning" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                      {jobs.filter(j => j.status === 'processing').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Processing
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <EmailIcon color="info" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                      {user?.usage.emailsSent || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Emails Sent
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Quick Actions
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={() => setUploadDialogOpen(true)}
            >
              Upload Resume
            </Button>
            <Button
              variant="outlined"
              startIcon={<SpeedIcon />}
              disabled={resumes.filter(r => r.status === 'ready').length === 0}
            >
              Bulk Process
            </Button>
            <Button
              variant="outlined"
              startIcon={<EmailIcon />}
              disabled={resumes.filter(r => r.status === 'ready').length === 0}
            >
              Send Emails
            </Button>
          </Stack>
        </Paper>

        {/* Recent Jobs */}
        {jobs.length > 0 && (
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Recent Jobs
            </Typography>
            <List>
              {jobs.slice(0, 5).map((job) => (
                <ListItem key={job._id} divider>
                  <ListItemIcon>
                    {getStatusIcon(job.status)}
                  </ListItemIcon>
                  <ListItemText
                    primary={`${job.type.replace('_', ' ').toUpperCase()}`}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {job.progress.currentStep}
                        </Typography>
                        {job.status === 'processing' && (
                          <LinearProgress
                            variant="determinate"
                            value={job.progress.percentage}
                            sx={{ mt: 1 }}
                          />
                        )}
                      </Box>
                    }
                  />
                  <Chip
                    label={job.status}
                    color={getStatusColor(job.status) as any}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}

        {/* Resumes Grid */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Your Resumes
            </Typography>
            <IconButton onClick={fetchData}>
              <RefreshIcon />
            </IconButton>
          </Box>

          {resumes.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <ResumeIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No resumes yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Upload your first resume to get started
              </Typography>
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={() => setUploadDialogOpen(true)}
              >
                Upload Resume
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {resumes.map((resume) => (
                <Grid item xs={12} sm={6} md={4} key={resume._id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                            {resume.title}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuClick(e, resume._id)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {resume.filename}
                        </Typography>

                        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                          <Chip
                            icon={getStatusIcon(resume.status)}
                            label={resume.status}
                            color={getStatusColor(resume.status) as any}
                            size="small"
                          />
                        </Stack>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Projects:
                          </Typography>
                          <Typography variant="body2">
                            {resume.projects}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Tech Stacks:
                          </Typography>
                          <Typography variant="body2">
                            {resume.techStacks}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">
                            Size:
                          </Typography>
                          <Typography variant="body2">
                            {(resume.size / 1024 / 1024).toFixed(2)} MB
                          </Typography>
                        </Box>
                      </CardContent>

                      <CardActions>
                        <Button
                          size="small"
                          startIcon={<VisibilityIcon />}
                          disabled={resume.status !== 'ready'}
                        >
                          Preview
                        </Button>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          disabled={resume.status !== 'ready'}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          startIcon={<DownloadIcon />}
                          disabled={resume.status !== 'ready'}
                        >
                          Download
                        </Button>
                      </CardActions>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>

        {/* Upload Dialog */}
        <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Upload Resume</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <input
                type="file"
                accept=".docx,.doc"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                style={{ display: 'none' }}
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                  fullWidth
                  sx={{ py: 2 }}
                >
                  Choose File
                </Button>
              </label>
              {selectedFile && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Selected: {selectedFile.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleFileUpload}
              variant="contained"
              disabled={!selectedFile || uploading}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Resume Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <VisibilityIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Preview</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <DownloadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Download</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>
      </Container>
    </Box>
  );
}
