'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is authenticated, redirect to resume upload
        router.replace('/resume-upload');
      } else {
        // User is not authenticated, redirect to login
        router.replace('/auth/login');
      }
    }
  }, [user, loading, router]);

  // Show loading state while determining auth status
  return <LoadingSpinner message="Loading Resume Customizer Pro..." fullScreen />;
}
