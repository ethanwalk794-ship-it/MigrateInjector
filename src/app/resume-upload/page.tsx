'use client';

import React, { useState, useCallback } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Navigation from '@/components/layout/Navigation';
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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Description as FileIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  SmartToy as ProcessIcon,
  AutoAwesome as ProcessAllIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/hooks/use-auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'react-hot-toast';
import ProcessingModal from '@/components/ProcessingModal';

interface UploadedFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  resumeId?: string;
}

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ResumeUploadPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [processingModalOpen, setProcessingModalOpen] = useState(false);
  const [processingMode, setProcessingMode] = useState<'single' | 'bulk'>('single');
  const [selectedFileId, setSelectedFileId] = useState<string>();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/'); // Redirect to login if not authenticated
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div />; // Or a spinner if you want
  }

  // Use a ref counter for unique IDs to avoid SSR/client mismatch
  const idCounter = React.useRef(0);
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => {
      idCounter.current += 1;
      return {
        id: `file_${idCounter.current}`,
        file,
        status: 'pending',
        progress: 0,
      };
    });
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        ['.docx'],
      'application/msword': ['.doc'],
    },
    maxFiles: 10,
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  });

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const uploadFile = async (uploadedFile: UploadedFile) => {
    const formData = new FormData();
    formData.append('file', uploadedFile.file);
    formData.append('title', uploadedFile.file.name.replace(/\.[^/.]+$/, ''));

    try {
      setFiles(prev =>
        prev.map(f =>
          f.id === uploadedFile.id
            ? { ...f, status: 'uploading', progress: 0 }
            : f
        )
      );

      const response = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setFiles(prev =>
          prev.map(f =>
            f.id === uploadedFile.id
              ? {
                  ...f,
                  status: 'success',
                  progress: 100,
                  resumeId: data.data.resume._id,
                }
              : f
          )
        );
        toast.success(`${uploadedFile.file.name} uploaded successfully!`);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setFiles(prev =>
        prev.map(f =>
          f.id === uploadedFile.id
            ? {
                ...f,
                status: 'error',
                error: error instanceof Error ? error.message : 'Upload failed',
              }
            : f
        )
      );
      toast.error(`Failed to upload ${uploadedFile.file.name}`);
    }
  };

  const uploadAllFiles = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setUploading(true);

    try {
      await Promise.all(pendingFiles.map(uploadFile));
    } finally {
      setUploading(false);
    }
  };

  const clearAllFiles = () => {
    setFiles([]);
  };

  const openProcessingModal = (mode: 'single' | 'bulk', fileId?: string) => {
    const successfulFiles = files.filter(f => f.status === 'success');
    if (successfulFiles.length === 0) {
      toast.error('Please upload files successfully before processing');
      return;
    }
    
    setProcessingMode(mode);
    setSelectedFileId(fileId);
    setProcessingModalOpen(true);
  };

  const closeProcessingModal = () => {
    setProcessingModalOpen(false);
    setSelectedFileId(undefined);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon color='success' />;
      case 'error':
        return <ErrorIcon color='error' />;
      case 'uploading':
        return <UploadIcon color='primary' />;
      default:
        return <FileIcon color='action' />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'uploading':
        return 'primary';
      default:
        return 'default';
    }
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const successCount = files.filter(f => f.status === 'success').length;
  const errorCount = files.filter(f => f.status === 'error').length;
  const canProcessIndividual = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    return file?.status === 'success';
  };
  const canProcessAll = successCount > 0;

  return (
    <ProtectedRoute>
      <Navigation />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth='lg'>
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography
            variant='h4'
            component='h1'
            gutterBottom
            sx={{ fontWeight: 700 }}
          >
            Upload Resumes
          </Typography>
          <Typography
            variant='body1'
            color='text.secondary'
            sx={{ maxWidth: 600, mx: 'auto' }}
          >
            Upload your resume files to get started with customization and
            processing. We support DOCX and DOC formats up to 10MB each.
          </Typography>
        </Box>

        {/* Upload Stats */}
        {files.length > 0 && (
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant='h6' gutterBottom sx={{ fontWeight: 600 }}>
              Upload Progress
            </Typography>
            <Stack direction='row' spacing={2} flexWrap='wrap'>
              <Chip
                label={`${files.length} Total`}
                color='default'
                variant='outlined'
              />
              <Chip
                label={`${pendingCount} Pending`}
                color='warning'
                variant='outlined'
              />
              <Chip
                label={`${successCount} Success`}
                color='success'
                variant='outlined'
              />
              {errorCount > 0 && (
                <Chip
                  label={`${errorCount} Error`}
                  color='error'
                  variant='outlined'
                />
              )}
            </Stack>
          </Paper>
        )}

        {/* Drop Zone */}
        <Paper
          {...getRootProps()}
          sx={{
            p: 6,
            textAlign: 'center',
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'grey.300',
            bgcolor: isDragActive ? 'primary.50' : 'background.paper',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            mb: 4,
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'primary.50',
            },
          }}
        >
          <input {...getInputProps()} />
          <CloudUploadIcon
            sx={{ fontSize: 64, color: 'primary.main', mb: 2 }}
          />
          <Typography variant='h6' gutterBottom sx={{ fontWeight: 600 }}>
            {isDragActive ? 'Drop files here' : 'Drag & drop resume files here'}
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
            or click to browse files
          </Typography>
          <Button variant='contained' startIcon={<UploadIcon />}>
            Choose Files
          </Button>
          <Typography
            variant='caption'
            display='block'
            sx={{ mt: 2, color: 'text.secondary' }}
          >
            Supports DOCX and DOC files up to 10MB each
          </Typography>
        </Paper>

        {/* File List */}
        {files.length > 0 && (
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
                Files ({files.length})
              </Typography>
              <Stack direction='row' spacing={1}>
                <Button
                  variant='outlined'
                  onClick={uploadAllFiles}
                  disabled={pendingCount === 0 || uploading}
                  startIcon={<UploadIcon />}
                >
                  Upload All ({pendingCount})
                </Button>
                {successCount > 0 && (
                  <Button
                    variant='contained'
                    onClick={() => openProcessingModal('bulk')}
                    disabled={uploading}
                    startIcon={<ProcessAllIcon />}
                    color='secondary'
                  >
                    Process All ({successCount})
                  </Button>
                )}
                <Button
                  variant='text'
                  onClick={clearAllFiles}
                  color='error'
                  startIcon={<DeleteIcon />}
                >
                  Clear All
                </Button>
              </Stack>
            </Box>

            <List>
              {files.map((uploadedFile, index) => (
                <motion.div
                  key={uploadedFile.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card sx={{ mb: 2 }}>
                    <CardContent>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                      >
                        <Box sx={{ flexGrow: 1 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mb: 1,
                            }}
                          >
                            {getStatusIcon(uploadedFile.status)}
                            <Typography
                              variant='subtitle1'
                              sx={{ fontWeight: 600 }}
                            >
                              {uploadedFile.file.name}
                            </Typography>
                            <Chip
                              label={uploadedFile.status}
                              color={getStatusColor(uploadedFile.status) as any}
                              size='small'
                            />
                          </Box>

                          <Typography
                            variant='body2'
                            color='text.secondary'
                            sx={{ mb: 1 }}
                          >
                            {(uploadedFile.file.size / 1024 / 1024).toFixed(2)}{' '}
                            MB
                          </Typography>

                          {uploadedFile.status === 'uploading' && (
                            <Box sx={{ width: '100%' }}>
                              <LinearProgress
                                variant='determinate'
                                value={uploadedFile.progress}
                              />
                              <Typography
                                variant='caption'
                                color='text.secondary'
                              >
                                {uploadedFile.progress}% uploaded
                              </Typography>
                            </Box>
                          )}

                          {uploadedFile.status === 'error' &&
                            uploadedFile.error && (
                              <Alert severity='error' sx={{ mt: 1 }}>
                                {uploadedFile.error}
                              </Alert>
                            )}

                          {uploadedFile.status === 'success' && (
                            <Alert severity='success' sx={{ mt: 1 }}>
                              Upload completed successfully!
                            </Alert>
                          )}
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {uploadedFile.status === 'pending' && (
                            <Button
                              size='small'
                              variant='contained'
                              onClick={() => uploadFile(uploadedFile)}
                              disabled={uploading}
                            >
                              Upload
                            </Button>
                          )}
                          {uploadedFile.status === 'success' && (
                            <Button
                              size='small'
                              variant='contained'
                              color='secondary'
                              onClick={() => openProcessingModal('single', uploadedFile.id)}
                              startIcon={<ProcessIcon />}
                              disabled={uploading}
                            >
                              Process
                            </Button>
                          )}
                          <Button
                            size='small'
                            color='error'
                            onClick={() => removeFile(uploadedFile.id)}
                            disabled={uploadedFile.status === 'uploading'}
                          >
                            <DeleteIcon />
                          </Button>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </List>
          </Paper>
        )}

        {/* Processing Instructions */}
        {successCount > 0 && (
          <Paper sx={{ p: 3, mb: 4, bgcolor: 'secondary.50', border: 1, borderColor: 'secondary.200' }}>
            <Typography variant='h6' gutterBottom sx={{ fontWeight: 600, color: 'secondary.main' }}>
              🚀 Ready for Processing!
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
              Your files are uploaded and ready for tech stack integration. Choose your processing option:
            </Typography>
            <Box display='flex' gap={2} flexWrap='wrap'>
              <Button
                variant='contained'
                color='secondary'
                startIcon={<ProcessAllIcon />}
                onClick={() => openProcessingModal('bulk')}
                disabled={uploading}
              >
                Process All Files ({successCount})
              </Button>
              <Button
                variant='outlined'
                color='secondary'
                startIcon={<ProcessIcon />}
                disabled
              >
                Or click "Process" on individual files
              </Button>
            </Box>
          </Paper>
        )}

        {/* Instructions */}
        <Paper sx={{ p: 3 }}>
          <Typography variant='h6' gutterBottom sx={{ fontWeight: 600 }}>
            Upload Instructions
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color='success' fontSize='small' />
              </ListItemIcon>
              <ListItemText
                primary='Supported formats: DOCX and DOC files'
                secondary='Microsoft Word documents are fully supported'
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color='success' fontSize='small' />
              </ListItemIcon>
              <ListItemText
                primary='File size limit: 10MB per file'
                secondary='Large files may take longer to process'
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color='success' fontSize='small' />
              </ListItemIcon>
              <ListItemText
                primary='Multiple files: Upload up to 10 files at once'
                secondary='Batch processing is available for efficiency'
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color='success' fontSize='small' />
              </ListItemIcon>
              <ListItemText
                primary='Processing: Customize resumes with your tech stack'
                secondary="Click 'Process' to add your technical skills to relevant projects"
              />
            </ListItem>
          </List>
        </Paper>

        {/* Processing Modal */}
        <ProcessingModal
          open={processingModalOpen}
          onClose={closeProcessingModal}
          files={files}
          processingMode={processingMode}
          selectedFileId={selectedFileId}
        />
      </Container>
      </Box>
    </ProtectedRoute>
  );
}
