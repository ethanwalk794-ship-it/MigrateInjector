'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent,
  CardActions,
  Chip,
  Stack,
  Paper,
  Divider
} from '@mui/material';
import {
  Description as ResumeIcon,
  Send as EmailIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  CloudUpload as UploadIcon,
  Analytics as AnalyticsIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/hooks/use-auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const features = [
  {
    icon: <ResumeIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
    title: 'Resume Upload & Parsing',
    description: 'Upload DOCX resumes and extract project/tech stack information automatically.',
    color: 'primary'
  },
  {
    icon: <SpeedIcon sx={{ fontSize: 40, color: 'success.main' }} />,
    title: 'Bulk Processing',
    description: 'Process and send multiple resumes in parallel for maximum speed and efficiency.',
    color: 'success'
  },
  {
    icon: <EmailIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
    title: 'Automated Email Sending',
    description: 'Send customized resumes via email with SMTP configuration and templates.',
    color: 'warning'
  },
  {
    icon: <SecurityIcon sx={{ fontSize: 40, color: 'error.main' }} />,
    title: 'Secure & Private',
    description: 'No credential storage, app password support, and comprehensive input validation.',
    color: 'error'
  }
];

const stats = [
  { label: 'Resumes Processed', value: '10,000+', icon: <ResumeIcon /> },
  { label: 'Processing Speed', value: '8x Faster', icon: <SpeedIcon /> },
  { label: 'Success Rate', value: '99.9%', icon: <CheckIcon /> },
  { label: 'Active Users', value: '500+', icon: <AnalyticsIcon /> }
];

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) {
    return <LoadingSpinner />;
  }

  const handleGetStarted = () => {
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/auth/login');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 8,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Typography
              variant="h2"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 700,
                textAlign: 'center',
                mb: 2,
                background: 'linear-gradient(45deg, #fff 30%, #f0f0f0 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Resume Customizer Pro
            </Typography>
            <Typography
              variant="h5"
              component="p"
              sx={{
                textAlign: 'center',
                mb: 4,
                opacity: 0.9,
                maxWidth: '600px',
                mx: 'auto'
              }}
            >
              A high-performance resume customization platform for bulk processing, 
              tech stack injection, and automated email sending.
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="center"
              sx={{ mb: 6 }}
            >
              <Button
                variant="contained"
                size="large"
                onClick={handleGetStarted}
                startIcon={<UploadIcon />}
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    bgcolor: 'grey.100',
                    transform: 'translateY(-2px)',
                    boxShadow: 4
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Get Started
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Learn More
              </Button>
            </Stack>
          </motion.div>
        </Container>
      </Box>

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={4}>
          {stats.map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    borderRadius: 2,
                    '&:hover': {
                      elevation: 4,
                      transform: 'translateY(-4px)',
                      transition: 'all 0.3s ease'
                    }
                  }}
                >
                  <Box sx={{ color: 'primary.main', mb: 1 }}>
                    {stat.icon}
                  </Box>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 700, mb: 1 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Features Section */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            component="h2"
            textAlign="center"
            gutterBottom
            sx={{ fontWeight: 700, mb: 6 }}
          >
            Key Features
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} key={index}>
                <motion.div
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      p: 3,
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                        transition: 'all 0.3s ease'
                      }
                    }}
                  >
                    <CardContent>
                      <Box sx={{ mb: 2 }}>
                        {feature.icon}
                      </Box>
                      <Typography
                        variant="h5"
                        component="h3"
                        gutterBottom
                        sx={{ fontWeight: 600 }}
                      >
                        {feature.title}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ py: 8, bgcolor: 'primary.main', color: 'white' }}>
        <Container maxWidth="md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Typography
              variant="h3"
              component="h2"
              textAlign="center"
              gutterBottom
              sx={{ fontWeight: 700, mb: 2 }}
            >
              Ready to Transform Your Resume Process?
            </Typography>
            <Typography
              variant="h6"
              textAlign="center"
              sx={{ mb: 4, opacity: 0.9 }}
            >
              Join thousands of professionals who have streamlined their resume customization workflow.
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="center"
            >
              <Button
                variant="contained"
                size="large"
                onClick={handleGetStarted}
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    bgcolor: 'grey.100',
                    transform: 'translateY(-2px)',
                    boxShadow: 4
                  }
                }}
              >
                Start Free Trial
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                View Pricing
              </Button>
            </Stack>
          </motion.div>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: 'grey.900', color: 'white', py: 4 }}>
        <Container maxWidth="lg">
          <Typography variant="body2" textAlign="center" sx={{ opacity: 0.7 }}>
            © 2024 Resume Customizer Pro. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
