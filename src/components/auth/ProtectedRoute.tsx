'use client';

import { useEffect, useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

const ProtectedRoute = memo(function ProtectedRoute({
  children,
  requireAuth = true,
  redirectTo = '/auth/login',
  fallback
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || loading) return;

    if (requireAuth && !user) {
      setShouldRedirect(true);
      // Store the current path for redirect after login
      const currentPath = window.location.pathname + window.location.search;
      const loginUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
      router.replace(loginUrl);
    } else if (!requireAuth && user) {
      setShouldRedirect(true);
      // If user is logged in but trying to access auth pages, redirect to resume upload
      router.replace('/resume-upload');
    }
  }, [user, loading, requireAuth, redirectTo, router, mounted]);

  // Don't render anything during SSR, while loading, or while redirecting
  if (!mounted || loading || shouldRedirect) {
    const message = loading ? 'Authenticating...' : 
                   shouldRedirect ? 'Redirecting...' : 
                   'Loading...';
    
    return fallback || <LoadingSpinner message={message} fullScreen />;
  }

  // If authentication is required but user is not logged in, show loading
  if (requireAuth && !user) {
    return fallback || <LoadingSpinner message="Redirecting to login..." fullScreen />;
  }

  // If user is logged in but trying to access auth pages, show loading
  if (!requireAuth && user) {
    return fallback || <LoadingSpinner message="Redirecting to resume upload..." fullScreen />;
  }

  return <>{children}</>;
});

ProtectedRoute.displayName = 'ProtectedRoute';

export default ProtectedRoute;
