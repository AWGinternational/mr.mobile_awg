import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Simple query to keep database connection warm
    // This prevents Supabase free tier from pausing after 1 hour of inactivity
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({ 
      status: 'warm', 
      timestamp: new Date().toISOString(),
      message: 'Database connection active'
    });
  } catch (error) {
    console.error('Keep-warm error:', error);
    return NextResponse.json({ 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
