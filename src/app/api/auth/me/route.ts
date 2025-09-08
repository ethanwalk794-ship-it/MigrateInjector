import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Mock user data - in production, this would come from a database
const mockUser = {
  _id: 'user_123',
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  company: 'Tech Corp',
  jobTitle: 'Software Engineer',
  phone: '+1234567890',
  role: 'user',
  isActive: true,
  isEmailVerified: true,
  preferences: {
    theme: 'light' as const,
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    language: 'en',
  },
  subscription: {
    plan: 'pro' as const,
    status: 'active' as const,
    expiresAt: '2024-12-31T23:59:59.000Z',
    features: ['bulk_processing', 'email_sending', 'advanced_preview'],
  },
  usage: {
    resumesProcessed: 15,
    emailsSent: 8,
    storageUsed: 2048576, // 2MB in bytes
    lastResetAt: '2024-01-01T00:00:00.000Z',
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-15T10:30:00.000Z',
};

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // In production, you would validate the JWT token here
    // For now, we'll accept any token that looks like a valid format
    if (!token || token.length < 10) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 401 }
      );
    }

    // In production, decode the JWT and fetch user from database
    // For now, return mock user data
    return NextResponse.json({
      success: true,
      data: mockUser
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      { error: 'Failed to get user profile' },
      { status: 500 }
    );
  }
}
