'use client';

import { NextApiRequest, NextApiResponse } from 'next';
import User from '@/lib/db/models/user';
import { Logger } from '@/lib/utils/logger';
import geoip from 'geoip-lite';
import connectDB from '@/lib/db/connection';

// Helper function to safely call Mongoose methods
const safeFindOne = async (model: any, query: any) => {
  return model.findOne(query).exec();
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, firstName, lastName } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const geo = geoip.lookup(ip as string);

  try {
    // Connect to database first
    await connectDB();

    // Use safe findOne approach
    const existingUser = await safeFindOne(User, { email });
    
    if (existingUser) {
      Logger.getInstance().warn('Signup attempt with existing email', { email, ip, geo });
      return res.status(409).json({ error: 'Email already exists' });
    }
    
    const user = new User({ email, password, firstName, lastName });
    await user.save();
    
    Logger.getInstance().info('User signed up', { email, ip, geo });
    
    // TODO: Generate JWT and return
    return res.status(201).json({ 
      message: 'Signup successful', 
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    Logger.getInstance().error('Signup error', { error, ip, geo });
    return res.status(500).json({ error: 'Signup failed' });
  }
}