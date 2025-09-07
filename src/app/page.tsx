'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  IconButton,
} from '@mui/material';
import {
  RocketLaunch as RocketIcon,
  ArrowRight as ArrowIcon,
  CheckCircle as CheckIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (mounted && !loading) {
      if (user) {
        router.replace('/resume-upload');
      } else {
        router.replace('/auth/login');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, mounted]);

  return <LoadingSpinner />;
}
