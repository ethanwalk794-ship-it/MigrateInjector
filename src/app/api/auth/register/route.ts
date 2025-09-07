import { NextRequest, NextResponse } from 'next/server';
import User from '@/lib/db/models/user';
import { Logger } from '@/lib/utils/logger';
import geoip from 'geoip-lite';
import connectDB from '@/lib/db/connection';
import jwt, { type SignOptions, type Secret } from 'jsonwebtoken';

// Helper function to safely call Mongoose methods
const safeFindOne = async (model: any, query: any) => {
  return model.findOne(query).exec();
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, firstName, lastName } = body;
    const ip = req.headers.get('x-forwarded-for') || '';
    const geo = geoip.lookup(ip as string);

    await connectDB();
    const existingUser = await safeFindOne(User, { email });
    if (existingUser) {
      Logger.getInstance().warn('Signup attempt with existing email', { email, ip, geo });
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    const user = new User({ email, password, firstName, lastName });
    await user.save();
    Logger.getInstance().info('User signed up', { email, ip, geo });

    // Generate JWT
    const JWT_SECRET: Secret = (process.env.JWT_SECRET ?? 'your-super-secret-jwt-key-here') as Secret;
    const expiresIn: SignOptions['expiresIn'] = (process.env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'];

    const token = jwt.sign(
      { _id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn }
    );

    return NextResponse.json({
      message: 'Signup successful',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          createdAt: user.createdAt
        },
        token
      }
    }, { status: 201 });
  } catch (error: any) {
    Logger.getInstance().error('Signup error', { error });
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 });
  }
}
