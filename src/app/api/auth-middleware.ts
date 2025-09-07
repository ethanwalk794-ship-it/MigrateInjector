import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import geoip from 'geoip-lite';
import { Logger } from '@/lib/utils/logger';

export async function middleware(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.ip || '';
  const geo = geoip.lookup(ip);
  const isVPN = checkVPN(ip);

  if (isVPN) {
    Logger.getInstance().warn('VPN login attempt blocked', { ip, geo });
    return NextResponse.json({ error: 'VPN usage is not allowed.' }, { status: 403 });
  }

  Logger.getInstance().info('Login attempt', { ip, geo });
  return NextResponse.next();
}

function checkVPN(ip: string): boolean {
  // Simple stub, replace with real VPN detection logic or API
  return false;
}
