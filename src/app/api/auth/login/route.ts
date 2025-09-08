import { NextRequest, NextResponse } from 'next/server';
import jwt, { type SignOptions, type Secret } from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (String(password).length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    // TODO: Add database connection and user authentication
    // For now, simulate successful login
    console.log('Login attempt:', { email, ip });
    
    // Create mock user object (in production, this would come from database)
    const mockUser = {
      _id: 'mock_user_' + Date.now(),
      email,
      firstName: 'Test',
      lastName: 'User',
      lastLoginAt: new Date().toISOString(),
    };

    const JWT_SECRET: Secret = (process.env.JWT_SECRET || 'your-super-secret-jwt-key-here') as Secret;
    const signOptions: SignOptions = {
      expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'],
    };

    const payload = { _id: mockUser._id, email: mockUser.email };
    const token = jwt.sign(payload, JWT_SECRET, signOptions);

    return NextResponse.json(
      {
        message: 'Login successful (mock mode - database not connected)',
        data: {
          user: mockUser,
          token,
          expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed. Please try again later.', details: error.message },
      { status: 500 }
    );
  }
}