'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Alert,
  LinearProgress,
  Stack,
  Chip,
  Card,
  CardContent,
  CardActions,
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
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Description as ResumeIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Send as SendIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/hooks/use-auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'react-hot-toast';

interface Resume {
  _id: string;
  title: string;
  filename: string;
  status: 'draft' | 'processing' | 'ready' | 'failed' | 'archived';
  projects: number;
  techStacks: number;
  createdAt: string;
  updatedAt: string;
  customizationOptions?: {
    bulletFormatting: boolean;
    projectHighlighting: boolean;
    techStackExtraction: boolean;
    keywordOptimization: boolean;
  };
}

interface Job {
  _id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: {
    percentage: number;
    currentStep: string;
    steps: Array<{
      name: string;
      status: 'pending' | 'processing' | 'completed' | 'failed';
      duration?: number;
    }>;
  };
  data: {
    resumeId: string;
    options: any;
  };
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

interface ProcessingOptions {
  bulletFormatting: boolean;
  projectHighlighting: boolean;
  techStackExtraction: boolean;
  keywordOptimization: boolean;
  customKeywords: string[];
  outputFormat: 'docx' | 'pdf' | 'html';
  emailNotification: boolean;
}

export default function ResumeProcessorPage() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedResumes, setSelectedResumes] = useState<string[]>([]);
  const [processingOptions, setProcessingOptions] = useState<ProcessingOptions>(
    {
      bulletFormatting: true,
      projectHighlighting: true,
      techStackExtraction: true,
      keywordOptimization: true,
      customKeywords: [],
      outputFormat: 'docx',
      emailNotification: true,
    }
  );
  const [customKeyword, setCustomKeyword] = useState('');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [resumesRes, jobsRes] = await Promise.all([
        fetch('/api/resumes/upload'),
        fetch('/api/resumes/process'),
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
    } finally {
      setLoading(false);
    }
  };

  const handleResumeSelect = (resumeId: string) => {
    setSelectedResumes(prev =>
      prev.includes(resumeId)
        ? prev.filter(id => id !== resumeId)
        : [...prev, resumeId]
    );
  };

  const handleSelectAll = () => {
    const readyResumes = resumes
      .filter(r => r.status === 'ready')
      .map(r => r._id);
    setSelectedResumes(readyResumes);
  };

  const handleDeselectAll = () => {
    setSelectedResumes([]);
  };

  const addCustomKeyword = () => {
    if (
      customKeyword.trim() &&
      !processingOptions.customKeywords.includes(customKeyword.trim())
    ) {
      setProcessingOptions(prev => ({
        ...prev,
        customKeywords: [...prev.customKeywords, customKeyword.trim()],
      }));
      setCustomKeyword('');
    }
  };

  const removeCustomKeyword = (keyword: string) => {
    setProcessingOptions(prev => ({
      ...prev,
      customKeywords: prev.customKeywords.filter(k => k !== keyword),
    }));
  };

  const startProcessing = async () => {
    if (selectedResumes.length === 0) {
      toast.error('Please select at least one resume');
      return;
    }

    try {
      setProcessing(true);

      const response = await fetch('/api/resumes/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeIds: selectedResumes,
          options: processingOptions,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Processing started successfully!');
        setSelectedResumes([]);
        fetchData();
      } else {
        toast.error(data.error || 'Failed to start processing');
      }
    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Failed to start processing');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'success';
      case 'processing':
        return 'warning';
      case 'failed':
        return 'error';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircleIcon />;
      case 'processing':
        return <ScheduleIcon />;
      case 'failed':
        return <ErrorIcon />;
      case 'completed':
        return <CheckCircleIcon />;
      case 'cancelled':
        return <StopIcon />;
      default:
        return <ResumeIcon />;
    }
  };

  if (loading) {
    return <LoadingSpinner message='Loading processor...' />;
  }

  const readyResumes = resumes.filter(r => r.status === 'ready');
  const activeJobs = jobs.filter(j => j.status === 'processing');

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth='xl'>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant='h4'
            component='h1'
            gutterBottom
            sx={{ fontWeight: 700 }}
          >
            Resume Processor
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Process and customize your resumes with advanced AI-powered features
          </Typography>
        </Box>

        {/* Active Jobs */}
        {activeJobs.length > 0 && (
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant='h6' gutterBottom sx={{ fontWeight: 600 }}>
              Active Processing Jobs
            </Typography>
            <Stack spacing={2}>
              {activeJobs.map(job => (
                <Card key={job._id}>
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                      }}
                    >
                      <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                        {job.type.replace('_', ' ').toUpperCase()}
                      </Typography>
                      <Chip
                        icon={getStatusIcon(job.status)}
                        label={job.status}
                        color={getStatusColor(job.status) as any}
                        size='small'
                      />
                    </Box>

                    <Typography
                      variant='body2'
                      color='text.secondary'
                      sx={{ mb: 2 }}
                    >
                      {job.progress.currentStep}
                    </Typography>

                    <LinearProgress
                      variant='determinate'
                      value={job.progress.percentage}
                      sx={{ mb: 1 }}
                    />

                    <Typography variant='caption' color='text.secondary'>
                      {job.progress.percentage}% complete
                    </Typography>

                    {/* Processing Steps */}
                    <Accordion sx={{ mt: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant='body2'>
                          Processing Steps
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List dense>
                          {job.progress.steps.map((step, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                {step.status === 'completed' && (
                                  <CheckCircleIcon
                                    color='success'
                                    fontSize='small'
                                  />
                                )}
                                {step.status === 'processing' && (
                                  <ScheduleIcon
                                    color='primary'
                                    fontSize='small'
                                  />
                                )}
                                {step.status === 'failed' && (
                                  <ErrorIcon color='error' fontSize='small' />
                                )}
                                {step.status === 'pending' && (
                                  <ScheduleIcon
                                    color='disabled'
                                    fontSize='small'
                                  />
                                )}
                              </ListItemIcon>
                              <ListItemText
                                primary={step.name}
                                secondary={
                                  step.duration
                                    ? `${step.duration}ms`
                                    : undefined
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Paper>
        )}

        <Grid container spacing={4}>
          {/* Resume Selection */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 4 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3,
                }}
              >
                <Typography variant='h6' sx={{ fontWeight: 600 }}>
                  Select Resumes to Process
                </Typography>
                <Stack direction='row' spacing={1}>
                  <Button size='small' onClick={handleSelectAll}>
                    Select All ({readyResumes.length})
                  </Button>
                  <Button size='small' onClick={handleDeselectAll}>
                    Deselect All
                  </Button>
                </Stack>
              </Box>

              {readyResumes.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <ResumeIcon
                    sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}
                  />
                  <Typography variant='h6' gutterBottom>
                    No ready resumes
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ mb: 3 }}
                  >
                    Upload and process resumes first
                  </Typography>
                  <Button variant='contained' href='/resume-upload'>
                    Upload Resumes
                  </Button>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {readyResumes.map(resume => (
                    <Grid item xs={12} sm={6} key={resume._id}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          border: selectedResumes.includes(resume._id) ? 2 : 1,
                          borderColor: selectedResumes.includes(resume._id)
                            ? 'primary.main'
                            : 'divider',
                        }}
                        onClick={() => handleResumeSelect(resume._id)}
                      >
                        <CardContent>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mb: 1,
                            }}
                          >
                            <ResumeIcon color='primary' />
                            <Typography
                              variant='subtitle1'
                              sx={{ fontWeight: 600 }}
                            >
                              {resume.title}
                            </Typography>
                            {selectedResumes.includes(resume._id) && (
                              <CheckCircleIcon color='primary' />
                            )}
                          </Box>
                          <Typography
                            variant='body2'
                            color='text.secondary'
                            sx={{ mb: 1 }}
                          >
                            {resume.filename}
                          </Typography>
                          <Stack direction='row' spacing={1}>
                            <Chip
                              label={`${resume.projects} projects`}
                              size='small'
                            />
                            <Chip
                              label={`${resume.techStacks} tech stacks`}
                              size='small'
                            />
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>

            {/* Processing Options */}
            <Paper sx={{ p: 3 }}>
              <Typography variant='h6' gutterBottom sx={{ fontWeight: 600 }}>
                Processing Options
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={processingOptions.bulletFormatting}
                        onChange={e =>
                          setProcessingOptions(prev => ({
                            ...prev,
                            bulletFormatting: e.target.checked,
                          }))
                        }
                      />
                    }
                    label='Bullet Point Formatting'
                  />
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    display='block'
                  >
                    Format bullet points for better readability
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={processingOptions.projectHighlighting}
                        onChange={e =>
                          setProcessingOptions(prev => ({
                            ...prev,
                            projectHighlighting: e.target.checked,
                          }))
                        }
                      />
                    }
                    label='Project Highlighting'
                  />
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    display='block'
                  >
                    Highlight key projects and achievements
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={processingOptions.techStackExtraction}
                        onChange={e =>
                          setProcessingOptions(prev => ({
                            ...prev,
                            techStackExtraction: e.target.checked,
                          }))
                        }
                      />
                    }
                    label='Tech Stack Extraction'
                  />
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    display='block'
                  >
                    Extract and organize technical skills
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={processingOptions.keywordOptimization}
                        onChange={e =>
                          setProcessingOptions(prev => ({
                            ...prev,
                            keywordOptimization: e.target.checked,
                          }))
                        }
                      />
                    }
                    label='Keyword Optimization'
                  />
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    display='block'
                  >
                    Optimize for ATS keywords
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Output Format</InputLabel>
                    <Select
                      value={processingOptions.outputFormat}
                      onChange={e =>
                        setProcessingOptions(prev => ({
                          ...prev,
                          outputFormat: e.target.value as
                            | 'docx'
                            | 'pdf'
                            | 'html',
                        }))
                      }
                    >
                      <MenuItem value='docx'>DOCX</MenuItem>
                      <MenuItem value='pdf'>PDF</MenuItem>
                      <MenuItem value='html'>HTML</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant='subtitle2' gutterBottom>
                    Custom Keywords
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      size='small'
                      placeholder='Add custom keyword'
                      value={customKeyword}
                      onChange={e => setCustomKeyword(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && addCustomKeyword()}
                    />
                    <Button variant='outlined' onClick={addCustomKeyword}>
                      Add
                    </Button>
                  </Box>
                  <Stack direction='row' spacing={1} flexWrap='wrap'>
                    {processingOptions.customKeywords.map(keyword => (
                      <Chip
                        key={keyword}
                        label={keyword}
                        onDelete={() => removeCustomKeyword(keyword)}
                        size='small'
                      />
                    ))}
                  </Stack>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Processing Controls */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
              <Typography variant='h6' gutterBottom sx={{ fontWeight: 600 }}>
                Processing Controls
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant='body2' color='text.secondary' gutterBottom>
                  Selected Resumes: {selectedResumes.length}
                </Typography>
                <Typography variant='body2' color='text.secondary' gutterBottom>
                  Ready Resumes: {readyResumes.length}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Active Jobs: {activeJobs.length}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Stack spacing={2}>
                <Button
                  variant='contained'
                  size='large'
                  startIcon={<PlayIcon />}
                  onClick={startProcessing}
                  disabled={selectedResumes.length === 0 || processing}
                  fullWidth
                >
                  {processing ? 'Starting...' : 'Start Processing'}
                </Button>

                <Button
                  variant='outlined'
                  startIcon={<RefreshIcon />}
                  onClick={fetchData}
                  fullWidth
                >
                  Refresh Status
                </Button>

                <Button
                  variant='text'
                  startIcon={<SettingsIcon />}
                  href='/settings'
                  fullWidth
                >
                  Settings
                </Button>
              </Stack>

              {selectedResumes.length > 0 && (
                <Alert severity='info' sx={{ mt: 3 }}>
                  <Typography variant='body2'>
                    Processing {selectedResumes.length} resume
                    {selectedResumes.length > 1 ? 's' : ''} with selected
                    options.
                  </Typography>
                </Alert>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
