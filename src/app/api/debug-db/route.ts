import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Check if DATABASE_URL is set (show partial for security)
    const dbUrl = process.env.DATABASE_URL || 'NOT SET';
    const maskedUrl = dbUrl === 'NOT SET' 
      ? 'NOT SET' 
      : dbUrl.replace(/:[^:@]+@/, ':****@').substring(0, 80) + '...';

    // Try to connect
    let connectionStatus = 'unknown';
    let userCount = 0;
    
    try {
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      connectionStatus = 'connected';
      
      // Count users
      userCount = await prisma.user.count();
    } catch (dbError) {
      connectionStatus = `failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`;
    }

    return NextResponse.json({
      status: 'ok',
      environment: process.env.NODE_ENV,
      database: {
        url_set: dbUrl !== 'NOT SET',
        url_preview: maskedUrl,
        connection: connectionStatus,
        user_count: userCount,
      },
      nextauth: {
        url: process.env.NEXTAUTH_URL || 'NOT SET',
        secret_set: !!process.env.NEXTAUTH_SECRET,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      database_url_set: !!process.env.DATABASE_URL,
    }, { status: 500 });
  }
}

