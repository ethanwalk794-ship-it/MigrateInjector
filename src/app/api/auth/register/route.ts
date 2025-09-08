import { NextRequest, NextResponse } from 'next/server';
import jwt, { type SignOptions, type Secret } from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, firstName, lastName } = body;
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    
    // Input validation
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Password validation
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    // TODO: Add database connection and user creation
    // For now, simulate successful registration
    console.log('Registration attempt:', { email, firstName, lastName, ip });
    
    // Create mock user object
    const mockUser = {
      _id: 'mock_user_' + Date.now(),
      email,
      firstName,
      lastName,
      createdAt: new Date().toISOString()
    };

    // Generate JWT
    const JWT_SECRET: Secret = (process.env.JWT_SECRET ?? 'your-super-secret-jwt-key-here') as Secret;
    const expiresIn: SignOptions['expiresIn'] = (process.env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'];

    const token = jwt.sign(
      { _id: mockUser._id, email: mockUser.email },
      JWT_SECRET,
      { expiresIn }
    );

    return NextResponse.json({
      message: 'Signup successful (mock mode - database not connected)',
      data: {
        user: mockUser,
        token
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Signup failed', details: error.message }, { status: 500 });
  }
}
