import { NextRequest, NextResponse } from 'next/server';

// Define protected routes - all routes except login/signup require authentication
const protectedRoutes = [
  '/resume-upload',
  '/resume-processor', 
  '/email-sender',
  '/settings',
];

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/login',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
];

// Define API routes that need authentication
const protectedApiRoutes = [
  '/api/auth/me',
  '/api/auth/profile',
  '/api/resumes',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if it's an API route
  if (pathname.startsWith('/api/')) {
    return handleApiRoute(request, pathname);
  }
  
  // Check if it's a protected page route
  return handlePageRoute(request, pathname);
}

function handleApiRoute(request: NextRequest, pathname: string) {
  // Allow public API routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Check if it's a protected API route
  const isProtectedApi = protectedApiRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  if (isProtectedApi) {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
  }
  
  return NextResponse.next();
}

function handlePageRoute(request: NextRequest, pathname: string) {
  const token = request.cookies.get('token')?.value;
  
  // If accessing root and not authenticated, redirect to login
  if (pathname === '/' && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  // If accessing root and authenticated, redirect to resume upload
  if (pathname === '/' && token) {
    return NextResponse.redirect(new URL('/resume-upload', request.url));
  }
  
  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // If it's a protected route and user is not authenticated, redirect to login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Allow all other routes (let client-side handle auth pages)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     * - api routes that don't need auth
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/|api/auth/login|api/auth/register).*)',
  ],
  // Skip middleware for static files
  unstable_allowDynamic: [
    '/lib/**',
    '/src/lib/**'
  ],
};
