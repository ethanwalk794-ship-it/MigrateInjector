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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormGroup,
} from '@mui/material';
import {
  Email as EmailIcon,
  Description as ResumeIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
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
  emailConfig?: {
    recipientEmail: string;
    subject: string;
    message: string;
    attachmentFormat: 'docx' | 'pdf' | 'html';
  };
}

interface EmailTemplate {
  _id: string;
  name: string;
  description: string;
  subject: string;
  body: string;
  variables: string[];
  category: string;
}

interface Job {
  _id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: {
    percentage: number;
    currentStep: string;
  };
  data: {
    resumeId: string;
    emailConfig: any;
  };
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

interface EmailConfig {
  recipientEmail: string;
  subject: string;
  message: string;
  attachmentFormat: 'docx' | 'pdf' | 'html';
  useTemplate: boolean;
  templateId?: string;
  customSubject?: string;
  customMessage?: string;
}

export default function EmailSenderPage() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedResumes, setSelectedResumes] = useState<string[]>([]);
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    recipientEmail: '',
    subject: '',
    message: '',
    attachmentFormat: 'docx',
    useTemplate: false,
    templateId: '',
    customSubject: '',
    customMessage: '',
  });
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [resumesRes, templatesRes, jobsRes] = await Promise.all([
        fetch('/api/resumes/upload'),
        fetch('/api/email/templates'),
        fetch('/api/email/send'),
      ]);

      if (resumesRes.ok) {
        const resumesData = await resumesRes.json();
        setResumes(resumesData.data.resumes || []);
      }

      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        setTemplates(templatesData.data.templates || []);
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

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t._id === templateId);
    if (template) {
      setEmailConfig(prev => ({
        ...prev,
        templateId,
        subject: template.subject,
        message: template.body,
        customSubject: template.subject,
        customMessage: template.body,
      }));
    }
  };

  const generatePreview = () => {
    const selectedResume = resumes.find(r => r._id === selectedResumes[0]);
    if (!selectedResume) return;

    let preview = emailConfig.message;

    // Replace template variables
    preview = preview.replace(/\{resumeTitle\}/g, selectedResume.title);
    preview = preview.replace(/\{recipientName\}/g, 'John Doe'); // This would come from recipient data
    preview = preview.replace(/\{senderName\}/g, user?.firstName || 'User');
    preview = preview.replace(/\{companyName\}/g, 'Company Name'); // This would come from job data

    setPreviewContent(preview);
    setPreviewDialogOpen(true);
  };

  const sendEmails = async () => {
    if (selectedResumes.length === 0) {
      toast.error('Please select at least one resume');
      return;
    }

    if (!emailConfig.recipientEmail.trim()) {
      toast.error('Please enter recipient email');
      return;
    }

    try {
      setSending(true);

      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeIds: selectedResumes,
          emailConfig: {
            recipientEmail: emailConfig.recipientEmail,
            subject: emailConfig.subject,
            message: emailConfig.message,
            attachmentFormat: emailConfig.attachmentFormat,
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Emails queued for sending!');
        setSelectedResumes([]);
        setEmailConfig(prev => ({
          ...prev,
          recipientEmail: '',
          subject: '',
          message: '',
        }));
        fetchData();
      } else {
        toast.error(data.error || 'Failed to send emails');
      }
    } catch (error) {
      console.error('Email sending error:', error);
      toast.error('Failed to send emails');
    } finally {
      setSending(false);
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
        return <SendIcon />;
      default:
        return <ResumeIcon />;
    }
  };

  if (loading) {
    return <LoadingSpinner message='Loading email sender...' />;
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
            Email Sender
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Send customized resumes via email with professional templates
          </Typography>
        </Box>

        {/* Active Jobs */}
        {activeJobs.length > 0 && (
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant='h6' gutterBottom sx={{ fontWeight: 600 }}>
              Active Email Jobs
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
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Paper>
        )}

        <Grid container spacing={4}>
          {/* Resume Selection */}
          <Grid item xs={12} md={6}>
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
                  Select Resumes to Send
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
                    Process resumes first before sending
                  </Typography>
                  <Button variant='contained' href='/resume-processor'>
                    Process Resumes
                  </Button>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {readyResumes.map(resume => (
                    <Grid item xs={12} key={resume._id}>
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
          </Grid>

          {/* Email Configuration */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant='h6' gutterBottom sx={{ fontWeight: 600 }}>
                Email Configuration
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label='Recipient Email'
                    type='email'
                    value={emailConfig.recipientEmail}
                    onChange={e =>
                      setEmailConfig(prev => ({
                        ...prev,
                        recipientEmail: e.target.value,
                      }))
                    }
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Email Template</InputLabel>
                    <Select<string>
                      value={emailConfig.templateId ?? ''}
                      onChange={e => handleTemplateChange(e.target.value ?? '')}
                    >
                      <MenuItem value=''>
                        <em>Custom Message</em>
                      </MenuItem>
                      {templates.map(template => (
                        <MenuItem key={template._id} value={template._id}>
                          {template.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label='Subject'
                    value={emailConfig.subject}
                    onChange={e =>
                      setEmailConfig(prev => ({
                        ...prev,
                        subject: e.target.value,
                      }))
                    }
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label='Message'
                    multiline
                    rows={6}
                    value={emailConfig.message}
                    onChange={e =>
                      setEmailConfig(prev => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Attachment Format</InputLabel>
                    <Select
                      value={emailConfig.attachmentFormat}
                      onChange={e =>
                        setEmailConfig(prev => ({
                          ...prev,
                          attachmentFormat: e.target.value as
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
                  <Stack direction='row' spacing={2}>
                    <Button
                      variant='outlined'
                      startIcon={<VisibilityIcon />}
                      onClick={generatePreview}
                      disabled={
                        selectedResumes.length === 0 || !emailConfig.message
                      }
                    >
                      Preview
                    </Button>
                    <Button
                      variant='outlined'
                      startIcon={<AddIcon />}
                      href='/email-templates'
                    >
                      Manage Templates
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        {/* Send Controls */}
        <Paper sx={{ p: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Typography variant='h6' sx={{ fontWeight: 600 }}>
              Send Emails
            </Typography>
            <Stack direction='row' spacing={1}>
              <Button
                variant='outlined'
                startIcon={<RefreshIcon />}
                onClick={fetchData}
              >
                Refresh
              </Button>
              <Button
                variant='contained'
                size='large'
                startIcon={<SendIcon />}
                onClick={sendEmails}
                disabled={
                  selectedResumes.length === 0 ||
                  !emailConfig.recipientEmail ||
                  sending
                }
              >
                {sending
                  ? 'Sending...'
                  : `Send ${selectedResumes.length} Email${selectedResumes.length > 1 ? 's' : ''}`}
              </Button>
            </Stack>
          </Box>

          {selectedResumes.length > 0 && (
            <Alert severity='info'>
              <Typography variant='body2'>
                Ready to send {selectedResumes.length} resume
                {selectedResumes.length > 1 ? 's' : ''} to{' '}
                {emailConfig.recipientEmail}
              </Typography>
            </Alert>
          )}
        </Paper>

        {/* Preview Dialog */}
        <Dialog
          open={previewDialogOpen}
          onClose={() => setPreviewDialogOpen(false)}
          maxWidth='md'
          fullWidth
        >
          <DialogTitle>Email Preview</DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 2 }}>
              <Typography variant='subtitle2' gutterBottom>
                Subject: {emailConfig.subject}
              </Typography>
              <Typography variant='subtitle2' gutterBottom>
                To: {emailConfig.recipientEmail}
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>
              {previewContent}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
            <Button
              variant='contained'
              onClick={() => {
                setPreviewDialogOpen(false);
                sendEmails();
              }}
            >
              Send Email
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
