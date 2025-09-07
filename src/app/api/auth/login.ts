import { NextApiRequest, NextApiResponse } from 'next';
import User from '@/lib/db/models/user';
import { Logger } from '@/lib/utils/logger';
import geoip from 'geoip-lite';
import connectDB from '@/lib/db/connection';
import jwt from 'jsonwebtoken';
import type { SignOptions, Secret } from 'jsonwebtoken';

// Helper function to safely call Mongoose methods
const safeFindOne = async (model: any, query: any, options: any = {}) => {
  let queryBuilder = model.findOne(query);
  
  if (options.select) {
    queryBuilder = queryBuilder.select(options.select);
  }
  
  return queryBuilder.exec();
};

// Validate environment variables
const validateEnv = () => {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET || JWT_SECRET === 'your-super-secret-jwt-key-here') {
    throw new Error('JWT_SECRET is not properly configured');
  }
  
  // Validate JWT expiration format if provided
  const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
  if (JWT_EXPIRES_IN && !/^\d+[smhd]$/.test(JWT_EXPIRES_IN)) {
    throw new Error('JWT_EXPIRES_IN must be in format like 7d, 24h, 60m, 3600s');
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate request body
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Validate password length
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const geo = geoip.lookup(ip as string);

  try {
    // Validate environment variables before proceeding
    validateEnv();

    // Connect to database first
    await connectDB();

    // Use safe findOne approach
    const user = await safeFindOne(User, { email }, { select: '+password' });
    
    // Use consistent timing for login attempts to prevent timing attacks
    const startTime = Date.now();
    
    if (!user || !(await user.comparePassword(password))) {
      // Add artificial delay to prevent timing attacks
      const elapsed = Date.now() - startTime;
      const minDelay = 500; // 500ms minimum delay
      if (elapsed < minDelay) {
        await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
      }
      
      Logger.getInstance().warn('Failed login attempt', { email, ip, geo });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    user.lastLoginAt = new Date();
    user.lastLoginIp = ip;
    await user.save();

    Logger.getInstance().info('User logged in', { 
      email, 
      ip, 
      geo,
      userId: user._id 
    });

    // Generate JWT with secure settings
    const JWT_SECRET = process.env.JWT_SECRET as Secret;
    const signOptions: SignOptions = {
      // Cast to the union type expected by jsonwebtoken (number | StringValue)
      expiresIn: ((process.env.JWT_EXPIRES_IN || '7d') as unknown) as SignOptions['expiresIn'],
      issuer: 'resume-customizer-pro',
      audience: 'resume-customizer-pro-web',
    };

    const payload = {
      _id: user._id.toString(),
      email: user.email,
    };

    const token = jwt.sign(payload, JWT_SECRET, signOptions);

    // Set secure HTTP-only cookie for token (optional)
    res.setHeader('Set-Cookie', [
      `token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`,
      `user=${encodeURIComponent(JSON.stringify({
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }))}; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`
    ]);

    // Return user and token in a 'data' object for frontend compatibility
    return res.status(200).json({
      message: 'Login successful',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          lastLoginAt: user.lastLoginAt
        },
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    });
  } catch (error) {
    Logger.getInstance().error('Login error', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      ip, 
      geo,
      email 
    });
    
    if (error instanceof Error && error.message.includes('JWT_SECRET')) {
      return res.status(500).json({ error: 'Server configuration error. Please contact support.' });
    }
    
    return res.status(500).json({ error: 'Login failed. Please try again later.' });
  }
}