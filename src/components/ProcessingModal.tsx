'use client';

import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Tab,
  Tabs,
  Alert,
  Chip,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Divider,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Grid,
  Paper,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Preview as PreviewIcon,
  Email as EmailIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Send as SendIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import ResumePreview from './ResumePreview';

interface TechStackItem {
  technology: string;
  bullets: string[];
}

interface ProcessingOptions {
  techStack: TechStackItem[];
  sendEmail: boolean;
  emailConfig: {
    senderEmail: string;
    senderPassword: string;
    recipientEmail: string;
    smtpHost: string;
    smtpPort: number;
    subject: string;
    message: string;
  };
  downloadAfterProcessing: boolean;
  previewBeforeProcessing: boolean;
}

interface UploadedFile {
  id: string;
  file: File;
  status: string;
  resumeId?: string;
  filename?: string;
}

interface ProcessingModalProps {
  open: boolean;
  onClose: () => void;
  files: UploadedFile[];
  processingMode: 'single' | 'bulk';
  selectedFileId?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div hidden={value !== index} style={{ paddingTop: '16px' }}>
      {value === index && children}
    </div>
  );
}

const ProcessingModal = memo(function ProcessingModal({
  open,
  onClose,
  files,
  processingMode,
  selectedFileId,
}: ProcessingModalProps) {
  const [tabValue, setTabValue] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  const [options, setOptions] = useState<ProcessingOptions>({
    techStack: [],
    sendEmail: false,
    emailConfig: {
      senderEmail: '',
      senderPassword: '',
      recipientEmail: '',
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      subject: 'Your Customized Resume is Ready! 🚀',
      message: 'Please find your customized resume attached.',
    },
    downloadAfterProcessing: true,
    previewBeforeProcessing: false,
  });

  const [techStackInput, setTechStackInput] = useState('');
  const [parsedTechStack, setParsedTechStack] = useState<TechStackItem[]>([]);
  const [extractionSettings, setExtractionSettings] = useState({
    dynamicExtraction: true,
    minPointsPerTech: 1,
    maxPointsPerTech: 4,
    totalTargetPoints: 18,
  });

  const filesToProcess = processingMode === 'single' 
    ? files.filter(f => f.id === selectedFileId && f.status === 'success')
    : files.filter(f => f.status === 'success');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Auto-detect and parse tech stack input
  const parseTechStackInput = (input: string): TechStackItem[] => {
    const lines = input.split('\n').map(line => line.trim()).filter(line => line);
    const techStacks: TechStackItem[] = [];
    let currentTech: TechStackItem | null = null;

    for (const line of lines) {
      // Check if line is a technology name (doesn't start with bullet)
      if (!line.startsWith('•') && !line.startsWith('-') && !line.startsWith('*')) {
        // Save previous tech if exists
        if (currentTech && currentTech.bullets.length > 0) {
          techStacks.push(currentTech);
        }
        // Start new tech
        currentTech = {
          technology: line,
          bullets: []
        };
      } else {
        // This is a bullet point
        if (currentTech) {
          const bullet = line.replace(/^[•\-\*]\s*/, '').trim();
          if (bullet) {
            currentTech.bullets.push(bullet);
          }
        }
      }
    }

    // Add the last tech if exists
    if (currentTech && currentTech.bullets.length > 0) {
      techStacks.push(currentTech);
    }

    return techStacks;
  };

  const handleTechStackInputChange = (value: string) => {
    setTechStackInput(value);
    
    // Auto-parse and update
    if (value.trim()) {
      const parsed = parseTechStackInput(value);
      setParsedTechStack(parsed);
      setOptions(prev => ({ ...prev, techStack: parsed }));
    } else {
      setParsedTechStack([]);
      setOptions(prev => ({ ...prev, techStack: [] }));
    }
  };

  // Dynamic point extraction algorithm
  const calculateDynamicExtraction = (techStacks: TechStackItem[]) => {
    const totalAvailablePoints = techStacks.reduce((sum, tech) => sum + tech.bullets.length, 0);
    const targetPoints = Math.min(extractionSettings.totalTargetPoints, totalAvailablePoints);
    
    // Calculate points per tech based on available bullets and relevance
    const extractionPlan = techStacks.map(tech => {
      const availableBullets = tech.bullets.length;
      const minExtract = Math.min(extractionSettings.minPointsPerTech, availableBullets);
      const maxExtract = Math.min(extractionSettings.maxPointsPerTech, availableBullets);
      
      // Base extraction: proportional to available bullets
      const proportionalExtract = Math.round((availableBullets / totalAvailablePoints) * targetPoints);
      const plannedExtract = Math.max(minExtract, Math.min(maxExtract, proportionalExtract));
      
      return {
        technology: tech.technology,
        availableBullets,
        plannedExtract,
        bullets: tech.bullets
      };
    });

    return extractionPlan;
  };

  const generatePreview = async () => {
    if (parsedTechStack.length === 0) {
      toast.error('Please enter your tech stack in the specified format');
      return;
    }

    const resumeIds = filesToProcess.map(f => f.resumeId).filter(id => id !== undefined);
    console.log('Files to process:', filesToProcess);
    console.log('Resume IDs:', resumeIds);
    
    if (resumeIds.length === 0) {
      toast.error('No valid resume IDs found. Please re-upload your files.');
      return;
    }

    setPreviewLoading(true);
    try {
      const response = await fetch('/api/resumes/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeIds,
          techStack: parsedTechStack,
          processingMode,
          extractionSettings,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setPreview(data);
        setTabValue(1); // Switch to preview tab
        toast.success('Preview generated successfully');
      } else {
        throw new Error(data.error || 'Failed to generate preview');
      }
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Failed to generate preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const processResumes = async () => {
    if (parsedTechStack.length === 0) {
      toast.error('Please enter your tech stack in the specified format');
      return;
    }

    if (options.sendEmail) {
      const { senderEmail, senderPassword, recipientEmail } = options.emailConfig;
      if (!senderEmail || !senderPassword || !recipientEmail) {
        toast.error('Please fill in all email configuration fields');
        return;
      }
    }

    setProcessing(true);
    setProcessingProgress(0);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 500);

    try {
      const response = await fetch('/api/resumes/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeIds: filesToProcess.map(f => f.resumeId),
          techStack: parsedTechStack,
          processAll: processingMode === 'bulk',
          emailConfig: options.sendEmail ? options.emailConfig : null,
          extractionSettings,
        }),
      });

      const data = await response.json();
      clearInterval(progressInterval);
      setProcessingProgress(100);

      if (response.ok) {
        toast.success(`Successfully processed ${data.results.filter((r: any) => r.status === 'success').length} resume(s)`);
        
        // Handle downloads
        if (options.downloadAfterProcessing) {
          for (const result of data.results) {
            if (result.status === 'success' && result.processedFile) {
              const downloadLink = document.createElement('a');
              downloadLink.href = `/api/resumes/download/${result.processedFile}`;
              downloadLink.download = result.processedFile;
              document.body.appendChild(downloadLink);
              downloadLink.click();
              document.body.removeChild(downloadLink);
            }
          }
        }

        setTimeout(() => {
          onClose();
          setProcessingProgress(0);
        }, 2000);
      } else {
        throw new Error(data.error || 'Processing failed');
      }
    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Failed to process resumes');
      clearInterval(progressInterval);
      setProcessingProgress(0);
    } finally {
      setProcessing(false);
    }
  };

  const isValidTechStack = () => {
    return parsedTechStack.length > 0 && parsedTechStack.every(item => 
      item.technology.trim() && item.bullets.length > 0
    );
  };

  const getExtractionPreview = () => {
    if (parsedTechStack.length === 0) return [];
    return calculateDynamicExtraction(parsedTechStack);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{ sx: { minHeight: '70vh' } }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h6" component="span">
            Process Resume{processingMode === 'bulk' ? 's' : ''} 
          </Typography>
          <Chip 
            label={`${filesToProcess.length} file${filesToProcess.length !== 1 ? 's' : ''}`}
            color="primary" 
            size="small" 
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        {processing && (
          <Box mb={3}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Processing in progress... {Math.round(processingProgress)}%
            </Typography>
            <LinearProgress variant="determinate" value={processingProgress} />
          </Box>
        )}

        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Tech Stack" icon={<SettingsIcon />} />
          <Tab label="Preview" icon={<PreviewIcon />} disabled={!preview} />
          <Tab label="Email Config" icon={<EmailIcon />} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Format:</strong> Paste your tech stack in the format below. The system will auto-detect and parse it.
              </Typography>
              <Typography variant="body2" component="code" sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 1, display: 'block' }}>
                TechName<br/>
                • point1<br/>
                • point2<br/>
                • point3<br/><br/>
                NextTech<br/>
                • point1<br/>
                • point2
              </Typography>
            </Alert>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🚀 Tech Stack & Points
                </Typography>
                <TextField
                  label="Paste your tech stack data here:"
                  value={techStackInput}
                  onChange={(e) => handleTechStackInputChange(e.target.value)}
                  placeholder={`Python
• Developed web applications using Django and Flask
• Implemented RESTful APIs for data integration
• Built automated testing suites with pytest

JavaScript
• Created responsive UIs with React and TypeScript
• Developed real-time features using WebSocket
• Implemented state management with Redux

AWS
• Deployed scalable applications on EC2 instances
• Managed databases using RDS and DynamoDB
• Configured CI/CD pipelines with CodePipeline`}
                  multiline
                  rows={12}
                  fullWidth
                  sx={{ 
                    '& .MuiInputBase-input': { 
                      fontFamily: 'monospace',
                      fontSize: '14px'
                    }
                  }}
                />
              </CardContent>
            </Card>

            {/* Parsed Tech Stack Preview */}
            {parsedTechStack.length > 0 && (
              <Card sx={{ mb: 3, bgcolor: 'success.50', border: 1, borderColor: 'success.200' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="success.main">
                    ✅ Parsed Tech Stack ({parsedTechStack.length} technologies)
                  </Typography>
                  
                  {parsedTechStack.map((tech, index) => (
                    <Accordion key={index}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Typography variant="subtitle1" fontWeight="600">
                            {tech.technology}
                          </Typography>
                          <Chip 
                            label={`${tech.bullets.length} points`} 
                            size="small" 
                            color="primary"
                          />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List dense>
                          {tech.bullets.map((bullet, bulletIndex) => (
                            <ListItem key={bulletIndex}>
                              <ListItemIcon>
                                <Typography variant="body2">•</Typography>
                              </ListItemIcon>
                              <ListItemText primary={bullet} />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  ))}

                  {/* Dynamic Extraction Preview */}
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom color="info.main">
                      📊 Dynamic Extraction Plan:
                    </Typography>
                    {getExtractionPreview().map((plan, index) => (
                      <Box key={index} display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">
                          <strong>{plan.technology}:</strong> {plan.plannedExtract} of {plan.availableBullets} points
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={(plan.plannedExtract / plan.availableBullets) * 100}
                          sx={{ width: 100, ml: 2 }}
                        />
                      </Box>
                    ))}
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Points will be distributed equally across your top 3 most relevant projects.
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Processing Options</Typography>
                <Box display="flex" flexWrap="wrap" gap={2}>
                  <Box flex={1} minWidth="250px">
                    <FormControlLabel
                      control={
                        <Switch
                          checked={options.downloadAfterProcessing}
                          onChange={(e) => setOptions(prev => ({ ...prev, downloadAfterProcessing: e.target.checked }))}
                        />
                      }
                      label="Auto-download processed files"
                    />
                  </Box>
                  <Box flex={1} minWidth="250px">
                    <FormControlLabel
                      control={
                        <Switch
                          checked={options.previewBeforeProcessing}
                          onChange={(e) => setOptions(prev => ({ ...prev, previewBeforeProcessing: e.target.checked }))}
                        />
                      }
                      label="Show preview before processing"
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {preview ? (
            <ResumePreview 
              previewData={preview.previews || []} 
              extractionPlan={getExtractionPreview()}
            />
          ) : (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No preview generated yet
              </Typography>
              <Button
                startIcon={<PreviewIcon />}
                onClick={generatePreview}
                disabled={!isValidTechStack() || previewLoading}
                variant="outlined"
                size="large"
              >
                {previewLoading ? 'Generating Preview...' : '🔍 Generate Preview'}
              </Button>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={options.sendEmail}
                  onChange={(e) => setOptions(prev => ({ ...prev, sendEmail: e.target.checked }))}
                />
              }
              label="Send processed resumes via email"
            />

            {options.sendEmail && (
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>SMTP Configuration</Typography>
                  
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Box display="flex" flexWrap="wrap" gap={2}>
                      <Box flex={1} minWidth="250px">
                        <TextField
                          label="Sender Email"
                          type="email"
                          value={options.emailConfig.senderEmail}
                          onChange={(e) => setOptions(prev => ({
                            ...prev,
                            emailConfig: { ...prev.emailConfig, senderEmail: e.target.value }
                          }))}
                          fullWidth
                          required
                        />
                      </Box>
                      <Box flex={1} minWidth="250px">
                        <TextField
                          label="App Password"
                          type="password"
                          value={options.emailConfig.senderPassword}
                          onChange={(e) => setOptions(prev => ({
                            ...prev,
                            emailConfig: { ...prev.emailConfig, senderPassword: e.target.value }
                          }))}
                          fullWidth
                          required
                          helperText="Use app-specific password for Gmail"
                        />
                      </Box>
                    </Box>
                    <Box display="flex" flexWrap="wrap" gap={2}>
                      <Box flex={1} minWidth="250px">
                        <TextField
                          label="SMTP Host"
                          value={options.emailConfig.smtpHost}
                          onChange={(e) => setOptions(prev => ({
                            ...prev,
                            emailConfig: { ...prev.emailConfig, smtpHost: e.target.value }
                          }))}
                          fullWidth
                        />
                      </Box>
                      <Box flex={1} minWidth="250px">
                        <TextField
                          label="SMTP Port"
                          type="number"
                          value={options.emailConfig.smtpPort}
                          onChange={(e) => setOptions(prev => ({
                            ...prev,
                            emailConfig: { ...prev.emailConfig, smtpPort: parseInt(e.target.value) }
                          }))}
                          fullWidth
                        />
                      </Box>
                    </Box>
                    <TextField
                      label="Recipient Email"
                      type="email"
                      value={options.emailConfig.recipientEmail}
                      onChange={(e) => setOptions(prev => ({
                        ...prev,
                        emailConfig: { ...prev.emailConfig, recipientEmail: e.target.value }
                      }))}
                      fullWidth
                      required
                    />
                    <TextField
                      label="Email Subject"
                      value={options.emailConfig.subject}
                      onChange={(e) => setOptions(prev => ({
                        ...prev,
                        emailConfig: { ...prev.emailConfig, subject: e.target.value }
                      }))}
                      fullWidth
                    />
                    <TextField
                      label="Email Message"
                      value={options.emailConfig.message}
                      onChange={(e) => setOptions(prev => ({
                        ...prev,
                        emailConfig: { ...prev.emailConfig, message: e.target.value }
                      }))}
                      multiline
                      rows={4}
                      fullWidth
                    />
                  </Box>

                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>For Gmail:</strong> Use your email and an app-specific password. 
                      Go to Google Account Settings → Security → App Passwords to generate one.
                    </Typography>
                  </Alert>
                </CardContent>
              </Card>
            )}
          </Box>
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button onClick={onClose} disabled={processing}>
          Cancel
        </Button>
        
        {!processing && (
          <>
            <Button
              startIcon={<PreviewIcon />}
              onClick={generatePreview}
              disabled={!isValidTechStack() || previewLoading}
              variant="outlined"
              size="large"
            >
              {previewLoading ? 'Generating Preview...' : '🔍 Preview Changes'}
            </Button>

            <Button
              startIcon={options.sendEmail ? <SendIcon /> : <DownloadIcon />}
              onClick={processResumes}
              disabled={!isValidTechStack()}
              variant="contained"
              size="large"
              color="success"
            >
              {options.sendEmail ? '📧 Generate & Send Customized Resumes' : '⚡ Generate & Download Customized Resumes'}
            </Button>
          </>
        )}

        {processing && (
          <Button disabled variant="contained">
            Processing... {Math.round(processingProgress)}%
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
});

ProcessingModal.displayName = 'ProcessingModal';

export default ProcessingModal;
