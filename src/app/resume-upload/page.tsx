'use client';

import { useState, useCallback } from 'react';
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
  Divider
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Description as FileIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/hooks/use-auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'react-hot-toast';

interface UploadedFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  resumeId?: string;
}

export default function ResumeUploadPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'pending',
      progress: 0
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc']
    },
    maxFiles: 10,
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  });

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const uploadFile = async (uploadedFile: UploadedFile) => {
    const formData = new FormData();
    formData.append('file', uploadedFile.file);
    formData.append('title', uploadedFile.file.name.replace(/\.[^/.]+$/, ''));

    try {
      setFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      ));

      const response = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setFiles(prev => prev.map(f => 
          f.id === uploadedFile.id 
            ? { 
                ...f, 
                status: 'success', 
                progress: 100, 
                resumeId: data.data.resume._id 
              }
            : f
        ));
        toast.success(`${uploadedFile.file.name} uploaded successfully!`);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { 
              ...f, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Upload failed' 
            }
          : f
      ));
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircleIcon color="success" />;
      case 'error': return <ErrorIcon color="error" />;
      case 'uploading': return <UploadIcon color="primary" />;
      default: return <FileIcon color="action" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'uploading': return 'primary';
      default: return 'default';
    }
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const successCount = files.filter(f => f.status === 'success').length;
  const errorCount = files.filter(f => f.status === 'error').length;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Upload Resumes
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Upload your resume files to get started with customization and processing. 
            We support DOCX and DOC formats up to 10MB each.
          </Typography>
        </Box>

        {/* Upload Stats */}
        {files.length > 0 && (
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Upload Progress
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Chip 
                label={`${files.length} Total`} 
                color="default" 
                variant="outlined" 
              />
              <Chip 
                label={`${pendingCount} Pending`} 
                color="warning" 
                variant="outlined" 
              />
              <Chip 
                label={`${successCount} Success`} 
                color="success" 
                variant="outlined" 
              />
              {errorCount > 0 && (
                <Chip 
                  label={`${errorCount} Error`} 
                  color="error" 
                  variant="outlined" 
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
              bgcolor: 'primary.50'
            }
          }}
        >
          <input {...getInputProps()} />
          <CloudUploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            {isDragActive ? 'Drop files here' : 'Drag & drop resume files here'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            or click to browse files
          </Typography>
          <Button variant="contained" startIcon={<UploadIcon />}>
            Choose Files
          </Button>
          <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
            Supports DOCX and DOC files up to 10MB each
          </Typography>
        </Paper>

        {/* File List */}
        {files.length > 0 && (
          <Paper sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Files ({files.length})
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  onClick={uploadAllFiles}
                  disabled={pendingCount === 0 || uploading}
                  startIcon={<UploadIcon />}
                >
                  Upload All ({pendingCount})
                </Button>
                <Button
                  variant="text"
                  onClick={clearAllFiles}
                  color="error"
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            {getStatusIcon(uploadedFile.status)}
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {uploadedFile.file.name}
                            </Typography>
                            <Chip
                              label={uploadedFile.status}
                              color={getStatusColor(uploadedFile.status) as any}
                              size="small"
                            />
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                          </Typography>

                          {uploadedFile.status === 'uploading' && (
                            <Box sx={{ width: '100%' }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={uploadedFile.progress} 
                              />
                              <Typography variant="caption" color="text.secondary">
                                {uploadedFile.progress}% uploaded
                              </Typography>
                            </Box>
                          )}

                          {uploadedFile.status === 'error' && uploadedFile.error && (
                            <Alert severity="error" sx={{ mt: 1 }}>
                              {uploadedFile.error}
                            </Alert>
                          )}

                          {uploadedFile.status === 'success' && (
                            <Alert severity="success" sx={{ mt: 1 }}>
                              Upload completed successfully!
                            </Alert>
                          )}
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {uploadedFile.status === 'pending' && (
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => uploadFile(uploadedFile)}
                              disabled={uploading}
                            >
                              Upload
                            </Button>
                          )}
                          <Button
                            size="small"
                            color="error"
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

        {/* Instructions */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Upload Instructions
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Supported formats: DOCX and DOC files"
                secondary="Microsoft Word documents are fully supported"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="File size limit: 10MB per file"
                secondary="Large files may take longer to process"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Multiple files: Upload up to 10 files at once"
                secondary="Batch processing is available for efficiency"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Processing: Files are processed automatically"
                secondary="You'll receive notifications when processing is complete"
              />
            </ListItem>
          </List>
        </Paper>
      </Container>
    </Box>
  );
}
