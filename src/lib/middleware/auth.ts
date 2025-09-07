'use client';

import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db/connection';
import User from '@/lib/db/models/user';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthenticatedUser {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    isEmailVerified: boolean;
}

export async function getCurrentUser(request: NextRequest): Promise<AuthenticatedUser | null> {
    try {
        // Get token from Authorization header
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }

        const token = authHeader.substring(7);

        // Verify JWT token
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (!decoded || !decoded.userId) {
            return null;
        }

        // Connect to database
        await connectDB();

        // Find user
        const user = await (User as any)
            .findById(decoded.userId)
            .select('-password')
            .exec();
        if (!user || !user.isActive) {
            return null;
        }

        return {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive,
            isEmailVerified: user.isEmailVerified,
        };

    } catch (error) {
        console.error('Auth middleware error:', error);
        return null;
    }
}

export function generateToken(userId: string): string {
    const secret = JWT_SECRET as jwt.Secret;
    let expiresIn: jwt.SignOptions['expiresIn'] = '7d';
    if (process.env.JWT_EXPIRES_IN) {
        expiresIn = process.env.JWT_EXPIRES_IN as unknown as jwt.SignOptions['expiresIn'];
    }
    const options: jwt.SignOptions = { expiresIn };
    return jwt.sign({ userId }, secret, options);
}

export function verifyToken(token: string): any {
    try {
        const secret = JWT_SECRET as jwt.Secret;
        return jwt.verify(token, secret);
    } catch (error) {
        return null;
    }
}

export function requireAuth(handler: Function) {
    return async (request: NextRequest, ...args: any[]) => {
        const user = await getCurrentUser(request);
        if (!user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Add user to request object
        (request as any).user = user;
        return handler(request, ...args);
    };
}

export function requireRole(roles: string[]) {
    return function (handler: Function) {
        return async (request: NextRequest, ...args: any[]) => {
            const user = await getCurrentUser(request);
            if (!user) {
                return new Response(
                    JSON.stringify({ error: 'Unauthorized' }),
                    {
                        status: 401,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }

            if (!roles.includes(user.role)) {
                return new Response(
                    JSON.stringify({ error: 'Forbidden' }),
                    {
                        status: 403,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }

            (request as any).user = user;
            return handler(request, ...args);
        };
    };
}
