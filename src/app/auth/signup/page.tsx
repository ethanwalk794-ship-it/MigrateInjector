'use client';

import { useState } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  Box,
} from '@mui/material';
import { Email as EmailIcon, Lock as LockIcon } from '@mui/icons-material';
import { useAuth } from '../../../lib/hooks/use-auth';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const result = await register(form);
      if (result) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000); // Redirect after 2 seconds
      } else {
        setError('Signup failed');
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container maxWidth='xs'>
        <Card sx={{ p: 3, borderRadius: 4, boxShadow: 6, background: '#fff' }}>
          <CardContent>
            <Typography
              variant='h5'
              align='center'
              fontWeight={700}
              gutterBottom
            >
              Sign Up
            </Typography>
            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                {error && <Alert severity='error'>{error}</Alert>}
                {success && (
                  <Alert severity='success'>
                    Signup successful! Redirecting to login...
                  </Alert>
                )}
                <TextField
                  label='First Name'
                  name='firstName'
                  value={form.firstName}
                  onChange={handleChange}
                  required
                  fullWidth
                />
                <TextField
                  label='Last Name'
                  name='lastName'
                  value={form.lastName}
                  onChange={handleChange}
                  required
                  fullWidth
                />
                <TextField
                  label='Email'
                  name='email'
                  type='email'
                  value={form.email}
                  onChange={handleChange}
                  required
                  fullWidth
                  InputProps={{ startAdornment: <EmailIcon /> }}
                />
                <TextField
                  label='Password'
                  name='password'
                  type='password'
                  value={form.password}
                  onChange={handleChange}
                  required
                  fullWidth
                  InputProps={{ startAdornment: <LockIcon /> }}
                  helperText='Password must be at least 8 characters'
                />
                <Button
                  type='submit'
                  variant='contained'
                  color='primary'
                  fullWidth
                  size='large'
                  sx={{ fontWeight: 600, borderRadius: 2, py: 1.5 }}
                  disabled={loading}
                >
                  {loading ? 'Signing up...' : 'Sign Up'}
                </Button>
              </Stack>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
