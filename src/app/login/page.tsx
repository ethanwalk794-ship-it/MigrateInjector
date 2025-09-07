'use client';

import { useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Button, 
  TextField,
  Alert,
  Stack,
  Link,
  Divider,
  IconButton,
  InputAdornment,
  Card,
  CardContent
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/hooks/use-auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface LoginForm {
  email: string;
  password: string;
}

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  company: string;
  jobTitle: string;
}

export default function LoginPage() {
  const { login, register } = useAuth();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginForm, setLoginForm] = useState<LoginForm>({
    email: '',
    password: ''
  });
  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    jobTitle: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateLoginForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!loginForm.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(loginForm.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!loginForm.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegisterForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!registerForm.firstName) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!registerForm.lastName) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!registerForm.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(registerForm.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!registerForm.password) {
      newErrors.password = 'Password is required';
    } else if (registerForm.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (registerForm.password !== registerForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!registerForm.company) {
      newErrors.company = 'Company is required';
    }
    
    if (!registerForm.jobTitle) {
      newErrors.jobTitle = 'Job title is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateLoginForm()) return;
    
    try {
      setLoading(true);
      await login(loginForm.email, loginForm.password);
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateRegisterForm()) return;
    
    try {
      setLoading(true);
      await register({
        firstName: registerForm.firstName,
        lastName: registerForm.lastName,
        email: registerForm.email,
        password: registerForm.password,
        company: registerForm.company,
        jobTitle: registerForm.jobTitle
      });
      toast.success('Registration successful!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setLoginForm({ email: '', password: '' });
    setRegisterForm({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      company: '',
      jobTitle: ''
    });
  };

  if (loading) {
    return <LoadingSpinner message={isLogin ? "Signing in..." : "Creating account..."} />;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card elevation={3}>
            <CardContent sx={{ p: 4 }}>
              {/* Header */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                  {isLogin ? 'Welcome Back' : 'Create Account'}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {isLogin 
                    ? 'Sign in to your Resume Customizer Pro account' 
                    : 'Get started with Resume Customizer Pro'
                  }
                </Typography>
              </Box>

              {/* Login Form */}
              {isLogin ? (
                <Box component="form" onSubmit={handleLogin}>
                  <Stack spacing={3}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                      error={!!errors.email}
                      helperText={errors.email}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                    
                    <TextField
                      fullWidth
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      value={loginForm.password}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                      error={!!errors.password}
                      helperText={errors.password}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />

                    <Box sx={{ textAlign: 'right' }}>
                      <Link href="/forgot-password" variant="body2">
                        Forgot password?
                      </Link>
                    </Box>

                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                      sx={{ py: 1.5 }}
                    >
                      Sign In
                    </Button>
                  </Stack>
                </Box>
              ) : (
                /* Register Form */
                <Box component="form" onSubmit={handleRegister}>
                  <Stack spacing={3}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <TextField
                        fullWidth
                        label="First Name"
                        value={registerForm.firstName}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, firstName: e.target.value }))}
                        error={!!errors.firstName}
                        helperText={errors.firstName}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                      <TextField
                        fullWidth
                        label="Last Name"
                        value={registerForm.lastName}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, lastName: e.target.value }))}
                        error={!!errors.lastName}
                        helperText={errors.lastName}
                      />
                    </Box>

                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                      error={!!errors.email}
                      helperText={errors.email}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />

                    <TextField
                      fullWidth
                      label="Company"
                      value={registerForm.company}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, company: e.target.value }))}
                      error={!!errors.company}
                      helperText={errors.company}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BusinessIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />

                    <TextField
                      fullWidth
                      label="Job Title"
                      value={registerForm.jobTitle}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                      error={!!errors.jobTitle}
                      helperText={errors.jobTitle}
                    />

                    <TextField
                      fullWidth
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                      error={!!errors.password}
                      helperText={errors.password}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />

                    <TextField
                      fullWidth
                      label="Confirm Password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={registerForm.confirmPassword}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      error={!!errors.confirmPassword}
                      helperText={errors.confirmPassword}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              edge="end"
                            >
                              {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                      sx={{ py: 1.5 }}
                    >
                      Create Account
                    </Button>
                  </Stack>
                </Box>
              )}

              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  OR
                </Typography>
              </Divider>

              {/* Toggle Mode */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                </Typography>
                <Button
                  variant="text"
                  onClick={handleToggleMode}
                  sx={{ mt: 1 }}
                >
                  {isLogin ? 'Create Account' : 'Sign In'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
}
